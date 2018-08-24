---
title: "[EMCpp]Item 33 Use decltype on auto&& parameters to std::forward them"
date: 2018-08-23T21:44:29-04:00
categories:
- article
- coding
tags:
- technique
- cpp
slug: Use decltype on auto&& parameters to std::forward them
autoThumbnailImage: true
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-08/23.gif
---

C++14 introduces generic lambdas, which use `auto` in their parameter specifications.
<!--more-->

```cpp
auto f = [](auto x){ return normalize(x); };
```

If we want to perfect-fowrad a parameter `x` to `normalize`, we make two changes:

1. use universal reference `auto&&`
2. apply `decltype` on parameter to specify the correct type for type argument of `std::forward`

```cpp
auto f = [](auto&& x){ return normalize(std::forward<decltype(x)>(x)); };
```

As a fact of `decltype(x)`:
* if `x` is bound to an lvalue, it will yield an lvalue refernece; 
* if `x` is bound to an rvalue, it will yield an rvalue reference 

Actually, the result of `decltype(x)` doesn't follow the convention of `std::forward`, where it dictates that the type argument be an lvalue reference to indicate an lvalue and a non-reference to indicate an rvalue.

Thanks to reference-collapsing rule, even though rvalue convention is broken here, the collapsing result is still the same. Say the `T` in the implementation of `std::forward` below is instantiated as `Widget&&`, an rvalue reference type:

```cpp
template<typename T>                         // in namespace
T&& forward(remove_reference_t<T>& param)    // std
{  return static_cast<T&&>(param);
}
```

and we get this before reference collapsing:

```cpp
Widget&& && forward(Widget& param)         // instantiation of
{                                          // std::forward when 
    static_cast<Widget&& &&>(param);       // T is Widget&& 
}
```

After reference collapsing:

```cpp
Widget&& forward(Widget& param)         // instantiation of
{                                       // std::forward when 
    static_cast<Widget&&>(param);       // T is Widget&& 
}
```

This is exactly what we expect.

#### Variadic parameters

For more than a single parameter, using following format:

```cpp
auto f = [](auto&&... xs)
         { return normalize(std::forward<decltype(xs)>(xs)...); }
```