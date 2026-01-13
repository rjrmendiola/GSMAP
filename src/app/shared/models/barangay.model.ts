export interface Barangay {
  id: number;
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
  barangayProfile?: BarangayProfile;
}

export interface BarangayProfile {
  id: number;
  barangay_id: number;
  area: number;
  population_density: number;
  population: number;
  livelihood: string;
  max_slope?: number;
  mean_slope?: number;
  created_at?: string;
  updated_at?: string;
}

export interface BarangayWithProfile extends Barangay {
  profile?: BarangayProfile;
}

export interface BarangayResponse {
  total: number;
  page: number;
  limit: number;
  barangays: Barangay[];
}
