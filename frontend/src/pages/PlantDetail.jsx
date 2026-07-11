import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePlants } from '../context/PlantsContext';
import { useSensorHistory } from '../hooks/useSensorHistory';
import { useWebSocket } from '../hooks/useWebSocket';
import { fetchIrrigationHistory, fetchAnomalyHistory } from '../utils/api';
import { MoistureLevel } from '../components/MoistureLevel';
import { MoistureChart } from '../components/MoistureChart';
import { ClimateChart } from '../components/ClimateChart';
import { IrrigationHistory } from '../components/IrrigationHistory';
import { AnomalyHistory } from '../components/AnomalyHistory';
import { ThresholdSettings } from '../components/ThresholdSettings';
import { getPlantStatus } from '../utils/plantStatus';

export function PlantDetail() {
  const { plantId } = useParams();
  const navigate = useNavigate();
  const { plants, updatePlant } = usePlants();
  const [irrigationLogs, setIrrigationLogs] = useState([]);
  const [anomalyLogs, setAnomalyLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('moisture');

  const plant = plants.find((p) => p.id === Number(plantId));
  const { history, appendLivePoint } = useSensorHistory(plantId);

  const handleMessage = useCallback(
    (data) => {
      if (data.type !== 'sensor_reading' || data.plant_id !== Number(plantId)) return;
      appendLivePoint({
        timestamp: new Date().toISOString(),
        soil_moisture_percent: data.soil_moisture_percent,
        air_temperature: data.air_temperature,
        air_humidity: data.air_humidity,
      });
    },
    [plantId, appendLivePoint]
  );
  useWebSocket(handleMessage);

  useEffect(() => {
    fetchIrrigationHistory(plantId).then(setIrrigationLogs).catch(console.error);
    fetchAnomalyHistory(plantId).then(setAnomalyLogs).catch(console.error);
  }, [plantId]);

  if (!plant) {
    return (
      <div className="min-h-screen flex items-center justify-center text-ink-soft dark:text-ink-soft-dark">
        گیاه پیدا نشد
      </div>
    );
  }

  const status = getPlantStatus(plant);

  const tabs = [
    { id: 'moisture', label: 'رطوبت خاک' },
    { id: 'climate', label: 'دما و هوا' },
  ];

  return (
    <div className="min-h-screen px-5 py-6 max-w-2xl mx-auto">
      <button
        onClick={() => navigate('/')}
        className="text-sm text-ink-soft dark:text-ink-soft-dark hover:text-ink dark:hover:text-ink-dark mb-6 flex items-center gap-1 transition-colors"
      >
        → بازگشت
      </button>

      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl text-ink dark:text-ink-dark">{plant.name}</h1>
          <p className="text-xs text-ink-soft dark:text-ink-soft-dark mt-0.5">{plant.description}</p>
        </div>
        <MoistureLevel percent={plant.soil_moisture_percent} status={status} size="lg" />
      </header>

      {/* تب‌های نمودار */}
      <div className="flex gap-1 mb-3 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-leaf/10 text-leaf dark:bg-leaf-dark/15 dark:text-leaf-dark'
                : 'text-ink-soft dark:text-ink-soft-dark'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <section className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-2xl p-4 mb-6">
        {activeTab === 'moisture' ? <MoistureChart data={history} /> : <ClimateChart data={history} />}
      </section>

      {/* تاریخچه آبیاری */}
      <section className="mb-6">
        <h2 className="font-display text-lg text-ink dark:text-ink-dark mb-2">تاریخچه آبیاری</h2>
        <div className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-2xl px-4">
          <IrrigationHistory logs={irrigationLogs} />
        </div>
      </section>

      {/* ناهنجاری‌ها */}
      <section className="mb-6">
        <h2 className="font-display text-lg text-ink dark:text-ink-dark mb-2 flex items-center gap-2">
          ناهنجاری‌های تشخیص داده‌شده
          {anomalyLogs.length > 0 && (
            <span className="text-xs font-mono bg-brick/10 dark:bg-brick-dark/15 text-brick dark:text-brick-dark px-2 py-0.5 rounded-full">
              {anomalyLogs.length}
            </span>
          )}
        </h2>
        <div className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-2xl px-4">
          <AnomalyHistory logs={anomalyLogs} />
        </div>
      </section>

      {/* تنظیمات */}
      <section>
        <h2 className="font-display text-lg text-ink dark:text-ink-dark mb-2">تنظیم آستانه‌ها</h2>
        <div className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-2xl px-4">
          <ThresholdSettings plant={plant} onUpdated={(updated) => updatePlant(plant.id, updated)} />
        </div>
      </section>
    </div>
  );
}