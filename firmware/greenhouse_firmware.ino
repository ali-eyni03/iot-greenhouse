/*
  ==========================================================
  Smart Greenhouse Firmware - Phase 2 (Hardware Test)
  ==========================================================

  This code:
  - Reads a DHT22 and three soil moisture sensors
  - Sends a JSON message to MQTT every 10 seconds (READ_INTERVAL_MS)
  - Receives manual irrigation commands through MQTT (subscribe)
  - Includes a simple temporary irrigation strategy (hardcoded for now, moved to backend later)

  Required libraries (install through Arduino IDE Library Manager):
  - ESP8266WiFi      (included with the ESP8266 board package)
  - PubSubClient      (by Nick O'Leary)
  - DHT sensor library (by Adafruit) + Adafruit Unified Sensor (its dependency)
  - ArduinoJson      (by Benoit Blanchon) - version 6.x or 7.x

  Arduino IDE settings for this board:
  - Board: "NodeMCU 1.0 (ESP-12E Module)"
  - Upload Speed: 115200
  - CPU Frequency: 80 MHz
  - Flash Size: 4MB (the default is usually enough)
  - Serial monitor baud rate: 115200 (must match the Serial.begin value below)
*/

#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

// Wifi and MQTT settings
const char* WIFI_SSID = "KaftarKakolBesarWIFI";
const char* WIFI_PASSWORD = "1ka38aliw4.eyni";
const char* MQTT_SERVER = "192.168.1.3";  // IP address of the computer running Mosquitto
const int MQTT_PORT = 1883;
const char* MQTT_TOPIC_PUBLISH = "plant/data";
const char* MQTT_TOPIC_SUBSCRIBE = "plant/command";
const char* NODE_NAME = "greenhouse_1";

// Hardware pins
#define DHT_PIN D4
#define DHT_TYPE DHT22

#define SOIL1_VCC_PIN D5
#define SOIL2_VCC_PIN D6
#define SOIL3_VCC_PIN D7
#define SOIL_ANALOG_PIN A0

#define RELAY1_PIN D1  // Plant 1 pump
#define RELAY2_PIN D2  // Plant 2 pump
#define RELAY3_PIN D3  // Plant 3 pump

// HIGH/LOW throughout the code, we define these constants so the meaning stays clear.
#define RELAY_ON LOW
#define RELAY_OFF HIGH

// timing
// Using a constant makes it easy to change to 60000 (one minute) later
const unsigned long READ_INTERVAL_MS = 10000;

// Temporary irrigation thresholds (simple and hardcoded for now, moved to backend later) ----------
// Note: these are raw ADC values, not percentages, because real calibration lives in the backend
const int SOIL_DRY_THRESHOLD = 600;  // If the raw value is above this, the soil is very dry
const unsigned long PUMP_ON_DURATION_MS = 5000;  // How long the pump stays on during each automatic watering cycle


DHT dht(DHT_PIN, DHT_TYPE);
WiFiClient espClient;
PubSubClient mqttClient(espClient);

unsigned long lastReadTime = 0;

// Independent pump control (when each pump should turn off, if it is on)
unsigned long pumpOffTime[3] = {0, 0, 0};
const int relayPins[3] = {RELAY1_PIN, RELAY2_PIN, RELAY3_PIN};


// Connect to Wi-Fi
void connectWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("WiFi connected, IP address: ");
  Serial.println(WiFi.localIP());
}


// Read one soil moisture sensor in the correct order:
// 1. Turn on that sensor's VCC
// 2. Wait briefly for the sensor to stabilize
// 3. Read the analog value
// 4. Turn off VCC so the next sensor can be read without interference
int readSoilSensor(int vccPin) {
  digitalWrite(vccPin, HIGH);
  delay(50);  // زمان لازم برای پایدار شدن خروجی سنسور بعد از روشن شدن
  int rawValue = analogRead(SOIL_ANALOG_PIN);
  digitalWrite(vccPin, LOW);
  return rawValue;
}


// Independent pump control - turn on for a fixed duration
void turnOnPump(int pumpIndex) {
  if (pumpIndex < 0 || pumpIndex > 2) return;
  digitalWrite(relayPins[pumpIndex], RELAY_ON);
  pumpOffTime[pumpIndex] = millis() + PUMP_ON_DURATION_MS;
  Serial.print("Pump ");
  Serial.print(pumpIndex + 1);
  Serial.println(" turned ON");
}

void turnOffPump(int pumpIndex) {
  if (pumpIndex < 0 || pumpIndex > 2) return;
  digitalWrite(relayPins[pumpIndex], RELAY_OFF);
  pumpOffTime[pumpIndex] = 0;
  Serial.print("Pump ");
  Serial.print(pumpIndex + 1);
  Serial.println(" turned OFF");
}

// This function should be called on every loop cycle so pumps whose
// runtime has expired are turned off without using a long delay
void checkPumpTimers() {
  unsigned long now = millis();
  for (int i = 0; i < 3; i++) {
    if (pumpOffTime[i] != 0 && now >= pumpOffTime[i]) {
      turnOffPump(i);
    }
  }
}


// Temporary automatic irrigation logic (simple, hardcoded)
// TODO: this logic should later move to the backend (per the phase 1 decision)
void checkAutoIrrigation(int soilRaw, int pumpIndex) {
  // If the raw value is above the threshold, the soil is dry
  // (capacitive moisture sensor raw signals usually increase as the soil gets drier)
  if (soilRaw > SOIL_DRY_THRESHOLD && pumpOffTime[pumpIndex] == 0) {
    turnOnPump(pumpIndex);
  }
}


// Build and publish a JSON message with data for all three plants
void publishSensorData(int soil1, int soil2, int soil3, float temp, float humidity) {
  StaticJsonDocument<256> doc;

  doc["node"] = NODE_NAME;

  JsonArray readings = doc.createNestedArray("readings");

  JsonObject r1 = readings.createNestedObject();
  r1["plant_id"] = 1;
  r1["soil_raw"] = soil1;

  JsonObject r2 = readings.createNestedObject();
  r2["plant_id"] = 2;
  r2["soil_raw"] = soil2;

  JsonObject r3 = readings.createNestedObject();
  r3["plant_id"] = 3;
  r3["soil_raw"] = soil3;

  doc["air_temp"] = temp;
  doc["air_humidity"] = humidity;

  char buffer[256];
  size_t len = serializeJson(doc, buffer);

  Serial.print("Publishing: ");
  Serial.println(buffer);

  mqttClient.publish(MQTT_TOPIC_PUBLISH, buffer, len);
}


// Callback - invoked when a message is received on the subscribed topic
// Temporary command message format for testing: {"plant_id": 1, "action": "irrigate"}
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message received on topic: ");
  Serial.println(topic);

  // The payload is a byte array without a null terminator, so convert it to a string
  char message[256];
  if (length >= sizeof(message)) length = sizeof(message) - 1;
  memcpy(message, payload, length);
  message[length] = '\0';

  Serial.print("Payload: ");
  Serial.println(message);

  StaticJsonDocument<128> doc;
  DeserializationError error = deserializeJson(doc, message);
  if (error) {
    Serial.print("JSON parse failed: ");
    Serial.println(error.c_str());
    return;
  }

  int plantId = doc["plant_id"];
  const char* action = doc["action"];

  if (plantId < 1 || plantId > 3) {
    Serial.println("Invalid plant_id, ignoring command");
    return;
  }

  int pumpIndex = plantId - 1;  // plant_id 1..3 -> index 0..2

  if (strcmp(action, "irrigate") == 0) {
    turnOnPump(pumpIndex);
  } else if (strcmp(action, "stop") == 0) {
    turnOffPump(pumpIndex);
  }
}


// Connect to the MQTT broker, or reconnect if needed
void connectMQTT() {
  while (!mqttClient.connected()) {
    Serial.print("Connecting to MQTT broker...");
    // clientId must be unique, so we use the node name
    if (mqttClient.connect(NODE_NAME)) {
      Serial.println("connected");
      mqttClient.subscribe(MQTT_TOPIC_SUBSCRIBE);
      Serial.print("Subscribed to: ");
      Serial.println(MQTT_TOPIC_SUBSCRIBE);
    } else {
      Serial.print("failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" retrying in 2 seconds");
      delay(2000);
    }
  }
}


// Setup
void setup() {
  Serial.begin(115200);

  pinMode(SOIL1_VCC_PIN, OUTPUT);
  pinMode(SOIL2_VCC_PIN, OUTPUT);
  pinMode(SOIL3_VCC_PIN, OUTPUT);
  digitalWrite(SOIL1_VCC_PIN, LOW);
  digitalWrite(SOIL2_VCC_PIN, LOW);
  digitalWrite(SOIL3_VCC_PIN, LOW);

  pinMode(RELAY1_PIN, OUTPUT);
  pinMode(RELAY2_PIN, OUTPUT);
  pinMode(RELAY3_PIN, OUTPUT);
  digitalWrite(RELAY1_PIN, RELAY_OFF);
  digitalWrite(RELAY2_PIN, RELAY_OFF);
  digitalWrite(RELAY3_PIN, RELAY_OFF);

  dht.begin();

  connectWiFi();

  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);
  // The default 256-byte buffer is enough for our message, but we set it explicitly
  // so there is room if more fields are added later
  mqttClient.setBufferSize(384);
}


// Loop
void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  if (!mqttClient.connected()) {
    connectMQTT();
  }
  mqttClient.loop();  // Must be called every cycle so incoming messages are processed

  checkPumpTimers();  // Turn off pumps whose time has expired

  unsigned long now = millis();
  if (now - lastReadTime >= READ_INTERVAL_MS) {
    lastReadTime = now;

    int soil1 = readSoilSensor(SOIL1_VCC_PIN);
    int soil2 = readSoilSensor(SOIL2_VCC_PIN);
    int soil3 = readSoilSensor(SOIL3_VCC_PIN);

    float temp = dht.readTemperature();
    float humidity = dht.readHumidity();

    if (isnan(temp) || isnan(humidity)) {
      Serial.println("Failed to read from DHT22 sensor!");
    } else {
      publishSensorData(soil1, soil2, soil3, temp, humidity);
    }

    // Temporary automatic irrigation logic for all three plants
    checkAutoIrrigation(soil1, 0);
    checkAutoIrrigation(soil2, 1);
    checkAutoIrrigation(soil3, 2);
  }
}