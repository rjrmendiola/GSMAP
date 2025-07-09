// sidebar-links.config.ts
export const USER_LINKS = [
  { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
  { label: 'Landslide', path: '/landslide', icon: 'terrain' },
  // Add other regular user links
];

export const ADMIN_LINKS = [
  { label: 'Manage Barangays', path: '/admin/barangays', icon: 'people' },
  { label: 'Manage Officials', path: '/admin/officials', icon: 'people' },
  { label: 'Manage Evacuation Centers', path: '/admin/evacuation-centers', icon: 'people' },
  // { label: 'Manage Users', path: '/admin/users', icon: 'admin_panel_settings' },
  // Add other admin links
];
