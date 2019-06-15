---
title: "[EMCpp]Item-9 Prefer Alias Declarations to Typedefs"
date: 2018-07-12T13:03:01-04:00
categories:
- technology
- coding
tags:
- technique
- cpp
slug: Prefer Alias Declarations to Typedefs
autoThumbnailImage: true
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-07/12.gif
---

Alias declaration support templatization, which avoids the "::type" suffix and "typename" prefix often required to refer `typedef`s.
<!--more-->

Compared with `typedef`, alias declarations have following advantages:

#### Easier to understand

```cpp
typedef void (*FP)(int, const std::string&);
// same meaning as above using alias declaration
using FP = void (*)(int, const std::string&);
```

#### Support for template

Alias declarations may be templatized (called _alias templates_), while `typedef`s cannot. For example, suppose we want to define a synonym for a linked list that uses a custom allocator `MyAlloc`:

```cpp
template<typename T>
using MyAllocList = std::list<T, MyAlloc<T>>; 

// client code
MyAllocList<std::string> ls;
template<typename T>
class Widget {   // Widget contains a MyAllocList<T> as a data member
private:
    typename MyAllocList<T> list; 
}
```

With a `typedef`, to support template, we need the trick to nest `typedef` inside templatized structs:

```cpp
template<typename T>
struct MyAllocList {
    typedef std::list<T, MyAlloc<T>> type;
};

// client code
MyAllocList<Widget>::type lw;
```

To make things worse, when using the `typedef` inside a template class, we have to precede the `typedef` name with `typename`, so that compilers get comfirmed that `MyAllocList<T>::type` refers to a type, instead of a data member named `type` inside `MyAllocList`:

```cpp
template<typename T>
class Widget {
private:
    typename MyAllocList<T>::type list; 
}
``` 

**Type traits supported by alias templates in C++14**

When we need to take template type parameters and create revised types from them(e.g., turn `Widget` into `Widget&`), we perform these kinds of transformations through _type traits_. Since type traits in C++11 are implemented as nested `typedef`s inside templatized structs, C++14 provides corresponding alias templates:

```cpp
std::remove_const<T>::type  // C++11: const T -> T
std::remove_const_t<T>  // C++14 equivalent

std::remove_reference<T>::type  // C++11: T&/T&& -> T
std::remove_reference_t<T>  // C++14 equivalent

std::add_lvalue_reference<T>::type  // C++11: T -> T&
std::add_lvalue_refernece_t<T>  // C++14 equivalent
```

Basically what C++14 adds is simply some code like this:

```cpp
template <class T>
using remove_const_t = typename remove_const<T>::type;
template <class T>
using remove_reference_t = typename remove_reference<T>::type;
template <class T>
using add_lvalue_reference_t = typename add_lvalue_reference<T>::type;
```
