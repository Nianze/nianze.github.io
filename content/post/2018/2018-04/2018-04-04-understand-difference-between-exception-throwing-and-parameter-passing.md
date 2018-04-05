---
title: "[MECpp]Item-12 Understand How Throwing an Exception Differs From Passing a Parameter or Calling a Virtual Function"
date: 2018-04-04T11:28:07-04:00
categories:
- article
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

Note that a thrown object (which is always a copied temporary) may be caught by simple reference, but passing a temporary object to a non-`const` reference parameter is not allowed for function calls (item 19).

### Difference in type matching

### Difference in fitting strategy