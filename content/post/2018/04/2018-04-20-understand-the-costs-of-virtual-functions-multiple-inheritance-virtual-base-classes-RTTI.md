---
title: "[MECpp]Item-24 Understand the Costs of Virtual Functions, Multiple Inheritance, Virtual Base Classes, and RTTI"
date: 2018-04-20T15:32:45-04:00
categories:
- technology
- coding
tags:
- technique
- cpp
slug: Costs of Virtual Functions Multiple Inheritance Virtual Base Classes and RTTI
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-04/2018-04-20.gif
---

It's important to have a basic understanding of the cost of some C++ features that can have a noticeable impact on the size of objects and the speed at which member functions execute.
<!--more-->

## Virtual Functions

Virtual function feature in C++ gives us the ability to execute the code corresponding to the dynamic type of the object on which the virtual function is invoked. Most implementations use _virtual tables_ (_vtbls_) and _virtual table pointers_ (_vptrs_). 

#### Cost of vtbl

A vtble is usually an array of pointers to functions. Each class that declares or inherits virtual functions has its own vtbl, which holds pointers to the implementations of the virtual functions for that class.

For example:

```cpp
class C1 {
public:
    C1();  // nonvirtual func
    virtual ~C1();  // virtual func
    virtual void f1();  // virtual func
    virtual int f2(char c) const;  // virtual func
    virtual void f3(const string& s);  // virtual func
    void f4() const; // nonvirtual func
    ...
};

class C2: public C1 {
public:
    C2(); // nonvirtual func
    virtual ~C2();  // virtual func
    virtual void f1();  // redefined virtual func
    virtual void f5(char *str);  // new virtual func
    ...
};
```

The vtbls for `C1` and `C2` looks like this:

```
C1's vtbl:
┌──┐
│  │--> impl. of C1::~C1
├──┤
│  │--> impl. of C1::f1
├──┤
│  │--> impl. of C1::f2
├──┤
│  │--> impl. of C1::f3
└──┘
```
```
C2's vtbl:
┌──┐
│  │--> impl. of C2::~C2
├──┤
│  │--> impl. of C2::f1
├──┤
│  │--> impl. of C1::f2
├──┤
│  │--> impl. of C1::f3
├──┤
│  │--> impl. of C2::f5
└──┘
```

These tables come with cost: for each class containing virtual functions we have to set aside space ofr a virtual table, and the size of the vtbl is proportional to the number of virtual functions declared for that class. 

Ideally, we need only one copy of a class's vtbl. Usually a class's vtbl is generated in the object file containing the definition (i.e., the body) of the first non-inline non-pure virtal function in that class [^1]. However, if all virtual functions are declared `inline`, compilers tend to generate a copy of the class's vtbl in _every object file_ that uses it, so we should avoid declaring virtual functions `inline`.

Speaking of `inline`, it is worth noting that for all practical purposes, virtual functions aren't inlined:

* `inline` means replacing the call site with the body of the called function ***during compilation**
* `virtual` means wait until **runtime** to see which function is called.
* In practical real world situation, virtual function calls are made through _pointers_ or _reference_ to objects, which are not inlined; only the virtual functions invoked through _objects_ can be inlined, which is usually pointless.

#### Cost of vptr

Each object whose class declares virtual functions will be added by compilers a hidden member that points to the virtual table for that class, so we'll pay for an extra pointer indise each object that is of a class containing virtual functions:

```
  C1 object                                              C1 object 
┌──────────────┐                                     ┌──────────────┐
│ Data members │                                     │ Data members │
├──────────────┤     C1's vtbl                       ├──────────────┤
│     vptr     │----->┌──┐<--------------------------│     vptr     │
└──────────────┘      │  │--> impl. of C1::~C1       └──────────────┘
                      ├──┤
                      │  │--> impl. of C1::f1
                      ├──┤
                      │  │--> impl. of C1::f2
                      ├──┤
                      │  │--> impl. of C1::f3
                      └──┘
```

Thus, for a call to the virtual function `f1` below:

```cpp
void makeACall(C1 *pC1)
{
    pC1->f1();
}
```

will be translated by compilers like this (given compilers know the hidden member `vptr` and the vtbl index of function `f1` is `i`): 

```cpp
(*pC1->vptr[i])(pC1);  // call the function pointed to by the i-th entry in the vtbl
                       // pointed to by pC1->vptr; pC1 is passed to the function as the "this" pointer
```

On most machines this is almost as efficient as a non-virtual function call, with only a few more instructions, so the cost of calling a virtual function is basically the same as that of calling a function through a function pointer.

#### Summary

Both the per-class and the per-object space overhead for virtual functions increases, and the runtime invocation cost grows slightly.

## Multiple Inheritance

The same effect applies to multiple inheritance, except that things get more complex:

* offset claculations to find vptrs within objects become more complicated
* there are multiple vptrs within a single object (one per base class)
* special vtbls must be generated for base classes in addition to the stand-alone vtbls

## Virtual Base Classes

Multiple inheritance often leads to the need for virtual base classes to eliminate the duplicated copies of base class in each deriving path.

However, because implementations of virtual base classes often use pointers to virtual base class parts, one or more of these pointers may be stored inside the derived class objects. Take the following "dreaded multiple inheritance diamond" for example:

```
          A
virtual ↗   ↖ virtual
      B       C
        ↖   ↗
          D
```

```cpp
class A {...};
class B: virtual public A {...};
class C: virtual public A {...};
class D: public B, public C {...};
```

The layout for an object of type `D` is likely to look like this:

```
    ┌───────────────────────────────┐
    │        B Data Members         │
    ├───────────────────────────────┤
    │ Pointer to virtual base class ├─┐
    ├───────────────────────────────┤ │
    │        C Data Members         │ │
    ├───────────────────────────────┤ │
  ┌─┤ Pointer to virtual base class │ │
  │ ├───────────────────────────────┤ │
  │ │        D Data Members         │ │
  │ ├───────────────────────────────┤ │
  └>│        A Data Members         │<┘
    └───────────────────────────────┘
```

Combining virtual base class with virtual table pointers introduced in "Cost of vptr" above, the memory layout for an object of type `D` could look like this:

```
    ┌───────────────────────────────┐
    │        B Data Members         │
    ├───────────────────────────────┤
    │             _vptr_            │
    ├───────────────────────────────┤    
    │_Pointer to virtual base class_│
    ├───────────────────────────────┤
    │        C Data Members         │
    ├───────────────────────────────┤
    │             _vptr_            │    
    ├───────────────────────────────┤    
    │_Pointer to virtual base class_│
    ├───────────────────────────────┤
    │        D Data Members         │
    ├───────────────────────────────┤
    │        A Data Members         │
    ├───────────────────────────────┤    
    │             _vptr_            │
    └───────────────────────────────┘
```

Notice that in the above diagram there are only thre vptrs while four classes are involved, this is because  `D` can share the vptr with `B`. Most implementations take use of this to reduce the compiler-generated overhead.

## RTTI

>RTTI (Runtime type identification) lets us discover information about objects and classes at runtime. The information is stored in an object of type `type_+info`, which can be accessed by using the `typeid` operator.

For each class, there only needs to be a single copy of the RTTI, and the language specification states that an object's dynamic type information is guaranteed accurate only if that type has at least one virtual funciton. This may end up with such a design that RTTI was implemented in terms of a class's vtbl.

For example, index 0 of a vtbl array might contain a pointer to the `type_info` object for the class corresponding to that vtbl:

```
C1's vtbl
┌──┐
│  │--> C1's type_info object
├──┤
│  │--> impl. of C1::~C1
├──┤
│  │--> impl. of C1::f1
├──┤
│  │--> impl. of C1::f2
├──┤
│  │--> impl. of C1::f3
└──┘
```

With this implementation, the space cost of RTTI is an additional entry in each class vtbl plus the cost of the storage for the `type_info` object for each class, which is unlikely to be noticeable for most applications.

[^1]: For vendors who provide an integrated environment containing both compiler and linker, there is another brute-force starategy: generate a copy of the vtbl in each object file that might need it, and let linker strip out duplicate copies, leading to a single instance of each vtbl in the final executable or library.
