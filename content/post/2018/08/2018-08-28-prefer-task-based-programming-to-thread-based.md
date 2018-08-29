---
title: "[EMCpp]Item-35 Prefer Task-Based Programming to Thread-Based"
date: 2018-08-28T10:19:06-04:00
categories:
- article
- coding
tags:
- technique
- cpp
slug: Prefer Task Based Programming to Thread Based
autoThumbnailImage: true
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-08/28.gif
---

Thread-based programming calls for manual management of thread exhaustion, oversubscription, load balancing, and adaptation to new platforms, while task-based programming via `std::async` with the default launch policy handles most of the issues for us.
<!--more-->

In concurrent C++ software, there are three meansings for _threads_:

1. _Hardware threads_ are threads that actually perform computation. Contemporary machine architectures offer one or more hardware threads per CPU core.
2. _Software threads_ (a.k.a., OS threads or system threads) are the threads that the operating system manages across all processes and schedules for execution on hardware threads.
3. `std::threads` are objects in a C++ process that act as handles to underlying software threads.

Since software threads are a limited resource, a `std::system_error` exception may be thrown if we try to create more of them than the system can provide, even if the function we want to run can't throw:

```cpp
int doAsyncWork() noexcept;
std::thread t(doAsyncWork);  // throws if no more threads are available
```

This limitation leads to follow-up problems we need to deal with: 

1. if no more threads are available and we run `doAsyncWork` on the current thread, there are issues of unbalanced loads, or even dead lock.
2. even if there're still more threads available, we need to face the trouble of _oversubscription_, where there are more unblocked software threads than hardware threads, and context switches increase the overall thread management overhead of the system, especially when the hardware thread on which a software thread is scheduled is switched on a diffferent core in a new time-slice.

Using `std::async` free us from all these problems by dumping them on somebody else who is responsible to implement the C++ Standard Library:

```cpp
auto fut = std::async(doAsyncWork);
```

The implementer of C++ Statndard Library solves the "out-of-threads" problem by providing no guarantee that there will be a new software thread: it permits the OS scheduler to arrange for the specified function (`doAsyncWork`) to be run on the thread requesting `doAsyncWork`'s result (i.e., on the thread calling `get` or `wait` on `fut`), and reasonable schedulers take advantage of that freedom if the system is oversubscribed or is out of threads. Since runtime scheduler manages the threads from all processes, it is likely to comprehend the whole picture better and be more capable to solve the load-balancing issues than we do[^1].

#### Edge Cases

There are some situations where using threads directly may be appropriate:

* We need access to the API of the underlying threading implementation via the member function `native_handle` in `std::thread` objects[^2]. There is no counterpart to this functionality for `std::future`s that `std::async` returns.
* We need to and are able to potimize thread usage for our application. E.g., developing server software with a known execution profile that will be deployed as the only significant process on a machine with fixed hardware characteristics.
* We need to implement threading technology beyond the C++ concurrency API. E.g., thread pools on platforms where our C++ implementations don't offer them.

[^1]: State-of-the-art thread schedulers employ system-wide thread pools to avoid oversubscription, while improving load balancing across hardware cores through work-stealing algorithms. It will be reasonable to expect that some vendors will take advantage of this technology in their Standard Library implementations, and anyone taking a task-based approach to concurrent programming will automatically reap the benefits.
[^2]: The C++ concurrent CPI is implemented using a lower-level platform-specifit API, usually pthreads or Windows' Threads, which are richer than what C++ offers. For example, C++ has no notion of thread priorities or affinities.