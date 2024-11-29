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
            console.log(feature.properties);
            // console.log(barangay);
            // console.log(this.floodLandslideDetailsBarangayList.includes(barangay));

            if (!this.floodLandslideDetailsBarangayList.includes(barangay)) {
              this.floodLandslideDetails.push({
                barangay: barangay,
                flood: {
                  risk: '',
                  level: feature.properties.landslide_level
                },
                landslide: {
                  risk: '',
                  level: feature.properties.flood_level
                }
              });

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

    this.loadFloodLandslideDetails();
  }
}
