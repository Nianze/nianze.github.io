---
title: "[MECpp]Item-22 Consider Using op= Instead of Stand Alone op"
date: 2018-04-18T14:09:10-04:00
series:
- effective c++
categories:
- coding
tags:
- technique
- cpp
slug: Consider Using op= Instead of Stand Alone op
autoThumbnailImage: false
thumbnailImagePosition: right
featured_image: 2018/2018-04/2018-04-18.gif
---

Assignment versions of operators (such as `operator+=`) tend to be more efficient than stand-alone versions of those operators (e.g., `operator+`).
<!--more-->
<!-- toc -->

# Efficiency difference between `op=` and stand-alone `op`

* In general, assignment versions of operators are more effiecient than stand-alone versions, because 
    1. stand-alone versions must typically return a new object, and that costs us the construction and destruction of a temporary (MECpp item 19 and 20)
    2. assignment versions of operators write to their left-hand argument, so there is no need to generate a temporary to hold the operator's return value
* By offering assignment versions of operators as well as stand-alone versions, we allow clients of our classes to make the different trade-off between efficiency and convenience:

```cpp
Rational a, b, c, d, result;
...
result = a + b + c + d;  // 3 potential temporary objects, one for each call to operator+
```

This version is easy to write, debug, and maintain, and it offers acceptable performance about 80% of the time (MECpp item 16).

```cpp
result = a;    // no temporary
result += b;   // no temporary
result += c;   // no temporary
result += d;   // no temporary
```

This version is more efficient.

In summary, as a library designer, we should offer both, and as an application developer, we should consider using assignment versions of operators instead of stand-alone versions when trying to deal with the critical 20% code.

# Relationship between `op=` and stand-alone `op`

To ensure the natural relationship between the assignment version of an operator (e.g., `operator+=`) and the stand-alone version (e.g., `operator+`) exists, we can implement the latter in terms of the former (MECpp item 6):

```cpp
class Rational {
public:
    ...
    Rational& operator+=(const Rational& rhs);
};

const Rational operator+(const Rational& lhs, const Rational& rhs)
{
    return Rational(lhs) += rhs;
}
```

Further more, if we don't mind putting all stand-alone operators at global scope, we can use templates to eliminate the need to write the stand-alone functions:

```cpp
template<class T>
const T operator+(const T& lhs, const T& rhs)
{
    return T(lhs) += rhs;
}
```

A few points worth noting in this implementation of `operator+`:

* `operator+=` is implemented (elsewhere) from scratch, and `operator+` calls it to provide its functionality, so that only the assignment versions need to be maintained.
* Assuming the assignment version is in the class's public interface, there is no need for the stand-alone operators to be friends of the class.
* Without any named object, this implementation may take use of the return value optimization (MECpp item 20) [^1].

[^1]: Although it is possible that `return T(lhs) += rhs;` may be more complex than most compilers are willing to subject to the return value optimization.
