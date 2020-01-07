---
title: "Item-52 Write placement delete if you write placement new"
date: 2018-03-21T15:48:12-04:00
series:
- effective c++
categories:
- coding
tags:
- technique
- cpp
slug: write placement delete if you write placement new
autoThumbnailImage: false
thumbnailImagePosition: right
featured_image: 2018/2018-03/2018-03-21.gif
---

When we write a placement version of `operator new`, be sure to write the corresponding placement version of `operator delete` to avoid subtle, intermittent memory leaks. When we do so, pay attention not to unintentionally hide the normal versions of `new` and `delete`
<!--more-->
<!-- toc -->

# Placement version of `new`

When an `operator new` function takes extra parameters (other than the mandatory `size_t` argument), that function is known as a _placement version of `new`_. For example:

```cpp
void* operator new(std::size_t, void *pMemory) throw(); // placement new
```

This specific version of placement `new` is in C++'s standard library (access through `#include<new>`) and is the original placement `new`. Later, people also use the term "placement `new`" to refer any version of `operator new` that takes extra arguments. The phrace "placement `delete`" also derives from this version.

# To avoid subtle memory leak

Suppose we want to write a class-specific `operator new` that requires specification of an `ostream` to which allocation information should be logged:

```cpp
class Widget {
public:
    ...
    static void* operator new(std::size_t size, std::ostream& logStream) throw(std::bad_alloc) // non-normal form of new
    static void operator delete(void *pMemory, std::size_t size) throw();  // normal class-specific form of delete
};
```

And we call it this to log allocation informatino to `cerr` when dynamically creating a `Wdiget`:

```cpp
Widget *pw = new (std::cerr) Widget; // call operator new, passing cerr as the ostream; cause memory leak when Widget constructor throws
```

Let's consider a special subtle situation: if memory allocation succeeds and the `Widget` constructor throws an exception, since `pw` not yet assigned and client code can't deallocate the memory, the runtime system is responsible for undoing the allocation that `operator new` performed. However, we're now using a non-normal version of `operator new`, unless it finds a version of `operator delete` that takes _the same number and types of extra arguments_ as `operator new`, the runtime system choose to do nothing, so no `operator delete` will be called, ending up with memory leak.

To eliminate the memory leak in this situation, we need to match the placement `new` with a placement `delete`:

```cpp
class Widget {
public:
    ...
    static void* operator new(std::size_t size, std::ostream& logStream) throw(std::bad_alloc) // non-normal form of new
    static void operator delete(void *pMemory, std::size_t size) throw();
    static void operator delete(void *pMemory, std::ostream& logStream) throw(); corresponding non-normal form of delete
};
```

Now following code will work without leak:

```cpp
Widget *pw = new (std::cerr) Widget; // no potential leak
delete pw;  // invokes the normal operator delete
```

# Do not hide normal form of `new` and `delete`

By default, C++ offers the following forms of `operator new` (and corresponding `operator delete`) at global scope:

```cpp
void* operator new(std::size_t) throw(std::bad_alloc); // normal new
void* operator new(std::size_t, void*) throw(std::bad_alloc); // placement new
void* operator new(std::size_t, const std::nothrow_t&) throw(); // nothrow new, item 49
```

According to item 33, member function names hide functions with the same names in outer scopes, so we want to avoid having class-specific `new`s hide other `new`s that our client expect. For example, if the base class declares only a placement `new`, clients will find the normal version of `new` unavailable:

```cpp
class Base {
public:
    ...
    static void* operator new(std::size_t size, std::ostream& logStream) throw(std::bad_alloc); // hide the normal global form
    ...
};

Base *pb = new Base; // error! the normal form is hidden
Base *pb = new (std::cerr) Base;  // fine, call the placement new
```

Similarly, redeclaring `operator new` in derived classes hide both global and inherited versions of `operator new`:

```cpp
class Derived: public Base {
public:
    ...
    static void* operator new(std::size_t size) throw(std::bad_alloc); // redeclare the normal form
    ...
};

Derived *pd = new (std::clog) Derived; // error! Base's placement new is hidden
Derived *pd = new Derived; // fine, call Derived's operator new
```

In order to make normal version of `operator new` accessible in addition to customed ones, we need to declare all forms (both standard version and placement version) in our class. If we want class-specific standard versions to behave in the usual way, just have the them call the global versions. An easy way to do this is to create a base class containing all the normal forms of `new` and `delete`:

```cpp
class StandardNewDeleteForm {
public:
    // normal new/delete
    static void* operator new(std::size_t size) throw(std::bad_alloc) 
    { return ::operator new(size); }
    static void operator delete(void *pMemory) throw()
    { ::operator delete(pMemory); }

    // placement new/delete
    static void* operator new(std::size_t size, void *ptr) throw(std::bad_alloc) 
    { return ::operator new(size, ptr); }
    static void operator delete(void *pMemory, void *ptr) throw()
    { ::operator delete(pMemory, ptr); }

    // nothrow new/delete
    static void* operator new(std::size_t size, const std::nothrow_t& nt) throw() 
    { return ::operator new(size, nt); }
    static void operator delete(void *pMemory, const std::nothrow_t& nt) throw()
    { ::operator delete(pMemory, nt); }
};
```

Clients who want to augment the standard forms with custom forms can just use inheritance and `using` declarations (item 33) to get all forms accessible:

```cpp
class Widget: public StandardNewDeleteForms { // inherit std forms
public:
    using StandardNewDeleteForms::operator new;     // make std forms of new visible
    using StandardNewDeleteForms::operator delete;  // make std forms of delete visible

    static void* operator new(std::size_t size, std::ostream& logStream) throw(std::bad_alloc);  // custom placement new
    static void operator delete(void *pMemory, std::ostream& logStream) throw(); // corresponding placement delete
    ...
};
```
