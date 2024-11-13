import { MenuItem } from '../models/menu.model';

export class Menu {
  public static pages: MenuItem[] = [
    {
      group: '',
      separator: false,
      items: [
        {
          icon: 'assets/icons/heroicons/outline/exclamation-triangle.svg',
          label: 'Typhoon Category',
          route: '/typhoon-category',
          children: [
            { label: 'Category 1', route: '/typhoon-category/1', slug: 'category1' },
            { label: 'Category 2', route: '/typhoon-category/2', slug: 'category2' },
            { label: 'Category 3', route: '/typhoon-category/3', slug: 'category3' },
            { label: 'Category 4', route: '/typhoon-category/4', slug: 'category4' },
            { label: 'Category 5', route: '/typhoon-category/5', slug: 'category5' },
          ],
        },
        // {
        //   icon: 'assets/icons/heroicons/outline/cube.svg',
        //   label: 'Landslide',
        //   route: '/landslide',
        // },
        // {
        //   icon: 'assets/icons/heroicons/outline/information-circle.svg',
        //   label: 'Flood',
        //   route: '/flood',
        // },
        // {
        //   icon: 'assets/icons/heroicons/outline/user-circle.svg',
        //   label: 'Contact us',
        //   route: '/contactus',
        // },
      ],
    },
    // {
    //   group: 'Collaboration',
    //   separator: true,
    //   items: [
    //     {
    //       icon: 'assets/icons/heroicons/outline/download.svg',
    //       label: 'Download',
    //       route: '/download',
    //     },
    //     {
    //       icon: 'assets/icons/heroicons/outline/gift.svg',
    //       label: 'Gift Card',
    //       route: '/gift',
    //     },
    //     {
    //       icon: 'assets/icons/heroicons/outline/users.svg',
    //       label: 'Users',
    //       route: '/users',
    //     },
    //   ],
    // },
    // {
    //   group: 'Config',
    //   separator: false,
    //   items: [
    //     {
    //       icon: 'assets/icons/heroicons/outline/cog.svg',
    //       label: 'Settings',
    //       route: '/settings',
    //     },
    //     {
    //       icon: 'assets/icons/heroicons/outline/bell.svg',
    //       label: 'Notifications',
    //       route: '/gift',
    //     },
    //     {
    //       icon: 'assets/icons/heroicons/outline/folder.svg',
    //       label: 'Folders',
    //       route: '/folders',
    //       children: [
    //         { label: 'Current Files', route: '/folders/current-files' },
    //         { label: 'Downloads', route: '/folders/download' },
    //         { label: 'Trash', route: '/folders/trash' },
    //       ],
    //     },
    //   ],
    // },
  ];
}
