import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TradingViewChartComponent } from './trading-view-chart.component';

describe('TradingViewChartComponent', () => {
  let component: TradingViewChartComponent;
  let fixture: ComponentFixture<TradingViewChartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TradingViewChartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TradingViewChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
