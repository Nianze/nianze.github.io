---
title: "[MECpp]Item-15 Understand the Costs of Exception Handling"
date: 2018-04-09T18:10:06-04:00
categories:
- technology
- coding
tags:
- technique
- cpp
slug: Understand the Costs of Exception Handling
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-04/2018-04-09.gif
---

Exception handling has costs, and we pay at least some of them even if we never use the keywords `try`, `throw`, or `catch`.
<!--more-->

* If we never use any exception-handling features: 
    * we pay for the space used by the data structures needed to keep track of which objects are fully constructed (MECpp item 10)
    * we pay for the time needed to keep these data structures up to date
    * Programs compiled with support for exceptions are typically slower and larger than their counterparts compiled without support for exceptions

* If we include `try-catch` blocks:
    * the cost varies from compiler to compiler. 
    * roughly, the overall code size increases by 5-10%, assuming no exceptions are thrown
    * roughly, the overall runtime goes up by 5-10%, assuming no exceptions are thrown

* If we include exception specifications:
    * they generally incurs about the same cost as a `try` block

* The cost of throwing an exception:
    * Compared to a normal function return, returning from a function by throwing an exception may be as much as _three orders of magnitude_ slower

### Solution

To minimize the exception-related costs,

* compile without support for exceptions when that is feasible; 
* limit the use of `try` blocks, and exception specifications to locations where we really need them;
* throw exceptions only under conditions that are truly exceptional;
* profile the software (MECpp item 16) to determine if exception support is the bottleneck
    * If it is, consider switching to different compilers, ones that provide more efficient implementations of C++'s exception-handling features.
