---
title: "Item-44 Factor parameter-independent code out of templates"
date: 2018-03-10T20:24:42-05:00
series:
- effective c++
categories:
- coding
tags:
- technique
- cpp
slug: factor parameter-independent code out of templates
autoThumbnailImage: false
thumbnailImagePosition: right
featured_image: 2018/2018-03/2018-03-10.gif
---

Templates generate multiple classes and multiple functions, so any template code not dependent on a template parameter (either non-type template parameters or type parameters) causes bloat: eliminate bloat due to non-type template parameters by replacing template parameters with function parameters or class data members; reduce bloat caused from type parameters by sharing implementations for instantiation types with identical binary representations.
<!--more-->
<!-- toc -->

When writing templates, since there's only one copy of the template source code, we have to analyze it carefully to avoid the implicit replication that may take place when a template is instantiated multiple times. 

# Bloat due to non-type template parameters

For example, suppose we'd like to write a template for fixed-size square matrices that support matrix inversion:

```cpp
template<typename T, std::size_t n>  // template for n*n matrices of obejcts of type T
class SquareMatrix{
pubic:
    void invert();  // invert the matrix in place
    ...
};
```

This template takes a type parameter `T` as well as a _non-type parameter_ `n` of type `size_t`. This example is actually a classic way for template-induced code bloat: 

```cpp
SquareMatrix<double, 5> sm1;
sm1.invert();  // call SquareMatrix<double, 5>::invert
SquareMatrix<double, 10> sm2;
sm2.invert();  // call SquareMatrix<double, 10>::invert
```

In the statements above, two copies of `invert` will be instantiated, and these two version of `invert` are character-for-character identical except for the use of 5 in one version and 10 in the other. To reduce the code bloat, we could redesign and call a parameterized function instead.

## Replace with function parameters

```cpp
template<typename T>     // size-independent base class for square matrices
class SquareMatrixBase{  // all matrices holding a givin type of object will share a single base class with a single copy of this base class's version of invert
protected: 
    // intend only to be a way for derived classes to avoid code replication, so declared as protected instaend of public
    void invert(std::size_t matrixSize); // invert matrix of the given size
    ...
};

template<typename T, std::size_t n>
class SqureMatrix: private SquareMatrixBase<T> { // not a is-a relationship, using private inheritance only for base class implementation, item 39
private:
    using SquareMatrixBase<T>::invert;  // avoid hiding base version of invert, item 33
public:
    ...                                 // make inline call to base class version of invert:
    void invert() { this->invert(n); }  // 1. it's implicit inline, so there's no addictional cost of calling it, item 30
    ...                                 // 2. use "this->" so that function names in templatized base classes are revealed in derived classes, item 43
};
```

This design addressed the issue of code bloat, but it also introduces a problem: `SquareMatrixBase::invert` only knows the size of the data, but it does not know where the data for a particular matrix is, because only the derived class knows that. We could add another parameter to `SquareMatrixBase::invert`, such as a pointer to the beginning of a chunk of memory that stores the matrix's data. 

However, an alternative and possibly better solution will be to have `SquareMatrixBase` store both a pointer to the memory for the matrix values, as well as the matrix size, so that any other functions asking for the matrix memory address or matrix size can be written in a address-independent-and-size-independent manner, and moved into `SquareMatrixBase`.

## Replace with class data members

```cpp
template<typename T>
class SquareMatrixBase {
protected:
    SquareMatrixBase(std::size_t n, T *pMem)  // store matrix size and a ptr to matrix values
    : size(n), pData(pMem) {}
    void setDataPtr(T *ptr) { pData = ptr; }  // reassign pData
    ...
private:
    std::size_t size;  // size of matrix
    T *pData;  // pointer to matrix values
};
```

```cpp
template<typename T, std::size_t n>
class SquareMatrix: private SqureMatrixBase<T> {
public:
    SquareMatrix()  // send matrix size and data ptr to base class
    : SquareMatrixBase<T>(n, data) {} 
    ...
private:
    T data[n*n];
};
```

Objects of such type have no need for dynamic memory allocation, but the objects could be very large. An alternative would be to put the data for each matrix on the heap:

```cpp
template<typename T, std::size_t n>
class SquareMatrix: private SqureMatrixBase<T> {
public:
    SquareMatrix()  
    : SquareMatrixBase<T>(n, 0),         // set base class ptr to null
      pData(new T[n*n])                  // allocate memory for matrix values and save a ptr to the memory
    { this->setDataPtr(pData.get()); }   // give a copy of the ptr to the base class
    ...
private:
    boost::scoped_array<T> pData;  // see item 13 for info on boost::scoped_array
};
```

No matter where the matrix value data is stored, the result from a bloat point of view is that many `SquareMatrix`'s member functions can be simple inline calls to base class versions that are shared with all other matrices holding the same type of data, regardless of their size.

## Efficiency concerns

In terms of efficiency, it is possible that the version of `invert` with the matrix sizes hardwired into them generates better code than the shared version whose size is passed as a function parameter or is stored in the object: in the size-specific versions, the sizes would be compile-time constants, hence eligible for optimizations such as constant propagation (they'll be folded into the generated instructions as imeediate operands), which can't be done in the size-independent version.

On the other side, the size-independent version decreases the size of executable by having only one version of `invert` for multiple matrix sizes, and this could reduce the program's working set size and improve locality of reference in the instruction cache, which may in term compensating for any lost optimizations in size-specific versions of `invert`. The only way to tell which version is better one is to try them both and observe the behavior on the particular platform and on representative data sets.

## Other trade-offs

Speaking of size of objects, we should observe that there's an extra size of a pointer in each `SquareMatrix` object, because, as the derived class, `SquareMatrix` could get to the data by alternative designs such as having the base class store a `protected` pointer to the matrix data. However, this new design also has some disadvantages:

1. it may lead to the loss of encapsulation described in item 22
2. it may also lead to resource management complications: since derived class may either dynamically alloacate the matrix data, or physically store the data inside the derived class object, if we only let the base class store a pointer to that data, it is hard for base class to determine whether the pointer should be deleted or not.

At some point, a little code replication seems like a mercy to keep away from complication.

# Bloat due to type parameters

On many platforms, `int` and `long` have the same binary representation, so the member functions for `vector<int>` and `vector<long>` would likely be identical. Some linkers will merge identical function implementations, but some will not, and that means that some templates instantiated on both `int` and `long` could cause code bloat in some environments.

Similarly, on most platforms, all pointer types have the same binary representation, so templates holding pointer types (e.g., `list<int*>`, `list<const int*>`, `list<SquareMatrix<long, 3>*>`, etc.) should be able to use a single underlying implementation for each member function. Typically, this is achieved by implementing member functions that work with strongly typed pointers (i.e., `T*` pointers) by having them call functions that work with untyped pointers (i.e., `void*` pointers), which is how some of standart C++ library do for templates like `vector`, `deque`, and `list`.
