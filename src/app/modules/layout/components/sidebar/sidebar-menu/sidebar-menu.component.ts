import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { SubMenuItem } from 'src/app/core/models/menu.model';
import { MenuService } from '../../../services/menu.service';
import { SidebarSubmenuComponent } from '../sidebar-submenu/sidebar-submenu.component';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { NgFor, NgClass, NgTemplateOutlet, NgIf } from '@angular/common';
import { AuthService } from 'src/app/core/services/auth.service';
import { Barangay } from 'src/app/shared/models/barangay.model';

interface DisasterType {
  type: string;
  category?: string; // Make category optional
}

@Component({
    selector: 'app-sidebar-menu',
    templateUrl: './sidebar-menu.component.html',
    styleUrls: ['./sidebar-menu.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        NgFor,
        NgClass,
        AngularSvgIconModule,
        NgTemplateOutlet,
        RouterLink,
        RouterLinkActive,
        NgIf,
        SidebarSubmenuComponent,
    ],
})
export class SidebarMenuComponent implements OnInit {
  @Input() barangays: Barangay[] = [];
  @Output() barangaySelected = new EventEmitter<{ id: number, barangay: string, coordinates: [number, number] }>();
  @Output() menuClicked = new EventEmitter<{ type: string, category?: string }>();
  isDropdownOpen: boolean = false;
  isFloodCategoriesVisible: boolean = false;
  isLandslideCategoriesVisible: boolean = false;
  isLayerCategoriesVisible: boolean = false;
  isFilterCategoriesVisible: boolean = false;
  user: any;

  selectedMapType: string | null = null;

  baseLayerTypes = [
    { label: 'OpenStreetMap', value: 'openstreetmap' },
    { label: 'Google Satellite', value: 'satellite' },
    { label: 'Topographic', value: 'topographic' }
  ];

  constructor(
    public menuService: MenuService,
    private authService: AuthService
  ) {}

  public toggleMenu(subMenu: SubMenuItem) {
    this.menuService.toggleMenu(subMenu);
  }

  public onMenuClick(type: string, category?: string) {
    this.menuClicked.emit({ type, category });
  }

  public toggleLayer(layerKey: string): void {
  }

  public toggleHazardMenu(categoryId: string) {
    if (categoryId === 'flood-categories') {
      this.isFloodCategoriesVisible = !this.isFloodCategoriesVisible;
    } else if (categoryId === 'landslide-categories') {
      this.isLandslideCategoriesVisible = !this.isLandslideCategoriesVisible;
    } else if (categoryId === 'layer-categories') {
      this.isLayerCategoriesVisible = !this.isLayerCategoriesVisible;
    } else if (categoryId === 'filter-categories') {
      this.isFilterCategoriesVisible = !this.isFilterCategoriesVisible;
    }
  }

  public onBarangayChange(event: any): void {
    const barangayId = +event.target.value;
    const barangay = this.barangays.find(b => b.id === barangayId);
    if (barangay) {
      this.barangaySelected.emit({
        id: barangay.id ?? 0,
        barangay: barangay.name,
        coordinates: [event.longitude, event.latitude]
      });
    }
  }

  public onMapTypeChange(event: any): void {
    const selectedType = event.target.value;

    // // Remove existing tile layer
    // this.map.eachLayer((layer: any) => {
    //   if (layer instanceof L.TileLayer) {
    //     this.map.removeLayer(layer);
    //   }
    // });

    // // Add the selected tile layer
    // if (selectedType !== 'null') {
    //   this.baseLayers[selectedType].addTo(this.map);
    // }

    // this.selectedMapType = selectedType;
  }

  ngOnInit(): void {
    this.user = this.authService.getUser();
    console.log('User in SidebarMenuComponent:', this.user);
  }
}
