import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  ViewEncapsulation,
} from '@angular/core';
import { FooterComponent } from './components/footer/footer.component';
import { NavigationEnd, Router, RouterOutlet, Event } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import * as L from 'leaflet';
import 'leaflet-minimap';
import 'leaflet-fullscreen';
import 'leaflet.awesome-markers/dist/leaflet.awesome-markers.js';


@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
  standalone: true,
  imports: [SidebarComponent, NavbarComponent, RouterOutlet, FooterComponent],
  encapsulation: ViewEncapsulation.None,
})
export class LayoutComponent implements OnInit, AfterViewInit, OnDestroy {
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
  };

  // Define colors for each layer
  private layerColors: { [key: string]: string } = {
    water_river: '#00008B',
    buildings: '#B22222',
    landcover: '#32CD32',
    roads: '#000000',
    forest: '#4B5320',
  };

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
    this.loadGeoJsonLayer('forest', '.src/assets/data/forest.geojson');
    L.control.scale({imperial: true,}).addTo(this.map);
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

    private markerControl(): void {
      const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        minZoom: 3,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        opacity: 0.3,
      });
      
      
      const tigbaoPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Boundary</figcaption></figure><div>AKON INI BARANGAY!!! </a></div></div>';
      const piloroPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Boundary</figcaption></figure><div>AKON INI BARANGAY!!! </a></div></div>';
      const camansiPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Boundary</figcaption></figure><div>AKON INI BARANGAY!!! </a></div></div>';
      const tinagubanPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Boundary</figcaption></figure><div>AKON INI BARANGAY!!! </a></div></div>';
      const jugabanPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Boundary</figcaption></figure><div>AKON INI BARANGAY!!! </a></div></div>';
      const sanMateoPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Boundary</figcaption></figure><div>AKON INI BARANGAY!!! </a></div></div>';
      const guindapunanWestPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Boundary</figcaption></figure><div>AKON INI BARANGAY!!! </a></div></div>';
      const guindapunanEastPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Boundary</figcaption></figure><div>AKON INI BARANGAY!!! </a></div></div>';
      const barugohayNortePopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Boundary</figcaption></figure><div>AKON INI BARANGAY!!! </a></div></div>';
      const parenaPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Boundary</figcaption></figure><div>AKON INI BARANGAY!!! </a></div></div>';
      const sawangPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Boundary</figcaption></figure><div>AKON INI BARANGAY!!! </a></div></div>';
      const baybayPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Boundary</figcaption></figure><div>AKON INI BARANGAY!!! </a></div></div>';
      const ponongPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Boundary</figcaption></figure><div>AKON INI BARANGAY!!! </a></div></div>';
      const westVisoriaPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Boundary</figcaption></figure><div>AKON INI BARANGAY!!! </a></div></div>';
      const eastVisoriaPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Boundary</figcaption></figure><div>AKON INI BARANGAY!!! </a></div></div>';
      const tangnanPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Boundary</figcaption></figure><div>AKON INI BARANGAY!!! </a></div></div>';
      const nauguisanPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Boundary</figcaption></figure><div>AKON INI BARANGAY!!! </a></div></div>';
      const sanJuanPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Boundary</figcaption></figure><div>AKON INI BARANGAY!!! </a></div></div>';
      const manloyPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Boundary</figcaption></figure><div>AKON INI BARANGAY!!! </a></div></div>';
      const caghloPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Boundary</figcaption></figure><div>AKON INI BARANGAY!!! </a></div></div>';
      const upperHiraanPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Boundary</figcaption></figure><div>AKON INI BARANGAY!!! </a></div></div>';
      const lowerHiraanPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Boundary</figcaption></figure><div>AKON INI BARANGAY!!! </a></div></div>';
      const liboPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Boundary</figcaption></figure><div>AKON INI BARANGAY!!! </a></div></div>';
      const canlampayPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Boundary</figcaption></figure><div>AKON INI BARANGAY!!! </a></div></div>';
      const hiluctuganPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Boundary</figcaption></figure><div>AKON INI BARANGAY!!! </a></div></div>';
      const bisligPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Boundary</figcaption></figure><div>AKON INI BARANGAY!!! </a></div></div>';
      const canalPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Boundary</figcaption></figure><div>AKON INI BARANGAY!!! </a></div></div>';
      const uyawanPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Boundary</figcaption></figure><div>AKON INI BARANGAY!!! </a></div></div>';
      const barayongPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Boundary</figcaption></figure><div>AKON INI BARANGAY!!! </a></div></div>';
      const lowerSogodPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Boundary</figcaption></figure><div>AKON INI BARANGAY!!! </a></div></div>';
      const upperSogodPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Boundary</figcaption></figure><div>AKON INI BARANGAY!!! </a></div></div>';
      const candigahubPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Boundary</figcaption></figure><div>AKON INI BARANGAY!!! </a></div></div>';
      const cutayPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Boundary</figcaption></figure><div>AKON INI BARANGAY!!! </a></div></div>';
      const pangnaPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Boundary</figcaption></figure><div>AKON INI BARANGAY!!! </a></div></div>';
      const baruguhaySurPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Boundary</figcaption></figure><div>AKON INI BARANGAY!!! </a></div></div>';
      const bagongLipunanPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Boundary</figcaption></figure><div>AKON INI BARANGAY!!! </a></div></div>';
      const balilitPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Boundary</figcaption></figure><div>AKON INI BARANGAY!!! </a></div></div>';
      const barugohayCentralPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Boundary</figcaption></figure><div>AKON INI BARANGAY!!! </a></div></div>';
      const tagakPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Boundary</figcaption></figure><div>AKON INI BARANGAY!!! </a></div></div>';
      const rizalPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Boundary</figcaption></figure><div>AKON INI BARANGAY!!! </a></div></div>';
      const sagkahanPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Boundary</figcaption></figure><div>AKON INI BARANGAY!!! </a></div></div>';
      const canfabiPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Boundary</figcaption></figure><div>AKON INI BARANGAY!!! </a></div></div>';
      const santaFePopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Boundary</figcaption></figure><div>AKON INI BARANGAY!!! </a></div></div>';
      const paragUmPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Boundary</figcaption></figure><div>AKON INI BARANGAY!!! </a></div></div>';
      const cogonPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Boundary</figcaption></figure><div>AKON INI BARANGAY!!! </a></div></div>';
      const binibihanPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Boundary</figcaption></figure><div>AKON INI BARANGAY!!! </a></div></div>';
      const macalpiPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Boundary</figcaption></figure><div>AKON INI BARANGAY!!! </a></div></div>';
      const paglaumPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Boundary</figcaption></figure><div>AKON INI BARANGAY!!! </a></div></div>';
      const sanIsidroPopup = '<div class="customPopup"><figure><img src="./assets/images/Car.jpg" alt="Car"><figcaption>Barangay Boundary</figcaption></figure><div>AKON INI BARANGAY!!! </a></div></div>';
      
      /*const safe = L.AwesomeMarkers.icon({
        icon: 'coffee',
        markerColor: 'red'
      });
      , {icon: safe}).bindPopup(tigbaoPopup)*/
      //barangay marker location
      const tigbao = L.marker([11.23826416064776, 124.7125225852891]).bindPopup(tigbaoPopup).on("click", this.clickZoom.bind(this)),//.on("click", (e) => { this.clickZoom(e); this.clickJump(tigbao)}),
            piloro = L.marker([11.236402318756134, 124.72036848648168]).bindPopup(piloroPopup).on("click", this.clickZoom.bind(this)),      
            camansi = L.marker([11.218878646387452, 124.71579779960075]).bindPopup(camansiPopup).on("click", this.clickZoom.bind(this)), 
            tinaguban = L.marker([11.236536623529915, 124.70284118033567]).bindPopup(tinagubanPopup).on("click", this.clickZoom.bind(this)),
            jugaban = L.marker([11.3007, 124.6934]).bindPopup(jugabanPopup).on("click", this.clickZoom.bind(this)), 
            san_mateo = L.marker([11.3018, 124.6953]).bindPopup(sanMateoPopup).on("click", this.clickZoom.bind(this)),
            guindapunan_west = L.marker([11.3026, 124.6980]).bindPopup(guindapunanWestPopup).on("click", this.clickZoom.bind(this)),
            guindapunan_east = L.marker([11.3037, 124.7004]).bindPopup(guindapunanEastPopup).on("click", this.clickZoom.bind(this)),
            barugohay_norte = L.marker([11.3029, 124.7050]).bindPopup(barugohayNortePopup).on("click", this.clickZoom.bind(this)),
            parena = L.marker([11.2979, 124.7121]).bindPopup(parenaPopup).on("click", this.clickZoom.bind(this)),
            sawang = L.marker([11.2993, 124.6895]).bindPopup(sawangPopup).on("click", this.clickZoom.bind(this)),
            baybay = L.marker([11.3011, 124.6889]).bindPopup(baybayPopup).on("click", this.clickZoom.bind(this)),
            ponong = L.marker([11.2977, 124.6829]).bindPopup(ponongPopup).on("click", this.clickZoom.bind(this)),
            west_visoria = L.marker([11.30218474574454, 124.68133417635846]).bindPopup(westVisoriaPopup).on("click", this.clickZoom.bind(this)),
            east_visoria = L.marker([11.30006054635544, 124.68066596305334]).bindPopup(eastVisoriaPopup).on("click", this.clickZoom.bind(this)),
            tangnan = L.marker([11.2982, 124.6713]).bindPopup(tangnanPopup).on("click", this.clickZoom.bind(this)),
            nauguisan = L.marker([11.2955, 124.6637]).bindPopup(nauguisanPopup).on("click", this.clickZoom.bind(this)),
            san_juan = L.marker([11.2888, 124.6611]).bindPopup(sanJuanPopup).on("click", this.clickZoom.bind(this)),
            manloy = L.marker([	11.2750, 124.6636]).bindPopup(manloyPopup).on("click", this.clickZoom.bind(this)),
            caghalo = L.marker([11.2611, 124.6676]).bindPopup(caghloPopup).on("click", this.clickZoom.bind(this)),
            upper_hiraan = L.marker([11.2648, 124.6759]).bindPopup(upperHiraanPopup).on("click", this.clickZoom.bind(this)),
            lower_hiraan = L.marker([11.2795, 124.6786]).bindPopup(lowerHiraanPopup).on("click", this.clickZoom.bind(this)),
            libo = L.marker([	11.2671, 124.6809]).bindPopup(liboPopup).on("click", this.clickZoom.bind(this)),
            canlampay = L.marker([11.2649, 124.6848]).bindPopup(canlampayPopup).on("click", this.clickZoom.bind(this)),
            hiluctugan = L.marker([	11.2471, 124.6877]).bindPopup(hiluctuganPopup).on("click", this.clickZoom.bind(this)),
            bislig = L.marker([11.2923, 124.6769]).bindPopup(bisligPopup).on("click", this.clickZoom.bind(this)),
            canal = L.marker([11.2878, 124.6826]).bindPopup(canalPopup).on("click", this.clickZoom.bind(this)),
            uyawan = L.marker([11.2841, 124.6844]).bindPopup(uyawanPopup).on("click", this.clickZoom.bind(this)),
            barayong = L.marker([	11.2682, 124.6722]).bindPopup(barayongPopup).on("click", this.clickZoom.bind(this)),
            lower_sogod = L.marker([11.2572, 124.6903]).bindPopup(lowerSogodPopup ).on("click", this.clickZoom.bind(this)),
            upper_sogod = L.marker([11.2536, 124.6931]).bindPopup(upperSogodPopup).on("click", this.clickZoom.bind(this)),
            candigahub = L.marker([11.2501, 124.7007]).bindPopup(candigahubPopup).on("click", this.clickZoom.bind(this)),
            cutay = L.marker([11.2649, 124.6987]).bindPopup(cutayPopup).on("click", this.clickZoom.bind(this)),
            pangna = L.marker([	11.2798, 124.7101]).bindPopup(pangnaPopup).on("click", this.clickZoom.bind(this)),
            baruguhay_sur = L.marker([11.2720, 124.6994]).bindPopup(baruguhaySurPopup).on("click", this.clickZoom.bind(this)),
            bagong_lipunan = L.marker([11.2843, 124.6987]).bindPopup(bagongLipunanPopup).on("click", this.clickZoom.bind(this)),
            balilit = L.marker([11.2874, 124.6950]).bindPopup(balilitPopup).on("click", this.clickZoom.bind(this)),
            barugohay_central = L.marker([11.2960, 124.6986]).bindPopup(barugohayCentralPopup).on("click", this.clickZoom.bind(this)),
            tagak = L.marker([11.2891, 124.7122]).bindPopup(tagakPopup).on("click", this.clickZoom.bind(this)),
            rizal = L.marker([11.2867, 124.7172]).bindPopup(rizalPopup).on("click", this.clickZoom.bind(this)),
            sagkahan = L.marker([11.2799, 124.7260]).bindPopup(sagkahanPopup).on("click", this.clickZoom.bind(this)),
            canfabi = L.marker([11.2654, 124.7092]).bindPopup(canfabiPopup).on("click", this.clickZoom.bind(this)),
            santa_fe = L.marker([11.2567, 124.7151]).bindPopup(santaFePopup).on("click", this.clickZoom.bind(this)),
            parag_um = L.marker([11.2575, 124.7279]).bindPopup(paragUmPopup).on("click", this.clickZoom.bind(this)),
            cogon = L.marker([	11.2577, 124.7365]).bindPopup(cogonPopup).on("click", this.clickZoom.bind(this)),
            binibihan = L.marker([11.2334, 124.7336]).bindPopup(binibihanPopup).on("click", this.clickZoom.bind(this)),
            macalpi = L.marker([11.2126, 124.7332]).bindPopup(macalpiPopup).on("click", this.clickZoom.bind(this)),
            paglaum = L.marker([11.2045, 124.7188]).bindPopup(paglaumPopup ).on("click", this.clickZoom.bind(this)),
            san_isidro = L.marker([11.2054, 124.7082]).bindPopup(sanIsidroPopup).on("click", this.clickZoom.bind(this));

    //Grouped Layers of barangays
    const groupedBarangay = L.layerGroup([tigbao, piloro, camansi, tinaguban, jugaban,
                                          san_mateo, guindapunan_west, guindapunan_east, barugohay_norte, parena,
                                          sawang, baybay, ponong, west_visoria, east_visoria,
                                          tangnan, nauguisan, san_juan, manloy, caghalo,
                                          upper_hiraan, lower_hiraan, libo, canlampay, hiluctugan,
                                          bislig, canal, uyawan, barayong, lower_sogod,
                                          upper_sogod, candigahub, cutay, pangna, baruguhay_sur,
                                          bagong_lipunan, balilit, barugohay_central, tagak, rizal,
                                          sagkahan, canfabi, santa_fe, parag_um, cogon,
                                          binibihan, macalpi, paglaum, san_isidro]);

    const baseMaps = {"OpenStreetMap" : tiles};
    const overLays = {"Barangays": groupedBarangay};

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
      const grades: number[] = [0, 100, 300, 800, 1000, 1300, 2300, 3500];
      const labels: string[] = [];

      for (let i = 0; i < grades.length; i++) {
        div.innerHTML += `<i style="background:${this.getColor(grades[i] + 1)}"></i> ` +
        grades[i] + (grades[i + 1] ? `&ndash;${grades[i + 1]}<br>` : '+');
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
        console.error('Info control div is not created');
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
    }else {
        return {
          weight: (layerKey === 'roads' || layerKey === 'water_river') ? 2 : 1,
          fillOpacity: 10,
          color: this.layerColors[layerKey],
          dashArray: '',
       };
    }
  }
  private onEachFeature(feature: any, layer: any, layerKey: string): 
  void {
    if (layerKey !== 'water_river' && layerKey !== 'water_river') {
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
      weight: 2,
      color: '#666',
      dashArray: '',
      fillOpacity: 0.8,
    });
    layer.bringToFront();
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

  constructor(private router: Router) {
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
  }
}
