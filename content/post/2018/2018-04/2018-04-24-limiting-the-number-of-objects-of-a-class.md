---
title: "[MECpp]Item-26 Limiting the Number of Objects of a Class"
date: 2018-04-24T15:03:26-04:00
categories:
- article
- coding
tags:
- technique
- cpp
slug: Limiting the Number of Objects of a Class
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-04/2018-04-24.gif
---

Combining object-counting technique with the pseudo-constructors, we can limit the number of objects of a class.
<!--more-->

# Allowing zero or one objects

* Declaring the constructors of the class `private`
* Using static object
* In order to access the single object, encapsulate the single object inside a accessor function (either a friend function inside some namespace/globally, or a static member function of that class).
    * Remember to put the static object inside this wrapper function to make it a function static instead of a class static, because
        * A class static is always constructed even if it's never used, while a function static is created the first time through the function
        * C++ says noting about the initialization order of static objects in different translation units, so class statics turn out to be a source of headaches, which can be avoided in the case of function statics (ECpp Item 4).
    * If this wrapper function is also declared as `inline`, it's possible for some compilers to create more than one copy of the static objects in the program due to _internal linkage_ (the object code for the program may contain more than one copy of each function with internal linkage, and this duplication includes function statics). So shy away from inline functions with static data.

Example:

```cpp
namespace PrintingStuff {
class Printer {
public:
    void submitJob(const PrintJob& job);
    void reset();
    void performSelfTest();
    ...
friend Printer& thePrinter();
private:
    Printer();
    Printer(const Printer& rhs);
    ...
};

Printer& thePrinter() // no inline in case of duplication caused by internal linkage
{
    static Printer p;
    return p;
}
}
```

Since the accessor returns a reference to a `Printer` object, clients may use `thePrinter` in any context where a `Printer` object itself is expected:

```cpp
using PrintingStuff::thePrinter; 

thePrinter().reset();
thePrinter().submitJob(buffer);
```

# Allowing multimple objects: object-counting with pseudo-constructor

# Object-counting

When we want to generalize the limit number to more than one, we adopt the object-counting solution. However, object-counting alone will not work. For example, :

```cpp
class Printer {
public:
    class TooManyObjects{};  // exception class for use when too many obj. are requested
    
    Printer();
    Printer(const Printer& rhs);
    ~Printer();
    ...
private:
    static size_t numObjects;
    static const size_t maxObjects = 10; // may need enum hack here for old compiler
};
```

```cpp
// Obligatory definitions of class statics
size_t Printer::numObjects = 0;
const size_t Printer::maxObjets;

Printer::Printer()
{
    if (numObjects >= 1)
    {
        throw TooManyObjects();
    }
    
    process with normal construction here;

    ++numObjects;
}

Printer::~Printer()
{
    perform normal destruction here;
    --numObjects;
}

Printer::Printer(const Printer& rhs)
{
    perform normal copy construction here
    ++numObjects;
}
```

The problem here is that, in order to set a limit on the number of instantiations,  we should not declare the class constructor `public`, because that will allow clients to put the class as base class parts of more derived objects, or embedded inside larger objects, which is totally different usage context, and the presence of these different contexts significantly muddies the waters regarding what it means to keep track of the "number of objects in existence." For example:

```cpp
class ColorPrinter: public Printer {
    ...
}
```

From object definition below, there are two `Printer` objects, one for `p` and one for the `Printer` part of `cp`.

```cpp
Printer p;
ColorPrinter cp;
```

Often we are interested only in allowing objects to exist on their own, and limit the number of those kinds of instantiations. To satisfy such restrictions, we should declare the class constructors `private`, and (in the absence of `friend` declarations) classes with private constructors can't be used as base classes, nor can they be embedded inside other objects.

* Pseudo-constructor

In fact, private constructors are a general solution for preventing derivation.




