import { Barangay } from "./barangay.model";

export interface BarangayOfficial {
  id?: number;
  barangay_id: number;
  name: string;
  position: string;
  barangay?: Barangay;
}
