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

  selectedBarangay: number | null = null;

  filters = {
    evacuationCenters: false,
    officials: false,
  };

  private evacuationLocations = [
    { name: 'tigbao', coords:[11.2375868, 124.7133698], venue: 'Tigbao Elementary School', image: './assets/images/tigbaoES.jpg' },
    { name: 'piloro', coords:[11.236402318756134, 124.72036848648168], venue: 'Piloro Barangay Hall', image: './assets/images/Car.jpg' },
    { name: 'camansi', coords:[11.21849108135362, 124.71573441769323], venue: 'Camansi Elementary School', image: './assets/images/camansiES.jpg' },
    { name: 'tinaguban', coords:[11.2331392, 124.7056969], venue: 'Tinaguban Elementary School', image: './assets/images/tinagubanES.jpg' },
    { name: 'jugaban', coords:[11.2991697, 124.6943891], venue: 'JugabanPopup - Jugaban National High School', image: './assets/images/jugabanNHS.jpg' },
    { name: 'san_mateo', coords:[11.2691869, 124.7259261], venue: 'Evacuation Center 1 (Baybay)', image: './assets/images/carigaraEC.jpg'  },
    { name: 'guindapunan_west', coords:[11.301429126326795, 124.69863695804366], venue: 'West Guindapunan Chapell', image: './assets/images/Car.jpg'  },
    { name: 'guindapunan_east', coords:[11.302470879288492, 124.70122314248277], venue: 'Guindapunan Elementary School', image: './assets/images/guindapunanES.jpg'  },
    { name: 'barugohay_norte1', coords:[11.3033755,124.7075573], venue: 'Carigara National Professional School', image: './assets/images/cnvs.jpg'  },
    { name: 'barugohay_norte2', coords:[11.3032152,124.7066521], venue: 'Eastern Visayas State University', image: './assets/images/evsucc.jpg'  },
    { name: 'parena', coords:[11.298482428935586, 124.71232105275067], venue: 'Parena Barangay Hall', image: './assets/images/Car.jpg'  },
    { name: 'sawang', coords:[11.2992552, 124.6869251], venue: 'Sawang Catholic Chapel', image: './assets/images/sawangchapel.jpg' },
    { name: 'baybay', coords:[11.3001395,124.6866239], venue: 'Cong. Alberto T. Acuja Memorial Central School', image: './assets/images/ptaES.jpg' },
    { name: 'ponong1', coords:[11.297020125112155, 124.68252689499673], venue: 'Ponong Elementary School', image: './assets/images/ponongES.jpg' },
    { name: 'ponong2', coords:[11.2978262, 124.6824307], venue: 'Carigara National High School', image: './assets/images/carigaraNHS.jpg' },
    { name: 'ponong3', coords:[11.3006686, 124.6863469], venue: 'Carigara Parish Church', image: './assets/images/carigarachurch.jpg' },
    { name: 'ponong4', coords:[11.30026, 124.6851016], venue: 'Holy Cross College of Carigara', image: './assets/images/hccci.jpg' },
    { name: 'ponong5', coords:[11.3012958, 124.6868381], venue: 'Cassidy Elementary School', image: './assets/images/cassidyES.jpg' },
    { name: 'west_visoria2', coords:[11.30218474574454, 124.68133417635846], venue: 'Seventh Day Adventist Church', image: './assets/images/seventhadventist.jpg' },
    { name: 'west_visoria3', coords:[11.30218474574454, 124.68133417635846], venue: 'United Christian Church of the Philippines', image: './assets/images/unitedchurch.jpg' },
    { name: 'east_visoria', coords:[11.2989631, 124.6786982], venue: 'New Life Christian Church', image: './assets/images/newlifecarigara.jpg' },
    { name: 'tangnan', coords:[11.297766, 124.6702727], venue: 'Tangnan Barangay Hall', image: './assets/images/tangnanBH.jpg' },
    { name: 'nauguisan', coords:[11.294851119638508, 124.6622293581704], venue: 'Nauguisan Elementary School', image: './assets/images/nauguisanES.jpg' },
    { name: 'san_juan', coords:[11.289751866680746, 124.66142138289877], venue: 'San Juan Barangay Hall', image: './assets/images/sanjuanBH.jpg' },
    { name: 'manloy', coords:[11.274892635379118, 124.65437594384838], venue: 'Manloy Elementary School', image: './assets/images/Car.jpg' },
    { name: 'caghalo', coords:[11.260928247291645, 124.66692030297861], venue: 'Caghalo Elementary School', image: './assets/images/caghaloES.jpg' },
    { name: 'upper_hiraan1', coords:[11.2648, 124.6759], venue: 'Upper Hiraan Barangay Hall', image: './assets/images/Car.jpg' },
    { name: 'upper_hiraan2', coords:[11.265246762928768, 124.67697129266298], venue: 'Hiraan Elementary School', image: './assets/images/hiraanES.jpg' },
    { name: 'lower_hiraan', coords:[11.2795, 124.6786], venue: 'Lower Hiraan Barangay Hall', image: './assets/images/Car.jpg' },
    { name: 'libo', coords:[11.266721745379868, 124.68083971796977], venue: 'Libo Barangay Hall', image: './assets/images/liboBH.jpg' },
    { name: 'canlampay1', coords:[11.265940493645303, 124.68529656173274], venue: 'Canlampay Barangay Hall', image: './assets/images/Car.jpg' },
    { name: 'canlampay2', coords:[11.263751626499598, 124.68557038762572], venue: 'Canlampay Elementary School', image: './assets/images/canlampayES.jpg' },
    { name: 'hiluctogan', coords:[11.2473838, 124.6878364], venue: 'Hiluctogan Elementary School', image: './assets/images/hiluctoganES.jpg' },
    { name: 'bislig1', coords:[11.292457563772857, 124.6772379129253], venue: 'Bislig Barangay Hall', image: './assets/images/bisligBH.jpg' },
    { name: 'bislig2', coords:[11.293430779370212, 124.67548820806826], venue: 'Bislig Evacuation Center', image: './assets/images/bisligEvac.jpg' },
    { name: 'canal', coords:[11.2878292, 124.6825409], venue: 'Canal Barangay Hall', image: './assets/images/canalBH.jpg' },
    { name: 'uyawan', coords:[11.282287385990031, 124.68409130036338], venue: 'Uyawan Barangay Hall', image: './assets/images/uyawanBH.jpg' },
    { name: 'barayong', coords:[  11.2682, 124.6722], venue: 'Barayong Barangay Hall', image: './assets/images/barayongBH.jpg' },
    { name: 'lower_sogod', coords:[11.2590973, 124.6900857], venue: 'Lower Sogod Elementary School', image: './assets/images/sogodES.jpg' },
    { name: 'upper_sogod', coords:[11.2536, 124.6931], venue: 'Upper Sogod Barangay Hall', image: './assets/images/uppersogodBH.jpg' },
    { name: 'candigahub', coords:[11.2504379, 124.7001859], venue: 'Candigahub Elementary School', image: './assets/images/candigahubES.jpg' },
    { name: 'cutay', coords:[11.2650511, 124.6986922], venue: 'Cutay Barangay Hall', image: './assets/images/cutayBH.jpg' },
    { name: 'pangna', coords:[  11.2798, 124.7101], venue: 'Pangna Elementary School', image: './assets/images/pangnaES.jpg' },
    { name: 'baruguhay_sur', coords:[11.2709821,124.7004102], venue: 'Barugohay Sur Elementary School', image: './assets/images/barsurES.jpg' },
    { name: 'bagong_lipunan', coords:[11.2843, 124.6987], venue: 'Bagong Lipunan Barangay Hall', image: './assets/images/bagonglipunanBH.jpg' },
    { name: 'balilit', coords:[11.28736949670612, 124.69583232220117], venue: 'Balilit Elementary School', image: './assets/images/balilitES.jpg' },
    { name: 'barugohay_central', coords:[11.2960, 124.6986], venue: 'Barugohay Central Barangay Hall', image: './assets/images/Car.jpg' },
    { name: 'tagak', coords:[11.2872453, 124.7160603], venue: 'Tagak Elementary School', image: './assets/images/Car.jpg' },
    { name: 'rizal', coords:[11.286840266447967, 124.7166593458391], venue: 'Rizal Barangay Hall', image: './assets/images/Car.jpg' },
    { name: 'sagkahan', coords:[11.2811415, 124.7225726], venue: 'Ecoville', image: './assets/images/Car.jpg' },
    { name: 'canfabi', coords:[11.2662922, 124.7085475], venue: 'Canfabi Elementary School', image: './assets/images/canfabiES.jpg' },
    { name: 'santa_fe', coords:[11.2568516, 124.7150913], venue: 'Sta. Fe Barangay Hall', image: './assets/images/Car.jpg' },
    { name: 'parag_um', coords:[11.257343004963658, 124.72799419450331], venue: 'Parag-um Barangay Hall', image: './assets/images/paglaumBH.jpg' },
    { name: 'cogon', coords:[11.2577, 124.7365], venue: 'Cogon Barangay Hall', image: './assets/images/Car.jpg' },
    { name: 'binibihan', coords:[11.233367805199322, 124.73453629750668], venue: 'Binibihan Elem. School', image: './assets/images/binibihanES.jpg' },
    { name: 'macalpi', coords:[11.2132913924805, 124.73425541862093], venue: 'Macalpi Elementary School', image: './assets/images/macalpiES.jpg' },
    { name: 'paglaum', coords:[11.2045, 124.7188], venue: 'Paglaum Barangay Hall', image: './assets/images/paglaumBH.jpg' },
    { name: 'san_isidro', coords:[11.204579867259937, 124.70810276172983], venue: 'San Isidro Barangay Hall', image: './assets/images/sanisidroBH.jpg' },
  ];

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
    this.map = L.map('map', {
      center: [11.232084301848886, 124.7057818628441],
      zoom: 12,
      zoomControl: false,
      attributionControl: false,
    });

    // Add the fullscreen control
    this.map.addControl(new L.Control.Fullscreen({
      content: '<i class="fa fa-expand"></i>',
      title: {
        'false': 'View Fullscreen',
        'true': 'Exit Fullscreen'},
      contentCancel: '<i class="fa fa-compress"></i>',
    }));

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

    //Evacuation Center Popup
    const tigbaoPopup = '<div class="customPopup"><figure><img src="./assets/images/tigbaoES.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Tigbao Elementary School </a></div></div>';
    const piloroPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Barangay Hall</a></div></div>';
    const camansiPopup = '<div class="customPopup"><figure><img src="./assets/images/camansiES.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Camansi Elementary School</a></div></div>';
    const tinagubanPopup = '<div class="customPopup"><figure><img src="./assets/images/tinagubanES.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Tinaguban Elementary School </a></div></div>';
    const jugabanPopup = '<div class="customPopup"><figure><img src="./assets/images/jugabanNHS.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Jugaban National High School</a></div></div>';
    const sanMateoPopup = '<div class="customPopup"><figure><img src="./assets/images/carigaraEC.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Evacuation Center 1 (Baybay)</a></div></div>';
    const guindapunanWestPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>West Guindapunan Chapell</a></div></div>';
    const guindapunanEastPopup = '<div class="customPopup"><figure><img src="./assets/images/guindapunanES.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Guindapunan Elementary School</a></div></div>';
    const barugohayNorte1Popup = '<div class="customPopup"><figure><img src="./assets/images/cnvs.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Carigara National Professional School</a></div></div>';
    const barugohayNorte2Popup = '<div class="customPopup"><figure><img src="./assets/images/evsucc.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Eastern Visayas State University</a></div></div>';
    const parenaPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Parena Barangay Hall</a></div></div>';
    const sawangPopup = '<div class="customPopup"><figure><img src="./assets/images/sawangchapel.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Sawang Catholic Chapel</a></div></div>';
    const baybayPopup = '<div class="customPopup"><figure><img src="./assets/images/ptaES.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Cong. Alberto T. Acuja Memorial Central School</a></div></div>';
    const ponong1Popup = '<div class="customPopup"><figure><img src="./assets/images/ponongES.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Ponong Elementary School </a></div></div>';
    const ponong2Popup = '<div class="customPopup"><figure><img src="./assets/images/carigaraNHS.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Carigara National High School </a></div></div>';
    const ponong3Popup = '<div class="customPopup"><figure><img src="./assets/images/carigarachurch.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Carigara Parish Church </a></div></div>';
    const ponong4Popup = '<div class="customPopup"><figure><img src="./assets/images/hccci.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Holy Cross College of Carigara </a></div></div>';
    const ponong5Popup = '<div class="customPopup"><figure><img src="./assets/images/cassidyES.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Cassidy Elementary School </a></div></div>';
    const westVisoria2Popup = '<div class="customPopup"><figure><img src="./assets/images/seventhadventist.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Seventh Day Adventist Church </a></div></div>';
    const westVisoria3Popup = '<div class="customPopup"><figure><img src="./assets/images/unitedchurch.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>United Christian Church of the Philippines </a></div></div>';
    const eastVisoriaPopup = '<div class="customPopup"><figure><img src="./assets/images/newlifecarigara.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>New Life Christian Church </a></div></div>';
    const tangnanPopup = '<div class="customPopup"><figure><img src="./assets/images/tangnanBH.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Tangnan Barangay Hall </a></div></div>';
    const nauguisanPopup = '<div class="customPopup"><figure><img src="./assets/images/nauguisanES.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Nauguisan Elementary School </a></div></div>';
    const sanJuanPopup = '<div class="customPopup"><figure><img src="./assets/images/sanjuanBH.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>San Juan Barangay Hall</a></div></div>';
    const manloyPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Manloy Elementary School</a></div></div>';
    const caghaloPopup = '<div class="customPopup"><figure><img src="./assets/images/caghaloES.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Caghalo Elementary School</a></div></div>';
    const upperHiraan1Popup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Upper Hiraan Barangay Hall </a></div></div>';
    const upperHiraan2Popup = '<div class="customPopup"><figure><img src="./assets/images/hiraanES.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Hiraan Elementary School</a></div></div>';
    const lowerHiraanPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Lower Hiraan Barangay Hall</a></div></div>';
    const liboPopup = '<div class="customPopup"><figure><img src="./assets/images/liboBH.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Libo Barangay Hall</a></div></div>';
    const canlampay1Popup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Canlampay Barangay Hall</a></div></div>';
    const canlampay2Popup = '<div class="customPopup"><figure><img src="./assets/images/canlampayES.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Canlampay Elementary School</a></div></div>';
    const hiluctuganPopup = '<div class="customPopup"><figure><img src="./assets/images/hiluctoganES.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Hiluctogan Elementary School </a></div></div>';
    const bislig1Popup = '<div class="customPopup"><figure><img src="./assets/images/bisligBH.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Bislig Barangay Hall </a></div></div>';
    const bislig2Popup = '<div class="customPopup"><figure><img src="./assets/images/bisligEvac.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Bislig Evacuation Center </a></div></div>';
    const canalPopup = '<div class="customPopup"><figure><img src="./assets/images/canal.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Canal Barangay Hall</a></div></div>';
    const uyawanPopup = '<div class="customPopup"><figure><img src="./assets/images/uyawanBH.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Uyawan Barangay Hall </a></div></div>';
    const barayongPopup = '<div class="customPopup"><figure><img src="./assets/images/barayongBH.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Barayong Barangay Hall </a></div></div>';
    const lowerSogodPopup = '<div class="customPopup"><figure><img src="./assets/images/sogodES.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Lower Sogod Elementary School</a></div></div>';
    const upperSogodPopup = '<div class="customPopup"><figure><img src="./assets/images/uppersogodBH.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Upper Sogod Barangay Hall</a></div></div>';
    const candigahubPopup = '<div class="customPopup"><figure><img src="./assets/images/candigahubES.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Candigahub Elementary School</a></div></div>';
    const cutayPopup = '<div class="customPopup"><figure><img src="./assets/images/cutayBH.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Cutay Barangay Hall</a></div></div>';
    const pangnaPopup = '<div class="customPopup"><figure><img src="./assets/images/pangnaES.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Pangna Elementary School</a></div></div>';
    const baruguhaySurPopup = '<div class="customPopup"><figure><img src="./assets/images/barsurES.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Barugohay Sur Elementary School</a></div></div>';
    const bagongLipunanPopup = '<div class="customPopup"><figure><img src="./assets/images/bagonglipunanBH.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Bagong Lipunan Barangay Hall</a></div></div>';
    const balilitPopup = '<div class="customPopup"><figure><img src="./assets/images/balilitES.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Balilit Elementary School</a></div></div>';
    const barugohayCentralPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Barugohay Central Barangay Hall </a></div></div>';
    const tagakPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Tagak Elementary School </a></div></div>';
    const rizalPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Rizal Barangay Hall </a></div></div>';
    const sagkahanPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Ecoville</a></div></div>';
    const canfabiPopup = '<div class="customPopup"><figure><img src="./assets/images/canfabiES.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Canfabi Elementary School</a></div></div>';
    const santaFePopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Sta. Fe Barangay Hall </a></div></div>';
    const paragUmPopup = '<div class="customPopup"><figure><img src="./assets/images/paragumBH.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Parag-um Barangay Hall</a></div></div>';
    const cogonPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Cogon Barangay Hall</a></div></div>';
    const binibihanPopup = '<div class="customPopup"><figure><img src="./assets/images/binibihanES.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Binibihan Elem. School </a></div></div>';
    const macalpiPopup = '<div class="customPopup"><figure><img src="./assets/images/macalpiES.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Macalpi Elementary School</a></div></div>';
    const paglaumPopup = '<div class="customPopup"><figure><img src="./assets/images/paglaumBH.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Paglaum Barangay Hall </a></div></div>';
    const sanIsidroPopup = '<div class="customPopup"><figure><img src="./assets/images/sanisidroBH.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>San Isidro Barangay Hall</a></div></div>';

    //barangay officials Popup
    const tigbaoOfficial = '<div class="customPopup"><figure><figcaption>Punong Barangay</figcaption></figure><div>Benjamin I. Engrato</a></div></div>';
    const piloroOfficial = '<div class="customPopup"><figure><figcaption>Punong Barangay</figcaption></figure><div>Eutiquio P. Dauplo </a></div></div>';
    const camansiOfficial = '<div class="customPopup"><figure><figcaption>Punong Barangay</figcaption></figure><div>Glicerio T. Yacap</a></div></div>';
    const tinagubanOfficial = '<div class="customPopup"><figure><figcaption>Punong Barangay</figcaption></figure><div>Pedro T. Ingrato</a></div></div>';
    const jugabanOfficial = '<div class="customPopup"><figure><figcaption>Punong Barangay</figcaption></figure><div>Pedro D. Royo</a></div></div>';
    const san_mateoOfficial = '<div class="customPopup"><figure><figcaption>Punong Barangay</figcaption></figure><div>Christopher T. Cañamaque</a></div></div>';
    const guindapunan_westOfficial = '<div class="customPopup"><figure><figcaption>Punong Barangay</figcaption></figure><div>Anita M. Villalino</a></div></div>';
    const guindapunan_eastOfficial = '<div class="customPopup"><figure><figcaption>Punong Barangay</figcaption></figure><div>Wendell J. Agunos</a></div></div>';
    const barugohay_norteOfficial = '<div class="customPopup"><figure><figcaption>Punong Barangay</figcaption></figure><div>Grace B. Cabello</a></div></div>';
    const parenaOfficial = '<div class="customPopup"><figure><figcaption>Punong Barangay</figcaption></figure><div>Felipe M. Ramos</a></div></div>';
    const sawangOfficial = '<div class="customPopup"><figure><figcaption>Punong Barangay</figcaption></figure><div>Garnet Dax M. Tonolete</a></div></div>';
    const baybayOfficial = '<div class="customPopup"><figure><figcaption>Punong Barangay</figcaption></figure><div>Raniel A. Marquez</a></div></div>';
    const ponongOfficial = '<div class="customPopup"><figure><figcaption>Punong Barangay</figcaption></figure><div>Arvin N. Urmeneta</a></div></div>';
    const west_visoriaOfficial = '<div class="customPopup"><figure><figcaption>Punong Barangay</figcaption></figure><div>Ismael N. Vega</a></div></div>';
    const east_visoriaOfficial = '<div class="customPopup"><figure><figcaption>Punong Barangay</figcaption></figure><div>Joena E. Naagas</a></div></div>';
    const tangnanOfficial = '<div class="customPopup"><figure><figcaption>Punong Barangay</figcaption></figure><div>Francisco C. Nivera</a></div></div>';
    const nauguisanOfficial = '<div class="customPopup"><figure><figcaption>Punong Barangay</figcaption></figure><div>Eduardo D. Villaruel</a></div></div>';
    const san_juanOfficial = '<div class="customPopup"><figure><figcaption>Punong Barangay</figcaption></figure><div>Terencio M. Lianza</a></div></div>';
    const manloyOfficial = '<div class="customPopup"><figure><figcaption>Punong Barangay</figcaption></figure><div>Eduardo I. Combinido</a></div></div>';
    const caghaloOfficial = '<div class="customPopup"><figure><figcaption>Punong Barangay</figcaption></figure><div>Lito I. Ligutan</a></div></div>';
    const upper_hiraanOfficial = '<div class="customPopup"><figure><figcaption>Punong Barangay</figcaption></figure><div>Joel R. Gaquit</a></div></div>';
    const lower_hiraanOfficial = '<div class="customPopup"><figure><figcaption>Punong Barangay</figcaption></figure><div>Jocelyn V. Caballes</a></div></div>';
    const liboOfficial = '<div class="customPopup"><figure><figcaption>Punong Barangay</figcaption></figure><div>Constantino W. Cadiente Jr.</a></div></div>';
    const canlampayOfficial = '<div class="customPopup"><figure><figcaption>Punong Barangay</figcaption></figure><div>Ramil F. Narbonita</a></div></div>';
    const hiluctuganOfficial = '<div class="customPopup"><figure><figcaption>Punong Barangay</figcaption></figure><div>Narciso L. Anos</a></div></div>';
    const bisligOfficial = '<div class="customPopup"><figure><figcaption>Punong Barangay</figcaption></figure><div>Romeo M. Javines</a></div></div>';
    const canalOfficial = '<div class="customPopup"><figure><figcaption>Punong Barangay</figcaption></figure><div>Cresente L. Llagas</a></div></div>';
    const uyawanOfficial = '<div class="customPopup"><figure><figcaption>Punong Barangay</figcaption></figure><div>Prima J. Azores</a></div></div>';
    const barayongOfficial = '<div class="customPopup"><figure><figcaption>Punong Barangay</figcaption></figure><div>Julius Cesar N. Caballes</a></div></div>';
    const lower_sogodOfficial = '<div class="customPopup"><figure><figcaption>Punong Barangay</figcaption></figure><div>Jose L. Platilla Jr.</a></div></div>';
    const upper_sogodOfficial = '<div class="customPopup"><figure><figcaption>Punong Barangay</figcaption></figure><div>Norma M. Inalisan</a></div></div>';
    const candigahubOfficial = '<div class="customPopup"><figure><figcaption>Punong Barangay</figcaption></figure><div>Jordan O. Inalisan</a></div></div>';
    const cutayOfficial = '<div class="customPopup"><figure><figcaption>Punong Barangay</figcaption></figure><div>Nestor P. Dagalea</a></div></div>';
    const pangnaOfficial = '<div class="customPopup"><figure><figcaption>Punong Barangay</figcaption></figure><div>Genilo C. Nalda</a></div></div>';
    const baruguhay_surOfficial = '<div class="customPopup"><figure><figcaption>Punong Barangay</figcaption></figure><div>Antonio L. Agunos</a></div></div>';
    const bagong_lipunanOfficial = '<div class="customPopup"><figure><figcaption>Punong Barangay</figcaption></figure><div>Isaac B. Grabador Jr.</a></div></div>';
    const balilitOfficial = '<div class="customPopup"><figure><figcaption>Punong Barangay</figcaption></figure><div>Felipe D. Macabansag</a></div></div>';
    const barugohay_centralOfficial = '<div class="customPopup"><figure><figcaption>Punong Barangay</figcaption></figure><div>Elmer C. Opeña</a></div></div>';
    const tagakOfficial = '<div class="customPopup"><figure><figcaption>Punong Barangay</figcaption></figure><div>Johnyl T. Tanginan</a></div></div>';
    const rizalOfficial = '<div class="customPopup"><figure><figcaption>Punong Barangay</figcaption></figure><div>Renato M. Capalar</a></div></div>';
    const sagkahanOfficial = '<div class="customPopup"><figure><figcaption>Punong Barangay</figcaption></figure><div>Fernando N. Moriel</a></div></div>';
    const canfabiOfficial = '<div class="customPopup"><figure><figcaption>Punong Barangay</figcaption></figure><div>Ryan I. Rendora</a></div></div>';
    const santa_feOfficial = '<div class="customPopup"><figure><figcaption>Punong Barangay</figcaption></figure><div>Janet B. Mendoza</a></div></div>';
    const parag_umOfficial = '<div class="customPopup"><figure><figcaption>Punong Barangay</figcaption></figure><div>Judith D. Darantinao</a></div></div>';
    const cogonOfficial = '<div class="customPopup"><figure><figcaption>Punong Barangay</figcaption></figure><div>Romeo C. Lirom</a></div></div>';
    const binibihanOfficial = '<div class="customPopup"><figure><figcaption>Punong Barangay</figcaption></figure><div>Sisinio B. Alalid Jr.</a></div></div>';
    const macalpiOfficial = '<div class="customPopup"><figure><figcaption>Punong Barangay</figcaption></figure><div>Ador P. Bodo</a></div></div>';
    const paglaumOfficial = '<div class="customPopup"><figure><figcaption>Punong Barangay</figcaption></figure><div>Margie F. Grabador</a></div></div>';
    const san_isidroOfficial = '<div class="customPopup"><figure><figcaption>Punong Barangay</figcaption></figure><div>Benjiemen Y. Inalisan</a></div></div>';

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

    //Barangay Evacuation Center Markers
    const tigbao = L.marker([11.2375868, 124.7133698], {icon: pulseIcon}).bindPopup(tigbaoPopup).on("click", this.clickZoom.bind(this)),
          piloro = L.marker([11.236402318756134, 124.72036848648168], {icon: pulseIcon}).bindPopup(piloroPopup).on("click", this.clickZoom.bind(this)),
          camansi = L.marker([11.21849108135362, 124.71573441769323], {icon: pulseIcon}).bindPopup(camansiPopup).on("click", this.clickZoom.bind(this)),
          tinaguban = L.marker([11.2331392, 124.7056969], {icon: pulseIcon}).bindPopup(tinagubanPopup).on("click", this.clickZoom.bind(this)),
          jugaban = L.marker([11.2991697, 124.6943891], {icon: pulseIcon}).bindPopup(jugabanPopup).on("click", this.clickZoom.bind(this)),
          san_mateo = L.marker([11.2691869, 124.7259261], {icon: pulseIcon}).bindPopup(sanMateoPopup).on("click", this.clickZoom.bind(this)),
          guindapunan_west = L.marker([11.301429126326795, 124.69863695804366], {icon: pulseIcon}).bindPopup(guindapunanWestPopup).on("click", this.clickZoom.bind(this)),
          guindapunan_east = L.marker([11.302470879288492, 124.70122314248277], {icon: pulseIcon}).bindPopup(guindapunanEastPopup).on("click", this.clickZoom.bind(this)),
          barugohay_norte1 = L.marker([11.3033755,124.7075573], {icon: pulseIcon}).bindPopup(barugohayNorte1Popup).on("click", this.clickZoom.bind(this)),
          barugohay_norte2 = L.marker([11.3032152,124.7066521], {icon: pulseIcon}).bindPopup(barugohayNorte2Popup).on("click", this.clickZoom.bind(this)),
          parena = L.marker([11.298482428935586, 124.71232105275067], {icon: pulseIcon}).bindPopup(parenaPopup).on("click", this.clickZoom.bind(this)),
          sawang = L.marker([11.2992552, 124.6869251], {icon: pulseIcon}).bindPopup(sawangPopup).on("click", this.clickZoom.bind(this)),
          baybay = L.marker([11.3001395,124.6866239], {icon: pulseIcon}).bindPopup(baybayPopup).on("click", this.clickZoom.bind(this)),
          ponong1 = L.marker([11.297020125112155, 124.68252689499673], {icon: pulseIcon}).bindPopup(ponong1Popup).on("click", this.clickZoom.bind(this)),
          ponong2 = L.marker([11.2978262, 124.6824307], {icon: pulseIcon}).bindPopup(ponong2Popup).on("click", this.clickZoom.bind(this)),
          ponong3 = L.marker([11.3006686, 124.6863469], {icon: pulseIcon}).bindPopup(ponong3Popup).on("click", this.clickZoom.bind(this)),
          ponong4 = L.marker([11.30026, 124.6851016], {icon: pulseIcon}).bindPopup(ponong4Popup).on("click", this.clickZoom.bind(this)),
          ponong5 = L.marker([11.3012958, 124.6868381], {icon: pulseIcon}).bindPopup(ponong5Popup).on("click", this.clickZoom.bind(this)),
          west_visoria2 = L.marker([11.30218474574454, 124.68133417635846], {icon: pulseIcon}).bindPopup(westVisoria2Popup).on("click", this.clickZoom.bind(this)),
          west_visoria3 = L.marker([11.30218474574454, 124.68133417635846], {icon: pulseIcon}).bindPopup(westVisoria3Popup).on("click", this.clickZoom.bind(this)),
          east_visoria = L.marker([11.2989631, 124.6786982], {icon: pulseIcon}).bindPopup(eastVisoriaPopup).on("click", this.clickZoom.bind(this)),
          tangnan = L.marker([11.297766, 124.6702727], {icon: pulseIcon}).bindPopup(tangnanPopup).on("click", this.clickZoom.bind(this)),
          nauguisan = L.marker([11.294851119638508, 124.6622293581704], {icon: pulseIcon}).bindPopup(nauguisanPopup).on("click", this.clickZoom.bind(this)),
          san_juan = L.marker([11.289751866680746, 124.66142138289877], {icon: pulseIcon}).bindPopup(sanJuanPopup).on("click", this.clickZoom.bind(this)),
          manloy = L.marker([11.274892635379118, 124.65437594384838], {icon: pulseIcon}).bindPopup(manloyPopup).on("click", this.clickZoom.bind(this)),
          caghalo = L.marker([11.260928247291645, 124.66692030297861], {icon: pulseIcon}).bindPopup(caghaloPopup).on("click", this.clickZoom.bind(this)),
          upper_hiraan1 = L.marker([11.2648, 124.6759], {icon: pulseIcon}).bindPopup(upperHiraan1Popup).on("click", this.clickZoom.bind(this)),
          upper_hiraan2 = L.marker([11.265246762928768, 124.67697129266298], {icon: pulseIcon}).bindPopup(upperHiraan2Popup).on("click", this.clickZoom.bind(this)),
          lower_hiraan = L.marker([11.2795, 124.6786], {icon: pulseIcon}).bindPopup(lowerHiraanPopup).on("click", this.clickZoom.bind(this)),
          libo = L.marker([11.266721745379868, 124.68083971796977], {icon: pulseIcon}).bindPopup(liboPopup).on("click", this.clickZoom.bind(this)),
          canlampay1 = L.marker([11.265940493645303, 124.68529656173274], {icon: pulseIcon}).bindPopup(canlampay1Popup).on("click", this.clickZoom.bind(this)),
          canlampay2 = L.marker([11.263751626499598, 124.68557038762572], {icon: pulseIcon}).bindPopup(canlampay2Popup).on("click", this.clickZoom.bind(this)),
          hiluctugan = L.marker([11.2473838, 124.6878364], {icon: pulseIcon}).bindPopup(hiluctuganPopup).on("click", this.clickZoom.bind(this)),
          bislig1 = L.marker([11.292457563772857, 124.6772379129253], {icon: pulseIcon}).bindPopup(bislig1Popup).on("click", this.clickZoom.bind(this)),
          bislig2 = L.marker([11.293430779370212, 124.67548820806826], {icon: pulseIcon}).bindPopup(bislig2Popup).on("click", this.clickZoom.bind(this)),
          canal = L.marker([11.2878292, 124.6825409], {icon: pulseIcon}).bindPopup(canalPopup).on("click", this.clickZoom.bind(this)),
          uyawan = L.marker([11.282287385990031, 124.68409130036338], {icon: pulseIcon}).bindPopup(uyawanPopup).on("click", this.clickZoom.bind(this)),
          barayong = L.marker([	11.2682, 124.6722], {icon: pulseIcon}).bindPopup(barayongPopup).on("click", this.clickZoom.bind(this)),
          lower_sogod = L.marker([11.2590973, 124.6900857], {icon: pulseIcon}).bindPopup(lowerSogodPopup ).on("click", this.clickZoom.bind(this)),
          upper_sogod = L.marker([11.2536, 124.6931], {icon: pulseIcon}).bindPopup(upperSogodPopup).on("click", this.clickZoom.bind(this)),
          candigahub = L.marker([11.2504379, 124.7001859], {icon: pulseIcon}).bindPopup(candigahubPopup).on("click", this.clickZoom.bind(this)),
          cutay = L.marker([11.2650511, 124.6986922], {icon: pulseIcon}).bindPopup(cutayPopup).on("click", this.clickZoom.bind(this)),
          pangna = L.marker([	11.2798, 124.7101], {icon: pulseIcon}).bindPopup(pangnaPopup).on("click", this.clickZoom.bind(this)),
          baruguhay_sur = L.marker([11.2709821,124.7004102], {icon: pulseIcon}).bindPopup(baruguhaySurPopup).on("click", this.clickZoom.bind(this)),
          bagong_lipunan = L.marker([11.2843, 124.6987], {icon: pulseIcon}).bindPopup(bagongLipunanPopup).on("click", this.clickZoom.bind(this)),
          balilit = L.marker([11.28736949670612, 124.69583232220117], {icon: pulseIcon}).bindPopup(balilitPopup).on("click", this.clickZoom.bind(this)),
          barugohay_central = L.marker([11.2960, 124.6986], {icon: pulseIcon}).bindPopup(barugohayCentralPopup).on("click", this.clickZoom.bind(this)),
          tagak = L.marker([11.2872453, 124.7160603], {icon: pulseIcon}).bindPopup(tagakPopup).on("click", this.clickZoom.bind(this)),
          rizal = L.marker([11.286840266447967, 124.7166593458391], {icon: pulseIcon}).bindPopup(rizalPopup).on("click", this.clickZoom.bind(this)),
          sagkahan = L.marker([11.2811415, 124.7225726], {icon: pulseIcon}).bindPopup(sagkahanPopup).on("click", this.clickZoom.bind(this)),
          canfabi = L.marker([11.2662922, 124.7085475], {icon: pulseIcon}).bindPopup(canfabiPopup).on("click", this.clickZoom.bind(this)),
          santa_fe = L.marker([11.2568516, 124.7150913], {icon: pulseIcon}).bindPopup(santaFePopup).on("click", this.clickZoom.bind(this)),
          parag_um = L.marker([11.257343004963658, 124.72799419450331], {icon: pulseIcon}).bindPopup(paragUmPopup).on("click", this.clickZoom.bind(this)),
          cogon = L.marker([11.2577, 124.7365], {icon: pulseIcon}).bindPopup(cogonPopup).on("click", this.clickZoom.bind(this)),
          binibihan = L.marker([11.233367805199322, 124.73453629750668], {icon: pulseIcon}).bindPopup(binibihanPopup).on("click", this.clickZoom.bind(this)),
          macalpi = L.marker([11.2132913924805, 124.73425541862093], {icon: pulseIcon}).bindPopup(macalpiPopup).on("click", this.clickZoom.bind(this)),
          paglaum = L.marker([11.2045, 124.7188], {icon: pulseIcon}).bindPopup(paglaumPopup ).on("click", this.clickZoom.bind(this)),
          san_isidro = L.marker([11.204579867259937, 124.70810276172983], {icon: pulseIcon}).bindPopup(sanIsidroPopup).on("click", this.clickZoom.bind(this));

    //Grouped Layers of Barangay Ecacuation Center
    // const groupedEvacCenter = L.layerGroup([tigbao, piloro, camansi, tinaguban, jugaban,
    //                                       san_mateo, guindapunan_west, guindapunan_east, barugohay_norte1, barugohay_norte2, parena,
    //                                       sawang, baybay, ponong1, ponong2, ponong3, ponong4, ponong5, west_visoria2, west_visoria3, east_visoria,
    //                                       tangnan, nauguisan, san_juan, manloy, caghalo,
    //                                       upper_hiraan1, upper_hiraan2, lower_hiraan, libo, canlampay1, canlampay2, hiluctugan,
    //                                       bislig1, bislig2, canal, uyawan, barayong, lower_sogod,
    //                                       upper_sogod, candigahub, cutay, pangna, baruguhay_sur,
    //                                       bagong_lipunan, balilit, barugohay_central, tagak, rizal,
    //                                       sagkahan, canfabi, santa_fe, parag_um, cogon,
    //                                       binibihan, macalpi, paglaum, san_isidro]);

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

    //Punong Barangay Markers and Coordinates
    const tigbao_PunongBarangay = L.marker([11.23826416064776, 124.7125225852891], {icon: personIcon}).bindPopup(tigbaoOfficial).on("click", this.clickZoom.bind(this)),
          piloro_PunongBarangay = L.marker([11.236402318756134, 124.72036848648168], {icon: personIcon}).bindPopup(piloroOfficial).on("click", this.clickZoom.bind(this)),
          camansi_PunongBarangay = L.marker([11.218878646387452, 124.71579779960075], {icon: personIcon}).bindPopup(camansiOfficial).on("click", this.clickZoom.bind(this)),
          tinaguban_PunongBarangay = L.marker([11.236536623529915, 124.70284118033567], {icon: personIcon}).bindPopup(tinagubanOfficial).on("click", this.clickZoom.bind(this)),
          jugaban_PunongBarangay = L.marker([11.3007, 124.6934], {icon: personIcon}).bindPopup(jugabanOfficial).on("click", this.clickZoom.bind(this)),
          san_mateo_PunongBarangay = L.marker([11.3018, 124.6953], {icon: personIcon}).bindPopup(san_mateoOfficial).on("click", this.clickZoom.bind(this)),
          guindapunan_west_PunongBarangay = L.marker([11.3026, 124.6980], {icon: personIcon}).bindPopup(guindapunan_westOfficial).on("click", this.clickZoom.bind(this)),
          guindapunan_east_PunongBarangay = L.marker([11.3037, 124.7004], {icon: personIcon}).bindPopup(guindapunan_eastOfficial).on("click", this.clickZoom.bind(this)),
          barugohay_norte_PunongBarangay = L.marker([11.3029, 124.7050], {icon: personIcon}).bindPopup(barugohay_norteOfficial).on("click", this.clickZoom.bind(this)),
          parena_PunongBarangay = L.marker([11.2979, 124.7121], {icon: personIcon}).bindPopup(parenaOfficial).on("click", this.clickZoom.bind(this)),
          sawang_PunongBarangay = L.marker([11.2993, 124.6895], {icon: personIcon}).bindPopup(sawangOfficial).on("click", this.clickZoom.bind(this)),
          baybay_PunongBarangay = L.marker([11.3011, 124.6889], {icon: personIcon}).bindPopup(baybayOfficial).on("click", this.clickZoom.bind(this)),
          ponong_PunongBarangay = L.marker([11.2977, 124.6829], {icon: personIcon}).bindPopup(ponongOfficial).on("click", this.clickZoom.bind(this)),
          west_visoria_PunongBarangay = L.marker([11.30218474574454, 124.68133417635846], {icon: personIcon}).bindPopup(west_visoriaOfficial).on("click", this.clickZoom.bind(this)),
          east_visoria_PunongBarangay = L.marker([11.30006054635544, 124.68066596305334], {icon: personIcon}).bindPopup(east_visoriaOfficial).on("click", this.clickZoom.bind(this)),
          tangnan_PunongBarangay = L.marker([11.2982, 124.6713], {icon: personIcon}).bindPopup(tangnanOfficial).on("click", this.clickZoom.bind(this)),
          nauguisan_PunongBarangay = L.marker([11.2955, 124.6637], {icon: personIcon}).bindPopup(nauguisanOfficial).on("click", this.clickZoom.bind(this)),
          san_juan_PunongBarangay = L.marker([11.2888, 124.6611], {icon: personIcon}).bindPopup(san_juanOfficial).on("click", this.clickZoom.bind(this)),
          manloy_PunongBarangay = L.marker([11.2750, 124.6636], {icon: personIcon}).bindPopup(manloyOfficial).on("click", this.clickZoom.bind(this)),
          caghalo_PunongBarangay = L.marker([11.2611, 124.6676], {icon: personIcon}).bindPopup(caghaloOfficial).on("click", this.clickZoom.bind(this)),
          upper_hiraan_PunongBarangay = L.marker([11.2648, 124.6759], {icon: personIcon}).bindPopup(upper_hiraanOfficial).on("click", this.clickZoom.bind(this)),
          lower_hiraan_PunongBarangay = L.marker([11.2795, 124.6786], {icon: personIcon}).bindPopup(lower_hiraanOfficial).on("click", this.clickZoom.bind(this)),
          libo_PunongBarangay = L.marker([11.2671, 124.6809], {icon: personIcon}).bindPopup(liboOfficial).on("click", this.clickZoom.bind(this)),
          canlampay_PunongBarangay = L.marker([11.2649, 124.6848], {icon: personIcon}).bindPopup(canlampayOfficial).on("click", this.clickZoom.bind(this)),
          hiluctugan_PunongBarangay = L.marker([11.2471, 124.6877], {icon: personIcon}).bindPopup(hiluctuganOfficial).on("click", this.clickZoom.bind(this)),
          bislig_PunongBarangay = L.marker([11.2923, 124.6769], {icon: personIcon}).bindPopup(bisligOfficial).on("click", this.clickZoom.bind(this)),
          canal_PunongBarangay = L.marker([11.2878, 124.6826], {icon: personIcon}).bindPopup(canalOfficial).on("click", this.clickZoom.bind(this)),
          uyawan_PunongBarangay = L.marker([11.2841, 124.6844], {icon: personIcon}).bindPopup(uyawanOfficial).on("click", this.clickZoom.bind(this)),
          barayong_PunongBarangay = L.marker([11.2682, 124.6722], {icon: personIcon}).bindPopup(barayongOfficial).on("click", this.clickZoom.bind(this)),
          lower_sogod_PunongBarangay = L.marker([11.2572, 124.6903], {icon: personIcon}).bindPopup(lower_sogodOfficial).on("click", this.clickZoom.bind(this)),
          upper_sogod_PunongBarangay = L.marker([11.2536, 124.6931], {icon: personIcon}).bindPopup(upper_sogodOfficial).on("click", this.clickZoom.bind(this)),
          candigahub_PunongBarangay = L.marker([11.2501, 124.7007], {icon: personIcon}).bindPopup(candigahubOfficial).on("click", this.clickZoom.bind(this)),
          cutay_PunongBarangay = L.marker([11.2649, 124.6987], {icon: personIcon}).bindPopup(cutayOfficial).on("click", this.clickZoom.bind(this)),
          pangna_PunongBarangay = L.marker([11.2798, 124.7101], {icon: personIcon}).bindPopup(pangnaOfficial).on("click", this.clickZoom.bind(this)),
          baruguhay_sur_PunongBarangay = L.marker([11.2720, 124.6994], {icon: personIcon}).bindPopup(baruguhay_surOfficial).on("click", this.clickZoom.bind(this)),
          bagong_lipunan_PunongBarangay = L.marker([11.2843, 124.6987], {icon: personIcon}).bindPopup(bagong_lipunanOfficial).on("click", this.clickZoom.bind(this)),
          balilit_PunongBarangay = L.marker([11.2874, 124.6950], {icon: personIcon}).bindPopup(balilitOfficial).on("click", this.clickZoom.bind(this)),
          barugohay_central_PunongBarangay = L.marker([11.2960, 124.6986], {icon: personIcon}).bindPopup(barugohay_centralOfficial).on("click", this.clickZoom.bind(this)),
          tagak_PunongBarangay = L.marker([11.2891, 124.7122], {icon: personIcon}).bindPopup(tagakOfficial).on("click", this.clickZoom.bind(this)),
          rizal_PunongBarangay = L.marker([11.2867, 124.7172], {icon: personIcon}).bindPopup(rizalOfficial).on("click", this.clickZoom.bind(this)),
          sagkahan_PunongBarangay = L.marker([11.2799, 124.7260], {icon: personIcon}).bindPopup(sagkahanOfficial).on("click", this.clickZoom.bind(this)),
          canfabi_PunongBarangay = L.marker([11.2654, 124.7092], {icon: personIcon}).bindPopup(canfabiOfficial).on("click", this.clickZoom.bind(this)),
          santa_fe_PunongBarangay = L.marker([11.2567, 124.7151], {icon: personIcon}).bindPopup(santa_feOfficial).on("click", this.clickZoom.bind(this)),
          parag_um_PunongBarangay = L.marker([11.2575, 124.7279], {icon: personIcon}).bindPopup(parag_umOfficial).on("click", this.clickZoom.bind(this)),
          cogon_PunongBarangay = L.marker([11.2577, 124.7365], {icon: personIcon}).bindPopup(cogonOfficial).on("click", this.clickZoom.bind(this)),
          binibihan_PunongBarangay = L.marker([11.2334, 124.7336], {icon: personIcon}).bindPopup(binibihanOfficial).on("click", this.clickZoom.bind(this)),
          macalpi_PunongBarangay = L.marker([11.2126, 124.7332], {icon: personIcon}).bindPopup(macalpiOfficial).on("click", this.clickZoom.bind(this)),
          paglaum_PunongBarangay = L.marker([11.2045, 124.7188], {icon: personIcon}).bindPopup(paglaumOfficial).on("click", this.clickZoom.bind(this)),
          sanIsidro_PunongBarangay = L.marker([11.2054, 124.7082], {icon: personIcon}).bindPopup(san_isidroOfficial).on("click", this.clickZoom.bind(this));


    // const groupedOfficial = L.layerGroup([tigbao_PunongBarangay, piloro_PunongBarangay, camansi_PunongBarangay, tinaguban_PunongBarangay, jugaban_PunongBarangay, san_mateo_PunongBarangay, guindapunan_west_PunongBarangay,
    //                                       guindapunan_east_PunongBarangay, barugohay_norte_PunongBarangay, parena_PunongBarangay, sawang_PunongBarangay, baybay_PunongBarangay, ponong_PunongBarangay, west_visoria_PunongBarangay,
    //                                       east_visoria_PunongBarangay, tangnan_PunongBarangay, nauguisan_PunongBarangay, san_juan_PunongBarangay, manloy_PunongBarangay, caghalo_PunongBarangay, upper_hiraan_PunongBarangay,
    //                                       lower_hiraan_PunongBarangay, libo_PunongBarangay, canlampay_PunongBarangay, hiluctugan_PunongBarangay, bislig_PunongBarangay, canal_PunongBarangay, uyawan_PunongBarangay,
    //                                       barayong_PunongBarangay, lower_sogod_PunongBarangay, upper_sogod_PunongBarangay, candigahub_PunongBarangay, cutay_PunongBarangay, pangna_PunongBarangay, baruguhay_sur_PunongBarangay,
    //                                       bagong_lipunan_PunongBarangay, balilit_PunongBarangay, barugohay_central_PunongBarangay, tagak_PunongBarangay, rizal_PunongBarangay, sagkahan_PunongBarangay, canfabi_PunongBarangay,
    //                                       santa_fe_PunongBarangay, parag_um_PunongBarangay, cogon_PunongBarangay, binibihan_PunongBarangay, macalpi_PunongBarangay, paglaum_PunongBarangay, sanIsidro_PunongBarangay]);

    // With DB integration

    const officialMarkers = this.evacuationCenters.map((center) => {
      return L.marker(center.coords, { icon: personIcon })
        .bindPopup(this.generateOfficial(center))
        .on("click", this.clickZoom.bind(this));
    });

    // Create a grouped layer from the markers
    const groupedOfficial = L.layerGroup(officialMarkers);

    // groupedEvacCenter.addTo(this.map);

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
    // const distances = this.evacuationLocations.map(location => {
    //   const distance = this.calculateDistance(latlng.lat, latlng.lng, location.coords[0], location.coords[1]);
    //   return { location, distance };
    // });
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

  public zoomToBarangay(event: { barangay: string, coordinates: [number, number] }): void {
    if (this.map) {
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

  @ViewChild('map')
  private mapContainer!: ElementRef<HTMLElement>;

  constructor(
    private router: Router,
    private disasterService: DisasterService,
    private breakPointObserver: BreakpointObserver,
    private barangayService: BarangayService,
    private evacuationCenterService: EvacuationCenterService,
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
    this.loadEvacuationCenters();

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

  private loadEvacuationCenters(): void {
    this.evacuationCenterService.getEvacuationCenters().subscribe({
      next: (data) => {
        this.evacuationCenters = data.map((center: EvacuationCenter) => ({
          name: center.name.toLowerCase(),
          coords: [parseFloat(center.latitude.toString()), parseFloat(center.longitude.toString())],
          venue: center.venue,
          image: center.image ? './assets/images/' + center.image : '',
          punongBarangay: center.punong_barangay
        }));

        if (this.map) {
          this.markerControl();
          this.addLegend();
          this.addInfoControl();
          this.addDetailsControl();
          this.addAffectedBarangaysControl();
        }
      },
      error: (err) => {
        console.error('Error fetching evacuation centers:', err);
      }
    });
  }



  onBarangayChange() {
    console.log('Selected Barangay:', this.selectedBarangay);
    // Later: zoom to this barangay using coordinates from API or stored geojson
  }

  onFilterChange() {
    console.log('Filters updated:', this.filters);
    // Show/hide evacuation center or officials layers
  }
}
