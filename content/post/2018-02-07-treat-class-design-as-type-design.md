---
title: "Item-19 Treat class design as type design"
date: 2018-02-07T13:47:07-05:00
categories:
- article
- coding
tags:
- technique
- cpp
slug: class design is type design
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018-02-07.jpg
---

Before definining a new type, be sure to consider all the issues discussed in this item.
<!--more-->

In object-oriented programming wolrd, defining a new class defines a new type, yet designing good types is challenging. Good types have a natural syntax, intuitive semantics, and one or more efficient implementations. To disign effective classes, we must understand the issues we face, and ask ourselves the following questions to constrain the design:

* How should objects of the new type be created and destroyed?  
    This influences the desiggn of the class's constructors and destructors, as well as memory allocation and deallocation functions(`operator new`, `operator new[]`,`operator delete`,`operator delete[]`)

* How should object initialization differ from object assignment?  
    Thie determines the behavior of constructor (for initialization) and assignment operator (for assignment).

* What does it mean for objects of the new type to be passed by value?  
    Copy constructor defines how pass-by-value is implemented for a type.

* What are the restrictions on legal values for the new type?  
    Valid combinations of values for a class's data member may require some error checking inside member functions such as constructors, assignment operators, and "setter" functions. It may also affect the exceptions (as well as related exception specification) thrown by member functions.

* Does the new type fit into an inheritance graph?  
    If the class is inherited from existing classes, it is constrained by the base class (particularly by base class's design on `virtual` or `non-virtual`, item 34, 36). If the class will be base class of other classes, we should consider whether to declare the functions as `virtual` or not (especially the destructor, item 7).

* What kind of type conversions are allowed for the new type?  
    - If we wish to allow object of type `T1` to be _implicitly_ converted into objects of type `T2`, we need to write either a type conversion function in class `T1` (e.g., `operator T2`) or a non-`explicit` constructor in class `T2` that can be called with a single argument.   
    - If we wish to allow _explicit_ conversions only, we need to write functions to perform the conversions and avoid making type conversion operators or non-`explicit` constructors with only one argument (item 15).

* What operators and functions make sense for the new type?  
    This determines which functions will be member functions and which not (item 23, 24, 46).

* What standard functions should be disallowed?  
    This determines the standard functions declared as `private` (item 6).

* Who should have access to the members of the new type?  
    This determines if a member is `public`, `protected`, or `private`. It also determines which classes and/or functions should be `friend`s, as welll as to nest one class inside another.

* What is the "undeclared interface" of the new type?  
    This guarantees the performance, exception safety (item 29), and resource usage (e.g., locks and dynamic memory) clients will expect, which will impose constraints on the class implementation.

* How general is the new type?  
    If we're defining a whole family of types, we may want to define a new class `template` instead of a new class.

* Is a new type really what we need?  
    If a new derived class is only added into some functionality to an existing class, maybe a simple definition of one or more non-member functions or templates will be better approach.

Once these questions solved properly, user-defined classes in C++ yield types that are at least as good as the built-in types, which makes all the effort worthwhile.