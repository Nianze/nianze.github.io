---
title: "Item-4 Initialize objects before they're used"
date: 2018-01-22T18:47:54-05:00
series:
- effective c++
categories:
- coding
tags:
- technique
- cpp
slug: initialize before use
autoThumbnailImage: false
thumbnailImagePosition: right
featured_image: 2018/2018-01/2018-01-22.jpg
---

Since C++ is fickle about initialization, some good coding style is suggested.
<!--more-->
<!-- toc -->

There are basically only 3 rules we need to remember if wanting to avoid tragedy of using objects before they're initialized:

1. always manually initialize non-member objects of _built-in_ type, becauese C++ sometimes initializes them and sometimes not.
2. in constructors, prefer to use member initialization list to assignment inside the constructor body; data members in the initialization list is suggested to be in the same order as they are declared in the class (which helps to avoid reader confusion)
3. replacing non-local static objects with local static objects in order to avoid initialization order problems across translation units.

# 1. Initialize non-member _built-in_ type object

No need to remember rules about when built-in type object initialization is guaranteed to take place and when it isn't, for they're too complicated to know.

Just form a good habit to always initialize objects before using them manually.

```cpp
int x = 0; // manual init. of an int
const char *text = "A C-style string"; // manual init. of a pointer
double d;
std::cin >> d;
```

# 2. Initialize data member with member initialization list

The arguments in the initialization list are used as constructor arguments for the various data members (will be copy-constructed), which will be more efficient than a call to the default constructor followed by a calll to the copy assignment operator.

1. For data members of `const` and references, since they can't be assigned (item 5), initialization list must be used.
2. For built-in type data members, even though there's no difference in cost betweeen initialization and assignment, it is a good habit to place them in member initialization list for consistency.
3. For data members of user-defined type, since compilers will automatically call default constructors for absent ones in initialization list, even if you just want to call the default constructor, it is still a good habit to call the default constructors in the initialization list, just to make a good habbit to guarantee there's no data member left uninitialzed. 

Exception: multiple constructors share large common member initialization list may consider moving assignment to a single (private) function called by all the constructors, which will be helpful for initializing values from reading a file or database.

# 3. Initialze non-local static objects defined in different translation units

## Glossary:

1. _static object_: one that exists from the time it's constructed until the end of the program (i.e., their destructors will be called when _main_ finishes executing)
2. **local** _static object_: 
    - objects declared _static_ inside functions (it's local to a function)
3. **non-local** _static object_: 
    - global objects
    - objects defined at namespace scope 
    - objects declared _static_ inside classes
    - objects declared _static_ at file scope
3. _translation unit_: the source code giving rise to a single object file (basically a single source file plus all of its #include files)

Below is an example of non-local static objects requiring correct order of initialization (firstly tfs, secondly tempDir):

```cpp
//========================
// fileSystem.h       
class FileSystem {            // created by library developer
public:
    ...
    std::size_t numDisks() const;
    ...
};

extern FileSystem tfs;        // non-local static object for clients to use 
                              // "tfs" = "the file system"

//========================
// directory.h           
#include <fileSystem.h>       // created by library client
class Directory {
public:
    Directory( params );
    ...
};

Directory tempDir( params );  // non-local static object for
                              // directory of temporary files

//========================
// directory.cpp
Directory::Directory( params )
{
    ...
    std::size_t disks = tfs.numDisks(); // use the tfs objects
    ...
}
```

Since the relative order of initialization of non-local static objects (tfs vs. tempDir) defined in different translation units (fileSystem vs. directory) is undefined, and given the fact that C++ guarantees that local static objects are initialized when the object's definition is first encountered during a call to that function, simply replace direct accesses to non-local static objects with calls to functions that return references to local static objects, and the problem is solved, with a little bonus of saving the cost of constructing/destructing the object in the situation of the function never being called (this design implementation is the well-known singleton pattern):

```cpp
//========================
// fileSystem.h       
class FileSystem {...};     // as before

FileSystem& tfs()           // replace the tfs object;
{                           // could also be static in the FileSystem class
    static FileSystem fs;   // define and initialize a local static object
    return fs;              // return a reference to it
} 

//========================
// directory.h           
#include <fileSystem.h>       
class Directory { ... };          // as before

Directory& tempDir( params )      // replace the tempDir object;
{                                 // could also be static in the Directory class
    static Directory td(params);  // definea and initialize a local static object
    return td;                    // return a reference to it
}

//========================
// directory.cpp
Directory::Directory( params )
{
    ...
    std::size_t disks = tfs().numDisks(); // use the new tfs()
    ...
}
```

>P.S.: There's limitation for non-`const` static object (local or non-local) in multiple threads scenarios. One way to deal with the trouble is to manually invoke all the reference-returning functions during the single-threaded startup portion of the program to eliminate initialization-related race condition.
