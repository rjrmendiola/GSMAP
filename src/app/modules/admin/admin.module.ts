import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminRoutingModule } from './admin-routing.module';
import { AdminLoginComponent } from './pages/admin-login/admin-login.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { FormsModule } from '@angular/forms';
import { LayoutModule } from '../layout/layout.module';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    AdminRoutingModule,
    LayoutModule, // reuse DSS map
    AdminLoginComponent,
    AdminDashboardComponent
  ]
})
export class AdminModule {}

