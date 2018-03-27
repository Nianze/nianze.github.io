---
title: "[MECpp]Item-4 Avoid Gratuitous Default Constructors"
date: 2018-03-26T11:21:08-04:00
categories:
- article
- coding
tags:
- technique
- cpp
slug: Avoid Gratuitous Default Constructors
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-03/2018-03-26.gif
---

Including meaningless default constructors affects the efficiency of classes, so avoiding them in classes guarantees fully-initialized objects, with the cost of some limits on how such classes can be used.
<!--more-->

For many objects, there is no reasonable way to perform a complete initialization in the absence of outside information. Consider a class for company equipment in which the corporate ID number of the quipment is a mandatory constructor argument:

```cpp
class EquipmentPiece {
public:
    EquipmentPiece(int IDNumber);
    ...
};
```

## With default constructor

Some people believe _all_ classes should include a default constructors, even if a default constructor doesn't have enough information to fully initialize objects of the class. Adherents to this philosophy will modify `EquipmentPiece` as follows:

```cpp
class EquipmentPiece {
public:
    EquipmentPiece(int IDNumber = UNSPECIFIED);
    ...
private:
    static const int UNSPECIFIED; // magic ID num. value meaning no ID was specified
};
```

There are two downsides after including a default constructor in a class where none was warranted:

1. There's no longer any guarantee that the fields of an `EquipmentPiece` object have been meaningfully initialized, so member functions must check if each object has valid `IDNumber` before using it. If not, clients must find a solution to deal with the situation - sometimes they simply throw an exception or terminates the program, which may degrade the overall quality of the software.
2. The meaningless default constructors affects the efficiency of classes: member functions have to include extra code to test object's validness and deal with the failure tests, and clients of those functions have to pay for the time those tests take as well as the space the extra code occupies.

## Without default constructor

If a class lacks a default constructor, there are restrictions on how you can use that class. Specifically, in three constexts:

* Creation of arrays
* Ineligible for some template-based container classes
* Virtual base classes

### 1. Creation of arrays

There is, in general, no way to specify constructor arguments for objects in arrays:

```cpp
EquipmentPiece bestPieces[10];  // error! No way to call EquipmentPiece ctors.
EquipmentPiece *bestPieces = new EquipmentPiece[10];  // error! same problem
```

There are three ways to get around the restriction:

    1. Provide the necessary arguments when array is defined

    This solution works only for non-heap arrays:

    ```cpp
    int ID1, ID2, ID3, ..., ID10;  // variables to hold equipment ID numbers
    ...
    EquipmentPiece bestPieces[] = {  // fine, ctor arguments are provided
        EquipmentPiece(ID1);
        EquipmentPiece(ID2);
        ...
        EquipmentPiece(ID10);
    }
    ```

    2. Use an array of _pointers_ instead of an array of objects

    ```cpp
    typedef EquipmentPiece* PEP;     // a PEP is a pointer to an EuipmentPiece
    PEP bestPieces[10];              // fine, no ctor called
    PEP *bestPieces = new PEP[10];   // fine, no ctor called
    
    for (int i = 0; i < 10; ++i) {
        bestPieces[i] = new EquipmentPiece( ID Number );
    }
    ```

    The disadvantages to this approach is:

    * We have to remember to delete all the objects pointed to by the array. Otherwise there's resource leak.
    * The total amount of memory increases due to the extra space for the pointers

    3. Use "placement `new`" (item 8)

    ```cpp
    // allocate enough memory for an array of 10 EuipmentPiece obj.
    void *rawMemory = operator new[](10*sizeof(EquipmentPiece));

    // make bestPieces point to the memory so it can be treated as an EquipmentPiece array
    EquipmentPiece *bestPieces = static_cast<EquipmentPiece*> (rawMemory);

    // construct the EquipmentPiece objects in the memory using placement new
    for (int i = 0; i < 10; ++i) {
        new (bestPieces+i) EquipmentPiece( ID Number );
    }
    ```

    This design avoids the spece penalty of extra pointers, but the downside is that we must manually call destructors on the objects in the array, then manually deallocate the raw memory by calling `operator delete[]` (item 8), which is unfamiliar by most programmers[^1]:

    ```cpp
    // destruct the objects in bestPieces in the inverse order
    for (int i = 9; i >= 0; --i) {
        bestPieces[i].~EquipmentPiece();    
    }
    // deallocate the raw memory
    operator delete[](rawMemory);
    ``` 

### 2. Ineligible for some template-based container classes

Some templates requires that the type used to instantiate the template proved a default constructor for purpose such as createing an array of the template parameter type inside the template:

```cpp
template<class T>
class Array {
public:
    Array(int size);
    ...
private:
    T *data;
};

Template<class T>
Array<T>::Array(int size)
{
    data = new T[size];  // calls T::T() for each elem. of the array
    ...
}
```

Although careful template design can eliminate the need for a default constructor (such as `vector` template), there are templates designed with that requirement. That being the case, classes without default constructors will be incompatible with such templates.

### 3. Virtual base classes

Arguments for virtual base class construcctors must be provided by the most derived class of the object being constructed. As a result, a virtual base class lacking a default constructor requires that _all_ classes derived from that class must know about, understand the meaning of, and provide for the virtual base class's constructors' arguments, which is neigher expected not appreciated by authors of derived classes.

[^1]: If we forget this requirement and use the normal array-deletion syntax `delete[] bestPieces`, the program will behave unpredictably, because deleting a pointer that didn't come from the `new` operator is undefined.