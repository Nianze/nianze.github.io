---
title: "[MECpp]Item-23 Consider Alternative Libraries"
date: 2018-04-19T13:32:15-04:00
categories:
- article
- coding
tags:
- technique
- cpp
slug: Consider Alternative Libraries
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-04/2018-04-19.gif
---

Different libraries offering similar functionality often feature different performance trade-offs, so we might be able to remove bottlenecks by replacing one library with another.
<!--more-->

Ideally, a library is small, fast, powerful, flexible, extensible, intuitive, universally available, well supported, free of use restriction, and bug-free.

In reality, libraries optimized for size and speed are typically not portable; libraries with rich functionality are rarely intuitive; bug-free libraries are limited in scope. In a word, we can't get everything.

Different designers assign different priorities to these criteria, leading to the result that two libraries offering similar functionality have different performance profiles.

Take `iostream` and `stdio` for example:

```cpp
#ifndef STDIO
#include <stdio.h>
#else
#include <iostream>
#include <iomanip>
using namespace std;
#endif

const int VALUES = 30000;  // # of values to read/write

int main() {
    double d;
    for (int n = 1; n <= VALUES; ++n) {
#ifdef STDIO
        scanf("%lf", &d);
        printf("%10.5f", d);
#else
        cin >> d;
        cout << setw(10)                      // set field width
             << setprecision(5)               // set decimal places
             << setiosflags(ios::showpoint)   // keep trailing 
             << setiosflags(ios::fixed)
             << d;    
#endif
        if (n % 5 == 0) {
#ifdef STDIO
            printf("\n");
#else
            cout << '\n';
        }
#endif
    }
    return 0;
}
```

Running this program on several combinations of machines, operating systems, and compilers, and we should get a brief insight into the comparative performance difference between these two libraries. It is probable that the stdio version is faster, and the size of the executable using stdio tends to be smaller. However, it is also possible that iostream implementation is faster than stdio, because iostreams determine the types of their iperands during compilation, while stdio functions typically parse a format string at runtime.

Anyway, the main point is that, because different libraries embody different design decisions regarding efficiency, extensibility, portability, type safety, and other issues, different libraries offeringg similar functionality often feature different performance trade-offs. Thus, once we've identified the bottlenecks in our software (via profiling, MECpp item 16), we can sometimes significantly improve the efficiency of our software by switching to libraries whose designer gave more weight to performance consideration than to other factors.