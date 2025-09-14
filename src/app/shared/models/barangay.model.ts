export interface Barangay {
  id?: number;
  name: string;
  slug: string;
}

export interface BarangayResponse {
  total: number;
  page: number;
  limit: number;
  barangays: Barangay[];
}
