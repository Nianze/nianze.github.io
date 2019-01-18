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
---

What would it sound like if trading market data speaks? 
<!--more-->

<div>
    <link rel="stylesheet" type="text/css" href="/css/techan.css" />
    <link rel="stylesheet" type="text/css" href="/css/awesomplete.css" />
    <script src="http://d3js.org/d3.v4.min.js"></script>
    <script src="/js/trading-audio/techan.min.js"></script>
    <script src="/js/trading-audio/awesomplete.min.js"></script>
    <div id="operation">
        <input id="tickers" placeholder="Enter a ticker name" />
        <button id="scriptButton" hidden>Play/pause</button>
    </div>
    <div></div>
    <div id="chart" hidden></div>
    <div><canvas id="proceduralCanvas" hidden></canvas></div>
    <script src="/js/trading-audio/tradeBeats.js"></script>    
</div>

> TODO: more sound, more interaction
> auto complete for input tickers; play control bar and pause; more complicated oscillator generator and sound parameter control; multi-tickers play simultaneously; style in dark mode; more animation.