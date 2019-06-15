---
title: "[EMCpp]Item-29 Assume Move Operations Are Not Present Not Cheap, and Not Used"
date: 2018-08-18T15:15:12-04:00
categories:
- technology
- coding
tags:
- technique
- cpp
slug: Assume Move Operations Are Not Present Not Cheap Not Used
autoThumbnailImage: true
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-08/18.gif
---

There are several scenarios in which C++11's move semantics do us no good:
<!--more-->

* **No move operations**: the object to be moved from fails to offer move operations. The move request thus becomes a copy request
* **Move not faster**: the object to be moved from has move operations that are no faster than its copy operations[^1]
* **Move not usable**: the context in which the moving would take place requires a move operation that emits no exceptions, but that operation isn't declared `noexcept`
* **Source object is lvalue**: with very few exceptions (e.g., item 25), only rvlaues may be used as the source of a move operation

[^1]: For example, `std::vector`, conceptually, holds only a pointer to the heap memory storing the contents of the container, so it is possible to move the contents of an entire container in constant time; however, for `std::array`, the data is stored directly in the `std::array` object, so the move operation runs in linear time. Similar analysis applies to `std::string` when the _small string optimization_ (SSO) occcurs.
