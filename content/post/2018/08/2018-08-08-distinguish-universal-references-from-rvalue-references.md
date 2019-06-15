---
title: "[EMCpp]Item-24 Distinguish Universal References From Rvalue References"
date: 2018-08-08T18:56:09-04:00
categories:
- technology
- coding
tags:
- technique
- cpp
slug: Distinguish Universal References From Rvalue References
autoThumbnailImage: true
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-08/08.gif
---

If a function template parameter has type `T&&` for a deduced type `T`, or if an object is declared using `auto&&`, the parameter or object is a _universal reference_.
<!--more-->

`T&&` has two different meanings: one is for rvalue reference, another is for universal reference. Universal references are called "universal", because they can bind to virtually _anything_: 

* bind to rvalues (behave like rvalue references `T&&`)
* bind to lvalues (behave like lvalue references `T&`)
* bind to objects that is `const` or non-`const`, `volatile` or non-`volatile`, or both `const` and `volatile`

Universal refenrences must company with a special form (i.e., the form of "`T&&`") after the occurrence of _type deduction_, and typically arise in two contexts: the most common case is function template parameters, while another context is `auto` declarations:

```cpp
template<typename T>
void f(T&& param);  // param is a universal reference
auto&& var2 = var1;  // var2 is a universal reference

Widget w;
f(w);  // lvalue passed to f; param's type is Widget&, act as an lvalue ref.
f(std::move(w));  // rvalue passed to f; param's type is Widget&&, act as an rvalue ref.
```

If there's no type deduction, or if the type deduction form is incorrect (not in form of "T&&"), then there's no universal references:

```cpp
void f(Widget&& param);  // no type deduction; param is an rvalue reference
Widget&& var1 = Widget(); // no type deduction; param is an rvalue reference

template<typename T>
void f(std::vector<T>&& param);  // not in precise form of T&&, param here is an rvalue ref.

template<typename T>
void f(const T&& param); // not in precise form of T&&, param here is an rvalue ref.

template<typename T, class Allocator = allocator<T>>  // from C++ standards
class vector {
public:
    void push_back(T&& x);  // no type deduction here; x is rvalue reference;
    ...   // a particular vector instantiation must have occurred prior to any call to this function
}

template<typename T, class Allocator = allocator<T>>  // from C++ standards
class vector {
public:
    template<class... Args>
    void emplace_back(Args&&... args);  // universal reference! because:
    ...  // 1. in correct form of "T&&"; 2. type parameter Args must be deduced each time emplace_back is called
}

// this function can time pretty much any function execution. more information is in EMCpp item 30
auto timeFuncInvocation =    // C++14
    [] (auto&& func, auto&&... param)  // func is a universal reference that can be bound to any callable object, lvaue or rvalue
    {   // param is zero or more universal references (i.e., a universal reference parameter pack) that can be bound to any number of objects of arbitrary types
        // start timer;
        std::forward<decltype(func)>(func)(  // invoke func on params
            std::forward<decltype(params)>(params)...
        );
        // stop timer and record elapsed time;
    };
```

In fact, the foundation of univeral references is a lie (an "abstraction"), with underlying truth being known as _reference collapsing_ discussed in EMCpp Item 28. Distinguishing between rvalue references and universal references will help us read source code more accurately.
