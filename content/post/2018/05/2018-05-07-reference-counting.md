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
│ c ├──┼─>│ 5 ├───>│ Hello │
└───┘  |  └───┘    └───────┘
┌───┐  | 
│ d ├──┤
└───┘  │ 
┌───┐  │ 
│ e ├──┘
└───┘    
```

## Implementing Reference Counting

From the picture above, we can see we need one reference count per string _value_, instead of one per string _object_. This implies a decoupling between values and reference counts, leading to our first design: nesting a `StringValue` struct in the private part of `String` class, so that all the members of `String` class get full access to this inner data structure, while everybody else get denied (except friends of the class).

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

The primary purpose of `StringValue` is to provide a place to associate a particular value with a count of the number of `String` objects sharing that value, so there's need to define copy constructor or assignment operator for this inner struct, and we provide the manipulation of the `refCount` field in `String` class:

```cpp
class String {
public:
    String(const char *initValue = "");
    String(const String& rhs);
    ~String();
    String& operator=(const String& rhs);
    ...
};

String::String(const char *initValue)
: value(new StringValue(initValue))
{}

String::String(const String& rhs)
: value(rhs.value)
{
    ++value->refCount;
}

String::~String()
{
    if (--value->refCount == 0) delete value;
}

String& String::operator=(const String& rhs)
{
    if (value == rhs.value) {
        return *this;
    }

    if (--value->refCount == 0) { // destroy *this's value
        delete value;             // if no one else is using it
    }

    value = rhs.value;
    ++value->refCount;

    return *this;
}
```

## Copy-on-write

Now comes the troublesome one: an array-bracket operator([]), which allows individual characters within strings to be read and written:

```cpp
class String {
public:
    const char& operator[](int index) const;  // for const Strings
    char& operator[](int index); // for non-const Strings
    ...
};
```

It's straightforward to implement the const version, because it's a read-only operation:

```cpp
const char& String::operator[](int index) const
{
    return value->data[index]; // here's no sanity checking on index, just like C++ tradition; easy to add though
}
```

However, since non-const version of `operator[]` might be called to write a character, the implementation must consider more scenario to avoid modifying the value of other `String` objects that happen to be sharing the same `StringValue` object - since there's no way for C++ compilers to tell us whether a particular use of `operator[]` is for a read or a write, we must be pessimistic and assume _all_ calls to the non-const `operator[]` are for writes (Proxy classes casn help us differentiate reads from writes, see MECpp item 30.)

```cpp
char& String::operator[](int index)
{
    // if sharing a value with other String obj.
    // break off a separate copy of the value
    if (value->refCount > 1) {
        --value->refCount;
        value = new StringValue(value->data);
    }
    return value->data[index];
}
```

This technique - to share a value with other objects until we have to write on our own copy of the value - is the well-knwon _copy-on-write_, which is a specific example of _lazy evaluation_ (MECpp item 17), which is a more general approach to efficiency.

## Pointers, References, and Copy-on-write

Consider this code:

```cpp
String s1 = "Hello";
char *p = &s1[1];
Stirng s2 = s1;
```

The data structure looks like this:

```
┌───┐    
│s1 ├──┐  ┌───┐    ┌───────┐
└───┘  ├─>│ 2 ├───>│ Hello │
┌───┐  │  └───┘    └───────┘
│s2 ├──┘              ↑
└───┘                 p
```

Now there is a dangerous situation, where pointer `p` modifies both `s1` and `s2`:

```cpp
*p = 'x';  // modifies both s1 and s2
```

To eliminate the problem, we add a flag to each `StringValue` object indicating whether that object is shareable. Initially, the flag is set to `true` (indicating shareable), but turn it off whenever the non-const `operator[]` is invoked on the value represented by that object (once the flag is set to `false`, it stays that way forever).

```cpp
class String {
public:
    struct StirngValue {
        size_t refCount;
        bool shareable;  // add this line
        char *data;
        ...
    };
    ...
};

String::StringValue::StringValue(const char *initValue)
: refCount(1),
  shareable(true) // add this line
{
    data = new char[strlen(initValue) + 1];
    strcpy(data, initValue);
}

String::String(const String& rhs)
{
    if (rhs.value->shareable) {  // add this checking
        value = rhs.value;
        ++value->refCount;
    }
    else {
        value = new StringValue(rhs.value->data);
    }
}

char& String::operator[](int index)
{
    if (value->refCount > 1) {
        --value->refCount;
        value = new StringValue(value->data);
    }
    value->shareable = false;  // add this
    return value->data[index];
}
```

## A Reference-Counting Base class

Reference counting is useful for more than just strings, so it's good practice to separate reference counting code in a context-independent manner. This leads us to the design of a base class `RCObject`. Any class wishing to take advantage of automatic reference counting may inherit from this class. Basically, for general purpose usage, `RCObject` class should include

* the reference count, as well as functions for incrementing and decrementing that count.
* the code for destroying a value when it is no longer in use (count == 0)
* a field that keeps track of whether this value is shareable, as well as functions to query this flag and set it to false

```cpp
class RCObject {
public:
    RCObject();
    RCObject(const RCObject& rhs);
    RCObject& operator=(const RCObject& rhs);
    virtual ~RCObject() = 0; // virtual shows this class is designed as a base class; pure virtual so that this class should be used only as a base class
    void addReference();
    void removeReference();
    
    void markUnshareable();
    bool isShareable() const;
    bool isShared() const;

private:
    size_t refCount;
    bool shareable;
};
```

```cpp
。。。
```

## Automating Reference Count Manipulations

## Puting Everyting Together

## Adding Refenrence Counting to Existing Classes