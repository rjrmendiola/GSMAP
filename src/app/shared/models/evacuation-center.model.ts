import { BarangayOfficial } from "./barangay-official.model";
import { Barangay } from "./barangay.model";

export interface EvacuationCenter {
  id?: number;
  name: string;
  barangay_id: number;
  barangay_official_id: number;
  latitude: number;
  longitude: number;
  venue: string;
  image: string;

  barangay?: Barangay;
  barangayOfficial?: BarangayOfficial;
}

export interface EvacuationCenterWithDistance extends EvacuationCenter {
  distance: number;
}
