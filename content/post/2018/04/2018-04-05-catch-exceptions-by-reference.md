---
title: "[MECpp]Item-13 Catch Exceptions by Reference"
date: 2018-04-05T18:57:13-04:00
categories:
- article
- coding
tags:
- technique
- cpp
slug: Catch Exceptions by Reference
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-04/2018-04-05.gif
---

If catching by reference, we sidestep the questions about object deletion, avoid slicing exception objects, retain the ability to catch standard exceptions, and limit the number of times exception objects being copied.
<!--more-->

# Catch by pointer

In order to catch by pointer, programmers need to define exception objects in a way that **guarantees the objects exist** after control leaves the `throw` site. Global and static objects work fine, but it's easy for programmers to forget the constraint:

```cpp
void someFunction()
{
    exception ex;
    ...
    throw &ex;   // throw a pointer to an object 
    ...          // that's about to be destroyed
}
```

An alternative is to throw a pointer to a new heap object:

```cpp
void someFunction()
{
    ...
    throw new exception; // throw a pointer to a new heap-based object 
    ...  // hopefully the objerator new will not itself throw any exception
}
```

This design will make a hard time for authors of `catch` clauses: **to delete or not to delete** the pointer they receive? In the `catch` site, we can't tell if an exception object is allocated on the heap or defined as a global (or static) object.

Furthermore, catch-by-pointer runs **contrary to the convention** of the language: the four standard exception[^1] - `bad_alloc`, `bad_cast`, `bad_typeid`, and `bad_exception` are all objects, rather than pointers to objefts, so we have to catch them by value or by reference.

# Catch by value

Catch-by-value requires exception objects be copied _twice_ each time they thrown (MECpp item 12), and it also has **_slicing problem_**: derived class exception objects caught as base class exceptions have their derivedness "sliced off" : they lack derived class data members, and resolve to base class virtual functions (the same behavior as when an object is passed to a function by value)

# Catch by reference

Catch-by-reference suffers from none of the problems:
* Unlike catch-by-pointer, the question of object deletion fails to arise, and there's no difficulty in catching the standard exception types
* Unlike catch-by-value, there is no slicing problem, and exception objects are copied only once.

Of course, if there's no need to change the exception object in the `catch` site, we'd catch not just reference, but by reference to `const`.

[^1]: `bad_alloc`: thrown when `operator new` can't satisfy a memory request (MECpp item 8); `bad_cast`: thrown when a `dynamic_cast` to a reference fails (MECpp item 2); `bad_typeid`: thrown when `typeid` is applied to a dereferenced null pointer; and `bad_exception`: available for unexpected exceptions (MECpp item 14)