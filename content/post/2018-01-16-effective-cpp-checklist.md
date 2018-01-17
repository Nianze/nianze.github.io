---
title: "Effective C++ Checklist"
date: 2018-01-16T18:41:58-05:00
draft: true
categories:
- article
- coding
tags:
- technique
- cpp
slug: start of effective cpp series
#autoThumbnailImage: false
#thumbnailImagePosition: right
#thumbnailImage: /images/2018-01-04-ml.png
---

A new (hopefully) daily review on `C++`.
<!--more-->

This is another new series, which I plan to update daily (well, hopefully :P). It's mainly about `C++`, which is my current main development language. Each day I'll follow 1 item in the _Effective C++ 2nd edition_ by [Scott Meyers](https://www.aristeia.com/books.html) to review 1 aspect in `C++`. Here we go with item 1: prefer `const` & `inline` to `#define`, which can also be described as `Prefer the compiler to the preprocessor.` Let's take a closer look.

### Prefer `const` to `#define`

If we want to define a constantant, there are two ways we may consider:

```cpp
#define PI_1 3.1415926
const double PI_2 = 3.1415926;
```

However, since `PI_1` may be removed by preprocessor and never be seen by compilers, making it absent in the symbol table, this can be confusing during debugging if we get an error refering to 3.1415926 rather than `PI_1` (especially when `PI_1` is defined in a header file written by somebody else). Thus, instead of using a preprocessor macro, we'd better go with `const`. Below is some tricks with `const`.

#### Tricks on `const` definition

1. When defining constant pointers, use two `const` to make sure both the pointer as well as content pointed by the pointer are immutable:

    ```cpp
    const char * const blogger = "Nzo";
    ```

2. For class-specific constants, of which we want to limit the scope, we declare it as a `static` member, pay attention to the difference between constant declaration and constant definition:

    ```cpp
    // Game.h
    class GamePlayer {
    private:
        static const int NUM_TURNS = 5;  // constant declaration with initial value
        static const double PI;          // constant declaration without initial value
        int scores[NUM_TURNS];           // use of constant
    }
    ```

    ```cpp
    // Game.cpp
    const int GamePlayer::NUM_TURNS;     // constant definition in impl. file
    const double GamePlayer::PI = 3.14;  // provide initial value at definition
    ```

    However, older compilers (primarily those written before 1995) may complain about providing initial value for static class member at the point of declaration. Most of time we may solve the problem by putting the initial value at definition time, but in the situation where we need the integral value of NUM_TURNS during compilation time (in the example above, compilers must know the size of the array during compilation), we may use a trick affectionately known as **the enum hack**, which takes advantage of the fact that the value of an enumerated type can be used where `int`s are expected:

    ```cpp
    // Game.h
    class GamePlayer {
    private:
        enum { NUM_TURNS = 5 };          // NUM_TURNS is a symbolic name for 5        
        int scores[NUM_TURNS];           // fine
    }
    ```
### Prefer `inline` to `#define`

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

Thus, we may prefer using a regular inline function that provides both predictable behavior and typesafety:

```cpp
inline int max(int a, int b) { return a > b ? a : b; }
```

However, the above inline function only deals with `int` type. Then we just use inline template function, which nicely fixes the problem:

```cpp
template<class T>
inline const T& max (const T& a, const T& b) { return a > b ? a : b; }
```

Basically, this template generates a whole family of functions, each of which takes two objects convertible to the same type and returns a reference to the greater of the two objects in const version.

### When to use preprocessor

We still need preprocessor for tasks such as `#include <iostream>` to include libraries, as well as `#ifdef`/`#ifndef` to control compilation.