---
title: Item-32 Make sure public inheritance models "Is-A"
date: 2018-02-23T12:59:53-05:00
categories:
- article
- coding
tags:
- technique
- cpp
slug: Make sure public inheritance models is a
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-02/2018-02-23.gif
---

Everything that applies to base classes must also apply to derived classes in public inheritance, for every derived class object _is_ a base class object.
<!--more-->

There are multiple relationships that can exist between classes:

* "is-a" is talked about in this item.
* "has-a" is discussed about in item 38.
* "is-implemented-in-terms-of" is introduced in item 39.

We should understand the differencea among these relationships.

For "is-a", we should understand it in this way: if the class D ("derived") **publicly** inherits from class B ("base), C++ compilers will assume that every object of type D is also an object of type B, but not _vice versa_. That is, every D is-a B, but not vice versa [^1].

The concept of is-a sounds simple, but sometimes our intuition may mislead us. Say we want to create class `Square` and class `Rectangle`. I hear you say:

>Everybody knows that a square is a rectangle, but generally not vice versa

Then consider this code:

```cpp
class Rectangle {
public:
    virtual void setHeight(int newHeight);
    virtual void setWidth(int newWidth);

    virtual int height() const;  // return current values
    virtual int width() const;
    ...
};

void makeBigger(Rectangle& r)  // function to increase r's area
{
    int oldHeight = r.height();
    r.setWidth(r.width() + 10);  // add 10 to r's width
    assert(r.height() == oldHeight);  // assert that r's height is unchanged
}
```

```cpp
class Square: public Rectangle {...};

Square s;
...
assert(s.width() == s.height());  // must be true for all squares
makeBigger(s);  // by inheritance, s is-a Rectangle, so we can increase its area
assert(s.width() == s.height());  // must be true for all squares
```

Now we face a big problem: how can we reconcile the following assertion:

* before calling `makeBigger`, `s`'s height is the same as its width;
* inside `makeBigger`, `s`'s width is changed, but its height is not;
* after returning from `makeBigger`, `s`'s height is again the same as its width

Here, the instincts we've develped in mathematics does not serve well. In this case, something applies to a rectangle is not applicable to a square, but public inheritance asserts that **everthing** that applies to base class object also applies to derived class objects. Thus using public inheritance to model the relationship between `Rectangle` and `Square` is incorrect.

With the knowledge of inheritance added into our arsenal of design, we'll have to augment our intuition with new insights to guide us in inheritance's proper application.

[^1]: This is true only for _public_ inheritance. Private inheritance means somethign entirely different (item 39), and protected inheritance is something beyond understanding.