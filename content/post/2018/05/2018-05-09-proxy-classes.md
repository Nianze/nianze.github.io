---
title: "[MECpp]Item-30 Proxy Classes"
date: 2018-05-09
categories:
- technology
- coding
tags:
- technique
- cpp
slug: Proxy Classes
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-05/2018-05-09.gif
---

Objects that stand for other objects are often called _proxy objects_ (or _surrogates_), and the classes that give rise to proxy objects are often called _proxy classes_, which is useful for implementing multidimensional arrays, differentiating lvalue/rvalue, and suppressing implicit conversions.
<!--more-->
<!-- toc -->

# Implementing Two-Dimensional Arrays

Consider this statement:

```cpp
int data[10][20];
...
cout << data[3][6]; // fine
```

We want to create a general 2D array supporting operations such as `data[3][6]`. However, there's no such thing as a `operator[][]` in C++. The reason it is legal to write code above that appears to use `operator[][]` is because the variable `data` is not really a two-dimensinal array at all, but a 10-element one-dimensional array, each element of which is itself a 20-element array. So the expression `data[3][6]` really means `(data[3])[6]` - the seventh element of the array that is the fourth element of `data`.

Playing the same trick as above, we can define our `Array2D` class by overloading `operator[]` to return an object of a new class, `Array1D`:

```cpp
template<class T>
class Array2D {
public:
    class Array1D {
    public:
        T& operator[](int index);
        const T& operator[](int index) const;
    };

    Array1D operator[](int index);
    const Array1D operator[](int index) const;
    ...
};
```

Then it is legal to write code like this:

```cpp
Array2D<float> data(10, 20);
...
cout << data[3][6];
```

Conceptually intances of `Array1D` class (which is a _proxy class_) do not exist for clients of `Array2D`. Such clients program as if they were using real, live two-dimensional arrays.

# Distinguishing Reads from Writes via operator[]

`operator[]` can be called in two different contexts:

1. _rvalue_ usage for read
2. _lvalue_ usage for write

In general, using an object as an lvalue means using it such that it might be modified, and using it as rvalue means using it such that it cannot be modified.

From MECpp item 29 reference counting, we can see reads can be much less expensive than writes - writes of reference-counted object may involve copying an entire data structure, while reads never require more than the simple returning of a value - so it will save a lot to differentiate lvalue usage from rvalue usage. However, it is impossible to tell whether `operator[]` is beeing invoked in an lvalue or an rvalue context from within `operator[]` - `operator[]` alone does not have the ability to determine the calling context.

The solution: we _delay_ our lvalue-vs-rvalue actions until we see how the result of `operator[]` is used - by using proxy class to postpone our decision until _after_ `operator[]` has returned (lazy evaluation, see MECpp item 7):

```cpp
class String {   // reference-counted strings
public:

    class CharProxy {   // proxy fro string chars
    public:
        CharProxy(String& str, int index);  // creation
        CharProxy& operator=(const CharProxy& rhs); // lvalue uses
        CharProxy& operator=(char c);  // lvalue uses
        operator char() const; // rvalue uses
    private:
        String& theString;  // string this proxy pertains to        
        int charIndex;  // char within that string this proxy stands for
    };

    const CharProxy operator[](int index) const; // for const Strings
    CharProxy operator[](int index);  // for non-const Strings
    ...
    friend class CharProxy; // CharProxy need access to private data member: value
private:
    RCPtr<StringValue> value;
};
```

Now let's see how it works. Given reference-counted stirngs using proxies above `String s1, s2;`,

## For rvalue usage

Consider this statement `cout << s1[5];`: `s1[5]` yields a `CharProxy` object, and compiler implicitly converts this `CharProxy` into `char` using the conversion operator declared in the `CharProxy` class. This is representitive of the _CharProxy-to-char_ conversion that takes place for all `CharProxy` objects used as rvalues.

## For lvalue usage

Lvalue usage is handled differently:

Say, for statement `s2[5] = 'x';`, the expression `s2[5]` yields a `CharProxy` object, which is the target of an assignment, so the assignment operator in the `CharProxy` class will be called - this is the crucial postponed step to differentiate writes from reads. Inside this `CharProxy` assignment operator, we know the string character for which the proxy stands is being used as an lvalue.

Similarly, the statement `s1[3] = s2[7];` calls the assignment operator for two `CharProxy` objects, and inside the operator, we know the object on the left is being used as an lvalue and the object on the right as an rvalue.

Now that we know exactly the context in which caller invokes the `operator[]`, it is easy to implement them:

```cpp
const String::CharProxy String::operator[](int index) const
{
    // return a const proxy
    // Because CharProxy::operator= isn't a const member function,
    // the returned proxies can't be used as the target of assignment, and this behavior is exactly what we want for const version of operator[]
    return CharProxy(const_cast<String&>(*this), index);
}

String::CharProxy String::operator[](int index)
{
    return CharProxy(*this, index);
}
```
```cpp
String::CharProxy::CharProxy(String& str, int index)
: theString(str), charIndex(index) {}

String::CharProxy::operator char() const
{
    return theString.value->data[charIndex];
}

String::CharProxy& String::CharProxy::operator=(const CharProxy& rhs)
{
    if (theString.value->isShared())
    {
        theString.value = new StringValue(theString.value->data);
    }
    theString.value->data[charIndex] = 
        rhs.theString.value->data[charIndex];
    return *this;
}

String::CharProxy& String::CharProxy::operator=(char c)
{
    if (theString.value->isShared())
    {
        theString.value = new StringValue(theString.value->data);
    }
    theString.value->data[charIndex] = c;
    return *this;
}
```

# Preventing implicit conversions in single-argument constructor

Refer to MECpp item 5.

# Limitations

1. Taking the address
    
    In general, taking the address of a proxy yields a different type of pointer than does taking the address of a real object. Thus, the statement `char *p = &s1[1];` will cause error. To eliminate the problem, we'll have to overload the address-of operators for `CharProxy` class:

    ```cpp
    class String {
    public:
        ...
        class CharProxy {
            char * operator&();
            const char * operator&() const;
            ...
        };
        ...
    };
    ```
    ```cpp
    const char * String::CharProxy::operator&()
    {
        return &(theString.value->data[charIndex]);
    }
    char * String::CharProxy::operator&()
    {
        if (theString.value->isShared())
        {
            theString.value = new StringValue(theString.value->data);
        }
        theString.value->markUnshareable(); 
        return &(theString.value->data[charIndex]);
    }
    ```
2. Integrating with templates

    If we have a template for reference-counted arrays that use proxy classes to distringuish lvalue and rvalue invocations of operator[]:

    ```cpp
    template<class T>
    class Array {
    public:
        class Proxy {
        public:
            Proxy(Array<T>& array, int index);
            Proxy& operator=(const T& rhs);
            operator T() const;
            ...
        };
        const Proxy operator[](int index) const;
        Proxy operator[](int index);
        ...
    };
    ```
    Then for `Array<int> intArray;`, we can't make statement such as `intArray[5] += 5;` or `++intArray[5];`, since `operator+=` and `operator++` is not defined for proxy objects. To solve this problem, we have to define each of these functions for the `Array<T>::Proxy`, which, unfortunately, is a lot of work.

    Similarly, we can't invoke member functions on real objects through  proxies. For an array taking `Rational` as elements (`Array<Rational> array;`), there is no way to invoke `Rational`'s member function like this:

    ```cpp
    cout << array[4].numerator();  // error!
    int denom = array[22].denominator();  // error!
    ```
    The solution is similar: we need to overload these functions so that they also apply to proxies.

3. Passed to functions taking references to non-const objects

    ```cpp
    void swap(char& a, char& b);
    String s = "+C+";
    swap(s[0], s[1]);  // won't compile
    ```

    A `CharProxy` may be implicitly converted into a `char`, but there is no conversion function to a `char&`. Further more, the `char` to which it may be converted can't be bound to swap's `char&` parameters, because that `char` is a temporary object (`operator char` returns by value,) and, as MECpp item 19 explains, temporary objects are refused to be bound to non-const reference parameters.

4. Implicit type conversions

    The process where a proxy object implicitly converted into the real object it stands for, a user-defined conversion function is invoked. As MECpp item 5 explains, only one user-defined conversion function is used by compiler when implicitly converting a parameter at a call site into the type needed by the corresponding function parameter.
