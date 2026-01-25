import { ComponentFixture,TestBed } from "@angular/core/testing";
import { ManageBarangayProfileComponent } from "./manage-barangay-profile.component";

describe("ManageBarangayProfileComponent", () => {
  let component: ManageBarangayProfileComponent;
  let fixture: ComponentFixture<ManageBarangayProfileComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageBarangayProfileComponent]
    })
    .compileComponents();
    fixture = TestBed.createComponent(ManageBarangayProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
