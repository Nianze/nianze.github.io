---
title: "[MECpp]Item-8 Understand the Different Meanings of New and Delete"
date: 2018-03-30T17:09:04-04:00
categories:
- technology
- coding
tags:
- technique
- cpp
slug: Understand the Different Meanings of New and Delete
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-03/2018-03-30.gif
---

The behaviors of `new` operator and `operator new` is different.
<!--more-->

## Relationship between '`new` operator' and '`operator new`'

Consider the following code:

```cpp
string *ps = new string("Memory Management");
```

The `new` operator here is built into the language and always does the same two things:

* first, it calls `operator new` to allocate enough memory to hold an object of the type requested.
* second, it calls a constructor to initialize an object in the memory that was allocated.

Thus, when compiler sees the code above, they must generate code equivalent to this:

```cpp
void *memory = operator new(sizeof(string)); // get raw memory for a string object
call string::string("Memory Management") on *memory // init. the object in the memory. 
                                                    // as programmer, directly calling the ctor is prohibited
string *ps = static_cast<stirng*>(memory);  // make ps point to the new object
```

So if we want to create an object on the heap, use the `new` operator and it both allocates memory and calls a constructor for the object.

However, if we want to do some customized behaviors, we may consider following options:

1. if we only want to allocate memory, just call `operator new` directly:

    ```cpp
    void *rawMemory = operator new(sizeof(string));
    ```

2. if we want to customize the memory allocation that takes place when heap objects are created, write our own version of `operator new` and use the `new` operator, which will automatically invoke the custom version of `operator new`

3. if we want to construct an object in memory we've already got a pointer to, use **placement `new`**.

    A special version of `oeprator new` called _placement `new`_ allows us to construct an object in the memory that's already been allocated, which is helpful for applications using shared memory or memory-mapped I/O, where objects must be placed at specific addresses or in memory allocated by special routines:

    ```cpp
    class Widget {
    public:
        Widget(int widgetSize);
        ...
    };

    Widget * constructWidgetInBuffer(void *buffer, int widgetSize)
    {
        return new (buffer) Widget(widgetSize);
    }
    ```

    Here, an additional argument (`buffer`) is being specified for the implicit call that the `new` operator makes to a special version of `operator new` known as placement `new` in standard C++ library[^1]:

    ```cpp
    void * operator new(size_t, void *location)
    {
        return location;
    }
    ```

    All placement `new` has to do is return the pointer that's passed into it, because the memory for the object is already known. The unused (but mandatory) `size_t` parameter has no name to keep compilers from complaining about its not being used (MECpp item 6).

## Deletion and memory deallocation

The `delete` operator also includes two steps: destructing the object and deallocating the memory occupied by that object. The second part of memory deallocation is performed by the `operator delete` function:

```cpp
void operator delete(void *memoryToBeDeallocated);
```

Hence, for a pointer to string `ps`, `delete ps;` causes compilers to generate code that approximately corresponds to this:

```cpp
ps->~string();         // call the object's dtor
operator delete(ps);   // deallocate the memory the object occupied
```

Some implications:

* **If we want to deal with raw, uninitialized memory**, we should call `operator new` to get memory and `operator delete` to return it to the system (the C++ equivalent of calling `malloc` and `free`):

```cpp
void *buffer = operator new (50*sizeof(char)); // allocate enough memory to hold 50 chars, call no ctor
...
operator delete(buffer); // deallocate the memory; call no dtor
```

* **If we use placement `new` to create an object in some memory**, we should avoid using the `delete` operator on that memory:

```cpp
// function to allocating and deallocating memory in shared memory
void * mallocShared(size_t size);
void freeShared(void *memory);

void *sharedMemory = mallocShared(sizeof(Widget));
Widget *pw = constructWidgetInBuffer(sharedMemory, 10); // as above
...
delete pw; // undefined! sharedMemory came from mallocShared, not operator new
pw->~Widget();  // fine. destructs the Widget pointed to by pw, no memory deallocation performed
freeShared(pw);  // fine, deallocate the memory pointed to by pw, but calls no dtor
```

## Arrays

For array allocation:

```cpp
string *ps = new string[10]; // allocate an array of objects
```

The `new` being used is still the `new` operator, but the behavior here is slightly different from the case for single-object creation:
* in the first step, memory is allocated by `operator new[]` instead of `operator new`
* in the second step, the constructor is called for _each object_ in the array, so here the default constructor for `string` is called 10 times.

Similarly, when the `delete` operator is used on an array, it calls a destructor for each array element and then calls `operator delete[]` to deallocate the memory.

Just as we can replace or overload `operator new` and `operator delete`, we can do the same trick to `operator new []` and `operator delete []` to seize the control of memrory allocation and deallocation for arrays.

[^1]: To use placement `new`, all we have to do is is `#include <new>`.
