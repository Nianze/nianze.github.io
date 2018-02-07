---
title: "Item-18 Make interfaces easy to use correctly and hard to use incorrectly"
date: 2018-02-06T19:05:53-05:00
categories:
- article
- coding
tags:
- technique
- cpp
slug: make interfaces easy to use correctly
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018-02-06.jpg
---

Good interfaces are easy to use correctly and hard to use incorrectly.
<!--more-->

To design a good interface, it's always good to make the interface in consistency and behave in compatibility with built-in types. After all, clients already know how types like `int` behave, so we should strive to make our types behave the same way. A good (though not perfect) example is the interface to STL containers: every STL container has a _member function_ named `size` that tells how many objects are in the container. On the contrary, in **Java**, we use the `length` _property_ for arrays, the `length` _method_ for `String`s, and the `size` _method_ for `List`s; as for **.Net**, `Arrays` have a property named `Length`, while `ArrayList`s have a property named `Count`. No matter how convenient modern IDEs may be, inconsistency imposes mental fricition into a developer's work.

A good way to think of the interface design is to consider the kinds of mistakes that clients might make, and we could try the following 4 ways:

1. Creating new types
2. Constraining object values
3. Restricting operations on types
4. Eliminating client resource management responsibilities

### Creating new types

Say we're designing the constructor for a class representing dates in time:

```cpp
class Date {
public:
    Date(int month, int day, int year);
};
```

There at least two possible errors that clients might easily make:

1. the parameters might be passed in the wrong order:
    ```cpp
    Date d(30, 3, 1995);  // Should be "3, 30"
    ```

2. the parameters might be invalid <month, day> pair:
    ```cpp
    Date d(2, 30, 1995);  // In the keyboard, `2` is next to '3', so this kind of silly error is not uncommon
    ```

To prevent such kind of client errors, we could introduce new types:

```cpp
struct Day {
    explicit Day(int d)
    :val(d){}
    
    int val;
};
struct Month {
    explicit Month(int m)
    :val(m){}
    
    int val;
};
struct Year {
    explicit Year(int y)
    :val(y){}
    
    int val;
};
class Date {
public:
    Date(const Month& m, const Day& d, const Year& y);
    ...
};
```

This will prevent some silly interface usage errors effectively:

```cpp
Date d(30, 3, 1995); // error: wrong type!
Date d(Day(30), Month(3), Year(1995));  // error: wrong type!
Date d(Month(3), Day(30), Year(1995));  // fine
```

### Constraining object values

Once the type is right, we may consider adding some restriction on the values of those types. The `Month` in example above only has 12 valid values, so the `Month` type should reflect this restriction. One way is to use an enum to represent the month, but considering enums can be used like `ints` (item 2), it is not as type-safe as we might like. A safer solution is to predefine the set of all valid `Month`s:

```cpp
class Month {
public:
    static Month Jan() {return Month(1);}  // functions returning all
    static Month Feb() {return Month(2);}  // valid Month values
    ...
    static Month Dec() {return Month(12);}
...
private:
    explicit Month(int m);  // prevent creation of new Month values
    ...  // month-specific data
};

Date d(Month::Mar(), Day(30), Year(1995));
```

The reason to use functions (returning local static objects) instead of (non-local static) objects to represent specific months is explained in item 4:

>the relative order of initialization of non-local static objects defined in different translation units is undefined.

### Restricting operations on types

A good example for restricting operations on types is in item 3 explaining how `const` qualifying the return type from `operator*` can prevent clients from making following errors for user-defined types:

```cpp
if (a * b = c)... // meant to do a comparison
```

Again, it is always good to have our types behave consistently with the built-in types. Such kind of operation is illegal for `int` type, so unless there's a good reason, it should be illegal for our types, too.

### Eliminating client resource management responsibilities

Any interface that requires that client remember to do something is prone to incorrect use. A bad example is function `createInvestment` in item 13, which returns pointers to dynamically allocated objeects in an `Investment` hierarchy. 

```cpp
Investment* createInvestment();  // parameters omitted for simplicity
```

Needless to say, this is prone to resource leak, for chances are that clients either forget to manually `delete` the pointer, or delete the same pointer more than once

Item 13 shows that we could preempt this problem by using smart pointers. But a better solution is to let the function `createInvestment` return a smart pointer in the first place:

```cpp
std::tr1::shared_ptr<Investment> createInvestment();
```

Moreover, returning a `tr1::shared_ptr` makes it possible to prevent a host of other client errors regarding resource release, for  `tr1::shared_ptr` allows a resource-release function (called a "deleter") to be bound to the smart pointer when the smart pointer is created (item 14, `auto_ptr` does not support this functionality).

For example, instead of using `delete` to release an `Investment` object resource, clients may expect to use a function called `getRidOfInvestment`. By binding `getRidOfInvestment` to `tr1::shraed_ptr` as its deleter, and return this smart pointer, clients will not make mistakes such as using the wrong resource-destruction mechanism (using `delete` instead of `getRidOfInvestment`).

Thus, in order to bind the deleter, we could define a null `tr1::shared_ptr` with `getRidofInvestment` as its second argument (the first argument is null because we may not be sure the resource to be managed during initialization), and implement `createInvestment` like this:

```cpp
std::tr1::shared_ptr<Investment> createInvestment()
{
    std::tr1::shared_ptr<Investment>      // return a null shared_ptr
    retVal(static_cast<Investment*>(0),   // see item 27 for static_cast
            getRidOfInvestment);          // bind a custom deleter
    ...                                   // make retVal point to the correct object
    return retVal;
}
```

Since `tr1::shared_ptr` insists on an actual pointer, we use a cast to solve the problem. Of course, it would be better to pass the raw pointer to the smart pointer's constructor if the raw pointer to be managed by `retVal` could be determined prior to creating `retVal`, rather than to initialize `retVal` to null and then making an assignment to it (item 26).

What's more, another nice feature of `tr1::shared_ptr` is that it automatically uses its per-pointer deleter to release resource, which eliminates the "cross-DLL problem" that shows up when an object its created using `new` in one dynamically linked library (DLL) but is `deleted` in a different DLL, leading to runtime errors. For example, if `Stock` is a class derived from `Investment` and `createInvestment` is implemented like this:

```cpp
std::tr1::shared_ptr<Investment> createInvestment()
{
    return std::tr1::shared_ptr<Investment>(new Stock);
}
```

the returned `tr1::shared_ptr` pointing to the `Stock` keeps track of which DLL's `delete` should be used when the reference count for the `Stock` becomes zero, so there's no more concern for the cross-DLL problem.

The most common implementation of `tr1::shared_ptr` comes from Boost (item 55). Since it is such an easy way to eliminate some client errors, it's worth an overview of the cost of using it: Boost's `shared_ptr` is twice the size of a raw pointer, uses dynamically allocated memory for bookkeeping and deleter_specific data, uses a virtual function call when invoking its deleter, and incurs thread synchronization overhead when modifying the reference count in an application it believes is multithreaded. 

Although compared to a raw pointer, the `tr1::shared_ptr` is bigger, slower, and uses auxiliary dynamic memory, the reduction in client errors will be apparent， and the additional runtime costs will be unnoticeable in many applications.