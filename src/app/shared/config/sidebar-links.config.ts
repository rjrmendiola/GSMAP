// sidebar-links.config.ts
export const USER_LINKS = [
  { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
  { label: 'Landslide', path: '/landslide', icon: 'terrain' },
  // Add other regular user links
];

export const ADMIN_LINKS = [
  { label: 'Barangays', path: '/admin/barangays', icon: 'people' },
  { label: 'Officials', path: '/admin/officials', icon: 'people' },
  { label: 'Evacuation Centers', path: '/admin/evacuation-centers', icon: 'people' },
  { label: 'Users', path: '/admin/users', icon: 'admin_panel_settings' },
  // { label: 'Manage Users', path: '/admin/users', icon: 'admin_panel_settings' },
  // Add other admin links
];
