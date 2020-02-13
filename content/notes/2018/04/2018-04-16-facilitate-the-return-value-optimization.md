---
title: "[MECpp]Item-20 Facilitate the Return Value Optimization"
date: 2018-04-16
series:
- effective c++
categories:
- coding
tags:
- technique
- cpp
slug: Facilitate the Return Value Optimization
autoThumbnailImage: false
thumbnailImagePosition: right
featured_image: 2018/2018-04/2018-04-16.gif
---

Take use of the _return value optimization_ in compilers.
<!--more-->

Some functions (such as `operator*`) have to return objects: 

* if returning pointers, the caller is responsible to delete the pointer, which usually leads to resource leaks.
* if returning references, then we're returning a reference to a local object, which no longer exists when the caller has it.

Although we can't eliminate by-value returns from functions that require them, we can still reduce the cost of returning objects: by the help of compilers, we can eliminate the cost of the temporaries by returning _constructor arguments_ instead of objects:

```cpp
const Rational operator*(const Rational& lhs, const Rational& rhs)
{
    return Rational(lhs.numerator() * rhs.numerator(),
                    lhs.denominator() * rhs.denominator());
}
```

Here we're creating an anonymous temporary `Rational` object through a constructor expression, ant it is this temporary object the function is copying for its return value. When we use this efficient version of `operator*` under the use case below:

```cpp
Rational a = 10;
Rational b(1, 2);

Rational c = a * b;  // operator* is called
```
 
The rules for C++ allow compilers to optimize such _anonymous_ temporary objects out of existence by constructing the temporary _inside the memory allotted for the object_ `c`. Thus, if compilers do this optimization, both the temporary inside `operator*` and the temporary returned by `operator*` are eliminated, and we only pay for one constructor call - the one to create `c`.

Further more, we can eliminate the overhead of the call to `operator*` by declaring this function `inline`:

```cpp
// most efficient way to write a function returning an object
inline const Rational operator*(const Rational& lhs, const Rational& rhs)
{
    return Rational(lhs.numerator() * rhs.numerator(),
                    lhs.denominator() * rhs.denominator());
}
```
