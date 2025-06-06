---
title: "Item-1 Prefer consts, enums and inlines to #defines"
date: 2018-01-16T18:41:58-05:00
series:
- effective c++
categories:
- coding
tags:
- technique
- cpp
slug: start of effective cpp series
autoThumbnailImage: false
thumbnailImagePosition: right
featured_image: 2018/2018-01/2018-01-16.jpg
---

A new (hopefully) daily review on `C++`.
<!--more-->
<!-- toc -->

This is another new series, which I plan to update daily (well, hopefully :P). It's mainly about `C++`, which is my current main development language. Each day I'll follow 1 item in the _Effective C++ 2nd edition_ by [Scott Meyers](https://www.aristeia.com/books.html) to discuss 1 tiny point of `C++`.

The item 1 of the book tells us when we should prefer the compiler to the preprocessor, or more specifically, why we should prefer `const`s, `enum`s and `inline`s to `#define`. Now let's take a closer look.

# Prefer `const` to `#define`

There are two ways we may consider, when we want to define a constant:

```cpp
// method one
#define PI_1 3.1415926
// method two
const double PI_2 = 3.1415926;
```

However, since `PI_1` may be removed by preprocessor and never be seen by compilers, making it absent in the symbol table, this can be confusing during debugging if we get an error refering to 3.1415926 rather than `PI_1` (especially when `PI_1` is defined in a header file written by somebody else). Thus, instead of using a preprocessor macro, we'd better go with `const`. Below is some tricks with `const`.

## Tricks on `const` definition

1. When defining constant pointers, use two `const` to make sure both the pointer as well as the content pointed by the pointer are immutable:

    ```cpp
    const char * const blogger = "Nzo";
    ```

2. For class-specific constants, of which we want to limit the scope, we declare it as a `static` member, since there's no way we may create a class-scope-specific or class-encapsulated(i.e., private) constant using a `#define` (once a macro is defined, it's in force for the rest of the compilation unless it's `#undefed` somewhere along the line). Pay attention to the difference between constant declaration and constant definition:

    ```cpp
    // game.h
    class GamePlayer {
    private:
        static const int NUM_TURNS = 5;  // constant declaration with initial value
        static const double PI;          // constant declaration without initial value
        int scores[NUM_TURNS];           // use of constant
    };
    ```

    ```cpp
    // game.cpp
    const int GamePlayer::NUM_TURNS;     // constant definition in impl. file
    const double GamePlayer::PI = 3.14;  // provide initial value at definition
    ```

    It's worth noting that older compilers (primarily those written before 1995) may complain about providing initial value for static class member at the point of _declaration_. Most of time we may solve the problem by putting the initial value at _definition_ time, but in the situation where we need the integral value of NUM_TURNS during compilation time (in the example above, compilers must know the size of the array during compilation), we may use a trick affectionately known as **the enum hack**, which takes advantage of the fact that the value of an enumerated type can be used where `int`s are expected:

    ```cpp
    // Game.h
    class GamePlayer {
    private:
        enum { NUM_TURNS = 5 };          // NUM_TURNS is a symbolic name for 5        
        int scores[NUM_TURNS];           // fine with old compilers
    };
    ```

    There are mainly 2 reasons we may still see the enum hack today:
    
    1. It's legal to take the address of a `const`, but it's not legal to take the address of an enum, so if you don't want people to get a pointer or reference to your integral constants, an enum will enforce that constraint (and this makes the enum behave somewhat like a #define).
    2. It's purely pragmatic. Lots of code (such as template metaprogramming, item 48) still employs it.

    For modern compilers, on the other hand, rules change a bit in a more convenient way. Usually C++ requires that you provide a difinition for anything you use, but class-specific `constant`s that are `stitic` and of `integral type` (e.g., _integers_, _chars_, _bools_) are an exception. As long as you don't take thier address, you can declare and read them **without** providing a definition, and (good) compilers will not allocate unneccessary memory for these integral-type const objects, which will make the static const integral an lvalue.

# Prefer `inline` to `#define`

Another common (mis)use of the `#define` is using it to implement macros that look like functions:

```cpp
#define max(a,b) ((a) > (b) ? (a) : (b))
```

This macro will lead to following weird things:

```cpp
int a = 5, b = 0;
max(++a, b);     // a increments twice
max(++a, b+10);  // a increments once
```

Thus, we may prefer using a regular inline function that provides both predictable behavior and type-safety:

```cpp
inline int max(int a, int b) { return a > b ? a : b; }
```

If you complain that the above inline function only deals with `int` type, then we may just use inline template function, which nicely fixes the problem:

```cpp
template<typename T> 
inline const T& max (const T& a, const T& b) { return a > b ? a : b; }
// since we don't know what T is, 
// we pass by reference-to-const, see item 20
```

Basically, this template generates a whole family of functions, each of which takes two objects convertible to the same type and returns a reference to the greater of the two objects in const version.

# When to use preprocessor

However, preprocessor is never dead. We still need preprocessor for tasks such as `#include` to include libraries, as well as `#ifdef`/`#ifndef` to control compilation.
