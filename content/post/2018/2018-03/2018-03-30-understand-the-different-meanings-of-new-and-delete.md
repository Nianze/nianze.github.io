---
title: "[MECpp]Item-8 Understand the Different Meanings of New and Delete"
date: 2018-03-30T17:09:04-04:00
categories:
- article
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

## Relationship between `new` operator and `operator new`

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

1. if we only want to allocate memory

    Just call `operator new` directly:

    ```cpp
    void *rawMemory = operator new(sizeof(string));
    ```

2. if we want to customize the memory allocation that takes place when heap objects are created, write our own version of `operator new` and use the `new` operator, which will automatically invoke the custom version of `operator new`

3. if we want to construct an object in memory we've already got a pointer to, use placement `new`.
    
    * Placement `new`

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

