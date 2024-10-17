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

  //toggle dropdown visibility
  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  private mainContent: HTMLElement | null = null;
  private map: any;
  private legend: any;
  private info: any;

  // Dictionary to store GeoJSON layers
  private layers: { [key: string]: L.GeoJSON } = {};

  // Layer visibility dictionary
  layerVisibility: { [key: string]: boolean } = {
    barangay: false,
    water_river: false,
    buildings: false,
    landcover: false,
    roads: false,
  };

  // Define colors for each layer
  private layerColors: { [key: string]: string } = {
    barangay: '#964B00',
    water_river: '#00008B',
    buildings: '#B22222',
    landcover: '#32CD32',
    roads: '#000000',
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
      center: [11.2966, 124.6783],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    }).setView([11.2977099, 124.6878707], 14);

    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      minZoom: 3,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      opacity: 0.3,
    });

    tiles.addTo(this.map);

    // Load GeoJSON data for different layers
    this.loadGeoJsonLayer('barangay', './assets/data/carigara/barangay.geojson');
    this.loadGeoJsonLayer('water_river', './assets/data/water_river.geojson');
    this.loadGeoJsonLayer('buildings', './assets/data/buildings.geojson');
    this.loadGeoJsonLayer('landcover', './assets/data/landcovermap.geojson');
    this.loadGeoJsonLayer('roads', './assets/data/roads.geojson');

    const attribution =
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
    const osmURL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    // const orm = L.tileLayer(osmURL, { attribution }).addTo(this.map);

    const osm2 = new L.TileLayer(osmURL, { minZoom: 10, maxZoom: 18, attribution });
    const miniMap = new L.Control.MiniMap(osm2, { position: 'bottomleft', toggleDisplay: false });
    miniMap.addTo(this.map);
  }

  // Method to load a GeoJSON layer and add it to the map
  private loadGeoJsonLayer(layerKey: string, url: string) {
    this.fetchGeoJson(url)
      .then((data) => {
        const layer = L.geoJson(data, {
          style: (feature) => this.style(feature, layerKey), // Pass layerKey to style
          onEachFeature: (feature, layer) => this.onEachFeature(feature, layer, layerKey), // Bind onEachFeature method with layerKey
        });
        this.layers[layerKey] = layer; // Store layer in dictionary

        // Only add layer to map if it is set to visible
        if (this.layerVisibility[layerKey]) {
          layer.addTo(this.map); // Add the layer to the map if visible
        }
      })
      .catch((error) => {
        console.error(`Failed to load GeoJSON from ${url}:`, error);
      });
  }

  // Method to toggle layer visibility based on checkbox state
  public toggleLayer(layerKey: string): void {
    const layer = this.layers[layerKey];
    this.layerVisibility[layerKey] = !this.layerVisibility[layerKey]; // Toggle visibility state

    if (this.map.hasLayer(layer)) {
      this.map.removeLayer(layer); // Remove the layer if it is currently visible
    } else {
      this.map.addLayer(layer); // Add the layer if it is not visible
    }

    this.addLegend(); // Update the legend when toggling layers
  }

  // Add legend with colors corresponding to each GeoJSON layer
  private addLegend(): void {
    if (this.legend) {
      this.map.removeControl(this.legend); // Remove existing legend
    }

    this.legend = new L.Control({ position: 'bottomright' });

    this.legend.onAdd = () => {
      const div = L.DomUtil.create('div', 'info legend');
      const labels: string[] = [];

      // Loop through the layer colors and create a legend item for each visible layer
      for (const layerKey in this.layerColors) {
        if (this.layerColors.hasOwnProperty(layerKey) && this.layerVisibility[layerKey]) {
          const color = this.layerColors[layerKey];
          const layerName = layerKey.charAt(0).toUpperCase() + layerKey.slice(1); // Capitalize the layer name
          labels.push(
            `<i style="background:${color}"></i> ${layerName}`
          );
        }
      }

      div.innerHTML = labels.join('<br>');
      return div;
    };

    this.legend.addTo(this.map);
  }

  // Add information control for feature properties
  private addInfoControl(): void {
    this.info = new L.Control({ position: 'topright' });

    this.info.onAdd = () => {
      this.info._div = L.DomUtil.create('div', 'info');
      this.info.updateInfo(); // Initialize the info panel
      return this.info._div;
    };

    this.info.updateInfo = (props?: any) => {
      if (!this.info._div) {
        console.error('Info control div is not created');
        return;
      }
      this.info._div.innerHTML =
        '<h4>Carigara, Leyte </h4>' +
        (props
          ? `<b>${props.name}</b><br />${props.population} people`
          : 'Hover over a barangay');
    };

    this.info.addTo(this.map);
  }

  private onEachFeature(feature: any, layer: any, layerKey: string): void {
    if (layerKey !== 'roads' && layerKey !== 'water_river') {
      layer.on({
        mouseover: this.highlightFeature.bind(this),
        mouseout: this.resetHighlight.bind(this),
      });
    }
    layer.on({
      click: this.zoomToFeature.bind(this),
    });
  }

  // Style method to define how features are rendered on the map
  private style(feature: any, layerKey: string) {
    return {
      weight: (layerKey === 'roads' || layerKey === 'water_river') ? 2 : 1,
      opacity: 10,
      color: this.layerColors[layerKey],
      dashArray: '',
    };
  }

  // Highlight feature on mouseover
  private highlightFeature(e: any) {
    const layer = e.target;

    layer.setStyle({
      weight: 2,
      color: '#666',
      dashArray: '',
      fillOpacity: 0.7,
    });

    layer.bringToFront(); // Bring the layer to front
    this.info.updateInfo(layer.feature.properties); // Update info panel with feature properties
  }

  // Reset highlight when mouseout
  private resetHighlight(e: any) {
    const layer = e.target;
    this.layers['barangay'].resetStyle(layer);  // Reset the style to its original on mouseout
    this.info.updateInfo(); // Clear the info panel
  }

  // Zoom to the feature on click
  private zoomToFeature(e: any) {
    this.map.fitBounds(e.target.getBounds()); // Fit the map to the bounds of the clicked feature
  }

  @ViewChild('map')
  private mapContainer!: ElementRef<HTMLElement>; // Reference to the map container

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
    this.addLegend(); // Add the initial legend
    this.addInfoControl(); // Add info control after map initialization
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove(); // Clean up map when the component is destroyed
    }
  }
}
