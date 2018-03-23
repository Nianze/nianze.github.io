---
title:  "MECpp Distinguish Between Pointers and References"
date: 2018-03-22T16:47:15-04:00
categories:
- article
- coding
tags:
- technique
- cpp
slug: write placement delete if you write placement new
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-03/2018-03-22.gif
---

More effective C++: Use references when we already have something to refer to and never want to refer to anything else, or when implementing operators whose syntactic requires us to do so.
<!--more-->

Both pointers and references refer to other objects indirectly, and we should distinguish their differences.

## No null reference

A reference must _always_ refer to some object, which implies that references must be initialized:

```cpp
string& rs; // error! References must be initialized
string *ps; // valid but risky uninitialized pointer
string s("abc");
string& rs = s; // fine
```

Having known this, if we have a variable whose purpose is to refer to another object, but it is possible that there might be no object to refer to, we should make the variable a pointer; on the other hand, if the design requires that the variable must always refer to a non-null object, we choose the reference.

As an implication, reference's never-nullable property save us from the burden of testing the validity before using it:

```cpp
void printRefDouble(const double& rd)
{
    cout << rd; // no need to test rd.
}

void printPointDouble(const double *pd)
{
    if (pd) {  // check for null pointer
        cout << *p;
    }
}
```

## No reassignment for reference

Another difference is that we can reassign pointers to refer to different objects, while reference _always_ refers to the one it is initialized:

```cpp
string s1("Nancy");
string s2("Clancy");

string& rs = s1;  // rs refers to s1
string *ps = s1;  // ps points to s1

rs = s2;   // rs  still refers to s1, but s1's value updates to "Clancy", equiv. to *ps = s2
ps = &s2;  // ps now points to s2, s1 remains unchanged
```

In general, use pointers when

* it's possible that there's nothing to refer to (set pointers to null), or
* it's needed to refer to different things at different times (reassign where the pointer points)

use reference when we know there will always be an object to refer to and we will never refer to anything else other than the initial object.

## Use reference for some operators

Another situation to prefer reference is when we're implementing certain operators such as `operator[]`, which needs to return something that can be used as the target of an assignment:

```cpp
vector<int> v(10);
v[5] = 10;  // the target of this assignment is the return value of operator[]
```

If `operator[]` returned a pointer, last statement would be changed to this:

```cpp
*v[5] = 10;
```

This makes `v` look like a vector of pointers, which it's not. Thus we may prefer using a reference as the return type of `operator[]` (for an exception, see MECpp-item 30).