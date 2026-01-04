import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AngularSvgIconModule } from 'angular-svg-icon';
// import { MatButtonModule } from '@angular/material/button';
// import { MatIconModule } from '@angular/material/icon';
// import { MatListModule } from '@angular/material/list';
// import { MatSidenavModule } from '@angular/material/sidenav';
// import { MatToolbarModule } from '@angular/material/toolbar';
import { MaterialModule } from 'src/app/shared/material/material.module';
import { SidebarLink } from 'src/app/shared/interfaces/sidebar-link.interface';
import { ADMIN_LINKS, USER_LINKS } from 'src/app/shared/config/sidebar-links.config';
import packageJson from '../../../../../../package.json';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    // MatSidenavModule,
    // MatToolbarModule,
    // MatListModule,
    // MatButtonModule,
    // MatIconModule
    MaterialModule,
    AngularSvgIconModule
  ],
  templateUrl: './admin-sidebar.component.html',
  styleUrl: './admin-sidebar.component.scss'
})
export class AdminSidebarComponent implements OnInit {
  links: SidebarLink[] = [];

  public appJson: any = packageJson;

  constructor(private authService: AuthService, private router: Router) {}

  logout() {
    this.authService.logout();        // clear token/session
    // this.router.navigate(['/admin/login']); // redirect to admin login
    this.router.navigate(['/']); // redirect to landing page
  }

  ngOnInit(): void {
    // const role: string = 'admin';
    // this.links = role === 'admin' ? ADMIN_LINKS : USER_LINKS;
    this.links = ADMIN_LINKS;
  }
}
