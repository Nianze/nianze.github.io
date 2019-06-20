---
title: "[MECpp]Item-10 Prevent Resource Leaks in Constructors"
date: 2018-04-02T15:56:25-04:00
categories:
- technology
- coding
tags:
- technique
- cpp
slug: Prevent Resource Leaks in Constructors
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-04/2018-04-02.gif
---

Replace pointer class members with their corresponding smart pointer objects to fortify the constructors against resource leaks in the presence of exceptions, to eliminate the need to manually deallocate resources in destructors, and to allow `const` member pointers to be handled in the smae graceful fashion as non-`const` pointers.
<!--more-->
<!-- toc -->

# Example

Suppose we want to develop a software for a multimedia address book that might hold information of a person's name, address, phone numbers, a picture of the person and, the sound of their voice:

```cpp
class Image {  // for holding image data
public:
    Image (const string& imageDataFileName);
    ...
};

class AudioClip {  // for holding audio data
public:
    AudioClip(const string& sudioDataFileName);
    ...
};

class PhoneNumber {...}; // for holding phone numbers

class BookEntry {
public:
    BookEntry(const string& name,  // name data is mandatory for BookEntry, other fields are optional
              const string& address = "",
              const string& imageFileName = "",
              const string& audioClipFileName = "");
    ~BookEntry();
    void addPhoneNumber(const PhoneNumber& number); // phone numbers are added via this function
    ...
private:
    string theName;
    string theAddress;
    list<PhoneNumber> thePhones;
    Image *theImage;
    AudioClip *theAudioClip;
};
```

# Naive implementation

A straightforward implementation for constructor and destructor:

```cpp
BookEntry::BookEntry(const string& name,
                     const string& address,
                     const string& imageFileName,
                     const string& audioClipFileName)
: theName(name), theAddress(address),
  theImage(0), theAudioClip(0)
{
    if (imageFileName != "") {
        theImage = new Image(imageFileName);
    }
    if (audioClipFileName != "") {
        theAudioClip = new AudioClip(audioClipFileName);
    }
}

BookEntry::~BookEntry()
{
    delete theImage;  // C++ guarantees it's safe to delete null pointers
    delete theAudoClip;
}
```

Everything looks good, however, there is potential resource leak under abnormal conditions: when an exception is thrown duringg exectuion of `theAudioClip = new AudioClip(audioClipFileName);`:

* An exception might arise because `operator new` (MECpp item 8) is unable to allocate enough memory for an `AudioClip` object, or coming from `AudioClip` constructor who throws an exception itself, ending up with a exception propagated to the site where the `BookEntry` object is being created
* C++ destroys only _fully constructed_ objects, and an object isn't fully constructed until its construtor has run to completion. 
* The exception propagated from `new AudioClip(audioClipFileName` interrupts the construction of the `BookEntry` object, so the `BookEntry`'s destructor will never be called, and nobody will delete the object that `theImage` already points to.

Note that adding `try...catch` outside of the `BookEntry` constructor does not help:

```cpp
void testBookEntryClass()
{
    BookEntry *pb = 0;
    try {
        pb = new BookEntry("Sherlock Holmes", "221B Baker Street");
        ...
    }
    catch (...) {  // catch all exceptions
        delete pb; // delete pb when an exception is thrown
        throw;     // propagate exception to caller
    }
    delete pb;     // delete pb normally
}
```

If `BookEntry`'s constructor throws an exception, no assignment is made to `pb` and `pb` will be a null pointer, so deleting it in the `catch` block does nothing except make us feel better about ourselves.

# Workable (but inelegant) implementation

```cpp
BookEntry::BookEntry(const string& name,
                     const string& address,
                     const string& imageFileName,
                     const string& audioClipFileName)
: theName(name), theAddress(address),
  theImage(0), theAudioClip(0)
{
    try {
        if (imageFileName != "") {
            theImage = new Image(imageFileName);
        }
        if (audioClipFileName != "") {
            theAudioClip = new AudioClip(audioClipFileName);
        }
    }
    catch (...) {               // catch any exception
        delete theImage;        // perform necessary cleanup actions
        delete theAudioClip;
        throw;                  // propagate the exception
    }
}
```

For non-pointer data members such as `theName`, `theAddress`, and `thePhones`, they are automatically initialized before a class's constructor is called, so if a `BookEntry` constructor body begins exewcuting, they have already been fully constructed. As fully constructed objects, they will also be automatically destroyed even if an exception arises in  the `BookEntry` constructor.

Considering code duplication, we may move the common resource cleanup code into a private helper funciton and have both the constructor and the destructor call it:

```cpp
class BookEntry {
public:
    ... // as before
private:
    ... 
    void cleanup();  // common cleanup statement
};

void BookEntry::cleanup()
{
    delete theImage;
    delete theAudioClip;
}

BookEntry::BookEntry(const string& name,
                     const string& address,
                     const string& imageFileName,
                     const string& audioClipFileName)
: theName(name), theAddress(address),
  theImage(0), theAudioClip(0)
{
    try {
        ...
    }
    catch (...) {               // catch any exception
        cleanup();
        throw;                  // propagate the exception
    }
}

BookEntry::~BookEntry()
{
    cleanup();
}
```

---

# For both `constant` and non-`const` pointers

What if `BookEntry` class interface is designed differently, with `theImage` and `theAudioClip` defined as `constant` pointers, which must be initialized via the member initialization lists:

```cpp
class BookEntry {
public:
    ...
private:
    ...
    Image * const theImage;
    AudioClip * const theAudioClip;
};
```

## Naive implementation

We may be tempted to initit `theImage` and `theAudioClip` like this:

```cpp
// an implementation that may leak resources if an exception is thrown
BookEntry::BookEntry(const string& name,
                     const string& address,
                     const string& imageFileName,
                     const string& audioClipFileName)
: theName(name), theAddress(address),
  theImage(imageFileName != ""
           ? new Image(imageFileName)
           : 0), 
  theAudioClip(audioClipFileName != ""
               ? new AudioClip(audioClipFileNAme)
               : 0)
{}
```

but this leads to the problem of potential resource leak: if an exception is thrown during initialization of `theAudioClip`, the object pointed to by `theImage` is never destroyed.

## Workable design

In order to add `try` and `catch` to perform cleanup tasks in a member initialization list, we may consider put them inside private member functions that return pointers:

```cpp
class BookEntry {
public:
    ...
private:
    ...
    Image * initImage(const string& imageFileName);
    AudioClip * initAudioClip(const string& audioClipFileName);
};

BookEntry::BookEntry(const string& name,
                     const string& address,
                     const string& imageFileName,
                     const string& audioClipFileName)
: theName(name), theAddress(address),
  theImage(initImage(imageFileName)),
  theAudioClip(initAudioClip(audioClipFileName))
{}

// theImage is init. first, so there's no need to worry about a resource leak
// if this initialization fails.
Image * BookEntry::initImage(const string& imageFileName)
{
    if (imageFileName != "") return new Image(imageFileName);
    else return 0;
}

// theAudioClip is initialized second, so it must take care of theImage's resources
// if an exception is thrown during initialization of theAudioClip 
AudioClip * BookEntry::initAudioClip(const string& audioClipFileName)
{
    try {
        if (audioClipFileName != "") {
            return new AudioClip(audioClipFileName);
        }
        else return 0;
    }
    catch (...) {
        delete theImage;
        throw;
    }
}
```

This design works, but the drawback is that code that conceptually belongs in a constructor is now dispersed across several functions, and that's a maitenance headache.

## Better design

A better design is to adopt the advise of MECpp Item 9 (as well as item 13): 

* treat the objects pointed to by `theImage` and `theAudioClip` as resources to be managed by local objects (specifically, smart pointers).

Since the resource here is of pointer types, we can use smart pointers to manage them. Take `auto_ptr` for example:

```cpp
class BookEntry {
public:
    ...
private:
    ...
    const auto_ptr<Image> theImage;
    const auto_ptr<AudioClip> theAudioClip;
};

BookEntry::BookEntry(const string& name,
                     const string& address,
                     const string& imageFileName,
                     const string& audioClipFileName)
: theName(name), theAddress(address),
  theImage(imageFileName != ""
           ? new Image(imageFileName)
           : 0), 
  theAudioClip(audioClipFileName != ""
               ? new AudioClip(audioClipFileNAme)
               : 0)
{}

BookEntry::~BookEntry()  // nothing to do
{}                       
```

In this design, if an exception is thrown during initialization of `theAudioClip`, `theImage` is already a fully constructed object, so it will automatically be destroyed, jsut like `theName`, `theAddress`, and `thePhones`. Furthermore, because `theImage` and `theAudioClip` are now objects, they'll be destroyed automatically when the `BookEntry` object containing them is destroyed.
