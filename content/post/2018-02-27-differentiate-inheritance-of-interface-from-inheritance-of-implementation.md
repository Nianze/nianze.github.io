---
title: "Item-34 Differentiate between inheritance of interface and inheritance of implementation"
date: 2018-02-27T20:53:53-05:00
categories:
- article
- coding
tags:
- technique
- cpp
slug: avoid hiding inherited names
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-02/2018-02-27.gif
draft: true
---

Inheritance of interface is different from inheritance of implementatino.
<!--more-->

Under public inheritance, derived classes always inherit base class interfaces, but may act differently in terms of base class implementation inheritance:

* Pure virtual functions specify inheritance of interface only
* Simple (impure) virtual functions specify inheritance of interface plus inheritance of a default implementation
* Non-virtual functions specify inheritance of interface plus inheritance of a mandatory implementation

To show the implementation differences above, we can define following classes for an example:

```cpp
class Shape {  // abstract class
public:
    virtual void draw() const = 0;  // pure virtual function, draws the current obj.
    virtual void error(const std::string& msg); // impure virtual function, called by member functions if they need to report an error
    int objectID() const; // non-virtual function, returns a unique integer identifier for the current obj.
};

class Rectangle: public Shape {...};
class Ellipse: public Shape {...};
```

Since derived classes `Rectangle` and `Ellipse` are both public inherited, according to item 32, this means `is-a`, so anything that is true of the base class must also apply to derived classes. Thus, the member function _interfaces_ are always inherited.

## Pure virtual functions

For pure virtual functions, there are two features we have to note:

* they _must_ be redeclared by any concrete class that inherits them
* they typically have no definition in abstract classes

From these feature, we can conclude that:

**The purpose of declaring a pure virtual function is to have derived classes inherit a function _interface only_.**

Here, the declaration of `Shape::draw` says to the client of the `Shape` that, "you have to provide a `draw` function, but I don't know how you're going to implement it."

Incidentally, C++ allows us to provide an implementation for `Shape::draw` (example: pure virtual destructor in item 7). However, the only way to call it would be to qualify the call with the class name:

```cpp
Shape *ps = new Shape;  // error! Shape is abstract
Shape *ps1 = new Rectangle;  // fine
ps1->draw();  // call Rectangle::draw
ps1->Shape::draw(); // call Shape::draw
```

This feature is generally of limited utility, except that it can be employed as a mechanism for providing a safer-than-usual default implementation for simple virtual functions as we'll see below.

## Simple (impure) virtual functions

Simple virtual functions provide an implementation that derived classes may override, which means that

**The purpose of declaring a simple virtual function is to have derived classes inherit a function _interface as well as default implementation_.**

For example, the declaration of `error` function tells us that "You have to supoort an `error` function, but if you don't want to write your own, you can fall back on the default version in the `Shape` class."

### Potential danger

However, in the perspective of class design, there's a potential danger to allow simple virtual functions to specify both a function interface and a default implementation. That is: a derived class is allowed to inherit the default implementation without **explicitly** saying that it wanted to. For example:

```cpp
class Airport {...}; // represents airports

class Airplane {
public:
    virtual void fly(const Airport& destination);
    ...
};

void Airplane::fly(const Airport& destination)
{
    default code for flying an airplane to the given destination
}

class ModelA: public Airplane{...};
class ModelB: public Airplane{...};
```

Suppose both `ModelA` and `ModelB` inherit the base class `Airplane` without re-implementing the simple virtual function `fly`. Chances are that `ModelB` is actually a new type of model, yet its programmer simply forgets to redefine the `fly` function. 

#### Separate interface from default implementation

To make our design more foolproof, we may separate functions for providing interface and default implementation, such as below:

```cpp
class Airplane {
public:
    virtual void fly(const Airport& destination) = 0;
    ...
protected:
    void defaultFly(const Airport& destination)
    {
        default code for flying an airplane to the given destination
    }
};
```

```cpp
class ModelA: public Airplane {
public:
    virtual void fly(const Airport& destination)
    { defaultFly(destination); }
    ...
};
```

```cpp
class ModelB: public Airplane {
public;
    virtual void fly(Airport& destination);
    ...
};

void ModelB::fly(const Airport& destination)
{
    special code for flying a ModelB airplane to the given destination
}
```

#### Take use of pure virtual function

Some people may feel this design is redundant, arguing that this will polllute the class namespace with a proliferation of closely related function names. Then we may take advantage of the fact that pure virtual functions, which insists on redeclaring in concrete derived classes, may also have implementations of their own:

```cpp
class Airplane {
public:
    virtual void fly(const Airport& destination) = 0;
    ...
};

void Airplane::fly(const Airport& desination)  // an implementation of a pure virtual function
{
    default code for flying an airplane to the given destination
}
```

```cpp
class ModelA: public Airplane {
public:
    virtual void fly(const Airport& destination)
    { Airplane::fly(destination); }
    ...
}
```

```cpp
class ModelB: public Airplane {
public;
    virtual void fly(Airport& destination);
    ...
};

void ModelB::fly(const Airport& destination)
{
    special code for flying a ModelB airplane to the given destination
}
```

In essence, this design breaks `fly` into two fundamental components:

* `fly`'s declaration specifies its interface, which derived classes _must use_
* `fly`'s definition specifies its default behavior, which derived classes _may use_ by explicitly request it

However, in merging `fly` and `defaultFly`, we've lost the ability to give the two functions different protection levels: previously `protected` code in `defaultFly` is now `public` in `fly`.

## Non-virtual function

A non-virtual member function specifies an _invariant over specialization_ (a point discussed in item 36), identifying behavior that is not supposed to change, no matter how specialized a derived class becomes. Thus:

**The purpose of declaring a non-virtual function is to have derived classes inherit a function _interface as well as_ a mandatory implementation.**

The declaration for `Shape::objectId` is basically say, "Every `Shape` object has a function that yields an object identifier, and that identifier is always conputed the same way. That way is determined by the definition of `Shape::objectID`, and no derived class should try to chagne how it's done."

