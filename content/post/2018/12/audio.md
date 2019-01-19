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
    <link rel="stylesheet" type="text/css" href="/css/trading-audio/techan.css" />
    <link rel="stylesheet" type="text/css" href="/css/trading-audio/awesomplete.css" />
    <link rel="stylesheet" type="text/css" href="/css/trading-audio/style.css" />
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.3.0/css/font-awesome.min.css">
    <script src="http://d3js.org/d3.v4.min.js"></script>
    <script src="/js/trading-audio/techan.min.js"></script>
    <script src="/js/trading-audio/awesomplete.min.js"></script>
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
    <div></div>
    <div id="chart" hidden></div>
    <div><canvas id="proceduralCanvas" hidden></canvas></div>
    <script src="/js/trading-audio/tradeBeats.js"></script>    
</div>

> TODO: more sound, more interaction
> auto complete for input tickers; play control bar and pause; more complicated oscillator generator and sound parameter control; multi-tickers play simultaneously; style in dark mode; more animation.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce eget urna vitae velit eleifend interdum at ac nisi. In nec ligula lacus. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Sed eu cursus erat, ut dapibus quam. Aliquam eleifend dolor vitae libero pharetra adipiscing. Etiam adipiscing dolor a quam tempor, eu convallis nulla varius. Aliquam sollicitudin risus a porta aliquam. Ut nec velit dolor. Proin eget leo lobortis, aliquam est sed, mollis mauris. Fusce vitae leo pretium massa accumsan condimentum. Fusce malesuada gravida lectus vel vulputate. Donec bibendum porta nibh ut aliquam. Sed lorem felis, congue non fringilla eu, aliquam eu eros. Curabitur orci libero, mollis sed semper vitae, adipiscing in lectus. Aenean non egestas odio. Donec sollicitudin nisi quis lorem gravida, in pharetra mauris fringilla. Duis sit amet faucibus dolor, id aliquam neque. In egestas, odio gravida tempor dictum, mauris felis faucibus purus, sit amet commodo lacus diam vitae est. Ut ut quam eget massa semper sodales. Aenean non ipsum cursus, blandit lectus in, ornare odio. Curabitur ultrices porttitor vulputate. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce eget urna vitae velit eleifend interdum at ac nisi. In nec ligula lacus. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Sed eu cursus erat, ut dapibus quam. Aliquam eleifend dolor vitae libero pharetra adipiscing. Etiam adipiscing dolor a quam tempor, eu convallis nulla varius. Aliquam sollicitudin risus a porta aliquam. Ut nec velit dolor. Proin eget leo lobortis, aliquam est sed, mollis mauris. Fusce vitae leo pretium massa accumsan condimentum. Fusce malesuada gravida lectus vel vulputate. Donec bibendum porta nibh ut aliquam.

Sed lorem felis, congue non fringilla eu, aliquam eu eros. Curabitur orci libero, mollis sed semper vitae, adipiscing in lectus. Aenean non egestas odio. Donec sollicitudin nisi quis lorem gravida, in pharetra mauris fringilla. Duis sit amet faucibus dolor, id aliquam neque. In egestas, odio gravida tempor dictum, mauris felis faucibus purus, sit amet commodo lacus diam vitae est. Ut ut quam eget massa semper sodales. Aenean non ipsum cursus, blandit lectus in, ornare odio. Curabitur ultrices porttitor vulputate. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce eget urna vitae velit eleifend interdum at ac nisi. In nec ligula lacus. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Sed eu cursus erat, ut dapibus quam. Aliquam eleifend dolor vitae libero pharetra adipiscing. Etiam adipiscing dolor a quam tempor, eu convallis nulla varius. Aliquam sollicitudin risus a porta aliquam. Ut nec velit dolor. Proin eget leo lobortis, aliquam est sed, mollis mauris. Fusce vitae leo pretium massa accumsan condimentum. Fusce malesuada gravida lectus vel vulputate. Donec bibendum porta nibh ut aliquam.

Sed lorem felis, congue non fringilla eu, aliquam eu eros. Curabitur orci libero, mollis sed semper vitae, adipiscing in lectus. Aenean non egestas odio. Donec sollicitudin nisi quis lorem gravida, in pharetra mauris fringilla. Duis sit amet faucibus dolor, id aliquam neque. In egestas, odio gravida tempor dictum, mauris felis faucibus purus, sit amet commodo lacus diam vitae est. Ut ut quam eget massa semper sodales. Aenean non ipsum cursus, blandit lectus in, ornare odio. Curabitur ultrices porttitor vulputate.