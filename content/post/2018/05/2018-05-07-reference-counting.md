---
title: "[MECpp]Item-29 Reference Counting"
date: 2018-05-07
categories:
- technology
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
RCObject::RCObject()
: refCount(0), shareable(true) {}

RCObject::RCObject(const RCObject&)
: refCount(0), shareable(true) {}

RCObject& RCObject::operator=(const RCObject&)
{ return *this; }

RCObject::~RCObject() {} // pure virtual dtor still need to be impl. see MECpp item 33

void RCObject::addReference() { ++refCount; }

void RCObject::removeReference() 
{ if(--refCount == 0) delete this; }

void RCObject::markUnshareable()
{ shareable = false; }

bool RCObject::isShareable() const
{ return shareable; }

bool RCObject::isShared() const
{ return refCount > 1; }
```

In this design, there are a few things worth noting:

1. The `refCount` is set to 0 in both constructors to simplifies the set up process for the creaters of `RCObject`s when they set `refCount` to 1 themselves
2. Copy constructor sets `refCount` to 0, because this function is meant to create a new object representing a value, which is always unshared and referenced only by their creator (who will set up `refCount` properly later).
3. The assignment operator is unlikely to be called, since `RCObject` is a base class for a shared _value_ object, which means in a reference counting system, it is usually the object pointing to these base-class objects that are assigned to one another, with only `refCount` being modified as a result. We don't declare assignment operator `private`, because there's a chance that someone does have a reason to allow assignment of reference-counted values(e.g., change the string value stored inside `StringValue` in the example above), so we adopt this "do nothing" implementation, which is exactly the right thing to do, because the assignment of value objects doesn't affect the reference count of objects pointing to either `lhs` or `rhs` of assignment operation: this base-class level assignment is meant to change `lhs`'s value, meaning all the objects pointing to `lhs` now pointing to a new value.
4. Here we use `delete this;` for `removeReference`, which is safe only if we know that `*this` is a heap object. In order to ensure this, we might need technichs discussed in MECpp item 27 to restrict `RCObject` to be created only on the heap[^1].

Now taking advantage of this new reference-counting base class, we modify `StringValue` to inherit its reference counting capabilities from `RCObject`:

```cpp
class String {
private:
    struct StringValue: public RCObject {
        char *data;
        StringValue(const char *initValue);
        ~StringValue();
    };
...
};

String::StringValue::StringValue(const char *initValue)
{
    data = new char[strlen(initValue) + 1];
    strcpy(data, initValue);
}

String::StringValue::~StringValue()
{
    delete [] data;
}
```

After this change, `RCObject` now provide the manipulation ability of the `refCount` field, instead of `StringValue`.

## Automating Reference Count Manipulations

The `RCObject` class only gives us a place to store a reference count, as well as the member functions to manipulate the `refCount` field. However, the _calls_ to these functions must still be mannually inserted in other classes: `String` copy constructor and assignment operator need to call `addReference` and `removeReference` on `StringValue` objects, which is not good practice for reuse.

To remove such manual works, we introduce _smart pointer_ for help:

```cpp
// template class for smart pointers-to-T object. T must
// support the RCObject interface, typically by inheriting from RCObject
template<class T>
class RCPtr {
public:
    RCPtr(T* realPtr = 0);
    RCPtr(const RCPtr& rhs);
    ~RCPtr();

    RCPtr& operator=(const RCPtr& rhs);

    T* operator->() const;
    T& operator*() const;
private:
    T *pointee;  // dumb pointer this object is emulating
    void init(); // common init. code
};
```

```cpp
template<class T>
RCPtr<T>::RCPtr(T* realPtr): pointee(realPtr)
{
    init();
}

template<class T>
RCPtr<T>::RCPtr(const RCPtr& rhs): pointee(rhs.pointee)
{
    init();
}

template<class T>
void RCPtr<T>::init()
{
    if (pointee == 0) {
        return;
    }
    if (pointee->isShareable() == false) {
        pointee = new T(*pointee);
    }
    pointee->addReference(); // always add a new reference to the value
}

template<class T>
RCPtr<T>& RCPtr<T>::operator=(const RCPtr& rhs)
{
    if (pointee != rhs.pointee)
        T *oldPointee = pointee;
        pointee = rhs.pointee;
        init();  // if possible, share it; else make own copy
        if (oldPointee) {
            oldPointee->removeReference();
        }
    }
    return *this;
}

template<class T>
RCPtr<T>::~RCPtr()
{
    if (pointee) pointee->removeReference();
}

template<class T>
T* RCPtr::operator->() const { return pointee; }

template<class T>
T& RCPtr::operator*() const { return *pointee; }
```

There are three assumptions in this implementation:

1. `T` has a deep-copying constructor, because `pointee = new T(*pointee);` will call `T`'s copy constructor. In the example above, `String::StringValue` lack such a user-defined copy constructor, and compiler generated default copy constructor will not copy `char*` string `data` points to, so we need to add a customized version of copy constructor:
```cpp
String::StringValue::StirngValue(const StringValue& rhs)
{
    data = new char(strlen(rhs.data) + 1);
    strcpy(data, rhs.data);
}
```
2. For the same statement calling `T`'s copy constructor, we assume the type of `*pointee` is `T` rather than `T`'s derived class. If, however, chances are `poinee` might point to `T`'s derived class instances, we need to use a virtual copy constructor.
3. `T` should prove all the functionality that `RCObject` does, either or not by inheriting from `RCObject`.

## Puting Everyting Together

```
                     ┌──────────┐  
┌──────────┐         │ RCObject │ 
│  String  │         │  class   │
│  object  │         └──────────┘
│          │              ↑ public inheritance
│ ┌─────┐  │         ┌───────────┐         ┌────────────┐
│ │RCPtr├──┼────────>│StringValue├────────>| Heap Memory|
│ └─────┘  │ pointer │  object   | pointer └────────────┘
└──────────┘         └───────────┘ 
```

The class declaration looks like this:

```cpp
template<class T>
class RCPtr {
public:
    RCPtr(T* realPtr = 0);
    RCPtr(const RCPtr& rhs);
    RCPtr& operator=(const RCPtr& rhs);
    ~RCPtr();

    T* operator->() const;
    T& operator*() const;
private:
    T *pointee;
    void init();
};

class RCObject {
public:
    RCObjet();
    RCObject(const RCObject& rhs);
    RCObject& operator=(const RCOBject& rhs);
    virtual ~RCObject() = 0;

    void addReference();
    void removeReference();

    void markUnshareable();
    bool isShareable() const;
    bool isShared() const;
private:
    size_t refCount;
    bool shareable;
};

class String {
public:
    String(const char *value = "");

    const char& operator[](int index) const;
    char& operator[](int index);
private:
    // class representing string value
    struct StringValue: public RCObject {
        char *data;

        StringValue(const char *initValue);
        StringValue(const StringValue& rhs);
        void init(const char *initValue);
        ~StringValue();
    };
    RCPtr<StringValue> value;
```

It is worth to note that we don't need the copy constructor or assignment operator for `String` anymore: compiler-generated copy constructor for `Stirng` will automatically call the copy constructor for `Stirng`'s `RCPtr` member, and the copy constructor for _that_ class will perform all the necessary manipulations of the `StringValue` object, including its reference count, and the same goes for assignment and destruction. That's why it is called _smart_ pointer.

Now here is all the implementation:

```cpp
RCObject::RCObject()
: refCount(0), shareable(true) {}

RCObject::RCObject(const RCObject&)
: refCount(0), shareable(true) {}

RCObject& RCObject::operator=(const RCObject&)
{ return *this; }

RCObject::~RCObject() {}

void RCObject::addReference() { ++refCount; }

void RCObject::removeReference() 
{ if (--refCount == 0) delete this; }

void RCObject::markUnshareable()
{ shareable = false; }

bool RCObject::isShareable() const
{ return shareable; }

bool RCObject::isShared() const
{ return refCount > 1; }
```

```cpp
template<class T>
void RCPtr<T>::init()
{
    if (pointee == 0) {
        return;
    }
    if (pointee->isShareable() == false) {
        pointee = new T(*pointee);
    }
    pointee->addReference(); 
}
template<class T>
RCPtr<T>::RCPtr(T* realPtr): pointee(realPtr)
{ init(); }

template<class T>
RCPtr<T>::RCPtr(const RCPtr& rhs): pointee(rhs.pointee)
{ init(); }


template<class T>
RCPtr<T>& RCPtr<T>::operator=(const RCPtr& rhs)
{
    if (pointee != rhs.pointee)
        T *oldPointee = pointee;
        pointee = rhs.pointee;
        init();  // if possible, share it; else make own copy
        if (oldPointee) {
            oldPointee->removeReference();
        }
    }
    return *this;
}

template<class T>
RCPtr<T>::~RCPtr()
{ if (pointee) pointee->removeReference(); }

template<class T>
T* RCPtr::operator->() const { return pointee; }

template<class T>
T& RCPtr::operator*() const { return *pointee; }
```

```cpp
void String::StringValue::init(const char *initValue) // ctor and deep copy ctor share this same init function
{
    data = new char[strlen(initValue) + 1];
    strcpy(data, initValue);
}

String::StringValue::StringValue(const char *initValue)
{ init(initValue); }

String::StringValue::StringValue(const StringValue& rhs)
{ init(rhs.data); }

String::StringValue::~StringValue()
{ delete [] data; }
```

```cpp
String::String(const char *initValue)
: value(new StringValue(initValue)) {}

const char& String::operator[](int index) const
{ return value->data[index]; }

char& String::operator[](int index)
{
    if (value->isShared()) {
        value = new StirngValue(value->data);
    }
    value->markUnshareable();
    return value->data[index];
}
```

## Adding Refenrence Counting to Existing Classes

Given some class `Widget` that's in a library we can't modify, and suppose we want to apply the benefits of reference counting to `Widget` without being able to inherit `Widget` from `RCObject`, we solve the problem with an additional level of indirection by adding a new class `CountHolder`, which does three jobs:

1. Hold the reference
2. Inherit from `RCObject`
3. Contain a pointer to a `Widget`

The only thing left to do is just an equivalent smart pointer as `RCPtr`, and we call it `RCIPtr`, where "I" stands for "indirect". Thus, we get someting like this:

```
                     ┌──────────┐  
┌──────────┐         │ RCObject │ 
│ RCWidget │         │  class   │
│  object  │         └──────────┘
│ ┌──────┐ │              ↑ public inheritance
│ |RCIPtr| │         ┌───────────┐         ┌─────────────┐
│ |Object├─┼────────>│CountHolder├────────>|Widget Object|
│ └──────┘ │ pointer │  object   | pointer └─────────────┘
└──────────┘         └───────────┘ 
```

Since here `CountHolder` is just an implementation detial of `RCIPtr`, we can simply nested it inside `RCIPtr`, just as how `StringValue` relates with `String`.

```cpp
template<class T>
class RCIPtr {
public:
    RCIPtr(T* realPtr = 0);
    RCIPtr(const RCIPtr& rhs);
    ~RCIPtr();

    RCIPtr& operator=(const RCIPtr& rhs);

    T* operator->() const;
    T& operator*() const;

    RCObject& getRCObject();  // give clients access
    { return *counter; }      // isShared, etc.
private:
    struct CountHolder: public RCObject {
        ~CountHolder() { delete pointee; }
        T *pointee;
    };
    CountHolder *counter;
    void init();
};

template<class T>
void RCIPtr<T>::init()
{
    if (counter->iShareable() == false) {
        T *oldValue = counter->pointee;
        counter = new CountHolder;
        counter->pointee = oldValue ? new T(*oldValue) : 0;
    }
    counter->addReference();
}

template<class T>
RCIPtr<T>::RCIPtr(T* realPtr)
: counter(new CountHolder)
{
    counter->ponitee = realPtr;
    init();
}

template<class T>
RCIPtr<T>::RCIPtr(const RCIPtr& rhs)
: counter(rhs.counter)
{ init(); }

template<class T>
RCIPtr<T>::~RCIPtr()
{ counter->removeReference(); }

template<class T>
RCIPtr<T>& RCIPtr<T>::operator=(const RCIPtr& rhs)
{
    if (counter != rhs.counter) {
        counter->removeReference();
        counter = rhs.counter;
        init();
    }
    return *this;
}

template<class T>
T* RCIPtr<T>::operator->() const
{ return counter->pointee; }

template<class T>
T& RCIPtr<T>::operator*() const
{ return *(counter->pointee); }
```

Then, for a library class `Widget` with following interface:

```cpp
class Widget {
public:
    Widget(int size);
    Widget(const Widget& rhs);
    ~Widget();

    Widge& operator=(const Widget& rhs);

    void doThis();
    int showThat() const;
};
```

We can implementing wrapper `RCWidget` by simply forwarding the call through underlying `RCIPtr` to a `Widget`object:

```cpp
class RCWidget {
public:
    RCWidget(int size): value(new Widget(size)) {}

    void doThis()
    {
        if (value.getRCObject().isShared()) {
            value = new Widget(*value);
        }
        value->doThis();
    }
    int showThat() const { return value->showThat(); }
private:
    RCIPtr<Widget> value;
};
```

As with `Stirng` class, there's no need to write copy constructor, assignment operator, or destructor, because the default versions do the right thing.

[^1]: In this example, we guarantee the value objects should be created only via `new` by declaring `StringValue` as `private` in `String`, so only `String` can create `StringValue` objects and the auther of the `String` class is able to ensure all such objects are allocated via `new`.
