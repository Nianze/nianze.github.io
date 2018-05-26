---
title: "[MECpp]Item-28 Smart Pointers"
date: 2018-05-05T16:38:03-04:00
categories:
- article
- coding
tags:
- technique
- cpp
slug: Smart Pointers
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-05/2018-05-05.gif
---

_Smart pointers_ are designed to look, act, and feel like built-in pointers, but to offer greater functionality.
<!--more-->

## Advantages of smart pointers

With the help of smart pointers, we gain control over the following aspects of pointer behavior:

1. Construction and destrucrtion (default value, reference counting, etc)
2. Copying and assignment (deep copy, not allowed to copy, etc)
3. Dereferencing (lazy fetching, etc)

### Using smart pointer in client perspective

Consider a distributed system in which some objects are local and some are remote. We can use smart pointer to manage the local and remote objects handling in order to offer such an illusion that all objects appear to be located in the same place.

```cpp
template<class T>            // template for smart ptrs
class DBPtr {                // to obj. in a distributed DB
public:
	DBPtr(T *realPtr = 0);   // create a smart ptr to a DB obj given a local dumb pointer
	DBPtr(DataBaseID id);    // create a smart ptr to a DB obj given its unique DB identifier
	...                      // other smart ptr functions
};

class Tuple { // class for database tuples
public:
	...
	void displayEditDialog();  // present a graphical dialog box allowing a user to edit the typle
	bool isValid() const;  // return whether *this passes validity check
};

// class template for making log entries whenever a T object is modified
template<class T>
class LogEntry {
public:
	LogEntry(const T& objectToBeModified);
	~LogEntry();
};

void editTuple(DBPtr<Tuple>& pt)
{
	LogEnty<Tuple> entry(*pt); // make log entry for this editing operation
	// repeatedly display edit dialog until valid values are provided
	do {
		pt->displayEditDialog();
	} while (pt->isValid() == false)
}
```

The tuple to ber edited inside `editTuple` may be physically located on a remote machine, but the programmer writing `editTuple` need not be converned with such matters. Wrapped by objects, all kinds of tuples are accessed through smart pointers, which act just like built-in pointers (except for how they're declared).

Notice the use of `LogEntry` object here is to take the advantage of `LogEntry`'s constructor and destructor to begin and end the log entry, which is more robust in the face of exceptions than explicitly calling functions (MECpp item 9). 

In a word, clients of smart pointers are _supposed_ to be able to treat them as dumb pointers.

## Construction, assignment, and destruction of smart pointers

Construction of a smart pointer is usually straightforward: locate an object to point to, then make the smart pointer's internal dumb pointer point there. If no object can be located, set the internal pointer to 0 or signal an error (by throwing an exception).

However, the issue of _ownership_ makes it complicated to implement a smart pointer's copy constructor, assignment operator(s), and destructor: depending on wheter a smart pointer _owns_ the object it points to, should it delete the object when the smart pointer itself is destroyed?

* if we just copied the internal dumb pointer in copy constructor and call `delete` in destructor, we end up with two smart pointers pointing to the same object, resulting to multiple deletes, which is undefined behavior.

* if we create a new copy of what was pointed to by calling `new` in the copy constructor, we may have to face an unacceptable performance hit for the creation (and later destruction) of the new object. Further more, we wouldn't know what type of object to create, because a smart pointer of type `T` might point to an object of a type derived from `T`. Virtual constructors can help solve this problem, but it seems inappropriate to require their use in a general-purpose smart pointer class.

The problem would vanish if we prohibit copying and assignment, but a more flexible solution was adopted by the `auto_ptr` template from the standard C++ library: object ownership is _transferred_ when an `auto_ptr` is copied or assigned:

```cpp
template<class T>
class auto_ptr {
public:
	auto_ptr(T *ptr = 0): pointee(ptr) {}
	auto_ptr(auto_ptr<T>& rhs);  // copy constructor
	auto_ptr<T>& operator=(auto_ptr<T>& rhs); // assignment operator
	~auto_ptr<T>() { delete pointee; }
private:
	T *pointee;
};

template<class T>
auto_ptr<T>::auto_ptr(auto_ptr<T>& rhs)
{
	pointee = rhs.pointee;
	rhs.pointee = 0;
}

template<class T>
auto_ptr<T>& auto_ptr<T>::operator=(auto_ptr<T>& rhs)
{
	if (this == &rhs)
		return *this;
	delete pointee;

	pointee = rhs.pointee;
	rhs.pointee = 0;

	return *this;
}
```

For this design, there are three points woth noting:

#### 1. Pass by reference to const

Because object ownership is transferred when `auto_ptr`'s copy constructor is called, passing `auto_ptr`s by value is often a very bad idea:


```cpp
void printTreeNode(ostream& s, auto_ptr<TreeNode> p)
{ s << *p; }

int main()
{
	auto_ptr<TreeNode> ptn(new TreeNode);
	...
	printTreeNode(cout, ptn);  // pass auto_ptr by value
}
```

When `printTreeNode`'s parameter `p` is initialized by calling `auto_ptr`'s copy constructor, ownership of the object pointed to by `ptn` is transferred to `p`. After `printTreeNode` finishes execution, `p` goes out of scope and its destructor deletes what it points to, so `ptn` no longer points to anything (its underlying dumb pointer is null). This is rarely what we want to do.

Instead, pass-by-reference-to-const:

```cpp
// this function behaves much more intuitively
void printTreeNode(ostream& s, const auto_ptr<TreeNode>& p)
{ s << *p; }
```

Since this is pass by reference, no constructor is called to initialize `p`, and `ptn` retains ownership of the object it points after function execution.

#### 2. Unconventional copy constructor and assignment operator

Normally the copy constructor and assignment operator take `const` parameters during the copy or the assignment. However, `auto_ptr` objects are modified if they are copied or are the source of an assignment, so we don't declare `const` here for the copy constructor and assignment operator in `auto_ptr`.

#### 3. No ownership testing in desturctor

An `auto_ptr` always owns what it points to, so there is no need for the ownership test in destructor. However, a smart pointers that employs reference counting (MECpp item 29) must adjust a reference count before detrmining whether it has the right to delete what it points to, so their destructor often looks like this:

```cpp
tempalte<class T>
SmartPtr<T>::~SmartPtr()
{
	if (*this owns *pointee) {
		delete pointee;
	}
}
```

## Implementing the dereferencing operators

#### `operator*`

```cpp
template<class T>
T& SmartPtr<T>::operator*() const
{
	perform "smart pointer" processing;
	return *pointee;	
}
```

A few things woth noting:

1. The "smart pointer" processing does whatever is needed to initialize or otherwise make `pointee` valid. For example, if lazy fetching is being used (MECpp item 17), the process may conjure up a new object for `pointee` to point to.
2. The `operator*` returns a _reference_ to the pointed-to object, instead of an _object_. This is for concerns of both correctness and efficiency. 
	* Correctness: if returning an _object_, this is possible for _slicing problem_ - see MECpp item 13 - where a `T` object is returned instead of an actual derived class object that is expected.
	* Efficiency: there is no need to construcrt a temporary object (MECpp 19), so returning a reference is more efficient.
3. The result of dereferencing a null pointer is undefined, so we are free to do anything we want if `operator*` is invoked with a null smart pointer. (i.e., throw an exception, call `abort`, etc)


#### `operator->`

When we call `operator->` in the statement `pt->displayEditDialog();`, the compilers treat it as:


```cpp
(pt.operator->())->displayEditDialog();
```

This means it must be legal to apply the member-selection operator(->) to whatever `operator->` returns, leading to only two options: 

* a dumb pointer to an object 
* another smart pointer object

Most of the time we want to return an ordinary dumb pointer, so the implementation for `operator->` is:


```cpp
template<class T>
T* SmartPtr::operator->() const
{
	perform "smart pointer" processing
	return pointee;
}
```

Note that since this function returns a pointer, virtual function calls via `operator->` will behave the way they're supposed to.

## Testing smart pointers for nullness

So far we can not do the following operation to find out if a smart pointer is null:

```cpp
SmartPtr<TreeNode> ptn;
...
if (ptn == 0) ... // error!
if (ptn) ...      // error!
if (!ptn) ...     // error!
```

If we want to make smart pointer act like dumb pointers when testing for nullness, an additional `isNull` member function will not be ideal solution. We may be attempted to provide an implicit conversion operator: `operator void*()`, but this will also introduce the draback of letting function calls succeed that most programmers would expect to fail (see MECpp item 5). In particular, it allows comparisons of smart pointers of completely different types:

```cpp
SmartPtr<Apple> pa;
SmartPtr<Orange> po;
...
if (pa == po) ... // this compiles!
```

This compiles because both smart pointers can be implicitly converted into `void*` pointers, and there is a built-in comparison function for built-in pointers. Similarly, even if we advocate conversion to `const void*` or `bool`, neither of these variations eliminates the problem of allowing mixed-type comparisons. There is simply too much conversion freedom in this wild solution. 

There is a middle middle ground that allows us to offer a reasonable syntactic form for testing for nullness while minimizing the chances of accidentally comparing smart pointers of of different types. That is to overload `operator!` to return true if and only if the smart pointer on which it's invoked is null:

```cpp
template<class T>
class SmartPtr {
public:
	...
	bool operator!() const; // returns true if and only if the smart ptr is null
};
```

This will lead to:

```cpp
if (!ptn) ...  // fine
if (ptn == 0)  ...  // still an error
if (ptn) ...  // still an error
```

And the only risk for mixed-type comparisons is statements such as this:

```cpp
...
if (!pa == !po) ...  // this still compiles
```	

Fortunately, programmers usually don't write code like this.

## Converting smart pointers to dumb pointers

When a dump pointer is expected for some lagacy libraries (say `normalize(Tuple *pt);`), we can not simply call the library function with a smart pointer-to-`Tuple`, because there is no way to convert a `DBPtr<Tuple>` to a `Tuple*`. We can make it work by doing this:

```cpp
normalize(&*pt);  // gross, but legal
```

but apparently this is not elegant.

A dangerous solution will be to add to the smart pointer-to-T template an implicit conversion operator to a dumb pointer-to-T:

```cpp
template<class T>
class DBPtr{
public:	
	...
	operator T*() { return pointee; }
	...
};

DBPtr<Tuple> pt;
...
normalize(pt);  // this now works
if (pt == 0) ...  // fine, too
if (pt) ... // fine, too
if (!pt) ...  // fine, too
```

However, as stated in MECpp item 5, there's dark side to such conversion function: it's so easy for clients to get access to dumb pointers that they bypass all the smart behavior (such as reference-counting ability) our pointer-like objects designed to provide, which will almost certainly lead to disaster (such as bookkeeping errors that corrupt the reference-counting data structures):

```cpp
void processTuple(DBPtr<Tuple>& pt)
{
	Tuple *rawTuplePtr = pt;  // convert DBPtr<Tuple> to Tuple*
	use rawTuplePtr to modify the tuple;
}
```

Besides, even we provide such implicit conversion operator, our smart pointer will never be truly interchangeable with the dumb pointer: the conversion from a smart pointer to a dumb pointer is a user-defined conversion, and compilers are forbidden from applying more than one user-defined conversion at a time. Following example shows this difference, where conversion from `DBPtr<Tuple>` to `TupleAccessors` calls for two user-defined conversions (1. `DBTpr<Tuple>` -> `Tuple*`; 2. `Tuple*` -> `TupleAccessors`), which are prohibited by the language:

```cpp
class TupleAccessors {
public:
	TupleAccessors(const Tuple *pt); // this ctor also acts as a type-conversion operator
	...
};
TupleAccessors merge(const TupleAccessors& ta1, const TupleAccessors& ta2);
...
Tuple *pt1, *pt2;
merge(pt1, pt2);  // fine, both pointers are converted to TupleAccessors objects
...
DBPtr<Tuple> smart_pt1, smart_pt2;
merge(smart_pt1, smart_pt2);  // error! no way to convert smart_pt1 and smart_pt2 to TupleAccessors implicitly
```

Moreover, implicit conversion functino makes it possible to let evil statement compile, which will almost certainly break our program later[^1]:

```cpp
DBPtr<Tuple> pt = new Tuple;
...
delete pt;  // this compiles
```

All in all, keep in mind the bottom line: don't provide implicit conversion operators to dumb pointers unless there is a compelling reason to do so.

## Smart pointers and inheritance-based type conversions

Given the following public inheritance hierarchy:

```cpp
class MusicProduct {
public:
	MusicProduct(const string& title);
	virtual void play() const = 0;
	virtual void displayTitle() const = 0;
};
class Cassette: public MusicProduct {
public:
	Cassette(const string& title);
	virtual void play() const;
	vitual void displayTitle() const;
	...
};
class CD: public MusicProduct {
public:
	CD(const string& title);
	virtual void play() const;
	virtual void displayTitle() const;
	...
};
```

It is expected that the virtual function will work properly with dumb pointers:

```cpp
void displayAndPlay(const MusicProduct* pmp, int numTimes)
{
	for (int i = 1; i <= numTimes; ++i)
	{
		pmp->displayTitle();
		pmp->play();
	}
}

Cassette *funMusic = new Cassette("Alapalooza");
CD *nightmareMusic = new CD("Disco Hits of the 70s");

displayAndPlay(funMusic, 10);
displayAndPlay(nightmareMusic, 0);
```

However, as far as compilers are converned, `SmartPtr<CD>`, `SmartPtr<Cassette>`, and `SmartPtr<MusicProduct>` are three seperate classes without any relationship to one another, so if we pass an object of type `SmartPtr<CD>` into a function with signature `void displayAndPlay(const SmartPtr<MusicProduct>, int)`, there will be error.

#### Manually adding implicit conversion operator

A naive solution: adding into each smart pointer class an implicit type conversion operator. Take `SmartPtr<Cassette>` for example:

```cpp
class SmartPtr<Cassette> {
public:
	operator SmartPtr<MusicProduct>()
	{ return SmartPtr<MusicProduct>(pointee); }
	...
};
```

Yet there are two drawbacks in this design:

1. manually adding the necessary implicit type conversion operators specializes the `SmartPtr` class instantiations, which defeats the purpose of templates
2. too many conversion operators to add - given a deep inheritance hierarchy, we must provide a conversion operator for _each_ base class from that object directly or indirectly inherits (again, compilers are prohibited from employing more than one user-defined type conversion function at a time.)

#### Generating conversion operators via member templates

The right way to take is to take advantage of _member function templates_ (or just _member templates_):

```cpp
template<class T>
class SmartPtr {
public:
	SmartPtr(T* realPtr = 0);
	T* operator->() const;
	T* operator*() const;

	template<class newType>      // template function for
	operator SmartPtr<newType>() // implicit conversion ops.
	{
		return SmartPtr<newType>(pointee);
	}
};
```

Here's what happens:

* Compiler needs to convert a smart pointer-to-`T` object into a smart pointer-to-base-class-of-`T`
* Compiler checks the class definition for `SmartPtr<T>` to see if the requisite conversion operator is declared -> it is not
* Compiler then checks to see if there's a member function template it can instantiate that would perform the wanted conversion -> it finds a template
* Compiler instantiates the template with `newType` bound to the base class of `T`
* Given this instantiated member function, compiler finds it legal to pass the dumb pointer `pointee` to the constructor for the smart pointer-to-base-of-`T`, because `T`-type `pointee` is legal to be converted into a pointer to its (public or protected) base classes
* The code compiles -> the implicit conversion from smart pointer-to-`T` to smart pointer-to-base-of-`T` succeeds

Note that this implicit conversion will succeed for _any_ legal implicit conversion between pointer types: if (and only if) a dumb pointer type `T1*` can be implicitly converted to another pointer type `T2*`, we can implicitly convert a smart pointer-to-`T1` to a smart pointer-to-`T2`.

However, there's still a drawback: suppose following augmented `MusicProduct` hierarchy:

```
                  ┌──────────────┐
 				  │ MusicProduct │
                  └──────────────┘
   					  ↗     ↖ 
             ┌──────────┐      ┌────┐
             │ Cassette │      │ CD │
             └──────────┘      └────┘
                   ↑
             ┌───────────┐
             │ CasSingle │
             └───────────┘
```

```cpp
template<class T>      // as above, including member tempate
class SmartPtr {...};

void displayAndPlay(const SmartPtr<MusicProduct>& pmp, int howMany);
void displayAndPaly(const SmartPtr<Cassette>& pc, int howMany);

SamrtPtr<CasSingle> dumbMusic(new CasSingle("Achy Breaky Heart"));
displayAndPlay(dumbMusic, 1);  // error!
```

When invoking `displayAndPlay` with a `SmartPtr<CasSingle>`, according to the inheritance hierarchy, we may expect the `SmartPtr<Cassette>` function to be chosen, because `CasSingle` inherits directly from `Casssette` and only indirectly from `MusicProduct`. However, it will only work in the case of dumb pointers. For our smart pointers, as far as C++ compilers are concerned, both calls to conversion functions here are equally good (the conversion from `SmartPtr<CasSingle>` to `SmartPtr<Cassette>` is no better than the conversion to `SmartPtr<MusicProduct>`), leading to an error of ambiguous call to `displayAndPlay`. The best we can do, then, is to use casts (MECpp item 2) in this ambiguous case.

## Smart pointers and const

To mimic the flexibility of constness in terms of smart pointers, we use follwoing ways to create four combinations of `const` and non-`const` objects and pointers:

```cpp
CD goodCD("Flood");
SmartPtr<CD> p;  // non-const object, non-const pointer
SmartPtr<const CD> p;  // const object, non-const pointer
const SmartPtr<CD> p = &goodCD;  // non-const object, const pointer
const SmartPtr<const CD> p = &goodCD;  // const object, const pointer
```

Moreover, we can use the member templates technique shown above for automatically generating the implicit type conversion operators from `SmartPtr<CD>` to `SmartPtr<const CD>` - this technique works anytime the corresponding conversion for dumb pointers would work， and conversions involving `const` are no exception.

[^1]: It is possible that, after `delete pt;`, `pt`'s destructor (or some true owner of `pt`) will invoke `delete pt;` for a second time, and double deletion yields undefined behavior.