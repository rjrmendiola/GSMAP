import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserRoutingModule } from './user-routing.module';
import { LayoutModule } from '../layout/layout.module';

@NgModule({
  imports: [
    CommonModule,
    UserRoutingModule,
    LayoutModule // reuse layout component for users
  ]
})
export class UserModule {}
