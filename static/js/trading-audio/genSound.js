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

function Envelope(param) {
    this.oscillator = context.createOscillator();
    this.node = context.createGain();
    this.node.gain.value = 0;

    this.oscillator.connect(this.node);
    this.oscillator.start(0);
    
    this.filter = context.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.Q.value = 1;
    //this.filter.frequency.value = 800;
    this.MIN_INTERVAL_TIME = param.MIN_INTERVAL_TIME;
    this.MAX_INTERVAL_TIME = param.MAX_INTERVAL_TIME;

    this.node.connect(this.filter);
}

Envelope.prototype.addEventToQueue = function (open, close, volume) {
    this.oscillator.frequency.value = close;
    this.oscillator.type = close > open ? 'triangle' : 'sine';
    let scale = d3.scaleLinear()
                .domain([this.MIN_INTERVAL_TIME, this.MAX_INTERVAL_TIME])
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
function ProceduralSound(param) {
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

    this.soundParam = param;

    this.onLoaded();
}

ProceduralSound.prototype.onLoaded = function () {
    let gainMaster = context.createGain();
    gainMaster.gain.value = 0.8;
    
    // Initialize multiple voices.  
    for (let i = 0; i < this.VOICE_COUNT; i++) {
        let voice = new Envelope(this.soundParam);
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

export {
    ProceduralSound
};