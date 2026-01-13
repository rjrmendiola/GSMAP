import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DssUpdate {
  alerts: any[];
  statistics: any;
  evacuationPlan: any;
  triggeredRules: any;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: Socket | null = null;
  private dssUpdates$ = new Subject<DssUpdate>();
  private connected$ = new Subject<boolean>();

  constructor() {}

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.socket) {
      console.log('[WebSocket] Already connected');
      return;
    }

    const wsUrl = environment.apiUrl.replace('/api', '');
    console.log('[WebSocket] Connecting to:', wsUrl);

    // Connect to backend WebSocket server
    this.socket = io(wsUrl, {
      transports: ['websocket', 'polling']
    });

    // Connection event handlers
    this.socket.on('connect', () => {
      console.log('[WebSocket] ✓ Connected! Socket ID:', this.socket?.id);
      this.connected$.next(true);

      // Join DSS room for real-time updates
      this.socket?.emit('join_dss');
      console.log('[WebSocket] → Sent join_dss request');
    });

    this.socket.on('disconnect', () => {
      console.log('[WebSocket] ✗ Disconnected');
      this.connected$.next(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[WebSocket] ✗ Connection error:', error);
      this.connected$.next(false);
    });

    // Listen for DSS updates
    this.socket.on('dss_update', (data: DssUpdate) => {
      console.log('[WebSocket] 📊 DSS Update received!');
      console.log('  - Alerts:', data.alerts.length);
      console.log('  - Critical:', data.statistics.byLevel.RED);
      console.log('  - Timestamp:', data.timestamp);
      this.dssUpdates$.next(data);
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Get DSS updates as Observable
   */
  getDssUpdates(): Observable<DssUpdate> {
    return this.dssUpdates$.asObservable();
  }

  /**
   * Get connection status as Observable
   */
  getConnectionStatus(): Observable<boolean> {
    return this.connected$.asObservable();
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}
