---
title: "[MECpp]Item-3 Never Treat Arrays Polymorphically"
date: 2018-03-23T18:59:16-04:00
categories:
- article
- coding
tags:
- technique
- cpp
slug: Never Treat Arrays Polymorphically"
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-03/2018-03-23.gif
---

Array operations almost always involve pointer arithmetic, so arrays and polymorphism don't mix.
<!--more-->

C++ allows us to manipulate _arrays_ of derived class objects through base class pointers and references, but it almost nerver works athe way we want it to.

For example, suppose following base class `BST` (binary search tree objects) and its derived class `BalancedBST`:

```cpp
class BST {...};
class BalancedBST: public BST {...};
```

For a function working with an array of `BST`s, it works fine when we pass it an array of `BST` objects:

```cpp
void printBSTArray(ostream& s, const BST array[], int numElements)
{
    for (int i = 0; i < numElements; ++i) {
        s << array[i]; // assumes operator<< is defined for BST objects
    }
}

BST BSTArray[10];
...
printBSTArray(cout, BSTArray, 10);  // work fine
```

However, when passing an array of `BalancedBST` objects:

```cpp
BalancedBST bBSTArray[10];
...
printBSTArray(cout, bBSTArray, 10);
```

The compilers will accept this function call without complaint, but then for `array[i`]`, they will generate code involving pointer arithmetic:

* `array[i]` is just shorthand for expression `*(array+i)`
* the distance between the memory location pointed to by `array` and by `array+i` is calculated through `i*sizeof(object in the array)`
* the parameter `array` is declared to be of type `array-of-BST`, so each element of the array is regard as `BST`, and thus the distance is `i*sizeof(BST)`
* the size of an object of type `BalancedBST` usually is larger than their base class ones' size, because derived class usually has extra data members
* If it is, the ointer arithmetic generated for `printBSTArray` will be wrong for arrays of `BalancedBST` objects

---

Another problem will pop up if we try to delete an array of derived class objects through a base class pointer:

```cpp
void deleteArray(ostream& logStream, BST array[])
{
    logStream << "Deleting array at address "
              << static_cast<void*>(array) << '\n';
    delete [] array;
}

BalancedBST *balTreeArray = new BalancedBST[50]; // create a BalancedBST array
...
deleteArray(cout, balTreeArray);  // log its deletion
```

There's pointer arithmetic going on here, too: when compilers see the statement `delete [] array;`, they will generate code that looks like this:

```cpp
for (int i = the number of elements in the array - 1; i >= 0; --i) 
{
    array[i].BST::~BST(); // call array[i]'s destructor
}
```

Now we understand why the language specification says that the result of deleting an array of derived class objects through a base class pointers is undefined: here, again, polymorphism meets pointer arithmetic.

In the point of software designing, as MECpp-item 33 suggests, we're unlikely to make the mistake of treating an array polymorphically if we avoid having a concrete class (like `BalancedBST`) inherit from another concrete class (such as `BST`).
