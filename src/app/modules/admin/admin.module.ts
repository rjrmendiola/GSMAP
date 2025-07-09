import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminRoutingModule } from './admin-routing.module';
import { MaterialModule } from 'src/app/shared/material/material.module';
import { AdminSidebarComponent } from './components/admin-sidebar/admin-sidebar.component';
import { ManageOfficialsComponent } from './pages/manage-officials/manage-officials.component';
import { ManageUsersComponent } from './pages/manage-users/manage-users.component';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { ManageBarangaysComponent } from './pages/manage-barangays/manage-barangays.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    AdminRoutingModule,
    MaterialModule,
    AdminSidebarComponent,
    ManageBarangaysComponent,
    ManageOfficialsComponent,
    ManageUsersComponent,
    AngularSvgIconModule.forRoot()
  ]
})
export class AdminModule { }
