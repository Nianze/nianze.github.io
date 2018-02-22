---
title: "Item-29 Strive for exception-safe code"
date: 2018-02-20T18:23:38-05:00
categories:
- article
- coding
tags:
- technique
- cpp
slug: strive for exception-safe code
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-02/2018-02-20.gif
---

Exception-safe functions leak no resources and allow no data structures to become corrupted, even when exceptions are thrown. Such functions offer the basic, strong, and nothrow guarantees.
<!--more-->

For exception-safe functions, there are two requirements when an exception is thrown:

1. Leak no resources
2. Don't allow data structures to become corrupted

Specifically, from the perspective of data structure corruption, exception-safe functions must offer one of three guarantees below from the weakest to the strongest:

1. The **basic guarantee** promises that if an exception is thrown, everything in the program remains in a valid state - all class invariants are satisfied, but the exact state of the program may not be predictable.
2. The **strong guarantee** promises that if an exception is thrown, the state of the program is unchanged - calls to such functions are _atomic_ in the sense that if they succeed, they successd completely, and if they fail, the program state is as if they'd never been called.
3. The **nothrow guarantee** promises never to throw exceptions - all operators on built-in types (e.g., `int`s, pointers, etc.) are nothrow. This is a critical building block of exception-safe code.

## Example

With all these terminologies bear in mind, let's see an example representing exception-unsafe style. Suppose there's a class for GUI menus with background images, and it will be used in a threaded environment, so it has a mutex for concurrency control:

```cpp
class PrettyMenu {
public:
    ...
    void changeBackGround(std::istream& imgSrc); // change background image
private:
    Mutex mutex;      // mutex for this obejct
    Image *bgImage;   // current background image
    int imageChanges; // # of times image has been changed
};
```

```cpp
void PrettyMenu::changeBackground(std::istream& imgSrc)
{
    lock(&mutex);   // acquire mutex (item 14)
    delete bgImage; // get rid of old background
    ++imageChanges; // update image change count
    bgImage = new Image(imgSrc); // install new background
    unlock(&mutex); // release mutex 
}
```

Firstly, the code above is likely to encounter resource leak, because if the `new Image(imgSrc)` expression yields an exception, the call to `unlock` never gets executed, and the mutex is held forever.

Secondly, this function guarantees none of the 3 promises in terms of data structure corruption above: when `new Image(Src)` throws, `bgImage` is left pointing to a deleted object, and `imageChanges` has been increamented before the new image has been installed, resulting to invalid object state.

### Resource leak

To address the resource leak issue, we can use objects to manage resources (item 13), and take advantage of `Lock` class to ensure that mutexes are released in a timely fashion (item 14):

```cpp
void PrettyMenu::changeBackground(std::istream& imgSrc)
{
    Lock ml(&mutex);   // item 14: acquire mutex and ensure its later release
    delete bgImage; 
    ++imageChanges; // update image change count
    bgImage = new Image(imgSrc); // install new background
}
```

### Data structure corruption

To address the issue of data structure corruption, we may need to determine which guarantee to offer. As a general rule, 

>we want to offer _the strongest_ guarantee that's _practical_. 

Note the word _practical_. We definitely want to offer nothrow guarantee for every functions we write, but it's hard to keep such a promise - to name a common exception: anything using dynamically allocated memory (e.g., all STL containers) runs the risk of a `bad_alloc` exception if it can't find enough memory to satisfy a request (item 49). For most functions, the choice for us is between the basic and strong guarantees.

In the case of `changeBackground`, _almost_ offering the strong guarantee is not difficult:

* firstly, we change the type of `bgImage` data member in `PrettyMunu` from a built-in `Image*` pointer to smart pointer such as `tr1::shraed_ptr` (item 13), which benefits us with 
    1. preventing resource leaks
    2. offering strong exception safety guarantee
* secondly, we reorder the statements so that we don't increment `imageChanges` until the image has been changed.

```cpp
class PrettyMenu {
    ...
    std::tr1::shared_ptr<Imgae> bgImage;
    ...
};
```

```cpp
void PrettyMenu::changeBackground(std::istream& imgSrc)
{
    Lock ml(&mutex);
    bgImage.reset(new Image(imgSrc)); // replace bgImage's internal pointer with the
                                     // result of the "new Image" expression
    ++imageChanges;
}
```

Note how the use of resource magangement object (i.e., the smart pointer here) helps:

1. The `tr1::shared_ptr::reset` function will be called only if its parameter (the result of `new Image(imgSrc)`) is successfully created
2. The `delete` operation for the old image is inside the `reset`, so if the `reset` function is never entered (the program somehow fails to create new image), the deletion of the old image will never take place
3. As a result, the deletion takes place only if the new image is successfully created
4. We don't need to manually `delete` the old image, and the length of `changeBackground` reduces

After these two changes, `changeBackground` _almost_ offer the strong exception safety guarantee. The only weakness now is the parameter `imgSrc`: if the `Image` constructor throws an exception, it's possible that the read marker for the input stream has been moved, which is a change in state visible to the rest of the program, leading to offering only the basic exception safety guarantee.

#### Copy-and-`swap` strategy

There actually is a general design strategy for offering the strong guarantee:

>**copy and swap** strategy:   
Make a copy of the object we want to modify, then make all needed changes to the copy;   
* If all the changes have been successfully completed, swap the modified object with the original in a non-throwing operation (item 25);   
* If any of the modifying operations throws an exception, the original object remains unchanged. 

The strategy is usually implemented by putting all the per-object data from the "real" object into a separate implementation object, then giving the real object a pointer to its implementation object (know as the "pimpl idiom", item 31). For `PrettyMenu`, it would look something like this:

```cpp
struct PMImpl {  // PMIpml = "PrettyMenu Impl."
    std::tr1::shared_ptr<Image> bgImage; 
    int imageChanges; 
};

class PrettyMenu {
...
private:
    Mutex mutex;
    std::tr1::shared_ptr<PMImpl> pImpl;
};
```

```cpp
void PrettyMenu::changeBackground(std::istream& imgSrc)
{
    using std::swap;  // item 25
    Lock ml(&mutex);  // acquire the mutex
    
    std::tr1::shared_ptr<PMImpl> pNew(new PMImpl(*pImpl));  // copy obj. data
    pNew->bgImage.reset(new Image(imgSrc)); // modify the copy
    ++pNew->imageChanges;
    swap(pImpl, pNew);  // swap the new data into place
} // release the mutex
```

We don't have to make the struct `PMImpl` as a class, because the encapsulation of `PrettyMenu` data is assured by `pImpl` being private, and it is more convenient to use struct. If desired, `PMImpl` could be nested inside `PrettyMenu` when considering packaging issues.

#### Side effects and efficiency

Even with the help of copy-and-`swap` strategy, there are two possible reasons that downgrade the overall exception safety level from strong to basic: _side effects_ and _efficiency_.

##### Side effects

Suppose `someFunc` uses copy-and-`swap` and includes calls to two other functions, `f1` and `f2`:

```cpp
void someFunc()
{
    ...    // make copy of local state
    f1();
    f2();
    ...    // swap modified state into place
}
```

Apparently, if `f1` or `f2` is less than strongly exception-safe, it will be hard for `someFunc` to be strong exception-safe. For example, suppose `f1` offers only the basic guarantee, in order to offer the strong guarantee for `someFunc`, we have to write code to determine the state of the entire program before calling `f1`, catch all exceptions from `f1`, and then store the original state. It's complicated, but it's doable. However, even if `f1` and `f2` are both strongly exception safe, as long as there are side effects on non-local data, it's much harder to offer the strong guarantee.

For example, if a side effect of calling `f1` is that a database is modified, and there is, in general, no way to undo a database modification that has already been committed; so after successfully calling `f1`, if `f2` then throws an exception, the state of the program is not the same as it was when calling `someFunc`, even though `f2` didn't change anything.



##### Efficiency 