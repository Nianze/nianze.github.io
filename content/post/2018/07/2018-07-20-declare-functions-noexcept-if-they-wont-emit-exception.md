---
title: "[EMCpp]Item-14 Declare Functions Noexcept if They Won't Emit Exception"
date: 2018-07-20T19:50:39-04:00
categories:
- article
- coding
tags:
- technique
- cpp
slug: Declare Functions Noexcept if They Won't Emit Exception
autoThumbnailImage: true
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-07/20.gif
---

Most functions are exception-neutral, but for some, such as move operations, swap, memory deallocation functions, and destructors, `noexcept` is particularly valuable.
<!--more-->

#### More optimizable

For functions that won't produce exceptions, we have C++98 style as well as C++11 style:

```cpp
int f(int x) throw();   // C++98 style
int f(int x) noexcept;  // C++11 style
```

The difference:

1. C++98: the call stack is unwound to `f`'s caller before program execution is terminated
2. C++11: the call stack is _possibly_ unwound before program execution is terminated

The difference in _possibly_ unwinding leads to large impact on code generation: optimizers need not keep the runtime stack in an unwindable state, and need not ensure that objects in a `noexcept` function are destroyed in the inverse order of construction, both of which optimization flexibility is lacked for `throw()`. In fact, `throw` has the same level of optimizability as functions with no exception specification.

For some functions, `noexcept` is even more desired. For example, calls to copy operations in C++98 will be replaced with calls to move operations in C++11, only if the move operation is declared `noexcept`. Similarly, `swap`s in the Standard Library are `noexcpet` sometimes dependends on whether uesr-defined swaps are `noexcept`. Following is the declarations for the Standard Library's `swap`s for arrays and `std::pair`:

```cpp
template<class T, size_t N>
void swap(T (&a)[N], T (&b)[N]) noexcept(noexcept(swap(*a, *b)));

template<class T1, class T2>
struct pair {
    ...
    void swap(pair& p) noexcept(noexcept(swap(first, p.first)) &&
                                noexcept(swap(second, p.second)));
    ...
};
```

These functions are _conditionally_ `noexcept`: whether they are `noexcept` depends on whether the expression inside the `noexcept` clauses are `noexcept`. The fact that swapping higher-level data structures can generally be `noexcept` only if swapping their lower-level constituents is `noexcept` should be reasonable enough to offer `noexcept` `swap` functions whenever we can.

#### Exception Neutral Functions

`noexcept` is part of a function's interface, so we should declare a function `noexcept` only if we are willing to commit to a `noexcept` implementation over the long term. 

However, most functions are _exception-newtral_: they throw no exceptions themselves, but functions they call might emit one. Such functions are never `noexcept`, because they may emit such "just passing through" exceptions, and thus they lack the `noexcept` designation on purpose.

For some other few functions, on the other hand, being `noexcept` is so important that, in C++11, they are implicitly `noexcept`: by default, all memory deallocation functions and destructors (both user-defined and compiler-generated) are `noexcept`.

#### Wide Contracts vs Narrow Contracts

A function with a wide contract has no preconditions: they can be called regardless of the state of the program, with no constraints on the arguments that callers pass it, and never exhibit undefined behavior.

Functions withou wide contracts have narrow contract: if a precondition is violated, results are undefined.

Generally, library desingers reserve `noexcept` for functions with wide contracts, so that if a precondition in a narrow contract is violated, the program may throw a  "precondition was violated" exception, instead of letting the program to terminate. 

If we're writing a function with a wide contract and we know it won't emit exceptions, just declare it `noexcept`.

#### Backward compatibility

So much legacy code is not decalred with `noexcpet` even though they actually never emit exceptions. For the reason of backward compatibility, `noexcept` functions calling non-`noexcept` functions are permitted in C++, and compilers generally don't issue warnings about it:

```cpp
void setup();    // legacy code defined elsewhere
void cleanup();  // without declaring noexcept

void doWork() noexcept
{
    setup();
    ...
    clean();
}
```