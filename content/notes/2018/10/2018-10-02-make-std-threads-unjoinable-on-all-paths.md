---
title: "[EMCpp]Item-37 Make std::threads Unjoinable on All Paths"
date: 2018-10-02T19:16:09-04:00
series:
- effective c++
categories:
- coding
tags:
- technique
- cpp
slug: Make std::threads Unjoinable on All Paths
autoThumbnailImage: true
thumbnailImagePosition: right
featured_image: 2018/2018-10/02.gif
---

_Join-on-destruction_ can lead to difficult-to-debug performance anomalies; while _detach-on-destruction_ can lead to difficult-to-debug undefined behavior.
<!--more-->

Every `std::thread` object is in one of two states:

1. joinable: corresponding to an underlying asynchronous thread of execution that is or could be running.
    * A `std::thread` corresponding to an underlying thread that's waiting to be scheduled, blocked, or have run to comletion are all considered joinable.
2. unjoinable: 
    * Default-constructed `std::thread`s: such `std::thread`s have no function to execute, thus corresponding to no underlying thread of execution
    * `std::thread` that have been joined: after a `join`, the `std::thread` object no longer corresponding to the underlying thread of execution which has finished running.
    * `std::thread`s that have been detached: a `detach` severs the connection between a `std::thread` object and the underlying thread of execution it corresponds to.

Due to the requirement that if the destructor for a joinable thread is invoked, execution of the program (i.e., all threads) is terminated. The destructor of `std::thread` behaves in this way because the two other obvious options are arguably worse:

1. An implicit `join`: thus a `std::thread`'s destructor would wait for its underlying asynchronous thread of execution to complete, leading to performance anomalies that would be difficult to track down.
2. An implicit `detach`: then a `std::thread`'s destructor would sever the connection between the `std::thread`  object and its underlying thread of execution, which would continue to run. That is wild.

The Standardization Committee decided this program termination behavior just to tell us that we need to ensure a `std::thread` object is made unjoinable on every path out of the scope in which it's defined. That is, we can use _RAII_ technique to take care of that.

```cpp
class ThreadRAII {
public:
    enum class DtorAction { join, detach };

    ThreadRAII(std::thread&& t, DtorAction a)
    : action(a), t(std::move(t)) {}

    ~ThreadRAII 
    {
        if (t.joinable()) {
            if (action == DtorAction::join) {
                t.join();
            } else {
                t.detach();
            }
        }
    }
    ThreadRAII(ThreadRAII&&) = default; // explicitly requesting the default move operations
    ThreadRAII& operator=(ThreadRAII&&) = default;  // since customized destructor prevent compiler-generated ones
    std::thread& get() { return t; }
private:
    DtorAction action;
    std::thread t;
};
```

A few points:

* `std::thread` objects aren't copyable, so we accepts only `std::thread` rvalues
* The parameter order in the constructor is designed to be intuitive to callers, but the member initialization list is designed to match the order of the data members' declarations, in which we put the `std::thread` object last in case the `std::thread` depends on other data members.
* `get` is provided to access the underlying `std::thread` object so that we gain the full `std::thread` interface for free
* A check to make sure the `t` is joinable in destructor is necessary in case that clients used `get` to acquire `t` and then did a move from `t` or called `join` or `detach` on `t`, making `t` unjoinable.
* If in the client code there are simultaneous calls trying to invoke two member functions (the destructor and something else) on one object at the same time, there is a race: between execution of `t.joinable()` and invocation of `join` or `detach`, another thread could render `t` unjoinable.[^1]

[^1]: In general, simultaneous member function calls on a single object are safe only if all are to `cont` member functions.
