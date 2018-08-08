---
title: "[EMCpp]Item-22 Understand std::Move and std::Forward"
date: 2018-08-07T17:57:26-04:00
categories:
- article
- coding
tags:
- technique
- cpp
slug: Understand std::Move and std::Forward
autoThumbnailImage: true
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-08/07.gif
---

`std::move` performs an unconditional cast to an rvalue, while `std::forward` casts its argument to an rvalue only if that argument is bound to an rvalue.
<!--more-->

Some facts:

* Neither `std::move` nor `std::forward` do anything at runtime.
* Move request on `const` objects are treated as copy requests.

#### std::move

To make things concrete, a very basic implementation of `std::move` in C++11 looks like this:

```cpp
template<typename T>
typename remove_reference<T>::type&&
move(T&& param)
{
    using ReturnType = typename remove_reference<T>::type&&;
    return static_cast<ReturnType>(param);
}
```

Or, a more elegant implementation in C++14:

```cpp
template<typename T>
decltype<auto> move(T&& param)
{
    using ReturnType = remove_reference_t<T>&&;
    return static_cast<ReturnType>(param);
}
```

Basically, `std::move` does nothing but cast its argument to an rvalue, and we might think it as `rvalue_cast`. Usually we want `move` operation on rvalues, so every time we see a `move` over some parameter, we know we want to perform move operation over the resulting rvalue. However, not all rvalues are candidates for moving, especailly those annotated by `const` - _move requests on `const` objects are silentlly transformed into copy operation_.

#### std::forward

`std::move` unconditionally casts its argument to an rvalue, while `std::forward` conditionally do so: it casts to an rvalue only if its argument was initialized with an rvalue.

The most common scenario is a function template taking a universal reference parameter that is to be passed to another function:

```cpp
void process(const Widget& lvalArg);
void process(Widget&& rvalArg);

template<typename T>
void logAndProcess(T&& param)  // universal reference
{
    auto now = std::chrono::system_clock::now();
    makeLogEntry("Calling 'process'", now);
    process(std::forward<T>(param));
}
```

```cpp
Widget w;
logAndProcess(w);             // call with lvalue
logAndProcess(std::move(w));  // call with rvalue
```

In the code above, `std::forward` is able to tell whether `param` is initialized with an lvalue or an rvalue because that information is encoded in `logAndProcess`'s template parameter `T`, which is then passed to `std::forward`, which is able to recover the encoded information. For details, refer to EMCpp item 28.

#### Comparison

Depending on the usecase scenario, we can tell when to use which:

* `std:move` typically sets up a move
* `std::forward` just passes - _forwards_- an object to another function in a way that retains its original lvalueness or rvalueness.