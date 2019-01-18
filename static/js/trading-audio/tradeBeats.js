// Start off by initializing a new context.
let context = new (window.AudioContext || window.webkitAudioContext)();

if (!context.createGain)
    context.createGain = context.createGainNode;
if (!context.createDelay)
    context.createDelay = context.createDelayNode;
if (!context.createScriptProcessor)
    context.createScriptProcessor = context.createJavaScriptNode;

// shim layer with setTimeout fallback
window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (callback) {
            window.setTimeout(callback, 1000 / 60);
        };
})();

// sound generator
function WhiteNoiseGenerated(callback) {
    // Generate a 5 second white noise buffer.  
    let lengthInSamples = 5 * context.sampleRate;
    let buffer = context.createBuffer(1, lengthInSamples, context.sampleRate);
    let data = buffer.getChannelData(0);
    for (let i = 0; i < lengthInSamples; i++) {
        data[i] = ((Math.random() * 2) - 1);
    }

    // Create a source node from the buffer.  
    this.node = context.createBufferSource();
    this.node.buffer = buffer;
    this.node.loop = true;
    this.node.start(0);
}

WhiteNoiseGenerated.prototype.connect = function (dest) {
    this.node.connect(dest);
};

function Envelope() {
    this.oscillator = context.createOscillator();
    this.node = context.createGain();
    this.node.gain.value = 0;

    this.oscillator.connect(this.node);
    this.oscillator.start(0);
    
    this.filter = context.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.Q.value = 1;
    //this.filter.frequency.value = 800;
    this.node.connect(this.filter);
}

Envelope.prototype.addEventToQueue = function (open, close, volume) {
    this.oscillator.frequency.value = close;
    this.oscillator.type = close > open ? 'triangle' : 'sine';
    let scale = d3.scaleLinear()
                .domain([chart.MIN_INTERVAL_TIME, chart.MAX_INTERVAL_TIME])
                .range([10, 1000]);
    this.filter.frequency.value = scale(volume);
    this.node.gain.linearRampToValueAtTime(0, context.currentTime);
    this.node.gain.linearRampToValueAtTime(1, context.currentTime + 0.01);
    this.node.gain.linearRampToValueAtTime(0.3, context.currentTime + 0.101);
    this.node.gain.linearRampToValueAtTime(0, context.currentTime + 0.200);
};

Envelope.prototype.connect = function (dest) {
    this.node.connect(dest);
};

// procedural sound
function ProceduralSound() {
    this.voices = [];
    this.voiceIndex = 0;
    //this.noise = new WhiteNoiseGenerated();

    this.analyser = context.createAnalyser();
    this.freqs = new Uint8Array(this.analyser.frequencyBinCount);
    this.times = new Uint8Array(this.analyser.frequencyBinCount);

    this.canvasWidth = 640;
    this.canvasHeight = 360;
    this.SMOOTHING = 0.8;
    this.FFT_SIZE = 2048;
    this.VOICE_COUNT = 10;

    this.onLoaded();
}

ProceduralSound.prototype.onLoaded = function () {
    let gainMaster = context.createGain();
    gainMaster.gain.value = 0.8;
    
    // Initialize multiple voices.  
    for (let i = 0; i < this.VOICE_COUNT; i++) {
        let voice = new Envelope();
        //this.noise.connect(voice.node);
        //this.oscillator.connect(voice.node);
        //voice.connect(filter);
        voice.connect(gainMaster);
        this.voices.push(voice);
    }

    //filter.connect(gainMaster);
    //gainMaster.connect(context.destination);

    this.analyser.minDecibels = -140;
    this.analyser.maxDecibels = 0;
    gainMaster.connect(this.analyser);
    this.analyser.connect(context.destination);
    requestAnimFrame(this.draw.bind(this));
};

ProceduralSound.prototype.draw = function () {
    this.analyser.smoothingTimeConstant = this.SMOOTHING;
    this.analyser.fftSize = this.FFT_SIZE;

    // Get the frequency data from the currently playing music
    this.analyser.getByteFrequencyData(this.freqs);
    this.analyser.getByteTimeDomainData(this.times);

    let width = Math.floor(1 / this.freqs.length, 10);

    let canvas = document.getElementById('proceduralCanvas');
    let drawContext = canvas.getContext('2d');
    canvas.width = this.canvasWidth;
    canvas.height = this.canvasHeight;
    // Draw the frequency domain chart.
    for (let i = 0; i < this.analyser.frequencyBinCount; i++) {
        let value = this.freqs[i];
        let percent = value / 256;
        let height = this.canvasHeight * percent;
        let offset = this.canvasHeight - height - 1;
        let barWidth = this.canvasWidth / this.analyser.frequencyBinCount;
        let hue = i / this.analyser.frequencyBinCount * 360;
        drawContext.fillStyle = 'hsl(' + hue + ', 100%, 50%)';
        drawContext.fillRect(i * barWidth, offset, barWidth, height);
    }

    // Draw the time domain chart.
    for (let i = 0; i < this.analyser.frequencyBinCount; i++) {
        let value = this.times[i];
        let percent = value / 256;
        let height = this.canvasHeight * percent;
        let offset = this.canvasHeight - height - 1;
        let barWidth = this.canvasWidth / this.analyser.frequencyBinCount;
        drawContext.fillStyle = 'gray';
        drawContext.fillRect(i * barWidth, offset, 1, 2);
    }

    requestAnimFrame(this.draw.bind(this));
}

ProceduralSound.prototype.beatOnce = function (open, close, volume) {
    this.voiceIndex = (this.voiceIndex + 1) % this.VOICE_COUNT;
    this.voices[this.voiceIndex].addEventToQueue(open, close, volume);
};

/////////////////////////

function Chart() {
    this.feed = [];
    this.data = [];
    this.isPlaying = false;
    this.ticker = "";
    this.timeScheduler;
    this.tradeBeat = new ProceduralSound();
    this.parseDate = d3.timeParse("%Y-%m-%d");

    this.MAX_INTERVAL_TIME = 100;
    this.MIN_INTERVAL_TIME = 10;
    this.LOW_FREQ = 100;
    this.HIGH_FREQ = 2000;
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
        .range([this.MAX_INTERVAL_TIME, this.MIN_INTERVAL_TIME]);
    var maxVal = d3.max(feed, d => d.high);
    var minVal = d3.min(feed, d => d.low);
    this.valueScale = d3.scaleLinear()
        .domain([minVal, maxVal])
        .range([this.LOW_FREQ, this.HIGH_FREQ]);
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

var chart = new Chart();
var init = false;

function begin() {
    var request_params = {
        "function": "TIME_SERIES_DAILY",
        "symbol": chart.ticker,
        "outputsize": "full",
        "datatype": "json",
        "apikey": "I7JY3EYLKK5LRI8L"
    };
    var base_url = "https://www.alphavantage.co/query";
    var params = Object.keys(request_params)
        .map(key => key + '=' + request_params[key])
        .join('&');
    var queryUrl = base_url + '?' + params;

    fetch(queryUrl)
        .then(resp => resp.json())
        .then(rawData => {
            chart.feed = Object.entries(rawData["Time Series (Daily)"])
                .map(([date, obj]) => ({
                    date: chart.parseDate(date),
                    open: +obj["1. open"],
                    high: +obj["2. high"],
                    low: +obj["3. low"],
                    close: +obj["4. close"],
                    volume: +obj["5. volume"]
                }))
                .reverse();
            chart.data = chart.feed.slice(0, 150);
            chart.isPlaying = false;
            chart.setScale(chart.feed);
            chart.redraw();
            if (!init) {
                let button = document.getElementById('togglePlay');
                button.addEventListener('click', () => chart.playPause());
                button.hidden = false;
                document.getElementById('chart').hidden = false;
                document.getElementById('proceduralCanvas').hidden = false;
                init = true;
            }
        })
        .catch(error => { document.getElementById('chart').innerHTML = error; });
}

(function main(){
    var ticker = document.getElementById('ticker-input');
    var comboplete_ticker = new Awesomplete(ticker, {
        minChars: 0,
    });
    ticker.addEventListener("awesomplete-select", function(e) {
        if (chart.isPlaying) {
            chart.playPause();
        }
        chart.feed = [];
        chart.data = [];
        chart.ticker = e.text.value;
        begin();
    }, false);    
    document.getElementById("ticker-btn")
            .addEventListener("click", function() {
        if (comboplete_ticker.ul.childNodes.length === 0) {
            comboplete_ticker.minChars = 0;
            comboplete_ticker.evaluate();
        }
        else if (comboplete_ticker.ul.hasAttribute('hidden')) {
            comboplete_ticker.open();
        }
        else {
            comboplete_ticker.close();
        }
    });

    var exchange = document.getElementById('exchange-input');
    var comboplete_exchange = new Awesomplete(exchange, {
        minChars: 0,
        list: [
            { label: "NYSE American", value: "AMEX" },
            { label: "NASDAQ", value: "NASDAQ" },
            { label: "National Stock Exchange of India", value: "NSE" },
            { label: "New York Stock Exchange", value: "NYSE" },
            { label: "Six Swiss Exchange", value: "SWX" },
            { label: "Toronto Stock Exchange", value: "TSX" },
        ]
    });
    exchange.addEventListener("awesomplete-select", function(e) {
            var url = 'https://dumbstockapi.com/stock?format=tickers-only&exchange=';
            url += e.text.value;
            fetch(url)
                .then(resp => resp.json())
                .then(rawData => {
                    ticker.innerText = "";
                    comboplete_ticker.list = rawData;
                })
                .catch(error => { document.getElementById('chart').innerHTML = error; });
    }, false);
    document.getElementById("exchange-btn")
            .addEventListener("click", function() {
        if (comboplete_exchange.ul.childNodes.length === 0) {
            comboplete_exchange.minChars = 0;
            comboplete_exchange.evaluate();
        }
        else if (comboplete_exchange.ul.hasAttribute('hidden')) {
            comboplete_exchange.open();
        }
        else {
            comboplete_exchange.close();
        }
    });
})();