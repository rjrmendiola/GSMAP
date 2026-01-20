import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { SubMenuItem } from 'src/app/core/models/menu.model';
import { MenuService } from '../../../services/menu.service';
import { SidebarSubmenuComponent } from '../sidebar-submenu/sidebar-submenu.component';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { NgFor, NgClass, NgTemplateOutlet, NgIf } from '@angular/common';
import { AuthService } from 'src/app/core/services/auth.service';
import { Barangay } from 'src/app/shared/models/barangay.model';
import { BarangayTypeaheadComponent } from '../components/barangay-typeahead/barangay-typeahead.component';

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
        BarangayTypeaheadComponent
    ],
})
export class SidebarMenuComponent implements OnInit {
  @Input() barangays: Barangay[] = [];
  @Input() barangayOfficials: any[] = [];
  @Input() evacuationCenters: any[] = [];
  @Output() dssFilterClicked = new EventEmitter<void>();
  @Output() dssAlertClicked = new EventEmitter<void>();
  @Output() dssDecisionClicked = new EventEmitter<void>();
  @Output() dssEvacuationClicked = new EventEmitter<void>();
  @Output() menuClicked = new EventEmitter<{ type: string, category?: string }>();
  @Output() barangaySelected = new EventEmitter<{ id: number, barangay: string, coordinates: [number, number] }>();
  @Output() barangayOfficialSelected = new EventEmitter<{ id: number }>();
  @Output() evacuationCenterSelected = new EventEmitter<{ id: number }>();
  @Output() mapTypeSelected = new EventEmitter<{ type: string }>();
  @Output() barangaysSelected = new EventEmitter<number[]>();
  @Output() simulationClicked = new EventEmitter<void>();

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

  selectedBarangays: number[] = [];

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
    // const officialId = +event.target.value;
    const barangayId = +event.target.value;
    this.barangayOfficialSelected.emit({
      id: barangayId
    });
  }

  onBarangayToggle(barangay: number, event: Event) {
    const checked = (event.target as HTMLInputElement).checked; // cast to HTMLInputElement

    if (checked) {
      if (!this.selectedBarangays.includes(barangay)) {
        this.selectedBarangays.push(barangay);
      }
    } else {
      this.selectedBarangays = this.selectedBarangays.filter(b => b !== barangay);
    }

    // Emit to parent
    this.barangaysSelected.emit(this.selectedBarangays);
  }

  public onEvacuationCenterChange(event: any): void {
    // const evacuationCenterId = +event.target.value;
    // this.evacuationCenterSelected.emit({
    //   id: evacuationCenterId
    // });
    const barangayId = +event.target.value;
    this.evacuationCenterSelected.emit({
      id: barangayId
    });
  }

  public onDssFilterClickSidebarMenu() {
    this.dssFilterClicked.emit();
  }

  public onDssAlertClick() {
    this.dssAlertClicked.emit();
  }

  public onDssDecisionClick() {
    this.dssDecisionClicked.emit();
  }

  public onDssEvacuationClick() {
    this.dssEvacuationClicked.emit();
  }

  public onSimulationClick() {
    this.simulationClicked.emit();
  }

  public truncate(text: string, max: number = 20): string {
    return text.length > max ? text.substring(0, max) + '...' : text;
  }

  ngOnInit(): void {
    this.user = this.authService.getUser();
  }
}
