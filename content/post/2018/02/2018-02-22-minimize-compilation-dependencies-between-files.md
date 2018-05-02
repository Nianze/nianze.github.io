---
title: "Item-31 Minimize compilation dependencies between files"
date: 2018-02-22
categories:
- article
- coding
tags:
- technique
- cpp
slug: minimize compilation dependencies between files
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-02/2018-02-22.gif
---

To minimize compilation dependencies, depend on declarations instead of definitions via techniques such as Handle classes and Interface classes.
<!--more-->

C++ doesn't do a very good job of separating interfaces from implementations. A  class definition specifies not only a class interface but also a fair number of implementation details. For example:

```cpp
class Person {
public:
    Person(const std::string& name, cnost Data& birthday, const Address& addr);
    std::string name() const;
    std::string birthDate() const;
    std::string address() const;
    ...
private:
    std::string theName; // implementation detail
    Date theBirthdate;   // implementation detail
    Address theAddress;  // implementation detail
};
```

Here, to compile `Person`, definitions for the data members `string`, `Date`, and `Address` that `Person` uses must be provided, typically through `#include` directives:

```cpp
#include <string>
#include "date.h"
#include "address.h"
```

Unfortunately, this inclusion sets up a compilation dependency between the file defining `Person` and these header files. If any of these header files or the header files' dependent header files is changed, the file containing the `Person` class must be recompiled, as must any files that use `Person`. Such cascading compilation dependencies are annoying, but C++ insists on putting the implementation details of a class in the class definition - we can't separate the implementation details of the class definition simply by forward-declaring everything like this:

```cpp
namespace std {
    class string; // incorrect way of forward declaration
}
class Date;  // forward declaration
class Address;  // forward declaration

class Person {
public:
    Person(const std::string& name, const Date& birthday, const Address& addr);
    std::string name() const;
    std::string birthDate() const;
    std::string address() const;
    ...
};
```

There're two problems with this idea:  
1. The minor one: `string` is not a class but a `typedef` for `basic_string<char>`. Thus the forward declaration for `string` is incorrect[^1].  
2. The more significant one: compilers need to know the size of objects to allocate enough space (typically on the stack) when they see a difinition for object `p`, so the implementation details can not be omited:
    
    ```cpp
    int main()
    {
        ...
        Person p(params);  // define a Person
        ...
    }
    ```

The essence of minimizing compilation dependencies it to truly separate interface from implementation, which means we have to replace dependencies on _definitions_ with dependencies on _declarations_.

## Handle classes

One way to hide the object implementation is through a pointer, in which case compilers allocate only enough space for a `pointer` when an object is defined:

```cpp
int main()
{
    ...
    Person *p;  // define a pointer to a Person
    ...
}
```

This is how languages like Smaltalk and Java deal with the object difinition, which is also totally legal in C++: we simply separate `Person` into two classes, one offering only an interface, the other implementing that interface:

```cpp
#include <string>  // standard library components
#include <memory>  // for tr1::shared_ptr
class PersonImpl;  // forward decl of Person impl. class
class Date;        // forward decls of classes used in Person interface
class Address;

class Person{
public:
    Perosn(const std::string& name, const Date& birthday, const Address& addr);
    std::string name() const;
    std::string birthDate() const;
    std::string address() const;
    ...
private:  // ptr to implementation
    std::tr1::shared_ptr<PersonImpl> pImpl; // see item 13 for shared_ptr
};
```

This design is often said to be using the _pimpl idiom_ ("pointer to implementation"). With such a design, clients of `Person` are divorced from the details of dates, address, and persons. Now, even if the implementations of those classes have been modified, `Person`'s clients need not recompile. 

In summary:   

* Avoid using objects when object references and poinnters will do (defining _objects_ of a type necessitates the presence of the type's definition).   

* Depend on class declarations instead of class definitions whenever we can:  

    ```cpp
    class Date:  // class declaration
    Date today();  // fine without class definition
    void clearAppointments(Date d); // fine. No definition of Date is needed
    ```

    Of course, if anybody _calls_ function `today` or `clearAppointments`, `Date`'s definition must have been seen prior to the call. But the point here is: 

    By moving the onus of providing class definitions from our library header file of function _declarations_ to clients' files containing function _calls_, the client dependiencies on type definitions they don't really need could be eliminated (especially when we have a library containing dozens of function declarations that not everybody calls all of them).

* Provide separate header files for declarations and definitions.

    Instead of forward-declaring something, library clients should always `#include` a declaration file, so library authors should provide two header files: one for declarations, the other for definitions. For example,

    ```cpp
    #include "detefwd.h"   // header file declaring (but not defining) class Date
    Date today();  // as before
    void clearAppointments(Date d);
    ```

    Here, the name of the declaration-only header file "datefwd.h" is based on the header <iosfwd>[^2] from the standard C++ library (item 54).

To employ the pimpl idiom, we just let forward all the function calls in the _handle class_ `Person` to the corresponding implementation class `PersonImpl`, which will do the real work. Below is the implementation of `Person`'s member functions:

```cpp
#include "Person.h"      // #inclue Person's class definition
#include "PersonImpl.h"  // #include PersonImpl's class definition to call its member functions;
                         // note that interfaces of PersonImpl and Person are identical
Person::Person(const std::string& name, const Date& birthday, const Address& addr)
:pImpl(new PersonImpl(name, birthday, addr))
{}

std::string Person::name() const
{
    return pImpl->name();
}
...
```

## Interface classes

An alternative approach is to make `Person` a special kind of abstract base class called an _Interface class_, which typically has no data members, no constructors, a virtual destructor (item 7), and a set of pure virtual funcitons that specify the interface. The similar concept could be found in Java and .NET, except that C++ doesn't impose the restrictions on Interface classes as Java and .NET do[^3].

An interface class for `Person` looks like this:

```cpp
class Person {
public:
    virtual ~Person();

    virtual std::string name() const = 0;
    virtual std::string birthDate() const = 0;
    virtual std::string address() const = 0;
    ...
};
```

Like clients of Handle classes, clients of Interface classes need not recompile unless the Interface class's interface is modified. 

In order to use Interface classes:

* clients need to program in terms of `Person` pointers and references, for `Person`, which contains pure virtual functions, can not be instantiated

* typically, clients create new `Person` objects by calling factory functions (item 13) or _virtual constructors_, which return pointers (preferably smart pointers, item 18) to dynamically allocated objects of derived classes that support the interface. Such functions are often declared `static` inside the Interface class:

    ```cpp
    class Person {
    public:
        ...
        static std::tr1::shared_ptr<Person>  // return a tr1::shared_ptr to a new
        create(const std::string&  name,     // Person initialized with the 
               const Date& birthday,         // gien params
               const Address& addr);
        ...
    };
    ```

    ```cpp
    std::string name;
    Date dateOfBirth;
    Address address;
    ...
    // create an object supporting the Person interface
    std::tr1::shared_ptr<Person> pp(Person::create(name, dateOfBirth, address));
    ...
    ```

* one way to implement the Interface class `Person` is to define a concrete derived class that inherits interface specification from `Person`, and then implement the functions in the interface:
    ```cpp
    class RealPerson: public Person {
    public:
        RealPerson(const std::string& name, const Date& birthday, const Address& addr)
        : theName(name), theBirthDate(birthday), theAddress(addr)
        {}
        virtual ~RealPerson(){}

        std::string name() const;    
        std::string birthDate() const;
        std::string address() const;
    private:
        std::string theName;
        std::string theBirthDate;
        Address theAddress;
    };
    ```

    Then it is trivial to write `Person::create`:

    ```cpp
    std::tr1::shared_ptr<Person> 
    Person::create(const std::string& name, const Date& birthday, const Address& addr)
    {
        return std::tr1::shared_ptr<Person>(new RealPerson(name, birthday, addr));
    }
    ```

    Of course, a more realistic implementation of `Person::create` would create different types of derived class objects, depending on the values of additional parameters.

* another way to implement an Interface class involves multiple inheritance, a topic explored in item 40.

## Cost of decoupling interfaces from implementations

The cost of Handle classes and Interface classes is the usual one in computer science: it costs us some speed at runtime, plus some additional memory per object. In addition, neither of them can get much use out of inline functions (item 30), since inline functions typically exists in header files while this item talks about how to hide implementation details like function bodies in header file.

**For Handle classes**:

* impact on runtime speed: 
    * member functions have to go through the implementation pointer to get to the object's data, which adds one level of indirection per access; 
    * the implementation object is dynamically allocated during the initialization of implementation pointer, which incurs the overhead of dynamic memory allocation and subsequent deallocation, as well as possible `bad_alloc` (out-of-memory) exception.
* impact on memory: 
    * we have to add the size of the implementation pointer to the amount of memory required by each object.

**For Interface classes**:

* impact on runtime speed: 
    * every function call is virtual, so we pay the cost of an indirect jump for each function call (item 7).
* impact on memory: 
    * object derived from the Interface class must contain a virtual table pointer (item 7), which may increase the amount of memory needed to store an object (if the Interface class is the exclusive source of virtual functions for the object)

Despite all the costs, consider using these techniques in an evolutionary manner: 

* use Handle classes and Interface classes during development to minimize the impact on clients when implementations change
* replace Handle classes and Interface classes with concrete classes for production use when the difference in speed and/or size is significant enough to justify the increased coupling between classes.

[^1]: The proper forward declaration of `string` is substantiallly complex, because it involves additional templates. Anyway, we shouldn't manually decalre parts of the standard library. Instead, user the proper `#include`s and be done with it.
[^2]:  <iosfwd> contains declarations of iostream components whose corresponding definitions are in several different headers, including <sstream>, <streambuf>, <fstream>, and <iostream>. Note that it still makes sense to provide declaration-only headers for templates: although in many build environments, template definitions are typically found in header files (item 30), some build environments still allow template definitons to be in non-headre files; and C++ also offers the `export` keyword to allow the separation of template declarations from template definitions (unfortunately compiler support for `export` is scanty).
[^3]: Neither Java nor .NET allow data members or function implementations in Interfaces, but C++ allows so, which could be useful in flexibility. For example, as item 36 explains, the implementation of non-virtual functions should be the same for all classes in a hierarchy, so it makes sense to implement such functions as part of the Interface class.