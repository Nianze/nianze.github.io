---
title: "Item-22 Declare data members private"
date: 2018-02-10
categories:
- technology
- coding
tags:
- technique
- cpp
slug: Declare data members private
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-02/2018-02-10.jpg
---

Declaring data members `private` gives clients syntactically uniform access to data, affords fine-grained access control, allows invariants to be enforced, and offers class authors implementation flexibility.
<!--more-->
<!-- toc -->

# Syntactic consistency

If data member aren't public, the only way for clients to access an object is via member functions. If everything in the public interface is a function, clients know they will always use parentheses when accessing a member of the class, which is called "sysntactic consistency".

# Pricise control over the accessibility

If we use functions to get or set data member's value, we can implement multiple levels of accessibility:

```cpp
class AccessLevels {
public:
    ...
    int getReadOnly() const { return readOnly; }
    int getReadWrite() const { return readWrite; }
    void setReadWrite(int value) { readWrite = value; }
    void setWriteOnly(int value) { writeOnly = value; }
private:
    int noAccess;   // no access to this int
    int readOnly;   // read-only access to this int
    int readWrite;  // read-write access to this int
    int writeOnly;  // write-only access to this int
};
```

Since it is rare that every data member need a getter and setter, such fine-grained access control is important.

# Encapsulation

Encapsulation offers class authors implementation flexibility. Through a function, we can replace a data member with a computationi while nobody using the interface notice the change. For example, suppose we are writing an application monitoring the speed of passing cars, and each passing car's speed will be collected into the class:

```cpp
class SpeedDataCollection {
    ...
public:
    void addValue(int speed);    // add a new data value
    double averageSoFar() const; // return average speed
    ...
};
```

There are two ways to implement the member function `averageSoFar`:

1. have a data member in the classs that is a running average of all the speed data so far collected. `averageSoFar` will simply return the value of this data member.
2. have `averageSoFar` compute its value anew each time it's called by examining each data value in the collection

Both approaches have pros and cons, and decision on which to use depends on the specific use case:

* Method one makes each `SpeedDataCollection` object bigger for the extra data member holding the running average, the accumulated total, and the number of data points, but `averageSoFar` will be very efficient (it is just an inline function, see item 30). For an application where averages are needed frequently, and memory is not an issue, keeping a running average will be preferable.   
* Method two will make `averageSoFar` run slower, but each `SpeedDataCollection` object will be smaller. Thus it is preferable in applications where memory is tight (e.g., an embedded roadside device), and where averages are needed only infrequently

The point is, by encapsulating the average through a member function, we can interchange different implementations, and clients will only have to, at most, recompile (we can even eliminate recompilation by the technique described in item 31). Since only member functions can affect data members, it is ensured that the class invariants are always maintained. Moreover, through function interfaces, we have flexibility for extra capabilities with ease (similar concept of "properties" in Delphi and C#, albeit with the need to type an extra set of parentheses): 

* to notify other objects when data members are read or written
* to verify class invariants and function pre-and postconditions
* to perform synchronization in threaded environments

On the other side, if we don't encapsulate data members from clients, we give up the right to change our future implementation decisions. Even if we own the source code to a class, our ability to chagne anything public is extremely restricted, because too much client code will be broken. Public means unencapsulated, and unencapsulated means unchangeable, which is especailly true for widely used classes.

# `protected` data members

The argument above is also applicable for `protected` data members. In fact, no only the reasoning about syntactic consistency and fine-grained access control is applicable, the argument on encapsulation is also true for them:  
suppose we eliminate a `protected` data member, and then all the derived classes using it, typically in an unknowably large amount of size, will be broken, which is exactly the same case for `public` data members used by large number of different clients.

Thus, from an encapsulation point of view, there are really only two access levels:

1. `private`, which offers encapsulation
2. everything else, which doesn't

