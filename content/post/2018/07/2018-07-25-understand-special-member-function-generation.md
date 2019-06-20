---
title: "[EMCpp]Item-17 Understand Special Member Function Generation"
date: 2018-07-25T20:26:53-04:00
categories:
- technology
- coding
tags:
- technique
- cpp
slug: Understand Special Member Function Generation
autoThumbnailImage: true
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-07/25.gif
---

The special member functions are those ccompilers may generate on their own: default constructor, destructor, copy operations, and move operations.
<!--more-->
<!-- toc -->

The rules in C++11:

* Default constructor: Generated only if the class contains no user-declared constructors. (Same as C++98)
* Destructor: Destructors are `noexcept` by default (see EMCpp item 14). Other rules are essentially the same as C++98.
* Copy constructor
    - Runtime behavior: same as C++98: memberwise copy construction of non-static data members
    - Generated only if the class lacks a user-declared copy constructor.
    - Generation is deprecated if the user declares a copy assignment operator or destructor.
    - Deleted if the class declares a move operation.
* Copy assignment operator
    - Runtime behavior: same as C++98: memberwise copy assignment of non-static data members.
    - Generation is deprecated if the user declares a copy constructor or destructor.
    - Deleted if the class declares a move operation.
* Move constructor and Move assignment operator:
    - Runtime behavior: memberwise moving of non-static data members
    - Generated only if the class lacks user-declared copy operations, move operations, and destrutor.

# Use of "=default"

The default implementation for special member functions inside a base class is correct. Since we have to explicitly declare the base destructor as `virtual` to avoid undefined or misleading results that often occurs in polymorphic inheritance, using  "=default" will be a good way to express the suppressed default implementation of the move and/or copy operations:

```cpp
class Base {
public:
    virtual ~Base() = default;   // make dtor virtual

    Base(Base&&) = default;   // support moving
    Base& operator=(Base&&) = default; 

    Base(const Base&) = default;  // support copying
    Base& operator=(const Base&) = default;
};
```

# Member function templates

Note that there's nothing in the rules about the existence of a member function template preventing compilers from generating the special member functions:

```cpp
class Widget {
    ...
    template<typename T>
    Widget(const T& rhs);   // construct Widget from anything

    template<typename T>
    Widget& operator=(const T& rhs);  // assign Widget from anything
    ...
};
```

Assuming the usual conditions governing special member functions are fulfilled, compilers will still generate copy and move operations for `Widget` even though these templates could be instantiated to produce the signatures for the copy constructor and copy assignment operator (when `T` is `Widget`). Refer to EMCpp item 26 for cases that have important consequences.
