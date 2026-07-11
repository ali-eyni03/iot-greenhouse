import json
import aiomqtt

MQTT_BROKER_HOST = "mqtt5"


async def publish_irrigate_command(plant_id: int, duration_seconds: int | None = None):
    """
    Publishes an irrigation command message to the 'plant/command' topic.
    """
    payload = {"plant_id": plant_id, "action": "irrigate"}
    if duration_seconds is not None:
        payload["duration_seconds"] = duration_seconds

    async with aiomqtt.Client(MQTT_BROKER_HOST) as client:
        await client.publish("plant/command", payload=json.dumps(payload))
