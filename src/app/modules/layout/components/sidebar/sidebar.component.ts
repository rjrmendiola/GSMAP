import { Component, EventEmitter, OnInit, Input, Output } from '@angular/core';
import { ThemeService } from 'src/app/core/services/theme.service';
import packageJson from '../../../../../../package.json';
import { MenuService } from '../../services/menu.service';
import { Router, RouterLink } from '@angular/router';
import { SidebarMenuComponent } from './sidebar-menu/sidebar-menu.component';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { NgClass, NgIf } from '@angular/common';
import { Theme } from 'src/app/core/models/theme.model';
import { DisasterService } from 'src/app/core/services/disaster.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { MapTypeService } from 'src/app/core/services/maptype.service';

interface DisasterType {
  type: string;
  category?: string; // Make category optional
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  standalone: true,
  imports: [NgClass, NgIf, AngularSvgIconModule, SidebarMenuComponent, RouterLink],
})
export class SidebarComponent implements OnInit {
  @Input() barangays: any[] = [];
  @Input() barangayOfficials: any[] = [];
  @Input() evacuationCenters: any[] = [];
  @Output() dssSidebarFilterClicked = new EventEmitter<void>();
  @Output() disasterTypeChange = new EventEmitter<{ type: string, category?: string }>();
  @Output() barangaySelected = new EventEmitter<{ id: number, barangay: string, coordinates: [number, number] }>();
  @Output() barangayOfficialSelected = new EventEmitter<{ id: number }>();
  @Output() mapTypeSelected = new EventEmitter<{ type: string }>();

  public appJson: any = packageJson;
  public isLoggedIn = false;
  // public isDssFilterVisible = false;

  constructor(
    public menuService: MenuService,
    public disasterService: DisasterService,
    public mapTypeService: MapTypeService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {}

  ngAfterViewInit() {
      this.isLoggedIn = this.authService.isLoggedIn();
    }

  public toggleSidebar() {
    this.menuService.toggleSidebar();
  }

  // public onSidebarMenuClick(event: { type: string; category?: string }) {
  //   this.disasterService.setDisasterType(event);
  // }

  // public onBarangaySelected(event: { id: number; barangay: string; coordinates: [number, number] }) {
  //   this.barangaySelected.emit(event);
  // }

  public onBarangayOfficialSelected(event: { id: number }) {
    this.barangayOfficialSelected.emit(event);
  }

  // public onMapTypeSelected(event: { type: string }) {
  //   this.mapTypeService.setMapType(event);
  // }

  public onDssFilterClicked() {
    this.dssSidebarFilterClicked.emit();
  }

  public logout() {
    this.authService.logout();
    this.router.navigate(['/admin/login']);
  }
}
