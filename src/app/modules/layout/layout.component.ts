import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  ViewEncapsulation
} from '@angular/core';
import { FooterComponent } from './components/footer/footer.component';
import { NavigationEnd, Router, RouterOutlet, Event } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import * as L from 'leaflet';
import 'leaflet-minimap';
import 'leaflet-fullscreen';
import 'leaflet.awesome-markers/dist/leaflet.awesome-markers.js';
// import * as d3 from 'd3';
import { Subscription } from 'rxjs';
import { DisasterService } from 'src/app/core/services/disaster.service';
import { SidebarDetailsComponent } from "./components/sidebar/sidebar-details/sidebar-details.component";
import introJs from 'intro.js';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { EvacuationCenterService, EvacuationCenter } from 'src/app/core/services/evacuation-center.service';
import { BarangayOfficialService, BarangayOfficial } from 'src/app/core/services/barangay-official.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { FormsModule } from '@angular/forms';
import { BarangayService } from 'src/app/core/services/barangay.service';
import { Barangay, BarangayResponse } from 'src/app/shared/models/barangay.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
  standalone: true,
  imports: [SidebarComponent, NavbarComponent, RouterOutlet, FooterComponent, SidebarDetailsComponent, FormsModule, CommonModule],
  encapsulation: ViewEncapsulation.None,
})
export class LayoutComponent implements OnInit, AfterViewInit, OnDestroy {
  // @Input() disasterType!: { type: string; category?: string };
  private disasterTypeSubscription!: Subscription;
  disasterType!: { type: string; category?: string };

  isMobile: boolean = false;
  isHazardDetailsMinimized: boolean = false;

  isLoggedIn: boolean = false;

  isDropdownOpen: boolean = false;
  private mainContent: HTMLElement | null = null;
  private map: any;
  private legend: any;
  private info: any;
  private details: any;
  private affectedBarangays: any;
  private barangayPolygons: { [key: string]: any } = {};
  private highlightLayer: L.GeoJSON | null = null;
  private labelMarker: L.Marker | null = null;
  private toggleControl: any;

  private coloringMap = {
    barangay: '#8A9A5B',
    flood: {
      low: '#E0B0FF',
      //low: '#EE82EE',
      moderate: '#722F37',
      // high: '#483248'
      high: '#800080'
    },
    landslide: {
      // low: '#FFDE21',
      // moderate: '#2E8B57',
      // high: '#FF5733'
      low: '#FFFF00',
      moderate: '#6B8E23',
      high: '#800000'

    }
  };

  private hazardRiskDetails = {
    'landslide': {
      'low': "Low - areas are generally stable, with minimal movement observed and conditions that do not easily trigger landslides",
      'moderate': "Moderate - areas possess features that could lead to landslides under certain conditions, such as steeper inclines, loose soil, or occasional heavy rainfall",
      'high': "High - areas are prone to frequent and severe landslides due to factors such as steep, unstable slopes, high rainfall, erodible soil, or prior landslide history"
    },
    'flood' : {
      'low': "Low - areas are places where flooding is unlikely or rare, often only occurring under extreme weather conditions",
      'moderate': "Moderate - areas are those where flooding can happen under certain conditions, such as during seasonal heavy rains or when rivers exceed their normal levels",
      'high': "High - areas are zones where flooding is common and can be severe, often due to their proximity to rivers, lakes, coastal regions, or low-lying terrain that retains water"
    }
  };

  private hazardCategoryDetails = {
    'landslide': {
      'unlikely': "Areas have minimal susceptibility, characterized by stable terrain, gentle slopes, and solid ground, where landslides are rare under typical conditions",
      'less_likely_to_experience': "Areas may have some factors that could contribute to landslides, such as mild slopes or occasional external triggers like rain, but they do not frequently experience significant movement",
      'moderately_susceptible': "Areas show a higher potential for landslides, often featuring steeper slopes, weaker soils, or a history of smaller landslide events",
      'highly_susceptible': "Areas are those where landslides are common and often severe due to factors such as steep, unstable terrain, loose or erodible soil, and significant weathering"
    },
    'typhoon': {
      'tropical_depression': "Tropical Depression - have maximum sustained wind speeds of up to 62 km/h (38 mph) and typically bring heavy rainfall but minimal wind damage",
      'tropical_storm': "Tropical Storm - have sustained winds between 63-118 km/h (39-73 mph), strong enough to cause moderate damage, heavy rain, and potential flooding",
      'severe_tropical_storm': "Severe Tropical Storm - escalate further with winds between 89-117 km/h (55-73 mph), posing greater threats of damage and more intense rain",
      'typhoon': "Typhoon - have sustained winds of 119-177 km/h (74-110 mph), bringing significant potential for destruction, widespread flooding, and storm surges in coastal areas",
      'super_typhoon': "Super Typhoon - exceed 178 km/h (111 mph) and are equivalent to powerful Category 4 or 5 hurricanes"
    }
  };

  private typhoonRainfallImpactDetails = {
    'tropical_depression': {
      'range': "50-150 mm in 24 hours",
      'impact': "Light to moderate rain over wide areas. Some localized flooding is possible, especially in low-lying or poorly drained areas."
    },
    'tropical_storm': {
      'range': "100-200 mm in 24 hours",
      'impact': "Moderate to heavy rains may cause flash floods and landslides in mountainous areas."
    },
    'severe_tropical_storm': {
      'range': "150-300 mm in 24 hours",
      'impact': "Widespread heavy rains could lead to significant flooding and landslides."
    },
    'typhoon': {
      'range': "200-400 mm in 24 hours",
      'impact': "Intense rains can cause severe flooding, landslides, and river overflows. Coastal areas may also face storm surges."
    },
    'super_typhoon': {
      'range': "300-500 mm or more in 24 hours",
      'impact': "Catastrophic rainfall can result in massive flooding, landslides, and widespread destruction. Communities in low-lying and mountainous areas are at the highest risk."
    },
  };

  // Property to track the currently active marker
  private currentMarker: L.Marker | null = null;

  // Dictionary to store GeoJSON layers
  private layers: { [key: string]: L.GeoJSON } = {};

  // Layer visibility dictionary
  layerVisibility: { [key: string]: boolean } = {
    barangay: true,
    water_river: false,
    buildings: false,
    landcover: false,
    roads: false,
    forest: true,
    landslide_low: false,
    landslide_moderate: false,
    landslide_high: false,
    flood_high: false,
    flood_moderate: false,
    flood_low: false
  };

  // Define colors for each layer
  private layerColors: { [key: string]: string } = {
    water_river: '#00008B',
    buildings: '#B22222',
    landcover: '#32CD32',
    roads: '#000000',
    forest: '#4B5320',
  };

  private defaultIcon = L.icon({
    iconUrl: 'assets/images/marker-icon.png', // Replace with the path to your custom icon
    iconSize: [25, 41], // Default size
    iconAnchor: [12, 41], // Point of the icon that corresponds to the marker's location
    popupAnchor: [1, -34],
    shadowUrl: 'assets/images/marker-shadow.png', // Optional shadow
    shadowSize: [41, 41],
  });

  // Store references to nearest markers
  nearestEvacuationMarkers: L.Marker[] = [];

  // Get the objects from the database
  evacuationCenters: any[] = [];
  barangays: Barangay[] = [];
  barangayOfficials: any[] = [];

  baseLayers: any;
  baseLayerTypes = [
    { label: 'OpenStreetMap', value: 'openstreetmap' },
    { label: 'Google Satellite', value: 'satellite' },
    { label: 'Topographic', value: 'topographic' }
  ];

  selectedBarangay: number | null = null;
  selectedMapType: string | null = null;

  evacuationCenterLayer: L.LayerGroup | null = null;
  barangayOfficialLayer: L.LayerGroup | null = null;

  showEvacuationCenters = false;
  showBarangayOfficials = false;

  filters = {
    evacuationCenters: false,
    officials: false,
  };

  showFilterPopup = false;

  private hazardAffectedBarangays = {
    'landslide': {
      // 'unlikely': "Areas have minimal susceptibility, characterized by stable terrain, gentle slopes, and solid ground, where landslides are rare under typical conditions",
      'less_likely_to_experience': [
        'tinaguban', 'hiluctugan', 'canlampay', 'libo', 'upper_hiraan', 'caghalo', 'manloy', 'san_isidro', 'paglaum', 'camansi'
      ],
      'moderately_susceptible': [
        'tinaguban', 'hiluctugan', 'canlampay', 'libo', 'upper_hiraan', 'caghalo', 'manloy', 'san_isidro', 'paglaum', 'camansi'
      ],
      'highly_susceptible': [
        'caghalo', 'paglaum', 'san_isidro', 'tinaguban', 'libo'
      ]
    },
    'typhoon': {
      'tropical_depression': [
        'san_mateo', 'guindapunan_west', 'guindapunan_east', 'jugaban', 'balilit', 'barugohay_sur', 'cutay', 'bislig', 'barayong', 'manloy', 'barugohay_central', 'nauguisan', 'canal'
      ],
      'tropical_storm': [
        'san_mateo', 'guindapunan_west', 'guindapunan_east', 'jugaban', 'balilit', 'barugohay_sur', 'cutay', 'bislig', 'barayong', 'manloy', 'barugohay_central', 'nauguisan', 'canal'
      ],
      'severe_tropical_storm': [
        'tangnan', 'nauguisan', 'san_juan', 'west_visoria', 'east_visoria', 'ponong', 'baybay', 'jugaban', 'canal', 'uyawan', 'tagak', 'rizal', 'sagkahan', 'pangna', 'bislig'
      ],
      'typhoon': [
        'tangnan', 'nauguisan', 'san_juan', 'west_visoria', 'east_visoria', 'ponong', 'baybay', 'jugaban', 'canal', 'uyawan', 'tagak', 'rizal', 'sagkahan', 'pangna', 'bislig'
      ],
      'super_typhoon': [
        'bislig', 'canal', 'uyawan', 'lower_hiraan', 'canlampay', 'parena', 'upper_sogod', 'lower_sogod', 'binibihan', 'macalpi'
      ]
    }
  };

  // pop_density: persons per square mile
  // area: square miles
  private barangayDetails = [
    { name: 'bagong_lipunan', pop_density: 785.20, livelihood: 'Agriculture/Crops mixed with Coconut Plantation', area: 0.7703 },
    { name: 'balilit', pop_density: 1608.54, livelihood: 'Agriculture/Crops mixed with Coconut Plantation', area: 0.6078 },
    { name: 'barayong', pop_density: 382.25, livelihood: 'Agriculture/Crops mainly sugar', area: 0.879 },
    { name: 'barugohay_central', pop_density: 3213.58, livelihood: 'Agriculture/Crops mixed with Coconut Plantation', area: 0.354 },
    { name: 'barugohay_norte', pop_density: 4041.65, livelihood: 'Fishery/Fish Ponds and Mangroves', area: 0.497 },
    { name: 'barugohay_sur', pop_density: 839.23, livelihood: 'Agriculture/Crops mixed with Coconut Plantation', area: 1.30 },
    { name: 'baybay', pop_density: 22265.7, livelihood: 'Fishery/Trading', area: 0.1029 },
    { name: 'binibihan', pop_density: 1426.7, livelihood: 'Agriculture/Crops mixed with Coconut Plantation', area: 0.974 },
    { name: 'bislig', pop_density: 837.13, livelihood: 'Agriculture/Crops mainly cereals and sugar', area: 0.845 },
    { name: 'caghalo', pop_density: 3245.51, livelihood: 'Agriculture/Coconut Plantation', area: 0.4135 },
    { name: 'camansi', pop_density: 534.71, livelihood: 'Agriculture/Crops mixed with Coconut Plantation', area: 2.42 },
    { name: 'canal', pop_density: 2658.23, livelihood: 'Agriculture/Crops mainy cereals and sugar', area: 0.316 },
    { name: 'candigahub', pop_density: 1767.3, livelihood: 'Agriculture/Crops mixed with Coconut Plantation', area: 0.587 },
    { name: 'canfabi', pop_density: 1056, livelihood: 'Agriculture/Crops mixed with Coconut Plantation', area: 0.4215 },
    { name: 'canlampay', pop_density: 512.6, livelihood: 'Agriculture/Crops mixed with Coconut Plantation', area: 2.46 },
    { name: 'cogon', pop_density: 1010.48, livelihood: 'Agriculture/Crops mixed with Coconut Plantation', area: 0.743 },
    { name: 'cutay', pop_density: 948.11, livelihood: 'Agriculture/Crops mixed with Coconut Plantation', area: 1.06 },
    { name: 'east_visoria', pop_density: 29030.53, livelihood: 'Fishery', area: 0.0389 },
    { name: 'guindapunan_east', pop_density: 4379.5, livelihood: 'Fishery', area: 0.2435 },
    { name: 'guindapunan_west', pop_density: 2499.86, livelihood: 'Fishery', area: 0.2703 },
    { name: 'hiluctogan', pop_density: 172.71, livelihood: 'Agriculture/Crops mixed with Coconut Plantation', area: 5.02 },
    { name: 'jugaban', pop_density: 33854, livelihood: 'Fishery/Trading', area: 0.0545 },
    { name: 'libo', pop_density: 583.51, livelihood: 'Agriculture/Coconut Plantation', area: 1.88 },
    { name: 'lower_hiraan', pop_density: 1097.73, livelihood: 'Agriculture/Crops mixed with Coconut Plantation', area: 0.442 },
    { name: 'lower_sogod', pop_density: 1427.3, livelihood: 'Agriculture/Crops mixed with Coconut Plantation', area: 0.436 },
    { name: 'macalpi', pop_density: 820.29, livelihood: 'Agriculture/Crops mixed with Coconut Plantation', area: 1.38 },
    { name: 'manloy', pop_density: 930.60, livelihood: 'Agriculture/Coconut Plantation', area: 1.34 },
    { name: 'nauguisan', pop_density: 2800.57, livelihood: 'Agriculture/Crops mixed with Coconut Plantation', area: 0.352 },
    { name: 'paglaum', pop_density: 162.57, livelihood: 'Agriculture/Crops mixed with Coconut Plantation', area: 1.71 },
    { name: 'pangna', pop_density: 850.85, livelihood: 'Agriculture/Coconut Plantation', area: 1.18 },
    { name: 'parag-um', pop_density: 1646.15, livelihood: 'Agriculture/Crops mixed with Coconut Plantation', area: 1.30 },
    { name: 'parena', pop_density: 2111.83, livelihood: 'Fishery/Fishponds and Mangroves', area: 0.381 },
    { name: 'piloro', pop_density: 535.71, livelihood: 'Agriculture/Crops mixed with Coconut Plantation', area: 1.12 },
    { name: 'ponong', pop_density: 47184, livelihood: 'Trading', area: 0.0515 },
    { name: 'rizal', pop_density: 703.38, livelihood: 'Agriculture/Crops mixed with Coconut Plantation', area: 0.5167 },
    { name: 'sagkahan', pop_density: 7238.97, livelihood: 'Agriculture/Crops mainly cereals and sugar', area: 0.741 },
    { name: 'san_isidro', pop_density: 73.7, livelihood: 'Agriculture/Crops mixed with Coconut Plantation', area: 4.85 },
    { name: 'san_juan', pop_density: 862.07, livelihood: 'Agriculture/Crops mixed with Coconut Plantation', area: 0.435 },
    { name: 'san_mateo', pop_density: 59494.17, livelihood: 'Fishery/Trading', area: 0.01897 },
    { name: 'santa_fe', pop_density: 1014.02, livelihood: 'Agriculture/Crops mixed with Coconut Plantation', area: 0.542 },
    { name: 'sawang', pop_density: 27300.35, livelihood: 'Trading', area: 0.0854 },
    { name: 'tagak', pop_density: 907.59, livelihood: 'Agriculture/Crops mixed with Coconut Plantation', area: 0.366 },
    { name: 'tangnan', pop_density: 2746.05, livelihood: 'Agriculture/Crops mixed with Coconut Plantation', area: 0.304 },
    { name: 'tigbao', pop_density: 864.0, livelihood: 'Agriculture/Crops mixed with Coconut Plantation', area: 0.676 },
    { name: 'tinaguban', pop_density: 527.38, livelihood: 'Agriculture/Crops mixed with Coconut Plantation', area: 2.52 },
    { name: 'upper_hiraan', pop_density: 776.56, livelihood: 'Agriculture/Crops mixed with Coconut Plantation', area: 1.28 },
    { name: 'upper_sogod', pop_density: 2648.2, livelihood: 'Agriculture/Crops mixed with Coconut Plantation', area: 0.2647 },
    { name: 'uyawan', pop_density: 1551.0, livelihood: 'Agriculture/Crops mainly cereals and sugar', area: 0.6667 },
    { name: 'west_visoria', pop_density: 9110.7, livelihood: 'Fishery', area: 0.1593 },
  ];

  private initMap(): void {
    this.baseLayers = {
      openstreetmap: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }),
      satellite: L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
        subdomains: ['mt0','mt1','mt2','mt3'],
        attribution: '© Google'
      }),
      topographic: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenTopoMap'
      })
    };

    this.map = L.map('map', {
      center: [11.232084301848886, 124.7057818628441],
      zoom: 12,
      zoomControl: false,
      attributionControl: false,
    });

    // Add the fullscreen control
    // this.map.addControl(new L.Control.Fullscreen({
    //   content: '<i class="fa fa-expand"></i>',
    //   title: {
    //     'false': 'View Fullscreen',
    //     'true': 'Exit Fullscreen'},
    //   contentCancel: '<i class="fa fa-compress"></i>',
    // }));
    L.control.fullscreen({
      content: '<i class="fa fa-expand"></i>',
      title: {
        'false': 'View Fullscreen',
        'true': 'Exit Fullscreen'},
      contentCancel: '<i class="fa fa-compress"></i>',
    }).addTo(this.map);

    // Add minimap
    const osmURL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    const osm2 = new L.TileLayer(osmURL, { minZoom: 6, maxZoom: 18 });
    const minimap = new L.Control.MiniMap(osm2, {
      position: 'bottomleft',
      toggleDisplay: true,
      minimized: true,
      hideText: true,
      showText: true});
    minimap.addTo(this.map);

    // Load GeoJSON data for different layers
    this.loadGeoJsonLayer('barangay', './assets/data/carigara/barangay.geojson');
    this.loadGeoJsonLayer('water_river', './assets/data/water_river.geojson');
    this.loadGeoJsonLayer('buildings', './assets/data/buildings.geojson');
    this.loadGeoJsonLayer('landcover', './assets/data/landcover.geojson');
    this.loadGeoJsonLayer('roads', './assets/data/roads.geojson');
    this.loadGeoJsonLayer('forest', './assets/data/forest.geojson');
    this.loadGeoJsonLayer('landslide', './assets/data/hazard_landslide.geojson');
    this.loadGeoJsonLayer('landslide_low', './assets/data/landslide/hazard_landslide_low.geojson');
    this.loadGeoJsonLayer('landslide_moderate', './assets/data/landslide/hazard_landslide_moderate.geojson');
    this.loadGeoJsonLayer('landslide_high', './assets/data/landslide/hazard_landslide_high.geojson');
    this.loadGeoJsonLayer('flood_high', './assets/data/flood/hazard_flood_high.geojson');
    this.loadGeoJsonLayer('flood_moderate', './assets/data/flood/hazard_flood_moderate.geojson');
    this.loadGeoJsonLayer('flood_low', './assets/data/flood/hazard_flood_low.geojson');
    this.loadGeoJsonLayer('flood_landslide', './assets/data/hazard_flood_landslide.geojson');

    L.control.scale({imperial: true,}).addTo(this.map);

    // Add double-click event listener
    this.map.on('dblclick', (event: L.LeafletMouseEvent) => this.onMapDoubleClick(event));
  }

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

  // Method to load a GeoJSON layer and add it to the map
  private loadGeoJsonLayer(layerKey: string, url: string) {
    this.fetchGeoJson(url)
      .then((data) => {
        const layer = L.geoJson(data, {
          style: (feature) => this.style(feature, layerKey),
          onEachFeature: (feature, layer) => this.onEachFeature(feature, layer, layerKey),
        });
        this.layers[layerKey] = layer;

        if (this.layerVisibility[layerKey]) {
          layer.addTo(this.map);
        }
      })
      .catch((error) => {
        console.error(`Failed to load GeoJSON from ${url}:`, error);
      });
  }

  // Method to toggle layer visibility based on checkbox state
  public toggleLayer(layerKey: string): void {
    const layer = this.layers[layerKey];
    this.layerVisibility[layerKey] = !this.layerVisibility[layerKey];

    if (layerKey === 'landslide_high' || layerKey === 'landslide_moderate' || layerKey === 'landslide_low') {
      if (!this.map.hasLayer(layer)) {
        this.map.addLayer(layer);
        // this.map.removeControl(this.info);
        // this.map.addControl(this.details);
        this.details.addTo(this.map);
        this.legend.addTo(this.map);
        // this.affectedBarangays.addTo(this.map);
      }
    } else if (layerKey === 'flood_high' || layerKey === 'flood_moderate' || layerKey === 'flood_low') {
      if (!this.map.hasLayer(layer)) {
        this.map.addLayer(layer);
        // this.map.removeControl(this.info);
        this.details.addTo(this.map);
        this.legend.addTo(this.map);
        // this.affectedBarangays.addTo(this.map);
      }
    } else {
      if (this.map.hasLayer(layer)) {
        this.map.removeLayer(layer);
        this.map.removeControl(this.legend);
        // this.map.removeControl(this.info);
      } else {
        this.map.addLayer(layer);
        // this.legend.addTo(this.map);
        this.info.addTo(this.map);
      }
    }
  }

  private generatePopup(center: any) {
    return `
      <div class="customPopup">
        <figure>
          <img src="${center.image}" alt="${center.name}">
          <figcaption>Barangay Evacuation Center</figcaption>
        </figure>
        <div>${center.venue}</div>
      </div>
    `;
  }

  private generateOfficial(center: any) {
    return `
      <div class="customPopup">
        <figure>
          <figcaption>Punong Barangay</figcaption>
        </figure>
        <div>${center.punongBarangay}</div>
      </div>
    `;
  }

  private pulseMarker (radius: Number, color: string, imageUrl: string) {
    const cssStyle = `
      width: ${radius}px;
      height: ${radius}px;
      background: ${color};
      color: ${color};
      box-shadow: 0 0 0 ${color};
    `

    return L.divIcon({
      html: `<div class="pulse">
          <img src="${imageUrl}" style="width: 25px; height: 41px; position: absolute; top: calc(50% - 20.5px); left: calc(50% - 12.5px);"/>
          <span style="${cssStyle}" class="pulse"/></span>
          </div>`,
      className: ''
    })
  }

  private markerControl(): void {
    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      minZoom: 3,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    });

    const googleSatelite = L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
      maxZoom: 18,
      minZoom: 3,
      subdomains:['mt0','mt1','mt2','mt3']
    });

    const openTopo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      minZoom: 3,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    });

    const mapRemover = L.layerGroup([]);

    //Custom Pulse Marker
    const pulseMarker = function (radius: Number, color: string, imageUrl: string) {
      const cssStyle = `
        width: ${radius}px;
        height: ${radius}px;
        background: ${color};
        color: ${color};
        box-shadow: 0 0 0 ${color};
      `

      return L.divIcon({
        html: `<div class="pulse">
            <img src="${imageUrl}" style="width: 25px; height: 41px; position: absolute; top: calc(50% - 20.5px); left: calc(50% - 12.5px);"/>
            <span style="${cssStyle}" class="pulse"/></span>
            </div>`,
        className: ''
      })
    }

    const pulseIcon = pulseMarker(10, 'green', './assets/images/guard.png');

    // With DB integration
    const popupMarkers = this.evacuationCenters.map((center) => {
      return L.marker(center.coords, { icon: pulseIcon })
        .bindPopup(this.generatePopup(center))
        .on("click", this.clickZoom.bind(this));
    });

    // Create a grouped layer from the markers
    const groupedEvacCenter = L.layerGroup(popupMarkers);

    const personIcon = L.icon({
      iconUrl: './assets/images/official.png',
      iconSize: [28, 35],
      iconAnchor: [12, 41],
      popupAnchor: [1, -41],
      shadowUrl: '',
    });

    // With DB integration
    const officialMarkers = this.evacuationCenters.map((center) => {
      return L.marker(center.coords, { icon: personIcon })
        .bindPopup(this.generateOfficial(center))
        .on("click", this.clickZoom.bind(this));
    });

    // Create a grouped layer from the markers
    const groupedOfficial = L.layerGroup(officialMarkers);

    const baseMaps = {'None': mapRemover,
                      "OpenStreetMap" : tiles,
                      "Google Satelite" : googleSatelite,
                      "Topography" : openTopo,
                    };
    const overLays = {"Evacuation Center": groupedEvacCenter,
                      "Punong Barangay"  : groupedOfficial,
                    };

    L.control.layers(baseMaps, overLays).addTo(this.map);
  }

  // Add legend with colors corresponding to each GeoJSON layer
  private addLegend(): void{
    if (this.legend) {
      this.map.removeControl(this.legend);
    }
    this.legend = new L.Control({ position: 'bottomright' });

    this.legend.onAdd = () => {
      const div = L.DomUtil.create('div', 'info legend');

      if (this.disasterType) {
        // var colors: string[] = ['#800000', '#6B8E23', '#FFFF00'];
        var colors: string[] = [
          this.coloringMap.landslide.high,
          this.coloringMap.landslide.moderate,
          this.coloringMap.landslide.low
        ];
        var labels: string[] = ['High', 'Moderate', 'Low'];

        var legendLabel = 'Landslide Hazard Level';

        if (this.disasterType.type == 'flood' || this.disasterType.type == 'typhoon') {
          legendLabel = 'Flood Hazard Level';

          var colors: string[] = [
            this.coloringMap.flood.high,
            this.coloringMap.flood.moderate,
            this.coloringMap.flood.low
            ];

          var labels: string[] = ['High', 'Moderate', 'Low'];
        }

        div.innerHTML += `<h1 class="text-sm font-bold leading-3 mt-2 mb-2 text-gray-800">${legendLabel}</h1>`;
        for (let i = 0; i < colors.length; i++) {
          div.innerHTML += `<div class="py-1">
            <i style="background:${colors[i]};"></i>
            <span>${labels[i]}</span>
          </div>`;
        }
      } else {
        // var grades: number[] = [0, 100, 300, 800, 1000, 1300, 2300, 3500];
        var labels: string[] = [];

        // for (let i = 0; i < grades.length; i++) {
        //   div.innerHTML += `<i style="background:${this.getColor(grades[i] + 1)}"></i> ` +
        //   grades[i] + (grades[i + 1] ? `&ndash;${grades[i + 1]}<br>` : '+');
        // }

        // Additional Layer Legend
        labels.push("<strong>Layer Legend</strong>");
        for (const layerKey in this.layerColors) {
          const color = this.layerColors[layerKey];
          const layerName = layerKey.charAt(0).toUpperCase() + layerKey.slice(1);
          labels.push(
            `<i style="background:${color}; color: ${color};"></i> ${layerName}`
          );
        }

        div.innerHTML = labels.join("<br>");
      }

      return div;
    };
  }

  // Add information control for feature properties
  private addInfoControl(): void {
    this.info = new L.Control({ position: 'topright' });

    this.info.onAdd = () => {
      this.info._div = L.DomUtil.create('div', 'info');
      this.info.updateInfo();
      return this.info._div;
    };

    this.info.updateInfo = (props?: any) => {
      if (!this.info._div) {
        // console.error('Info control div is not created');
        return;
      }

      this.info._div.innerHTML = 'Hover over a barangay and <br/>double click your location to <br/>show nearest evacuation centers.';
      if (props) {
        var barangayName = props.name
          // .split('_')
          // .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          // .join(' ')
          .split(' ') // Split the string into words by spaces
          .map((word: string) => word.toLowerCase()) // Convert each word to lowercase
          .join('_'); // Join the words with underscores
        ;

        var barangay = this.barangayDetails.find(detail => detail.name === barangayName);

        this.info._div.innerHTML =
          `<div><p class="font-semibold">Carigara, Leyte</p></div>`
          + `<p class="text-small">${props.name}</p>`
          + `<p class="pt-1 text-small font-semibold">Land Area</p>`
          + `<p class="text-small">${barangay?.area} sq. mi.</p>`
          + `<p class="pt-1 text-small font-semibold">Population Density</p>`
          + `<p class="text-small">${Number(barangay?.pop_density).toLocaleString()} people per sq. mi.</p>`
          + `<p class="pt-1 text-small font-semibold">Predominant Livelihood</p>`
          + `<p class="text-small">${barangay?.livelihood}</p>`
        ;
      }

      // this.info._div.innerHTML =
      //   '<div><span class="font-semibold">Carigara, Leyte</span><br/><span>Population Density</span></div>' +
      //   '<hr class="m-2">' +
      //   (props
      //     ? `<b>${props.name}</b><br />${Number(props.population).toLocaleString()} people`
      //     : 'Hover over a barangay and <br/>double click your location to <br/>show nearest evacuation centers.')
      // ;
    };

    this.info.addTo(this.map);
  }

  private addDetailsControl(layerKey?: any, category?: any): void {
    // Remove hazard details all the time
    return;

    this.details = new L.Control({ position: 'topleft' });

    this.details.onAdd = () => {
      this.details._div = L.DomUtil.create('div', 'details');
      this.details.updateDetails();
      return this.details._div;
    };

    this.details.updateDetails = (props?: any) => {
      if (!this.details._div) {
        return;
      }
      // this.details._div.innerHTML =
      //   '<h4>Carigara, Leyte</h4>' +
      //   (props
      //     ? `<b>${props.name}</b><br />${props.population} people`
      //     : 'Hover over a barangay');

      const isMobile = window.matchMedia('(max-width: 768px)').matches;

      if (isMobile) {
        this.details._div.classList.add('minimized');
      }

      // if (props !== undefined) {
      //   this.details._div.innerHTML = "<div class='m-2'>"
      //     + "<span class='font-bold'>Hazard Details</span>"
      //     + "<hr>";

      //   if (props.flood !== undefined && props.flood !== null) {
      //     this.details._div.innerHTML += "<span class='m-2 font-semibold'>Flood</span>";
      //     this.details._div.innerHTML += "<p class='mx-2'>" + props.flood + "</p>";
      //   }

      //   if (props.typhoon !== undefined && props.typhoon !== null) {
      //     this.details._div.innerHTML += "<span class='m-2 font-semibold'>Typhoon</span>";
      //     this.details._div.innerHTML += "<p class='mx-2'>" + props.typhoon + "</p>";
      //   }

      //   if (props.landslide !== undefined && props.landslide !== null) {
      //     this.details._div.innerHTML += "<span class='m-2 font-semibold'>Landslide</span>";
      //     this.details._div.innerHTML += "<p class='m-2'>" + props.landslide + "</p>";
      //   }

      //   if (props.rainfall !== undefined && props.rainfall !== null) {
      //     this.details._div.innerHTML += "<div class='m-2'>";
      //     this.details._div.innerHTML += "<p class='m-2 font-semibold'>Rainfall</p>";
      //     this.details._div.innerHTML += "<p class='mx-2 mt-2 font-semibold'>Range</p>";
      //     this.details._div.innerHTML += "<p class='mx-2'>" + props.rainfall.range + "</p>";
      //     this.details._div.innerHTML += "<p class='mx-2 mt-2 font-semibold'>Impact</p>";
      //     this.details._div.innerHTML += "<p class='mx-2'>" + props.rainfall.impact + "</p>";
      //     this.details._div.innerHTML += "</div>";
      //   }

      //   this.details._div.innerHTML += "</div>";
      // }

      if (props) {
        const hazardDetails = [];
        hazardDetails.push(`
          <div class='m-2'>
            <span class='font-bold'>Hazard Details</span>
            <hr>
        `);

        if (props.flood) {
          hazardDetails.push(`
            <span class='m-2 font-semibold'>Flood</span>
            <p class='mx-2'>${props.flood}</p>
          `);
        }

        if (props.typhoon) {
          hazardDetails.push(`
            <span class='m-2 font-semibold'>Typhoon</span>
            <p class='mx-2'>${props.typhoon}</p>
          `);
        }

        if (props.landslide) {
          hazardDetails.push(`
            <span class='m-2 font-semibold'>Landslide</span>
            <p class='m-2'>${props.landslide}</p>
          `);
        }

        if (props.rainfall) {
          hazardDetails.push(`
            <div class=''>
              <p class='m-2 font-semibold'>Rainfall</p>
              <p class='mx-2 mt-2 font-semibold'>Range</p>
              <p class='mx-2'>${props.rainfall.range}</p>
              <p class='mx-2 mt-2 font-semibold'>Impact</p>
              <p class='mx-2'>${props.rainfall.impact}</p>
            </div>
          `);
        }

        hazardDetails.push(`</div>`);
        this.details._div.innerHTML = hazardDetails.join('');
      }
    };
  }

  private addAffectedBarangaysControl(): void {
    this.affectedBarangays = new L.Control({ position: 'topright' });

    this.affectedBarangays.onAdd = () => {
      this.affectedBarangays._div = L.DomUtil.create('div', 'affected-brgy-details');
      this.affectedBarangays.updateDetails();
      return this.affectedBarangays._div;
    };

    this.affectedBarangays.updateDetails = (props?: any) => {
      if (!this.affectedBarangays._div) {
        return;
      }

      if (props !== undefined) {
        this.affectedBarangays._div.innerHTML = "<div class='m-2'>"
          + "<span class='font-bold'>Affected Barangays</span>"
          + "<hr>";

        if (props.barangays !== undefined) {
          const barangayList = props.barangays
            .map((barangay: string) =>
              barangay
                .replace(/_/g, ' ') // Replace underscores with spaces
                .split(' ') // Split the string into words
                .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize each word
                .join(' ') // Join the words back into a single string
            )
            .join(', '); // Join all barangays with a comma and space

          // Add the list to the div
          this.affectedBarangays._div.innerHTML += `
            <div class='m-2'>
              <p class=''>${barangayList}</p>
            </div>
          `;

          // Close the flex container
          this.affectedBarangays._div.innerHTML += "</div>";
        }
      }
    };
  }

  private getColor(d: number): string{
    return d > 5500 ? '#004529' :
           d > 3500 ? '#006837' :
           d > 2300 ? '#238443' :
           d > 1300 ? '#41ab5d' :
           d > 1000 ? '#78c679' :
           d > 800  ? '#addd8e' :
           d > 300  ? '#d9f0a3' :
           d > 100  ? '#f7fcb9' :
                      '#ffffe5';
  }

  // Style features rendered to map
  private style(feature: any, layerKey: string) {
    if (layerKey === 'barangay'){
      return {
        // fillColor: this.getColor(feature.properties.population),
        fillColor: this.coloringMap.barangay,
        weight: 1.5,
        opacity: 1,
        color: '#FEFEFE',
        dashArray: '3',
        fillOpacity: 1
      };
    } else if (layerKey === 'landslide_high') {
      return {
        fillColor: this.coloringMap.landslide.high,
        weight: 1,
        opacity: 1,
        color: this.coloringMap.landslide.high,
        dashArray: '3',
        fillOpacity: 0.7
      };
    } else if (layerKey === 'landslide_moderate') {
      return {
        fillColor: this.coloringMap.landslide.moderate,
        weight: 1,
        opacity: 1,
        color: this.coloringMap.landslide.moderate,
        dashArray: '3',
        fillOpacity: 0.7
      };
    } else if (layerKey === 'landslide_low') {
      return {
        fillColor: this.coloringMap.landslide.low,
        weight: 1,
        opacity: 1,
        color: this.coloringMap.landslide.low,
        dashArray: '3',
        fillOpacity: 0.7
      };
    } else if (layerKey === 'flood_high') {
      return {
        fillColor: this.coloringMap.flood.high,
        weight: 1,
        opacity: 1,
        color: this.coloringMap.flood.high,
        dashArray: '3',
        // fillOpacity: 0.7
      };
    } else if (layerKey === 'flood_moderate') {
      return {
        fillColor: this.coloringMap.flood.moderate,
        weight: 1,
        opacity: 1,
        color: this.coloringMap.flood.moderate,
        dashArray: '3',
        fillOpacity: 0.7
      };
    } else if (layerKey === 'flood_low') {
      return {
        fillColor: this.coloringMap.flood.low,
        weight: 1,
        opacity: 1,
        color: this.coloringMap.flood.low,
        dashArray: '3',
        // fillOpacity: 0.7
      };
    }

    return {
      weight: (layerKey === 'roads' || layerKey === 'water_river') ? 2 : 1,
      fillOpacity: 10,
      color: this.layerColors[layerKey],
      dashArray: '',
    };
  }

  private onEachFeature(feature: any, layer: any, layerKey: string): void {
    var layerExceptions = [
      'roads',
      'waterways'
    ];

    // if (layerKey !== 'roads' && layerKey !== 'waterways') {
    //   layer.on({
    //     mouseover: this.highlightFeature.bind(this),
    //     mouseout: this.resetHighlight.bind(this),
    //   });
    // }

    if (layerKey === 'barangay') {
      const barangayName = feature.properties.name;
      if (barangayName) {
        this.barangayPolygons[barangayName] = feature;
      }

      layer.on({
        mouseover: this.highlightFeature.bind(this),
        mouseout: this.resetHighlight.bind(this),
      });
    }

    layer.on({
      click: this.zoomToFeature.bind(this),
    });
  }

  // Highlight feature on mouseover
  private highlightFeature(e: any) {
    const layer = e.target;
    // layer.setStyle({
    //   weight: 3,
    //   color: '#666',
    //   dashArray: '',
    //   fillOpacity: 0.8,
    // });
    //layer.bringToFront();
    this.info.updateInfo(layer.feature.properties);
  }

  // Reset highlight when mouseout
  private resetHighlight(e: any) {
    const layer = e.target;
    this.layers['barangay'].resetStyle(layer);
    // this.info.updateInfo(layer.feature.properties);
    this.info.updateInfo();
  }

  // Zoom to the feature on click
  private zoomToFeature(e: any) {
    const layer = e.target;
  }

  // Center map when click on marker
  private clickZoom(e: any) {
    this.map.setView(e.target.getLatLng(), 14);
  }

  private onMapDoubleClick(event: L.LeafletMouseEvent): void {
    // Clear previous nearest markers from the map
    this.clearNearestEvacuationMarkers();

    if (this.currentMarker) {
      // Remove the existing marker if present
      this.map?.removeLayer(this.currentMarker);
    }

    // Add a new marker at the clicked location
    this.currentMarker = L.marker([event.latlng.lat, event.latlng.lng], {
      icon: this.defaultIcon,
    })
      .addTo(this.map)
      // .bindPopup(`Coordinates: ${event.latlng.lat}, ${event.latlng.lng}`)
      // .openPopup()
      ;

    // Find the nearest locations
    const nearestLocations = this.findNearestLocations(event.latlng, 5);
    nearestLocations.forEach(({ location, distance}) => {
      const coords: [number, number] = [location.coords[0], location.coords[1]];
      const pulseIcon = this.makePulseIcon(10, 'green', './assets/images/guard.png');
      // const nearestMarker = L.marker(coords, { icon: pulseIcon }).addTo(this.map).bindPopup(location.name).openPopup();
      const nearestMarker = L.marker(coords, { icon: pulseIcon }).addTo(this.map);

      // Create the custom popup HTML content
      const popupContent = `
          <div class="customPopup">
              <figure>
                  <img src="${location.image}" alt="Car">
                  <figcaption>Barangay Evacuation Center</figcaption>
              </figure>
              <div>${location.venue}</div>
              <div>Distance: ${distance.toFixed(2)} km</div>
          </div>
      `;

      // Bind the custom popup to the marker
      nearestMarker.bindPopup(popupContent).openPopup();
      this.nearestEvacuationMarkers.push(nearestMarker); // Store reference to the marker
    });

    this.currentMarker.on('click', () => {
      this.map?.removeLayer(this.currentMarker);
      this.clearNearestEvacuationMarkers();
    });
  }

  private clearNearestEvacuationMarkers() {
    // Remove all nearest markers from the map
    this.nearestEvacuationMarkers.forEach(marker => {
      this.map.removeLayer(marker);
    });
    this.nearestEvacuationMarkers = []; // Clear the array
  }

  private findNearestLocations(latlng: any, count: number) {
    const distances = this.evacuationCenters.map(location => {
      const distance = this.calculateDistance(latlng.lat, latlng.lng, location.coords[0], location.coords[1]);
      return { location, distance };
    });

    // Sort by distance and get the top N
    distances.sort((a, b) => a.distance - b.distance);
    // return distances.slice(0, count).map(d => d.location);
    return distances.slice(0, count);
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the Earth in km

    const dLat = this.degreesToRadians(lat2 - lat1);
    const dLon = this.degreesToRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degreesToRadians(lat1)) * Math.cos(this.degreesToRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }

  private degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private makePulseIcon(radius: Number, color: string, imageUrl: string) {
    const cssStyle = `
      width: ${radius}px;
      height: ${radius}px;
      background: ${color};
      color: ${color};
      box-shadow: 0 0 0 ${color};
    `

    return L.divIcon({
      html: `<div class="pulse">
          <img src="${imageUrl}" style="width: 25px; height: 41px; position: absolute; top: calc(50% - 20.5px); left: calc(50% - 12.5px);"/>
          <span style="${cssStyle}" class="pulse"/></span>
          </div>`,
      className: ''
    })
  }

  public zoomToBarangay(event: { id: number, barangay: string, coordinates: [number, number] }): void {
    if (this.map) {
      console.log("this.selectedBarangay", this.selectedBarangay);
      console.log("event.id", event.id);
      if (this.selectedBarangay === event.id) {
        this.selectedBarangay = null;
        this.map.setView([11.232084301848886, 124.7057818628441], 12);  // zoom out + clear highlight

        return;
      }

      this.map.setView(event.coordinates, 15);
      this.highlightBarangay(event.barangay, event.coordinates);
    }
  }

  public highlightBarangay(barangayName: string, coordinates: any[]): void {
    if (this.highlightLayer) {
      this.map.removeLayer(this.highlightLayer);
    }

    const barangayGeoJSON = this.barangayPolygons[barangayName];
    if (barangayGeoJSON) {
      this.highlightLayer = L.geoJSON(barangayGeoJSON, {
        style: {
          color: 'yellow',
          weight: 3,
          fillOpacity: 0.3,
        },
      }).addTo(this.map);

      this.map.fitBounds(this.highlightLayer.getBounds());

      // Calculate the center of the barangay
      const center = this.calculateCentroid(barangayGeoJSON.geometry);

      if (this.labelMarker) {
        this.map.removeLayer(this.labelMarker);
        this.labelMarker = null; // Reset to avoid dangling references
      }

      // Add a label at the center
      this.labelMarker = L.marker(center, {
        icon: L.divIcon({
          className: 'barangay-label',
          html: `<span>${barangayName}</span>`,
          iconSize: [0, 0], // No default marker size
        }),
      }).addTo(this.map);
    }
  }

  private calculateCentroid(geometry: any): [number, number] {
    let totalLat = 0;
    let totalLng = 0;
    let points = 0;

    if (geometry.type === 'Polygon') {
      // Process the first ring of the polygon
      geometry.coordinates[0].forEach((point: [number, number]) => {
        totalLng += point[0];
        totalLat += point[1];
        points++;
      });
    } else if (geometry.type === 'MultiPolygon') {
      // Process the first polygon of the multipolygon
      geometry.coordinates[0][0].forEach((point: [number, number]) => {
        totalLng += point[0];
        totalLat += point[1];
        points++;
      });
    } else {
      throw new Error('Unexpected geometry type: ' + geometry.type);
    }

    return [totalLat / points, totalLng / points];
  }

  public initEvacuationCenterLayer() : void {
    const pulseIcon = this.pulseMarker(10, 'green', './assets/images/guard.png');
    const popupMarkers = this.evacuationCenters.map((center) => {
      return L.marker(center.coords, { icon: pulseIcon })
        .bindPopup(this.generatePopup(center))
        .on("click", this.clickZoom.bind(this));
    });

    this.evacuationCenterLayer = L.layerGroup(popupMarkers);
  }

  public initBarangayOfficialLayer() : void {
    const personIcon = L.icon({
      iconUrl: './assets/images/official.png',
      iconSize: [28, 35],
      iconAnchor: [12, 41],
      popupAnchor: [1, -41],
      shadowUrl: '',
    });

    const officialMarkers = this.barangayOfficials.map((person) => {
      return L.marker(person.coords, { icon: personIcon })
        .bindPopup(this.generateOfficial(person))
        .on("click", this.clickZoom.bind(this));
    });

    this.barangayOfficialLayer = L.layerGroup(officialMarkers);
  }

  public toggleEvacuationCenters() {
    if (!this.evacuationCenterLayer) return; // guard

    this.showEvacuationCenters = !this.showEvacuationCenters;
    if (this.showEvacuationCenters) {
      this.evacuationCenterLayer.addTo(this.map);
    } else {
      this.map.removeLayer(this.evacuationCenterLayer);
    }
  }

  public toggleBarangayOfficials() {
    console.log(this.barangayOfficialLayer);
    console.log(this.showBarangayOfficials);
    if (!this.barangayOfficialLayer) return; // guard

    this.showBarangayOfficials = !this.showBarangayOfficials;
    if (this.showBarangayOfficials) {
      this.barangayOfficialLayer.addTo(this.map);
    } else {
      this.map.removeLayer(this.barangayOfficialLayer);
    }
  }

  @ViewChild('map')
  private mapContainer!: ElementRef<HTMLElement>;

  constructor(
    private router: Router,
    private disasterService: DisasterService,
    private breakPointObserver: BreakpointObserver,
    private barangayService: BarangayService,
    private evacuationCenterService: EvacuationCenterService,
    private barangayOfficialService: BarangayOfficialService,
    private authService: AuthService,
  ) {
    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationEnd) {
        if (this.mainContent) {
          this.mainContent!.scrollTop = 0;
        }
      }
    });
  }

  ngOnInit(): void {
    this.mainContent = document.querySelector('.main-content');

    this.loadBarangays();
    this.loadMarkers();

    this.disasterTypeSubscription = this.disasterService.disasterType$.subscribe(
      (disasterType) => {
        if (disasterType) {
          this.disasterType = disasterType;
          this.handleDisasterTypeChange();
        }
      }
    );

    this.breakPointObserver.observe([Breakpoints.Handset]).subscribe(result => {
      this.isMobile = result.matches;
      if (this.isMobile) {
        this.isHazardDetailsMinimized = true; // Minimize on mobile
      }
    });

    this.isLoggedIn = this.authService.isLoggedIn();

    if (!this.isLoggedIn) {
      this.startTour();
    }
  }

  ngAfterViewInit(): void {
    this.initMap();
    // this.markerControl();
    // this.addLegend();
    // this.addInfoControl();
    // this.addDetailsControl();
    // this.addAffectedBarangaysControl();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }

    if (this.disasterTypeSubscription) {
      this.disasterTypeSubscription.unsubscribe();
    }
  }

  handleDisasterTypeChange(): void {
    if (this.disasterType && this.map) {
      if (this.highlightLayer) {
        this.map.removeLayer(this.highlightLayer);
      }

      if (this.labelMarker) {
        this.map.removeLayer(this.labelMarker);
      }

      this.map.setView([11.232084301848886, 124.7057818628441], 12);

      if (!this.toggleControl && this.disasterType.type != 'layer') {
        this.addToggleIcon();
        // this.map.removeLayer(this.toggleControl);
      }

      // console.log('Updating map with type:', this.disasterType.type);
      if (this.disasterType.type == 'landslide') {
        this.map.removeLayer(this.layers['flood_low']);
        this.map.removeLayer(this.layers['flood_moderate']);
        this.map.removeLayer(this.layers['flood_high']);

        if (this.disasterType.category == 'category4') {
          this.map.removeLayer(this.layers['landslide_low']);
          this.map.removeLayer(this.layers['landslide_moderate']);

          if (this.map.hasLayer(this.layers['landslide_high'])) {
            this.map.removeLayer(this.layers['landslide_high'])

            this.map.removeControl(this.details);
            this.map.removeControl(this.affectedBarangays);
            this.map.removeControl(this.legend);
          } else {
            this.toggleLayer('landslide_high');

            this.details.updateDetails({
              landslide: this.hazardRiskDetails.landslide.high
            });

            this.affectedBarangays.updateDetails({
              barangays: this.hazardAffectedBarangays.landslide.highly_susceptible
            });
          }

        } else if (this.disasterType.category == 'category3' || this.disasterType.category == 'category2') {
          this.map.removeLayer(this.layers['landslide_low']);
          this.map.removeLayer(this.layers['landslide_high']);

          if (this.map.hasLayer(this.layers['landslide_moderate'])) {
            this.map.removeLayer(this.layers['landslide_moderate'])

            this.map.removeControl(this.details);
            this.map.removeControl(this.affectedBarangays);
            this.map.removeControl(this.legend);
          } else {
            this.toggleLayer('landslide_moderate');

            this.details.updateDetails({
              landslide: this.hazardRiskDetails.landslide.moderate
            });

            this.affectedBarangays.updateDetails({
              barangays: this.hazardAffectedBarangays.landslide.moderately_susceptible
            });
          }

        } else {
          this.map.removeLayer(this.layers['landslide_moderate']);
          this.map.removeLayer(this.layers['landslide_high']);

          if (this.map.hasLayer(this.layers['landslide_low'])) {
            this.map.removeLayer(this.layers['landslide_low'])

            this.map.removeControl(this.details);
            this.map.removeControl(this.affectedBarangays);
            this.map.removeControl(this.legend);
          } else {
            this.toggleLayer('landslide_low');

            this.details.updateDetails({
              landslide: this.hazardRiskDetails.landslide.low
            });

            this.affectedBarangays.updateDetails({
              barangays: this.hazardAffectedBarangays.landslide.less_likely_to_experience
            });
          }
        }
      } else if (this.disasterType.type == 'flood') {
        this.map.removeLayer(this.layers['landslide_low']);
        this.map.removeLayer(this.layers['landslide_moderate']);
        this.map.removeLayer(this.layers['landslide_high']);
        this.toggleLayer('flood_low');
        this.toggleLayer('flood_moderate');
        this.toggleLayer('flood_high');

        // this.details.updateDetails(this.hazardRiskDetails.landslide.low);
        this.map.removeControl(this.details);

      } else if (this.disasterType.type == 'typhoon') {
        this.map.removeLayer(this.layers['landslide_low']);
        this.map.removeLayer(this.layers['landslide_moderate']);
        this.map.removeLayer(this.layers['landslide_high']);

        if (this.disasterType.category == 'category5') {
          this.map.removeLayer(this.layers['flood_low']);
          this.map.removeLayer(this.layers['flood_moderate']);

          if (this.map.hasLayer(this.layers['flood_high'])) {
            this.map.removeLayer(this.layers['flood_high'])

            this.map.removeControl(this.details);
            this.map.removeControl(this.affectedBarangays);
            this.map.removeControl(this.legend);
          } else {
            this.toggleLayer('flood_high');

            this.details.updateDetails({
              flood: this.hazardRiskDetails.flood.high,
              typhoon: this.hazardCategoryDetails.typhoon.super_typhoon,
              rainfall: this.typhoonRainfallImpactDetails.super_typhoon
            });

            this.affectedBarangays.updateDetails({
              barangays: this.hazardAffectedBarangays.typhoon.super_typhoon
            });
          }

        } else if (this.disasterType.category == 'category4' || this.disasterType.category == 'category3') {
          this.map.removeLayer(this.layers['flood_low']);
          this.map.removeLayer(this.layers['flood_high']);

          if (this.map.hasLayer(this.layers['flood_moderate'])) {
            this.map.removeLayer(this.layers['flood_moderate'])

            this.map.removeControl(this.details);
            this.map.removeControl(this.affectedBarangays);
            this.map.removeControl(this.legend);
          } else {
            this.toggleLayer('flood_moderate');

            this.details.updateDetails({
              flood: this.hazardRiskDetails.flood.moderate,
              typhoon: (this.disasterType.category == 'category4') ? this.hazardCategoryDetails.typhoon.typhoon : this.hazardCategoryDetails.typhoon.severe_tropical_storm,
              rainfall: (this.disasterType.category == 'category4') ? this.typhoonRainfallImpactDetails.typhoon : this.typhoonRainfallImpactDetails.severe_tropical_storm,
            });

            this.affectedBarangays.updateDetails({
              barangays: this.hazardAffectedBarangays.typhoon.typhoon
            });
          }
        } else if (this.disasterType.category == 'category2' || this.disasterType.category == 'category1') {
          this.map.removeLayer(this.layers['flood_moderate']);
          this.map.removeLayer(this.layers['flood_high']);

          if (this.map.hasLayer(this.layers['flood_low'])) {
            this.map.removeLayer(this.layers['flood_low'])

            this.map.removeControl(this.details);
            this.map.removeControl(this.affectedBarangays);
            this.map.removeControl(this.legend);
          } else {
            this.toggleLayer('flood_low');

            this.details.updateDetails({
              flood: this.hazardRiskDetails.flood.low,
              typhoon: (this.disasterType.category == 'category2') ? this.hazardCategoryDetails.typhoon.tropical_storm : this.hazardCategoryDetails.typhoon.tropical_depression,
              rainfall: (this.disasterType.category == 'category2') ? this.typhoonRainfallImpactDetails.tropical_storm : this.typhoonRainfallImpactDetails.tropical_depression,
            });

            this.affectedBarangays.updateDetails({
              barangays: this.hazardAffectedBarangays.typhoon.tropical_depression
            });
          }
        } else {
          this.map.removeLayer(this.layers['landslide_low']);
          this.map.removeLayer(this.layers['landslide_moderate']);
          this.map.removeLayer(this.layers['landslide_high']);
          this.map.removeLayer(this.layers['flood_low']);
          this.map.removeLayer(this.layers['flood_moderate']);
          this.map.removeLayer(this.layers['flood_high']);
        }
      } else if (this.disasterType.type == 'layer') {
        if (this.disasterType.category == 'barangay') {
          this.toggleLayer('barangay');
        } else if (this.disasterType.category == 'water') {
          this.toggleLayer('water_river');
        } else if (this.disasterType.category == 'building') {
          this.toggleLayer('buildings');
        } else if (this.disasterType.category == 'landcover') {
          this.toggleLayer('landcover');
        } else if (this.disasterType.category == 'road') {
          this.toggleLayer('roads');
        } else if (this.disasterType.category == 'forest') {
          this.toggleLayer('forest');
        }
      }
    }
  }

  public startTour() {
    const intro = introJs();

    intro.setOptions({
      steps: [
        {
          element: '#welcome',
          intro: '<div class="tooltip-content"> <img src="assets/images/hello.svg" alt="Welcome Illustration" class="welcome-image"><p> Welcome to the GISMDS app! Navigate this tool to explore flood and landslide-prone areas for informed disaster preparedness and community safety.</p></div> ',
          position: 'bottom'
        },
        {
          element: '#hazard-section',
          intro:`
                <div style="display: flex; align-items: center;">
                <p style="margin: 0; line-height: 1.5;">
                  Here, you can choose the type of hazard you are concerned about, such as typhoon categories along with floods, or landslides. Additionally, you can select the severity level to refine the details and focus on specific risk levels.
                </p>
                  <img src="assets/images/map.svg" style="width: 200px; height: 200px; margin-right: 5px; border-radius: 8px;">

                </div>`,
          tooltipClass: 'customTooltip',
          position: 'left'
        },
        {
          element: '#layers-section',  // Section where users can add more details
          intro: `
                  <div style="display: flex; align-items: center;">
                    <img src="assets/images/way.svg" style="width: 200px; height: 200px; margin-right: 5px; border-radius: 8px;">
                    <p style="margin: 0; line-height: 1.5;">
                      The layers section allows you to add detailed thematic layers of information to the map. These include data such as roads, barangay boundaries, and more for comprehensive view for analysis.
                    </p>
                  </div>`,
          tooltipClass: 'customTooltip',
          position: 'left'
        },
        // {
        //   element: '#additional-map-layers',  // Section where more map layers are available
        //   intro: "This section provides additional map layers, such as satellite imagery, topography, and other map types. You can overlay these on the hazard map to get a more detailed and accurate view of the area you're concerned about.",
        //   position: 'top'
        // },
        {
          element: '#sidebar-details',
          intro: `
                  <div style="display: flex; align-items: center;">
                  <p style="margin: 0; line-height: 1.5;">
                      In this section, you can view the susceptibility of different areas to various hazards. This includes detailed risk assessments based on historical data, local geography, and more, helping you understand which areas are most at risk.
                    </p>
                    <img src="assets/images/details.svg" style="width: 230px; height: 230; margin-right: 5px; border-radius: 8px;">
                  </div>`,
          tooltipClass: 'customTooltip',
          position: 'right'
        }
      ],
      showProgress: false,
      showButtons: true,
      exitOnOverlayClick: false,
      nextLabel: 'Next',
      prevLabel: 'Back',
      // skipLabel: 'Skip Tour'
    });

    intro.start();
  }

  toggleHazardDetails(): void {
    this.isHazardDetailsMinimized = !this.isHazardDetailsMinimized;
  }

  addToggleIcon(): void {
    if (!this.map) {
      console.error('Map is not initialized.');
      return;
    }

    if (!this.isMobile) {
      return;
    }

    const ToggleControl = L.Control.extend({
      onAdd: () => {
        const div = L.DomUtil.create('div', 'map-toggle-icon');
        div.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        `;
        div.style.cursor = 'pointer';
        div.style.width = '30px';
        div.style.height = '30px';
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.justifyContent = 'center';

        // Add click event to toggle the visibility of the details section
        div.onclick = () => {
          this.isHazardDetailsMinimized = !this.isHazardDetailsMinimized;

          if (this.details._div.classList.contains('minimized')) {
            this.details._div.classList.remove('minimized')
          } else {
            this.details._div.classList.add('minimized');
          }
        };

        return div;
      }
    });

    this.toggleControl = new ToggleControl({ position: 'topleft' });
    this.toggleControl.addTo(this.map);
  }

  private loadBarangays(): void {
    // this.barangayService.getBarangays().subscribe({
    //   next: (response: BarangayResponse) => {
    //     // this.barangays = data.map((brgy: Barangay) => ({
    //     //   name: brgy.name,
    //     //   slug: brgy.slug
    //     // }));
    //     this.barangays = response.barangays;
    //     this.barangays.sort((a, b) => a.name.localeCompare(b.name));
    //   },
    //   error: (err) => {
    //     console.error('Error fetching barangay details:', err);
    //   }
    // });
    this.barangayService.getAllBarangays().subscribe({
      next: (response) => {
        this.barangays = response;
        this.barangays.sort((a, b) => a.name.localeCompare(b.name));
      },
      error: (err) => {
        console.error('Error fetching barangay details:', err);
      }
    });
  }

  private loadMarkers(): void {
    this.evacuationCenterService.getAllEvacuationCenters().subscribe({
      next: (response) => {
        this.evacuationCenters = response.map((center: any) => ({
          name: center.name.toLowerCase(),
          coords: [parseFloat(center.latitude.toString()), parseFloat(center.longitude.toString())],
          venue: center.venue,
          image: center.image ? './assets/images/' + center.image : ''
        }));

        this.barangayOfficials = response.map((center: any) => ({
          name: center.official?.name,
          position: center.official?.position,
          coords: [parseFloat(center.latitude.toString()), parseFloat(center.longitude.toString())]
        }));

        if (this.map) {
          // Hide this for now since contents are already displayed above the map
          // this.markerControl();

          this.addLegend();
          this.addInfoControl();
          this.addDetailsControl();
          this.addAffectedBarangaysControl();

          // Build layer once data is available
          this.initEvacuationCenterLayer();
          this.initBarangayOfficialLayer();
        }
      },
      error: (err) => {
        console.error('Error fetching evacuation centers:', err);
      }
    });
  }

  onBarangayFilterChange(event: any): void {
    const selectedId = +event.target.value;

    console.log(this.barangays);

    console.log('Selected Barangay:', this.selectedBarangay);
    // Later: zoom to this barangay using coordinates from API or stored geojson
  }

  onMapTypeChange(event: any): void {
    const selectedType = event.target.value;

    // Remove existing tile layer
    this.map.eachLayer((layer: any) => {
      if (layer instanceof L.TileLayer) {
        this.map.removeLayer(layer);
      }
    });

    // Add the selected tile layer
    if (selectedType !== 'null') {
      this.baseLayers[selectedType].addTo(this.map);
    }

    this.selectedMapType = selectedType;
  }

  toggleFilterPopup() {
    this.showFilterPopup = !this.showFilterPopup;
  }
}
