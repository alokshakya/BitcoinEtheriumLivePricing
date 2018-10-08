import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';


import { AppComponent } from './app.component';
import { HttpModule } from '../../node_modules/@angular/http';
import { TradingViewChartComponent } from './components/trading-view-chart/trading-view-chart.component';

import { TradeHistoryService } from './services/trade-history.service';
import { SocketService } from './services/socket.service';


@NgModule({
  declarations: [
    AppComponent,
    TradingViewChartComponent
  ],
  imports: [
    BrowserModule,
    HttpModule
  ],
  providers: [TradeHistoryService,SocketService],
  bootstrap: [AppComponent]
})
export class AppModule { }
