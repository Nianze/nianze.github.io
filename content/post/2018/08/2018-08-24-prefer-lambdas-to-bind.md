---
title: "[EMCpp]Item-34 Prefer Lambdas to std::bind"
date: 2018-08-24T20:07:38-04:00
categories:
- article
- coding
tags:
- technique
- cpp
slug: Prefer Lambdas to std::bind
autoThumbnailImage: true
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-08/24.gif
---

Lambdas are more readable, more expressive, and may be more efficient than using `std::bind`.
<!--more-->

#### More readable

Suppose we want a function to set up an audible alarm that will go off an hour after it's set and that will stay on for 30 seconds, with the alarm sound remaining undecided.

```cpp

```

In C++14, it is very easy to write, and straight-forward to read:

```cpp

```

#### More expressive

#### More efficient