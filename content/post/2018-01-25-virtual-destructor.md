---
title: "Item-7 Declare destructor virtual in polymorphic base classes"
date: 2018-01-25T18:04:14-05:00
categories:
- article
- coding
tags:
- technique
- cpp
slug: virtual dtor in polymorphic base class
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018-01-25.jpg
---

If a class has any virtual functions (for polymorphic purpose), it should have a virtual destructor.
<!--more-->

In the convention of factory functions, we use base class pointers manipulating derived class objects during runtime, which gives us the convenience of polymophism.

Because C++ specifies that when a derived class object is deleted through a pointer to a base class with a non-virtual destructor, results are undefined, we need to declare the destructor as _virtual_. Otherwise, what typically happens at runtime is that, while base class data members get destroyed, the derived part of the object (i.e., the data members declared in the derived class) is never destroyed, ending with a curious "partially destroyed" object that is an excellent way to leak resources, corrupt data structures, and waste time debugging.

Basically, the implementation of virtual functions requires that objects carry a pointer (called a `vptr`, virtual table pointer) accessible at runtime to determine which virtual functions should be invoked on the object. The `vptr` points to `vtbl` (virtual table), which is an array of function pointers to appropriate actual functions.

Sometimes we may want to create an _abstract_ class (which contains pure _virtual_ functions) but don't have any pure virtual functions in mind, we may simply make a pure _virtual_ destructor:

```cpp
class AWOV {  // "Abstract w/o Virtuals"
public:
    virtual ~AWOV() = 0;  // declare pure virtual destructor
};
```

Since `AWOV` has a pure virtual function, it's abstract as we wish while also benifits us with not worrying about the derived class destructor problem at the same time, but there's one twist: **a definition of the pure virtual destructor must still be provided:**

```cpp
AWOV::~AWOV() {}  // definition of pure virtual destructor
```

Otherwise the linking will complain, because compilers will generate a call from derived classes' destructors to each base class, all the way up to `~AWOV`, yet the body of base class destructor function can't be found.

However, not all base classes are designed to be used polymorphically. For classes not designed to be base classes (std::string, STL container types such as vector, list, set, etc.) or not designed to be used polymorphically (item 6, `Uncopyable` class), we should not declare _virtual_ destructors. Here is an example:

```cpp
class Point { // a 2D point
public:
    Point(int xCoord, int yCoord);
    ~Point();
private:
    int x, y;
};
```

If an `int` occupies 32 bits, a `Point` object typically fits into a 64-bit register, which can be passed as a 64-bit quantity to functions written in other languages such as C or FORTRAN. However, if `Point`'s destructor is declared _virtual_, `Point` object will increased from 64 bits (for the 2 `int`s) to 96 bits (for 2 `int`s with the `vptr`) on 32-bit architecture, or to 128 bits on 64-bit architecture (where pointers are 64 bits in size). As a result, portability decreases. 

In short words, gratuitously declaring all destructors _virtual_ is just as wrong as never declaring them _virtual_; declare a _virtual_ destructor in a class **if and only if** that class contains at least one virtual function.