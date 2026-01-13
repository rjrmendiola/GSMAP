import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AlertDashboardComponent } from './pages/alert-dashboard/alert-dashboard.component';
import { DecisionMatrixComponent } from './pages/decision-matrix/decision-matrix.component';
import { EvacuationPlannerComponent } from './pages/evacuation-planner/evacuation-planner.component';

const routes: Routes = [
  {
    path: 'alerts',
    component: AlertDashboardComponent
  },
  {
    path: 'decision-matrix',
    component: DecisionMatrixComponent
  },
  {
    path: 'evacuation-planner',
    component: EvacuationPlannerComponent
  },
  {
    path: '',
    redirectTo: 'alerts',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DssRoutingModule {}
