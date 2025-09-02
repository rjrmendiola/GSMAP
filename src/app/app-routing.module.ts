import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  // {
  //   path: '',
  //   loadChildren: () => import('./modules/landing-page/landing-page.module').then((m) => m.LandingPageModule),
  // },
  {
    // path: 'layout',
    path: '',
    loadChildren: () => import('./modules/user/user.module').then((m) => m.UserModule),
  },
  // {
  //   path: 'auth',
  //   loadChildren: () => import('./modules/auth/auth.module').then((m) => m.AuthModule),
  // },
  // {
  //   path: 'errors',
  //   loadChildren: () => import('./modules/error/error.module').then((m) => m.ErrorModule),
  // },
  // {
  //   path: 'admin',
  //   loadChildren: () => import('./modules/admin/admin.module').then(m => m.AdminModule),
  //   // canActivate: [AuthGuard],
  //   data: { role: 'admin' }
  // },
  // { path: '**', redirectTo: 'errors/404' }
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
