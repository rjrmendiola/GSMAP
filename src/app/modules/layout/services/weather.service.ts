import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { fetchWeatherApi } from 'openmeteo';
import { firstValueFrom } from 'rxjs';

// Note: The openmeteo library returns data in a highly optimized format (FlatBuffers).
// The `VariableWithValues` object you get for each variable does not contain its name.
// Instead, you identify the data by its index, which matches the order of the
// variables you requested in the `hourly` parameter of the API call.

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  private barangayCoordinates: {
    [barangay: string]: { latitude: number; longitude: number };
  } = {};

  constructor(private http: HttpClient) {}

  /**
   * Loads barangay coordinates from a local GeoJSON file.
   * This must be called and completed before fetching weather data.
   */
  async loadCoordinates(): Promise<void> {
    // Using firstValueFrom from RxJS is a more modern way to handle single-emission Observables.
    const geojson = await firstValueFrom(this.http.get<any>('assets/data/hazard_flood_landslide.geojson'));

    for (const feature of geojson.features) {
      const barangay = feature.properties.barangay;

      // Assuming the geometry is always a Point, where coordinates are a simple [lon, lat] array.
      // Be cautious if your GeoJSON contains other geometry types like Polygons.
      const [latitude, longitude] = feature.geometry.coordinates;

      if (barangay && !this.barangayCoordinates[barangay]) {
        this.barangayCoordinates[barangay] = {
          latitude,
          longitude
        };
      }
    }
  }

  /**
   * Fetches weather data for all loaded barangay coordinates.
   * @returns A promise that resolves to an object mapping each barangay to its weather data.
   */
  async getWeatherDataForAllBarangay() {
    // Ensure coordinates are loaded before proceeding.
    if (Object.keys(this.barangayCoordinates).length === 0) {
        await this.loadCoordinates();
    }

    const url = 'https://api.open-meteo.com/v1/forecast';

    const hourlyVars = [
      'temperature_2m', 'relative_humidity_2m', 'dew_point_2m',
      'apparent_temperature', 'precipitation_probability', 'precipitation',
      'rain', 'showers', 'snowfall', 'snow_depth', 'weather_code',
      'pressure_msl', 'surface_pressure', 'cloudcover', 'cloudcover_low',
      'cloudcover_mid', 'cloudcover_high', 'visibility',
      'evapotranspiration', 'et0_fao_evapotranspiration', 'vapor_pressure_deficit',
      'wind_speed_10m', 'wind_speed_80m', 'wind_speed_120m', 'wind_speed_180m',
      'wind_direction_10m', 'wind_direction_80m', 'wind_direction_120m', 'wind_direction_180m',
      'wind_gusts_10m', 'temperature_80m', 'temperature_120m', 'temperature_180m',
      'soil_temperature_0cm', 'soil_temperature_6cm', 'soil_temperature_18cm', 'soil_temperature_54cm',
      'soil_moisture_0_to_1cm', 'soil_moisture_1_to_3cm', 'soil_moisture_3_to_9cm',
      'soil_moisture_9_to_27cm', 'soil_moisture_27_to_81cm'
    ];

    const barangayData: {
      [barangay: string]: {
        time: Date[];
        [key: string]: any;
      };
    } = {};

    for (const [barangay, coords] of Object.entries(this.barangayCoordinates)) {
      const params = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        hourly: hourlyVars, // The library handles joining the array
        timezone: 'auto'
      };

      const responses = await fetchWeatherApi(url, params);
      const response = responses[0];

      const utcOffsetSeconds = response.utcOffsetSeconds();
      const hourly = response.hourly()!;
      const interval = hourly.interval();
      const start = Number(hourly.time());
      const end = Number(hourly.timeEnd());

      // Helper function to generate the time array
      const range = (start: number, stop: number, step: number) =>
          Array.from({ length: (stop - start) / step }, (_, i) => start + i * step);

      const timeArray = range(start, end, interval).map(
        (t) => new Date((t + utcOffsetSeconds) * 1000)
      );

      const data: any = { time: timeArray };
      const variableCount = hourly.variablesLength();

      for (let i = 0; i < variableCount; i++) {
        const variable = hourly.variables(i);

        if (variable) {
          const name = hourlyVars[i]; // Get the variable name from our request array
          const values = variable.valuesArray();
          if (name && values) {
            data[name] = Array.from(values);
          }
        }
      }

      barangayData[barangay] = data;
    }

    return barangayData;
  }

  /**
   * Fetches weather data for a single, specific barangay.
   * @param barangay The name of the barangay to fetch data for.
   * @returns A promise that resolves to the weather data for the specified barangay.
   */
  async getWeatherDataForBarangay(barangay: string) {
    // Ensure coordinates are loaded before proceeding.
    if (Object.keys(this.barangayCoordinates).length === 0) {
        await this.loadCoordinates();
    }

    const url = 'https://api.open-meteo.com/v1/forecast';
    const coords = this.barangayCoordinates[barangay];
    if (!coords) throw new Error(`Coordinates not found for barangay: ${barangay}`);

    const hourlyVars = [
        'temperature_2m', 'relative_humidity_2m', 'dew_point_2m',
        'apparent_temperature', 'precipitation_probability', 'precipitation',
        'rain', 'showers', 'snowfall', 'snow_depth', 'weather_code',
        'pressure_msl', 'surface_pressure', 'cloudcover', 'cloudcover_low',
        'cloudcover_mid', 'cloudcover_high', 'visibility',
        'evapotranspiration', 'et0_fao_evapotranspiration', 'vapor_pressure_deficit',
        'wind_speed_10m', 'wind_speed_80m', 'wind_speed_120m', 'wind_speed_180m',
        'wind_direction_10m', 'wind_direction_80m', 'wind_direction_120m', 'wind_direction_180m',
        'wind_gusts_10m', 'temperature_80m', 'temperature_120m', 'temperature_180m',
        'soil_temperature_0cm', 'soil_temperature_6cm', 'soil_temperature_18cm', 'soil_temperature_54cm',
        'soil_moisture_0_to_1cm', 'soil_moisture_1_to_3cm', 'soil_moisture_3_to_9cm',
        'soil_moisture_9_to_27cm', 'soil_moisture_27_to_81cm'
    ];

    const params = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      hourly: hourlyVars,
      timezone: 'auto'
    };

    const responses = await fetchWeatherApi(url, params);
    const response = responses[0];

    const utcOffsetSeconds = response.utcOffsetSeconds();
    const hourly = response.hourly()!;
    const interval = hourly.interval();
    const start = Number(hourly.time());
    const end = Number(hourly.timeEnd());

    const range = (start: number, stop: number, step: number) =>
        Array.from({ length: (stop - start) / step }, (_, i) => start + i * step);

    const timeArray = range(start, end, interval).map(
      (t) => new Date((t + utcOffsetSeconds) * 1000)
    );

    const data: any = { time: timeArray };
    const variableCount = hourly.variablesLength();

    for (let i = 0; i < variableCount; i++) {
        const variable = hourly.variables(i);

        if (variable) {
            const name = hourlyVars[i];
            const values = variable.valuesArray();
            if (name && values) {
                data[name] = Array.from(values);
            }
        }
    }

    return data;
  }
}
