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
      {
        path: 'barangays',
        loadComponent: () => import('./pages/manage-barangays/manage-barangays.component').then(m => m.ManageBarangaysComponent),
        // children: [
        //   {
        //     path: 'import',
        //     loadComponent: () => import('./pages/import-barangays/import-barangays.component').then(m => m.ImportBarangaysComponent)
        //   }
        // ],
      },
      {
        path: 'barangays/import',
        loadComponent: () => import('./pages/import-barangays/import-barangays.component').then(m => m.ImportBarangaysComponent)
      },
      {
        path: 'officials',
        loadComponent: () => import('./pages/manage-officials/manage-officials.component').then(m => m.ManageOfficialsComponent)
      },
      {
        path: 'officials/import',
        loadComponent: () => import('./pages/import-barangay-officials/import-barangay-officials.component').then(m => m.ImportBarangayOfficialsComponent)
      },
      {
        path: 'evacuation-centers',
        loadComponent: () => import('./pages/manage-evacuation-centers/manage-evacuation-centers.component').then(m => m.ManageEvacuationCentersComponent)
      },
      {
        path: 'evacuation-centers/import',
        loadComponent: () => import('./pages/import-evacuation-centers/import-evacuation-centers.component').then(m => m.ImportEvacuationCentersComponent)
      },
      {
        path: 'evacuation-centers/:id/images',
        loadComponent: () => import('./pages/manage-evacuation-center-images/manage-evacuation-center-images.component').then(m => m.ManageEvacuationCenterImagesComponent)
      },
      // { path: 'users', loadComponent: () => import('./pages/manage-users/manage-users.component').then(m => m.ManageUsersComponent) },
      // { path: 'weather-settings', loadComponent: () => import('./pages/manage-weather-settings/manage-weather-settings.component').then(m => m.ManageWeatherSettingsComponent) },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule {}
