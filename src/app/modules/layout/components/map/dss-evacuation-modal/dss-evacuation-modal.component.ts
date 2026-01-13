import { NgFor, NgIf, DatePipe } from '@angular/common';
import { Component, EventEmitter, OnInit, OnDestroy, Output } from '@angular/core';
import { DssService, EvacuationPlan } from '../../../../../core/services/dss.service';

@Component({
  selector: 'app-dss-evacuation-modal',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe],
  templateUrl: './dss-evacuation-modal.component.html',
  styleUrls: ['./dss-evacuation-modal.component.scss']
})
export class DssEvacuationModalComponent implements OnInit, OnDestroy {
  @Output() closeModal = new EventEmitter<void>();

  evacuationPlans: EvacuationPlan[] = [];
  evacuationData: any = null;
  loading = true;
  error: string | null = null;
  selectedPlan: EvacuationPlan | null = null;
  filterPriority: string = 'ALL';
  lastUpdate: Date | null = null;
  private refreshInterval: any;

  constructor(private dssService: DssService) {}

  ngOnInit(): void {
    this.loadEvacuationPlans();
   
    // Auto-refresh every 10 seconds for real-time updates
    this.refreshInterval = setInterval(() => {
      this.loadEvacuationPlans(true);
    }, 10000);
  }

  ngOnDestroy(): void {
    // Clean up interval when modal is closed
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  loadEvacuationPlans(silent: boolean = false): void {
    if (!silent) {
      this.loading = true;
    }
    this.error = null;

    this.dssService.getEvacuationPlan().subscribe({
      next: (response) => {
        if (response.success) {
          this.evacuationData = response.data;
          // Filter to only include barangays that actually need evacuation
          const allPlans = response.data.plans || [];
          this.evacuationPlans = allPlans.filter((plan: EvacuationPlan) =>
            plan.estimatedEvacuees > 0 &&
            (plan.alertLevel === 'RED' || plan.alertLevel === 'ORANGE' || plan.alertLevel === 'YELLOW')
          );
          this.lastUpdate = new Date();
          console.log("EVACUATION PLAN", this.evacuationData);
          console.log("EVAC PLAN",this.evacuationPlans)
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load evacuation plans';
        this.loading = false;
      }
    });
  }

  refreshData(): void {
    this.loadEvacuationPlans();
  }

  get filteredPlans(): EvacuationPlan[] {
    if (this.filterPriority === 'ALL') return this.evacuationPlans;
    return this.evacuationPlans.filter(p => p.alertLevel === this.filterPriority);
  }

  get totalEvacuees(): number {
    return this.evacuationPlans.reduce((sum, p) => sum + p.estimatedEvacuees, 0);
  }

  get totalCapacity(): number {
    return this.evacuationPlans.reduce((sum, p) => sum + p.totalCapacity, 0);
  }

  get criticalBarangays(): number {
    return this.evacuationPlans.filter(p => p.alertLevel === 'RED').length;
  }

  selectPlan(plan: EvacuationPlan): void {
    this.selectedPlan = plan;
  }

  closeDetail(): void {
    this.selectedPlan = null;
  }

  onCloseModalClick(): void {
    this.closeModal.emit();
  }

  getAlertClass(level: string): string {
    const classes: any = {
      'RED': 'bg-red-600',
      'ORANGE': 'bg-orange-500',
      'YELLOW': 'bg-yellow-500',
      'GREEN': 'bg-green-600'
    };
    return classes[level] || 'bg-gray-500';
  }

  getCapacityClass(status: string): string {
    const classes: any = {
      'ADEQUATE': 'text-green-400',
      'NEAR_CAPACITY': 'text-yellow-400',
      'OVERCAPACITY': 'text-red-400',
      'SUFFICIENT': 'text-green-400',
      'INSUFFICIENT': 'text-red-400'
    };
    return classes[status] || 'text-gray-400';
  }

  get resourceSummary(): any {
    if (!this.evacuationPlans || this.evacuationPlans.length === 0) {
      return null;
    }

    // Recalculate resource requirements based on filtered evacuation plans only
    const totalEvacuees = this.totalEvacuees;
    const totalCenters = this.evacuationPlans.reduce((sum, p) => sum + (p.evacuationCenters?.length || 0), 0);

    return {
      personnel: {
        medicalStaff: Math.ceil(totalEvacuees / 100),
        security: Math.ceil(totalEvacuees / 150),
        socialWorkers: Math.ceil(totalEvacuees / 200),
        volunteers: Math.ceil(totalEvacuees / 50)
      },
      supplies: {
        foodPacks: totalEvacuees * 3,
        waterBottles: totalEvacuees * 6,
        blankets: Math.ceil(totalEvacuees / 2),
        hygieneKits: Math.ceil(totalEvacuees / 5)
      },
      equipment: {
        generators: totalCenters,
        radios: totalCenters * 2,
        flashlights: Math.ceil(totalEvacuees / 10),
        boats: this.evacuationPlans.filter(p => p.alertLevel === 'RED' && p.risks?.flood?.alertLevel?.level === 'RED').length
      },
      vehicles: {
        evacuationVehicles: Math.ceil(totalEvacuees / 30),
        ambulances: this.evacuationPlans.filter(p => p.alertLevel === 'RED').length
      }
    };
  }

  getEvacuationPriorityBadgeClass(priority: number): string {
    const classes: any = {
      3: 'bg-red-600 text-white',
      2: 'bg-orange-500 text-white',
      1: 'bg-yellow-500 text-black',
      0: 'bg-green-600 text-white'
    };
    return classes[priority] || 'bg-gray-500 text-white';
  }

  getCenterStatusClass(status: string): string {
    const classes: any = {
      'AVAILABLE': 'bg-green-900/30 border-green-500',
      'FULL': 'bg-red-900/30 border-red-500',
      'OVERFLOW': 'bg-orange-900/30 border-orange-500'
    };
    return classes[status] || 'bg-gray-800 border-gray-600';
  }

  getCenterStatusBadgeClass(status: string): string {
    const classes: any = {
      'AVAILABLE': 'bg-green-600 text-white',
      'FULL': 'bg-red-600 text-white',
      'OVERFLOW': 'bg-orange-600 text-white'
    };
    return classes[status] || 'bg-gray-600 text-white';
  }
}
