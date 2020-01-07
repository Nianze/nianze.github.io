---
title: "[MECpp]Item-31 Making Functions Virtual With Respect to More Than One Object"
date: 2018-05-11
series:
- effective c++
categories:
- coding
tags:
- technique
- cpp
slug: Making Functions Virtual With Respect to More Than One Object
autoThumbnailImage: false
thumbnailImagePosition: right
featured_image: 2018/2018-05/2018-05-11.gif
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

# Using Virtual Function and RTTI

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

# Using Virtual Functions Only

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

# Emulating Virtual Function Tables

Actually, we can build our own virtual function tables, similar to how compilers implement virtual functions by creating an array of function pointers (the vtbl) and then indexing into that array when a virtual function is called, except that this customized version support double-dispatching. Moreover, the virtual function tables is more efficient than the RTTI-based code (indexing into an array and following a function pointer vs running through a series of `if-then-else` tests), and we isolate the use of RTTI to a single location where the array of function pointers is initialized.

```cpp
class GameObject {
public:
    virtual void collide(GameObject& otherObject) = 0;
    ...
};

class SpaceShip: public GameObject {
public:
    virtual void collide(GameObject& otherObject);
    virtual void hitSpaceShip(GameObject& spaceShip);
    virtual void hitSpaceStation(GameObject& spaceStation);
    virtual void hitAsteroid(GameObject& asteroid);
    ...
private:
    typedef void (SpaceShip::*HitFunctionPtr)(GameObject&);
    static HitFunctionPtr lookup(const GameObject& whatWeHit);
    typedef map<string, HitFunctionPtr> HitMap;
    static HitMap * initializeCollisionMap();
    ...
};
```

```cpp
SpaceShip::HitMap * SpaceShip::initializeCollisionMap()
{
    HitMap *phm = newHitMap;
    (*phm)["SpaceShip"] = &hitSpaceShip;
    (*phm)["SpaceStation"] = &hitSpaceStation;
    (*phm)["Asteroid"] = &hitAsteroid;
    return phm;
}

SpaceShip::HitFunctionPtr SpaceShip::lookup(const GameObject& whatWeHit)
{
    static auto_ptr<HitMap> collisionMap(initializeCollisionMap());
    HitMap::iterator mapEntry = collisionMap.find(typeid(whatWeHit).name());
    if (mapEntry == collisionMap->end()) return 0;
    return (*mapEntry).second;
}

void SpaceShip::collide(GameObject& otherObject)
{
    HitFunctionPtr hfp = lookup(otherObject);
    if (hfp) {
        (this->*htp)(otherObject);
    }
    else {
        throw CollisionWithUnknownObject(otherObject);
    }
}

// Each of the `dynamic_cast` will throw a `bad_cast` exception if the cast fails
// they should never fail, though.
void SpaceShip::hitSpaceShip(GameObject& spaceShip)
{
    SpaceShip& otherShip = dynamic_cast<SpaceShip&>(spaceShip);
    process a SpaceShip-SpaceShip collision;
}

void SpaceShip::hitSpaceStation(GameObject& spaceStation) {
    SpaceStation& Station = dynamic_cast<SpaceStation&>(spaceStation)
    process a SpaceShip-SpaceStation collision;
}

void Spaceship::hitAsteroid(GameObject& asteroid) {
    Asteroid& theAsteroid = dynamic_cast<Asteroid>(asteroid)
    process a SpaceShip-Asteroid collision;
}
```

Note that there's another design which seems doable but is actually error-prone:

```cpp
class SpaceShip: public GameObject {
public:
    virtual void collide(GameObject& otherObject);
    virtual void hitSpaceShip(SpaceShip& otherObject);
    virtual void hitSpaceStation(SpaceStation& otherObject);
    virtual void hitAsteroid(Asteroid& otherObject);
    ...
};

SpaceShip::HitMap * SpaceShip::initializeCollisionMap()
{
    HitMap *phm = newHitMap;
    (*phm)["SpaceShip"] = reinterpret_cast<HitFunctionPtr>(&hitSpaceShip);
    (*phm)["SpaceStation"] = reinterpret_cast<HitFunctionPtr>(&hitSpaceStation);
    (*phm)["Asteroid"] = reinterpret_cast<HitFunctionPtr>(&hitAsteroid);
    return phm;
}
```

Here we tell the compiler that `hitSpaceShip`, `hitSpaceStation`, and `hitAsteroid` are functions expecting a `GameObject` argument, which is not true. `hitSpaceShip` expects a `SpaceShip`, `hitSpaceStation` expects a `SpaceStation`, and `hitAsteroid` expects an `Asteroid`. All these functions are declared as pass-by-reference, which in fact is implemented by passing a pointer to an object, so ideally compilers will pass the declared type of the parameter(say `hitSpaceShip` for function `hitSpaceShip`) in the function being called. However, due to the object layout of classes under an inheritance path, after the cast above, it is possible that the wrong address (say `GameObject`) is passed into the function, because inside a `SpaceShip` object there are both a derived class part as well as a base class part, each having a different address (for detailed discussion, refer to _More Effective C++_ Item 31-Initializing Emulated Virtual Function Talbes).

## Using Non-Member Collision-Processing Functions

Still, similar to pure virtual functions based approach, there is one remaining problem: because the associative array contains pointers to _member functions_, once a new type of `GameObject` is added to the game, every class definition needs to be updated and recompiled, even if that class does not care about the new type of object.

To solve this problem, we change the associative array so that it contains pointers to _non-member functions_. This update also helps us address a design question before: a collision between objects of types A and B should be handles by neither A nor B (depending on whichever is the left-hand argument to `processCollision`) but instead in some neutral location outside both classes.

```cpp
#include "SpaceShip.h"
#include "SpaceStation.h"
#include "Asteroid.h"

namespace {  

// primary collision-processing functions
void shipStation(GameObject& spaceShip, GameObject& spaceStation);
void shipAsteroid(GameObject& spaceShip, GameObject& asteroid);
void asteroidStation(GameObject& asteroid, GameObject& spaceStation);
// secondary collision-processing functions that just implement symmetry
void stationShip(GameObject& spaceStation, GameObject& spaceShip)
{ shipStation(spaceShip, spaceStation); }
void asteroidShip(GameObject& asteroid, GameObject& spaceShip)
{ shipAsteroid(spaceShip, asteroid); }
void stationAsteroid(GameObject& spaceStation, GameObject& asteroid)
{ asteroidStation(asteroid, spaceStation); }

...

typedef void (*HitFunctionPtr)(GameObject&, GameObject&);
typedef map< pair<string, string>, HitFunctionPtr > HitMap;

pair<string, string> makeStringPair(const char *s1, const char *s2);
HitMap * initializeCollisionMap(const string& class1, const string& class2);
HitFunctionPtr lookup(const string& class1, const string& class2);

} // end of unnamed namespace

void processCollision(GameObject& object1, GameObject& object2)
{
    HitFunctionPtr phf = lookup(typeid(object1).name(), 
                                typeid(object2).name());
    if (phf) phf(object1, object2);
    else throw UnknownCollision(object1, object2);
}

namespace {

pair<string, string> makeStringPair(const char *s1, const char *s2)
{ return pair<stirng, string>(s1, s2); }

HitMap * initializeCollisionMap()
{
    HitMap *phm = new HitMap;
    (*phm)[makeStringPair("Spaceship", "Asteroid")] = &shipAsteroid;
    (*phm)[makeStringPair("Spaceship", "SpaceStation")] = &shipStation;
    ...
    return phm;
}

HitFunctionPtr lookup(const string& class1, const string& class2)
{
    static auto_ptr<HitMap> collisionMap(initializeCollisionMap());
    HitMap::iterator mapEntry = collisionMap->find(make_pair(class1, class2));
    if (mapEntry == collisionMap->end()) return 0;
    return (*mapEntry).second;
}

} // end namespace
```

Note that `makeStringPair`, `initializeColllisionMap`, and `lookup` were declared inside an unnamed namespace, therefore each must also be implemented within the same namespace.

Now we've solved the problem: if there are new classes to the hierarchy, it requires only the addition of more map insertions in `initializeCollisionMap` and the declarations of the new collision-processing functions in the unnamed namespace associated with the implementation of `processCollision`.

However, as uaual, there's still a disadvantage in this design: these non-member functions will not support inheritance-based parameter conversions such as how double-virtual-function-call mechanism does. 

For example, suppose the concrete classes `CommercialShip` and `MilitaryShip` inherit from the newly abstract class `SpaceShip` (according to the guidance of MECpp item 33). If a `MilitaryShip` object and an `Asteroid` collided, we'd expect `void shipAsteroid(GameObject&, GameObject&)`  to be called. However, in fact, an `UnknownCollision` would be thrown, because `lookup` would be asked to find a function corresponding to the type names `MilitaryShip` and `Asteroid`, and no such function would be found in `collisionMap` - after all, `lookup` has no way of knowing that `MilitaryShip` can be treated like a `SpaceShip`.

## Modifying Emulated Virtual Function Talbes Dynamically

If we'd like to add, remove, or change collision-processing functions as the game proceeds, the static `collisionMap` will not meet this requirement. In this case, we can turn the concept of a static map into a class that offers member functions allowing us to modify the contents of the map dynamically:

```cpp
class CollisionMap {
public:
    typedef void (*HitFunctionPtr)(GameObject&, GameObject&);
    void addEntry(const string& type1,
                  const String& type2,
                  HitFunctionPtr collisionFunction,
                  bool symmetric = true);
    void removeEntry(const string& type1, const string& type2);
    HitFunctionPtr lookup(const string& type1, const string& type2)
    // return a reference to the one and only map
    static CollisionMap& theCollisionMap();
private:
    // private to prevent the creation of multiple maps
    CollisionMap();
    CollisionMap(const CollisionMap&);
};
```
Clients wishing to add an entry to the map simply do the following step:

```cpp
void shipAsteroid(GameObject& spaceShip, GameObject& asteroid);
CollisionMap::theCollisionMap().addEntry("SpaceShip", "Asteroid", &shipAsteroid);
```

We must take care to ensure that these map entries are added to the map before any collisions occurs. One way is to have constructors in `GameObject` subclasses check to make sure the appropriate mappings had been added each time an object was created, but then we have to pay a small performance penalty at runtime. An alternative would be to create a `RegisterCollisionFunction` class:

```cpp
class RegisterCollisionFunction {
public:
    RegisterCollisionFunction(const string& type1,
                              const string& type2,
                              CollisionMap::HitFunctionPtr collisionFunction,
                              bool symmetric = true)
    {
        CollisionMap::theCollisionMap().addEntry(type1, type2, collisionFunction, symmetric);
    }
};
```

Clients then use global objects of this type to automatically register the functions before `main` is invoked to insure the map is initialized properly before any collision occurs:

```cpp
RegisterCollisionFunction cf1("SpaceShip", "Asteroid", &shipAsteroid);
RegisterCollisionFunction cf2("SpaceShip", 'SpaceStation', &shipStation);
...

int main(int argc, char * argv[])
{
    ...
}
```

If, later, a new derived `class Satellite: public GameObject {...};` is added, and one or more new collision-processing functions are written (say, `void satelliteShip(GameObject&, GameObject&)`, and `void satelliteAsteroid(GameObject&,GameObject&)`, etc), we can simply add them to the map without disturbing existing code:

```cpp
RegisterCollisionFunction cf4("Satellite", "SpaceShip", &satelliteShip);
RegisterCollisionFunction cf5("Satellite", "Asteroid", &satelliteAsteroid);
```

Overall, this makes it easy to provide data for a map-based implementation, but it doesn't change the fact that there's no perfect way to implement multiple dispatch.
