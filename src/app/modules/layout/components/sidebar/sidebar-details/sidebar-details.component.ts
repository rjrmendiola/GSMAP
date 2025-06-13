import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { NgFor, NgIf } from '@angular/common';
import * as L from 'leaflet';
import { Point } from 'geojson';
import { WeatherService } from '../../../services/weather.service';
import { CommonModule, DatePipe } from '@angular/common';

@Component({
  selector: 'app-sidebar-details',
  standalone: true,
  imports: [NgFor, NgIf, AngularSvgIconModule, DatePipe, CommonModule],
  templateUrl: './sidebar-details.component.html',
  styleUrl: './sidebar-details.component.scss'
})
export class SidebarDetailsComponent {
  @Input() disasterType!: { type: string; category?: string };
  @Output() rowClicked = new EventEmitter<{ barangay: string, coordinates: [number, number] }>();

  floodLandslideDetailsBarangayList!: string[];
  floodLandslideDetails!: any[];

  // Updated weather data properties - flexible typing to match service return
  public weatherData?: { 
    [barangay: string]: { 
      time: Date[];
      [key: string]: any; // Flexible typing for all weather parameters
    } 
  };
  
  public barangayNames: string[] = [];
  public selectedBarangay?: string;
  public selectedBarangayWeather?: {
    time: Date[];
    [key: string]: any; // Flexible typing for all weather parameters
  };
  public isLoadingWeather = false;

  constructor(private weatherService: WeatherService) {}

  private fetchGeoJson(url: string): Promise<any> {
    return fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .catch((error) => {
        console.error(`Error fetching the GeoJSON data from ${url}:`, error);
        throw error;
      });
  }

  public loadFloodLandslideDetails(): void {
    var url = './assets/data/hazard_flood_landslide.geojson';
    this.fetchGeoJson(url)
      .then((data) => {
        const layer = L.geoJson(data, {
          onEachFeature: (feature, layer) => {
            const barangay = feature.properties.barangay;
            const remarks = feature.properties.remarks.split('.');
            const coordinates = (feature.geometry as Point).coordinates;
            remarks.pop();

            if (!this.floodLandslideDetailsBarangayList.includes(barangay)) {
              var floodLevel = 'Low';
              if (feature.properties.flood_level.includes(',')) {
                var levels = feature.properties.flood_level.split(',');
                if (levels.includes('Moderate')) {
                  floodLevel = 'Moderate';
                } else if (levels.includes('High')) {
                  floodLevel = 'High';
                }
              }

              var floodRisk = 25;
              if (floodLevel == 'Moderate') {
                floodRisk = 50;
              } else if (floodLevel == 'High') {
                floodRisk = 100;
              }

              var landslideLevel = 'Low';
              if (feature.properties.landslide_level.includes(',')) {
                var levels = feature.properties.landslide_level.split(',');
                if (levels.includes('Moderate')) {
                  landslideLevel = 'Moderate';
                } else if (levels.includes('High')) {
                  landslideLevel = 'High';
                }
              }

              var landslideRisk = 25;
              if (landslideLevel == 'Moderate') {
                landslideRisk = 50;
              } else if (landslideLevel == 'High') {
                landslideRisk = 100;
              }

              if (typeof this.disasterType === 'undefined') {
                this.floodLandslideDetails.push({
                  barangay: barangay,
                  flood: {
                    risk: floodRisk,
                    level: floodLevel
                  },
                  landslide: {
                    risk: landslideRisk,
                    level: landslideLevel
                  },
                  coordinates: coordinates,
                  remarks: remarks,
                  showremarks: false
                });
              } else {
                var savable = false;
                if (this.disasterType.type === 'typhoon') {
                  if (this.disasterType.category === 'category1' && floodLevel === 'Low') {
                    savable = true;
                  } else if (this.disasterType.category === 'category2' && floodLevel === 'Low') {
                    savable = true;
                  } else if (this.disasterType.category === 'category3') {
                    if (floodLevel === 'Moderate') {
                      savable = true;
                      floodRisk = 70;
                    } else if (floodLevel === 'Low') {
                      savable = true;
                      floodRisk = 50;
                    }
                  } else if (this.disasterType.category === 'category4') {
                    if (floodLevel === 'Moderate') {
                      savable = true;
                      floodRisk = 70;
                    } else if (floodLevel === 'Low') {
                      savable = true;
                      floodRisk = 50;
                    }
                  } else if (this.disasterType.category === 'category5') {
                    if (floodLevel === 'High') {
                      savable = true;
                      floodRisk = 100;
                    } else if (floodLevel === 'Moderate') {
                      savable = true;
                      floodRisk = 70;
                    }
                  }
                } else if (this.disasterType.type === 'landslide') {
                  if (this.disasterType.category === 'category1' && landslideLevel === 'Low') {
                    savable = true;
                  } else if (this.disasterType.category === 'category3' && landslideLevel === 'Moderate') {
                    savable = true;
                  } else if (this.disasterType.category === 'category4' && landslideLevel === 'High') {
                    savable = true;
                  }
                }

                if (savable) {
                  this.floodLandslideDetails.push({
                    barangay: barangay,
                    flood: {
                      risk: floodRisk,
                      level: floodLevel
                    },
                    landslide: {
                      risk: landslideRisk,
                      level: landslideLevel
                    },
                    coordinates: coordinates,
                    remarks: remarks,
                    showremarks: false
                  });
                }
              }

              this.floodLandslideDetailsBarangayList.push(barangay);
              this.barangayNames.push(barangay); // Add to barangay names for weather data
            }
          }
        });
      })
      .catch((error) => {
        console.error(`Failed to load GeoJSON from ${url}:`, error);
      });
  }

  // NEW METHOD: Load weather data for all barangays
  public async loadAllWeatherData(): Promise<void> {
    try {
      this.isLoadingWeather = true;
      this.weatherData = await this.weatherService.getWeatherDataForAllBarangay();
      console.log('All weather data loaded:', this.weatherData);
    } catch (error) {
      console.error('Error loading weather data:', error);
    } finally {
      this.isLoadingWeather = false;
    }
  }

  // NEW METHOD: Load weather data for a specific barangay
  public async loadWeatherDataForBarangay(barangay: string): Promise<void> {
    try {
      this.isLoadingWeather = true;
      this.selectedBarangay = barangay;
      this.selectedBarangayWeather = await this.weatherService.getWeatherDataForBarangay(barangay);
      console.log(`Weather data for ${barangay}:`, this.selectedBarangayWeather);
    } catch (error) {
      console.error(`Error loading weather data for ${barangay}:`, error);
    } finally {
      this.isLoadingWeather = false;
    }
  }

  // NEW METHOD: Get current weather conditions for a barangay
  public getCurrentWeatherConditions(barangay: string): any {
    if (!this.weatherData || !this.weatherData[barangay]) {
      return null;
    }

    const data = this.weatherData[barangay];
    const currentIndex = 0; // You might want to find the current time index
    
    return {
      temperature: data['temperature_2m']?.[currentIndex] || 0,
      humidity: data['relative_humidity_2m']?.[currentIndex] || 0,
      precipitationProbability: data['precipitation_probability']?.[currentIndex] || 0,
      precipitation: data['precipitation']?.[currentIndex] || 0,
      rain: data['rain']?.[currentIndex] || 0,
      windSpeed: data['wind_speed_10m']?.[currentIndex] || 0,
      windDirection: data['wind_direction_10m']?.[currentIndex] || 0,
      pressure: data['pressure_msl']?.[currentIndex] || 0,
      cloudCover: data['cloudcover']?.[currentIndex] || 0,
      visibility: data['visibility']?.[currentIndex] || 0,
      weatherCode: data['weather_code']?.[currentIndex] || 0
    };
  }

  // NEW METHOD: Get weather forecast for next 24 hours
  public get24HourForecast(barangay: string): any[] {
    if (!this.weatherData || !this.weatherData[barangay]) {
      return [];
    }

    const data = this.weatherData[barangay];
    const forecast = [];
    
    // Get next 24 hours (assuming hourly data)
    for (let i = 0; i < Math.min(24, data.time.length); i++) {
      forecast.push({
        time: data.time[i],
        temperature: data['temperature_2m']?.[i] || 0,
        precipitationProbability: data['precipitation_probability']?.[i] || 0,
        precipitation: data['precipitation']?.[i] || 0,
        rain: data['rain']?.[i] || 0,
        windSpeed: data['wind_speed_10m']?.[i] || 0,
        weatherCode: data['weather_code']?.[i] || 0
      });
    }
    
    return forecast;
  }

  public toggleRemarks(barangayDetails: any): void {
    barangayDetails.showremarks = !barangayDetails.showremarks;

    // Load weather data for the clicked barangay
    this.loadWeatherDataForBarangay(barangayDetails.barangay);

    this.rowClicked.emit({
      barangay: barangayDetails.barangay,
      coordinates: barangayDetails.coordinates
    });
  }

  async ngOnInit() {
    try {
      // Load coordinates first
      await this.weatherService.loadCoordinates();
      console.log('Coordinates loaded successfully');
      
      // Load all weather data after coordinates are loaded
      await this.loadAllWeatherData();
    } catch (error) {
      console.error('Error during initialization:', error);
    }
  }

  ngOnChanges(): void {
    this.floodLandslideDetailsBarangayList = [];
    this.floodLandslideDetails = [];
    this.barangayNames = [];

    this.loadFloodLandslideDetails();
  }
}