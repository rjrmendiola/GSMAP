import { NgFor, NgIf, DatePipe } from '@angular/common';
import { Component, EventEmitter, OnInit, OnDestroy, Output } from '@angular/core';
import { DssService, Alert, AlertStatistics } from '../../../../../core/services/dss.service';
import { WebSocketService } from '../../../../../core/services/websocket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dss-alert-modal',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe],
  templateUrl: './dss-alert-modal.component.html',
  styleUrls: ['./dss-alert-modal.component.scss']
})
export class DssAlertModalComponent implements OnInit, OnDestroy {
  @Output() closeModal = new EventEmitter<void>();

  alerts: Alert[] = [];
  statistics: AlertStatistics | null = null;
  loading = true;
  error: string | null = null;
  selectedAlert: Alert | null = null;
  filterLevel: string = 'ALL';
  testMode = false; // Toggle between real and test data
  realtimeMode = true; // Real-time updates enabled
  isConnected = false;
  lastUpdate: Date | null = null;

  private dssSubscription: Subscription | null = null;
  private connectionSubscription: Subscription | null = null;

  constructor(
    private dssService: DssService,
    private wsService: WebSocketService
  ) {}

  ngOnInit(): void {
    console.log('[Alert Dashboard] Component initialized');

    // Connect to WebSocket
    console.log('[Alert Dashboard] Connecting to WebSocket...');
    this.wsService.connect();

    // Subscribe to connection status
    this.connectionSubscription = this.wsService.getConnectionStatus().subscribe(
      status => {
        console.log('[Alert Dashboard] Connection status changed:', status);
        this.isConnected = status;
        if (status) {
          console.log('[Alert Dashboard] ✓ WebSocket connected - receiving real-time updates');
        }
      }
    );

    // Subscribe to real-time DSS updates
    this.dssSubscription = this.wsService.getDssUpdates().subscribe(
      update => {
        console.log('[Alert Dashboard] 📊 Received DSS update from WebSocket!');
        console.log('[Alert Dashboard] Update contains:', update.alerts.length, 'alerts');

        if (this.realtimeMode) {
          console.log('[Alert Dashboard] ✓ Applying update to component...');
          this.alerts = update.alerts;
          this.statistics = update.statistics;
          this.lastUpdate = new Date(update.timestamp);
          this.loading = false;
          console.log('[Alert Dashboard] ✓ Update applied! Critical alerts:', this.statistics?.byLevel.RED);
        } else {
          console.log('[Alert Dashboard] ⚠ Real-time mode is OFF, skipping update');
        }
      }
    );

    // Initial load
    console.log('[Alert Dashboard] Loading initial alerts...');
    this.loadAlerts();
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    if (this.dssSubscription) {
      this.dssSubscription.unsubscribe();
    }
    if (this.connectionSubscription) {
      this.connectionSubscription.unsubscribe();
    }
  }

  loadAlerts(): void {
    this.loading = true;
    this.error = null;

    const apiCall = this.testMode
      ? this.dssService.getTestAlerts()
      : this.dssService.getAlerts();

    apiCall.subscribe({
      next: (response) => {
        if (response.success) {
          this.alerts = response.data.alerts;
          this.statistics = response.data.statistics;
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load alerts';
        this.loading = false;
      }
    });
  }

  toggleTestMode(): void {
    this.testMode = !this.testMode;
    this.loadAlerts();
  }

  get filteredAlerts(): Alert[] {
    if (this.filterLevel === 'ALL') return this.alerts;
    return this.alerts.filter(a => a.alertLevel.level === this.filterLevel);
  }

  selectAlert(alert: Alert): void {
    this.selectedAlert = alert;
  }

  closeDetail(): void {
    this.selectedAlert = null;
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
}
