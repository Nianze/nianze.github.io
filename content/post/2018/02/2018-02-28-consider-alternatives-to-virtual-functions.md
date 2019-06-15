---
title: "Item-35 Consider Alternatives to Virtual Functions"
date: 2018-02-28T20:27:02-05:00
categories:
- technology
- coding
tags:
- technique
- cpp
slug: consider alternatives to virtual functions
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-02/2018-02-28.gif
---

Alternatives to virtual functions include the NVI idiom (as an example of the Template Method design pattern) and various forms of the Strategy design pattern.
<!--more-->

Suppose we want to implement a member function named `healthValue`, which will calculate the health value for different characters in differen ways in a video game. Declaring `healthValue` virtual seems the obvious way to design things:

```cpp
class GameCharacter {
public:
    // return character's health value rating; derived classes may redefine this
    // impure virtual suggests there's a default impl. (item 34)
    virtual int healthValue() const;  
    ...                               
};
```

Actually, except from this obvious design, there exists some alternatives. To name a few:

* Use the **non-virtual interface idiom (NVI idiom)**, a form of the **Template Method design pattern** that wraps public non-virtual member functions around less accessible virtual functoins
* Use the **Strategy design pattern**, specifically:    
    * Replace virtual function with **function pointer data members** - a stripped-down manifestation of Strategy design pattern
    * Replace virtual function with **tr1::function data members**, which allows use of any callable entity with a signature compatible with what we need - a more general form of the stripped-down representation of Strategy design pattern
    * Replace virtual functions in one hierarchy with **virtual functions in another hierarchy** - the conventional implementation of the Strategy design pattern

Let's take a look at the pros and cons of these alternatives.

## The template method pattern via the non-virtual interface idiom

The _non-virtual interface (NVI) idiom_ argues that clients should call private virtual functions indirectly through public non-virtual member functions, which act like a _wrapper_ around the virtual functions. This is a particular manifestation of the more general design pattern known as Template Method[^1].

```cpp
class GameCharacter {
public:
    int healthValue() const  // derived classes do not redefine
    {
        ...  // do "before" stuff
        int retVal = doHealthValue();  // do the real work
        ...  // do "after  stuff
        return retVal;
    }
    ...
private:
    virtual int doHealthValue() const  // derived classes may redefine this
    {
        ...  // default algorithm for calculating character's health
    }
};
```

The NVI idiom involves derived classes redefining private virtual functions that they can't call - this seemingly contradictory rule is allowed by C++ and actually makes perfect sense: redefining a virtual function specifies _how_ something is to be done, while calling a virtual function specifies _when_ it will be done, and these two concerns are independent. 

However, it's not strictly necessary to declare the virtual functions `private`: in the cases where the derived class implementations of a virtual function are expected to invoke their base class counterparts, we have to declare the virtuals `protected`. Sometimes a virtual function even has to be `public` (e.g., destructors in polymorphic base classes, item 7), but then the NVI idiom can't really be applied.

The advantage of the NVI idiom is in the ""do 'before' stuff" and  "do 'after' stuff" part in the code above, which enable the wrapper abilities to ensure that before a virtual function is called, the proper context is set up (e.g., locking a mutex, making a log entry, verifying the class invariants and function pereconditions, etc), and after the call is over, the context is cleaned up (e.g., unlocking a mutex, verifying function postconditions, etc). If letting clients call virtual functions directly, there's no good way to do these stuff.

## The strategy pattern

The NVI idiom is still using virtual functions to calculate a character's health. A more dramatic design assertion, such as the strategy pattern, says that calculating a character's health is independent of the character's type - the calculation need not to be part of the character.

It is worth noting that, due to its being outside the `GameCharacter` hierarchy, the calculation has no special access to the internal parts of the object whose health it's calculating, so this design pattern works only if a character's health can be calculated based purely on information available through the character's public interface. Thus it may require the class's encapsulation to be weakened (e.g., make the non-member functions to be `friend`, or offer public accessor functions for class implementation that is previously hidden).

### The strategy pattern via function pointers

```cpp
class GameCharacter; // forward declaration

// function for default health calculation algorithm
int defaultHealthCalc(const GameCharacter&);

class GameCharacter {
public:
    typedef int(*HealthCalcFunc)(const GameCharacter&);

    explicit GameCharacter(HealthCalcFunc hcf = defaultHealthCalc)
    : healthFunc(hcf)
    {}

    int healthValue() const
    { return healthFunc(*this); }
    ...
private:
    HealthCalcFunc healthFunc;
};
```

The advantage of this approach is some interesting flexibility:

* different instances of the same character type can have different health calculation functions installed
* health calculation functions for a particular character may be changed at runtime. For example, `GameCharacter` might offer a member function `setHealthCalculator` that allowed replacement of the current health calculation function.

### The strategy pattern via `TR1::function`

To generalized the approach above, we could replace the function pointer `healthFunc` with an object of type `tr1::function`. As item 54 explains, such objects may hold _any callable entity_ (e.g., function pointer, function object, member function pointer) whose signature is compatible[^2] with the given target signature:

```cpp
class GameCharacter; // forward declaration

// function for default health calculation algorithm
int defaultHealthCalc(const GameCharacter&);

class GameCharacter {
public:
   // HealthCalcFunc is any callable entity that can be called with anything 
   // compatible with a GameCharracter and that returns anything 
   // compatible with an int
    typedef std::tr1::function<int (const GameCharacter&)> HealthCalcFunc;

    explicit GameCharacter(HealthCalcFunc hcf = defaultHealthCalc)
    : healthFunc(hcf)
    {}

    int healthValue() const
    { return healthFunc(*this); }
    ...
private:
    HealthCalcFunc healthFunc;
};
```

The advantage of this approach is that clients may have more flexibility in specifying health calculation functions with various compatible callable entities:

```cpp
short calcHealth(const GameCharacter&); // function; non-int return type
struct HealthCalculator { // class for health calculation function objects
    ...
};
class GameLevel {
public:
    float health(const GameCharacter&) const; // member function; non-int return type
    ...
};
```

To use these callable entities:

```cpp
class EvilBadGuy: public GameCharacter {
public:
    explicit EvilBadGuy(HealthCalcFunc hcf = defaultHealthCalc)
    : GameCharacter(hcf)
    {...}
    ...
};

class EyeCandyCharacter: public GameCharacter {
    ...  // similar constructor as EvilBadGuy
};

EvilBadGuy ebg1(calcHealth);  // character using a health calculation function
EyeCandyCharacter ecc1(HealthCalculator()); // character using a health calculation function object
GameLevel currentLevel;
...
EvilBadGuy ebg2(  // character using a health calculation member function
    std::tr1::bind(&GameLevel::health,
                    currentLevel,
                    _1)
);

```

Here, the purpose of calling `tr1::bind` is that:

* it adapts the `GameLevel::health` member function (which takes two parameters: an implicit `GameLevel` parameter that `this` points to, as well as another reference to a `GameCharacter` parameter) into the expected function signature (which should only take a single paramter: the `GameCharacter`) 
* by passing `_1`, it specifies that when calling `GameLevel::health` for `ebg2`, always use `currentLevel` as the first parameter of `GameLevel` object

### The "Classic" strategy pattern

The conventional approach to Strategy design pattern would be to make the health-calculation function a virtual member function of a separate health-calculation hierarchy with root being `HealthCalcFunc`, so that different health calculation algorithm could be implemented in the derived classes in this inheritance hierarchy. Each object of type `GameCharacter` just contains a pointer to an object from the `HealthCalcFunc` hierarchy:

```cpp
class GameCharacter;  // forward declaration

class HealthCalcFunc {
public:
    ...
    virtual int calc(const GameCharacter&) const
    {...}
    ...  
};

HealthCalcFunc defaultHealthCalc;

class GameCharacter {
public:
    explicit GameCharacter(HealthCalcFunc *phcf = &defaultHealthCalc)
    : pHealthCalc(phcf)
    {}
    ...
private:  
    HealthCalcFunc *pHealthCalc;
};
```

[^1]: Template Method design pattern has nothing to do with C++ template.
[^2]: Here, the "target signature" is "function taking a reference to a `const GameCharacter` and returning an `int`", so any callable entity whose parameter can be implicitly converted to a `const GameCharacter&` and whose return type can be implicitly converted to an `int` is compatible with an object of the declared `tr1::function` type.
