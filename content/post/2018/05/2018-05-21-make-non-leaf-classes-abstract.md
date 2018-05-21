---
title: "[MECpp]Item-33 Make Non-Leaf Classes Abstract"
date: 2018-05-21T18:27:39-04:00
categories:
- article
- coding
tags:
- technique
- cpp
slug: Make Non Leaf Classes Abstract
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-05/2018-05-21.gif
---

The general rule: non-leaf classes should be abstract. This will yields dividends in the form of increased reliability, robustness, comprehensibility, and extensibility throughout our software.
<!--more-->

If we have two concrete classes C1 and C2 and we'd like C2 to publicly inherit from C1, we should transform that two-class hierarchy into a three-class hierarchy by creating a new class A and having both C1 and C2 publicly inherit from it:

```
initial idea  |             the transformed hierarchy
┌─────────┐   |                    ┌─────┐
│   C1    │   |                    │  A  │
└─────────┘   |                    └─────┘
     ↑        | public inheritance ↗     ↖ public inheritance
┌─────────┐   |              ┌────┐      ┌────┐
│   C1    │   |              │ C1 │      │ C2 │
└─────────┘   |              └────┘      └────┘
```

For example, 