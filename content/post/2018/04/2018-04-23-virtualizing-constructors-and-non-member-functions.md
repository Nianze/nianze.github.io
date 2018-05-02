---
title: "[MECpp]Item-25 Virtualizing Constructors and Non-Member Functions"
date: 2018-04-23T13:30:56-04:00
categories:
- article
- coding
tags:
- technique
- cpp
slug: Virtualizing Constructors and Non-Member Functions
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-04/2018-04-23.gif
---

Depending on the different input or dynamic types of function parameters, "virtualization" is a useful technique to construct new objects of different types accordingly, or to conceive of non-member functions whose behavior changes accordingly.
<!--more-->

Constructors and non-member functions can't really be virtual. We just make them act "virtually" so that it is easier to use. The term "virtual" means that a function will achieve type-specific behavior when we have a pointer or reference to an object without knowing its dynamic type in advance.

## Virtual constructor

Suppose we write applications for working with newsletters, where a newsletter consists of components that are either textual or graphical:

```cpp
class NLComponent {  // abstract base class for newsletter components
public:
    // constain at least one pure virtual function
    virtual NLComponet * clone() const = 0; // virtual copy constructor
    ...
};

class TextBlocks: public NLComponent { // 
public:
    virtual TextBlock * clone() const  // virtual copy constructor
    { return new TextBlock(*this); }  
    ...                                // constain no pure virtual function
};

class Graphic: public NLComponent {
public:
    virtual Graphic * clone() const  // virtual copy constructor
    { return new Graphic(*this); } 
    ...                                // constain no pure virtual function    
};

class NewsLetter {  // a newsletter object consists of a list of NLComponent objects
public:
    NewsLetter(istream& str);
    NewsLetter(const NewsLetter& rhs);  // normal copy constructor
    ...
private:
    list<NLComponet*> components; 
    static NLComponet * readComponet(istream& str); // read the data for the next NLComponet from str, create the component and return a pointer to it
};
```

The classes relate in this way:

```
NewsLetter object
┌───────────────┐
│     ...       │
├───────────────┤                    ┌──────────────┐
│[list object]--│-----pointers------>│  NLComponent │
└───────────────┘                    └──────────────┘
                       public inheritance ↗   ↖ public inheritance
                             ┌───────────┐      ┌──────────┐
                             │ TextBlock │      │  Graphic │
                             └───────────┘      └──────────┘
```

Suppose `NewsLetter` objects are stored on disk, it is convevient that `NewsLetter`  takes an `istream` to read information from the stream as it creates the necessary in-core data structures. Depending on the data it reads, we need to create either a `TextBlock` or a `Graphic`, which are different types of objects. Here comes the `readComponent`, which acts like constructor for its creating new objects, while it is also able to create different types of objects according to the iput it is given. Thus we call such a constructor as the _virtual constructor_, which are useful in many constexts.

Given `readComponent` acting as a virtual constructor, it is easy to implement the constructor for `NewsLetter`:

```cpp
NewsLetter::NewsLetter(istream& str)
{
    while (str) {
        componets.push_back(readComponet(str));
    }
}
```

Among all kinds of virtual functions, there is another widely useful one: the _virtual copy constructor_, which returns a pointer to a new copy of the object invoking the function, and is typically named like `copySelf`, `cloneSelf`, or simply `clone`. These virtual copy constructors just calls its real copy constructor, so that the meaning of "copy" keeps the same for both functions[^1] - consistency.

Notice that a derived class's redefinition of a base class's virtual function declare different return types here: if the function's return type is a pointer (or a reference) to a base class, the derived class's function may return a pointer (or reference)  to a class derived from that base class. Thus `TextBlock`'s `clone` returns a `TextBlock*` and `Graphic`'s `clone` returns a `Graphic*` while the return type of `NLComponent`'s `clone` is `NLComponent*`.

Taking advantage of the virtual copy constructor in `NLComponent`, `NewsLetter` only need to implement a normal copy constructor:

```cpp
NewsLetter::NewsLetter(const NewsLetter& rhs); // normal copy constructor impl. in terms of virtual copy constructor
{
    for (list<NLComponent*>::const_iterator it = rhs.components.begin();
         it != rhs.componets.end();
         ++it) {
             componets.push_back((*it)->clone());
         }
}
```

## Virtual Non-member functions

Suppose we'd like to implement output operators for the `TextBlock` and `Graphic` classes. Given that the defaultly output operator `operator<<` takes an `ostream&` as its left-hand argument, we can not make it a member function of the `TextBlock` or `Graphic` classes, so it can't be declared as `virtual`. On the other hand, if we insist on declaring a virtual function for printing (e.g., `print`), and thus define a `print` for the `TextBlock` and `Graphic`, the syntax for printing `TextBlock` and `Graphic` objects is inconsistent with that for the other types in the language, which makes our clients unhappy.

What we want it a non-member function called `operator<<` that exhibits the behavior of a virtual function like `print`. The solution? We define both `operator<<` and `print` and have the former call the latter, and we get the virtual-acting non-member function:

```cpp
class NLComponent {
public:
    virtual ostream& print(ostream& s) const = 0;
    ...
};

class TextBlock: public NLComponent {
public:
    virtual ostream& print(ostream& s) const;
    ...
}

class Graphic: public NLComponent {
public:
    virtual ostream& print(ostream& s) const;
    ...
}

iinline ostream& operator<<(ostream& s, const NLComponent& c)
{
    return c.print(s);
}
```

Since the non-virtual function does nothing but call the virtual function that does the real work, we inline the non-virtual function to avoid the cost of a function call.

Note that, although not easy, it is possible to make non-member functions act virtually on more than one of their arguments - details in MECpp item 31.

[^1]: If the real copy constructor performs a deep copy, so does the virtual copy constructor. If the real copy constructor does something fancy like reference counting or copy-on-write (MECpp item 29), so does the virtual copy constructor.