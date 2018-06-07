---
title: "[EMCpp]Item-1 Understand Template Type Deduction"
date: 2018-06-07T19:50:57-04:00
categories:
- article
- coding
tags:
- technique
- cpp
slug: Understand Template Type Deduction
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-06/2018-06-07.gif
draft: true
---

During template type deduction, there are different rules for parameters of reference type, universal reference type, and value type; arguments that are array or function names decay to pointers unless they're used to initialize references.
<!--more-->