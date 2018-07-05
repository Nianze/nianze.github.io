---
title: "[EMCpp]Item-3 Understand Decltype"
date: 2018-07-05T18:59:39-04:00
categories:
- article
- coding
tags:
- technique
- cpp
slug: Understand Decltype
autoThumbnailImage: true
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-07/05.gif
---

`decltype` almost always yields the type of a variable or expression without any modifications. For lvalue expressions of type T other than names, `decltype` always reports a type of T&. 
<!--more-->

