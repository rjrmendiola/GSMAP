import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  // {
  //   path: '',
  //   loadChildren: () => import('./modules/landing-page/landing-page.module').then((m) => m.LandingPageModule),
  // },
  {
    path: 'layout',
    loadChildren: () => import('./modules/layout/layout.module').then((m) => m.LayoutModule),
  },
  // {
  //   path: 'auth',
  //   loadChildren: () => import('./modules/auth/auth.module').then((m) => m.AuthModule),
  // },
  // {
  //   path: 'errors',
  //   loadChildren: () => import('./modules/error/error.module').then((m) => m.ErrorModule),
  // },
  // { path: '**', redirectTo: 'errors/404' },
  {
    path: 'admin',
    loadChildren: () => import('./modules/admin/admin.module').then(m => m.AdminModule),
    // canActivate: [AuthGuard],
    data: { role: 'admin' }
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
