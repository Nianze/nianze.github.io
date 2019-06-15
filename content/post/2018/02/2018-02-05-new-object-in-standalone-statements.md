---
title: "Item-17 Store newed objects in smart pointers in standalone statements"
date: 2018-02-05T18:04:38-05:00
categories:
- technology
- coding
tags:
- technique
- cpp
slug: store newed objects in smart pointers in standalone statements
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-02/2018-02-05.jpg
---

Failure to do this can lead to subtle resource leaks when exceptions are thrown.
<!--more-->

Suppose there're two functions:

```cpp
int priority(); // reveal processing priority
void processWidget(std::tr1::shared<Widget> pw, int priority); // do some processing on a dynamically allocated `Widget` in accord with the priority above
```

Apparently, following code won't compile:

```cpp
processWidget(new Widget, priority());
```

This is because `tr1::shared_ptr`'s constructor taking a raw is `explicit`, there's no implicit conversion from the raw pointer (returned by `new Widget`) to the `tr1::shared_ptr` (required by `processWidget`). 

However, even though the code below does compile, seems correct, and carefully uses `shared_ptr` to manage resource, it may still leak resources:

```cpp
processWidget(std::tr1::shared_ptr<Widget>(new Widget), priority());
```

The two arguments as function parameters must be evaluated before a call to `processWidget` is generated, and the first argument actually consists of two parts:

* execution of the expression `new Widget`
* call to the `tr1::shared_ptr` constructor

Thus, before `processWidget` can be called, following three steps must take place:

* Call `priority`
* Execute `new Widget`
* Call the `tr1::shared_ptr` constructor

Unlike Java and C#, where function parameters are always evaluated in a particular order, C++ compilers are free to decide the order of steps above. Although `new Widget` must take place before `tr1::shared_ptr` constructor can be call (for the result of `new` operation is the argument of the smart pointer's constructor), the call to `priority()` can be performed first, second, or third. If compilers choose to perform it second (maybe for efficiency consideration):

1. Execute `new Widget`
2. Call `priority`
3. Call `tr1::shared_ptr` constructor

The problem here is that, once the call to `priority` yields an exception, the pointer returned from `new Widget` has not turned over to the resource-managing object, and resource leaks.

Luckily, it is very simple to avoid this problem: use a separate statement to create `Widget` and store it in a smart pointer, then pass the smart pointer to `processWidget`:

```cpp
std::tr1::shared_ptr<Widget> pw(new Widget); // standalone statement
processWidget(pw, priority());  // won't leak
```

Now the `new Widget` expression and the call to `tr1::shared_ptr` constructor are in a different statement from the call to `priority`, compilers are not allowed to move the call to `priority` between them.
