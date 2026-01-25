import { ComponentFixture,TestBed } from "@angular/core/testing";
import { PopulationDensityComponent } from "./manage-PopulationDensity.component";  

describe("PopulationDensityComponent", () => {
  let component: PopulationDensityComponent;
  let fixture: ComponentFixture<PopulationDensityComponent>; 
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PopulationDensityComponent]
    })
    .compileComponents();
    fixture = TestBed.createComponent(PopulationDensityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
  it("should create", () => {
    expect(component).toBeTruthy();
  });
});