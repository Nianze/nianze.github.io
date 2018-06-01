---
title: "[MECpp]Item-29 Reference Counting"
date: 2018-05-07
categories:
- article
- coding
tags:
- technique
- cpp
slug: Reference Counting
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-05/2018-05-07.gif
draft: true
---

Reference counting is technique that allows multiple objects with the same value to share a sinple representation of that value.
<!--more-->

Consider a customized naive version of `class String;`: its assignment operator is implemented in a naive way:

```cpp
class String {
public:
    String(const char *value = "");
    String& operator=(const String& rhs);
    ...
private:
    char *data;
};

String& String::operator=(const String& rhs)
{
    if (this == &rhs) return *this;

    delete[] data;
    data = new char[strlen(rhs.data)+1];
    strcpy(data, rhs.data);
    return *this;
}
```

When we write statement `a = b = c = d = e = "Hello";` where `a`, `b`, `c`, `d` and `e` are all `String` type, we get five objects, each with the same value "Hello":

```
┌───┐     ┌───────┐   ┌───┐     ┌───────┐
│ a │ --> │ Hello │   │ b │ --> │ Hello │ 
└───┘     └───────┘   └───┘     └───────┘
┌───┐     ┌───────┐   ┌───┐     ┌───────┐
│ c │ --> │ Hello │   │ d │ --> │ Hello │ 
└───┘     └───────┘   └───┘     └───────┘
┌───┐     ┌───────┐
│ e │ --> │ Hello │
└───┘     └───────┘
```

Ideally, we'd like to change the picture to look like this:

```
┌───┐    
│ a ├──┐
└───┘  | 
┌───┐  | 
│ c ├──┤
└───┘  | 
┌───┐  |  ┌───────┐
│ e ├──┼─>│ Hello │
└───┘  |  └───────┘
┌───┐  | 
│ e ├──┤
└───┘  │ 
┌───┐  │ 
│ e ├──┘
└───┘    
```

In practice, we need to keep track of how many objects are sharing - _refering to_- a value to make sure the best time to destroy or modify the value "Hello", so we need to add _reference count_ into the picuture:

```
┌───┐    
│ a ├──┐
└───┘  | 
┌───┐  | 
│ c ├──┤
└───┘  | 
┌───┐  |  ┌───┐    ┌───────┐
│ e ├──┼─>│ 5 ├───>│ Hello │
└───┘  |  └───┘    └───────┘
┌───┐  | 
│ e ├──┤
└───┘  │ 
┌───┐  │ 
│ e ├──┘
└───┘    
```

## Implementing Reference Counting

From the picture above, we can see we need one reference count per string _value_, instead of one per string _object_. This implies a decoupling between values and reference counts, leading to our first design: nesting a `StringValue` struct in the private part of `String` class, so that all the members of `String` class get full access to this inner data structure, while everybody else get denied (except friends of the class, though).

```cpp
class String {
public:
    ...
private:
    struct StringValue { // holds a reference count and a string value
        size_t refCount;
        char *data;
        StringValue(const char *initValue);
        ~StringValue();
    }
    StringValue *value;        // value of this String
};

String::StringValue::StringValue(const char *initValue)
: refCount(1)
{
    data = new char[strlen(initValue)+1];
    strcpy(data, initValue);
}

String::StringValue::~StringValue()
{
    delete [] data;
}
```

The primary purpose of `StringValue` is to 

## Copy-on-write

## Pointers, References, and Copy-on-write

## Automating Reference Count Manipulations

## Puting everyting together

## Adding Refenrence Counting to Existing Classes