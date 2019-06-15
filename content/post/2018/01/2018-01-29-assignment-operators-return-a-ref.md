---
title: "Item-10 Have assignment operators return a reference to *this"
date: 2018-01-29T18:17:34-05:00
categories:
- technology
- coding
tags:
- technique
- cpp
slug: have assignment op return a ref
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-01/2018-01-29.jpg
---

As title suggests.
<!--more-->

Assignment is able to chain together:

```cpp
int x,y,z;
x = y = z = 15;  // chain of assignment
```

Basically, the chain is parsed from right to left, so the result of the updated `z` is assigned to y, then the result of the second assignment (the updated `y`) is assigned to `x`:

```cpp
x = (y = (z = 15));
```

In order to achieve this, we need to implement the assignment operators (as well as `+=`, `-=`, `*=`, etc) in the following convention, where we make the assignment return a reference to its left-hand argument:

```cpp
class Widget {
public:
    ...
    Widget& operator=(const Widget& rhs)  // return type is a reference to the current class
    {
        ...
        return *this;  // return the left-hand object
    }
    Widget& operator=(int rhs)
    {
        ...
        return *this;  // even if the right-hand side parameter type is unconventional
                       // we can still apply this convention
    }
    Widget& operator+=(const Widget& rhs)
    {
        ...
        return *this;
    }
    ...
};
```

