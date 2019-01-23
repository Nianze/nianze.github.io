import { ProceduralSound } from './genSound.js';

function Chart(param) {
    this.feed = [];
    this.data = [];
    this.isPlaying = false;
    this.ticker = "";
    this.timeScheduler;

    this.param = param;
    this.tradeBeat = new ProceduralSound(param);
    this.parseDate = d3.timeParse("%Y-%m-%d");

    this.volumeScale;
    this.valueScale;

    this.x;
    this.y;
    this.yVolume;
    this.ohlc;
    this.sma0;
    this.sma0Calculator;
    this.sma1;
    this.sma1Calculator;
    this.volume;
    this.xAxis;
    this.yAxis;
    this.volumeAxis;
    this.timeAnnotation;
    this.ohlcAnnotation;
    this.volumeAnnotation;
    this.crosshair;
    this.svg;
    this.coordsText;

    this.onLoaded();
}

Chart.prototype.onLoaded = function () {
    let margin = { top: 20, right: 20, bottom: 30, left: 50 },
        width = 640 - margin.left - margin.right,
        height = 360 - margin.top - margin.bottom;

    this.x = techan.scale.financetime()
        .range([0, width]);

    this.y = d3.scaleLinear()
        .range([height, 0]);

    let y = this.y;
    let x = this.x;

    this.yVolume = d3.scaleLinear()
        .range([y(0), y(0.2)]);

    this.ohlc = techan.plot.ohlc()
        .xScale(x)
        .yScale(y);

    this.sma0 = techan.plot.sma()
        .xScale(x)
        .yScale(y);

    this.sma0Calculator = techan.indicator.sma()
        .period(10);

    this.sma1 = techan.plot.sma()
        .xScale(x)
        .yScale(y);

    this.sma1Calculator = techan.indicator.sma()
        .period(20);

    this.volume = techan.plot.volume()
        .accessor(this.ohlc.accessor())   // Set the accessor to a ohlc accessor so we get highlighted bars
        .xScale(x)
        .yScale(this.yVolume);

    this.xAxis = d3.axisBottom(x);

    this.yAxis = d3.axisLeft(y);

    this.volumeAxis = d3.axisRight(this.yVolume)
        .ticks(3)
        .tickFormat(d3.format(",.3s"));

    this.timeAnnotation = techan.plot.axisannotation()
        .axis(this.xAxis)
        .orient('bottom')
        .format(d3.timeFormat('%Y-%m-%d'))
        .width(65)
        .translate([0, height]);

    this.ohlcAnnotation = techan.plot.axisannotation()
        .axis(this.yAxis)
        .orient('left')
        .format(d3.format(',.2f'));

    this.volumeAnnotation = techan.plot.axisannotation()
        .axis(this.volumeAxis)
        .orient('right')
        .width(35);

    let that = this;
    this.crosshair = techan.plot.crosshair()
        .xScale(x)
        .yScale(y)
        .xAnnotation(this.timeAnnotation)
        .yAnnotation([this.ohlcAnnotation, this.volumeAnnotation])
        .on("move", (coords) => {
            that.coordsText.text(
                that.timeAnnotation.format()(coords.x) + ", " + that.ohlcAnnotation.format()(coords.y)
            );
        });

    this.svg = d3.select("#chart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    let defs = this.svg.append("defs");

    defs.append("clipPath")
        .attr("id", "ohlcClip")
        .append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", height);

    this.svg = this.svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    let ohlcSelection = this.svg.append("g")
        .attr("class", "ohlc")
        .attr("transform", "translate(0,0)");

    ohlcSelection.append("g")
        .attr("class", "volume")
        .attr("clip-path", "url(#ohlcClip)");

    ohlcSelection.append("g")
        .attr("class", "candlestick")
        .attr("clip-path", "url(#ohlcClip)");

    ohlcSelection.append("g")
        .attr("class", "indicator sma ma-0")
        .attr("clip-path", "url(#ohlcClip)");

    ohlcSelection.append("g")
        .attr("class", "indicator sma ma-1")
        .attr("clip-path", "url(#ohlcClip)");

    this.svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")");

    this.svg.append("g")
        .attr("class", "y axis")
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Price ($)");

    this.svg.append("g")
        .attr("class", "volume axis");

    this.svg.append('g')
        .attr("class", "crosshair ohlc");

    this.coordsText = this.svg.append('text')
        .style("text-anchor", "end")
        .attr("class", "coords")
        .attr("x", width - 5)
        .attr("y", 15);
}

Chart.prototype.playPause = function () {
    this.isPlaying = !this.isPlaying;
    if (this.isPlaying) {
        let data = this.data;
        let feed = this.feed;
        if (data.length < feed.length) {
            // Simulate a daily feed
            data = feed.slice(0, data.length + 1);
            this.redraw();
        }
        let button = document.getElementById('togglePlay');
        button.innerHTML = '<i class="fa fa-pause"></i>';
    } else {
        clearTimeout(this.timeScheduler);
        let button = document.getElementById('togglePlay');
        button.innerHTML = '<i class="fa fa-play"></i>';
    }
}

Chart.prototype.setScale = function (feed) {
    var maxVol = d3.max(feed, d => d.volume);
    var minVol = d3.min(feed, d => d.volume);
    this.volumeScale = d3.scaleLinear()
        .domain([minVol, maxVol])
        .range([this.param.MAX_INTERVAL_TIME, this.param.MIN_INTERVAL_TIME]);
    var maxVal = d3.max(feed, d => d.high);
    var minVal = d3.min(feed, d => d.low);
    this.valueScale = d3.scaleLinear()
        .domain([minVal, maxVal])
        .range([this.param.LOW_FREQ, this.param.HIGH_FREQ]);
}

// draw chart with techanJS
Chart.prototype.redraw = function () {
    var accessor = this.ohlc.accessor();
    var data = this.data;
    var that = this;
    this.x.domain(data.map(accessor.d));
    // Show only 150 points on the plot
    this.x.zoomable().domain([data.length - 150, data.length]);
    // Update y scale min max, only on viewable zoomable.domain()
    this.y.domain(techan.scale.plot.ohlc(data.slice(data.length - 130, data.length)).domain());
    this.yVolume.domain(techan.scale.plot.volume(data.slice(data.length - 130, data.length)).domain());
    // Setup a transition for all that support
    this.svg.each(function () {
        var selection = d3.select(this);
        selection.select('g.x.axis').call(that.xAxis);
        selection.select('g.y.axis').call(that.yAxis);
        selection.select("g.volume.axis").call(that.volumeAxis);
        selection.select("g.candlestick").datum(data).call(that.ohlc);
        selection.select("g.sma.ma-0").datum(that.sma0Calculator(data)).call(that.sma0);
        selection.select("g.sma.ma-1").datum(that.sma1Calculator(data)).call(that.sma1);
        selection.select("g.volume").datum(data).call(that.volume);
        that.svg.select("g.crosshair.ohlc").call(that.crosshair);
    });
    if (!this.isPlaying) return;
    var latest = data[data.length - 1];
    this.tradeBeat.beatOnce(this.valueScale(latest.open),
                            this.valueScale(latest.close), 
                            this.volumeScale(latest.volume));
    // Set next timer expiry
    this.timeScheduler = setTimeout(() => {
        if (data.length < that.feed.length) {
            // Simulate a daily feed
            that.data = that.feed.slice(0, data.length + 1);
            that.redraw();
        }
    }, that.volumeScale(latest.volume));
}

export {
    Chart
};