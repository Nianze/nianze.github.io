---
title: "[MECpp]Item-13 Catch Exceptions by Reference"
date: 2018-04-05T18:57:13-04:00
categories:
- article
- coding
tags:
- technique
- cpp
slug: Catch Exceptions by Reference
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-04/2018-04-05.gif
---

If catching by reference, we sidestep the questions about object deletion, avoid slicing exception objects, retain the ability to catch standard exceptions, and limit the number of times exception objects being copied.
<!--more-->

# Catch by pointer

In order to catch by pointer, programmers need to define exception objects in a way that guarantees the objects exist after control leaves the `throw` site.

# Catch by value

