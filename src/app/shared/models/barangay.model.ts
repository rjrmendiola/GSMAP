export interface Barangay {
  id: number;
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
}

export interface BarangayResponse {
  total: number;
  page: number;
  limit: number;
  barangays: Barangay[];
}
