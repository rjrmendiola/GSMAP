import { Component, OnInit } from '@angular/core';
import { DssService, Alert, AlertStatistics } from '../../../../core/services/dss.service';

@Component({
  selector: 'app-alert-dashboard',
  templateUrl: './alert-dashboard.component.html',
  styleUrls: ['./alert-dashboard.component.scss']
})
export class AlertDashboardComponent implements OnInit {
  alerts: Alert[] = [];
  statistics: AlertStatistics | null = null;
  loading = true;
  error: string | null = null;
  selectedAlert: Alert | null = null;
  filterLevel: string = 'ALL';
  lastUpdate: Date | null = null;

  // Evacuation Planner Modal
  showEvacuationModal = false;
  evacuationData: any = null;
  evacuationLoading = false;
  selectedEvacuationPlan: any = null;

  constructor(private dssService: DssService) {}

  ngOnInit(): void {
    this.loadAlerts();
    // Refresh alerts every 5 minutes
    setInterval(() => this.loadAlerts(), 5 * 60 * 1000);
  }

  loadAlerts(): void {
    this.loading = true;
    this.error = null;

    this.dssService.getAlerts().subscribe({
      next: (response) => {
        if (response.success) {
          this.alerts = response.data.alerts;
          this.statistics = response.data.statistics;
          this.lastUpdate = new Date(response.data.timestamp);
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load alerts. Please try again.';
        this.loading = false;
        console.error('Error loading alerts:', err);
      }
    });
  }

  get filteredAlerts(): Alert[] {
    if (this.filterLevel === 'ALL') {
      return this.alerts;
    }
    return this.alerts.filter(a => a.alertLevel.level === this.filterLevel);
  }

  get criticalAlerts(): Alert[] {
    return this.alerts.filter(a => a.alertLevel.level === 'RED');
  }

  get highAlerts(): Alert[] {
    return this.alerts.filter(a => a.alertLevel.level === 'ORANGE');
  }

  selectAlert(alert: Alert): void {
    this.selectedAlert = alert;
  }

  closeDetail(): void {
    this.selectedAlert = null;
  }

  getAlertBadgeClass(level: string): string {
    const classes: any = {
      'RED': 'bg-red-600 text-white',
      'ORANGE': 'bg-orange-500 text-white',
      'YELLOW': 'bg-yellow-500 text-white',
      'GREEN': 'bg-green-600 text-white'
    };
    return classes[level] || 'bg-gray-500 text-white';
  }

  getPriorityBadgeClass(priority: string): string {
    const classes: any = {
      'IMMEDIATE': 'bg-red-600 text-white',
      'HIGH': 'bg-orange-500 text-white',
      'ADVISORY': 'bg-yellow-500 text-black'
    };
    return classes[priority] || 'bg-gray-500 text-white';
  }

  printReport(): void {
    window.print();
  }

  exportToPDF(): void {
    alert('PDF export functionality will be implemented next');
  }

  // Evacuation Planner Methods
  openEvacuationPlanner(): void {
    this.showEvacuationModal = true;
    this.loadEvacuationPlan();
  }

  closeEvacuationPlanner(): void {
    this.showEvacuationModal = false;
    this.selectedEvacuationPlan = null;
  }

  loadEvacuationPlan(): void {
    this.evacuationLoading = true;
    this.dssService.getEvacuationPlan().subscribe({
      next: (response) => {
        if (response.success) {
          this.evacuationData = response.data;
        }
        this.evacuationLoading = false;
      },
      error: (err) => {
        console.error('Error loading evacuation plan:', err);
        this.evacuationLoading = false;
      }
    });
  }

  get evacuationPlans(): any[] {
    return this.evacuationData?.plans || [];
  }

  get resourceSummary(): any {
    return this.evacuationData?.resourceSummary || null;
  }

  selectEvacuationPlan(plan: any): void {
    this.selectedEvacuationPlan = plan;
  }

  closeEvacuationDetail(): void {
    this.selectedEvacuationPlan = null;
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

  getCapacityStatusClass(status: string): string {
    const classes: any = {
      'INSUFFICIENT': 'text-red-600',
      'NEAR_CAPACITY': 'text-orange-600',
      'SUFFICIENT': 'text-green-600'
    };
    return classes[status] || 'text-gray-600';
  }
}
