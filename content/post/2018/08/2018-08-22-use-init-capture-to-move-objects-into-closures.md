---
title: "[EMCpp]Item-32 Use Init Capture to Move Objects Into Closures"
date: 2018-08-22T18:24:02-04:00
categories:
- article
- coding
tags:
- technique
- cpp
slug: Use Init Capture to Move Objects Into Closures
autoThumbnailImage: true
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-08/22.gif
---

Use init capture to move objects into closures in C++14; emulate init capture via hand-written classes or `std::bind` in C++11.
<!--more-->

#### In C++14

One nice improvement in C++14, compared with C++11, is that it supports _int capture_ (a.k.a, _generalized lambda capture_), which makes it possible for us to specify:

1. the name of a data memeber in the closure class generated from the lambda
2. an expression initializing that data member

For example:

```cpp
class Widget {
public:
    ...
    bool isValidated() const;
    bool isProcessed() const;
    bool isArchived() const;
private:
    ...
};

auto pw = std::make_unique<Widget>();
...
auto func = [pw = std::move(pw)]  // init data mbr in closure with std::move(pw)
            { return pw->isValidated() && pw->isArchived(); }
```

One thing to note in init capture: the left side of "=" is the name of the data member in the closure we're specifying, which is in the closure class scope; the right side is the initializing expresion, which is the same scope as where the lambda is being defined. The code in the body of the lambda is in the scope of the closure class, so uses of `pw` refer to the closure class data member.

#### In C++11

In C++11, it's not possible to capture the result of an expression. We can still emulate the behaivor by either manually write a class:

```cpp
class IsValAndArch {
public:
    using DataType = std::unique_ptr<Widget>;
    explicit IsValAndArch(DataType&& ptr)
    : pw(std::move(ptr)) {}
    bool operator()() const
    { return pw->isValidated() && pw->isArchived(); }
private:
    DataType pw;
}

auto func = IsValAndArch(std::make_unique<Widget>());
```

or use `std::bind`:

```cpp
auto func = std::bind(
                [](const std::unique_ptr<Widget>& pw)
                { return pw->isValidated() && pw->isArchived(); },
                std::make_unique<Widget>()
            );
```

Some facts about `std::bind` above:

* `std::bind` produces function objects (called _bind object_), which contains copies of all the arguments passed to `std::bind` following this rule: copy constructing the lvalue arguemnt, and move construct rvalue argument.
* by default, the `operator()` member function inside the closure class generated from a lambda is `const`; as a contrast, the move-constructed copy of `Widget` inside bind object is not `const`, so we declare reference-to-const as the lambda's parameter to prevent that copy of `Widget` from being modified inside the lambda[^1]
* the lifetime of the bind is the same as that of the closure, so it's possible to treat objects in the bind object as if they were in the closure.


[^1]: We can declare lambda as `mutable` if we want to modify the copy inside the lambda: `[](std::unique_ptr<Widget>& pw) mutable {...}`