---
title: "Item-30 Understand ins and outs of inlining"
date: 2018-02-21
series:
- effective c++
categories:
- coding
tags:
- technique
- cpp
slug: ins and outs of inlining
autoThumbnailImage: false
thumbnailImagePosition: right
featured_image: 2018/2018-02/2018-02-21.gif
---

Limit most inlining to small, frequently called functions to facilitate debugging and binary upgradability, minimize potential code bloat, and maximize the chances of greater program speed.
<!--more-->
<!-- toc -->

# Performance benifits

Inline functions have some wonderful advantages:

1. They act like functions.
2. Yet we call them without having to incur the overhead of a function call.
3. Compilers might perfom context-specific optimizations (such as stretches of the code) on the body of the inline function thanks to the lack "outlined" function call
4. If an inline function body is _very_ short, the code generated for the function body may be smaller than the code generated for a function call, leading to _smaller_ object code and a higher instruction cache hit rate.

However, on the other hand, it is also likely to increase the size of our object code. Overzealous inlining can give rise to programs too big for the available space on machines with limited memory. Even with virtual memory, inline-induced code bloat can lead to additional paging, a reduced instruction cache hit rate, and the performance penalties that accompany these things.

# Details on inline functions

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

    It's true that both template and inline functions are typically defined in header files, but this doesn't mean that function templates must be inline. In fact, template instantiation is independent of inlining:

    * inline functions must typically be in header files, because most build environments do inlining during compilation. In order to replace a function call with the body of the called function, compilers must know waht the function looks like [^1]. 
    * templates are typically in header file, because compilers need to know what a template looks like in order to instantiate it when it's used [^2].

    Thus, when we're writing a template:  

    * if we belive that all the functions instantiated from the template should be inlined, declare the template `inline` just like what's done with the `std::max` implamentation above; 
    * if we have no reason to want inlined after considering its cost and potential code bloat (which is particularly important for template authors - see item 44), avoid declaring the template inline (either explicitly or implicitly)

## Causes of un-inlined inline function

Bear in mind that `inline` is a _request_ to compilers, rather than a command, so compilers may ignore it. Whether a given inline function is actually inlined depends on the build environment we're using - primarily on the compiler, and most compilers have a diagnostic level that will result in a warning (item 53) if they fail to inline a function we've asked them to. When they refuse to inline a function, the typical reasons may be:

1. compilers deem the function too complicated (e.g., those containing loogs or are recursive)
2. the function is virtual (`virtual` means runtime, while `inline` usually happens before execution)
3. when the program will take the address of an inline function:   

```cpp
inline void f(){...} // assume compilers are willing to inline calls to f
void (*pf)() = f;    // pf points to f
...
f();                 // this call will be inlined, for it's a "normal" call
pf();                // this call probably won't be, for it's through a function pointer
```

## Inline constructors and destructors?

Note that even if we never use function pointers, sometimes compilers will generate those pointers: compilers may generate out-of-line copies of constructors and destructors so that they can get pointers to those functions for use during construction and destruction of objects in arrays. Let alone that constructors and destructors are often worse candidates of inlining than a casual examination would indicate:

```cpp
class Base {
public:
    ...
private:
    std::string bm1, bm2;  // base members 1 and 2
};
```

```cpp
class Derived: public Base {
public:
    Derived(){}   // Derived's ctor is empty, or is it?
    ...
private:
    std::string dm1, dm2, dm3;  // derived members 1,2,3
}
```

The constructor of `Derived` seems empty, so it may seem a good candidate for inlining. But looks can be deceiving: 

>C++ makes various guarantees about object construction and corresponding destruction. To name a few: when we create an object, each base class of and each data member in that object is automatically constructed; if an exception is thrown during construction, any parts of the object that have already been fully constructed are automatically destroyed. Similar but reverse process will occur when an object is destroyed. 

Therefore, in the example above, extra code will be generated by compilers and added into the empty `Derived` constructor in order to offer those guarantees, ending up with some code equivalent to the following conceptual implementation (the real one will certainly be more sophisticated):

```cpp
Derived::Derived()  // conceptual impl. of "empty" Derived ctor
{
    Base::Base();  // init. Base part

    try { dm1.std::string::string(); } // try to construct dm1
    catch (...) {       // if it throws
        Base::~Base();  // destroy base class part and
        throw;          // propagate the exception
    }

    try { dm2.std::string::string();} // try to construct dm2
    catch(...) {                      // if it throws
        dm1.std::string::~string();   // destroy dm1,
        Base::~Base();                // destroy base class part
        throw;                        // and propagate the exception
    }

    try { dm3.std::string::string();}  // try to construct dm3
    catch(...) {                       // if it throws
        dm1.std::string::~string();    // destroy dm1,
        dm1.std::string::~string();    // destroy dm2,
        Base::~Base();                 // destroy base class part
        throw;                         // and propagate the exception
    }
}
```

The same reasoning applies to the `Base` constructor, so if `Base`'s constructor is inlined, and `string` constructor also happens to be inlined, the `Derived` constructor will gain _five_ copies of `string`'s constructor, one for each of the five strings in a `Derived` object - that is a big code bloat. Similar considerations apply to `Derived`'s destructor.

# Other costs of inlining

Apart from the cost of possible code bloat, there are other impact of declaring functions `inline`:

1. **on binary upgradability**: for library designers, it's impossible to provide binary upgrades to the client visible inline functions in a library, after clients of the library compile the body of `inline` function `f` into their application. Once the imlementation of `f` changes, all clients who've used `f` must recompile.
2. **on debugging**: most debuggers have trouble with inline functions: after all, it is hard to set a breakpoint in a function that isn't there[^3].

# To inline or not to inline?

In summary, the logical strategy of determining which functions should be declared inline and which should not:

* initially don't inline anything 
* detect those functions that must be inline (item 46) or are truly trivial (such as `Person::age` in this item), inline them cautiously as a hand-applied optimization
* as the empirically determined rule of 80-20 suggests: identify the 20% of your code that can increase your program's overall performance, and try to tweak those critical functions with `inline` or other techniques

[^1]: There are exceptions: some build environments can inline during linking, and a few can actually inline at runtime (e.g., managed environments based on the .NET Common Language Infrastructure - `CLI`). Of course, such exceptions are not the rule, and inlining in most C++ programs is a compile-time activity.
[^2]: Again, some build environments perform template instantiation during linking. However, compile-time instantiation is more common.
[^3]: Some build environments manage to support debugging of inlined functions, but many environments simply disable inlining for debug builds.
