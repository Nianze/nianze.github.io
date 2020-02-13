---
title: "[EMCpp]Item-15 Use Constexpr Whenever Possible"
date: 2018-07-23T19:27:53-04:00
series:
- effective c++
categories:
- coding
tags:
- technique
- cpp
slug: Use Constexpr Whenever Possible
autoThumbnailImage: true
thumbnailImagePosition: right
featured_image: 2018/2018-07/23.gif
---

`constexpr` objects are `const` and are initialized with values known during compilation; `constexpr` functions can produce copmile-time results when called with arguments whose values are know during compilations.
<!--more-->
<!-- toc -->

# `constexpr` objects

Values known during compmilation are privileged: they may be placed in read-only memory (important for embedded systems), and part of them with constant integral values can be used in contexts where C++ requires an _integral constant expression_[^1]. Thuse, if we want the compilers to ensure that a variable is constant with a value know at compile time, we declare it `constexpr`:

```cpp
int sz;  // non-constexpr variable
...
constexpr auto arraySize1 = sz;  // error: value not known at compilation
std::array<int, sz> data1;       // error: same problem
constexpr auto arraySize2 = 10;  // fine: 10 is compile-time constant
std::array<int, arraySize2> data2; // fine, arraySize2 is constexpr
```

All `constexpr` objects are `const`, but not all `const` objects are `constexpr`, because `const` objects need not be initialized with values known during compilations:

```cpp
int sz;
...
const auto arraySize = sz;  // fine: arraySize is const copy of sz
std::array<int, arraySize>  data; // error: arraySize's value not known at compilation
```



# `constexpr` functions

`constexpr` is part of a functions's interface, which proclaims "I can be used in a context where C++ requires a constant expression." In other words:

* if the values of the arguments we pass to a `constexpr` function are known during compilation, the result will be computed during compilation
* when a `constexpr` function is called with one or more values that are not known during compilation, it acts like a normal function, computing its result at runtime: so that we don't need two functions to perform the same operation.

For example, we want to initialize a `std::array` with the size of 3^n, wher n is a known integer (or can be computed) during compilation. `std::pow` doesn't help here, because 

1. `std::pow` works on floating-point types, while we need an integral result
2. `std::pow` isn't constexpr

Thus, we write the pow we need:

```cpp
constexpr
int pow(int base, unsigned exp) noexcept  // never throws
{
    ...  // impl is below
}

constexpr auto numConds = 5;   // # of conditions
std::array<int, pow(3, numConds)> results; // results has 3^numConds elements
...
auto base = readFromDB("base");  // get the value at runtime
auto exp = readFromDB("exponent"); // ditto
auto baseToExp = pow(base, exp);  // we can also call pow function at runtime, of course
```

In C++11, there're some restrictions on `constexpr` functions: 

1. they may only contain a single return statement
2. they are limited to taking and returning _literal types_[^2]

so the implementation goes like this:

```cpp
constexpr int pow(int base, unsigned exp) noexcept
{
    return (exp == 0 ? 1 : base * pow(base, exp - 1));
}
```

For C++14, the restrictions are substantially looser:

```cpp
constexpr int pow(int base, unsigned exp) noexcept
{
    auto result = 1;
    for (unsigned i = 0; i < exp; ++i) result *= base;
    return result;
}
```

`constexpr` functions can work with user-defined literal types, too:

```cpp
class Point {
public:
    constexpr Point(double xVal = 0, dobule yVal = 0) noexcept
    : x(xVal), y(yVal)
    {}

    constexpr double xValue() const noexcept { return x; }
    constexpr double yValue() const noexcept { return y; }
    constexpr void setX(double newX) noexcept { x = newX; }  // due to "void" return type, 
    constexpr void setY(double newY) noexcept { y = newY;    // setters're contexpr only in C++14
private:
    double x, y;
};

constexpr
Point midpoint(const Point& p1, const Point& p2) noexcept
{
    return { (p1.xValue() + p2.xValue()) / 2,
             (p1.yValue() + p2.yValue()) / 2 };  // call constexpr member funcs
}

constexpr Point reflection(const Point& p) noexcept
{
    Point result;           // create non-const Point
    result.setX(-p.xValue); // set its x and y value
    result.setY(-p.yValue);
    return result;          // return copy of it
}

```

By introducing `constexpr`, we can maximize the range of situation our objects and functions may be used - the traditionally fairly strict line between work done during compilation and work done at runtime begins to blur after we use `constexpr` constructors, `constexpr` getters, `constexpr` setters, `constepxr` non-member functions, and create objects in read-only memory:

```cpp
constexpr Point p1(9.4, 27.7); // "runs" constexpr ctor during compilation
constexpr Point p2(28.8, 5.3); // same
constexpr auto mid = midpoint(p1, p2);  // init constexpr object with result of constexpr func
constexpr auto reflectedMid = reflection(mid);  // reflectedMid's value is known during compilation
```

As a result, the more code taking part in the compilation time, the faster our software will run[^3].

[^1]: Such contexts include specification of array sizes, integral template arguments, enumerator values, alignment specifiers, etc.
[^2]: Literal types: types that can have values determined during compilation. In C++11, all built-in types except `void` qualify, plus some user-defined types whose constructors and other member functions are `constexpr`.
[^3]: Compilation may take longer, however.
