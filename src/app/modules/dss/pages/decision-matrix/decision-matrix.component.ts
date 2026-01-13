import { Component, OnInit } from '@angular/core';
import { DssService, DecisionRule, DecisionMatrix } from '../../../../core/services/dss.service';

@Component({
  selector: 'app-decision-matrix',
  templateUrl: './decision-matrix.component.html',
  styleUrls: ['./decision-matrix.component.scss']
})
export class DecisionMatrixComponent implements OnInit {
  matrix: DecisionMatrix | null = null;
  triggeredRules: any[] = [];
  loading = true;
  error: string | null = null;
  selectedCategory: string = 'ALL';
  selectedPriority: string = 'ALL';
  showTriggeredOnly = false;

  constructor(private dssService: DssService) {}

  ngOnInit(): void {
    this.loadDecisionMatrix();
    this.loadTriggeredRules();
  }

  loadDecisionMatrix(): void {
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
        this.error = 'Failed to load decision matrix. Please try again.';
        this.loading = false;
        console.error('Error loading decision matrix:', err);
      }
    });
  }

  loadTriggeredRules(): void {
    this.dssService.getTriggeredRules().subscribe({
      next: (response) => {
        if (response.success) {
          this.triggeredRules = response.data.triggeredRules;
        }
      },
      error: (err) => {
        console.error('Error loading triggered rules:', err);
      }
    });
  }

  get filteredRules(): DecisionRule[] {
    if (!this.matrix) return [];

    let rules = this.matrix.rules;

    if (this.selectedCategory !== 'ALL') {
      rules = rules.filter(r => r.category === this.selectedCategory);
    }

    if (this.selectedPriority !== 'ALL') {
      rules = rules.filter(r => r.priority === this.selectedPriority);
    }

    return rules;
  }

  get activeTriggeredRules(): any[] {
    return this.triggeredRules.flatMap(tr => tr.triggeredRules);
  }

  isRuleTriggered(ruleId: string): boolean {
    return this.activeTriggeredRules.some(r => r.id === ruleId);
  }

  getPriorityBadgeClass(priority: string): string {
    const classes: any = {
      'CRITICAL': 'bg-red-600 text-white',
      'HIGH': 'bg-orange-500 text-white',
      'MEDIUM': 'bg-yellow-500 text-black',
      'LOW': 'bg-blue-500 text-white'
    };
    return classes[priority] || 'bg-gray-500 text-white';
  }

  getCategoryBadgeClass(category: string): string {
    const classes: any = {
      'FLOOD': 'bg-blue-600 text-white',
      'LANDSLIDE': 'bg-orange-600 text-white',
      'WIND': 'bg-purple-600 text-white',
      'COMPOUND': 'bg-red-700 text-white',
      'EVACUATION': 'bg-green-600 text-white',
      'COMMUNICATION': 'bg-indigo-600 text-white',
      'MEDICAL': 'bg-pink-600 text-white',
      'INFRASTRUCTURE': 'bg-gray-600 text-white',
      'RECOVERY': 'bg-teal-600 text-white'
    };
    return classes[category] || 'bg-gray-500 text-white';
  }

  printMatrix(): void {
    window.print();
  }
}
