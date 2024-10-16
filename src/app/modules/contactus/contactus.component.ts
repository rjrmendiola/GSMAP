import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet, Event } from '@angular/router';
import { SidebarComponent } from '../layout/components/sidebar/sidebar.component';
import { NavbarComponent } from '../layout/components/navbar/navbar.component';
import { FooterComponent } from '../layout/components/footer/footer.component';


@Component({
  selector: 'app-contactus',
  standalone: true,
  imports: [SidebarComponent, NavbarComponent, RouterOutlet, FooterComponent],
  templateUrl: './contactus.component.html',
  styleUrl: './contactus.component.scss'
})
export class ContactusComponent  implements OnInit {
  ngOnInit(): void {
    throw new Error('Method not implemented.');
  }
  // private mainContent: HTMLElement | null = null;

  // constructor(private router: Router) {
  //   this.router.events.subscribe((event: Event) => {
  //     if (event instanceof NavigationEnd) {
  //       if (this.mainContent) {
  //         this.mainContent!.scrollTop = 0;
  //       }
  //     }
  //   });
  // }

  // ngOnInit(): void {
  //   this.mainContent = document.getElementById('app-contactus');
  // }
}
