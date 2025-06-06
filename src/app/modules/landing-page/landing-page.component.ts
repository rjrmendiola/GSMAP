import { Component, Renderer2, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss'
})
export class LandingPageComponent implements OnInit {
  constructor(private renderer: Renderer2) {}

  ngOnInit(): void {
    // this.renderer.removeClass(document.body, 'bg-background');
  }
}
