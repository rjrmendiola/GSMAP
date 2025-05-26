import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminSidebarComponent } from './components/admin-sidebar/admin-sidebar.component';
import { ManageOfficialsComponent } from './pages/manage-officials/manage-officials.component';
import { ManageUsersComponent } from './pages/manage-users/manage-users.component';
import { AdminLayoutComponent } from './layout/admin-layout.component';

const routes: Routes = [
  // {
  // path: 'officials',
  //   loadComponent: () =>
  //     import('./pages/manage-officials/manage-officials.component').then(m => m.ManageOfficialsComponent)
  // },
  {
    path: '',
    component: AdminLayoutComponent,
    // canActivate: [AuthGuard],
    data: { role: 'admin' },
    children: [
      { path: 'officials', component: ManageOfficialsComponent },
      { path: 'users', component: ManageUsersComponent },
      // { path: '', redirectTo: 'officials', pathMatch: 'full' }
    ]
  },
  // { path: '**', redirectTo: 'error/404' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
