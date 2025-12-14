export interface HazardResult {
  barangay: string;
  isFloodRisk: boolean;
  isLandslideRisk: boolean;
  isStormSurgeRisk: boolean;
  severityScore: number;

  // Include soil moisture baseline
  soilMean: number;
  soilMeanNorm: number;
}
