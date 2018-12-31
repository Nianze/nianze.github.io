---
title: "Sound of Trade"
date: 2018-12-16
categories:
- article
- coding
tags:
- music
- technique
slug: Use trading market data to create sound
autoThumbnailImage: true
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-12/16.gif
draft: true
---

<p id="demo"></p>
<p id="query"></p>

<div id="wavesurfer">
    <div id="waveform"></div>    
    <button id="waveButton" onclick="load()">load music</button>
    <script src="https://unpkg.com/wavesurfer.js/dist/wavesurfer.js"></script>
    <script src="/js/trading-audio/audio.js"></script>
</div>

<div id="proceduralSound">
    <p>
        <canvas id="proceduralCanvas" width="640" height="360"></canvas>
    </p>
    <script src="/js/trading-audio/init.js"></script>
    <script src="/js/trading-audio/proceduralSound.js"></script>
    <script> 
        var sample = new ProceduralSound(); 
    </script>
    <button id="scriptButton" onclick="sample.togglePlayback()">Shoot</button>
</div>