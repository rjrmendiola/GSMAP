import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { Barangay, BarangayProfile } from 'src/app/shared/models/barangay.model';
import { BarangayOfficialService, BarangayOfficial as ServiceBarangayOfficial } from './barangay-official.service';
import { EvacuationCenterService, EvacuationCenter as ServiceEvacuationCenter } from './evacuation-center.service';

@Injectable({
  providedIn: 'root'
})
export class BarangayDetailsService {
  private allEvacuationCenters: ServiceEvacuationCenter[] = [];
  private allBarangayOfficials: ServiceBarangayOfficial[] = [];
  private dataLoaded = false;

  constructor(
    private barangayOfficialService: BarangayOfficialService,
    private evacuationCenterService: EvacuationCenterService
  ) {}

  async loadAllData(): Promise<void> {
    if (this.dataLoaded) {
      return;
    }

    try {
      const [centers, officials] = await Promise.all([
        lastValueFrom(this.evacuationCenterService.getAllEvacuationCenters()),
        lastValueFrom(this.barangayOfficialService.getAllBarangayOfficials())
      ]);

      this.allEvacuationCenters = centers;
      this.allBarangayOfficials = officials;
      this.dataLoaded = true;

      console.log('Barangay details data loaded:', {
        evacuationCenters: this.allEvacuationCenters.length,
        barangayOfficials: this.allBarangayOfficials.length
      });
    } catch (error) {
      console.error('Error loading barangay details data:', error);
      throw error;
    }
  }

  findNearestEvacuationCenters(
    barangayLat: number,
    barangayLng: number,
    topCount: number = 5
  ): any[] {
    if (!this.allEvacuationCenters.length) {
      console.warn('No evacuation centers available from database');
      return [];
    }

    console.log(`🔍 Finding top ${topCount} nearest evacuation centers`);
    console.log('Total evacuation centers from database:', this.allEvacuationCenters.length);

    // Calculate distance for each evacuation center (same logic as layout.component.ts findNearestLocations)
    const distances = this.allEvacuationCenters.map(center => ({
      ...center,
      distance: this.calculateHaversineDistance(
        barangayLat,
        barangayLng,
        center.latitude,
        center.longitude
      )
    }));

    // Sort by distance and get the top N (same as layout.component.ts)
    distances.sort((a, b) => a.distance - b.distance);
    const topCenters = distances.slice(0, topCount);

    console.log(`Top ${topCenters.length} nearest evacuation centers:`,
      topCenters.map(c => ({
        name: c.name,
        distance: c.distance.toFixed(2) + ' km',
        barangay: c.barangay,
        hasOfficial: !!c.barangay_official,
        official: c.barangay_official?.name || 'N/A'
      }))
    );

    console.log("CENTERS",topCenters)

    return topCenters;
  }

  private calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371;
    const dLat = this.degreesToRadians(lat2 - lat1);
    const dLon = this.degreesToRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degreesToRadians(lat1)) *
      Math.cos(this.degreesToRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  getChairmanForBarangay(barangayId: number): ServiceBarangayOfficial | null {
    const chairman = this.allBarangayOfficials.find(official =>
      official.barangay?.id === barangayId &&
      (official.position.toLowerCase().includes('chairman') ||
       official.position.toLowerCase().includes('captain'))
    );

    return chairman || null;
  }

  async getCompleteBarangayDetails(barangay: Barangay): Promise<{
    barangay: Barangay;
    barangayProfile: BarangayProfile | null;
    chairman: any;
    nearestEvacuationCenters: any[];
  }> {
    if (!this.dataLoaded) {
      await this.loadAllData();
    }

    // Find top 5 nearest evacuation centers
    const nearestCenters = this.findNearestEvacuationCenters(
      barangay.latitude,
      barangay.longitude
    );

    // Get chairman from the nearest evacuation center (barangay official is stored in evacuation center)
    let chairman = null;
    const firstCenter = nearestCenters.length > 0 ? nearestCenters[0] : null;
    // Handle both 'official' (from API) and 'barangay_official' (from interface) property names
    if (firstCenter && (firstCenter.official || firstCenter.barangay_official)) {
      chairman = firstCenter.official || firstCenter.barangay_official;
      console.log('Chairman from nearest evacuation center:', chairman);
    } else {
      // Fallback: try to find from barangay officials list
      chairman = this.getChairmanForBarangay(barangay.id);
      console.log('Chairman from officials list (fallback):', chairman);
    }

    const barangayWithProfile = barangay as any;
    const barangayProfile = barangayWithProfile.barangayProfile || null;

    console.log('Final chairman data:', chairman);
    console.log('Total nearest evacuation centers:', nearestCenters.length);

    return {
      barangay,
      barangayProfile,
      chairman,
      nearestEvacuationCenters: nearestCenters
    };
  }
}
