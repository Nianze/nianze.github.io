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

<div>
    <div id="chart"></div>    
    <link rel="stylesheet" type="text/css" href="/css/techan.css" />
    <script src="http://d3js.org/d3.v4.min.js"></script>
    <script src="http://techanjs.org/techan.min.js"></script>
    <script src="/js/trading-audio/chart.js"></script>
</div>

<div id="proceduralSound">
    <p>
        <canvas id="proceduralCanvas" width="640" height="360"></canvas>
    </p>
    <script src="/js/trading-audio/proceduralSound.js"></script>
    <script> var sample = new ProceduralSound(); </script>
    <button id="scriptButton" onclick="sample.togglePlayback()">Shoot</button>
</div>