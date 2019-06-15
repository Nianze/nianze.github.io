---
title: "Item-28 Avoid returning handles to object internals"
date: 2018-02-16T12:26:14-05:00
categories:
- technology
- coding
tags:
- technique
- cpp
slug: avoid return handles to obejct internals
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-02/2018-02-16.gif
---

Avoid returning handles to object internals to increase encapsulation, help `const` member functions act `const`, and minimize the creation of dangling handles.
<!--more-->

References, pointers, and iterators are all _handlers_ (ways to get at other objects), and returning a handle to an object's internals always runs the risk of   

1. compromising an object's encapsulation 
2. making `const` member functions act like non-`const` ones, allowing an object's state to be modified
3. leading to dangling handles

To see how handlers result in these resks, let's see an example.  
Suppose we're working with a rectangle class, represented by its upper left corner and lower right corner. To keep a `Rectangle` object small, we decide that the corner points should be stored in an auxiliary struct that the `Rectangle` points to:

```cpp
class Point {  // class representing points
public:
    Point(int x, int y);
    ...
    void setX(int newVal);
    void setY(int newVal);
    ...
};
```

```cpp
struct RectData {  // Rectangle corner point data
    Point ulhc;    // "upper left-hand corner"
    Point lrhc;    // "lower right-hand corner"
}
```

```cpp
class Rectangle {
public:
    Point& upperLeft() const { return pData->ulhc; }
    Point& lowerRight() const { return pData->lrhc; }
    ...
private:
    std::tr1::shared_ptr<RectData> pData; // see item 13 for tr1::shared_ptr
    ...
};
```

As item 20 suggests that  passing user-defined types by reference is typically more efficient than passing them by value, the two public member functions return references to the underlying `Point` ojects. Yet this design is wrong, for it's self-contradictory:  

* on the one side, the two member functions are declared `const`, indicating read-only access level of the point they return
* on the other side, returning handles to private internal data lets callers be able to modify that internal data:

    ```cpp
    Point coord1(0, 0);
    Point coord3(100, 100);
    const Rectangle rec(coord1, coord2); // rec is a const rectangle from (0,0) to (100,100)
    rec.upperLeft().setX(50); // now (50,0) to (100,100)
    ```

Apparently, by returning handles to the _private_ `ulhc` and `lrhc` through the _public_ member functions `upperLeft` and `lowerRight`, the overall access level of data member goes to `public`, and the encapsulation decreases. This makes the risk 1 above.

The second risk comes from the fact that if a `const` member function returns a reference (or any other handles) to data associated with an object that is stored outside the object itself, the caller of the function can modify that data due to its fallout of the limitation of bitwise constness (item 3).

You may think the two risks above may be eliminated by applying `const` to the return types:

```cpp
class Rectangle {
public:
    ...
    const Point& upperLeft() const { return pData->ulhc; }
    const Point& lowerRight() const { return pData->lrhc; }
    ...
};
```

With this altered design, the 2 problems above are indeed solved. Even so, the dangling handles in risk 3 are still possible.

>Dangling handles: handles that refer to parts of objects that don't exist any longer.

In fact, function return values are the most common source of dangling handles. Consider a function that returns the bounding box for a GUI object in the form of a rectangle:

```cpp
class GUIObject {...};
const Rectangle boundingBox(const GUIObject& obj); // returns a rectangle by value; see item 3 for why return type is const
```

If client use this function like this:

```cpp
GUIObject *pgo;  // make pgo point to some GUIObject
...
const Point *pUpperLeft = &(boundingBox(*pgo).upperLeft()); // get a ptr to the upper left point of its bounding box
```

This is a good example for dangling handle. The call to `boundingBox` will return a new, temporary `Rectangle` object. Let's call it _temp_. `upperLeft` will then be called on _temp_, and that call will return a reference to an internal part of _temp_ (i.e., the upperLeft corner point), to which `pUpperLeft` will then point. The tragedy comes at the end of the statement, when `boundongBox`'s return value _temp_ is destroyed, and then it indirectly leads to the destruction of _temp_'s upperLeft corner point, leaving `pUpperLeft` pointing to an object that no longer exists.

As long as a handle is being returned, we run the risk that the handle will outlive the object it refers to. But this doesn't mean we should _never_ have a member function that returns a handle. Sometimes we have to - an exception is `operator[]` in `string` and `vector`, which works by returning references to the data in the containers (item 3), and that data will be destroyed when the containers themselves are.

>P.S.: by the way, we generally think of an object's "internals" as its data members, but member functions not accessible to the general public (`private` and `protected` ones) are part of an object's internals, too. Thus it's important not to return handles to them (i.e., never have a member function return a pointer to a less accessible member function), otherwise the access level will be that of the more accessible function, just like how the risk 1 shows us.
