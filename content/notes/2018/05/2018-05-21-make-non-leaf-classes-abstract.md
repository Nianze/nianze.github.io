---
title: "[MECpp]Item-33 Make Non-Leaf Classes Abstract"
date: 2018-05-21T18:27:39-04:00
series:
- effective c++
categories:
- coding
tags:
- technique
- cpp
slug: Make Non Leaf Classes Abstract
autoThumbnailImage: false
thumbnailImagePosition: right
featured_image: 2018/2018-05/2018-05-21.gif
---

The general rule: non-leaf classes should be abstract. This will yields dividends in the form of increased reliability, robustness, comprehensibility, and extensibility throughout our software.
<!--more-->
<!-- toc -->

# Redesign concrete base classes to abstract ones

If we have two concrete classes C1 and C2 and we'd like C2 to publicly inherit from C1, we should transform that two-class hierarchy into a three-class hierarchy by creating a new class A and having both C1 and C2 publicly inherit from it:

```
initial idea  |             the transformed hierarchy
┌─────────┐   |                    ┌─────┐
│   C1    │   |                    │  A  │
└─────────┘   |                    └─────┘
     ↑        | public inheritance ↗     ↖ public inheritance
┌─────────┐   |              ┌────┐      ┌────┐
│   C1    │   |              │ C1 │      │ C2 │
└─────────┘   |              └────┘      └────┘
```

For example, we create a software dealing with animals, with two kinds of animals - lizards and chickens - require special handling:

```
                    ┌──────────┐
                    │  Animal  │
                    └──────────┘
   public inheritance ↗     ↖ public inheritance
             ┌────────┐      ┌─────────┐
             │ Lizard │      │ Chicken │
             └────────┘      └─────────┘
```

The `Animal` class embodies the features shared by all the creatures, and the `Lizerd` and `Chicken` classes specialize `Animal` in their own ways:

```cpp
class Animal {
public:
    Animal& operator=(const Animal& rhs);
    ...
};

class Lizard: public Animal {
public:
    Lizard& operator=(const Lizard& rhs);
    ...
};

class Chicken: public Animal {
public:
    Chicken& operator=(const Chicken& rhs);
    ...
};
```

Now consider what happens for assignment operation:

```cpp
Lizard liz1;
Lizard liz2;
Animal *pAni1 = &liz1;
Animal *pAni2 = &liz2;
...
*pAni1 = *pAni2;
```

The two problems here:

1. _partial assignment_: only `Animal` members in `liz1` get updated from `liz2`, while the `liz1`'s Lizard members remain unchanged.
2. it's not uncommon for programmers to make assignments to objects via pointers.

## Solution 1: virtual functions

```cpp
class Animal {
public:
    virtual Animal& operator=(const Animal& rhs);
    ...
};

class Lizard: public Animal {
public:
    virtual Lizard& operator=(const Animal& rhs);
    ...
};

class Chicken: public Animal {
public:
    virtual Chicken& operator=(const Animal& rhs);
    ...
};
```

We can customize the return value of the virtual assignment operators here, but the rules of C++ force us to declare identical _parameter_ types for a virtual function in every class in which it is declared, leading to the problem that the assignment operator for the `Lizard` and `Chicken` must be prepared to accept _any_ kind of `Animal` object on the right-hand side of an assignment:

```cpp
Lizard liz;
Chicken chick;

Animal *pAni1 = &liz;
Animal *pAni2 = &chick;

...

*pAni1 = *pAni2; // assign a chicken to a lizard!
```

By making `Animal`'s assignment operator virtual, we opened the door to such mixed-type operations. To only allow the same type assignment in virtual assignment operation, we have to make distinctions the types at runtime:

```cpp
Lizard& Lizard::operator=(const Animal& rhs)
{
    // make sure rhs is really a lizard
    const Lizard& rhs_liz = dynamic_cast<const Lizard&>(rhs);
    ... // proceed with a normal assignment of rhs_liz to *this
}
```

In this case, we have to worry about `std::bad_cast` exceptions thrown by `dynamic_cast` when `rhs` is not a `Lizard`, while paying for extra runtime check cost for valid assignment cases, as well as the harder to maintain code.

## Solution 2: adding another function

If we don't want to pay for the complexity or cost of a `dynamic_cast` in the case of valid assignment, we add to `Lizard` the conventional assignment operator:

```cpp
class Lizard: public Animal {
public:
    virtual Lizard& operator=(const Animal& rhs);
    Lizard& operator=(const Lizard& rhs);  // add this
    ...
};

Lizard& Lizard::operator=(const Animal& rhs)
{
    return operator=(dynamic_cast<const Lizard&>(rhs));
}
```

```cpp
Lizard liz1, liz2;
...
liz1 = liz2;   // calls operator= taking a const Lizard&

Animal *pAni1 = &liz1;
Animal *pAni2 = &liz2;
...
*pAni1 = *pAni2;  // calls operator= taking a const Animal&
```

Still, clients of `Lizard` and `Chicken` have to be prepared to catch `bad_cast` exceptions and do something sensible with them each time they perform an assignment, which most programmers are unwilling to do.

## Solution 3: making partial assignment illegal

The easiest way to prevent partial assignments is to make `Animal::operator=` private so that `*pAni1 = *pAni2;` is illegal (which calls private `Animal::operator=`), but this naive solution has 2 problems:

1. `Animal` is a concrete class. A private `operator=` makes also it illegal to make assignments between `Animal` objects: `animal1 = animal2;`
2. Assignment operator in derived classes are responsible for calling assignment operators in their base classes, but a private `Animal::operator=` makes it impossible to implement the `Lizard::operator=` and `Chicken::operator=` correctly to assign the `Animal` part of `*this`:

    ```cpp
    Lizard& Lizard::operator=(const Lizard& rhs)
    {
        if (this == &rhs) return *this;
        Animal::operator=(rhs); // can't call private Animal::operator=
        ...
    }
    ```

Declaring `Animal::operator=` as `protected` will solve the latter problem, but the first one still remains.

## Solution 4: redesign the inheritance hierarchy

Because our orignimal design for the system presupposed that `Animal` objects were necessary, we can not abstract `Animal` class. Instead, we create a new class - `AbstractAnimal` that consists of the common features of `Animal`, `Lizard`, and `Chicken`, and we make _that_ class abstract by making its destructor a pure virtual function[^1]:

```cpp
class AbstractAnimal {
protected:
    AbstractAnimal& operator=(const AbstractAnimal& rhs);
public:
    virtual ~AbstractAnimal() = 0; // still need to impl. the destructor even it's a pure virtual function
    ...
};

class Animal: public AbstractAnimal {
public:
    Animal& operator=(const Animal& rhs);
    ...
};

class Lizard: public AbstractAnimal {
public:
    Lizard& operator=(const Lizard& rhs);
    ...
};

class Chicken: public AbstractAnimal {
public:
    Chicken& operator=(const Chicken& rhs);
};
```

This design gives us everything:

* homogeneous assignments ar allowed for lizards, chickens, and animals;
* partial assignments and heterogeneous assignments are prohibited
* derived class assignment operators may call the assignment operator in the base class
* non of the code written in terms of the `Animal`, `Lizard`, or `Chicken` requires modification - they behave as they did before `AbstractAnimal` was introduced - though the code does need to be recompiled

# In reality when facing constraints

If we want wot create a concrete class that inherits from a concrete class in a thirt-party libraries to which we have only read access, what are we to do?

Then there are only unappealing options:

* Derive the concrete class from the existing concrete class, and put up with the assignment-related problems, and watch out for the array-related pitfalls (MECpp item 3).
* Try to find an abstract class higher in the library hierarchy that does most of what we need, then inherit from that class.
* Implement the new class in terms of the library class we'd like to inherit from: having an object of the library class as a data member, then reimplement the library class's interface in the new class - this requires to update the class each time the library vendor updates our dependent library classes, and we also give up the ability to redefine virtual functions declared in the library class (we can't redefine virtual functions unless we inherit them):

    ```cpp
    class Window {
    public:
        virtual void resize(int newWidth, int newHeight);
        virtual void repaint() const;

        int width() const;
        int height() const;
    };

    class SpecialWindow { // class we wanted to have inherit from Window
    public:
        ...
        int width() const { return w.width(); } // pass through nonvirtual functions
        int height() const { return w.height(); }

        virtual void resize(int newWidth, int newHeight); // new impl. of "inherited" virtual functions
        virtual void repaint() const;
    private:
        Window w;
    };
    ```
* Use the concrete class that's in the library and modify the software so that the class suffices. Write non-member functions to proved the extra functionality we'd like to add to the class, but can't - the result may not be as clear, as efficient, as maintainable, or as extensible as we'd like.

[^1]: Declaring a function pure virtual doesn't mean it has no implementation, it means: 1. the current class is abstract, and 2 any concrete class inheriting from the current class must declare the function as a "normal" virtual function (i.e., without the "=0").
