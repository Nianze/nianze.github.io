---
title: "[MECpp]Item-18 Amortize the Cost of Expected Computations"
date: 2018-04-12T15:31:55-04:00
categories:
- technology
- coding
tags:
- technique
- cpp
slug: Amortize the Cost of Expected Computations
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-04/2018-04-12.gif
---

The old Computer Science story: trade space for time[^1].
<!--more-->
<!-- toc -->

In order to improve program efficiency, we may use lazy evaluation (MECpp item 17), which is a technique for improving the efficiency of programs where results are not always needed. On the other side, when we must support operations whose results are almost always needed or whose results are often needed more than once, we may adopt "over-eager evaluation to amortize the cost of anticipated computations, such as caching and prefetching.

# Caching

Say we're writing a program to provide information about employees, and one of the pieces of information we expect to request frequently is an employee's cubicle number, which is stored in a database, but the database is not optimized to find it. In this case, we could cache the cubicle numbers to save the subsequent database lookups.

```cpp
int findCubicleNumber(const string& employeeName)
{
    typedef map<string, int> CubicleMap;
    static CubicleMap cubes;
    CubicleMap::iterator it = cubes.find(employeeName);
    if (it == cubes.end()) {
        int cubicle = // db query for the cubicle number
        cubes[employeeName] = cubicle;
        return cubicle;
    }
    else {
        return it->second; // or "(*it).second" if compiler does not support "->" for "it" object
    }
}
```

# Prefetching

According to the infamous _locality of reference_ phenomenon, if data in one place is requested, it's quite common to want nearby data, too, which justifies disk caches, memory caches for both instructions and data, and instruction prefetches.

Adopting similar concept, we can use similar strategy when writing a template for dynamic arrays, which will automatically extend themselves:

```cpp
template<class T>
class DynArray {...};

template<class T>
T& DynArray<T>::operator[](int index)
{
    if (index < 0) {
        throw an exception;
    }
    if (index > the current maximum index value) {
        int diff = index - the current maximum index value;
        call new to allocate enough additional memory so that (index+diff) is valid;
    }
    return the indexth element of the array;
}
```

This `operator[]` function allocates twice as much memory as needed each time the array must be extended, so that it saves one memory allocation when its logical size is extended twice in the following case:

```cpp
DynArray<double> a;  // only a[0] is valid
a[22] = 3.5;         // new is called to expand a's storage through index 44, 
                     // a's logical size is 23
a[32] = 0;           // a's logical size is now 33, without new being called
```

[^1]: Not always. Using large objects means fewer fit on a virtual memory or cache page. In rare cases, making objects bigger _reduces_ the performance of the software due to the increased paging activity and/or the decreased cache hit rate.
