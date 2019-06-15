---
title: "[EMCpp]Item-40 Use std::atomic for Concurrency, volatile for Special Memory"
date: 2018-10-30T19:05:01-04:00
categories:
- technology
- coding
tags:
- technique
- cpp
slug: Use std::atomic for Concurrency, volatile for Special Memory
autoThumbnailImage: true
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-10/30.gif
---

`std::atomic` is for data accessed from multiple threads without using mutexes (concurrent usage); `volatile` is for memory where reads and writes should not be optimised away (special memory).
<!--more-->

#### `std::atomic` template

Instantiations of `std::atomic` template offer operations that are guaranteed to be seen as atomic by other threads, as if they were inside a mutex-protected critical section, generally with the support of special machine instructions that are more efficient than the case of mutex. For example:

```cpp
std::atomic<int> ai(0);  // init. ai to 0
ai = 10;                 // atomically set ai to 10
std::cout << ai;         // atomically read ai's value
++ai;                    // atomically increment ai to 11
--ai;                    // atomically decrement ai to 10
```

During execution of these statements, other threads reading `ai` may see only values of 0, 10, or 11 (assuming, of course, this is the only thread modifying `ai`). Two things worth noting here:

1. For `std::cout << ai;`, only the read of `ai` is atomic, so it's possible that between the time `ai`'s value is rad and `operator<<` is invoked to write it to standard output, another thread may modify `ai`'s value.
2. The increment and decrement of `ai` are _read-modify-write (RMW)_ operations, and they execute atomatically as well, which is one of the nicest characteristics of the `std::atomic` types that they guarantee all member functions on `std::atomic` types will be seen by other threads as atomic.
3. The use of `std::atomic` imposes restrictions that no code precedes a write of a `std::atomic` variable may take place afterwards. No reorder tricks for compiler/hardwaes for speed-up optimization purpose.

In contrast, `volatile` offers _no guarantee of operation atomicity_ and suffer _insufficient restrictions on code reordering_ - basically not useful in multithreaded context. Say if we have a counter defined as `volatile int vc(0)`, and there are two threads increment the `volatile` counter simultaneously, then the ending value of `vc` need not be `2` - the RMW operation in each of two threads may take place in any order, involving in a data race, which leading to undefined behavior according to Standard's decree.

The place in which `volatile` shines is in the context where _redundant loads_ and _dead stores_ should not be optimized away, that is, we need special memory to perform such kinds of redundent reads and superfluous writes:

```cpp
auto y = x;  // read x
y = x;       // read x again

x = 10;      // write x
x = 20;      // write x again
```

The most common kind of special memory is memory used for _memory-mapped I/O_, which is used for communication with peripherals, e.g., external sensors or displays, printers, network ports, etc. rather than reading or writing normal memory (i.e., RAM). `volatile` is the way to tell compilers that we're dealing with special memory.

Because `std::atomic` and `volatile` serve different purposes, they can be used together:

```cpp
volatile std::atomic<int> vai;  // operations on vai are atomic and can't be optimized away
```

This could be useful if `vai` corresponded to a memory-mapped I/O location that was concurrently accessed by multiple threads.
