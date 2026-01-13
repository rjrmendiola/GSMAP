import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DssRoutingModule } from './dss-routing.module';
import { AlertDashboardComponent } from './pages/alert-dashboard/alert-dashboard.component';
import { DecisionMatrixComponent } from './pages/decision-matrix/decision-matrix.component';
import { EvacuationPlannerComponent } from './pages/evacuation-planner/evacuation-planner.component';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    AlertDashboardComponent,
    DecisionMatrixComponent,
    EvacuationPlannerComponent
  ],
  imports: [
    CommonModule,
    DssRoutingModule,
    FormsModule
  ]
})
export class DssModule {}
