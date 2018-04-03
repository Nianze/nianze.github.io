---
title: "[MECpp]Item-9 Use Destructors to Prevent Resource Leaks"
date: 2018-04-01
categories:
- article
- coding
tags:
- technique
- cpp
slug: Use Destructors to Prevent Resource Leaks
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-03/2018-04-01.gif
---

To avoid resource leaks in the presence of exceptions, we can encapsulate resources inside objects.
<!--more-->

## Using objects to manage pointer-based resource

Suppose we're writing software for a shelter names Adorable Little Animals, an organization that finds homes for puppies and kittens. Each day the shelter creates a file containing information on the adoptions it arranged that day, so we need to read these files and do the approgriate procesing for each adoption. 

A reasonable design will use polymorphism: an abstract base class `ALA` ("adorable little animal"), with two concrete derived classes for puppies and kittens, and a virtual function `processAdoption` to handle the necessary species-specific processing:

```cpp
class ALA {
public:
    virtual void processAdoption() = 0;
    ...
};

class Puppy: public ALA {
public:
    virtual void processAdoption();
    ...
};

class Kitten: public ALA {
public:
    virtual void processAdoption();
    ...
};
```
Another thing we need is a _virtual constructor_ (MECpp item 25), which reads information from a file and produce either a `Puppy` object or a `Kitten` object, depending on the information in the file:

```cpp
ALA * readALA(istream& s);
```

Finally, the key processing part of the program looks like this:

```cpp
void processAdoptions(istream& dataSource)
{
    while (dataSource) {
        ALA *pa = readALA(dataSource);
        pa->processAdoption();
        delete pa;
    }
}
```

However, there's a potential resource leak: if `pa->processAdoption` threw an exception, all statements in `processAdoptions` after this statement would be skipped, ending up with `pa` never getting deleted. To solve it, an ungly design would be:

```cpp
void processAdoptions(istream& dataSource)
{
    while (dataSource) {
        ALA *pa = readALA(dataSource);
        try {
        pa->processAdoption();
        }
        catch (...) {
            delete pa;   // avoid resource leak when encountering exception
            throw;       // propagate exception to caller
        }
        delete pa;       // delete pa in normal condition
    }
}
```

The duplication in cleanup code is annoying to write and difficult to maintain. Remember that 

> Local objects are always destroyed when leaving a function, regardless of how that function is exited [^1].

So we can move the `delete` into a destructor for an object local to `processAdoptions`, which is exactly the functionaltity smart pointers in standard C++ library provide. For example, the essential of `auto_ptr` (item 13, MECpp item 28) boils down to following definition:

```cpp
template<class T>
class auto_ptr {
public:
    auto_ptr(T *p = 0): ptr(p) {}  // save ptr to object
    ~auto_ptr() { delete ptr; }    // delete ptr to object
private:
    T *ptr;                        // raw ptr to object
};
```

New `processAdoptions` using an `auto_ptr` object instead of a raw pointer:

```cpp
void processAdoptions(istream& dataSource)
{
    while (dataSource) {
        auto_ptr<ALA> pa(readALA(dataSource));
        pa->processAdoption();
    }
}
```

## Using objects to manage other resources

The idea behind `auto_ptr` is to use an object to store a resource that needs to be automatically released via the object's destructor, which applis to broader ranges of resource types as well. For example, in a GUI application that needs to create a window to display some information:

```cpp
void displayInfo(const Information& info) 
{
    WINDOW_HANDLE w(createWindow());
    display "info" in window corresponding to "w";
    destroyWindw(w);
}
```

The functions `createWindow` and `destroyWindow` for acquiring and releasing window resources should be packaged in an object to avoid resource leak in the situations where an exception is thrown during process of displaying `info` in `w`:

```cpp
// class for acquiring and releasing a window handle
class WindowHandle {
public:
    WindowHandle(WINDOW_HANDLE handle): w(handle) {}
    ~WindowHandle() { destroyWindow(w); }

    operator WINDOW_HANDLE() { return w; }  // implicit convertion operator to turn a WindowHandle into a WINDOW_HANDLE
private:
    WINDOW_HANDLE w;
    WindowHandle(const WindowHandle&); // prevent multiple copies
    WindowHandle& operator=(const WindowHandle&);  // prevent multiple copies
};
```

Note that the implicit conversion operator is essential to the practical application of a `WindowHandle` object, becauce it means we can use a `WindowHandle` just about anywhere we would normally use a raw `WINDOW_HANDLE` (refer to MECpp item 5 for downsides of doing so).

Given this `WindowHandle` class, we can rewrite `desplayInfo` as follows:

```cpp
void displayInfo(const Information& info) 
{
    WindowHandle w(createWindow());
    display "info" in window corresponding to "w";
}  // the window handled by "w" will always be released even if an exception is thrown
```

[^1]: The only exception to this rule is when we call `longjmp`, and this shortcoming of `longjmp` is the primary reason why C++ has support for exceptions in the first place.