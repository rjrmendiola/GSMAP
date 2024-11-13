import { Component } from '@angular/core';
import { ThemeService } from './core/services/theme.service';
import { RouterOutlet } from '@angular/router';
import { NgClass } from '@angular/common';
import { ResponsiveHelperComponent } from './shared/components/responsive-helper/responsive-helper.component';
import { NgxSonnerToaster } from 'ngx-sonner';

interface DisasterType {
  type: string;
  category?: string; // Make category optional
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [NgClass, RouterOutlet, ResponsiveHelperComponent, NgxSonnerToaster],
})
export class AppComponent {
  title = 'GIS MDS';
  // selectedDisaster: DisasterType = { type: '' };
  disasterType!: { type: string; category?: string };

  constructor(public themeService: ThemeService) {}

  onDisasterTypeChange(event: { type: string, category?: string }) {
    this.disasterType = event;
  }
}
