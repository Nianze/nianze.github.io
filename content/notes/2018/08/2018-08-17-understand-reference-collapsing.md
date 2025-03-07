---
title: "[EMCpp]Item-28 Understand Reference Collapsing"
date: 2018-08-17T19:46:25-04:00
series:
- effective c++
categories:
- coding
tags:
- technique
- cpp
slug: Understand Reference Collapsing
autoThumbnailImage: true
thumbnailImagePosition: right
featured_image: 2018/2018-08/17.gif
---

Reference collapsing occurs in four contexts: template instantiation, auto type generation, creation and use of typedefs and alias declarations, and decltype.
<!--more-->

The core concept in this item: A universal reference isn't a new kind of reference, it's actually an rvalue reference in a context where two conditions are satisfied:

* **Type deduction distinguishes lvalues from rvalues**. (Lvalues of type T are deduced to have type `T&`, while rvalues of type `T` yield `T`)
* **Reference collapsing occurs**.

Specifically, if a reference to a reference is generated by compilers arises in one of the four context mentioned above, the references collapse to a single reference according this rule:

- if either of the original references is an lvalue reference, the result is an lvalue reference
- otherwise, it's an rvalue reference

#### Template instantiation

Reference collapsing is a key part to make `std::forward` work. For example, given an possible implementation of `std::forward` and a function `f`:

```cpp
template<typename T>
T&& forward(typename remove_reference<T>::type& param)
{
    return static_cast<T&&>(param);
}

template<typename T>
void f(T&& Param)
{
    ...
    someFunc(std::forward<T>(fParam));
}
```

If we pass an lvalue of type `Widget` to function `f`, `T` will then be deduced as `Widget&`, and we get:

```cpp
Widget& && forward(typename remove_reference<Widget&>::type& param)
{
    return static_cast<Widget& &&>(param);
}
```

According to reference collapsing rule, we get:

```cpp
Widget& forward(Widget& param)
{
    return static_cast<Widget&>(param);
}
```

If we pass to `f` an rvalue of type `Widget`, `T` will then be `Widget`, and we get:

```cpp
Widget && forward(typename remove_reference<Widget>::type& param)
{
    return static_cast<Widget &&>(param);
}
```

According to reference collapsing rule, we get:

```cpp
Widget&& forward(Widget& param)
{
    return static_cast<Widget&&>(param);
}
```

Overall, an rvalue arguement `Widget` passed to `f` will be bound to the lvalue parameter `fParam` firstly, be casted into an rvalue, and then be `forward`ed to `someFunc`.

#### auto type generation

Type deduction for `auto` variables is essentially the same as deduction for templates.

```cpp
Widget widgetFactory();

Widget w; // w is lvalue

auto&& w1 = w; // type deduces as Widget&, so Widget& && w1 = w -collapsing-> Wiget& w1 = w
auto&& w2 = widgetFactory(); // type deduces as Widget, so Widget&& w2 = widgetFactory();
```

#### typedefs and alias declarations

```cpp
template<typename T>
class Widget {
public:
    typedefs T&& RvalueRefToT;
    ...
}
```

Given `Widget<int&> w;`, we get `typedef int& && RvalueRefToT;`, which then collapses into `typedef int& RvalueRefToT;`. Interestingly, the name turns out to be misleading: the `typedef` actually refers to an lvalue reference to `int` now if instantiated with an lvalue reference type `int&`.

#### decltype

Same logic as above to analyze.
