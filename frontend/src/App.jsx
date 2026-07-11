import { Routes, Route } from 'react-router-dom';
import { PlantsProvider } from './context/PlantsContext';
import { ThemeProvider } from './context/ThemeContext';
import { Dashboard } from './pages/Dashboard';
import { PlantDetail } from './pages/PlantDetail';

export default function App() {
  return (
    <ThemeProvider>
      <PlantsProvider>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/plant/:plantId" element={<PlantDetail />} />
        </Routes>
      </PlantsProvider>
    </ThemeProvider>
  );
}
