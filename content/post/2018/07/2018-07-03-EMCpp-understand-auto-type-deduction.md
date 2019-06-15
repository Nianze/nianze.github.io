---
title: "[EMCpp]Item-2 Understand Auto Type Deduction"
date: 2018-07-03T10:07:13-04:00
categories:
- technology
- coding
tags:
- technique
- cpp
slug: Understand Auto Type Deduction
autoThumbnailImage: true
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-07/03.gif
---

`auto` type deduction is usually the same as template type deduction, with an exception in the case of braced initializer. Also, in C++14, as a function return type or a lambda parameter, `auto` implies template type deduction instead of `auto` type deduction.
<!--more-->

With only one curious exception, `auto` type deduction _is_ template type deduction. In the case of general function template form and its general function call:

```cpp
template<typename T>
void f(ParamType param);
f(expr);  // general call
```

compilers use `expr` to deduce types for `T` and `ParamType`. Similarly, in the case where a variable is declared using `auto`, `auto` plays the role of `T`, and the type specifier for the variable acts as `ParamType`.

Therefore, there are also three cases based on the type specifier:

* Case 1: the type specifier is a pointer or reference, but not a universal reference
* Case 2: the type specifier is a universal reference
* Case 3: the type specifier is neither a pointer nor a reference

For example:

```cpp
auto x = 27;  // case 3. type specifier is simply auto by itself.
const auto cx = x; // case 3. type specifier is const auto.
const auto& rx = x; // case 1. type specifier is const auto&. 
// case 2:
auto&& uref1 = x; // x is int and lvalue, so uref1's type is int&
auto&& uref2 = cx; // cx is const int and lvalue, so uref2's type is const int&
auto&& uref3 = 27; // 27 is int and rvlue, so uref3's type is int&&
// array and function names decay into pointers for non-ref type specifiers:
const char name[] = "R. N. Briggs"; // name's type is const char [13]
auto arr1 = name;  // arr1's type is const char*
auto& arr2 = name;  // arr2's type is const char (&)[13]
void someFunc(int, double); // someFunc is a function, type is void(int, double)
auto func1 = someFunc; // func1's type is void (*)(int, double)
auto& func2 = someFunc; // func2's type is void (&)(int, double)
```

#### Exception: uniform initialization

C++98 provides two syntactic choices when we want to declare an int with an initial value:

```cpp
int x1 = 27;
int x2(27);
```

By introducing uniform initialization, C++11 adds these two forms:

```cpp
int x3 = { 27 };
int x4{ 27 };
```

As EMCpp 5 explains, there are advantages to declare variables using `auto`, so we may prefer:

```cpp
auto x1 = 27;  // type is int, value is 27
auto x2(27);   // ditto
auto x3 = { 27 };  // type is std::initializer_list<int>, value is {27}
auto x4{ 27 };  // ditto
```

However, after this modification, while the first two statements do declare a variable of type `int` with value 27, the second two actually declare a variable of type `std::initializer_list<int>` containing a single element with value 27.

In fact, when an auto-declared variable is initialized with a braced initializer, `auto` will assume that the braced initilizer represents a `std::initializer_list`, which itself is a template for some type `T`, so there are actually two kinds of type deduction taking place:

1. `auto` type deduction: the type is an instantiation of `std::initializer_list`
2. template type deduction: the type `T` in `std::initializer_list<T>`

**The only real difference between `auto` and template type deduction is the assumption that a braced initializer represents a `std::initializer_list`.** This lead to some interesting results:

```cpp
auto x = { 11, 23, 9 };  // x's type is std::initializer_list<int>

template<typename T>
void f1(T param);
f1({ 11, 23, 9 });  // error! can't deduce type for T. Do not recognise the type for braced initializer

template<typename T>
void f2(std::initializer_list<T> initList);
f({ 11, 23, 9 });  // T deduced as T, and initList's type is std::initializer_list<int>
```

#### More exceptions in C++14

C++14 permits to use `auto` as a function's return type as well as in lambda parameter declarations. However, these uses of `auto` employ _tamplate type deduction_, not `auto` type deduction - so a braced initializer won't imply the type of `std::initializer_list` automatically, and following statement won't compile:

```cpp
// auto in return type
auto createInitList()
{
    return { 1, 2, 3 };  // error: can't deduce type for { 1, 2, 3 }
}

// auto in a parameter type specification in a C++14 lambda
std::vector<int> v;
...
auto resetV = [&v](const auto& newValue) { v = newValue; };  // C++14 lambda, second auto is in parameter list
...
resetV({ 1, 2, 3 }); // error: can't deduce type for { 1, 2, 3 }
```
