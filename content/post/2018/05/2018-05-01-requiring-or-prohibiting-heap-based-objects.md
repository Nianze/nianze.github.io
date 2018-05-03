---
title: "[MECpp]Item-27 Requiring or Prohibiting Heap Based Objects"
date: 2018-05-01
categories:
- article
- coding
tags:
- technique
- cpp
slug: Requiring or Prohibiting Heap Based Objects
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-04/2018-04-25.gif
---

Techniques for requiring or prohibiting heap-based objects
<!--more-->

## Requiring Heap-Based Objects

### 1. The straightforward way

The brutle way is to declare the constructors and the destructor `private`, but this is overkill. Either one of them need to be private to ensure objects only be created on the heap. Since there are usually many constructors but only one destructor per class, a more elegant way is to make the destructor private and the constructors public, prividing privileged pseudo-destructor function (which has access to the real destructor) for clients to call, as suggested in MECpp item 26.

Example:

```cpp
class UPNumber { // unlimited precision numbers that should only exist on the heap
public:
    UPNumber();
    UPNumber(int initValue);
    UPNumber(double initValue);
    UPNumber(const UPNumber& rhs);
    // pseudo-destructor (a const member function, because even const obj. may be destroyed)
    void destroy() const { delete this; }
    ...
private:
    ~UPNumber();
};
```

Clients would program like this:

```cpp
UPNumber n; // error! (legal here, but illegal when n's dtor is implicitly invoked later)
UPNumber *p = new UPNumber; // fine
...
delete p; // error! attempt to call private dtor
p->destroy(); // fine
```

### 2. Inheritance-and-containment friendly

Restricting access to a class's destructor or constructors prevents the creation of not only non-heap objects, but also both inheritance and containment. To work this out:

* To be friendly for inheritance, we declare `protected` for `UPNumber`'s destructor.
* To be friendly for containment, classes that need objects of type `UPNumber` can be modified to contain pointers to `UPNumber` object instead:

```cpp
class UPNumer {...};  // declare dtor protected
class NonNegativeUPNumber: public UPNumber {...}; // okay to access protected members

class Asset {
public:
    Asset(int initValue);
    ~Asset();
    ...
private:
    UPNumber *value;
};

Asset::Asset(int initValue)
: value(new UPNumber(initValue)) // fine
{...}

Asset::~Asset()
{ value->destroy(); }  // fine
```

### 3. Determining Whether an Object is On The Heap

It's hard to tell whether an object is on the heap. For example, given the class definition above, it's ligal to define a non-heap `NonNegativeUPNumber` object, which will not construct its base `UPNumber` part on the heap. There is no way to detect whether a constructor is being invoked as the base class part of a heap-based object, which means for the following contexts, it is not possible for the `UPNumber` constructor to detect the difference:

```cpp
NonNegativeUPNumber *n1 = new NonNegativeUPNumber; // on heap
NonNegativeUPNumber n2; // not on heap
```

Sadly, there's no portable way to determine whether an object is on the heap, and there isn't even a semi-portable way that works most of the time. Detailed dicussion on this topic could be found at [Comments on Item 27 of More Effective C++](http://www.aristeia.com/BookErrata/M27Comments.html).

We'll have to turn to unportable, implementation-dependent system calls if we absolutely have to tell whether an address is on the heap. That being the case, we'd better off trying to redesign the software so we don't need to determine whether an object is on the heap in the first place.

#### 4. Determine whether it's safe to delete a pointer

To answer this easier question, all we need to do is to create a collection of addresses that have been returned by `operator new`. One possible solution is to provide an abstract mixin base class that offers derived classes the ability to determine whether a pointer was allocated from `operator new`:

```cpp
class HeapTracked { // mixin class; keeps track of ptrs returned from op. new
public:
    class MissingAddress();  // exception class
    virtual ~HeapTracked() = 0;

    static void *operator new(size_t size);
    static void operator delete(void *ptr);

    bool isOnHeap() const;
private:
    typedef const void* RawAddress;
    static list<RawAddress> addresses;
};
```

```cpp
// mandatory definition of static class member
list<RawAddress> HeapTracked::address;
// tho being pure virtual, dtor still needs to be defined
HEapTracked::~HeapTracked() {}

void * HeapTracked::operator new(size_t size)
{
    void *memPtr = ::operator new(size); // get the memory
    addresses.push_front(memPtr);
    return memPtr;
}

void HeapTracked::operator delete(void *ptr)
{
    // gracefully handle null pointer
    if (ptr == 0) return;
    list<RawAddress>::iterator it = 
        find(addresses.begin(), addresses.end(), ptr);
    if (it != addresses.end()) {
        addresses.erase(it);     // remove the entry
        ::operator delete(ptr);  // deallocate the memory
    } else {
        throw MissingAddress();  // ptr wasn't allocated by op. new. throw an exception
    }
}

bool HeapTracked::isOnHeap() const
{
    // get a pointer to the beginning of the memory occupied by *this
    const void *rawAddress = dynamic_cast<cosnt void*>(this);
    list<RawAddress>::iterator it = 
        find(addresses.begin(), addresses.end(), rawAddress);
    return it != addresses.end();  // return whether it was found
}
```

Note that `dynamic_cast` is applicable only to pointers to objects that have at least one virtual function, and `dynamic_cast`ing a pointer to `void*` (or `const void*` or `volatile void*` or `const volatile void*`) yields a pointer to the beginning of the memory for the object pointed to by the pointer. Here `dynamic_cast`ing `this` to `const void*` gives us a pointer to the beginning of the memory for the current object, which is the pointer previously returned by `HeapTracked::operator new` as long as the memory for the current object was allocated by `HeapTracked::operator new` in the first place.

To use this basic class, say we want to be able to determine whether a pointer to an `Asset` object points to a heap-based object, simply modify `Asset`'s class definition to specify `HeapTracked` as a base class:

```cpp
class Asset: public HeapTracked {
private:
    UPNumber value;
    ...
};
```

And we could query `Asset*` pointers as follows:

```cpp
void inventoryAsset(const Asset *ap)
{
    if (ap->isOnHeap()) {
        as is a heap-based asset -- inventory it as such
    } 
    else {
        ap is non-heap-based  asset  -- record it that way
    }
}
```

Since built-in types such as `int` and `char` can't inherit from anything, `HeapTracked` can't be used with these built-in types. Still, the most common reason for wanting to use a class like `HeapTracked` is to determine whether it's okay to `delete this`, and we don't want to do that with a built-in type because such types have no `this` pointer.

## Prohibiting Heap-Based Objects

To preventing objects from being allocated on the heap, there are three cases:

1. objects that are directly instantiated
2. objects instantiated as base class parts of derived class objects
3. objects embedded inside other objects

#### 1. Preventing directly instantiation on heap

To prevent clients from directly instantiating objects on the heap: we can declare `operator new` (and possibly `operator new[]`) as `private`:

```cpp
class UPNumber {
private:
    static void *operator new(size_t size);
    static void operator delete(void *ptr);
    ...
};
```

```cpp
UPNumber n1;  // okay
static UPNumber n2;  // okay
UPNumber *p = new UPNumber; // error! attempt to call private operator new
```

Declaring `operator new` private often also prevents `UPNumber` objects from being instantiated as base class parts of heap-based derived class objects, because `operator new` and `operator delete` are inherited, so if these functions aren't declared public in a derived class, that class inherits the private versions declared in its base(s):

```cpp
class UPNumber {...}; // as above
class NonNegativeUPNumber: public UPNumber { // declares no operator new
    ...
};

NonNegativeUPNumber n1; // okay
static NonNegativeUPNumber n2; // okay
NonNegativeUPNumber *p = new NonNegativeUPNumber; // error! attempt to call private operator new
```

#### 2. Preventing base class parts instantiated on heap

However, if the derived class declares an `operator new` of its own, which will be called when allocating derived class objects on the heap, it is hard to prevent `UPNumber` base class parts from winding up there. 

#### 3. Preventing base class parts instantiated on heap

Similarly, the fact that `UPNumber`'s `operator new` is private has no effect on attempts to allocate objects containing `UPNumber` objects as members:

```cpp
class Asset {
public:
    Asset(int initValue);
    ...
private:
    UPNumber value;
};

Asset *pa = new Asset(100);  // fine, calls Asset::operator new or ::operator new,
                             // not UPNumber::operator new
```

Just as there's no portable way to determine if an address is on the heap, however, there is no portable way to determine that it is not on the heap, so we can't throw an exception in the `UPNumber` constructors if a to-be-tested `UPNumber` object being constructed is on the heap. We're out of luck.