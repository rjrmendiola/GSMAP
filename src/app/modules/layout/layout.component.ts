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
    });

    // Add the fullscreen control
    this.map.addControl(new L.Control.Fullscreen({
      content: '<i class="fa fa-expand"></i>',
      title: 'Enter Fullscreen',
      titleCancel: 'Exit Fullscreen',
      contentCancel: '<i class="fa fa-compress"></i>',
    }));

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
    this.loadGeoJsonLayer('popupbarangay', './assets/data/brgy.cariaga.geojson');

    // Add minimap
    const osmURL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    const osm2 = new L.TileLayer(osmURL, { minZoom: 6, maxZoom: 18 });
    const minimap = new L.Control.MiniMap(osm2, { position: 'bottomleft', toggleDisplay: true });
    minimap.addTo(this.map);
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
    } else {
      this.map.addLayer(layer);
    }

    this.addLegend();
  }

  // Add legend with colors corresponding to each GeoJSON layer
  private addLegend(): void {
    if (this.legend) {
      this.map.removeControl(this.legend);
    }

    this.legend = new L.Control({ position: 'bottomright' });

    this.legend.onAdd = () => {
      const div = L.DomUtil.create('div', 'info legend');
      const labels: string[] = [];

      for (const layerKey in this.layerColors) {
        if (this.layerColors.hasOwnProperty(layerKey) && this.layerVisibility[layerKey]) {
          const color = this.layerColors[layerKey];
          const layerName = layerKey.charAt(0).toUpperCase() + layerKey.slice(1);
          labels.push(`<i style="background:${color}"></i> ${layerName}`);
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

    layer.bringToFront();
    this.info.updateInfo(layer.feature.properties);
  }

  // Reset highlight when mouseout
  private resetHighlight(e: any) {
    const layer = e.target;
    this.layers['barangay'].resetStyle(layer);
    this.info.updateInfo();
  }

  // Zoom to the feature on click
  private zoomToFeature(e: any) {
    const layer = e.target;
    const popup = layer.getPopup();

    // Check if the popup is already open
    if (this.currentMarker && this.currentMarker === layer) {
      popup.remove(); // Close the popup if it is open
      this.currentMarker = null; // Reset the current marker
    } else {
      this.map.fitBounds(layer.getBounds());

      // Custom marker with popup
      const funny = L.icon({
        iconUrl: "http://grzegorztomicki.pl/serwisy/pin.png",
        iconSize: [50, 58],
        iconAnchor: [20, 58],
        popupAnchor: [0, -60],
      });

      const customPopup =
        '<div class="customPopup"><figure><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/A-10_Sukiennice_w_Krakowie_Krak%C3%B3w%2C_Rynek_G%C5%82%C3%B3wny_MM.jpg/1920px-A-10_Sukiennice_w_Krakowie_Krak%C3%B3w%2C_Rynek_G%C5%82%C3%B3wny_MM.jpg"><figcaption>Source: wikipedia.org</figcaption></figure><div>Kraków is the second-largest city in Poland. Situated on the Vistula River in Lesser Poland Voivodeship... <a href="https://en.wikipedia.org/wiki/Krak%C3%B3w" target="_blank">→ show more</a></div></div>';

      const customOptions = {
        minWidth: 220,
        keepInView: false,
      };

      this.currentMarker = L.marker(e.latlng, {
        icon: funny,
      })
        .bindPopup(customPopup, customOptions)
        .on("click", this.clickZoom.bind(this))
        .addTo(this.map);

      // Call the addRemoveButtonListener method to set up the button listener
      this.addRemoveButtonListener();
    }
  }

  // Center map when click on marker
  private clickZoom(e: any) {
    this.map.setView(e.target.getLatLng(), 14);
  }

  // Method to remove the popup
  private removePopup() {
    if (this.currentMarker) {
      this.currentMarker.remove(); // Remove the current marker
      this.currentMarker = null; // Reset the current marker
    }
  }

  private addRemoveButtonListener() {
    // Access the popup's content directly
    const popupContent = this.currentMarker?.getPopup();
    if (popupContent) {
      const popupElement = popupContent.getContent();

      // Check if the content is a valid element
      if (typeof popupElement === 'string') {
        // Create a temporary element to parse the string
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = popupElement;
        const removeButton = tempDiv.querySelector('.remove-popup-btn');

        if (removeButton) {
          // Remove any existing event listener to prevent duplicates
          removeButton.replaceWith(removeButton.cloneNode(true)); // Reset the button to remove existing listeners

          // Add a new event listener for the Remove button
          removeButton.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent the popup from closing immediately
            this.removePopup(); // Call the remove method
          });

          // Reinsert the modified content back into the popup
          popupContent.setContent(tempDiv.innerHTML);
        }
      }
    }
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
    this.addLegend();
    this.addInfoControl();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }
}
