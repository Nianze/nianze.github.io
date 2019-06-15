---
title: "Item-37 Never redefine a function's inherited default parameter value"
date: 2018-03-02T21:15:36-05:00
categories:
- technology
- coding
tags:
- technique
- cpp
slug: Never redefine a functions inherited default parameter value
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-03/2018-03-02.gif
---

Defaul parameter values are statically bound, while virtual function - the only functions we should be overriding - are dynamically bound.
<!--more-->

As item 36 suggests, we should never redefine an inherited non-virtual function, so we only need to focus on the case where we inherit a virtual function with a default parameter value.

To make things clear, first we need to understand the difference between static and dynamic binding:

* an object's _static type_ is the type we declare it to have in the program text
* an object's _dynamic type_ is determined by the type of the object to which it currently refers. 

For example:

```cpp
// a class for geometric shapes
class Shape {
public:
    enum ShapeColor {Red, Green, Blue};
    // all shapes must offer a function to draw themselves
    virtual void draw(ShapeColor color = Red) const = 0;
    ...
};

class Rectangle: public Shape {
public:
    // different default parameter value -> bad
    virtual void draw(ShapeColor color = Green) const;
    ...
};

class Circle: public Shape {
public:
    virtual void draw(ShapeColor color) const;
    ...
};
```

```cpp
Shape *ps;  // static type = Shape*, no dynamic type (no object referred to)
Shape *pr = new Rectangle // static type = Shape*, dynamic type = Rectangle*
Shape *pc = new Circle;  // static type = Shape*, dynamic type = Circle*
```

Notice that the static type of `ps`, `pr`, and `pr` are all "pointer-to-`Shape`", and that it makes no difference what they're _really_ pointing to.

_Dynamic types_ , as their name suggests,  can change as a program runs, typically through assignments:

```cpp
ps = pr;  // ps's dynamic type is now Rectangle*
ps = pc;  // ps's dynamic type is now Circle*
```

Virtual functions are _dynamically bound_, meaning that the particular function called is determined by the dynamic type of the object through which it's invoked:

```cpp
pc->draw(Shape::Red); // calls Circle::draw(Shape::Red)
pr->draw(Shape::Red); // calls Rectangle::draw(Shape::Red)
```

However, since default parameters are statically bound, when calling a virtual function defined in a _derived class_, it is possible that the default parameter value we are using is from a _base class_:

```cpp
pr->draw();  // calls Rectangle::draw(Shape::Red)
```

In this case, even though the virtual function is called according to dynamic type `Rectangle*`, the default parameter value is taken from the `Shape` class (`Shape::Red`) rather than the derived `Rectangle` class (`Shape::Green` is expected). This result is almost certainly unanticipated.

The problem here is that the default parameter value of virtual function `draw` is redefined in a derived class. This inconsistency between the function call's dynamic binding and the default parameter value's statical binding is mainly due to C++'s insistence on runtime efficiency.

When we're having trouble making a virtual function behave the way we'd like, it's wise to consider alternative designs, which item 35 happens to offer. One of the alternatives is the _non-virtual-interface idiom_:   
in order to make clear that the default value for `draw`'s color parameter should always be `Red`, we could declare a public non-virtual function in the base class calling a private virtual function that derived classes may redefine. According to item 36, such an non-virtual function should never be overridden by derived classes. Thus, simply specify the default parameter in the non-virtual function, and we're done:

```cpp
class Shape {
public:
    enum ShapeColor {Red, Green, Blue};
    void draw(ShapeColor color = Red) const  // now non-virtual
    {
        doDraw(color);  // calls the private virtual
    }
    ...
private:
    virtual void doDraw(ShapeColor color) const = 0;  // the actual work is done in this func
};

class Rectangle: public Shape {
public:
    ...
private:
    virtual void doDraw(ShapeColor color) const; // note lack of a default param value
};
```
