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
  @Input() barangayOfficials: any[] = [];
  @Input() evacuationCenters: any[] = [];
  @Output() dssFilterClicked = new EventEmitter<void>();
  @Output() menuClicked = new EventEmitter<{ type: string, category?: string }>();
  @Output() barangaySelected = new EventEmitter<{ id: number, barangay: string, coordinates: [number, number] }>();
  // @Output() barangayOfficialSelected = new EventEmitter<{ id: number, name: string, position: string }>();
  @Output() barangayOfficialSelected = new EventEmitter<{ id: number }>();
  @Output() mapTypeSelected = new EventEmitter<{ type: string }>();
  isDropdownOpen: boolean = false;
  isFloodCategoriesVisible: boolean = false;
  isLandslideCategoriesVisible: boolean = false;
  isLayerCategoriesVisible: boolean = false;
  isFilterCategoriesVisible: boolean = false;
  isDssFilterVisible: boolean = false;
  user: any;

  selectedMapType: string | null = null;
  selectedBarangayOfficial: string | null = null;
  selectedEvacuationCenter: string | null = null;

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
        coordinates: [barangay.longitude, barangay.latitude]
      });
    }
  }

  public onMapTypeChange(event: any): void {
    const selectedType = event.target.value;
    if (selectedType) {
      this.mapTypeSelected.emit({
        type: selectedType
      });
    }

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

  public onBarangayOfficialChange(event: any): void {
    const officialId = +event.target.value;
    // Assuming you have a way to get barangay official details by ID
    // For example, you might have a list of officials similar to barangays
    // Here, we'll just emit the ID for simplicity
    console.log("Sidebar-menu: ", officialId);
    this.barangayOfficialSelected.emit({
      id: officialId
    });
  }

  public onEvacuationCenterChange(event: any): void {
    const evacuationCenterId = +event.target.value;
    // Assuming you have a way to get evacuation center details by ID
    // For example, you might have a list of evacuation centers similar to barangays
    // Here, we'll just emit the ID for simplicity
    // this.barangayOfficialSelected.emit({
    //   id: evacuationCenterId,
    //   barangay: '', // You can fill this with the actual name if available
    //   coordinates: [0, 0] // You can fill this with actual coordinates if available
    // });
  }

  public onDssFilterClickSidebarMenu() {
    this.dssFilterClicked.emit();
  }

  public truncate(text: string, max: number = 20): string {
    return text.length > max ? text.substring(0, max) + '...' : text;
  }

  ngOnInit(): void {
    this.user = this.authService.getUser();
  }
}
