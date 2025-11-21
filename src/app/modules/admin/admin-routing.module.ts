import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminLoginComponent } from './pages/admin-login/admin-login.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { AuthGuard } from '../../core/guards/auth.guard';
import { AdminGuard } from 'src/app/core/guards/admin.guard';

const routes: Routes = [
  { path: 'login', component: AdminLoginComponent },
  {
    path: '',
    component: AdminDashboardComponent,
    canActivate: [AdminGuard],
    children: [
      { path: 'barangays', loadComponent: () => import('./pages/manage-barangays/manage-barangays.component').then(m => m.ManageBarangaysComponent) },
      { path: 'officials', loadComponent: () => import('./pages/manage-officials/manage-officials.component').then(m => m.ManageOfficialsComponent) },
      { path: 'evacuation-centers', loadComponent: () => import('./pages/manage-evacuation-centers/manage-evacuation-centers.component').then(m => m.ManageEvacuationCentersComponent) },
      { path: 'users', loadComponent: () => import('./pages/manage-users/manage-users.component').then(m => m.ManageUsersComponent) },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule {}
