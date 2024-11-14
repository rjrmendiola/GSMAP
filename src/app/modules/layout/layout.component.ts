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

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
  standalone: true,
  imports: [SidebarComponent, NavbarComponent, RouterOutlet, FooterComponent],
  encapsulation: ViewEncapsulation.None,
})
export class LayoutComponent implements OnInit, AfterViewInit, OnDestroy {
  // @Input() disasterType!: { type: string; category?: string };
  private disasterTypeSubscription!: Subscription;
  disasterType!: { type: string; category?: string };

  isDropdownOpen: boolean = false;
  private mainContent: HTMLElement | null = null;
  private map: any;
  private legend: any;
  private info: any;

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
    forest: false,
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
    this.loadGeoJsonLayer('landcover', './assets/data/landcovermap.geojson');
    this.loadGeoJsonLayer('roads', './assets/data/roads.geojson');
    this.loadGeoJsonLayer('forest', './assets/data/forest.geojson');
    this.loadGeoJsonLayer('landslide', './assets/data/hazard_landslide.geojson');
    this.loadGeoJsonLayer('landslide_low', './assets/data/landslide/hazard_landslide_low.geojson');
    this.loadGeoJsonLayer('landslide_moderate', './assets/data/landslide/hazard_landslide_moderate.geojson');
    this.loadGeoJsonLayer('landslide_high', './assets/data/landslide/hazard_landslide_high.geojson');
    this.loadGeoJsonLayer('flood_high', './assets/data/flood/hazard_flood_high.geojson');
    this.loadGeoJsonLayer('flood_moderate', './assets/data/flood/hazard_flood_moderate.geojson');
    this.loadGeoJsonLayer('flood_low', './assets/data/flood/hazard_flood_low.geojson');

    L.control.scale({imperial: true,}).addTo(this.map);
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
        this.map.removeControl(this.info);
        this.legend.addTo(this.map);
      }
    } else if (layerKey === 'flood_high' || layerKey === 'flood_low') {
      if (!this.map.hasLayer(layer)) {
        this.map.addLayer(layer);
        this.map.removeControl(this.info);
        this.legend.addTo(this.map);
      }
    } else {
      if (this.map.hasLayer(layer)) {
        this.map.removeLayer(layer);
        this.map.removeControl(this.legend);
        this.map.removeControl(this.info);
      } else {
        this.map.addLayer(layer);
        this.legend.addTo(this.map);
        this.info.addTo(this.map);
      }
    }
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
    const tigbaoPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Tigbao Elementary School </a></div></div>';
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
    const sanJuanPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>San Juan Barangay Hall</a></div></div>';
    const manloyPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Manloy Elementary School</a></div></div>';
    const caghaloPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Caghalo Elementary School</a></div></div>';
    const upperHiraan1Popup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Upper Hiraan Barangay Hall </a></div></div>';
    const upperHiraan2Popup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Hiraan Elementary School</a></div></div>';
    const lowerHiraanPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Lower Hiraan Barangay Hall</a></div></div>';
    const liboPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Libo Barangay Hall</a></div></div>';
    const canlampay1Popup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Canlampay Barangay Hall</a></div></div>';
    const canlampay2Popup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Canlampay Elementary School</a></div></div>';
    const hiluctuganPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Hiluctugan Elementary School </a></div></div>';
    const bislig1Popup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Bislig Barangay Hall </a></div></div>';
    const bislig2Popup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Bislig Evacuation Center </a></div></div>';
    const canalPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Canal Barangay Hall</a></div></div>';
    const uyawanPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Uyawan Barangay Hall </a></div></div>';
    const barayongPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Barayong Barangay Hall </a></div></div>';
    const lowerSogodPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Lower Sogod Elementary School</a></div></div>';
    const upperSogodPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Upper Sogod Barangay Hall</a></div></div>';
    const candigahubPopup = '<div class="customPopup"><figure><img src="./assets/images/candigahubES.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Candigahub Elementary School</a></div></div>';
    const cutayPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Cutay Barangay Hall</a></div></div>';
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
    const paragUmPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Parag-um Barangay Hall</a></div></div>';
    const cogonPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Cogon Barangay Hall</a></div></div>';
    const binibihanPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Binibihan Elem. School </a></div></div>';
    const macalpiPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Macalpi Elementary School</a></div></div>';
    const paglaumPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>Paglaum Barangay Hall </a></div></div>';
    const sanIsidroPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Evacuation Center</figcaption></figure><div>San Isidro Barangay Hall</a></div></div>';

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
            <img src="${imageUrl}" style="width: 25px; height: 41px; position: absolute; top: 0; left: 0;"/>
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
    const groupedEvacCenter = L.layerGroup([tigbao, piloro, camansi, tinaguban, jugaban,
                                          san_mateo, guindapunan_west, guindapunan_east, barugohay_norte1, barugohay_norte2, parena,
                                          sawang, baybay, ponong1, ponong2, ponong3, ponong4, ponong5, west_visoria2, west_visoria3, east_visoria,
                                          tangnan, nauguisan, san_juan, manloy, caghalo,
                                          upper_hiraan1, upper_hiraan2, lower_hiraan, libo, canlampay1, canlampay2, hiluctugan,
                                          bislig1, bislig2, canal, uyawan, barayong, lower_sogod,
                                          upper_sogod, candigahub, cutay, pangna, baruguhay_sur,
                                          bagong_lipunan, balilit, barugohay_central, tagak, rizal,
                                          sagkahan, canfabi, santa_fe, parag_um, cogon,
                                          binibihan, macalpi, paglaum, san_isidro]);
    const personIcon = L.icon({
      iconUrl: './assets/images/official.png',
      iconSize: [26, 41],
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

    const groupedOfficial = L.layerGroup([tigbao_PunongBarangay, piloro_PunongBarangay, camansi_PunongBarangay, tinaguban_PunongBarangay, jugaban_PunongBarangay, san_mateo_PunongBarangay, guindapunan_west_PunongBarangay,
                                          guindapunan_east_PunongBarangay, barugohay_norte_PunongBarangay, parena_PunongBarangay, sawang_PunongBarangay, baybay_PunongBarangay, ponong_PunongBarangay, west_visoria_PunongBarangay,
                                          east_visoria_PunongBarangay, tangnan_PunongBarangay, nauguisan_PunongBarangay, san_juan_PunongBarangay, manloy_PunongBarangay, caghalo_PunongBarangay, upper_hiraan_PunongBarangay,
                                          lower_hiraan_PunongBarangay, libo_PunongBarangay, canlampay_PunongBarangay, hiluctugan_PunongBarangay, bislig_PunongBarangay, canal_PunongBarangay, uyawan_PunongBarangay,
                                          barayong_PunongBarangay, lower_sogod_PunongBarangay, upper_sogod_PunongBarangay, candigahub_PunongBarangay, cutay_PunongBarangay, pangna_PunongBarangay, baruguhay_sur_PunongBarangay,
                                          bagong_lipunan_PunongBarangay, balilit_PunongBarangay, barugohay_central_PunongBarangay, tagak_PunongBarangay, rizal_PunongBarangay, sagkahan_PunongBarangay, canfabi_PunongBarangay,
                                          santa_fe_PunongBarangay, parag_um_PunongBarangay, cogon_PunongBarangay, binibihan_PunongBarangay, macalpi_PunongBarangay, paglaum_PunongBarangay, sanIsidro_PunongBarangay]);

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
        var colors: string[] = ['#FFFF00', '#6B8E23', '#800000'];

        if (this.disasterType.type == 'flood') {
          var colors: string[] = ['#78c679', '#d9f0a3', '#7B68EE'];
        }

        var labels: string[] = ['Low', 'Moderate', 'High'];

        div.innerHTML += `<h1 class="text-sm font-bold leading-3 mt-2 mb-2 text-gray-800">Hazard Level</h1>`;
        for (let i = 0; i < colors.length; i++) {
          div.innerHTML += `<div class="py-1">
            <i style="background:${colors[i]};"></i><span style="color:${colors[i]};">${labels[i]}</span>
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
      this.info._div.innerHTML =
        '<h4>Carigara, Leyte</h4>' +
        (props
          ? `<b>${props.name}</b><br />${props.population} people`
          : 'Hover over a barangay');
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
        fillColor: this.getColor(feature.properties.population),
        weight: 1.5,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
      };
    } else if (layerKey === 'landslide_high') {
      var featurecolor = '#800000';
      return {
        fillColor: featurecolor,
        weight: 1,
        opacity: 1,
        color: featurecolor,
        dashArray: '3',
        fillOpacity: 0.7
      };
    } else if (layerKey === 'landslide_moderate') {
      var featurecolor = '#6B8E23';
      return {
        fillColor: featurecolor,
        weight: 1,
        opacity: 1,
        color: featurecolor,
        dashArray: '3',
        fillOpacity: 0.7
      };
    } else if (layerKey === 'landslide_low') {
      var featurecolor = '#FFFF00';
      return {
        fillColor: featurecolor,
        weight: 1,
        opacity: 1,
        color: featurecolor,
        dashArray: '3',
        fillOpacity: 0.7
      };
    } else if (layerKey === 'flood_high') {
      var featurecolor = '#7B68EE';
      return {
        fillColor: featurecolor,
        weight: 1,
        opacity: 1,
        color: featurecolor,
        dashArray: '3',
        fillOpacity: 0.7
      };
    } else if (layerKey === 'flood_moderate') {
      var featurecolor = '#d9f0a3';
      return {
        fillColor: featurecolor,
        weight: 1,
        opacity: 1,
        color: featurecolor,
        dashArray: '3',
        fillOpacity: 0.7
      };
    } else if (layerKey === 'flood_low') {
      var featurecolor = '#78c679';
      return {
        fillColor: featurecolor,
        weight: 1,
        opacity: 1,
        color: featurecolor,
        dashArray: '3',
        fillOpacity: 0.7
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
    // if (layerKey === 'barangay') {
    //   layer.on({
    //     mouseover: this.highlightFeature.bind(this),
    //     mouseout: this.resetHighlight.bind(this),
    //   });
    // }
    if (layerKey !== 'roads' && layerKey !== 'waterways') {
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
    layer.setStyle({
      weight: 3,
      //color: '#666',
      //dashArray: '',
      //fillOpacity: 0.8,
    });
    //layer.bringToFront();
    this.info.updateInfo(layer.feature.properties);
  }

  // Reset highlight when mouseout
  private resetHighlight(e: any) {
    const layer = e.target;
    this.layers['barangay'].resetStyle(layer);
    this.info.updateInfo(layer.feature.properties);
  }

  // Zoom to the feature on click
  private zoomToFeature(e: any) {
    const layer = e.target;
  }

  // Center map when click on marker
  private clickZoom(e: any) {
    this.map.setView(e.target.getLatLng(), 14);
  }

  @ViewChild('map')
  private mapContainer!: ElementRef<HTMLElement>;

  constructor(
    private router: Router,
    private disasterService: DisasterService
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

    this.disasterTypeSubscription = this.disasterService.disasterType$.subscribe(
      (disasterType) => {
        if (disasterType) {
          this.disasterType = disasterType;
          this.handleDisasterTypeChange();
        }
      }
    );
  }

  ngAfterViewInit(): void {
    this.initMap();
    this.markerControl();
    this.addLegend();
    this.addInfoControl();
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
      // console.log('Updating map with type:', this.disasterType.type);
      if (this.disasterType.type == 'landslide') {
        this.toggleLayer('landslide_low');
        this.toggleLayer('landslide_moderate');
        this.toggleLayer('landslide_high');
      } else if (this.disasterType.type == 'flood') {
        this.map.removeLayer(this.layers['landslide_low']);
        this.map.removeLayer(this.layers['landslide_moderate']);
        this.map.removeLayer(this.layers['landslide_high']);
        this.toggleLayer('flood_low');
        this.toggleLayer('flood_moderate');
        this.toggleLayer('flood_high');
      } else if (this.disasterType.type == 'typhoon') {
        if (this.disasterType.category == 'category5') {
          this.map.removeLayer(this.layers['landslide_low']);
          this.map.removeLayer(this.layers['landslide_moderate']);
          this.toggleLayer('landslide_high');
          this.toggleLayer('flood_high');
        } else if (this.disasterType.category == 'category4' || this.disasterType.category == 'category3') {
          this.map.removeLayer(this.layers['landslide_low']);
          this.map.removeLayer(this.layers['landslide_high']);
          this.toggleLayer('landslide_moderate');
        } else if (this.disasterType.category == 'category2') {
          this.map.removeLayer(this.layers['landslide_moderate']);
          this.map.removeLayer(this.layers['landslide_high']);
          this.toggleLayer('landslide_low');
        } else {
          this.map.removeLayer(this.layers['landslide_low']);
          this.map.removeLayer(this.layers['landslide_moderate']);
          this.map.removeLayer(this.layers['landslide_high']);
        }
      }
    }
  }
}
