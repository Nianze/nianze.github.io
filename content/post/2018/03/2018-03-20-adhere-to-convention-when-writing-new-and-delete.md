---
title: "Item-51 Adhere to convention when writing new and delete"
date: 2018-03-20T14:32:24-04:00
categories:
- technology
- coding
tags:
- technique
- cpp
slug: adhere to convention when writing new and delete
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-03/2018-03-20.gif
---

`operator new` should contain an infinite loop trying to allocate memory, should call the new-handler if it can't satisfy a memory request, and should handle requests for zero bytes; class-specific versions should handle requests for larger blocks than expected. `operator delete` should do nothing if passed a pointer that is null; class specific versions should handle blocks that are larger than expected.
<!--more-->

When write our own versions of `operator new` and `operator delete`, there are conventions we must follow.

## 1. operator new

Implementing a conformant `operator new` requires:

* having the right return value
* calling the new-handling function when insufficient memory is available (item 49)
* being prepared to cope with requests for no memory
* avoiding hiding the "normal" form of `new` (item 52)

#### Have the right return value

If succeeding to supply the requested memory, return a pointer to it.

#### Call the new-handler

If failing to supply the requested memory, follow the rule in item 49 to call the new-handling function after each fauilure. It is assumed that new-handling function might be able to free up some memory. Throw an exception of type `bad_alloc` only when the pointer to the new-handler is null.

#### Cope with request for no memory

C++ requires that `operator new` return a legitimate pointer even when zero bytes are requested (because this simplifies things else where in the language), so pseudocode for a non-member `operator new` looks like this:

```cpp
void* operator new(std::size_t size) throw(std::bad_alloc)
{
    using namespace std;
    if (size == 0) {
        size = 1;  // handle 0-byte requests by treating them as 1-byte requests
    }
    while(true) {
        attempt to allocate size bytes
        if (succeed to allocate)
            return (a pointer to the memory);
        // allocation fails
        new_handler globalHanlder = set_new_hanlder(0); // find out current 
        set_new_handler(globalHandler);   // new handling-function
        if (globalHandler) (*globaleHandler)();
        else throw std::bad_alloc();
    }
}
```

#### Avoid hiding the "normal" form of `new`

Class specific `operator new` member functions are inherited by derived classes, so it is possible that the `operator new` tuned for objects of size `sizeof(base)` might accidentally be called to allocate memory for an object of a derived class. To handle this situation, do following trick:

```cpp
class Base {
public:
    static void * operator new(std::size_t size) throw(std::bad_alloc);
    ... 
};

class Derived:public Base  // Derived doesn't declare operator new
{...};

void * Base::operator new(std::size_t size) throw(std::bad_alloc)
{
    if (size != sizeof(Base))
        return ::operator new(size); // if size is "wrong", call standard operator new
    ...  // otherwise do the Base-specific operation
}

Derived *p = new Derived; // calls Base::operator new
```

Note that `sizeof(Base)` can never be zero - freestanding objects have non-zero size (item 39) - so the zero-size memory request will be forwarded to `::operator new` to handle in a reasonable fashion.

#### Control memory allocation for `operator new[]`

To control allocation for arrays on a per-class basis, we need to implement `operator new[]` - all we can do is allocating a chunk of raw memory. The point here is that we can not do any assumption about the as-yet-nonexistent objects in the array: 

1. it is possible to allocate memory for an array of derived class objects via base class's `operator new[]` through inheritance, and the size of derived class objects are usually bigger than base class objects, so the number of objects in the array is no neccessarily `(bytes requested) / sizeof(Base)`
2. `size_t` parameter passed to `operator new[]` may be for more memory than will be filled with objects, because dynamically allocated arrays may include extra space to store the number of array elements (item 16).

## 2. operator delete

C++ guarantees it's always safe to delete the null pointer, so things are easier in terms of implementing `operator delete`:

```cpp
// non-member operator delete
void operator delete(void *rawMemory) throw()
{
    if (rawMemory == 0) return;  // do nothing if the null pointer is being deleted
    deallocate the memory pointed to by rawMemory
}
```
```cpp
// class-specific operator delete
class Base {  // same as before, except that operator delete is declared
public:
    static void * operator new(std::size_t size) throw(std::bad_alloc);
    static void operator delete(void *rawMemory, std::size_t size) throw();
    ...
}

void Base::opearator delete(void *rawMemory, std::size_t size) throw()
{
    if (rawMemory == 0) return;
    if (size != sizeOf(Base)) {        // if size is "wrong", 
        ::operator delete(rawMemory);  // use standard operator delete to handle the request
    }
    deallocate the memory pointed to by rawMemory;
    return;
}
```

BTW, the `size_t` value C++ passes to `operator delete` may be incorrect if object being deleted was derived from a base class lacking a virtual destructor, which is another reason to support the argument in item 7 that `operator delete` may not work correctly if virtual destructors is omitted in base classes.
