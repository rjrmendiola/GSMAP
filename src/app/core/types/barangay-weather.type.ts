export interface BarangayWeather {
  barangay: string;

  // Time series
  time: Date[];

  // Weather parameters
  rain: number[];
  precipitation: number[];
  precipitationProbability: number[];
  soil_moisture_0_to_1cm: number[];
  soil_moisture_1_to_3cm: number[];
  soil_moisture_3_to_9cm: number[];
  soil_moisture_9_to_27cm: number[];

  // Dynamic Open-Meteo fields
  [key: string]: any;
}
