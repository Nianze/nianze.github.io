---
title: "[MECpp]Item-26 Limiting the Number of Objects of a Class"
date: 2018-04-24T15:03:26-04:00
categories:
- technology
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

## Allowing zero or one objects

Using the classic singleton design pattern, it's easy to limit the number of object to either zero or one. There are three points worth noting in this design:

1. Declaring the constructors of the class `private`
2. Using static object
3. In order to access the single object, encapsulate the single object inside a accessor function (either a friend function inside some namespace/globally, or a static member function of that class). Note that:
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
} // namespace PrintingStuff
```

Since the accessor returns a reference to a `Printer` object, clients may use `thePrinter` in any context where a `Printer` object itself is expected:

```cpp
using PrintingStuff::thePrinter; 

thePrinter().reset();
thePrinter().submitJob(buffer);
```

However, there's still an inconvenience in this design: we're limited to a single `Printer` object for each run of the program. As a result, it's not possible to write code like this:

```cpp
create Printer object p1;
use p1;
destroy p1;
create Printer object p2;
use p2;
destroy p2;
```

This design never instantiates more than a single `Printer` object at a time, but it does use different `Printer` objects in different parts of the program. It does not violate the constraint that only one printer may exist, but is still illegal with a single function static implementation.

This need for flexibility leads us to the design of object-counting.

## Allowing multimple objects: object-counting with pseudo-constructor

#### Object-counting

The good point of object-counting is that, it provides us with more flexibility than the function static, and makes it easier to generalize the limit number to more than one. However, object-counting alone will not work. For example:

```cpp
class Printer {
public:
    class TooManyObjects{};  // exception class for use when too many obj. are requested; may also returning null for too-many-object cases
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
    if (numObjects >= maxObjects) {
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
    if (numObjects >= maxObjects) {
        throw TooManyObjects();
    }    
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

```cpp
Printer p;
ColorPrinter cp;
```

From object definition above, there are two `Printer` objects, one for `p` and one for the `Printer` part of `cp`. This is usually unwanted behavior.

Often we are interested only in allowing objects to exist on their own, and limit the number of those kinds of instantiations. To satisfy such restrictions, we should declare the class constructors `private`, and (in the absence of `friend` declarations) classes with private constructors can't be used as base classes, nor can they be embedded inside other objects.

#### Pseudo-constructor

In fact, private constructors are a general solution for preventing derivation. Instead of returning a reference to a single object (like what `thePrinter` does), we can declare a pseudo-constructor returning a pointer to a unique object to allow multiple objects.

That is, we combine the object-counting with pseudo-consturctors:

```cpp
class Printer {
public:
    class TooManyObjects{};  // exception class for use when too many obj. are requested; may also returning null for too-many-object cases
    // pseudo-constructor
    static Printer * makePrinter();
    static Printer * makePrinter(const Printer& rhs);
    ~Printer();
    ...
private:
    static size_t numObjects;
    static const size_t maxObjects = 10; // may need enum hack here for old compiler
    Printer();
    Printer(const Printer& rhs); 
};
```

```cpp
// Obligatory definitions of class statics
size_t Printer::numObjects = 0;
const size_t Printer::maxObjets;

Printer::Printer()
{
    if (numObjects >= maxObjects) {
        throw TooManyObjects();
    }
    process with normal construction here;
    ++numObjects;
}

Printer::Printer(const Printer& rhs)
{
    if (numObjects >= maxObjects) {
        throw TooManyObjects();
    }    
    perform normal copy construction here
    ++numObjects;
}

Printer::~Printer()
{
    perform normal destruction here;
    --numObjects;
}

Printer * Printer::makePrinter()
{ return new Printer; }

Printer * Printer::makePrinter(const Printer& rhs)
{ return new Printer(rhs); }
```

#### An object-counting base class

We can split the instance counting ability apart from the `Printer` class to reuse the limited-number-of-instance functionality.

```cpp
template<class BeingCounted>
class Counted {
public:
    class TooManyObjects{}; // for throwing exceptions
    static size_t objectCount() { return numObjects; }
protected:
    Counted();
    Counted(const Counted& rhs);
    ~Counted() { --numObjects; }
private:
    static size_t numObjects;
    static const size_t maxObjects;
    void init();  // to avoid ctor code duplication
};

template<class BeingCounted>              // defines numObjects and
size_t Counted<BeingCounted>::numObjects; // automatically init. it to 0

template<class BeingCouted>
Counted<BeingCounted>::Counted()
{ init(); }

template<class BeingCounted>
void Counted<BeingCounted>::Counted(const Counted<BeingCounted>&)
{ init(); }

template<class BeingCounted>
void Counted<BeingCounted>::init()
{
    if (numObjects >= maxObjects) throw TooManyObjects();
    ++numObjects;
}
```

Now modify the `Printer` class to use the `Counted` template:

```cpp
class Printer: private Counted<Printer> {
public:
    // pseudo-constructors
    static Printer * makePrinter();
    static Printer * makePrinter(const Printer& rhs);
    ~Printer();
    void submitJob(const PrintJob& job);
    void reset();
    void performSelfTest();
    ...
    using Counted<Printer>::objectCount; // make this function public for clients of Printer
    using Counted<Printer>::TooManyObjects;
private:
    Printer();
    Printer(const Printer& rhs);
};
```

Note that:

1. We use `private` inheritance here because the implementation detials of keeping track of the number of instantiated objects are nobody's business but the author of `Printer`'s. If we use the alternative public inheritance design, then we have to give the `Counted` class a virtual destructor - that will almost certainly affect size and layout of objects of classes inheriting from `Counted`, as MECpp item 24 states.

2. Clients may still want to know how many `Printer` objects exists, but `objectCount` becomes `private` due to the private inheritance. To restore the public accessibility, we employ a `using` declaration.

3. After inheritance, `Printer` can forget about counting objects, so the `Printer` constructor now looks like this:

    ```cpp
    Printer::Printer()
    {
        proceed with normal object construction;
    }
    ```
    The benifits:
    * No checking of the number of objects to see if the limit is about to be exceeded
    * No incrementing the number of objects in existence once the constructor is done
    * Base class will always be invoked first, so if too many objects are created, a `Connted<Printer>` constructor throws an exception, and the `Printer` constructor won't even be invoked
4. Clients of the `Printer` class are required to initialize `maxObjects`, or there will be an error during linking for undefined `maxObjects`:
    ```cpp 
    const size_t Counted<Printer>::maxObjects = 10;
    ```
