---
title: "Trade Beats"
date: 2018-12-16
categories:
- technology
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

#### A little background

This little project tries to do one thing for fun: to transform the trading market history data into some sords of sound.

The techniques involve some basic use of web audio API and D3.js. All the ticker names are collected from [dumb stock api](https://dumbstockapi.com/), while all the trading history data comes from [ALPHA VANTAGE](https://www.alphavantage.co/). Since support for web audio API is different by different browsers, it is highly suggested to try this demo with Chrome.

<div>
    <link rel="stylesheet" type="text/css" href="/css/trading-audio/techan.css" />
    <link rel="stylesheet" type="text/css" href="/css/trading-audio/awesomplete.css" />
    <link rel="stylesheet" type="text/css" href="/css/trading-audio/style.css" />
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.3.0/css/font-awesome.min.css">
    <script src="http://d3js.org/d3.v4.min.js"></script>
    <script src="/js/trading-audio/techan.min.js"></script>
    <script src="/js/trading-audio/awesomplete.min.js"></script>
    <script src="/js/trading-audio/main.js" type="module"></script>
    <div>-</div>
</div>

<div>
    <section id="combobox">
            <label id="exchange-combobox">
                <input id="exchange-input" placeholder="Select an exchange" class="dropdown-input" />
                <button id="exchange-btn" class="dropdown-btn" type="button"><span class="caret"></span></button>
            </label>
            <label id="ticker-combobox">
                <input id="ticker-input" placeholder="Enter a ticker name" class="dropdown-input" />
                <button id="ticker-btn" class="dropdown-btn" type="button"><span class="caret"></span></button>
            </label>
            <button id="togglePlay" hidden><i class="fa fa-play"></i></button>
    </section>
<div>

<div></div>

>Feel free to choose any company interesting to you by typing/selecting corresponding stock exchange name as well as company security ticker (e.g.: NASDAQ for exchange and FB as ticker to listen to how Facebook sounds like.)

<div id="demo">
    <div id="chart" hidden></div>
</div>

Currently the mapping from market data to sound is naive: 

1. Each beat stands for one day of the security price in the past, ordered by the security's trading history.
2. Sound frequency: the higher the daily close price, the higher the frequency.
3. Waveform: if the daily open price is lower than close price, a beat of triangle wave sound is generated, otherwise the sine wave. 
4. Duration between each two beats are determined by the earlier day's market volume: larger market volume comes with shorter duration.

Apart from the chart for market data, each beat is also visualized to show their waveform and frequency domain distribution.

<div id="demo">
    <canvas id="proceduralCanvas" hidden></canvas>
</div>

Of course, listening to only one security ticker at a time isn't that much fun. Some good way to extend this project might be to map multiple securities into different sounds, and play them simultaneously, in the hope of creating some sort of "symphony".
