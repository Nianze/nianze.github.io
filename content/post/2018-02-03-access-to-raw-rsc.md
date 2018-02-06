---
title: "Item-15 Provide access to raw resource in resource-managing classes"
date: 2018-02-03
categories:
- article
- coding
tags:
- technique
- cpp
slug: provide access to raw rsc
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018-02-03.jpg
---

Each RAII class should offer a way to get at the resource it manages.
<!--more-->

From time to time, some APIs require access to raw resources, so it is a good habit to design the resource-managing classes in such a way that it provides access to raw resources. For example, suppose there's a function we'd like to use with `Investment` objects, which is managed by smart pointer:

```cpp
int daysHeld(const Investment *pi);  // return number of days investment has been held

std::tr1::shared_ptr<Investment> pInv(createInvestment()); // item 13
```

Since `dayHeld` wants a raw `Investment*` pointer, if passing an object of type `tr1::shared_ptr<Investment>`, the code won't compile:

```cpp
ind days = daysHeld(pInv);  // error
```

We need to find a way to get the access to the raw resources, and generally there are two ways:

1. Implicit conversion (convenient for clients)
2. Explicit conversion (generally preferred)

### Implicit conversion

Pointer dereferencing operators (`operator->` and `operator*`) are implicit conversion to the underlying raw pointers, which is virtually provided by all smart pointer classes. Suppose there's a member function `bool isTaxFree()` inside the class `Investment`, and we can access the member function like this:

```cpp
bool taxable1 = !(pInv->isTaxFree());  // access resource via operator->

bool taxable2 = !((*pInv).isTaxFree());  // access resource via operator*
```

When it is necessary to get at the raw resource inside an RAII object, another way of conversion is through an *implicit conversion function*. Consider following RAII class for fonts:

```cpp
FontHandle getFont();  // from C API
void releaseFont(FontHandle fh);  // from the same C API

class Font {   // self-defined RAII class
public:
    explicit Font(FontHanlde fh)  // acquire resource
    : f(fh)                       // use pass-by-value because the C API does
    {}
    ~Font() { releaseFont(f); }   // release resource

operator FontHandle() const {return f;}  // implicit conversion function

private:
    FontHandle f;                 // the raw font resource
};
```

This makes calling into the following C API easy and natural:

```cpp
void changeFontSize(FontHandle f, int newSize);  // the C API

Font f(getFont());
int newFontSize;
...
changeFontSize(f, newFontSize);  // implicitly convert Font to FontHandle
```

However, the downsize is that implicit conversions increase the chance of errors - a `FontHandle` may be created when a `Font` is really intended:

```cpp
Font f1(getFont());
...
FontHandle f2 = f1;  // meant to copy a Font object but implicitly converted f1 into 
                     // FontHandle, and copied the underlying resource
```

### Explicit conversion

In order to avoid unintended implicit conversion, an explicit conversion function like `get` is a preferable path. We can exchange the implicit convertion function to following explicit one:

```cpp
class Font {
...
FontHandle get() const { return f; }  // explicit conversion function
...
};
...
// and use it like this:
changeFontSize(f.get(), newFontSize); // explicitly convert Font to FontHandle
```

Both explicit conversion and implicit conversion make sense, and the preference depends on the specific task and the circumstances in which the RAII class performs, as long as one adheres to item 18's advice: to make interfaces easy to use correctly and hard to use incorrectly.