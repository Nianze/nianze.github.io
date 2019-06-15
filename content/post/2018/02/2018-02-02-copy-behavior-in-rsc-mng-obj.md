---
title: "Item-14 Copy behavior in resource-managing classes"
date: 2018-02-02T13:27:32-05:00
categories:
- technology
- coding
tags:
- technique
- cpp
slug: copy behavior of RAII
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-02/2018-02-02.jpg
---

Copying an RAII object entails copying the resource it manages, so the copying behavior of the resource determines the copying behavior of the RAII object.
<!--more-->

We can use `auto_ptr` and `tr1::shared_ptr` to manage heap-based resources, as introduced in item 13. However, not all resources are heap-based, and for such resources, we need to create our own resource-managing classes to deal with a general question: 

>what should happen when an RAII object is copied?

Mostly, there are 4 possibal choices:

### 1. Prohibit copying

In some cases, it makes no sense to allow RAII objects to be copied, so we should prohibit it. As explained in item 6, we declare the copying operations `private` without definition. A good example is class `Mutex`, which is synchronization primitives and comes with two functions `lock` and `unlock`:

```cpp
void lock(Mutex *pm);   // lock mutex pointed to by pm

void unlock(Mutex *pm); // unlock the mutex
```

We should not forget to unlock a `Mutex` we've locked, and it rarely makes sense to have "copies" of synchronization privitives, so we can create an uncopyable class to manage the locks:

```cpp
class Lock: private Uncopyable { // prohibit copying, see item 6
public:
    explicit Lock(Mutex *pm)
    : mutexPtr(pm)
    { lock(mutexPtr); }  // acquire resource

    ~Lock() { unlock(mutexPtr); }  // release resource

private:
    Mutex *mutexPtr;
};
```

And we can use `Lock` in the conventional RAII fashion:

```cpp
Mutex m;  // define the mutex
...


{                  // create block to define critical section
    Lock ml(&m);   // lock the mutex
    ...            // perform critical section operations

    // Lock ml2(ml);  this is prohibited behavior!
}                  // automatically unlock mutex at end of block
 
```

### 2. Reference-count the underlying resource

Sometimes it's desirable to hold on to a resource until the last object using it has been destroyed. We could implement reference-counting copying behavior by containing a `tr1::shared_ptr` data member, but in some cases we may have to customize the behavior when the reference count goes to zero, for the default behavior is to call `delete`.

The way we customize `tr1::shared_ptr` is to specify a "deleter" - a function or function object to be called when the reference count goes to zero (`auto_ptr` does not give us this privilege), which is an optional second parameter to the `tr1::shared_ptr` constructor:

```cpp
class Lock {
public:
    explicit Lock(Mutex *pm);  // init shared_ptr with the Mutex
    : mutexPtr(pm, unlock)     // to point to and the unlock func as the deleter
    {
        lock(mutexPtr.get());  // see item 15 for info on "get"
    }
private:
    std::tr1::shared_ptr<Mutex> mutexPtr;  // use shared_ptr instead of raw pointer
};
```

Since a class's destructor (both user-defined ones and compilter-generated ones) automatically invokes the destructors of the class's non-static data members, there's no need to declare a destructor for class `Lock` explicitly (item 5). We simply rely on the default compilter-generated behavior, and that's enough.

### 3. Copy the underlying resource

Sometimes we want to copy the resource-managing object as well as the resource it wraps, - that is to say, we want the resourse-managing object to perform a "deep copy". A good example is the standard `string` type: in sompe implementation, a `string` type object consists of a pointer to heap memory, where the charactors making up the string are stored, and a copy is made of both the pointer and the memory it points to when such an object get copied.

### 4. Transfer owenership of the underlying resource

On rere occasions, we wish only one RAII object refers to a raw resource and the ownership of the resource is transfered from the copied object to the copying object, as is the meaning of "copy" used by `auto_ptr`.

In this situation, we may have to write our own version of copying functions (copy constructor and copy assignment operator), since the default compiler-generated ones may not do what we want. In some cases, we'll also want to support generalized versions of copying functions, which is discussed in item 45.
