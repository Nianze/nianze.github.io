---
title: "[MECpp]Item-21 Overload to Avoid Implicit Type Conventions"
date: 2018-04-17T15:42:12-04:00
categories:
- article
- coding
tags:
- technique
- cpp
slug: Overload to Avoid Implicit Type Conventions
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-04/2018-04-17.gif
---

Overloading to avoid temporaries.
<!--more-->

Consider following code:

```cpp
class UPInt {  // unlimited precision integers
public:
    UPInt();
    UPInt(int value);
    ...
};

const UPInt operator+(const UPInt& lhs, const UPInt& rhs);
```

And following statements:

```cpp
UPInt upi1, upi2;

UPInt upi3 = upi1 + 10;
UPInt upi4 = 10 + upi2;
```

These statements succeed by the creation of temporary objects to convert the integer 10 into `UPInts` (MECpp item 19).

It is convenient to have compilers perform such kinds of conversions, but the we do pay the cost of implicit type conversion. If we want to eliminate this cost, we cancel the type conversions by function overloading;

```cpp
const UPInt operator+(const UPInt& lhs, const UPInt& rhs);
const UPInt operator+(const UPInt& lhs, int);
const UPInt operator+(int, const UPInt& rhs);
...
```

Notice that `const UPInt operator+(int, int);` is not allowed: C++ rules that every overloaded operator must take at leas one argument of a user-defined type. `int` isn't a user-defined type, so we can't overload this `operator+` in this form.

Still, before doing such optimizations, it's important to follow the 80-20 rule (MECpp item 16) to make sure it will make a noticeable improvement in the overall efficiency of the programs.