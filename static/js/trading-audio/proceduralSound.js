var VOICE_COUNT = 10;
var WIDTH = 640;
var HEIGHT = 360;

var SMOOTHING = 0.8;
var FFT_SIZE = 2048;

// Start off by initializing a new context.
var context = new (window.AudioContext || window.webkitAudioContext)();

if (!context.createGain)
    context.createGain = context.createGainNode;
if (!context.createDelay)
    context.createDelay = context.createDelayNode;
if (!context.createScriptProcessor)
    context.createScriptProcessor = context.createJavaScriptNode;

// shim layer with setTimeout fallback
window.requestAnimFrame = (function(){
return  window.requestAnimationFrame       || 
  window.webkitRequestAnimationFrame || 
  window.mozRequestAnimationFrame    || 
  window.oRequestAnimationFrame      || 
  window.msRequestAnimationFrame     || 
  function( callback ){
  window.setTimeout(callback, 1000 / 60);
};
})();

// sound generator
function WhiteNoiseGenerated(callback) {  
    // Generate a 5 second white noise buffer.  
    var lengthInSamples = 5 * context.sampleRate;  
    var buffer = context.createBuffer(1, lengthInSamples, context.sampleRate);  
    var data = buffer.getChannelData(0);  
    for (var i = 0; i < lengthInSamples; i++) {    
        data[i] = ((Math.random() * 2) - 1);  
    }

    // Create a source node from the buffer.  
    this.node = context.createBufferSource();  
    this.node.buffer = buffer;  
    this.node.loop = true;  
    this.node.start(0);
}

WhiteNoiseGenerated.prototype.connect = function(dest) {
  this.node.connect(dest);
};

function Envelope() {
    this.node = context.createGain();
    this.node.gain.value = 0;
}

Envelope.prototype.addEventToQueue = function() {
    this.node.gain.linearRampToValueAtTime(0, context.currentTime);  
    this.node.gain.linearRampToValueAtTime(1, context.currentTime + 0.001);  
    this.node.gain.linearRampToValueAtTime(0.3, context.currentTime + 0.101);  
    this.node.gain.linearRampToValueAtTime(0, context.currentTime + 0.500);
};

Envelope.prototype.connect = function(dest) {
  this.node.connect(dest);
};

// procedural sound
function ProceduralSound() {
    this.voices = [];  
    this.voiceIndex = 0;  
    this.noise = new WhiteNoiseGenerated();

    this.analyser = context.createAnalyser();
    this.freqs = new Uint8Array(this.analyser.frequencyBinCount);
    this.times = new Uint8Array(this.analyser.frequencyBinCount);    
    
    this.onLoaded();
}

ProceduralSound.prototype.onLoaded = function() {
    var filter = context.createBiquadFilter();  
    filter.type = 'lowpass';
    filter.Q.value = 1; 
    filter.frequency.value = 800;  

    // Initialize multiple voices.  
    for (var i = 0; i < VOICE_COUNT; i++) {    
        var voice = new Envelope();    
        this.noise.connect(voice.node);    
        voice.connect(filter);    
        this.voices.push(voice);
    }

    var gainMaster = context.createGain();
    gainMaster.gain.value = 5;
    filter.connect(gainMaster);
    //gainMaster.connect(context.destination);

    this.analyser.minDecibels = -140;
    this.analyser.maxDecibels = 0;
    gainMaster.connect(this.analyser);
    this.analyser.connect(context.destination);
    requestAnimFrame(this.draw.bind(this));
};

ProceduralSound.prototype.draw = function() {
  this.analyser.smoothingTimeConstant = SMOOTHING;
  this.analyser.fftSize = FFT_SIZE;

  // Get the frequency data from the currently playing music
  this.analyser.getByteFrequencyData(this.freqs);
  this.analyser.getByteTimeDomainData(this.times);

  var width = Math.floor(1/this.freqs.length, 10);

  var canvas = document.getElementById('proceduralCanvas');
  var drawContext = canvas.getContext('2d');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  // Draw the frequency domain chart.
  for (var i = 0; i < this.analyser.frequencyBinCount; i++) {
    var value = this.freqs[i];
    var percent = value / 256;
    var height = HEIGHT * percent;
    var offset = HEIGHT - height - 1;
    var barWidth = WIDTH/this.analyser.frequencyBinCount;
    var hue = i/this.analyser.frequencyBinCount * 360;
    drawContext.fillStyle = 'hsl(' + hue + ', 100%, 50%)';
    drawContext.fillRect(i * barWidth, offset, barWidth, height);
  }

  // Draw the time domain chart.
  for (var i = 0; i < this.analyser.frequencyBinCount; i++) {
    var value = this.times[i];
    var percent = value / 256;
    var height = HEIGHT * percent;
    var offset = HEIGHT - height - 1;
    var barWidth = WIDTH/this.analyser.frequencyBinCount;
    drawContext.fillStyle = 'gray';
    drawContext.fillRect(i * barWidth, offset, 1, 2);
  }

  requestAnimFrame(this.draw.bind(this));
}

ProceduralSound.prototype.togglePlayback = function() {
    this.voiceIndex = (this.voiceIndex + 1) % VOICE_COUNT;
    this.voices[this.voiceIndex].addEventToQueue();
};