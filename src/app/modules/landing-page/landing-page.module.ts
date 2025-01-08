import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LandingPageRoutingModule } from './landing-page-routing.module';
@NgModule({
  imports: [LandingPageRoutingModule, AngularSvgIconModule.forRoot(), MatTooltipModule],
  providers: [provideHttpClient(withInterceptorsFromDi())]
})
export class LandingPageModule {}

