---
title: "[EMCpp]Item-6 Use the Explicitly Typed Initializer Idiom when auto deduces undesired types"
date: 2018-07-08T13:32:48-04:00
categories:
- article
- coding
tags:
- technique
- cpp
slug: Use the Explicitly Typed Initializer Idiom when auto deduces undesired types
autoThumbnailImage: true
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-07/08.gif
---

“Invisible” proxy types can cause `auto` to deduce the undesired type for an initializing expression, so we can adopt explicitly typed initializer idiom to force `auto` to deduce what we want.
<!--more-->

Some proxy classe are designed to be apparent to clients, such as `std::shared_ptr`, and `std::unique_ptr`. Other proxy classes are designed to at more or less invisibly, such as `std::vector<bool>::reference`, and `std::bitset::reference`.

For example, suppose we have a function that takes a `Widget` and returns a `std::vector<bool>`, where each bool indicates whether the `Widget` offers a particular feature:

```cpp
std::vector<bool> features(const Widget& w);
```

Now we want to check the value of bit 5, which indicates whether the `Widget` has high priority:

```cpp
Widget w;
...
bool highPriority = features(w)[5];  // is w high priority ?
...
processWidget(w, highPriority);  // process w in accord with its priority
```

However, if we change the explicit type for `highPriority` with `auto`:

```cpp
auto highPriority = features(w)[5];
processWidget(w, highPriority);  // undefined behavior! 
```

The undefined behavior is caused by the fact that `highPriority` contains dangling pointer. And here is what happened:

* `features` returns a temporary `std::vector<bool>` object (let's call it _temp_), which is specified to represent its `bool`s in packed form, one bit per `bool`.
* `operator[]` is invokes on _temp_, and returns a `std::vector<bool>::reference` object (an invisible proxy), which contains a pointer to a word in the data structure holding the bits that are managed by `temp`, plus the offset into that word corresponding to bit 5[^1]
* `auto` deduces `std::vector<bool>::reference` as the tpe of `highPriority`, and bind `highPriority` to a copy of this `std::vector<bool>::reference` object
* at the end of the statement, `temp` is destroyed. Therefore, as a copy, `highPriority` contains a dangling pointer, leading to undefined behavior in the call to `processWidget`.

Now is the time we adopt the explicitly typed initializer idiom: we declare a variable with `auto`, but casting the initialization expression to the type we want `auto` to deduce:

```cpp
auto highPriority = static_cast<bool>(features(w)[5]);
```

At this time, the `std::vector<bool>::reference` object returned from `std::vector<bool>::operator[]` executes the conversion to `bool` it supports, and as part of that conversion, the still-valid pointer to _temp_ (the `std::vector<bool>` object returned from `features`) is dereferenced, and the index 5 is then applied to the bits pointed to by the ponter, and the `bool` value that emerges is used to initialize `highPriority` - therefore, undefined behavior is avoided.

[^1]: C++ forbids references to bits, so in the case where `T` is `bool`, `operator[]` for `std::vector<T>` cannot return `bool&` in packed form. That's why the proxy is introduced here to make the return value act like a `bool&`.