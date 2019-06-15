---
title: "[EMCpp]Item-38 Be Aware of Varying Thread Handle Destructor Behavior"
date: 2018-10-09T19:42:16-04:00
categories:
- technology
- coding
tags:
- technique
- cpp
slug: Be Aware of Varying Thread Handle Destructor Behavior
autoThumbnailImage: true
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-10/09.gif
---

Future destructors normally just destroy the future's data members, execept for the final future referring to a shared state for a non-deferred task launched via `std::async`, which blocks until the task completes. 
<!--more-->

Item 37 notes that the destruction of a joinable `std::thread` terminates the program. As a comparicon, the behavior of destructor for a future is quit different.

To take a closer examination on future's destruction behavior, let's first understand that future is one end of a communications channel through which a callee transmits a result to a caller. The model works like this: 

1. The callee (usually running asynchronously) writes the result of its computation into the communications channel (typically via a `std::promise` object
2. A location known as _shared state_ (typically represented by a heap-based object, which is outside both caller and callee) then stores a copy of the result, which is previously local to the callee and will be destroyed when the callee finished
3. As the name suggests, this location is also accessible by futures that are associated with the caller.

The relationship looks like this:

```
      future           Shared State             std::promise
Caller<---------------Callee's Result<----------------------Callee
                                                 (typically)

```

Now comes the behavior of a future's destructor:

* The destructor for the last future referring to a shared state for a non-deferred task launched via std::async blocks until the task completes (which acts like an implicit `join` on the underlying thread)
* The destructor for all other futures simply destroys the future object (which acts like an implicit `detach` on the underlying thread.)

In other words, the implicit `join` occurs only if all of the following apply to a future:

* it refers to a shared state that was created due to a call to `std::async`
* the task's launch policy is `std::launch::async`, either because that was chosen by the runtime system or because it was specified in the call to `std::async`
* the future is the last one referring to the shared state. For `std::future`s, this is always the case. For `std::shared_future`s, other earlier future's destructor simply destroys its data members 
