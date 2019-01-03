---
title: "Trade Beats"
date: 2018-12-16
categories:
- article
- coding
tags:
- music
- technique
slug: Use trading market data to create beat sounds
autoThumbnailImage: true
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-12/16.gif
draft: true
---

<div>
    <div id="chart"></div>    
    <p>
        <canvas id="proceduralCanvas" width="640" height="360"></canvas>
    </p>    
    <link rel="stylesheet" type="text/css" href="/css/techan.css" />
    <script src="http://d3js.org/d3.v4.min.js"></script>
    <script src="http://techanjs.org/techan.min.js"></script>
    <script src="/js/trading-audio/chart.js"></script>
    <button id="scriptButton" onclick="begin()">Begin</button>
</div>