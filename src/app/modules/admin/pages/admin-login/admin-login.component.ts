import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { SignInComponent } from 'src/app/modules/auth/pages/sign-in/sign-in.component';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [AngularSvgIconModule, RouterOutlet, SignInComponent],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.scss'
})
export class AdminLoginComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
