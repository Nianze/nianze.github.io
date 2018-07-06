---
title: "[EMCpp]Item-3 Understand Decltype"
date: 2018-07-05T18:59:39-04:00
categories:
- article
- coding
tags:
- technique
- cpp
slug: Understand Decltype
autoThumbnailImage: true
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-07/05.gif
---

`decltype` almost always yields the type of a variable or expression without any modifications. For lvalue expressions of type T other than names, `decltype` always reports a type of T&. 
<!--more-->

The primary use of `decltype` is declaring function templates where the function's return type depends on its parameter types. For example, the indexing operator `[]` on a containedr of objects of type `T` typically return `T&`, but in the case of `std::vector<bool>`, `operator[]` returns a brand new object (refer to EMCpp item 6 for whys and hows). In order to let compiler deduce the return type, we can use `decltype`:

```cpp
// C++14 version
template<typename Container, typename Index>
decltype(auto) authAndAccess(Container&& c, Index i)
{
    authenticateUser();
    return std::forward<Container>(c)[i];
}
```

A few points worth noting here:

* return type is `decltype(auto)`[^1] instead of `auto`. As EMCpp item 2 points out, compilers employ template type deduction for functions with an `auto` return type. If using `auto`, the reference-ness will be stripped off, so `T&`, which is the type returned by `operator[]` in most cases, will be deduced as `T`. This is not what we want.
* universal refrences for the first parameter is used here. As EMCpp item 24 explains, this makes the reference paramter `c` be able to bind to both lvalues and rvlues[^2]. Following the exmpale of the Standard Library for index values, we stick with pass-by-value for `i` though.
* the `std::forward` is applied to the universal reference in accord with EMCpp item 25's admonition.
* in C++11, `auto` is not permitted as return types for non-lambda functions, so we need the _trailing return type_ syntax to tell the compiler that the function's return type will be declared following the parameter list (after the "->"), which give us the advantage to use the function's parameters (`c` and `i` here) in the specification of the return type:

    ```cpp
    // C++11 version
    template<typename Container, typename Index>
    auto authAndAccess(Container&& c, Index i)
        -> decltype(std::forward<Container>(c)[i])
    {
        authenticateUser();
        return std::forward<Container>(c)[i];
    }
    ```

#### Exceptions

As mentioned in the begining, `decltype` _almost_ always produces the type we expect - it means that there are exceptions to the rule. We're unlikely to encounter these exceptions unless we're a heavy-duty library implementer. 

For example, `decltype` generally ensures that the type induced for lvalue expressions more complicated than names is an lvalue reference. Since the type of most lvalue expressions inherently includes an lvalue reference qualifier (for example, functions returning lvalues always return lvalue references), this property seldom has any impact. However, a seemingly trivial change in the way we write a `return` statement can affect the deduced type for a function:

```cpp
decltype(auto) f1()
{
    int x = 0;
    ...
    return x;  // decltype(x) is int, so f1 returns int
}

decltype(auto) f2()
{
    int x = 0;
    ...
    return (x);  // decltype((x)) is int&, so f1 returns int&
}
```

C++ defines the expression `(x)` to be an lvalue, which is also an expression more complicated than a variable name `x`, so `decltype((x))` is `int&`, leading to different return types in `f1` and `f2`. Moreover, `f2` returns a reference to a local variable, which means undefined behavior that we don't want.

#### Summary

The lesson we learn from the above example is to pay close attention when using `decltype(auto)`. The techniques described in EMCpp item 4 may help ensure that the deduced type is what we expect.

Meanwhile, don't lose sight of the bigger picture: in most normal cases where `decltype` is applied to names, `decltype` does just what it sounds like: it reports that name's declared type.

[^1]: The use of `decltype(auto)` is not limited to function return types. We can use is for declaring variables. For example, given `const Widget&` type variable `cw`, `auto myWidget1 = cw;` will employ auto type deduction and deduce `myWidget1` as type of `Widget`, while `decltype(auto) myWidget2 = cw;` uses decltype type deduction, leading to `myWidget2`'s type as `const Widget&`.
[^2]: Supporting the use of rvalue is basically supporting such a function that a client might simply make a copy of an element in the temporary container. Otherwise, an rvalue container (a.k.a. a temporary object) would typically be destroyed at the end of the statement containing the call to `authAndAccess`, which means that a reference to an element in that container (typically what `authAndAccess` would return in the most cases) would dangle at the end of the statement.