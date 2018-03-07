---
title: "Item-40 Use multiple inheritance judiciously"
date: 2018-03-06T17:35:59-05:00
categories:
- article
- coding
tags:
- technique
- cpp
slug: use multiple inheritance judiciously
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-03/2018-03-06.gif
---

Being more complex than single inheritance, Multiple inheritance (MI) can lead to ambiguity issues and to the need for virtual inheritance, the latter of which imposes costs in size, speed, and complexity of initialization and assignment, so it's more practical to make "empty" virtual base classes.
<!--more-->

## Ambiguity

In the realm of MI, one thing worth noting is that it becomes possible to inherit the same name (e.g., function, typedef, etc.) from more than one base class:

```cpp
class BorrowableItem {  // something a library lets you borrow
public:
    void checkOut();  // check the item out from the library
    ...
};

class ElectronicGadget {
private:
    bool checkOut() const; // perfom self-test, return whether test succeeds
    ...
};

class MP3Player:  // Multiple inheritance
    public BorrowableItem,
    public ElectronicGadget
{...};
```

```cpp
MP3Player mp;
mp.checkOut();  // ambiguous!
```

In the example above, even though only the public one in `BorrowableItem` of the two `checkOut` functions is accessible, the call to `checkOut` is ambiguous, because before seeing whether a function is accessible, C++ first identifies the function that's the best match for the call, and in this case both `checkOut`s are equally good matches, so there's no best match. The accessibility of `ElectronicGadget::checkOut` is never examined.

To resolve the ambiguity, specify which base class's function to call:

```cpp
mp.BorrowableItem::checkOut();
```

## Virtual inheritance

It is not uncommon in the world of MI to encounter the classical case of "deadly MI diamond", where there are more than one path between a base class and a derived class:

```cpp
class File {...};
class InputFile: public File{...};
class OutputFile: public File{...};
class IOFile: public InputFile,
              public OutputFile
{...};
```

```
          File
        ↗      ↖
InputFile       OutputFile
        ↖      ↗
         IOFile
```


Here, between `File` and `IOFile`, we've found two paths either through `InputFile` or `OutputFile`, and we come to the following question:

>Do we want the data members in the base class to be replicated for each of the paths?

By default, C++ performs the replication, so if there's a data member named `fileName` in the `File`, `IOFile` will inherits a copy from each of its base classes `InputFile` and `OutputFile`, resulting in two `fielName` data members in `IOFile`.

If this is not what we want, we must make the `File` a _virtual base class_:

```cpp
class File {...};
class InputFile: virtual public File{...};
class OutputFile: virtual public File{...};
class IOFile: public InputFile,
              public OutputFile
{...};
```

```
           File
(virtual)↗      ↖(virtual)
InputFile       OutputFile
         ↖      ↗
         IOFile
```

From the viewpoint of correct behavior, public inheritance should always be virtual. However, inheritance costs both in terms of memory and runtime: compared to their counterparts without virtual inheritance, objects created from clases using virtual inheritance are generally larger, and access to data members in virtual base classes is also slower.

To make things more complicated, it is required that the responsibility for initializing a virtual base is borne by the _most derived class_ in the hierarchy, which implies:

* classes derived from virtual bases that requires initialization must be awared of their virtual bases
* when a new derived class is added to the hierarchy, it must assume initialization responsibilities for its virtual bases (both direct and indirect).

To make things easier to handle, we could adopt following strategy:

* Use non-virtual by default, and don't use virtual bases unless we need to
* If we must use a virtual base classes, avoid putting data in them[^1]

## Example of legitimate MI usecase

Multiple inheritance does have legitimate uses. One scenario involves combining public inheritance from an Interface class with private inheritance from a class that provides help of implementation.

For example, we want to implement the following C++ Interface class (from item 31) to model persons:

```cpp
class IPerson {
public:
    virtual: ~IPerson();

    virtual std::string name() const = 0;
    virtual std::string birthDate() const = 0;
};
```

We want to create a concrete class `CPerson`, and luckily, we find following old database-specific class `PersonInfo` offering the essense of what `CPerson` needs:

```cpp
class PersonInfo {
public:
    explicit PersonInfo(DatabaseID pid);
    virtual ~PersonInfo();

    virtual const char * theName() const;
    virtual const char * theBirthDate() const;
    ...
private:
    virtual const char * valueDelimOpen() const;
    virtual const char * valueDelimClose() const;
    ...
};

const char * PersonInfo::valueDilimOpen() const
{
    return "[";  // default opening delimiter
}

const char * PersonInfo::valueDilimClose() const
{
    return "]";  // default closing delimiter
}

const char * PersonInfo::theName() const
{
    // reserve buffer for return value, 
    // it's automatically init. to all zeros due to static
    static char value[Max_Formatted_Field_Value_Length];

    // write opening delimiter
    std::strcpy(value, valueDelimOpen());

    append this obj.'s name fields to the string in value

    // write closing delimiter
    std::strcat(value, valueDelimClose());

    return value;
}
```

This design of `PersonInfo::theName` is antiquated indeed: it use a fix-size static buffer, which is rife for both overrun and threading problems (item 21). Let's set such imperfection aside, and focus on `theName`, which calls virtual function `valueDelimOpen` and `valueDelimClose`, so the result returnd by `theName` is dependent not only on `PersonInfo` but also on the classes derived from `PersonInfo`. 

Apparently, the relationship between `CPerson` and `PersonInfo` is `is-implemented-in-terms-of` (we just want to re-use some of the code. That's all). Also, suppose that we want our target class `CPerson` to return unadorned values (return "Name" instead of "[Name]"), which requires redefining of the virtual functions in `PersonInfo`. Thus between the composition (item 38) and private inheritance (item 39) we prefer private inheritance, because simple composition will not let us redefine the virtual functions in `PersonInfo`[^2].

Thus, we could make following reasonable multiple inheritance:

```cpp
class IPerson {...}; // the interface. same as above

class DatabaseID {...}; // used below

class PersonInfo {...};  // used for implementing the IPerson interface

class CPerson: public IPerson, private PersonInfo {
public:
    explicit CPerson(DatabaseID pid()): PersonInfo(pid) {}
    virtual std::string name() const
    { return PersonInfo::theName(); }  // implementing the IPerson member function
    virtual std::string birthDate() const
    { return PersonInfo::theBirthDate(); } // implementing the IPerson member function
private:
    const char * valueDelimOpen() const { return ""; } // inherited virtual delimiter functions
    const char * valueDelimClose() const { return ""; } // inherited virtual delimiter functions
};
```

In UML, the design looks like this:


```
     IPerson   PersonInfo
        ↖      ↗(private)
         IOFile
```

## Summary

Compared to single inheritance (SI), multiple inheritance (MI) is typically more complicated to use and more complicated to understand, so if SI design is more or less equivalent to an MI design, we prefer the SI design. Sometimes, though, MI is the clearest, most maintainable, most reasonable way to get the job done. When that's the case, just use it, with judiciousness.

[^1]: Without any standalone data, we don't worry about oddities in the initialization and assignment rules for the virtual bases. This is exactly why the Interfaces in Java and .NET, which are in many ways comparable to virtual base classes in C++, are not allowed to contain any data.
[^2]: Complex composition that is combined with public inheritance, as showed in item 39, may also meed our needs, but here we just use private inheritance because it's easy to understand.