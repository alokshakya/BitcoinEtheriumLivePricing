# TradingView JS API Intigration Instructions

### 1. Create Angular Project
`ng new tradingViewAngular`

### 2. Copy Files 
Copy `charting_library`'s `datafeeds` and `charting_library` folders to `src/assets` in angular project.

### 3. Update `src/tsconfig.app.json`

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "outDir": "../out-tsc/app",
    "baseUrl": "./",
    "module": "es2015",
    "types": []
  },
  "exclude": [
    "test.ts",
    "**/*.spec.ts",
    "assets/datafeeds/udf/src"
  ]
}

```

### 4. Update `index.html` to add `datafeeds`

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>TradingViewAngular5</title>
  <base href="/">

  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="favicon.ico">
  <script src="/assets/datafeeds/udf/dist/polyfills.js"></script>
  <script src="/assets/datafeeds/udf/dist/bundle.js"></script>
</head>
<body>
  <app-root></app-root>
</body>
</html>

```

### 5. Install `jquery` Types

`npm install @types/jquery --save-dev`

### 6. Install `bootstrap`

`npm install bootstrap --save`

### 7. Update `src/styles.css`

`@import "~bootstrap/dist/css/bootstrap.css";`

### 8. Install `socket.io-client` for socketService
`npm install socket.io-client --save`

## Basics Done!

## Angular Part Starts

### 1. Create a new component `tradingViewChart`
`ng generate component components/tradingViewChart`

### 2. Update `src/app/app.component.html` to show `tradingViewChart` component.
```html
<div class="container-fluid">
  <div class="row">
    <div class="col-md-12" style="padding: 10px; border: 2px solid #ade231; margin-top: 10px;">
      <p class="text text-success text-center h1">Trading View Chart Library Integration in Angular 5 </p>
    </div>
    <div class="col-md-12" style="height: 90vh; border: 2px solid lightseagreen; margin-top:10px;">
      <app-trading-view-chart></app-trading-view-chart>
    </div>
  </div>
</div>
```

### 3. Update HTML of `src/app/components/trading-view-chart/trading-view-chart.html` Component
```html
<div id="tv_chart_container" style="height: 100%;"></div>
```
### 4. Create Service to fetch data from [CryptoCompare API](https://www.cryptocompare.com/api/#-api-data-) website to provide in chart
`ng generate service services/tradeHistory`

### 5. Update `src/app/services/trade-history.service.ts` to fetch data
```javascript
import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions } from '@angular/http';
import { map, catchError } from 'rxjs/operators';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
@Injectable()
export class TradeHistoryService {

  constructor(private http: Http) { }
  baseUrl = 'https://min-api.cryptocompare.com';
  handleError(error : Response) {
      console.error(error);
      return Observable.throw(error);
  }
  
  getBars(symbolInfo, resolution, from, to, first, limit):Observable<any> {
    var split_symbol = symbolInfo.name.split(/[:/]/);
			const url = resolution === 'D' ? '/data/histoday' : parseInt(resolution) >= 60 ? '/data/histohour' : '/data/histominute'
			const qs = {
					e: split_symbol[0],
					fsym: split_symbol[1],
					tsym: split_symbol[2],
					toTs:  to ? to : '',
					limit: limit ? limit : 2000
        }

        return this.http.get(`${this.baseUrl}${url}`,{params:qs})
          .map(res => { 
            return res.json();
          })
          .catch(this.handleError)
		
  }

}

```

This service's `getBars(symbolInfo, resolution, from, to, first, limit):Observable<any> ` function will be used inside `trading-view-chart.ts` to fetch data and provide in `tradingViewCharting library`.

### 6. Update `src/app/components/trading-view-chart/trading-view-chart.ts` to implement `tradingViewChart`

## **Note:** Comment importing `socket.service` and its usage in code untill socket service is not created and updated.
Following lines will be commented

Line 16: `import { SocketService } from '../../services/socket.service';`

Line 94 Update constructor `constructor(public tradeHistory: TradeHistoryService) { }`

Line 229 `this.socketService.subscribeBars(symbolInfo, resolution, onRealtimeCallback, subscribeUID, onResetCacheNeededCallback,history)`

Line 234 `this.socketService.unsubscribeBars(subscriberUID)`


This file contains the main code for implementing charting library's `JS API`. Now Code

```typescript
import { Component, Input, OnInit } from '@angular/core';
import {
    widget,
    IChartingLibraryWidget,
    ChartingLibraryWidgetOptions,
    LanguageCode,
    Timezone,
    IBasicDataFeed,
    ResolutionString,
    ResolutionBackValues,
    HistoryDepth
} from '../../../assets/charting_library/charting_library.min';


import { TradeHistoryService } from '../../services/trade-history.service';
import { SocketService } from '../../services/socket.service';
const history={};

@Component({
  selector: 'app-trading-view-chart',
  templateUrl: './trading-view-chart.component.html',
  styleUrls: ['./trading-view-chart.component.css']
})
export class TradingViewChartComponent implements OnInit {

    public _symbol: ChartingLibraryWidgetOptions['symbol'] = 'Coinbase:BTC/USD';
    private _interval: ChartingLibraryWidgetOptions['interval'] = '1';
    private _libraryPath: ChartingLibraryWidgetOptions['library_path'] = '/assets/charting_library/';
    private _chartsStorageUrl: ChartingLibraryWidgetOptions['charts_storage_url'] = 'https://saveload.tradingview.com';
    private _chartsStorageApiVersion: ChartingLibraryWidgetOptions['charts_storage_api_version'] = '1.1';
    private _clientId: ChartingLibraryWidgetOptions['client_id'] = 'tradingview.com';
    private _userId: ChartingLibraryWidgetOptions['user_id'] = 'public_user_id';
    private _fullscreen: ChartingLibraryWidgetOptions['fullscreen'] = false;
    private _autosize: ChartingLibraryWidgetOptions['autosize'] = true;
    private _containerId: ChartingLibraryWidgetOptions['container_id'] = 'tv_chart_container';
    private _tvWidget: IChartingLibraryWidget | null = null;

    @Input()
    set symbol(symbol: ChartingLibraryWidgetOptions['symbol']) {
        this._symbol = symbol || this._symbol;
    }

    @Input()
    set interval(interval: ChartingLibraryWidgetOptions['interval']) {
        this._interval = interval || this._interval;
    }

    @Input()
    set libraryPath(libraryPath: ChartingLibraryWidgetOptions['library_path']) {
        this._libraryPath = libraryPath || this._libraryPath;
    }

    @Input()
    set chartsStorageUrl(chartsStorageUrl: ChartingLibraryWidgetOptions['charts_storage_url']) {
        this._chartsStorageUrl = chartsStorageUrl || this._chartsStorageUrl;
    }

    @Input()
    set chartsStorageApiVersion(chartsStorageApiVersion: ChartingLibraryWidgetOptions['charts_storage_api_version']) {
        this._chartsStorageApiVersion = chartsStorageApiVersion || this._chartsStorageApiVersion;
    }

    @Input()
    set clientId(clientId: ChartingLibraryWidgetOptions['client_id']) {
        this._clientId = clientId || this._clientId;
    }

    @Input()
    set userId(userId: ChartingLibraryWidgetOptions['user_id']) {
        this._userId = userId || this._userId;
    }

    @Input()
    set fullscreen(fullscreen: ChartingLibraryWidgetOptions['fullscreen']) {
        this._fullscreen = fullscreen || this._fullscreen;
    }

    @Input()
    set autosize(autosize: ChartingLibraryWidgetOptions['autosize']) {
        this._autosize = autosize || this._autosize;
    }

    @Input()
    set containerId(containerId: ChartingLibraryWidgetOptions['container_id']) {
        this._containerId = containerId || this._containerId;
    }
    
    getLanguageFromURL(): LanguageCode | null {
      const regex = new RegExp('[\\?&]lang=([^&#]*)');
      const results = regex.exec(location.search);

      return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, ' ')) as LanguageCode;
    }
    constructor(public tradeHistory: TradeHistoryService, public socketService: SocketService) { }

    ngOnInit() {
        this.loadTradingViewData();
        const widgetOptions: ChartingLibraryWidgetOptions = {
            symbol: this._symbol,
            datafeed: this.Datafeed,
            interval: this._interval,
            container_id: this._containerId,
            library_path: this._libraryPath,
            locale: this.getLanguageFromURL() || 'en',
            disabled_features: ['use_localstorage_for_settings'],
            enabled_features: ['study_templates'],
            charts_storage_url: this._chartsStorageUrl,
            charts_storage_api_version: this._chartsStorageApiVersion,
            client_id: this._clientId,
            user_id: this._userId,
            fullscreen: this._fullscreen,
            autosize: this._autosize,
            overrides: {
        "mainSeriesProperties.showCountdown": true,
				"paneProperties.background": "#131722",
				"paneProperties.vertGridProperties.color": "#363c4e",
				"paneProperties.horzGridProperties.color": "#363c4e",
				"symbolWatermarkProperties.transparency": 90,
				"scalesProperties.textColor" : "#AAA",
				"mainSeriesProperties.candleStyle.wickUpColor": '#336854',
				"mainSeriesProperties.candleStyle.wickDownColor": '#7f323f',
			}
        };

        const tvWidget = new widget(widgetOptions);
        this._tvWidget = tvWidget;
     
    }
    
    Datafeed:IBasicDataFeed;
    timezone:Timezone='Etc/UTC';
    supportedResolutions:string[] = ["1", "3", "5", "15", "30", "60", "120", "240","720"]
    historyDepthReturn:HistoryDepth;
    config = {
        supported_resolutions: this.supportedResolutions
    };
    loadTradingViewData(){
      this.Datafeed = 
      {
        
        onReady: cb => {
          console.log('Inside on ready');
            setTimeout(() => cb(this.config), 0);
            
          },
          searchSymbols: (userInput, exchange, symbolType, onResultReadyCallback) => {
            console.log('Search Symbols running');
          },
          resolveSymbol: (symbolName, onSymbolResolvedCallback, onResolveErrorCallback) => {
            
            console.log('ResolveSymbol running');
            
            var split_data = symbolName.split(/[:/]/);
            
            var symbol_stub = {
              name: symbolName,
              description: `${split_data[1]}/${split_data[2]}`,
              type: 'crypto',
              session: '24x7',
              timezone: this.timezone,
              ticker: symbolName,
              exchange: split_data[0],
              minmov: 1,
              pricescale: 100000000,
              has_intraday: true,
              intraday_multipliers: ['1', '60'],
              supported_resolutions:  this.supportedResolutions,
              volume_precision: 8,
              full_name:'full_name',
              listed_exchange:'listed_exchange'
            }
            
            symbol_stub.pricescale = 100;
            setTimeout(function() {
              onSymbolResolvedCallback(symbol_stub)
              console.log('Resolved Symbol ', JSON.stringify(symbol_stub));
            }, 0)
            
        
          },
          getBars: (symbolInfo, resolution, from, to, onHistoryCallback, onErrorCallback, firstDataRequest) => {
                console.log('getBars method running');
                console.log('symbolinfo '+JSON.stringify(symbolInfo) + ' resolution '+ resolution + ' from '+ from + ' to '+ to);
            // console.log('function args',arguments)
            // console.log(`Requesting bars between ${new Date(from * 1000).toISOString()} and ${new Date(to * 1000).toISOString()}`)
            var split_symbol = symbolInfo.name.split(/[:/]/)
            if(resolution=='1D'){
              resolution='1440';
            }
            if(resolution=='3D'){
              resolution='4320';
            }
            //sending 2000 default limit
            this.tradeHistory.getBars(symbolInfo,resolution,from,to, firstDataRequest,2000).subscribe((data) => {
              console.log({data})
              if (data.Response && data.Response === 'Error') {
                console.log('CryptoCompare data fetching error :',data.Message)
                onHistoryCallback([], {noData: true})
              }
              if (data.Data.length) {
                var bars = data.Data.map(el => {
                  return {
                    time: el.time * 1000, 
                    low: el.low,
                    high: el.high,
                    open: el.open,
                    close: el.close,
                    volume: el.volumefrom 
                  }
                })
                  if (firstDataRequest) {
                    var lastBar = bars[bars.length - 1]
                    history[symbolInfo.name] = {lastBar: lastBar}
                  }
                  if (bars.length) {
                    onHistoryCallback(bars, {noData: false})
                  } else {
                    onHistoryCallback([], {noData: true})
                  }
              } else {
                onHistoryCallback([], {noData: true})
              }
            })
            
        
          },
          subscribeBars: (symbolInfo, resolution, onRealtimeCallback, subscribeUID, onResetCacheNeededCallback) => {
            console.log('subscribeBars Runnning')
            this.socketService.subscribeBars(symbolInfo, resolution, onRealtimeCallback, subscribeUID, onResetCacheNeededCallback,history)
          },
          unsubscribeBars: subscriberUID => {
            console.log('unsubscribeBars Running')
        
            this.socketService.unsubscribeBars(subscriberUID)
          },
          calculateHistoryDepth:(resolution: ResolutionString, resolutionBack: ResolutionBackValues, intervalBack: number): HistoryDepth | undefined =>{
            console.log('calculate History depth is running ');
            console.log('resolution '+ resolution);
            if (resolution === "1D") {
              return {
                  resolutionBack: 'M',
                  intervalBack: 6
              };
            }
            if(resolution=='3D'){
              return {
                resolutionBack: 'M',
                intervalBack: 6
              };
            }
            if(parseInt(resolution) < 60 ){
              //this.historyDepthReturn.resolutionBack = 'D';
              //this.historyDepthReturn.intervalBack = 1;
              return {resolutionBack: 'D', intervalBack: 1};
            }
            else{
              return undefined;
            }
            
           
          },
          getMarks: (symbolInfo, startDate, endDate, onDataCallback, resolution) => {
            //optional
            console.log('getMarks Running')
          },
          getTimescaleMarks: (symbolInfo, startDate, endDate, onDataCallback, resolution) => {
            //optional
            console.log('getTimeScaleMarks Running')
          },
          getServerTime: cb => {
            console.log('getServerTime Running')
          }
      }
    }

}

```

This file first imports `Types` from `assets/charting_library/charting_library.min.d.ts` which are required to fullfill interface Types of `charting_library`. If you would not import them angular project would not compile because it follows strict type checking.

```typescript
import {
    widget,
    IChartingLibraryWidget,
    ChartingLibraryWidgetOptions,
    LanguageCode,
    Timezone,
    IBasicDataFeed,
    ResolutionString,
    ResolutionBackValues,
    HistoryDepth
} from '../../../assets/charting_library/charting_library.min';
```

Then initialize variables to get & set value from `tradingViewChart` rendered on html.
```typescript
    public _symbol: ChartingLibraryWidgetOptions['symbol'] = 'Coinbase:BTC/USD';
    private _interval: ChartingLibraryWidgetOptions['interval'] = '1';
    private _libraryPath: ChartingLibraryWidgetOptions['library_path'] = '/assets/charting_library/';
    private _chartsStorageUrl: ChartingLibraryWidgetOptions['charts_storage_url'] = 'https://saveload.tradingview.com';
    private _chartsStorageApiVersion: ChartingLibraryWidgetOptions['charts_storage_api_version'] = '1.1';
    private _clientId: ChartingLibraryWidgetOptions['client_id'] = 'tradingview.com';
    private _userId: ChartingLibraryWidgetOptions['user_id'] = 'public_user_id';
    private _fullscreen: ChartingLibraryWidgetOptions['fullscreen'] = false;
    private _autosize: ChartingLibraryWidgetOptions['autosize'] = true;
    private _containerId: ChartingLibraryWidgetOptions['container_id'] = 'tv_chart_container';
    private _tvWidget: IChartingLibraryWidget | null = null;
```

Here `@Input()` is being used to get value from chart at runtime, so these functions will change value of chart at runtime.
```typescript
@Input()
    set symbol(symbol: ChartingLibraryWidgetOptions['symbol']) {
        this._symbol = symbol || this._symbol;
    }

    @Input()
    set interval(interval: ChartingLibraryWidgetOptions['interval']) {
        this._interval = interval || this._interval;
    }

    @Input()
    set libraryPath(libraryPath: ChartingLibraryWidgetOptions['library_path']) {
        this._libraryPath = libraryPath || this._libraryPath;
    }

    @Input()
    set chartsStorageUrl(chartsStorageUrl: ChartingLibraryWidgetOptions['charts_storage_url']) {
        this._chartsStorageUrl = chartsStorageUrl || this._chartsStorageUrl;
    }

    @Input()
    set chartsStorageApiVersion(chartsStorageApiVersion: ChartingLibraryWidgetOptions['charts_storage_api_version']) {
        this._chartsStorageApiVersion = chartsStorageApiVersion || this._chartsStorageApiVersion;
    }

    @Input()
    set clientId(clientId: ChartingLibraryWidgetOptions['client_id']) {
        this._clientId = clientId || this._clientId;
    }

    @Input()
    set userId(userId: ChartingLibraryWidgetOptions['user_id']) {
        this._userId = userId || this._userId;
    }

    @Input()
    set fullscreen(fullscreen: ChartingLibraryWidgetOptions['fullscreen']) {
        this._fullscreen = fullscreen || this._fullscreen;
    }

    @Input()
    set autosize(autosize: ChartingLibraryWidgetOptions['autosize']) {
        this._autosize = autosize || this._autosize;
    }

    @Input()
    set containerId(containerId: ChartingLibraryWidgetOptions['container_id']) {
        this._containerId = containerId || this._containerId;
    }
    
```

LanguageCode is required field in `ChartingLibraryWidgetOptions` so used function `getLanguageFromURL()` to return LanguageCode
```typescript
     getLanguageFromURL(): LanguageCode | null {
      const regex = new RegExp('[\\?&]lang=([^&#]*)');
      const results = regex.exec(location.search);

      return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, ' ')) as LanguageCode;
    }
```

Now `ChartingLibraryWidgetOptions` widgetOptions is being created on component onInit() function.

```typescript
const widgetOptions: ChartingLibraryWidgetOptions = {
            symbol: this._symbol,
            datafeed: this.Datafeed,
            interval: this._interval,
            container_id: this._containerId,
            library_path: this._libraryPath,
            locale: this.getLanguageFromURL() || 'en',
            disabled_features: ['use_localstorage_for_settings'],
            enabled_features: ['study_templates'],
            charts_storage_url: this._chartsStorageUrl,
            charts_storage_api_version: this._chartsStorageApiVersion,
            client_id: this._clientId,
            user_id: this._userId,
            fullscreen: this._fullscreen,
            autosize: this._autosize,
            overrides: {
        "mainSeriesProperties.showCountdown": true,
				"paneProperties.background": "#131722",
				"paneProperties.vertGridProperties.color": "#363c4e",
				"paneProperties.horzGridProperties.color": "#363c4e",
				"symbolWatermarkProperties.transparency": 90,
				"scalesProperties.textColor" : "#AAA",
				"mainSeriesProperties.candleStyle.wickUpColor": '#336854',
				"mainSeriesProperties.candleStyle.wickDownColor": '#7f323f',
			}
        };

```
Now this `widgetOptions` requires Datafeed object to implement `JS API` which has fixed signature and in this signature some methods are required while some are optional. You have to implement required methods and optional depends on you.

Here is the Datafeed Object. Datafeed must of type `IBasicDataFeed` otherwise project wouldn't compile.
`Datafeed:IBasicDataFeed;`

```typescript
this.Datafeed = 
      {
        
        onReady: cb => {
          console.log('Inside on ready');
            setTimeout(() => cb(this.config), 0);
            
          },
          searchSymbols: (userInput, exchange, symbolType, onResultReadyCallback) => {
            console.log('Search Symbols running');
          },
          resolveSymbol: (symbolName, onSymbolResolvedCallback, onResolveErrorCallback) => {
            
            console.log('ResolveSymbol running');
            
            var split_data = symbolName.split(/[:/]/);
            
            var symbol_stub = {
              name: symbolName,
              description: `${split_data[1]}/${split_data[2]}`,
              type: 'crypto',
              session: '24x7',
              timezone: this.timezone,
              ticker: symbolName,
              exchange: split_data[0],
              minmov: 1,
              pricescale: 100000000,
              has_intraday: true,
              intraday_multipliers: ['1', '60'],
              supported_resolutions:  this.supportedResolutions,
              volume_precision: 8,
              full_name:'full_name',
              listed_exchange:'listed_exchange'
            }
            
            symbol_stub.pricescale = 100;
            setTimeout(function() {
              onSymbolResolvedCallback(symbol_stub)
              console.log('Resolved Symbol ', JSON.stringify(symbol_stub));
            }, 0)
            
        
          },
          getBars: (symbolInfo, resolution, from, to, onHistoryCallback, onErrorCallback, firstDataRequest) => {
                console.log('getBars method running');
                console.log('symbolinfo '+JSON.stringify(symbolInfo) + ' resolution '+ resolution + ' from '+ from + ' to '+ to);
            // console.log('function args',arguments)
            // console.log(`Requesting bars between ${new Date(from * 1000).toISOString()} and ${new Date(to * 1000).toISOString()}`)
            var split_symbol = symbolInfo.name.split(/[:/]/)
            if(resolution=='1D'){
              resolution='1440';
            }
            if(resolution=='3D'){
              resolution='4320';
            }
            //sending 2000 default limit
            this.tradeHistory.getBars(symbolInfo,resolution,from,to, firstDataRequest,2000).subscribe((data) => {
              console.log({data})
              if (data.Response && data.Response === 'Error') {
                console.log('CryptoCompare data fetching error :',data.Message)
                onHistoryCallback([], {noData: true})
              }
              if (data.Data.length) {
                var bars = data.Data.map(el => {
                  return {
                    time: el.time * 1000, 
                    low: el.low,
                    high: el.high,
                    open: el.open,
                    close: el.close,
                    volume: el.volumefrom 
                  }
                })
                  if (firstDataRequest) {
                    var lastBar = bars[bars.length - 1]
                    history[symbolInfo.name] = {lastBar: lastBar}
                  }
                  if (bars.length) {
                    onHistoryCallback(bars, {noData: false})
                  } else {
                    onHistoryCallback([], {noData: true})
                  }
              } else {
                onHistoryCallback([], {noData: true})
              }
            })
            
        
          },
          subscribeBars: (symbolInfo, resolution, onRealtimeCallback, subscribeUID, onResetCacheNeededCallback) => {
            console.log('subscribeBars Runnning')
            this.socketService.subscribeBars(symbolInfo, resolution, onRealtimeCallback, subscribeUID, onResetCacheNeededCallback,history)
          },
          unsubscribeBars: subscriberUID => {
            console.log('unsubscribeBars Running')
        
            this.socketService.unsubscribeBars(subscriberUID)
          },
          calculateHistoryDepth:(resolution: ResolutionString, resolutionBack: ResolutionBackValues, intervalBack: number): HistoryDepth | undefined =>{
            console.log('calculate History depth is running ');
            console.log('resolution '+ resolution);
            if (resolution === "1D") {
              return {
                  resolutionBack: 'M',
                  intervalBack: 6
              };
            }
            if(resolution=='3D'){
              return {
                resolutionBack: 'M',
                intervalBack: 6
              };
            }
            if(parseInt(resolution) < 60 ){
              //this.historyDepthReturn.resolutionBack = 'D';
              //this.historyDepthReturn.intervalBack = 1;
              return {resolutionBack: 'D', intervalBack: 1};
            }
            else{
              return undefined;
            }
            
           
          },
          getMarks: (symbolInfo, startDate, endDate, onDataCallback, resolution) => {
            //optional
            console.log('getMarks Running')
          },
          getTimescaleMarks: (symbolInfo, startDate, endDate, onDataCallback, resolution) => {
            //optional
            console.log('getTimeScaleMarks Running')
          },
          getServerTime: cb => {
            console.log('getServerTime Running')
          }
      }
```

This Datafeed should be called on `ngOnInit()`. So for calling this I have used `this.loadTradingViewData();`.



After updating all these files your angular project will be showing tradingViewChart of BTC/USD from COINBASE exchange :+1:

### Final view after all the above code :+1:

![tradingViewChart](https://user-images.githubusercontent.com/23319830/46637085-375a9f00-cb78-11e8-96c2-d1ad7a727119.png)

## Now live update of chart left from sockets `API`.

### 1. Create socket service to fetch data from [CryptoCompare's socket API](https://www.cryptocompare.com/api/#-api-web-socket-subscribe-)

`ng generate service services/socket`

### 2. Update `src/app/services/socket.service.ts` 

```typescript
import { Injectable } from '@angular/core';
import * as socketIo from 'socket.io-client';

const SERVER_URL = 'wss://streamer.cryptocompare.com';
@Injectable()
export class SocketService {
  private socket;
  private _subscriptions=[];
  constructor() { 
    this.socket = socketIo(SERVER_URL);
    this.socket.on('connect', () => {
      console.log('=====Socket connected=======')
    })
    this.socket.on('disconnect', (e) => {
      console.log('=====Socket disconnected:', e +' =======')
    })
    this.socket.on('error', err => {
      console.log('====socket error', err+' =======')
    })
    this.socket.on('m', (e) => {
      // here we get all events the CryptoCompare connection has subscribed to
      // we need to send this new data to our subscribed charts
      const _data= e.split('~')
      if (_data[0] === "3") {
       // console.log('Websocket Snapshot load event complete')
       return
      }
      const data = {
       sub_type: parseInt(_data[0],10),
       exchange: _data[1],
       to_sym: _data[2],
       from_sym: _data[3],
       trade_id: _data[5],
       ts: parseInt(_data[6],10),
       volume: parseFloat(_data[7]),
       price: parseFloat(_data[8])
      }
      
      const channelString = `${data.sub_type}~${data.exchange}~${data.to_sym}~${data.from_sym}`
      
      const sub = this._subscriptions.find(e => e.channelString === channelString)
      
      if (sub) {
       // disregard the initial catchup snapshot of trades for already closed candles
       if (data.ts < sub.lastBar.time / 1000) {
         return
        }
       
     var _lastBar = this.updateBar(data, sub)
     
     // send the most recent bar back to TV's realtimeUpdate callback
       sub.listener(_lastBar)
       // update our own record of lastBar
       sub.lastBar = _lastBar
      }
     })
  }

  public initSocket(): void {
    
    
  }

  // Take a single trade, and subscription record, return updated bar
updateBar(data, sub) {
  //alert('update bar from socket service ');
  var lastBar = sub.lastBar
  let resolution = sub.resolution
  if (resolution.includes('D')) {
   // 1 day in minutes === 1440
   resolution = 1440
  } else if (resolution.includes('W')) {
   // 1 week in minutes === 10080
   resolution = 10080
  }
 var coeff = resolution * 60
  // console.log({coeff})
  var rounded = Math.floor(data.ts / coeff) * coeff
  var lastBarSec = lastBar.time / 1000
  var _lastBar
  
 if (rounded > lastBarSec) {
   // create a new candle, use last close as open **PERSONAL CHOICE**
   _lastBar = {
    time: rounded * 1000,
    open: lastBar.close,
    high: lastBar.close,
    low: lastBar.close,
    close: data.price,
    volume: data.volume
   }
   
  } else {
   // update lastBar candle!
   if (data.price < lastBar.low) {
    lastBar.low = data.price
   } else if (data.price > lastBar.high) {
    lastBar.high = data.price
   }
   
   lastBar.volume += data.volume
   lastBar.close = data.price
   _lastBar = lastBar
  }
  //console.log('_lastBar '+JSON.stringify(_lastBar));
  return _lastBar
 }
 
 // takes symbolInfo object as input and creates the subscription string to send to CryptoCompare
 createChannelString(symbolInfo) {
   var channel = symbolInfo.name.split(/[:/]/)
   const exchange = channel[0] === 'GDAX' ? 'Coinbase' : channel[0]
   const to = channel[2]
   const from = channel[1]
  // subscribe to the CryptoCompare trade channel for the pair and exchange
   return `0~${exchange}~${from}~${to}`
 }
 channelString:string;
  subscribeBars(symbolInfo, resolution, updateCb, uid, resetCache,history) {
    //alert('SubscribeBars from service');
    this.channelString = this.createChannelString(symbolInfo)
    this.socket.emit('SubAdd', {subs: [this.channelString]})
    let a=this.channelString;
    var newSub = {
      "channelString":a,
    uid,
    resolution,
    symbolInfo,
    lastBar: history[symbolInfo.name].lastBar,
    listener: updateCb,
    }
    //console.log('newSub '+JSON.stringify(newSub));
  this._subscriptions.push(newSub)
  }

  unsubscribeBars(uid) {
    //alert('unsubscribe bar from socket service ');
    var subIndex = this._subscriptions.findIndex(e => e.uid === uid)
    if (subIndex === -1) {
     //console.log("No subscription found for ",uid)
     return
    }
    var sub = this._subscriptions[subIndex]
    this.socket.emit('SubRemove', {subs: [sub.channelString]})
    this._subscriptions.splice(subIndex, 1)
   }
  

}

```

This service's `subscribeBars(symbolInfo, resolution, updateCb, uid, resetCache,history)` is being used in `trading-view-chart.ts`'s Datafeed method `subscribeBars()`
```typescript
subscribeBars: (symbolInfo, resolution, onRealtimeCallback, subscribeUID, onResetCacheNeededCallback) => {
            console.log('subscribeBars Runnning')
            this.socketService.subscribeBars(symbolInfo, resolution, onRealtimeCallback, subscribeUID, onResetCacheNeededCallback,history)
          }
```

Similarly `unsubscribeBars(uid)` is also being used in `trading-view-chart.ts`'s Datafeed method `unsubscribeBars()` .

Now after implementing all these your chart will be updating live from socket.

# ALL DONE! @alokshakya :+1:


# BitcoinEtherium Live Pricing

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 1.7.2.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `-prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
