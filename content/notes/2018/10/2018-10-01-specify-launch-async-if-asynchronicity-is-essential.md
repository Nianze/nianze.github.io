---
title: "[EMCpp]Item-36 Specify std::launch::async if Asynchronicity Is Essential"
date: 2018-10-01T18:33:54-04:00
series:
- effective c++
categories:
- coding
tags:
- technique
- cpp
slug: Specify std::launch::async if Asynchronicity Is Essential
autoThumbnailImage: true
thumbnailImagePosition: right
featured_image: 2018/2018-10/01.gif
---

The flexibility that default policy for `std::async` permits both async and sync task execution leads to uncertainty when accessing `thread_locals`, implies that the task may never execute, and affects program logic for timeout-based `wait` calls.
<!--more-->

When requesting a function `f` to be run in accord with a `std::async`, there are two standard _launch policies_, each represented by an enumerator in the `std::launch` scoped enum:

* **The `std::launch::async` launch policy**: `f` must be run asynchronously on a different thread.
* **The `std::launch::deferred` launch policy**: `f` may run only when `get` or `wait` is called on the future returned by `std::async`. 

In the 2nd policy, things go like this: `f`'s execution is _deferred_ until a caller invokes `get` or `wait`,  upon which time `f` will execute synchronously and block the caller until `f` finishes running. If neither `get` nor `wait` is called, `f` will never run.

The default launch policy, however, uses an OR-ed version of the above two policies:

```cpp
auto fut1 = std::async(f); // the same meaning as below

auto fut2 = std::async(std::launch::async | 
                       std::launch::deferred,
                       f);
```

This default policy permits `f` to be run either asynchronously or synchronously, depending on the decision of thread-management components of the Standard Library about the best step to do to avoid oversubscription and load balancing. This flexibility, however, also imtroduces some limitations:

* It's not possible to predict whether `f` will run concurrently with `t`, since `f` might be scheduled to run deferred.
* It's not possible to predict whether `f` runs on a thread different from the thread invoking `get` or `wait` on `fut`
* It may not be possible to predict whether `f` runs at all, since it may not be possible to guarantee that `get` or `wait` will be called on `fut` along every path through the program
* It affects `wait`-based loops using timeouts, since calling `wait_for` or `wait_until` on a task that's deferred yields the value `std::future_status_deferred`, leading to following code run forever in some special cases:

    ```cpp
    using namespace std::literals;
    void f()
    {
        std::this_thread::sleep_for(1s);
    }
    
    auto fut = std::async(f);  // run f in default launch policy
    
    while (fut.wait_for(100ms) !=      // f never yield read 
           std::future_status::ready)  // when deferred
    {
        ...
    }
    ```

#### Solution

To deal with these limitations, if we use both the default launch policy as well as the timeout-based `wait` calls, we need to check for deferred case:

```cpp
...
if (fut.wait_for(0s) == 
    std::future_status::deferred)
{
    ... // use wait or get on fut to call f synchronously
} else {
    while (fut.wait_for(100ms) !=      // f never yield read 
           std::future_status::ready)  // when deferred
    { 
        ... // do concurrent work until it's ready
    }
    ...  // fut is ready
}
```

In summary, using `std::async` with the default launch policy for a task is fine as long as following conditions are fulfilled:

* The task need not run concurrently with the thread calling `get` or `wait`
* It doesn't matter which thread's thread_local variables are read or written
* Either there's a guarantee that `get` or `wait` will be called on the future returned by `std::async` or it's acceptable that the task may never execute
* Code using `wait_for` or `wait_until` takes the possibility of deferred status into account like above example.

If any of the conditions above fails to hold, schedule the task for truly asynchronous execution:

```cpp
auto fut = std::async(std::launch::async, f);  // launch f asynchronously
```

A nice wrapper for this purpose goes like this:

```cpp
// C++11 version
template<typename F, typename... Ts>
inline
std::future<typename std::result_of<F(Ts...)>::type>
reallyAsync(F&& f, Ts&&... params)
{
    return std::async(std::launch::async, 
                      std::forward<F>(f), 
                      std::forward<Ts>(params)...);
}

auto fut = reallyAsync(f); // run f asynchronously; throw if std::async would throw
```

```cpp
// C++14 version
template<typename F, typename... Ts>
inline
auto
reallyAsync(F&& f, Ts&&... params)
{
    return std::async(std::launch::async,
                      std::forward<F>(f),
                      std::forward<Ts>(params)...);
}
```
