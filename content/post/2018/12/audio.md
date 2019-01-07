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

> TODO: more sound, more interaction.

<div>
    <link rel="stylesheet" type="text/css" href="/css/techan.css" />
    <script src="http://d3js.org/d3.v4.min.js"></script>
    <script src="/js/trading-audio/techan.min.js"></script>
    <div id="operation">
        <select id="tickers">
            <option value="FB">Facebook</option>
            <option value="GOOG">Google</option>
            <option value="AAPL">Apple</option>
            <option value="IBM">IBM</option>
        </select>
        <button id="scriptButton" onclick="begin()">Begin</button>
    </div>
    <div id="chart" hidden></div>
    <div><canvas id="proceduralCanvas" hidden></canvas></div>
    <script src="/js/trading-audio/tradeBeats.js"></script>    
</div>