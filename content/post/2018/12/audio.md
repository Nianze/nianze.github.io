---
title: "Use trading data to create interactive music"
date: 2018-12-16
categories:
- article
- coding
tags:
- music
- technique
slug: Use trading data to create interactive music
autoThumbnailImage: true
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-12/16.gif
draft: true
---

<p id="demo"></p>
<p id="query"></p>
<div id="waveform"></div>

<input type="button" value="load" id="load" onclick="load()">
<input type="button" value="play" onclick="play()">
<input type="button" value="pause" onclick="pause()">

<script src="https://unpkg.com/wavesurfer.js"></script>
<script src="/js/trading-audio/audio.js"> </script>