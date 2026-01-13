import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AlertLevel {
  level: string;
  priority: number;
  label: string;
  color: string;
}

export interface Risk {
  type: string;
  alertLevel: AlertLevel;
  value?: number;
  unit?: string;
  soilMoisture?: number;
  slope?: number;
  reasons: string[];
}

export interface Recommendation {
  priority: string;
  action: string;
  target: string;
}

export interface Alert {
  barangayId: number;
  barangayName: string;
  alertLevel: AlertLevel;
  risks: {
    flood: Risk;
    landslide: Risk;
    wind: Risk;
  };
  recommendations: Recommendation[];
  evacuationCenters: any[];
  timestamp: Date;
  weatherSummary: {
    rainfall: number;
    windSpeed: number;
    soilMoisture: number;
  };
}

export interface AlertStatistics {
  total: number;
  byLevel: {
    RED: number;
    ORANGE: number;
    YELLOW: number;
    GREEN: number;
  };
  byRiskType: {
    flood: number;
    landslide: number;
    wind: number;
  };
  criticalBarangays: string[];
}

export interface DecisionRule {
  id: string;
  category: string;
  priority: string;
  condition: any;
  action: string;
  responsible: string[];
  timeline: string;
  resources: string[];
  triggered?: boolean;
  triggeredAt?: Date;
}

export interface DecisionMatrix {
  categories: string[];
  priorities: string[];
  rules: DecisionRule[];
  summary: {
    total: number;
    byCat: { [key: string]: number };
    byPriority: { [key: string]: number };
  };
}

export interface EvacuationCenter {
  id: number;
  name: string;
  venue: string;
  latitude: number;
  longitude: number;
  capacity: number;
  assignedEvacuees: number;
  utilizationRate: string;
  status: string;
  contactPerson: string;
}

export interface EvacuationPlan {
  barangayId: number;
  barangayName: string;
  priority: number;
  alertLevel: string;
  population: number;
  estimatedEvacuees: number;
  evacuationRate: string;
  evacuationCenters: EvacuationCenter[];
  totalCapacity: number;
  capacityStatus: {
    status: string;
    message: string;
    utilizationRate: string;
  };
  timeline: any;
  evacuationOrder: any[];
  risks: any;
  routes: any;
  contactPerson: string;
  specialNeeds: any;
}

export interface RiskScore {
  barangayId: number;
  barangayName: string;
  totalScore: number;
  riskCategory: {
    level: string;
    color: string;
    label: string;
  };
  criteria: {
    floodHazard: number;
    landslideHazard: number;
    currentWeather: number;
    populationDensity: number;
    vulnerability: number;
    infrastructure: number;
  };
  weights: any;
  recommendations: string[];
}

@Injectable({
  providedIn: 'root'
})
export class DssService {
  private apiUrl = `${environment.apiUrl}/dss`;

  constructor(private http: HttpClient) {}

  // Alert System APIs
  getAlerts(): Observable<{ success: boolean; data: { alerts: Alert[]; statistics: AlertStatistics; timestamp: Date } }> {
    return this.http.get<any>(`${this.apiUrl}/alerts`);
  }

  getTestAlerts(): Observable<{ success: boolean; data: { alerts: Alert[]; statistics: AlertStatistics; timestamp: Date } }> {
    return this.http.get<any>(`${this.apiUrl}/alerts/test/demo`);
  }

  getBarangayAlert(barangayId: number): Observable<{ success: boolean; data: Alert }> {
    return this.http.get<any>(`${this.apiUrl}/alerts/${barangayId}`);
  }

  // Decision Rules APIs
  getDecisionRules(): Observable<{ success: boolean; data: DecisionMatrix }> {
    return this.http.get<any>(`${this.apiUrl}/decision-rules`);
  }

  getTriggeredRules(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/decision-rules/triggered`);
  }

  // Evacuation Planning APIs
  getEvacuationPlan(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/evacuation-plan`);
  }

  getBarangayEvacuationPlan(barangayId: number): Observable<{ success: boolean; data: EvacuationPlan }> {
    return this.http.get<any>(`${this.apiUrl}/evacuation-plan/${barangayId}`);
  }

  getEvacuationStatus(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/evacuation-status`);
  }

  // Risk Scoring APIs
  getRiskScores(customWeights?: any): Observable<any> {
    if (customWeights) {
      return this.http.post<any>(`${this.apiUrl}/risk-scores`, { weights: customWeights });
    }
    return this.http.get<any>(`${this.apiUrl}/risk-scores`);
  }

  getBarangayRiskScore(barangayId: number, customWeights?: any): Observable<{ success: boolean; data: RiskScore }> {
    if (customWeights) {
      return this.http.post<any>(`${this.apiUrl}/risk-scores/${barangayId}`, { weights: customWeights });
    }
    return this.http.get<any>(`${this.apiUrl}/risk-scores/${barangayId}`);
  }

  compareScenarios(scenarios: any[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/risk-scores/compare`, { scenarios });
  }

  // Dashboard API
  getDashboard(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dashboard`);
  }
}
