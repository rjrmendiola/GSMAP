import { ComponentFixture,TestBed } from "@angular/core/testing";
import { ManagePopulationDensityComponent } from "./manage-population-density.component";

describe("ManagePopulationDensityComponent", () => {
  let component: ManagePopulationDensityComponent;
  let fixture: ComponentFixture<ManagePopulationDensityComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagePopulationDensityComponent]
    })
    .compileComponents();
    fixture = TestBed.createComponent(ManagePopulationDensityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
