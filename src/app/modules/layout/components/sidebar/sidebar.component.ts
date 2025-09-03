import { Component, EventEmitter, OnInit, Output } from '@angular/core';
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
  @Output() disasterTypeChange = new EventEmitter<{ type: string, category?: string }>();

  public appJson: any = packageJson;
  public isLoggedIn = false;

  constructor(
    public menuService: MenuService,
    public disasterService: DisasterService,
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

  public onSidebarMenuClick(event: { type: string; category?: string }) {
    this.disasterService.setDisasterType(event);
  }

  public logout() {
    this.authService.logout();
    this.router.navigate(['/admin/login']);
  }
}
