import { Component, Input } from '@angular/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { NgFor, NgIf } from '@angular/common';
import * as L from 'leaflet';

@Component({
  selector: 'app-sidebar-details',
  standalone: true,
  imports: [NgFor, NgIf, AngularSvgIconModule],
  templateUrl: './sidebar-details.component.html',
  styleUrl: './sidebar-details.component.scss'
})
export class SidebarDetailsComponent {
  @Input() disasterType!: { type: string; category?: string };
  floodLandslideDetailsBarangayList!: string[];
  // floodLandslideDetails?: {
  //   barangay: '',
  //   flood: {
  //     risk: '',
  //     level: ''
  //   },
  //   landslide: {
  //     risk: '',
  //     level: ''
  //   }
  // };
  floodLandslideDetails!: any[];

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
            // console.log(feature.properties);
            // console.log(barangay);
            // console.log(this.floodLandslideDetailsBarangayList.includes(barangay));

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
                  }
                });
              } else {
                var savable = false;
                if (this.disasterType.type === 'typhoon') {
                  if (this.disasterType.category === 'category1' && floodLevel === 'Low') {
                    savable = true;
                  } else if (this.disasterType.category === 'category2' && floodLevel === 'Low') {
                    savable = true;
                  } else if (this.disasterType.category === 'category3' && floodLevel === 'Moderate') {
                    savable = true;
                  } else if (this.disasterType.category === 'category4' && floodLevel === 'Moderate') {
                    savable = true;
                  } else if (this.disasterType.category === 'category5' && floodLevel === 'High') {
                    savable = true;
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
                    }
                  });
                }
              }

              this.floodLandslideDetailsBarangayList.push(barangay);
            }
          }
        });
      })
      .catch((error) => {
        console.error(`Failed to load GeoJSON from ${url}:`, error);
      });
  }

  ngOnInit(): void {}

  ngOnChanges(): void {
    this.floodLandslideDetailsBarangayList = [];
    this.floodLandslideDetails = [];

    console.log(this.disasterType);

    this.loadFloodLandslideDetails();
  }
}
