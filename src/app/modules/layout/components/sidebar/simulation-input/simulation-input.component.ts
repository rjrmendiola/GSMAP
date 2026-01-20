import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { SimulationParams, EvacuationCenterRisk } from 'src/app/core/models/simulation.model';
import { SimulationService } from 'src/app/core/services/simulation.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-simulation-input',
  standalone: true,
  imports: [CommonModule, FormsModule, AngularSvgIconModule],
  templateUrl: './simulation-input.component.html',
  styleUrl: './simulation-input.component.scss'
})
export class SimulationInputComponent implements OnInit, OnDestroy {
  @Input() evacuationCenters: any[] = [];
  @Output() simulationStarted = new EventEmitter<SimulationParams>();
  @Output() backClicked = new EventEmitter<void>();

  rainfallIntensity: number = 50; // MM
  duration: number = 6; // hours
  soilMoisture: 'Dry' | 'Moist' | 'Saturated' = 'Moist';

  evacuationCenterRisks: EvacuationCenterRisk[] = [];
  isSimulationActive: boolean = false;

  private simulationSubscription?: Subscription;

  constructor(private simulationService: SimulationService) {}

  ngOnInit(): void {
    // Subscribe to simulation state changes
    this.simulationSubscription = this.simulationService.simulationState$.subscribe(state => {
      this.isSimulationActive = state.isActive;
      this.evacuationCenterRisks = state.evacuationCenterRisks;
    });
  }

  ngOnDestroy(): void {
    if (this.simulationSubscription) {
      this.simulationSubscription.unsubscribe();
    }
  }

  onUpdate(): void {
    const params: SimulationParams = {
      rainfallIntensity: this.rainfallIntensity,
      duration: this.duration,
      soilMoisture: this.soilMoisture
    };

    this.simulationStarted.emit(params);
  }

  onBack(): void {
    this.backClicked.emit();
  }

  getRiskLevelColor(riskLevel: string): string {
    switch (riskLevel) {
      case 'Minimal':
        return 'bg-green-400';
      case 'Low':
        return 'bg-green-500';
      case 'Moderate':
        return 'bg-yellow-500';
      case 'High':
        return 'bg-orange-500';
      case 'Critical':
        return 'bg-red-600';
      default:
        return 'bg-gray-500';
    }
  }

  getOverallRiskLevel(): string {
    if (!this.evacuationCenterRisks || this.evacuationCenterRisks.length === 0) {
      return 'Minimal';
    }

    // Risk level priority order (highest to lowest)
    const riskPriority: { [key: string]: number } = {
      'Critical': 5,
      'High': 4,
      'Moderate': 3,
      'Low': 2,
      'Minimal': 1
    };

    // Find the highest risk level
    let highestRisk = 'Minimal';
    let highestPriority = 0;

    this.evacuationCenterRisks.forEach(center => {
      const priority = riskPriority[center.riskLevel] || 0;
      if (priority > highestPriority) {
        highestPriority = priority;
        highestRisk = center.riskLevel;
      }
    });

    return highestRisk;
  }
}
