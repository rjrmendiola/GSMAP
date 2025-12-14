import { Injectable } from '@angular/core';
import { BarangayWeather } from 'src/app/core/types/barangay-weather.type';
import { BarangayService } from './barangay.service';
import { SoilMoistureBaseline } from './soil-moisture.service';
import { HttpClient } from '@angular/common/http';

export interface HazardResult {
  // barangay: string;
  // critical: boolean;
  // floodRisk: boolean;
  // landslideRisk: boolean;
  // windRisk: boolean;
  // heatRisk: boolean;
  // reasons: string[];
  barangay: string;
  isFloodRisk: boolean;
  isLandslideRisk: boolean;
  isWindRisk: boolean;
  details: any; // optional, you can include threshold info
}

export interface HazardThresholds {
  rain: number;                 // mm/h or mm/day
  soilMoisture: number;         // 0..1 normalized
  windSpeed: number;            // m/s or km/h
  slope: number;                // degree
}

@Injectable({
  providedIn: 'root'
})
export class HazardDetectorService {
  private thresholds: HazardThresholds = {
    rain: 50,
    soilMoisture: 0.8,
    windSpeed: 15,
    slope: 30
  };

  constructor(private http: HttpClient) {
    this.loadThresholds();
  }

  /** Load admin-editable thresholds from backend */
  async loadThresholds() {
    try {
      const t = await this.http.get<HazardThresholds>('/api/hazard-thresholds').toPromise();
      if (t) this.thresholds = t;
    } catch (err) {
      console.warn('Failed to load hazard thresholds, using defaults', err);
    }
  }

  /** Main method: detect hazards for all barangays */
  detectAll(weatherData: { [barangay: string]: any }): HazardResult[] {
    const results: HazardResult[] = [];

    for (const [barangay, data] of Object.entries(weatherData)) {
      const isFloodRisk = this.isFloodRisk(data);
      const isLandslideRisk = this.isLandslideRisk(data);
      const isWindRisk = this.isWindRisk(data);

      results.push({
        barangay,
        isFloodRisk,
        isLandslideRisk,
        isWindRisk,
        details: data
      });
    }

    return results;
  }

  /** ----------------- Hazard Methods ----------------- */

  private isFloodRisk(data: any): boolean {
    if (!data.rain || !Array.isArray(data.rain)) return false;

    // Use max rain in the array
    const maxRain = Math.max(...data.rain);
    return maxRain >= this.thresholds.rain;
  }

  private isLandslideRisk(data: any): boolean {
    // Take maximum of soil moisture arrays
    const soilKeys = [
      'soil_moisture_0_to_1cm',
      'soil_moisture_1_to_3cm',
      'soil_moisture_3_to_9cm'
    ];

    let maxSoil = 0;
    for (const key of soilKeys) {
      if (data[key] && Array.isArray(data[key])) {
        const localMax = Math.max(...data[key]);
        if (localMax > maxSoil) maxSoil = localMax;
      }
    }

    // Optionally check slope baseline if present
    const slope = data.slope || 0; // assume 0 if no slope info

    return maxSoil >= this.thresholds.soilMoisture || slope >= this.thresholds.slope;
  }

  private isWindRisk(data: any): boolean {
    if (!data.wind_speed_10m || !Array.isArray(data.wind_speed_10m)) return false;

    const maxWind = Math.max(...data.wind_speed_10m);
    return maxWind >= this.thresholds.windSpeed;
  }
}

