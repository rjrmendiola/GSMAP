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
import { filter, Subscription } from 'rxjs';
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
import { MapTypeService } from 'src/app/core/services/maptype.service';
import { DssFilterComponent } from './components/map/dss-filter/dss-filter.component';
import { DssAlertModalComponent } from './components/map/dss-alert-modal/dss-alert-modal.component';
import { DssDecisionModalComponent } from './components/map/dss-decision-modal/dss-decision-modal.component';
import { DssEvacuationModalComponent } from './components/map/dss-evacuation-modal/dss-evacuation-modal.component';
import { SlopeService } from 'src/app/core/services/slope.service';
import { SoilMoistureService } from 'src/app/core/services/soil-moisture.service';
import { FeatureCollection, GeoJsonObject } from 'geojson';
import { HazardDetectorService } from 'src/app/core/services/hazard-detector.service';
import { BarangaySelectionService } from 'src/app/core/services/barangay-selection.service';
import { BarangayDetailsService } from 'src/app/core/services/barangay-details.service';
import { BarangayTypeaheadComponent } from './components/sidebar/components/barangay-typeahead/barangay-typeahead.component';
import { SimulationService } from 'src/app/core/services/simulation.service';
import { SimulationParams } from 'src/app/core/models/simulation.model';
import { WeatherService } from './services/weather.service';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
  standalone: true,
  imports: [SidebarComponent, NavbarComponent, RouterOutlet, FooterComponent, SidebarDetailsComponent, DssFilterComponent, DssAlertModalComponent, DssDecisionModalComponent, DssEvacuationModalComponent, FormsModule, CommonModule],
  encapsulation: ViewEncapsulation.None,
})
export class LayoutComponent implements OnInit, AfterViewInit, OnDestroy {
  // @Input() disasterType!: { type: string; category?: string };
  private disasterTypeSubscription!: Subscription;
  private mapTypeSubscription!: Subscription;

  disasterType!: { type: string; category?: string };
  mapType!: { type: string; };

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
  private nearestEvacuationCentersLayer: L.LayerGroup | null = null;

  // Livelihood color mapping
  private livelihoodColors: { [key: string]: string } = {
    'Agriculture/Crops mixed with Coconut Plantation': '#90EE90', // Light green
    'Agriculture/Crops mainly sugar': '#FFD700', // Gold
    'Agriculture/Crops mainy cereals and sugar': '#FFA500', // Orange (typo in data)
    'Agriculture/Crops mainly cereals and sugar': '#FFA500', // Orange
    'Agriculture/Coconut Plantation': '#32CD32', // Lime green
    'Fishery': '#4169E1', // Royal blue
    'Fishery/Trading': '#1E90FF', // Dodger blue
    'Fishery/Fish Ponds and Mangroves': '#00CED1', // Dark turquoise
    'Fishery/Fishponds and Mangroves': '#00CED1', // Dark turquoise (alternative spelling)
    'Trading': '#FF6347', // Tomato red
  };

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
    },
    slope: {
      low: '#FF5F1F',
      moderate: '#DFFF00',
      high: '#0000FF'
    },
    soilmoisture: {
      low: '#FF5F1F',
      moderate: '#DFFF00',
      high: '#0000FF'
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
    neighboring_municipalities: true,  // Show neighboring municipalities by default
    water_river: true,  // Show water bodies by default
    buildings: true,  // Show buildings by default
    landcover: false,
    roads: true,  // Show roads by default
    forest: true,  // Show forests by default
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

  // highlightedBarangays: string[] = [];
  // highlightedBarangays: number[] = [];

  evacuationCenterLayer: L.LayerGroup | null = null;
  barangayOfficialLayer: L.LayerGroup | null = null;

  showEvacuationCenters = false;
  showBarangayOfficials = false;

  filters = {
    evacuationCenters: false,
    officials: false,
  };

  selectedFloodFilter: string | null = null;
  selectedLandslideFilter: string | null = null;
  selectedBarangayFilter: string = 'all';
  selectedMapTypeFilter: string = '';
  selectedBarangaysFilter: number[] = [];

  isDssFilterModalOpen = false;
  isDssAlertModalOpen = false;
  isDssDecisionModalOpen = false;
  isDssEvacuationModalOpen = false;

  selectedBarangayName: string | null = null;

  highlightBarangayLayer!: L.LayerGroup | null;
  barangayFeatureMap = new Map<number, any>();
  barangayLayerMap = new Map<number, L.Layer>();

  barangayLabelLayer!: L.LayerGroup;

  // Simulation state
  isSimulationActive: boolean = false;
  isSimulationPaused: boolean = false;
  simulationParams: SimulationParams | null = null;
  currentSimulationTime: number = 0;
  private simulationInterval: any = null;
  private rainLayer: L.LayerGroup | null = null;
  private simulationSubscription?: Subscription;

  // Weather layers state
  private weatherData: { [barangay: string]: any } = {};
  private weatherRainLayer: L.LayerGroup | null = null;
  private showWeatherLayers: boolean = true; // Show weather layers when not simulating
  private weatherRefreshInterval: any = null; // Interval for real-time weather updates

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
  public barangayDetails = [
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
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
      maxBounds: [
        [11.0, 124.5],  // Southwest corner (includes neighboring towns)
        [11.5, 124.9]   // Northeast corner
      ],
      maxBoundsViscosity: 1.0
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

    this.loadAPIGeoJsonLayer('slope', '/api/slopes/geojson');
    this.loadAPIGeoJsonLayer('soil_moisture', '/api/soilmoistures/geojson');

    L.control.scale({imperial: true,}).addTo(this.map);

    // Add highlight pane
    // this.map.createPane('highlightPane');
    // this.map.getPane('highlightPane')!.style.zIndex = '650';

    // this.highlightBarangayLayer = L.layerGroup().addTo(this.map);
    this.barangayLabelLayer = L.layerGroup().addTo(this.map);

    // Double-click event listener removed - no longer needed

    // Set openstreetmap as map's default baselayer
    this.baseLayers['openstreetmap'].addTo(this.map);

    // Add map background click handler for clearing selection
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const target = (e.originalEvent as any).target as HTMLElement;
      if (target.classList.contains('leaflet-container') ||
          target.classList.contains('leaflet-tile') ||
          target.classList.contains('leaflet-tile-pane')) {
        this.clearBarangaySelection();
      }
    });
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

          // For barangay layer, refresh styles after loading to ensure livelihood colors are applied
          if (layerKey === 'barangay') {
            // Use setTimeout to ensure the layer is fully added to the map
            setTimeout(() => {
              this.refreshBarangayStyles();
            }, 100);
          }
        }
      })
      .catch((error) => {
        console.error(`Failed to load GeoJSON from ${url}:`, error);
      });
  }

  private loadAPIGeoJsonLayer(layerKey: string, url: string) {
    if (layerKey === 'slope') {
      this.slopeService.getSlopeGeoJson().subscribe({
        next: (data) => {
          if (data && data.type === 'FeatureCollection') {
            // console.log("Slope Feature Sample:", data.features[0]);
            // console.log("GEOMETRY:", data.features[0]?.geometry);
            // console.log("Type:", typeof data.features[0]?.geometry);

            // Filter out invalid geometries
            const validFeatures = data.features.filter((f: any) => this.isValidGeometry(f));

            // console.log(
            //   `Filtered features: kept ${validFeatures.length}, removed ${data.features.length - validFeatures.length}`
            // );

            const cleanedGeoJson: FeatureCollection = {
              type: "FeatureCollection",
              features: validFeatures
            };

            const layer = L.geoJSON(cleanedGeoJson, {
              style: (feature) => {
                const meanSlope = feature?.properties.mean;
                return {
                  color: "#333",
                  weight: 1,
                  fillColor: this.getSlopeColor(meanSlope),
                  fillOpacity: 0.7
                };
              }
            });

            this.layers[layerKey] = layer;

            if (this.layerVisibility[layerKey]) {
              layer.addTo(this.map);
            }
          } else {
            console.error('Invalid slope GeoJSON', data);
          }
        },
        error: (err) => console.error('Failed to load slope layer', err)
      });
    } else if (layerKey === 'soil_moisture') {
      this.soilMoistureService.getSoilMoisturesGeoJson().subscribe({
        next: (data) => {
          if (data && data.type === 'FeatureCollection') {
            // console.log("Soil Moisture Feature Sample:", data.features[0]);
            // console.log("Geometry:", data.features[0]?.geometry);
            // console.log("Type:", typeof data.features[0]?.geometry);

            // Filter out invalid geometries
            const validFeatures = data.features.filter((f: any) => this.isValidGeometry(f));

            // console.log(
            //   `Filtered features: kept ${validFeatures.length}, removed ${data.features.length - validFeatures.length}`
            // );

            const cleanedGeoJson: FeatureCollection = {
              type: "FeatureCollection",
              features: validFeatures
            };

            const layer = L.geoJSON(cleanedGeoJson, {
              style: (feature) => {
                const meanSlope = feature?.properties.mean;
                return {
                  color: "#333",
                  weight: 1,
                  fillColor: this.getSoilMoistureColor(meanSlope),
                  fillOpacity: 0.7
                };
              }
            });

            this.layers[layerKey] = layer;

            if (this.layerVisibility[layerKey]) {
              layer.addTo(this.map);
            }
          } else {
            console.error('Invalid soil moisture GeoJSON', data);
          }
        },
        error: (err) => console.error('Failed to load soil moisture layer', err)
      });
    }
  }

  private isValidGeometry(feature: any): boolean {
    if (!feature || !feature.geometry) return false;

    let geom = feature.geometry;

    // 🔥 Auto-parse if geometry is JSON string
    if (typeof geom === "string") {
      try {
        geom = JSON.parse(geom);
        feature.geometry = geom; // update to parsed value
      } catch {
        return false;
      }
    }

    // Must have type + coordinates
    if (!geom.type || !geom.coordinates) return false;

    // Coordinates must be array
    if (!Array.isArray(geom.coordinates)) return false;

    return true;
  }


  private getSlopeColor(v: number) {
    // return v < 5 ? '#edf8e9' :
    //       v < 15 ? '#bae4b3' :
    //       v < 30 ? '#74c476' :
    //       v < 45 ? '#31a354' :
    //                 '#006d2c';
    return v < 5 ? '#a52a2a' :
          v < 15 ? '#f4a460' :
          v < 30 ? '#9acd32' :
          v < 45 ? '#1e90ff' :
                    '#0000ff';
  }

  private getSoilMoistureColor(v: number) {
    if (v === null || isNaN(v)) return '#ccc'; // gray for missing vs

    // Define ranges
    if (v <= 10) return '#a52a2a'; // very dry, brown
    if (v <= 20) return '#d2691e'; // dry, chocolate
    if (v <= 30) return '#f4a460'; // moderate dry, sandy brown
    if (v <= 40) return '#ffd700'; // low-medium, gold/yellow
    if (v <= 50) return '#9acd32'; // medium, yellow-green
    if (v <= 60) return '#32cd32'; // moderately wet, lime green
    if (v <= 70) return '#228b22'; // wet, forest green
    if (v <= 80) return '#1e90ff'; // very wet, dodger blue
    return '#0000ff'; // saturated, deep blue
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
        // this.details.addTo(this.map);
        this.legend.addTo(this.map);
        // this.affectedBarangays.addTo(this.map);
      }
    } else if (layerKey === 'flood_high' || layerKey === 'flood_moderate' || layerKey === 'flood_low') {
      if (!this.map.hasLayer(layer)) {
        this.map.addLayer(layer);
        // this.map.removeControl(this.info);
        // this.details.addTo(this.map);
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
        // this.info.addTo(this.map);
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
        <div>${center.name}</div>
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
    this.legend = new L.Control({ position: 'bottomleft' });

    this.legend.onAdd = () => {
      const div = L.DomUtil.create('div', 'info legend');
      div.style.padding = '10px 12px';
      div.style.background = 'rgba(255, 255, 255, 0.95)';
      div.style.borderRadius = '8px';
      div.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
      div.style.border = '1px solid rgba(0, 0, 0, 0.1)';
      div.style.maxWidth = '280px';
      div.style.fontFamily = 'Arial, Helvetica, sans-serif';

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

        div.innerHTML += `<h1 class="text-sm font-bold leading-3 mt-2 mb-2" style="color: #333;">${legendLabel}</h1>`;
        for (let i = 0; i < colors.length; i++) {
          div.innerHTML += `<div class="py-1 flex items-center" style="margin-bottom: 4px;">
            <i style="background:${colors[i]}; width: 20px; height: 20px; display: inline-block; margin-right: 8px; border: 1px solid #333; border-radius: 2px;"></i>
            <span style="color: #333; font-size: 11px;">${labels[i]}</span>
          </div>`;
        }
      } else {
        // Show livelihood legend when no disaster type is selected
        var labels: string[] = [];
        labels.push("<strong class='text-sm font-bold mb-2 block' style='color: #333;'>Barangay Livelihood Types</strong>");

        // Get unique livelihood types from actual barangay data
        const uniqueLivelihoods = new Map<string, string>();

        // Collect all unique livelihoods from barangayDetails
        this.barangayDetails.forEach(detail => {
          if (detail.livelihood && !uniqueLivelihoods.has(detail.livelihood)) {
            const color = this.getLivelihoodColor(detail.livelihood);
            uniqueLivelihoods.set(detail.livelihood, color);
          }
        });

        // Sort livelihoods alphabetically for better organization
        const sortedLivelihoods = Array.from(uniqueLivelihoods.entries()).sort((a, b) => a[0].localeCompare(b[0]));

        // Add livelihood legend items with better formatting
        for (const [livelihood, color] of sortedLivelihoods) {
          // Format the livelihood name nicely
          const displayName = livelihood
            .replace(/\//g, ' / ')
            .replace(/\bmainy\b/gi, 'mainly') // Fix typo
            .split(' ')
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');

          labels.push(
            `<div class="py-1 flex items-center" style="margin-bottom: 4px;">
              <i style="background:${color}; width: 20px; height: 20px; display: inline-block; margin-right: 8px; border: 1px solid #333; border-radius: 2px; flex-shrink: 0;"></i>
              <span class="text-xs" style="color: #333; font-size: 11px; line-height: 1.3; word-wrap: break-word;">${displayName}</span>
            </div>`
          );
        }

        // Map Features Legend (show default visible layers)
        const defaultVisibleLayers = ['water_river', 'buildings', 'roads', 'forest'];
        const visibleLayers = defaultVisibleLayers.filter(key => this.layerVisibility[key] && this.layerColors[key]);

        if (visibleLayers.length > 0) {
          labels.push("<strong class='text-sm font-bold mt-3 mb-2 block' style='color: #333; border-top: 1px solid #ddd; padding-top: 8px;'>Map Features</strong>");

          // Map layer keys to display names
          const layerDisplayNames: { [key: string]: string } = {
            'water_river': 'Water Bodies / Rivers',
            'buildings': 'Buildings',
            'roads': 'Roads',
            'forest': 'Forests',
            'landcover': 'Land Cover'
          };

          for (const layerKey of visibleLayers) {
            const color = this.layerColors[layerKey];
            const layerName = layerDisplayNames[layerKey] || layerKey.charAt(0).toUpperCase() + layerKey.slice(1).replace(/_/g, ' ');
            labels.push(
              `<div class="py-1 flex items-center" style="margin-bottom: 4px;">
                <i style="background:${color}; width: 20px; height: 20px; display: inline-block; margin-right: 8px; border: 1px solid #333; border-radius: 2px; flex-shrink: 0;"></i>
                <span class="text-xs" style="color: #333; font-size: 11px;">${layerName}</span>
              </div>`
            );
          }
        }

        div.innerHTML = labels.join("");
      }

      // Always add the legend to the map
      return div;
    };

    // Add the legend to the map
    this.legend.addTo(this.map);
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

  // Get color based on livelihood
  private getLivelihoodColor(livelihood: string): string {
    if (!livelihood) {
      return '#8A9A5B'; // Default color
    }

    // Try exact match first
    if (this.livelihoodColors[livelihood]) {
      return this.livelihoodColors[livelihood];
    }

    // Try partial match - check if livelihood contains any key
    for (const [key, color] of Object.entries(this.livelihoodColors)) {
      const normalizedKey = key.toLowerCase().replace(/\s+/g, '');
      const normalizedLivelihood = livelihood.toLowerCase().replace(/\s+/g, '');

      // Check if key is contained in livelihood or vice versa
      if (normalizedLivelihood.includes(normalizedKey) || normalizedKey.includes(normalizedLivelihood)) {
        return color;
      }

      // Also check for main category match (e.g., "Agriculture" or "Fishery")
      const mainCategory = key.split('/')[0];
      if (livelihood.toLowerCase().startsWith(mainCategory.toLowerCase())) {
        return color;
      }
    }

    // Default color if no match found
    return '#8A9A5B';
  }

  // Normalize barangay name for matching (handles spaces, underscores, case differences)
  private normalizeBarangayName(name: string): string {
    if (!name) return '';
    // Convert to lowercase and replace spaces with underscores
    return name.toLowerCase().replace(/\s+/g, '_').trim();
  }

  // Style features rendered to map
  private style(feature: any, layerKey: string) {
    if (layerKey === 'barangay'){
      // Get barangay name and normalize it for matching
      const barangayName = feature.properties.name;
      const normalizedName = this.normalizeBarangayName(barangayName);
      const barangayDetail = this.barangayDetails.find(detail =>
        detail.name === normalizedName || detail.name === barangayName.toLowerCase()
      );
      const fillColor = barangayDetail ? this.getLivelihoodColor(barangayDetail.livelihood) : this.coloringMap.barangay;

      return {
        fillColor: fillColor,
        weight: 2,
        opacity: 1,
        color: '#333333',
        dashArray: '',
        fillOpacity: 0.7
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
        // Store both original and normalized name for lookup
        const normalizedName = this.normalizeBarangayName(barangayName);
        this.barangayPolygons[barangayName] = feature;
        this.barangayPolygons[normalizedName] = feature; // Also store normalized for lookup

        layer.feature = feature;

        layer.bindTooltip(barangayName, {
          permanent: false,
          direction: 'top',
          className: 'barangay-tooltip',
          offset: [0, -10]
        });

        // Add permanent label for each barangay
        const center = this.calculateCentroid(feature.geometry);
        const formattedName = barangayName
          .replace(/_/g, ' ')
          .split(' ')
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
        const label = L.marker(center, {
          icon: L.divIcon({
            className: 'barangay-label',
            html: `<span style="color: white; text-shadow: 1px 1px 2px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.8), 1px -1px 2px rgba(0,0,0,0.8), -1px 1px 2px rgba(0,0,0,0.8);">${formattedName}</span>`,
            iconSize: [0, 0],
          }),
          interactive: false
        });
        this.barangayLabelLayer.addLayer(label);

        layer.on({
          mouseover: (e: L.LeafletMouseEvent) => this.onBarangayMouseOver(e),
          mouseout: (e: L.LeafletMouseEvent) => this.onBarangayMouseOut(e),
          click: (e: L.LeafletMouseEvent) => this.onBarangayClick(e)
        });
      }
    }

    if (!layerExceptions.includes(layerKey) && layerKey !== 'barangay') {
      layer.on({
        click: this.zoomToFeature.bind(this),
      });
    }
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
    // Instead of resetStyle, use getBarangayStyle to ensure livelihood colors are maintained
    const feature = layer.feature;
    if (feature) {
      layer.setStyle(this.getBarangayStyle(feature));
    } else {
      this.layers['barangay'].resetStyle(layer);
    }
    // this.info.updateInfo(layer.feature.properties);
    this.info.updateInfo();
  }

  // Zoom to the feature on click
  private zoomToFeature(e: any) {
    const layer = e.target;
  }

  private onBarangayMouseOver(e: L.LeafletMouseEvent): void {
    const layer = e.target as any;
    const barangayName = layer.feature.properties.name;

    this.barangaySelectionService.setHoveredBarangay(barangayName);

    layer.setStyle({
      weight: 3,
      color: '#FFA500',
      fillOpacity: 0.5
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
      layer.bringToFront();
    }

    layer.openTooltip();
  }

  private onBarangayMouseOut(e: L.LeafletMouseEvent): void {
    const layer = e.target as any;

    this.barangaySelectionService.setHoveredBarangay(null);

    const barangayName = layer.feature.properties.name;
    const normalizedName = this.normalizeBarangayName(barangayName);
    const selectedBarangay = this.barangays.find(b =>
      b.id === this.selectedBarangay
    );

    // Compare using normalized names
    const isSelected = selectedBarangay && (
      this.normalizeBarangayName(selectedBarangay.name) === normalizedName ||
      selectedBarangay.name === barangayName ||
      selectedBarangay.name === normalizedName
    );

    if (!isSelected) {
      if (this.layers['barangay']) {
        // Use getBarangayStyle instead of resetStyle to maintain livelihood colors
        const feature = layer.feature;
        if (feature) {
          layer.setStyle(this.getBarangayStyle(feature));
        } else {
          (this.layers['barangay'] as L.GeoJSON).resetStyle(layer);
        }
      }
    }

    layer.closeTooltip();
  }

  private async onBarangayClick(e: L.LeafletMouseEvent): Promise<void> {
    try {
      const layer = e.target as any;
      const barangayName = layer.feature.properties.name;
      const normalizedName = this.normalizeBarangayName(barangayName);

      // Try to find barangay by original name, normalized name, or by normalizing both
      const barangay = this.barangays.find(b =>
        b.name === barangayName ||
        b.name === normalizedName ||
        this.normalizeBarangayName(b.name) === normalizedName
      );
      if (!barangay) {
        console.error('Barangay not found:', barangayName, '(normalized:', normalizedName + ')');
        return;
      }

      const details = await this.barangayDetailsService.getCompleteBarangayDetails(barangay);

      console.log('Complete barangay details:', details);

      this.barangaySelectionService.setSelectedBarangay({
        barangay: details.barangay,
        barangayProfile: details.barangayProfile,
        chairman: details.chairman,
        nearestEvacuationCenters: details.nearestEvacuationCenters
      });

      this.selectedBarangay = barangay.id;
      this.selectedBarangayName = barangay.name;

      this.highlightSelectedBarangay(layer);

      // Show markers for nearest evacuation centers
      this.showNearestEvacuationCenterMarkers(details.nearestEvacuationCenters);

      this.map.fitBounds(layer.getBounds(), {
        padding: [50, 50],
        maxZoom: 14
      });
    } catch (error) {
      console.error('Error handling barangay click:', error);
    }
  }

  private highlightSelectedBarangay(layer: L.Layer): void {
    // if (this.layers['barangay']) {
    //   (this.layers['barangay'] as L.GeoJSON).eachLayer((l: any) => {
    //     // Use getBarangayStyle instead of resetStyle to maintain livelihood colors
    //     const feature = l.feature;
    //     if (feature) {
    //       l.setStyle(this.getBarangayStyle(feature));
    //     } else {
    //       (this.layers['barangay'] as L.GeoJSON).resetStyle(l);
    //     }
    //   });
    // }

    this.resetBarangayHighlight();

    (layer as any).setStyle({
      weight: 4,
      color: '#FFD700',
      fillOpacity: 0.6,
      fillColor: '#FFD700'
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
      (layer as any).bringToFront();
    }
  }

  private resetBarangayHighlight(): void {
    if (!this.layers['barangay']) return;

    (this.layers['barangay'] as L.GeoJSON).eachLayer((l: any) => {
      const feature = l.feature;
      if (feature) {
        l.setStyle(this.getBarangayStyle(feature));
      } else {
        (this.layers['barangay'] as L.GeoJSON).resetStyle(l);
      }
    });
  }

  private clearBarangaySelection(): void {
    this.barangaySelectionService.clearSelection();
    this.selectedBarangay = null;
    this.selectedBarangayName = null;

    if (this.layers['barangay']) {
      (this.layers['barangay'] as L.GeoJSON).eachLayer((layer: any) => {
        // Use getBarangayStyle instead of resetStyle to maintain livelihood colors
        const feature = layer.feature;
        if (feature) {
          layer.setStyle(this.getBarangayStyle(feature));
        } else {
          (this.layers['barangay'] as L.GeoJSON).resetStyle(layer);
        }
      });
    }

    // Clear nearest evacuation center markers
    this.clearNearestEvacuationCenterMarkers();
  }

  private clearBarangaySelectionUI(): void {

    // Reset barangay styles
    this.resetBarangayHighlight();

    // Clear evacuation center markers
    this.clearNearestEvacuationCenterMarkers();

    // Reset state
    this.selectedBarangay = null;
    this.selectedBarangayName = null;

    // Reset map
    this.map.setView([11.232084301848886, 124.7057818628441], 12);
  }

  private showNearestEvacuationCenterMarkers(evacuationCenters: any[]): void {
    // Clear existing markers first
    this.clearNearestEvacuationCenterMarkers();

    if (!evacuationCenters || evacuationCenters.length === 0) {
      return;
    }

    const markers: L.Marker[] = [];

    // Create marker colors for different ranks
    const markerColors = ['green', 'blue', 'yellow', 'orange', 'red'];

    evacuationCenters.forEach((center, index) => {
      if (!center.latitude || !center.longitude) {
        return;
      }

      // Create custom icon with number and color
      const markerColor = markerColors[index] || 'gray';
      const pulseIcon = this.makePulseIcon(10, 'green', './assets/images/guard.png');

      // Create marker
      const marker = L.marker([center.latitude, center.longitude], {
        icon: pulseIcon
      });

      // Create popup with evacuation center details
      const popupContent = `
        <div style="min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #2563eb;">
            #${index + 1}: ${center.name}
          </h3>
          <div style="font-size: 12px; color: #666;">
            <p style="margin: 4px 0;">
              <strong>Distance:</strong> ${center.distance.toFixed(2)} km
            </p>
            ${center.barangay ? `<p style="margin: 4px 0;"><strong>Barangay:</strong> ${center.barangay}</p>` : ''}
            ${center.venue ? `<p style="margin: 4px 0;"><strong>Venue:</strong> ${center.venue}</p>` : ''}
            ${center.barangay_official?.name ? `
              <p style="margin: 4px 0;">
                <strong>Contact:</strong> ${center.barangay_official.name}<br>
                <span style="margin-left: 16px;">${center.barangay_official.position}</span>
              </p>
            ` : ''}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      markers.push(marker);
    });

    // Create layer group and add to map
    this.nearestEvacuationCentersLayer = L.layerGroup(markers);
    this.nearestEvacuationCentersLayer.addTo(this.map);

    console.log(`✅ Added ${markers.length} evacuation center markers to map`);
  }

  private clearNearestEvacuationCenterMarkers(): void {
    if (this.nearestEvacuationCentersLayer) {
      this.map.removeLayer(this.nearestEvacuationCentersLayer);
      this.nearestEvacuationCentersLayer = null;
      console.log('🗑️ Cleared evacuation center markers');
    }
  }

  // Center map when click on marker
  private clickZoom(e: any) {
    this.map.setView(e.target.getLatLng(), 14);
  }

  // Double-click functionality removed as per requirements

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

  private findNearestLocationsWithinBarangay(barangay_id: number, latlng: any, count: number) {
    const barangayLayer = this.layers['barangay'];
    const name = this.barangays.find(b => b.id === barangay_id)?.name;
    if (!name) {
      return [];
    }

    const selectedBarangayLayer = L.geoJSON(this.barangayPolygons[name]);
    const bounds = selectedBarangayLayer.getBounds();

    const insideCenters = this.evacuationCenters.filter(location => {
      const point = L.latLng(location.coords[0], location.coords[1]);
      return bounds.contains(point);
    });

    const distances = insideCenters.map(location => {
      const distance = this.calculateDistance(
        latlng.lat,
        latlng.lng,
        location.coords[0],
        location.coords[1]
      );
      return { location, distance };
    });

    distances.sort((a, b) => a.distance - b.distance);
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
          html: `<span style="color: white; text-shadow: 1px 1px 2px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.8), 1px -1px 2px rgba(0,0,0,0.8), -1px 1px 2px rgba(0,0,0,0.8);">${barangayName}</span>`,
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
    private mapTypeService: MapTypeService,
    private authService: AuthService,
    private slopeService: SlopeService,
    private soilMoistureService: SoilMoistureService,
    private hazardService: HazardDetectorService,
    private barangaySelectionService: BarangaySelectionService,
    private barangayDetailsService: BarangayDetailsService,
    private simulationService: SimulationService,
    private weatherService: WeatherService,
  ) {
    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationEnd) {
        if (this.mainContent) {
          this.mainContent!.scrollTop = 0;
        }
      }
    });
  }

  async ngOnInit(): Promise<void> {
    this.mainContent = document.querySelector('.main-content');

    this.loadBarangays();
    this.loadMarkers();

    await this.barangayDetailsService.loadAllData();

    this.disasterTypeSubscription = this.disasterService.disasterType$.subscribe(
      (disasterType) => {
        if (disasterType) {
          this.disasterType = disasterType;
          this.handleDisasterTypeChange();
        } else {
          // When disaster type is cleared, show livelihood legend
          this.addLegend();
          if (this.legend) {
            this.legend.addTo(this.map);
          }

          if (this.highlightLayer) {
            this.map.removeLayer(this.highlightLayer);
          }

          if (this.labelMarker) {
            this.map.removeLayer(this.labelMarker);
          }

          this.map.removeLayer(this.layers['flood_low']);
          this.map.removeLayer(this.layers['flood_moderate']);
          this.map.removeLayer(this.layers['flood_high']);

          this.map.removeLayer(this.layers['landslide_low']);
          this.map.removeLayer(this.layers['landslide_moderate']);
          this.map.removeLayer(this.layers['landslide_high']);
        }
      }
    );

    this.mapTypeSubscription = this.mapTypeService.mapType$.subscribe(
      (mapType) => {
        if (mapType) {
          this.mapType = mapType;
          this.handleMapTypeChange();
        }
      }
    );

    this.breakPointObserver.observe([Breakpoints.Handset]).subscribe(result => {
      this.isMobile = result.matches;
      if (this.isMobile) {
        this.isHazardDetailsMinimized = true; // Minimize on mobile
      }
    });

    this.barangaySelectionService.selectedBarangayData$.subscribe(barangay => {
      // If null → cleared state
      if (!barangay) {
        // this.map.setView([11.298, 124.678], 12); // Carigara default
         this.clearBarangaySelectionUI();
      }
    });

    this.barangayService.selectedBarangay$.subscribe(barangay => {
      console.log("barangay: ", barangay);
      if (barangay) {
        this.onBarangaySelected(barangay);
      } else {
        this.clearBarangaySelection();
      }
    });

    this.isLoggedIn = this.authService.isLoggedIn();

    if (!this.isLoggedIn) {
      this.startTour();
    }

    // Subscribe to simulation state changes
    this.simulationSubscription = this.simulationService.simulationState$.subscribe(state => {
      if (state.isActive && !state.isPaused) {
        // Update evacuation center risks are handled by the service
      }
      // Hide weather layers when simulation is active
      if (state.isActive) {
        this.removeWeatherLayers();
        this.showWeatherLayers = false;
        this.stopWeatherRefreshInterval(); // Stop refresh during simulation
      } else {
        this.showWeatherLayers = true;
        // Reload weather layers when simulation stops
        if (Object.keys(this.weatherData).length > 0) {
          this.updateWeatherLayers();
        }
        // Resume weather refresh when simulation stops
        this.startWeatherRefreshInterval();
      }
    });

    // Load weather data for visualization
    this.loadWeatherDataForVisualization();
  }

  private async loadWeatherDataForVisualization(): Promise<void> {
    try {
      // Use direct Open Meteo API call (not cached backend data)
      console.log('Fetching fresh weather data from Open Meteo API...');
      this.weatherData = await this.weatherService.getWeatherDataForAllBarangay();
      console.log('Weather data loaded from Open Meteo:', Object.keys(this.weatherData).length, 'barangays');
      
      // Update weather layers if not simulating
      if (!this.isSimulationActive && this.map && this.showWeatherLayers) {
        this.updateWeatherLayers();
      }
    } catch (error) {
      console.error('Error loading weather data for visualization:', error);
      // Fallback to backend API if direct call fails
      try {
        console.log('Falling back to backend API...');
        this.weatherData = await this.weatherService.getWeatherDataForAllBarangay_v2();
        if (!this.isSimulationActive && this.map && this.showWeatherLayers) {
          this.updateWeatherLayers();
        }
      } catch (fallbackError) {
        console.error('Error loading weather data from backend:', fallbackError);
      }
    }
  }

  private startWeatherRefreshInterval(): void {
    // Clear existing interval if any
    this.stopWeatherRefreshInterval();

    // Refresh weather data every 1 minute (60000 ms) for real-time updates
    this.weatherRefreshInterval = setInterval(() => {
      if (!this.isSimulationActive && this.showWeatherLayers) {
        console.log('Refreshing weather data from Open Meteo API...');
        this.loadWeatherDataForVisualization();
      }
    }, 60000); // 1 minute
  }

  private stopWeatherRefreshInterval(): void {
    if (this.weatherRefreshInterval) {
      clearInterval(this.weatherRefreshInterval);
      this.weatherRefreshInterval = null;
    }
  }

  ngAfterViewInit(): void {
    this.initMap();
    // this.markerControl();
    this.addLegend();
    // this.addInfoControl();
    // this.addDetailsControl();
    // this.addAffectedBarangaysControl();
    
    // Load weather data and show layers after map is initialized
    setTimeout(() => {
      this.loadWeatherDataForVisualization();
      // Start periodic refresh for real-time updates
      this.startWeatherRefreshInterval();
    }, 1000); // Small delay to ensure map is fully loaded
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }

    if (this.disasterTypeSubscription) {
      this.disasterTypeSubscription.unsubscribe();
    }

    if (this.mapTypeSubscription) {
      this.mapTypeSubscription.unsubscribe();
    }

    if (this.simulationSubscription) {
      this.simulationSubscription.unsubscribe();
    }

    // Clean up simulation
    this.stopSimulation();

    // Clean up weather layers
    this.removeWeatherLayers();

    // Stop weather refresh interval
    this.stopWeatherRefreshInterval();
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

      if (this.disasterType.type == 'landslide') {
        this.map.removeLayer(this.layers['flood_low']);
        this.map.removeLayer(this.layers['flood_moderate']);
        this.map.removeLayer(this.layers['flood_high']);

        if (this.disasterType.category == 'category4') {
          this.map.removeLayer(this.layers['landslide_low']);
          this.map.removeLayer(this.layers['landslide_moderate']);

          if (this.map.hasLayer(this.layers['landslide_high'])) {
            this.map.removeLayer(this.layers['landslide_high'])

            // this.map.removeControl(this.details);
            this.map.removeControl(this.affectedBarangays);
            this.map.removeControl(this.legend);
          } else {
            this.toggleLayer('landslide_high');

            // this.details.updateDetails({
            //   landslide: this.hazardRiskDetails.landslide.high
            // });

            this.affectedBarangays.updateDetails({
              barangays: this.hazardAffectedBarangays.landslide.highly_susceptible
            });
          }

        } else if (this.disasterType.category == 'category3' || this.disasterType.category == 'category2') {
          this.map.removeLayer(this.layers['landslide_low']);
          this.map.removeLayer(this.layers['landslide_high']);

          if (this.map.hasLayer(this.layers['landslide_moderate'])) {
            this.map.removeLayer(this.layers['landslide_moderate'])

            // this.map.removeControl(this.details);
            this.map.removeControl(this.affectedBarangays);
            this.map.removeControl(this.legend);
          } else {
            this.toggleLayer('landslide_moderate');

            // this.details.updateDetails({
            //   landslide: this.hazardRiskDetails.landslide.moderate
            // });

            this.affectedBarangays.updateDetails({
              barangays: this.hazardAffectedBarangays.landslide.moderately_susceptible
            });
          }

        } else {
          this.map.removeLayer(this.layers['landslide_moderate']);
          this.map.removeLayer(this.layers['landslide_high']);

          if (this.map.hasLayer(this.layers['landslide_low'])) {
            this.map.removeLayer(this.layers['landslide_low'])

            // this.map.removeControl(this.details);
            this.map.removeControl(this.affectedBarangays);
            this.map.removeControl(this.legend);
          } else {
            this.toggleLayer('landslide_low');

            // this.details.updateDetails({
            //   landslide: this.hazardRiskDetails.landslide.low
            // });

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
        // this.map.removeControl(this.details);

      } else if (this.disasterType.type == 'typhoon') {
        this.map.removeLayer(this.layers['landslide_low']);
        this.map.removeLayer(this.layers['landslide_moderate']);
        this.map.removeLayer(this.layers['landslide_high']);

        if (this.disasterType.category == 'category5') {
          this.map.removeLayer(this.layers['flood_low']);
          this.map.removeLayer(this.layers['flood_moderate']);

          if (this.map.hasLayer(this.layers['flood_high'])) {
            this.map.removeLayer(this.layers['flood_high'])

            // this.map.removeControl(this.details);
            this.map.removeControl(this.affectedBarangays);
            this.map.removeControl(this.legend);
          } else {
            this.toggleLayer('flood_high');

            // this.details.updateDetails({
            //   flood: this.hazardRiskDetails.flood.high,
            //   typhoon: this.hazardCategoryDetails.typhoon.super_typhoon,
            //   rainfall: this.typhoonRainfallImpactDetails.super_typhoon
            // });

            this.affectedBarangays.updateDetails({
              barangays: this.hazardAffectedBarangays.typhoon.super_typhoon
            });
          }

        } else if (this.disasterType.category == 'category4' || this.disasterType.category == 'category3') {
          this.map.removeLayer(this.layers['flood_low']);
          this.map.removeLayer(this.layers['flood_high']);

          if (this.map.hasLayer(this.layers['flood_moderate'])) {
            this.map.removeLayer(this.layers['flood_moderate'])

            // this.map.removeControl(this.details);
            this.map.removeControl(this.affectedBarangays);
            this.map.removeControl(this.legend);
          } else {
            this.toggleLayer('flood_moderate');

            // this.details.updateDetails({
            //   flood: this.hazardRiskDetails.flood.moderate,
            //   typhoon: (this.disasterType.category == 'category4') ? this.hazardCategoryDetails.typhoon.typhoon : this.hazardCategoryDetails.typhoon.severe_tropical_storm,
            //   rainfall: (this.disasterType.category == 'category4') ? this.typhoonRainfallImpactDetails.typhoon : this.typhoonRainfallImpactDetails.severe_tropical_storm,
            // });

            this.affectedBarangays.updateDetails({
              barangays: this.hazardAffectedBarangays.typhoon.typhoon
            });
          }
        } else if (this.disasterType.category == 'category2' || this.disasterType.category == 'category1') {
          this.map.removeLayer(this.layers['flood_moderate']);
          this.map.removeLayer(this.layers['flood_high']);

          if (this.map.hasLayer(this.layers['flood_low'])) {
            this.map.removeLayer(this.layers['flood_low'])

            // this.map.removeControl(this.details);
            this.map.removeControl(this.affectedBarangays);
            this.map.removeControl(this.legend);
          } else {
            this.toggleLayer('flood_low');

            // this.details.updateDetails({
            //   flood: this.hazardRiskDetails.flood.low,
            //   typhoon: (this.disasterType.category == 'category2') ? this.hazardCategoryDetails.typhoon.tropical_storm : this.hazardCategoryDetails.typhoon.tropical_depression,
            //   rainfall: (this.disasterType.category == 'category2') ? this.typhoonRainfallImpactDetails.tropical_storm : this.typhoonRainfallImpactDetails.tropical_depression,
            // });

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
        } else if (this.disasterType.category == 'slope') {
          this.toggleLayer('slope');
        } else if (this.disasterType.category == 'soil-moisture') {
          this.toggleLayer('soil_moisture');
        }
      }
    }
  }

  handleMapTypeChange(): void {
    if (this.mapType) {
      // Remove existing tile layer
      this.map.eachLayer((layer: any) => {
        if (layer instanceof L.TileLayer) {
          this.map.removeLayer(layer);
        }
      });

      var selectedMapType = this.mapType.type;

      // Add the selected tile layer
      if (selectedMapType !== 'null') {
        this.baseLayers[selectedMapType].addTo(this.map);
      }

      // this.selectedMapType = selectedMapType;
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
        // this.barangays = response;
        // this.barangays.sort((a, b) => a.name.localeCompare(b.name));
        this.barangays = response.sort((a, b) =>
          a.name.localeCompare(b.name)
        );

        this.barangayService.setBarangays(this.barangays);
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
          id: center.id,
          barangay_id: center.barangay_id,
          name: center.name.toLowerCase(),
          coords: [parseFloat(center.latitude.toString()), parseFloat(center.longitude.toString())],
          venue: center.venue,
          image: center.image ? './assets/images/' + center.image : ''
        }));

        this.barangayOfficials = response.map((center: any) => ({
          id: center.official?.id,
          barangay_id: center.barangay_id,
          name: center.official?.name,
          position: center.official?.position,
          coords: [parseFloat(center.latitude.toString()), parseFloat(center.longitude.toString())]
        }));

        if (this.map) {
          // Hide this for now since contents are already displayed above the map
          // this.markerControl();

          // Always add legend to show livelihood colors
          this.addLegend();
          // this.addInfoControl();
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
    const barangay = this.barangays.find(b => b.id === selectedId);
    if (barangay) {
      this.selectedBarangayName = barangay.name;
      this.zoomToBarangay({ id: barangay.id, barangay: barangay.name, coordinates: [barangay.latitude, barangay.longitude] });
    } else {
      this.selectedBarangay = null;
      this.map.setView([11.232084301848886, 124.7057818628441], 12);
    }
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

  onApplyFilters(filters: { flood: string | null; landslide: string | null; barangay: string | null; mapType: string | null; barangays: number[] | null;  }): void {
    this.isDssFilterModalOpen = false;

    console.log('filters.flood: ', filters.flood);
    console.log('filters.landslide: ', filters.landslide);

    if (filters.flood) {
      this.selectedFloodFilter = filters.flood;
      this.disasterService.setDisasterType({ type: 'typhoon', category: filters.flood });

      if (filters.barangays?.length === 0) {
        var floodCategoryMap: any = {
          'category5': this.hazardAffectedBarangays.typhoon.super_typhoon,
          'category4': this.hazardAffectedBarangays.typhoon.typhoon,
          'category3': this.hazardAffectedBarangays.typhoon.severe_tropical_storm,
          'category2': this.hazardAffectedBarangays.typhoon.tropical_storm,
          'category1': this.hazardAffectedBarangays.typhoon.tropical_depression,
        };

        var floodAffectedBarangaySlugs = floodCategoryMap[filters.flood];
        var floodAffectedBarangays = [];

        for (const barangay_slug of floodAffectedBarangaySlugs) {
          const barangay = this.barangays.find(b => b.slug === barangay_slug);
          if (barangay) {
            floodAffectedBarangays.push(barangay!.id);
          }
        }

        this.selectedBarangaysFilter = [...floodAffectedBarangays];

        // this.refreshBarangayStyles();
        // this.updateBarangayLabels();
      }
    } else {
      // this.disasterService.setDisasterType({ type: 'typhoon', category: undefined });
      this.disasterService.clearDisasterType();

      this.selectedFloodFilter = null;
      this.selectedBarangaysFilter = [];
      // this.refreshBarangayStyles();
      // this.updateBarangayLabels();
    }

    if (filters.landslide) {
      this.selectedLandslideFilter = filters.landslide;
      this.disasterService.setDisasterType({ type: 'landslide', category: filters.landslide });

      if (filters.barangays?.length === 0) {
        var landslideCategoryMap: any = {
          'category4': this.hazardAffectedBarangays.landslide.highly_susceptible,
          'category3': this.hazardAffectedBarangays.landslide.moderately_susceptible,
          // 'category2': this.hazardAffectedBarangays.landslide.unlikely,
          'category1': this.hazardAffectedBarangays.landslide.less_likely_to_experience,
        };

        var landslideAffectedBarangaySlugs = landslideCategoryMap[filters.landslide];
        var landslideAffectedBarangays = [];

        for (const barangay_slug of landslideAffectedBarangaySlugs) {
          const barangay = this.barangays.find(b => b.slug === barangay_slug);
          if (barangay) {
            landslideAffectedBarangays.push(barangay!.id);
          }
        }

        this.selectedBarangaysFilter = [...landslideAffectedBarangays];

        // this.refreshBarangayStyles();
        // this.updateBarangayLabels();
      }
    } else {
      // this.disasterService.setDisasterType({ type: 'landslide', category: undefined });

      this.selectedLandslideFilter = null;
      this.selectedBarangaysFilter = [];
      // this.refreshBarangayStyles();
      // this.updateBarangayLabels();
    }

    if (filters.barangay) {
      this.selectedBarangayFilter = filters.barangay;

      const barangay = this.barangays.find(b => b.id === parseInt(filters.barangay!));
      if (barangay) {
        this.selectedBarangayName = barangay.name;
        this.zoomToBarangay({ id: barangay.id, barangay: barangay.name, coordinates: [barangay.latitude, barangay.longitude] });
      } else {
        this.selectedBarangay = null;
        this.selectedBarangayName = null;
        this.map.setView([11.232084301848886, 124.7057818628441], 12);
      }
    }

    if (filters.mapType) {
      this.selectedMapTypeFilter = filters.mapType;
      this.mapTypeService.setMapType({ type: filters.mapType });
    }

    if (filters.barangays) {
      if (filters.barangays?.length > 0) {
        this.selectedBarangaysFilter = filters.barangays;

        // this.refreshBarangayStyles();
        // this.updateBarangayLabels();
      }
    } else {
      this.selectedBarangaysFilter = [];
      // this.refreshBarangayStyles();
      // this.updateBarangayLabels();
    }

    this.refreshBarangayStyles();
    this.updateBarangayLabels();
  }

  onBarangayOfficialSelected(event: any): void {
    const barangayId = +event.id;

    this.map.removeLayer(this.barangayOfficialLayer);

    const barangay = this.barangays.find(b => b.id === barangayId);
    if (barangay) {
      // Triggers weather data fetch
      this.selectedBarangayName = barangay.name;
      // this.zoomToBarangay({ id: barangay.id, barangay: barangay.name, coordinates: [barangay.latitude, barangay.longitude] });

      const official = this.barangayOfficials.find(o => o.barangay_id === barangay.id);
      if (official) {
        // this.toggleBarangayOfficials();
        const personIcon = L.icon({
          iconUrl: './assets/images/official.png',
          iconSize: [28, 35],
          iconAnchor: [12, 41],
          popupAnchor: [1, -41],
          shadowUrl: '',
        });

        // const officialMarkers = this.barangayOfficials.map((person) => {
        //   return L.marker(person.coords, { icon: personIcon })
        //     .bindPopup(this.generateOfficial(person))
        //     .on("click", this.clickZoom.bind(this));
        // });

        const officialMarkers = this.barangayOfficials
          .filter(person => person.barangay_id === barangay.id)
          .map(person =>
            L.marker(person.coords, { icon: personIcon })
              .bindPopup(this.generateOfficial(person))
              .on('click', this.clickZoom.bind(this))
          );

        this.barangayOfficialLayer = L.layerGroup(officialMarkers);
        this.barangayOfficialLayer.addTo(this.map);
      }
    } else {
      this.selectedBarangay = null;
      this.selectedBarangayName = null;
      this.map.setView([11.232084301848886, 124.7057818628441], 12);
    }
  }

  onEvacuationCenterSelected(event: any): void {
    // const selectedId = +event.id;

    // const center = this.evacuationCenters.find(c => c.id === selectedId);
    // if (center) {
    //   const barangay = this.barangays.find(b => b.id === parseInt(center.barangay_id!));
    //   if (barangay) {
    //     // Triggers weather data fetch
    //     this.selectedBarangayName = barangay.name;

    //     this.zoomToBarangay({ id: barangay.id, barangay: barangay.name, coordinates: [barangay.latitude, barangay.longitude] });
    //   }
    // } else {
    //   this.selectedBarangay = null;
    //   this.selectedBarangayName = null;
    //   this.map.setView([11.232084301848886, 124.7057818628441], 12);
    // }
    const barangayId = +event.id;

    // Clear previous nearest markers from the map
    this.clearNearestEvacuationMarkers();

    const barangay = this.barangays.find(b => b.id === barangayId);
    if (barangay) {
      if (this.currentMarker) {
        // Remove the existing marker if present
        this.map?.removeLayer(this.currentMarker);
      }

      // Add a new marker at the clicked location
      // this.currentMarker = L.marker([barangay.latitude, barangay.longitude], {
      //   icon: this.defaultIcon,
      // })
      //   .addTo(this.map)

      // Find the nearest locations
      // const nearestLocations = this.findNearestLocations({ lat: barangay.latitude, lng: barangay.longitude }, 5);
      const nearestLocations = this.findNearestLocationsWithinBarangay(barangay.id, { lat: barangay.latitude, lng: barangay.longitude }, 5);
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

      // Triggers weather data fetch
      this.selectedBarangayName = barangay.name;

      this.zoomToBarangay({ id: barangay.id, barangay: barangay.name, coordinates: [barangay.latitude, barangay.longitude] });
    } else {
      if (this.highlightLayer) {
        this.map.removeLayer(this.highlightLayer);
      }

      if (this.labelMarker) {
        this.map.removeLayer(this.labelMarker);
        this.labelMarker = null;
      }

      this.refreshBarangayStyles();
      this.updateBarangayLabels();

      this.selectedBarangay = null;
      this.selectedBarangayName = null;

      this.map.setView([11.232084301848886, 124.7057818628441], 12);
    }
  }

  public onBarangaysSelected(event: any): void {
    this.selectedBarangaysFilter = event;

    // this.highlightedBarangays = [];
    // for (const barangay_id of this.selectedBarangaysFilter) {
    //   const barangay = this.barangays.find(b => b.id === parseInt(barangay_id));
    //   if (barangay) {
    //     this.highlightedBarangays.push(barangay!.name);
    //   }
    // }

    // this.refreshBarangayStyles();
    this.selectedBarangaysFilter = this.barangays
      .filter(b => event.includes(b.id))
      .map(b => b.id);

    this.refreshBarangayStyles();
    this.updateBarangayLabels();
  }

  refreshBarangayStyles() {
    if (!this.layers['barangay']) return;

    (this.layers['barangay'] as L.GeoJSON).eachLayer((layer: any) => {
      const feature = layer.feature;
      // const id = feature.properties.id;
      const name = feature.properties.name;
      // Normalize name for matching with barangays array
      const normalizedName = this.normalizeBarangayName(name);
      var id = this.barangays.find(b =>
        b.name === name ||
        b.name === normalizedName ||
        this.normalizeBarangayName(b.name) === normalizedName
      )?.id;
      if (!id) {
        layer.setStyle(this.getBarangayStyle(feature));
        return;
      }

      // if (this.selectedBarangaysFilter.includes(id.toString()) || this.highlightedBarangays.includes(id)) {
      if (this.selectedBarangaysFilter.includes(id)) {
        layer.setStyle(this.getSelectedBarangayStyle());
        // layer.openTooltip();
      } else {
        layer.setStyle(this.getBarangayStyle(feature));
      }
    });
  }

  getSelectedBarangayStyle(): L.PathOptions {
    return {
      // color: '#ffcc00',
      // weight: 4,
      // fillOpacity: 0.5
      color: 'yellow',
      weight: 3,
      fillColor: 'yellow',
      fillOpacity: 0.3,
    };
  }

  getBarangayStyle(feature: any): L.PathOptions {
    // Get barangay name and normalize it for matching
    const barangayName = feature.properties.name;
    const normalizedName = this.normalizeBarangayName(barangayName);
    const barangayDetail = this.barangayDetails.find(detail =>
      detail.name === normalizedName || detail.name === barangayName.toLowerCase()
    );
    const fillColor = barangayDetail ? this.getLivelihoodColor(barangayDetail.livelihood) : this.coloringMap.barangay;

    return {
      fillColor: fillColor,
      weight: 2,
      opacity: 1,
      color: '#333333',
      dashArray: '',
      fillOpacity: 0.7
    }
  }

  updateBarangayLabels() {
    // Labels are now always shown for all barangays, so this method
    // is kept for backward compatibility but doesn't need to do anything
    // since labels are added when the layer is loaded
  }

  removeBarangayFromSelection(barangayId: number) {
    this.selectedBarangaysFilter =
      this.selectedBarangaysFilter.filter(id => id !== barangayId);

    // Sync everything
    this.onBarangaysSelected(this.selectedBarangaysFilter);
  }

  private async onBarangaySelected(barangay: Barangay): Promise<void> {
    try {
      // Normalize name if necessary
      const normalizedName = this.normalizeBarangayName(barangay.name);

      // Find the polygon layer
      const layer = Object.values(this.barangayPolygons).find(
        (p: any) => p.properties.name === barangay.name ||
                    this.normalizeBarangayName(p.properties.name) === normalizedName
      );

      if (!layer) {
        console.error('Polygon layer not found for barangay:', barangay.name);
        return;
      }

      // Fetch complete details using the existing service
      const details = await this.barangayDetailsService.getCompleteBarangayDetails(barangay);

      // Update shared selection
      this.barangaySelectionService.setSelectedBarangay({
        barangay: details.barangay,
        barangayProfile: details.barangayProfile,
        chairman: details.chairman,
        nearestEvacuationCenters: details.nearestEvacuationCenters
      });

      this.selectedBarangay = barangay.id;
      this.selectedBarangayName = barangay.name;

      // Highlight polygon
      this.highlightSelectedBarangay(layer);

      // Show nearest evacuation center markers
      this.showNearestEvacuationCenterMarkers(details.nearestEvacuationCenters);

      // Zoom map to the barangay
      this.map.fitBounds(layer.getBounds(), {
        padding: [50, 50],
        maxZoom: 14
      });
    } catch (error) {
      console.error('Error handling barangay selection:', error);
    }
  }

  // Simulation Methods
  onSimulationStarted(params: SimulationParams): void {
    this.simulationParams = params;
    this.isSimulationActive = true;
    this.isSimulationPaused = false;
    this.currentSimulationTime = 0;

    // Remove weather layers when simulation starts
    this.removeWeatherLayers();

    // Start simulation in service
    this.simulationService.startSimulation(params, this.evacuationCenters);

    // Create initial rain overlay
    this.updateRainOverlay(0);

    // Start timelapse
    this.startSimulationTimelapse();
  }

  private startSimulationTimelapse(): void {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
    }

    // Update more frequently for smoother animation
    // Each update represents a fraction of an hour
    // Speed: 1 real second = 0.1 simulation hours (so 10 hours duration = 100 real seconds)
    const timeStep = (this.simulationParams?.duration || 1) / 100; // Complete simulation in 100 seconds

    this.simulationInterval = setInterval(() => {
      if (!this.isSimulationPaused && this.isSimulationActive && this.simulationParams) {
        this.currentSimulationTime += timeStep;

        if (this.currentSimulationTime >= this.simulationParams.duration) {
          this.currentSimulationTime = this.simulationParams.duration;
          this.stopSimulation();
          return;
        }

        // Update simulation service
        this.simulationService.updateSimulationTime(this.currentSimulationTime, this.evacuationCenters);

        // Update rain overlay with smooth animation
        this.updateRainOverlay(this.currentSimulationTime);
      }
    }, 100); // Update every 100ms for smoother animation
  }

  toggleSimulationPause(): void {
    this.isSimulationPaused = !this.isSimulationPaused;
    this.simulationService.togglePause();
  }

  stopSimulation(): void {
    this.isSimulationActive = false;
    this.isSimulationPaused = false;
    this.currentSimulationTime = 0;
    this.simulationParams = null;

    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }

    // Remove rain overlay
    this.removeRainOverlay();

    // Stop simulation in service
    this.simulationService.stopSimulation();

    // Restore weather layers when simulation stops
    if (Object.keys(this.weatherData).length > 0) {
      this.updateWeatherLayers();
    }
  }

  get simulationProgress(): number {
    if (!this.simulationParams || this.simulationParams.duration === 0) {
      return 0;
    }
    return (this.currentSimulationTime / this.simulationParams.duration) * 100;
  }

  private updateRainOverlay(time: number): void {
    if (!this.simulationParams || !this.map) return;

    // Calculate flood risk for current time
    const floodRisk = this.simulationService.calculateFloodRisk(this.simulationParams, time);
    
    // Calculate progress (0 to 1)
    const progress = time / (this.simulationParams.duration || 1);
    
    // Create pulsing effect based on time
    const pulsePhase = (time * 2) % 10; // 10 second pulse cycle
    const pulseIntensity = 0.1 + (Math.sin(pulsePhase * Math.PI / 5) * 0.1); // Vary opacity slightly

    // Remove existing rain layer
    this.removeRainOverlay();

    // Create new rain layer based on flood risk
    const rainFeatures: any[] = [];
    let featureIndex = 0;

    // Use barangay polygons to create rain overlay
    Object.values(this.barangayPolygons).forEach((polygon: any) => {
      const barangayName = polygon.properties.name;
      const normalizedName = this.normalizeBarangayName(barangayName);
      
      // Calculate risk for this barangay using deterministic method based on index
      // This ensures consistent progression without random variation
      const baseRisk = floodRisk;
      
      // Add deterministic variation based on feature index and time
      // This creates a more realistic distribution pattern
      const indexVariation = (featureIndex % 10) * 2; // 0-18% variation
      const timeVariation = Math.sin(time * 0.1 + featureIndex * 0.5) * 5; // Smooth wave pattern
      const barangayRisk = Math.max(0, Math.min(100, baseRisk + indexVariation + timeVariation));

      // Determine color based on risk with smooth gradients
      let color = '#87CEEB'; // Light blue (low)
      let opacity = 0.2 + (barangayRisk / 100) * 0.6; // Opacity scales with risk
      
      // Add pulse effect
      opacity = Math.min(1, opacity + pulseIntensity);

      // Smooth color transitions based on risk percentage
      if (barangayRisk >= 70) {
        // Purple (extreme) - blend between dark blue and purple
        const blend = (barangayRisk - 70) / 30;
        color = this.interpolateColor('#00008B', '#8B008B', blend);
      } else if (barangayRisk >= 50) {
        // Dark blue (high) - blend between blue and dark blue
        const blend = (barangayRisk - 50) / 20;
        color = this.interpolateColor('#4169E1', '#00008B', blend);
      } else if (barangayRisk >= 30) {
        // Blue (moderate) - blend between light blue and blue
        const blend = (barangayRisk - 30) / 20;
        color = this.interpolateColor('#87CEEB', '#4169E1', blend);
      } else {
        // Light blue (low) - intensity based on risk
        const intensity = barangayRisk / 30;
        color = this.interpolateColor('#E0F2FE', '#87CEEB', intensity);
        opacity = 0.1 + intensity * 0.2;
      }

      rainFeatures.push({
        type: 'Feature',
        geometry: polygon.geometry,
        properties: {
          name: barangayName,
          risk: barangayRisk,
          color: color,
          opacity: opacity
        }
      });
      
      featureIndex++;
    });

    if (rainFeatures.length > 0) {
      const rainGeoJSON = {
        type: 'FeatureCollection',
        features: rainFeatures
      };

      this.rainLayer = L.geoJSON(rainGeoJSON as any, {
        style: (feature: any) => {
          const props = feature.properties;
          const risk = props.risk;
          const color = props.color || '#87CEEB';
          const opacity = props.opacity || 0.3;

          return {
            fillColor: color,
            weight: risk > 50 ? 3 : 2,
            opacity: Math.min(1, opacity),
            color: risk > 70 ? '#FF0000' : color, // Red border for extreme risk
            dashArray: risk > 70 ? '5, 5' : '', // Dashed border for extreme
            fillOpacity: opacity
          };
        }
      });

      // Add CSS animation class to the layer and bring to front
      if (this.rainLayer && (this.rainLayer as any).eachLayer) {
        (this.rainLayer as any).eachLayer((layer: any) => {
          if (layer._path) {
            layer._path.style.transition = 'fill-opacity 0.5s ease, fill 0.5s ease';
          }
          // Bring each layer to front
          if (layer.bringToFront) {
            layer.bringToFront();
          }
        });
      }

      this.rainLayer.addTo(this.map);
    }
  }

  // Helper method to interpolate between two colors
  private interpolateColor(color1: string, color2: string, factor: number): string {
    const c1 = this.hexToRgb(color1);
    const c2 = this.hexToRgb(color2);
    
    if (!c1 || !c2) return color1;
    
    const r = Math.round(c1.r + (c2.r - c1.r) * factor);
    const g = Math.round(c1.g + (c2.g - c1.g) * factor);
    const b = Math.round(c1.b + (c2.b - c1.b) * factor);
    
    return `rgb(${r}, ${g}, ${b})`;
  }

  // Helper method to convert hex to RGB
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  private removeRainOverlay(): void {
    if (this.rainLayer) {
      this.map.removeLayer(this.rainLayer);
      this.rainLayer = null;
    }
  }

  // Weather Layers Methods (for Open Meteo data when not simulating)
  private updateWeatherLayers(): void {
    if (!this.map || !this.showWeatherLayers || Object.keys(this.weatherData).length === 0) {
      return;
    }

    // Remove existing weather layers
    this.removeWeatherLayers();

    // Create rain layer (using simulation-style overlay)
    this.createWeatherRainLayer();

    // Add weather legends
    this.addWeatherLegends();
  }

  private createWeatherRainLayer(): void {
    if (!this.map || Object.keys(this.weatherData).length === 0) return;

    const rainFeatures: any[] = [];
    let featureIndex = 0;
    let totalWithRain = 0;
    let maxRainValue = 0;

    Object.values(this.barangayPolygons).forEach((polygon: any) => {
      const barangayName = polygon.properties.name;
      const normalizedName = this.normalizeBarangayName(barangayName);
      
      // Find matching weather data
      const weather = this.weatherData[barangayName] || this.weatherData[normalizedName];
      
      if (weather) {
        // Get current rain value - check multiple possible data structures
        let currentRain = 0;
        let precipitation = 0;

        // Handle different data formats
        if (Array.isArray(weather.rain) && weather.rain.length > 0) {
          currentRain = Number(weather.rain[0]) || 0;
        } else if (typeof weather.rain === 'number') {
          currentRain = weather.rain;
        }

        if (Array.isArray(weather.precipitation) && weather.precipitation.length > 0) {
          precipitation = Number(weather.precipitation[0]) || 0;
        } else if (typeof weather.precipitation === 'number') {
          precipitation = weather.precipitation;
        }

        const rainValue = Math.max(currentRain, precipitation);

        // Always create feature, even if rain is 0 (to show all areas)
        // This ensures the layer is visible and users can see which areas have weather data
        if (rainValue > 0) {
          totalWithRain++;
          maxRainValue = Math.max(maxRainValue, rainValue);
        }

        // Use same color interpolation style as simulation
        // Convert rain value (mm) to a risk-like percentage (0-100)
        // Scale: 0mm = 0%, 50mm+ = 100%
        const rainRisk = Math.min(100, (rainValue / 50) * 100);
        
        let color = '#E0F2FE';
        let opacity = 0.1;

        // Use same color scheme as simulation with smooth interpolation
        if (rainRisk >= 70) {
          const blend = (rainRisk - 70) / 30;
          color = this.interpolateColor('#00008B', '#8B008B', blend);
          opacity = 0.6 + (blend * 0.2); // 0.6 to 0.8
        } else if (rainRisk >= 50) {
          const blend = (rainRisk - 50) / 20;
          color = this.interpolateColor('#4169E1', '#00008B', blend);
          opacity = 0.4 + (blend * 0.2); // 0.4 to 0.6
        } else if (rainRisk >= 30) {
          const blend = (rainRisk - 30) / 20;
          color = this.interpolateColor('#87CEEB', '#4169E1', blend);
          opacity = 0.2 + (blend * 0.2); // 0.2 to 0.4
        } else if (rainRisk > 0) {
          const intensity = rainRisk / 30;
          color = this.interpolateColor('#E0F2FE', '#87CEEB', intensity);
          opacity = 0.1 + (intensity * 0.1); // 0.1 to 0.2
        } else {
          color = '#E0F2FE';
          opacity = 0.05;
        }

        rainFeatures.push({
          type: 'Feature',
          geometry: polygon.geometry,
          properties: {
            name: barangayName,
            rain: rainValue,
            color: color,
            opacity: opacity
          }
        });
      }
      featureIndex++;
    });

    // Debug logging
    console.log(`Weather Rain Layer: ${totalWithRain} barangays with rain, max value: ${maxRainValue}mm`);
    if (totalWithRain > 0) {
      console.log('Sample weather data:', Object.keys(this.weatherData).slice(0, 3).map(key => ({
        key,
        hasRain: !!this.weatherData[key]?.rain,
        rainValue: Array.isArray(this.weatherData[key]?.rain) ? this.weatherData[key].rain[0] : this.weatherData[key]?.rain
      })));
    }

    // Safety check: If more than 80% of polygons have rain > 20mm, something is likely wrong with the data
    const totalPolygons = Object.keys(this.barangayPolygons).length;
    const heavyRainCount = rainFeatures.filter(f => f.properties.rain > 20).length;
    if (totalPolygons > 0 && heavyRainCount / totalPolygons > 0.8) {
      console.warn('Warning: Most areas showing heavy rain (>20mm). This may indicate invalid data. Skipping weather layer.');
      return;
    }

    // Create layer if we have features (even if no rain, to show weather data coverage)
    if (rainFeatures.length > 0) {
      const rainGeoJSON = {
        type: 'FeatureCollection',
        features: rainFeatures
      };

      this.weatherRainLayer = L.geoJSON(rainGeoJSON as any, {
        style: (feature: any) => {
          const props = feature.properties;
          const rainValue = props.rain || 0;
          const rainRisk = Math.min(100, (rainValue / 50) * 100);
          const color = props.color || '#E0F2FE';
          const opacity = props.opacity || 0.05;

          return {
            fillColor: color,
            weight: rainRisk > 50 ? 3 : 2,
            opacity: Math.min(1, opacity),
            color: rainRisk > 70 ? '#FF0000' : color,
            dashArray: rainRisk > 70 ? '5, 5' : '',
            fillOpacity: opacity
          };
        },
        onEachFeature: (feature: any, layer: any) => {
          // Add popup on click to show rain amount
          const props = feature.properties;
          const rainValue = props.rain || 0;
          layer.bindPopup(`
            <strong>${props.name}</strong><br>
            <strong>Rain Intensity:</strong> ${rainValue.toFixed(2)} mm
          `);
          
          // Add CSS transitions for smooth color changes (same as simulation)
          if (layer._path) {
            layer._path.style.transition = 'fill-opacity 0.5s ease, fill 0.5s ease';
          }
        }
      });

      // Bring each layer to front and add transitions (same as simulation)
      if (this.weatherRainLayer && (this.weatherRainLayer as any).eachLayer) {
        (this.weatherRainLayer as any).eachLayer((layer: any) => {
          if (layer.bringToFront) {
            layer.bringToFront();
          }
        });
      }

      this.weatherRainLayer.addTo(this.map);
      
      console.log(`Rain layer added with ${rainFeatures.length} features`);
    } else {
      console.warn('No rain features created. Weather data might not match barangay names.');
    }
    
    // Add weather legends after creating layers
    // (Legends are added in updateWeatherLayers method)
  }


  private removeWeatherLayers(): void {
    if (this.weatherRainLayer) {
      this.map.removeLayer(this.weatherRainLayer);
      this.weatherRainLayer = null;
    }
    // Remove weather legends
    this.removeWeatherLegends();
  }

  private weatherLegend: L.Control | null = null;

  private addWeatherLegends(): void {
    if (!this.map) return;

    // Remove existing weather legend if any
    this.removeWeatherLegends();

    // Create rain legend HTML (using same style as simulation)
    const rainLegendHtml = `
      <div class="weather-legend">
        <strong>Rain Intensity</strong><br>
        <i style="background: #E0F2FE; opacity: 0.1;"></i> <span>None/Trace (0-5 mm)</span><br>
        <i style="background: #87CEEB; opacity: 0.2;"></i> <span>Light (5-15 mm)</span><br>
        <i style="background: #4169E1; opacity: 0.4;"></i> <span>Moderate (15-25 mm)</span><br>
        <i style="background: #00008B; opacity: 0.6;"></i> <span>Heavy (25-35 mm)</span><br>
        <i style="background: #8B008B; opacity: 0.8;"></i> <span>Extreme (>35 mm)</span>
      </div>
    `;

    // Use only rain legend
    const combinedLegendHtml = rainLegendHtml;

    // Create Leaflet control for weather legend
    this.weatherLegend = new L.Control({ position: 'bottomright' });

    this.weatherLegend.onAdd = () => {
      const div = L.DomUtil.create('div', 'weather-legend-container');
      div.innerHTML = combinedLegendHtml;
      div.style.cssText = `
        background: rgba(255, 255, 255, 0.95);
        padding: 10px 12px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        border: 1px solid rgba(0, 0, 0, 0.1);
        font-family: Arial, Helvetica, sans-serif;
        font-size: 11px;
        line-height: 1.4;
        max-width: 200px;
      `;
      
      // Prevent map click when clicking legend
      L.DomEvent.disableClickPropagation(div);
      
      return div;
    };

    if (this.weatherLegend) {
      this.weatherLegend.addTo(this.map);
    }
  }

  private removeWeatherLegends(): void {
    if (this.weatherLegend) {
      this.map.removeControl(this.weatherLegend);
      this.weatherLegend = null;
    }
  }

}
