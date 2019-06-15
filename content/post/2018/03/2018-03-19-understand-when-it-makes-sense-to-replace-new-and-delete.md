---
title: "Item-50 Understand when it makes sense to replace new and delete"
date: 2018-03-19T10:54:04-04:00
categories:
- technology
- coding
tags:
- technique
- cpp
slug: understand when it makes sense to replace new and delete
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-03/2018-03-19.gif
---

There are many valid reasons for writing custom versions of `new` and `delete`, including improving performance, debugging heap usage errors, and collecting heap usage information.
<!--more-->

Some most common reasons to replace the compiler-provided versions of `operator new` and `operator delete`:

1. **To detect usage errors**:
    * By having `operator new` keep a list of allocated addresses and `operator delete` remove addresses from the list, it's easy to detect usage errors such as memory leaks (fail to `delete` memory conjured up by `new`) or over-`delete`(using more than one `delete` on `new`ed memory)
    * By customizing `operator new` to overallocate blocks so there's room to put known byte patterns ("signatures) before and after the memory made avaiblable to clients, `operator delete`s can check to see if the signatures are still intact, so that the abnormal pattern resulted from overrun (writing beyond the end of an allocated block) or underrun (writing prior to the begining of an allocated block) could be logged down, along with the value of the offending pointer.
2. **To collect usage statistics about dynamically allocated memory**:
    * Custome versions of `operator new` and `operator delete` make it easy to collect following information:
        - the distribution of allocated block sizes and their lifetimes
        - the order of allocation and deallocation (FIFO, LIFO, or random)
        - usage patterns change over time (e.g., different allocation/deallocation patterns in different stages of execution)
        - the maximum amount of dynamically allocated memory in use at any one time (e.g., its "high water mark")
3. **To improve efficiency**:
    * The `operator new`s and `operator delete`s that ship with compilers are designed for general-purpose use, which means they work reasonably well for everybody, but optimally for nobody. 
        - *To increase the speed of allocation and deallocation*: custom versions of `operator new` and `operator delete` are often faster, especially for fixed-size allocators such as those offered by Boost's Pool library. If our application is signle-threaded, but our compiler's default memory management routines are thread-safe, we may be able to win measurable speed improvements by writing thread-unsafe allocators (be sure to profile the program before speeding up though).
        - *To reduce the space overhead of default memory management*: general-purpose memory managers often use more memory to incur some overhead for each allocated block. Allocators tuned for small objects (such as those in Boost's Pool library) essentially eliminate such overhead.
4. **To compensate for suboptimal alignment in the default allocator**:
    * Many architectures require that data of particular types be placed in memory at particular kinds of address (otherwise it leads to hardware exceptions at runtime), while other architectures, thought accepting misaligned data, will offer better performance if alignment preferences are satisfied. For example, it's faster to access `double`s on x86 architecture when they are _eight-byte aligned_.
5. **To cluster related objects near one another**: 
    * if some particular data structures are generally used together and we'd like to minimize the frequency of page faults when working on the data, it makes sense to create a separate heap for the data structures so they are clustered together on as few pages as possible. For example, placement versions of `new` and `delete` (item 52) makes it possible to achieve such clustering.
6. **To obtain unconventinal behavior**:
    * For example, we might want to allocate and deallocate blocks in shared memory only through a C API to mange the memory, so we can write custome versions of `new` and `delete` (probably placement versions, item 52) to drape the C API in C++ clothing.
    * For another example, we might write a custom `operator delete` that overwrites deallocated memory with zeros in order to increase the security of application data.

Writing a custom memory manager that almost works is pretty easy, but writing one that works _well_ is a lot harder. For example, here's a quick first pass at a global `operator new` that facilitates the detection of under- and overruns.

```cpp
static const int signature = 0xDEADBEEF;

typedef unsigned char Byte;

// this code has several flaws
void* operator new(std::size_t size) throw (std::bad_alloc)
{
    using namespace std;

    size_t realSize = size + 2 * sizeof(int); // increase size of request so 2 signatures will also fit inside
    void *pMem = malloc(realSize); // call malloc to get the actual memory
    if (!pMem) throw bad_alloc();
    // write signature into first and last parts of the memory
    *(static_cast<int*>(pMem)) = signature;
    *(reinterpret_cast<int*>(static_cast<Byte*>(pMem)+realSize-sizeof(int))) = signature;
    // return a pointer to the memory just past the first signature
    return static_cast<Byte*>(pMem) + sizeof(int);
}
```

One obvious shortcoming of this `operator new` is its failure to adhere to the C++ conventions for `operator new` - item 51 explains that all `operator new` should contain a loop calling a new-handling function, but this one above doesn't.

Another subtle issue is _alignment_: C++ requires that all `operator new` and `malloc` return pointers that are suitably aligned for _any_ data type. In this version of `operator new`, we're returning a pointer we got from malloc _offset by the size of an int_. If we are running on a manchine where `int`s were four bytes in size but `double`s were required to be eight-byte aligned, we'd probably return a pointer with improper alignment when `operator new` is called to get enough memory for a `double`.

As a general rule, do not attempt writing a custom memory manager unless we have to. In fact, in many cases, we don't have to: 

* some compilers have switches that enable debugging and logging functionality in their memory management functions.
* on many platforms, commercial products can replace the memory management functions that ship with compilers (all we need is to buy and relink).

Even if we decide to write our own `new`s and `delete`s, it's helpful to look at open source versions first to gain insights into the easy-to-overlook details that separate almost working from really working. One such open source allocator is the Pool library from Boost (item 55). 

>The pool library offers allocators tuned for one of the most common situations in which custom memory management is helpful: allocation of a large number of small objects. Real libraries tend to have code that's robust in terms of pesky details such as portability and alignment considerations, thread safety, etc.
