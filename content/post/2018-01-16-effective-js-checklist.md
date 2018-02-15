---
title: "Effective JavaScript Checklist"
date: 2018-01-16T18:42:21-05:00
draft: true
categories:
- article
- coding
tags:
- technique
- javascript
slug: start of effective cpp series
#autoThumbnailImage: false
#thumbnailImagePosition: right
#thumbnailImage: /images/2018/2018-01/2018-01-04-ml.png
---

My notes on reviewing `JavaScript`.
<!--more-->

### Item 1: Know `JavaScript` you are using

1. JavaScript --formalizatoin--> ECMAScript. Decide which versions of JavaScript your application supports, ES5 or ES6.
2. Prefer to "use strict".
3. Beware of concatenating scripts that differ in their expectations about strict mode.

### Item 2: Understand JavaScript's floating-point numbers

1. JavaScript numbers are double-precision floating-point numbers.
2. Integers in JavaScript are a subset of doubles which is not a separate datatype and only have 53-bit precision (range between -2^53 to 2^53).
3. Bitwise operators treat numbers as if they were 32-bit signed integers.(to be precise, when doing bitwise arithmetic operation, floating-point numbers are implicitly converted to 32-bit, big-endian, two's complement integers)
4. Floating-point arithmetic may lead to inaccuracy.

### Item 3: Beware of implicit coercions