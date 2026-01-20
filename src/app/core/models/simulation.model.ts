export interface SimulationParams {
  rainfallIntensity: number; // MM
  duration: number; // hours
  soilMoisture: 'Dry' | 'Moist' | 'Saturated';
}

export interface EvacuationCenterRisk {
  id: number;
  name: string;
  venue: string;
  riskLevel: 'Minimal' | 'Low' | 'Moderate' | 'High' | 'Critical';
  latitude: number;
  longitude: number;
}

export interface SimulationState {
  isActive: boolean;
  isPaused: boolean;
  currentTime: number; // hours elapsed
  params: SimulationParams | null;
  evacuationCenterRisks: EvacuationCenterRisk[];
}
