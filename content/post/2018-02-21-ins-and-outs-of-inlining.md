---
title: "Item-30 Understand ins and outs of inlining"
date: 2018-02-21T22:33:05-05:00
categories:
- article
- coding
tags:
- technique
- cpp
slug: ins and outs of inlining
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-02/2018-02-21.gif
---

Limit most inlining to small, frequently called functions to facilitate debugging and binary upgradability, minimize potential code bloat, and maximize the chances of greater program speed.
<!--more-->

## Performance benifits

Inline functions have some wonderful advantages:

1. Tthey act like functions.
2. We call them without having to incur the overhead of a function call.
3. Compilers might perfom context-specific optimizations on the body of the function (stretches of the code).
4. If an inline function body is _very_ short, the code generated for the function body may be smaller than the code generated for a function call, leading to _smaller_ object code and a higher instruction cache hit rate.

However, on the other hand, it is also likely to increase the size of our object code. Overzealous inlining can give rise to programs too big for the available space on machines with limited memory. Even with virtual memory, inline-induced code bloat can lead to additional paging, a reduced instruction cache hit rate, and the performance penalties that accompany these things.

## Details on inline functions

There are two ways to give such a request: implicitly or explicitly:

1. Implicitly inline request
    ```cpp
    class Person {
    public:
        ...
        int age() const { return theAge; } // an implicit inline request
        ...
    private:
        int theAge;
    };
    ```
    Apart from the member functions, we can also define friend functions inside classes (item 46), resulting to implicitly inline declaration.

2. Explicitly inline request (and its relationship with template)
    We can explicitly daclare an inline function with the `inline` keyword, such as how the standard `max` template from `<algorithm>` is implemeted:

    ```cpp
    template<typename T>   // an explicit inline
    inline const T& std::max(const T& a, const T& b) // request:: std::max is preceded by "inline"
    { return a < b ? b : a;}
    ```

    It's fact that both template and inline functions are typically defined in header files, but this doesn't mean that function templates must be inline. In fact, template instantiation is independent of inlining:

    * inline functions must typically be in header files, because most build environments do inlining during compilation. In order to replace a function call with the body of the called function, compilers must know waht the function looks like [^1]. 
    * templates are typically in header file, because compilers need to know what a template looks like in order to instantiate it when it's used [^2].

    Thus, when we're writing a template:
    * if we belive that all the functions instantiated from the template should be inlined, declare the template `inline` just like what's done with the `std::max` implamentation above; 
    * if we have no reason to want inlined after considering its cost and potential code bloat (which is particularly important for template authors - see item 44), avoid declaring the template inline (either explicitly or implicitly)

### Causes of un-inlined inline function

Bear in mind that `inline` is a _request_ to compilers, instead of a command, so compilers may ignore it. Whether a given inline function is actually inlined depends on the build environment we're using - primarily on the compiler, and most compilers have a diagnostic level that will result in a warning (item 53) if they fail to inline a function we've asked them to. When they refuse to inline a function, the typical reasons may be:

1. compilers deem the function too complicated (e.g., those containing loogs or are recursive)
2. the function is virtual (`virtual` means runtime, while `inline` usually happens before execution)
3. when the program will take the address of an inline function

## Impact on binary upgradability


## Impact on debugging

## To inline or not to inline?


[^1]: There are exceptions: some build environments can inline during linking, and a few can actually inline at runtime (e.g., managed environments based on the .NET Common Language Infrastructure - `CLI`). Of course, such exceptions are not the rule, and inlining in most C++ programs is a compile-time activity.
[^2]: Again, some build environments perform template instantiation during linking. However, compile-time instantiation is more common.