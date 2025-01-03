import { ChangeDetectionStrategy, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { SubMenuItem } from 'src/app/core/models/menu.model';
import { MenuService } from '../../../services/menu.service';
import { SidebarSubmenuComponent } from '../sidebar-submenu/sidebar-submenu.component';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { NgFor, NgClass, NgTemplateOutlet, NgIf } from '@angular/common';

interface DisasterType {
  type: string;
  category?: string; // Make category optional
}

@Component({
    selector: 'app-sidebar-menu',
    templateUrl: './sidebar-menu.component.html',
    styleUrls: ['./sidebar-menu.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        NgFor,
        NgClass,
        AngularSvgIconModule,
        NgTemplateOutlet,
        RouterLink,
        RouterLinkActive,
        NgIf,
        SidebarSubmenuComponent,
    ],
})
export class SidebarMenuComponent implements OnInit {
  @Output() menuClicked = new EventEmitter<{ type: string, category?: string }>();
  isDropdownOpen: boolean = false;
  isFloodCategoriesVisible: boolean = false;
  isLandslideCategoriesVisible: boolean = false;

  constructor(public menuService: MenuService) {}

  public toggleMenu(subMenu: SubMenuItem) {
    this.menuService.toggleMenu(subMenu);
  }

  public onMenuClick(type: string, category?: string) {
    this.menuClicked.emit({ type, category });
  }

  public toggleLayer(layerKey: string): void {
  }

  public toggleHazardMenu(categoryId: string) {
    if (categoryId === 'flood-categories') {
      this.isFloodCategoriesVisible = !this.isFloodCategoriesVisible;
    } else if (categoryId === 'landslide-categories') {
      this.isLandslideCategoriesVisible = !this.isLandslideCategoriesVisible;
    }
  }

  ngOnInit(): void {}
}
