---
title: "[EMCpp]Item-11 Prefer Deleted Functions to Private Undefined Ones"
date: 2018-07-16T21:22:57-04:00
categories:
- technology
- coding
tags:
- technique
- cpp
slug: Prefer Deleted Functions to Private Undefined Ones
autoThumbnailImage: true
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-07/16.gif
---

Any function may be deleted, including non-member functions and template instantiations.
<!--more-->
<!-- toc -->

To prevent use of certain function from being called, there is a classic approach in C++98: declare that function `private` and not define them.

However, the fact is that this C++98 practice is really an attempt to achieve what C++11's deleted functions actually accomplish. As an emulation, it is not as good as the real thing: it doesn't work outside classes, it doesn't always work inside classes, and when it does work, it may not work until link-time.

# Link-time vs compile-time failure diagnostic

In C++98 practice, declaring functions `private` prevents clients from calling them. Due absence of function definitions, linking will fail if member functions or `friend`s of the class try to call them. Take the copy constructor in uncopyable `basic_ios` class for example:

```cpp
template <class charT, class traits = char_traits<charT> >
class basic_ios : public ios_base {
public:
    ...
private:
    basic_ios(const basic_ios&);            // not defined
    basic_ios& operator=(const basic_ios&); // not defined
};
```

As a comparason, deleted functions may not be used in any way, so even code that's in member and `friend` functions will fail to compile if it tries to copy `basic_ios` objects:

```cpp
template <class charT, class traits = char_traits<charT> >
class basic_ios : public ios_base {
public:
    ...
    basic_ios(const basic_ios&) = delete ;
    basic_ios& operator=(const basic_ios&) = delete;
 
    ...
};
```

Note that by convertion, deleted functions are declared `public` instead of `private`, because C++ checks accessibility before deleted status. When client code tries to use a deleted `private` function, some compilers complain only about the function being `private`. If declaring those functions in `public`, we will get better error messages.

# Disable non-member functions

Functions may be deleted outside classes, while `private` functions are always member functions inside some class. For example, we may use `delete` to prevent implicit numerical conversion into `int` for a non-member function `isLucky`, which takes in i
nteger and returns whether it's a lucky number:

```cpp
bool isLucky(int number);      // original function
bool isLucky(char) = delete;   // reject chars
bool isLucky(bool) = delete;   // reject bools
bool isLucky(double) = delete; // reject doubles and floats
```

# Disable special template instantiations

Suppose we want to handle specail cases of `void*` and `char*` in the `processProinter` template, we may simply delete those instantiations:

```cpp
t
emplate<typename T>
void processProinter(T* ptr);

template<>
void processProinter<void*>(void*) = delete;
template<>
void processProinter<char*>(char*) = delete;
```

# Disable speacial member function template instanciation

Since template specializations must be written at namespace scope, not class scope, we can't adopt the C++98 convertion to disable specialization of a member function template from being called. Delete functions, however, won't be restricted by class scope, so we can simply delete the specialization outside the class:

```cpp
class Widget {
public:
    ...
    template<typename T>
    void processProinter(T* ptr)
    {...}
    ...
};

template<>
void Widget::processProinter<void>(void*) = delete;
```
