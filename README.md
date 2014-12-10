# Angular Antacid

#### Antacid is an Angular provider that collects and logs information about $digest performance.

## Background

Most end-user performance problems in Angular manifest as $digest cycles that take too long or happen too frequently. Antacid collects basic information about UI interactions and when $digest happens, and how long it takes to complete, and can then report that info to the console or as User Timings for Google Analytics. You can use this information to identify and target frequency optimizations, like debounce, or long-running redraws that could be better optimized.

## Options

Antacid is an Angular provider that can be configured in `app.config` and injected during `app.run`

```js
angular.module( "myModule", [ "antacid" ] )
.config( [ "AntacidProvider" ] function ( AntacidProvider ) {
	// example options
    AntacidProvider.options.when.long = 75;
    AntacidProvider.options.to.googleAnalytics = false;
} )
.run( function ( Antacid )
{
	Antacid.start();
} );

```

Below are current options and their defaults, which can be configured as shown above:

### Track When

`when.long = { min: 75, max: 60000 };`

Track when $digest takes more than `min` ms and less than `max` ms

`when.frequent = { perMs: 1000, hits: 20 };`

Track when $digest happens at least `hits` times in `perMs` ms. `perMs` also controls how often this message can be logged, for example, as of then 21st hit, Antacid will wait for the 40th.

```js
when.events = [
    "ontouchstart" in window ? "touchstart" : "mousedown",
    "input"
];
```

These events will be globally recorded. "touchstart" and "mousedown" will be combined into an even called "touchstart/mousedown" to simplify groupings in reporting.

### Track To

`to.googleAnalytics = true;`

When true, sends user timings to Google Analytics. You need to install and configure Google Analytics separately to use this

`to.console = false;`

Logs antacid to console

### Track With
`with.dataAttributeValues = false;`

Whether to include data-* attribute values in the tracking data. The default is false because these often contain data that varies by user which cause the events to not group well in Google Analytics.


## Methods

`track( name )`

Adds a named item to the list that will be reported when the next $digest completes. This is good for logging events that cause a $digest that are not triggered by a user, such as timed events or incoming WebSocket data.
