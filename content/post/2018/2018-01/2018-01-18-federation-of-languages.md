---
title: "Item-0 Federation of languages"
date: 2018-01-18T20:01:47-05:00
categories:
- article
- coding
tags:
- technique
- cpp
slug: cpp is multiparadigm
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-01/2018-01-18.jpg
---

C++ is a multiparadigm programming langrage.
<!--more-->

Instead of regarding `C++` as a single language, we'd better treat it as a federation of related languages, where rules within a particular sublanguage tend to be simple and straightforward, while rules between sublanguages may change. 

Basically, there are four primary sublanguages:

1. `C`: Based on ideas of blocks, statements, the preprocessor, built-in data types, arrays, pointers, etc, rules of C style C++ are simple: no templates, no exceptions, no overloading, etc.
2. `Object-Oriented C++`: Based on ideas of classes(including constructors and destructors), encapsulation, inheritance, polymorphism, virtual functions(dynamic binding), etc, style of this part of C++ goes with the classic Object-Oriented design rules.
3. `Template C++`: this is generic programming part of C++, where template considerations pervade C++. Due to its great power, templates give rise to a completely new programming paradigm, _template metaprogramming(TMP, item 48)_.
4. `The STL`: With beautifully meshing conventions of containers, iterators, algorithms and function objects, the STL is a very special template library and has its particular ways of doing things.

There's an interesting comparison among the four sublanguages: pass-by-value is generally preferred to pass-by-reference for built-in (i.e., `C-style`) types in favor of its higher efficiency, but for `Object-Oriented C++` pass-by-reference will usually be better due to the consideration of user-defined constructors and destructors; pass-by-reference is especially the dominant usecase in `template C++` for you don't even know the type of object you're dealing with; however, the old C pass-by-value rule applies to the case of `STL`, because iterators and function objects are modeled on pointers in C (see item 20).

In summary, rules for effective C++ programming vary, depending on the part of C++ you are using.

>P.S.: Today I found that the 3rd edition of _effective C++_ added some new items. So new posts will follow the third edition's arrangement. This item 0 is supposed to be item 1 in 3rd edition, but I just put it in front of the item 1 which I already wrote. After all, that's how programmers count :)