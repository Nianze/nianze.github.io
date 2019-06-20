---
title: "[MECpp]Item-32 Program in the Future Tense"
date: 2018-05-17T19:26:17-04:00
categories:
- technology
- coding
tags:
- technique
- cpp
slug: Program in the Future Tense
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-05/2018-05-17.gif
---

Things change. Future tense thinking increases the reusability of the code we write, enhances its maintainability, makes it more robust, and facilitates gracefully in an environment where change is a certainty.
<!--more-->
<!-- toc -->

To program in the future tense is to accept that things will change and to be prepared for it.

# Changing world

Recognize that 
* new functions will be added to libraries, that new overloading will occur, and potentially ambiguous function calls that might result
* new classes will be added to hierarchies, present-day derived clases may be tomorrow's base classes
* new application will be written so functions will be called in new contexts while still being expected to perform correctly

# Changing people

Acknowledge that

* programmers charged with software maintenance are typically not the code's original developers, hence to design and implement in a fashion that facilitates comprehension, modification, and enhancement by others.
* "Anything somebody _can_ do, they _will_ do": client developers have different level of experience with C++, so the intention of a class designer may be misunderstood. 

# Principle

* Design the class easy to use correctly and hard to use incorrectly
    * do what an `int`s will do
    * use C++ itself to express design constraints instead of (or in addition to) comments or documentation
* Strive for portable code
    * if there is no great penalty for generalizing the code, generalize it
* Design the code so that when changes are necessary, the impact is localized 
    * provide complete classes even if some parts aren't currently used - when new demands are made on our classes, we're less likely to have to go back and modify them
    * do: 
        * encapsulate as much as we can; 
        * make implementation details private; 
        * use unnamed namespaces...
    * avoid: 
        * designs leading to virtual base classes (such classes must be initialized by every class derived from them, MECpp item 4) 
        * RTTI-based designs that make use of cascading `if-then-else` (MECpp item 31)
