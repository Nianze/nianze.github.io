---
title: "[EMCpp]Item-21 Prefer std::make_unique and std::make_shared to Direct Use of New"
date: 2018-08-02T18:45:53-04:00
categories:
- article
- coding
tags:
- technique
- cpp
slug: Prefer make_unique and make_shared to Direct Use of New
autoThumbnailImage: true
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-08/02.gif
draft: true
---

Compared to `new`, make functions eliminate source code duplication, improve exception safety, and, for `std::make_shard` and `std::allocate_shared`, generate code that's smaller and faster.
<!--more-->

