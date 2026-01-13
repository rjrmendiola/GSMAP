import { Component, OnInit } from '@angular/core';
import { DssService, EvacuationPlan } from '../../../../core/services/dss.service';

@Component({
  selector: 'app-evacuation-planner',
  templateUrl: './evacuation-planner.component.html',
  styleUrls: ['./evacuation-planner.component.scss']
})
export class EvacuationPlannerComponent implements OnInit {
  evacuationData: any = null;
  loading = true;
  error: string | null = null;
  selectedPlan: EvacuationPlan | null = null;

  constructor(private dssService: DssService) {}

  ngOnInit(): void {
    this.loadEvacuationPlan();
  }

  loadEvacuationPlan(): void {
    this.loading = true;
    this.error = null;

    this.dssService.getEvacuationPlan().subscribe({
      next: (response) => {
        if (response.success) {
          this.evacuationData = response.data;
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load evacuation plan. Please try again.';
        this.loading = false;
        console.error('Error loading evacuation plan:', err);
      }
    });
  }

  get evacuationPlans(): EvacuationPlan[] {
    return this.evacuationData?.plans || [];
  }

  get resourceSummary(): any {
    return this.evacuationData?.resourceSummary || null;
  }

  get totalEvacuationCenters(): number {
    if (!this.evacuationPlans) return 0;
    return this.evacuationPlans.reduce((sum, p) => sum + p.evacuationCenters.length, 0);
  }

  selectPlan(plan: EvacuationPlan): void {
    this.selectedPlan = plan;
  }

  closeDetail(): void {
    this.selectedPlan = null;
  }

  getPriorityBadgeClass(priority: number): string {
    const classes: any = {
      3: 'bg-red-600 text-white',
      2: 'bg-orange-500 text-white',
      1: 'bg-yellow-500 text-black',
      0: 'bg-green-600 text-white'
    };
    return classes[priority] || 'bg-gray-500 text-white';
  }

  getCapacityStatusClass(status: string): string {
    const classes: any = {
      'INSUFFICIENT': 'text-red-600',
      'NEAR_CAPACITY': 'text-orange-600',
      'SUFFICIENT': 'text-green-600'
    };
    return classes[status] || 'text-gray-600';
  }

  printPlan(): void {
    window.print();
  }
}
