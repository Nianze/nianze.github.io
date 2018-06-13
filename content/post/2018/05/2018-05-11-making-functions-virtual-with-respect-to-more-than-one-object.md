---
title: "[MECpp]Item-31 Making Functions Virtual With Respect to More Than One Object"
date: 2018-05-11
categories:
- article
- coding
tags:
- technique
- cpp
slug: Making Functions Virtual With Respect to More Than One Object
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-05/2018-05-11.gif
draft: true
---

A virtual function call is termed a "message dispatch." A call that acts virtual on multiple parameters is called _multiple dispatch_, which is not directly supported in C++. Several resolutions exist, but none is without its disadvantages.
<!--more-->

For example, considering we are writing a video game involving space ships, space stations, and asteroids:

```cpp
class GameObject {...};
class SpaceShip: public GameObject {...};
class SpaceStation: public GameObject {...};
class Asteroid: public GameObjecct {...};
```

When one `GameObject` collides with another, we call a function depending on _both_ their dynamic types:

```cpp
void checkForCollision(GameObject& object1, GameObject& object2)
{
    if (theyJustCollided(object1, object2)) {
        processCollision(object1, object2);
    }
    else {
        ...
    }
}
```

Now comes the _double dispatch_: since collisions betwenn different `GameObject` effects the environment differently, we want `processCollision` to act virtual on both `object1` and `object2`, but C++ only offers virtual support for one parameter, like `object1.processCollision(object2)`. We must come up with some approaches ourselves instead of relyin on compilers.

## Using Virtual Function and RTTI

We need double dispatch, so we can use virtual functions for first half of what we need, and use chains of `if-then-else`s for rest half:

```cpp
class GameObject {
public:
    virtual void collide(GameObject& otherObject) = 0;
    ...
};

class SpaceShip: public GameObject {
public:
    virtual void collide(GameObject& otherObject);
    ...
};
```

```cpp
// if colliding with an object of unknown type
// throw an exception of this type:
class CollisionWithUnknownObject {
public:
    CollisionWithUnknownObject(GameObject& whatWeHit);
    ...
};

void SpaceShip::collide(GameObject& otherObject)
{
    const type_info& objectType = typeid(otherObject);
    if (objectType == typeid(SpaceShip)) {
        SpaceShip& ss = static_cast<SpaceShip&>(otherObject);
        process a SpaceShip-SpaceShip collision;
    }
    else if (objectType == typeid(SpaceStation)) {
        SpaceStation& ss = static_cast<SpaceStation&>(otherObject);
        process a SpaceShip-SpaceStation collision;
    }
    else if (objectType == typeid(Asteroid)) {
        Asteroid& a = static_cast<Asteroid&>(otherObject);
        process a SpaceShip-Asteroid collision;
    }
    else {
        throw CollisionWithUnknownObject(otherObject);
    }
}
```

The danger in this design: each `collide` function must be aware of each of its sibling classes, so if a new type of object is added to the game, we must update each RTTI-based `if-then-else` chain in the proram that might encounter the new object, which in essence is unmaintainable in the long run. We added a final `else` clause where control winds up if we hit an unnknown object, throwing an exception to callers in the hope that they handle the error better than we can (but since we are running into something we didn't know existed, they almost can't do anything more satisfying.)

## Using Virtual Functions Only

We can also implement double-dispatching as two separate virtual function calls: 

```cpp
// forward declarations
class SpaceShip;
class SpaceStation;
class Asteroid;
class GameObject {
public:
    virtual void collide(GameObject&   otherObject) = 0;
    virtual void collide(SpaceShip&    otherObject) = 0;
    virtual void collide(SpaceStation& otherObject) = 0;
    virtual void collide(Asteroid&     otherObject) = 0;
    ...
};

class SpaceShip: public GameObject {
public:
    virtual void collide(GameObject&   otherObject);
    virtual void collide(SpaceShip&    otherObject);
    virtual void collide(SpaceStation& otherObject);
    virtual void collide(Asteroid&     otherObject);
    ...
};
```

```cpp
void SpaceShip::collide(GameObject& otherObject)
{
    otherObject.collide(*this);
}
```

Note that this implementation is not a resursive call: being inside a member function of the class `Spaceship`, the static type of `*this` is of type `SpaceShip`, so the call is routed to the `collide(SpaceShip&)` instead of going back to `collide(GameObject&)`. All the `collide` functions are virtual, so finally this call will resolve to the implementation of `collide` corresponding to the real type of `otherObject`, where both types are known. So the implementation is simply:

```cpp
void SpaceShip::collide(SpaceShip& otherObject)
{
    process a SpaceShip-SpaceShip collision;
}

void SpaceShip::collide(SpaceStation& otherObject) {
    process a SpaceShip-SpaceStation collision;
}

void Spaceship::collide(SpaceStation& otherObject) {
    process a SpaceShip-Asteroid collision;
}
```

There's no RTTI, no need to throw unexpected object types. Still, there's the same old flaw: each class must know about its siblings. Even worth, the _way_ in which the code must be updated in the case of adding new classes is difficult to extend: if we add a new class, say `class Satellite: public GameObject`, to our game, we'd have to add a new `collide` function to each of the existing classes in the program, rather than just another `else` clause in one function before.

Now let's do a small sum-up:

1. Virtual function approach is safer than the RTTI strategy, but it constrains the extensibility of the system to match that of our ability to edit header files
2. RTTI makes no recompilation demands, but it generally leads unmaintainable software.
3. The best recourse is to modify the design to eliminate the need for double-dispatching.

## Emulating Virtual Function Tables

## Initializing Emulated Virtual Function Tables

## Using Non-Member Collision-Processing Functions

## Inheritance and Emulated Virtual Function Tables

## Initializing Emulated Virtual Function Tables (Reprise)

