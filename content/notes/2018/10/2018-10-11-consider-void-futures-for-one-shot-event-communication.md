---
title: "[EMCpp]Item-39 Consider Void Futures for One-Shot Event Communication"
date: 2018-10-11T19:23:06-04:00
series:
- effective c++
categories:
- coding
tags:
- technique
- cpp
slug: Consider Void Futures for One Shot Event Communication
autoThumbnailImage: true
thumbnailImagePosition: right
featured_image: 2018/2018-10/11.gif
---

Using `std::promise`s and futures is useful skill to create one-shot communication between a detecting task and reacting task.
<!--more-->

Sometimes we want a task to detect some event and then inform a second asynchronously running task to proceed when some event has taken place (e.g., a data structure has been initialized, a stage of computation has been completed, a significant sensor value has been detected, etc.). In other words, a _detecting task_ will detect a special event/condition, and a _reacting task_ will wait until the detecting task notifies that the event occurs/condition changes.

If we only want to inform once, we can take use of the power of `std::promise`s and futures (i.e., `std::future` and `std::shared_future`). Since both `std::promise` and futures are templates requiring a type parameter that indicates the type of data to be transmitted through the communications channel, we specify this type as `void` indicating that no data is to be conveyed:

* The detecting task will set its `std::promise<void>` when the event of interest occurs
* The reacting task will `wait` on its `std::future<void>` or `std::shared_future<void>`
* The communications channel wil permit the reacting task to know when the detecting task has `written` its `void` data by calling `set_value` on its `std::promise`

The essence of the technique looks like,

```cpp
std::promise<void> p;

void react();     // func for reacting task

void detect() {   // func for detecting task
    std::thread t([]{
        p.get_future().wait();  // suspend t until future is set
        react();
    });
    ...  // here t is suspend prior to call to react
    p.set_value();  // event detected, so t is unsuspended (and thus call react)
    ...   // do additional work, program is terminated if this part of code throws
    t.join();   // make t unjoinable
}
```

Taking use of `std::future::share()`[^1], a general form is easy to implement where originally one reacting task extent to many: 

```cpp
std::promise<void> p;  // as before

void detect()  // now for multiple reacting tasks
{
    auto sf = p.get_future().share();  // sf's type is std::shared_future<void>

    std::vector<std::thread> vt;  // container for reacting threads

    for (int i = 0; i < ThreadsToRun; ++i) {
        vt.emplace_back([sf]{ sf.wait();    // wait on local copy of sf
                              react(); });  // see item 42 for info on emplace_back
    }
    ...   // program is terminated if this part of code throws
    p.set_value();   // unsuspend all threads
    ...
    for (auto& t : vt) {  
        t.join();    // make all threads unjoinable
    }
}
```

[^1]: `std::future::share()` transfers ownership of its shared state to the `std::shared_future` produced by `std::future::share()`
