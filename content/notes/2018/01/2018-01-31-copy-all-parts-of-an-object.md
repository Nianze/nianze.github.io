---
title: "Item-12 Copy all parts of an object"
date: 2018-01-31T18:16:11-05:00
series:
- effective c++
categories:
- coding
tags:
- technique
- cpp
slug: copy all parts of an object
autoThumbnailImage: false
thumbnailImagePosition: right
featured_image: 2018/2018-01/2018-01-31.jpg
---

Be sure to copy all of an object's data members and all of its base class parts.
<!--more-->

In a well-designed object-oriented system that encapsulate the internal parts of objects, there should only be two copying function:

1. copy constructor
2. copy assignment operator

As item 5 introduced, we may create our own versions of copy function. The thing is, while the compiler-generated ones copy all the data of the object being copied as expected, the manually defined copy functions may be implemented in the wrong way, the partial-copied way:

```cpp
class Customer {
public:
    ...
    Customer(const Customer& rhs);
    Customer& operator=(const Customer& rhs);
private:
    std::string name;
    //int age; potential new data memberf
};

Customer::Customer(const Customer& rhs)
:name(rhs.name){}    // copy rhs's data

Customer& Customer::operator=(const Customer& rhs)
{
    name = rhs.name; // copy rhs's data
    return *this;    // item 10
}
```

Everything is fine here, unless there's more data members, such as the `age`, added into the `Customer` class. Interesting thing is that even if there's new data member added, compiler will most likely not complain about potential partial-copy problem if we don't add the data member to the copying functions and all the constructors. So we have to rely on ourselves.

A more subtle way to get into the problem comes from inheritance:

```cpp
class PriorityCustomer: public Customer {
public:
    ...
    PriorityCustomer(const PriorityCustomer& rhs);
    PriorityCustomer& operator=(const PriorityCustomer& rhs);
private:
    int priority;
};

PriorityCustomer::PriorityCustomer(const PriorityCustomer& rhs) 
: priority(rhs.priority) {}

PriorityCustomer& 
PriorityCustomer::operator=(const PriorityCustomer& rhs)
{
    priority = rhs.priority;
    return *this;
}
```

The problem here is that derived class `PriorityCustomer` also contains inherited data members (`Customer.name`) but the copying functions only cover its newly added data member (`PriorityCustomer.priority`), ending up with a partial-copy problem. In order to take care of the base class parts, which are typically private (item 22), we need to invoke the corresponding base class functions and implement the derived class's copying function in this way:

```cpp
PriorityCustomer::PriorityCustomer(const PriorityCustomer& rhs) 
: Cutomer(rhs),          // invoke vase class copy ctor
priority(rhs.priority) {}

PriorityCustomer& 
PriorityCustomer::operator=(const PriorityCustomer& rhs)
{
    Customer::operator=(rhs);  // assign base class part
    priority = rhs.priority;
    return *this;
}
```

Sometimes you may find the copy constructor and copy assignment operator share a lot of code bodies, so a good way to eliminate the duplication is to create a third (private) member function that both copying functions call. Don't let one copying function call the other, since it makes no sense:

1. You can't do an assignment operation even before the object get constructed and initialized.
2. It may corrupt object if calling copy construction function in copy assignment operator.

In summary, copy all parts mean:

1. copy all local data members (especially those get added later)
2. invoke the appropriate copying function in all base classes
