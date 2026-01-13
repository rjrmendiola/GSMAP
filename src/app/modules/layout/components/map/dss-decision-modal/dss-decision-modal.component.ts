import { NgFor, NgIf, DatePipe, JsonPipe } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { DssService, DecisionRule, DecisionMatrix } from '../../../../../core/services/dss.service';

@Component({
  selector: 'app-dss-decision-modal',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe, JsonPipe],
  templateUrl: './dss-decision-modal.component.html',
  styleUrls: ['./dss-decision-modal.component.scss']
})
export class DssDecisionModalComponent implements OnInit {
  @Output() closeModal = new EventEmitter<void>();

  matrix: DecisionMatrix | null = null;
  loading = true;
  error: string | null = null;
  selectedRule: DecisionRule | null = null;
  filterCategory: string = 'ALL';
  filterPriority: string = 'ALL';

  constructor(private dssService: DssService) {}

  ngOnInit(): void {
    this.loadDecisionRules();
  }

  loadDecisionRules(): void {
    this.loading = true;
    this.error = null;

    this.dssService.getDecisionRules().subscribe({
      next: (response) => {
        if (response.success) {
          this.matrix = response.data;
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load decision rules';
        this.loading = false;
      }
    });
  }

  get filteredRules(): DecisionRule[] {
    if (!this.matrix) return [];

    let rules = this.matrix.rules;

    if (this.filterCategory !== 'ALL') {
      rules = rules.filter(r => r.category === this.filterCategory);
    }

    if (this.filterPriority !== 'ALL') {
      rules = rules.filter(r => r.priority === this.filterPriority);
    }

    return rules;
  }

  selectRule(rule: DecisionRule): void {
    this.selectedRule = rule;
  }

  closeDetail(): void {
    this.selectedRule = null;
  }

  onCloseModalClick(): void {
    this.closeModal.emit();
  }

  getPriorityClass(priority: string): string {
    const classes: any = {
      'CRITICAL': 'bg-red-600',
      'HIGH': 'bg-orange-500',
      'MEDIUM': 'bg-yellow-500',
      'LOW': 'bg-green-600'
    };
    return classes[priority] || 'bg-gray-500';
  }

  getCategoryColor(category: string): string {
    const colors: any = {
      'FLOOD': 'text-blue-400',
      'LANDSLIDE': 'text-orange-400',
      'WIND': 'text-purple-400',
      'COMPOUND': 'text-red-400',
      'EVACUATION': 'text-yellow-400',
      'COMMUNICATION': 'text-green-400',
      'MEDICAL': 'text-pink-400',
      'INFRASTRUCTURE': 'text-cyan-400',
      'RECOVERY': 'text-indigo-400'
    };
    return colors[category] || 'text-gray-400';
  }
}
