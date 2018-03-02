---
title: "Item-35 Consider Alternatives to Virtual Functions"
date: 2018-02-28T20:27:02-05:00
categories:
- article
- coding
tags:
- technique
- cpp
slug: consider alternatives to virtual functions
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-02/2018-02-28.gif
draft: true
---

Alternatives to virtual functions include the NVI idiom and various forms of the Strategy design pattern. The NVI idiom is itself an example of the Template Method design pattern.
<!--more-->

Suppose we want to implement a member function named `healthValue`, which will calculate the health value for different characters in differen ways in a video game. Declaring `healthValue` virtual seems the obvious way to design things:

```cpp
class GameCharacter {
public:
    virtual int healthValue() const;  // return character's health value rating; derived classes may redefine this
    ...                               // impure virtual suggests there's a default impl. (item 34)
                                    
};
```

Actually, except from this obvious design, there exists some alternatives. To name a few:

* Use the **non-virtual interface idiom (NVI idiom)**, a form of the **Template Method design pattern** that wraps public non-virtual member functions around less accessible virtual functoins
* Use the **Strategy design pattern**, specifically:    
    * Replace virtual function with **function pointer data members** - a stripped-down manifestation of Strategy design pattern
    * Replace virtual function with **tr1::function data members**, which allows use of any callable entity with a signature compatible with what we need - a more general form of the stripped-down representation of Strategy design pattern
    * Replace virtual functions in one hierarchy with **virtual functions in another hierarchy** - the conventional implementation of the Strategy design pattern
* ...

Let's take a look at the pros and cons of these alternatives.

## The template method pattern via the non-virtual interface idiom

## The strategy pattern

### The strategy pattern via function pointers

### The strategy pattern via `TR1::function`

### The "Classic" strategy pattern