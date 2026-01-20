import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SimulationParams, EvacuationCenterRisk, SimulationState } from '../models/simulation.model';
import { EvacuationCenter } from './evacuation-center.service';

type EvacuationCenterInput = EvacuationCenter & { capacity?: number };

@Injectable({
  providedIn: 'root'
})
export class SimulationService {
  private simulationStateSubject = new BehaviorSubject<SimulationState>({
    isActive: false,
    isPaused: false,
    currentTime: 0,
    params: null,
    evacuationCenterRisks: []
  });

  public simulationState$: Observable<SimulationState> = this.simulationStateSubject.asObservable();

  // Soil absorption rates (how much water the soil can absorb)
  private readonly soilAbsorptionRates = {
    'Dry': 0.7,      // Dry soil can absorb 70% of rainfall
    'Moist': 0.4,    // Moist soil can absorb 40% of rainfall
    'Saturated': 0.1  // Saturated soil can only absorb 10% of rainfall
  };

  // Maximum rainfall threshold for 100% risk
  private readonly maxRainfallThreshold = 500; // MM

  /**
   * Calculate flood risk for a given time in the simulation
   */
  calculateFloodRisk(params: SimulationParams, time: number): number {
    // Calculate total rainfall accumulated up to this time
    // Assuming constant intensity for simplicity (can be enhanced with curves)
    const totalRainfall = params.rainfallIntensity * (time / params.duration);
    
    // Get soil absorption rate
    const absorptionRate = this.soilAbsorptionRates[params.soilMoisture];
    
    // Calculate effective rainfall (rainfall that can't be absorbed)
    const effectiveRainfall = totalRainfall * (1 - absorptionRate);
    
    // Calculate risk as percentage (0-100)
    const risk = Math.min(100, (effectiveRainfall / this.maxRainfallThreshold) * 100);
    
    return Math.max(0, risk);
  }

  /**
   * Calculate evacuation center risk levels based on flood risk and proximity
   */
  calculateEvacuationCenterRisks(
    evacuationCenters: EvacuationCenterInput[],
    floodRisk: number,
    params: SimulationParams
  ): EvacuationCenterRisk[] {
    return evacuationCenters.map(center => {
      // Base risk from overall flood risk
      let riskScore = floodRisk;
      
      // Adjust based on soil moisture (saturated = higher risk)
      if (params.soilMoisture === 'Saturated') {
        riskScore = Math.min(100, riskScore * 1.2);
      } else if (params.soilMoisture === 'Moist') {
        riskScore = Math.min(100, riskScore * 1.1);
      }
      
      // Determine risk level with 5 categories
      let riskLevel: 'Minimal' | 'Low' | 'Moderate' | 'High' | 'Critical';
      if (riskScore < 10) {
        riskLevel = 'Minimal';
      } else if (riskScore < 25) {
        riskLevel = 'Low';
      } else if (riskScore < 50) {
        riskLevel = 'Moderate';
      } else if (riskScore < 75) {
        riskLevel = 'High';
      } else {
        riskLevel = 'Critical';
      }
      
      return {
        id: center.id || 0,
        name: center.name || center.venue,
        venue: center.venue,
        riskLevel,
        latitude: center.latitude,
        longitude: center.longitude
      };
    });
  }

  /**
   * Update simulation state
   */
  updateSimulationState(updates: Partial<SimulationState>): void {
    const currentState = this.simulationStateSubject.value;
    this.simulationStateSubject.next({ ...currentState, ...updates });
  }

  /**
   * Start simulation
   */
  startSimulation(params: SimulationParams, evacuationCenters: EvacuationCenterInput[]): void {
    const initialRisks = this.calculateEvacuationCenterRisks(evacuationCenters, 0, params);
    
    this.simulationStateSubject.next({
      isActive: true,
      isPaused: false,
      currentTime: 0,
      params,
      evacuationCenterRisks: initialRisks
    });
  }

  /**
   * Update simulation time
   */
  updateSimulationTime(time: number, evacuationCenters: EvacuationCenterInput[]): void {
    const state = this.simulationStateSubject.value;
    if (!state.params || !state.isActive) return;
    
    const floodRisk = this.calculateFloodRisk(state.params, time);
    const risks = this.calculateEvacuationCenterRisks(evacuationCenters, floodRisk, state.params);
    
    this.simulationStateSubject.next({
      ...state,
      currentTime: time,
      evacuationCenterRisks: risks
    });
  }

  /**
   * Stop simulation
   */
  stopSimulation(): void {
    this.simulationStateSubject.next({
      isActive: false,
      isPaused: false,
      currentTime: 0,
      params: null,
      evacuationCenterRisks: []
    });
  }

  /**
   * Pause/Resume simulation
   */
  togglePause(): void {
    const state = this.simulationStateSubject.value;
    this.simulationStateSubject.next({
      ...state,
      isPaused: !state.isPaused
    });
  }
}
