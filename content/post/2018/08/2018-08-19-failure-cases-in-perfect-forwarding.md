---
title: "[EMCpp]Item-30 Failure Cases in Perfect Forwarding"
date: 2018-08-19T16:10:34-04:00
categories:
- technology
- coding
tags:
- technique
- cpp
slug: Failure Cases in Perfect Forwarding
autoThumbnailImage: true
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-08/19.gif
---

Perfect forwarding fails when template type deduction fails or when it deduces the wrong type.
<!--more-->

Generally, forwarding means passing parameters that are _references_ so that we can work with the originally-passed-in objects in another function, while perfect forwarding means we will use _universal references_ to keep track of salient characteristics such as lvalue-ness/rvalue-ness, const-ness, volatile-ness, etc.

The definition of failure is: given a target function `f`, and a forwarding function `fwd`, perfect forwarding _fails_ if calling `f` with a particular argument does one thing, but calling `fwd` with the same argument does something difference:

```cpp
f( expression );
fwd( expression );

template<typename T>
void fwd(T&& param)  // accept any argument
{
    f(std::forward<T>(param));
}
```

Following kinds of arguments will lead to perfect forwarding failure:

* **braced initializers**: passing a braced initializer to a function template parameter that’s not declared to be a std::initializer_list is decreed to be a “non-deduced context,” as the Standard puts it
* **null pointers expressed as `0` or `NULL`**: refer to the explanation in EMCpp item 8
* **declaration-only integral `const static` data members**: since compilers perform _const propagation_ on such members' values, there's no memory allocation procedure for them, no address associated with them, and thus no pointers/references, ending up with a linking error.
* **template and overloaded function names**: `f`'s declaration lets compilers figure out the required vertion of overload/template instantiation to be passed, but it's impossible for compilers to determine which version should be passed to `fwd`
* **bitfields**: "A non-const reference shall not be bound to a bit-field," as C++ standard condemns
