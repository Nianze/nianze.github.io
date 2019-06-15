---
title: "[MECpp]Item-12 Understand How Throwing an Exception Differs From Passing a Parameter or Calling a Virtual Function"
date: 2018-04-04T11:28:07-04:00
categories:
- technology
- coding
tags:
- technique
- cpp
slug: Understand How Throwing an Exception Differs From Passing a Parameter or Calling a Virtual Function
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-04/2018-04-04.gif
---

There are three primary ways in which passing an object to a function or using that object to invoke a virtual function differs from throwing the object as an exception.
<!--more-->

## Similarity

There is similarity between passing an argument from a function call site to the function's parameter and passing an exception from a `throw` site to a `catch` clause:

```cpp
class Widget {...}

void f1(Widget w);
void f2(Widget& w);
void f3(const Widget& w);
void f4(Widget *pw);
void f5(const Widget *pw);

catch (Widget w) ...
catch (Widget& w) ...
catch (const Widget& w) ...
catch (Widget *pw) ...
catch (const Widget *pw) ...
```

## Differences

However, there are still three difference:

1. exception objects are always copied (when caught by value, they are copied twice), while objects passed to function parameters need not be copied at all.
2. objects thrown as exceptions are subject to fewer forms of type conversion than are objects passed to functions.
3. `catch` clauses are examined in the order in which they appear in the source code, and the first one that can succeed is selected for execution, while a virtual funciton invoked by an object is the one that provides the _best_ match for the type of the object, even if it's not the first one listed in the source code.

### Difference in augument passing 

The first difference essentially grows out of the fact that when we call a function, control eventually returns to the call site, but when we throw an exception, constrol does _not_ return to the `throw` site. For example:

```cpp
void throwWidget()
{
    Widget localWidget;
    throw localWidget; // throw localWidget as an exception
}
```

In this typical case where `localWidget` will go out of scope once control leaves `throwWidget`, its destructor will be called, so C++ specifies that an object thrown as an exception is copied (even if the object being thrown is not in danger of being destroyed). This mandatory copying of exception objects leads to two implication:

* It is not possible for the `catch` block to modify `localWidget`; it can only modify a _copy_ of `localWidget`
* Throwing an exception is typically much slower than parameter passing.

#### Copying based on static type

It is worth noting that in C++ copying is always based on an object's static type (MECpp item 25 shows a technique to copy based on dynamic type). Thus,

```cpp
class Widget {...};
class SpecialWidget: public Widget {...};

void throwWidget()
{
    SpecialWidget localSpecialWidget;
    Widget& rw = localSpecialWidget // rw refers to a SpecialWidget
    throw rw;  // this throws an exception of type Widget
}
```

#### Rethrow

Another impact caused from copying exceptions objects is that there's difference between different rethrow statements:

```cpp
catch (Widget& w)  // catch Widget exceptions
{
    ...
    throw;  // rethrow the exception so it continues to propagate
}

catch (Widget& w)  // catch Widget exceptions
{
    ...
    throw w;  // propagate a copy of the caught exception
}
```

Here, the first block rethrows the current exception, while the second one throws a new copy of the current exception. Apart from performance cost of the additional copy operation in the second block, there's another suble difference: if the exception originally thrown was of type `SpecialWidget`, the first block would propagate a `SpecialWidget` exception (even though `w`'s static type is `Widget`) and no copy is made during `throw;`, while the second `catch` block throws a _new_ exception being the type of `Widget`. 

In general, we'll want to use the

```cpp
throw;
```

syntax to rethrow the current exception for its consistency and efficiency.

#### Different `catch` syntax

There are three kinds of `catch` clauses for exception of type `Widget`:

```cpp
catch (Widget w) ...  // catch by value
catch (Widget& w) ... // catch by reference
catch (const Widget& w) ... // catch by reference-to-const
```

A few points to note:

* A thrown object (which is always a copied temporary) may be caught by simple reference, but it is not allowed in function calls (item 19) to pass a temporary object to a non-`const` reference parameter.
* The first statement (catch by value) leads to _two_ copies of the thrown object, one to create the temporary that all exceptions generate, the other to copy that temporary into `w`.
* For the catch by reference and catch by reference-to-const, we expect to pay for one copy of the exception. In contrast, when we pass function parameters by reference (or reference-to-const), no copying takes place.
* Throw by pointer is equivalent to pass by pointer. Either way, a copy of the pointer is passed. Just remember not to throw a pointer to a local object.

### Difference in type matching

Implicit conversions (such from `int` to `double`) are not applied when matching exceptions to `catch` clauses:

```cpp
void f(int value)
{
    try {
        if (someFunction()) {
            throw value;
        }
        ...
    }
    catch (double d) { // handle double type exceptions
        ...
    }
    ...
}
```

In this case, the `int` exception thrown in `try` block will never be caught by the `catch` clause taking a `double`.

Basically, two kinds of conversions are applied during `catch` matching:

1. inheritance-based conversions
    For example, `range_error`, `underflow_error`, and `overflow_error` are derived types from `runtime_error`:
    ```cpp
    catch (runtime_error) ...         // can catch errors of type
    catch (runtime_error&) ...        // runtime_error,
    catch (const runtime_error&) ...  // range_error, or overflow_error
    
    catch (runtime_error*) ...        // can catch errors of type runtime_error*
    catch (const runtime_error*) ...  // range_error*, or overflow_error*
    ```

2. from a typed to an untyped pointer
    
    ```cpp
    catch (const void*) ...   // catches any exception that's a pointer
    ```

### Difference in fitting strategy

Catch clauses are always tried in the order of their appearance (employing a "first fit" strategy). For exampel:

```cpp
try {
    ...
}
catch (logic_error& ex) {  // this block will catch all logic_error exceptions
    ...                    // including invalid_argument exception, which is derived type
}
catch (invalid_argument& ed) {
    ...
}
```

on the contrary, when we call a virtual function, the function invoked is the one in the class `closest` to the dynamica type of the object invoking the function (employing a "best fit" algorithm).
