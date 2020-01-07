---
title: "[EMCpp]Item-34 Prefer Lambdas to std::bind"
date: 2018-08-24T20:07:38-04:00
series:
- effective c++
categories:
- coding
tags:
- technique
- cpp
slug: Prefer Lambdas to std::bind
autoThumbnailImage: true
thumbnailImagePosition: right
featured_image: 2018/2018-08/24.gif
---

Lambdas are more readable, more expressive, and may be more efficient than using `std::bind`.
<!--more-->
<!-- toc -->

# More readable 

Suppose we want a function to set up an audible alarm that will go off an hour after it's set and that will stay on for 30 seconds, with the alarm sound remaining undecided.

```cpp
using Time = std::chrono::steady_clock::time_point;
enum class Sount {Beep, Siren, Whistle};
using Duration = std::chrono::steady_clock::duration;
void setAlarm(Time t, Sound s, Duration d); // at time t, make sound s for duration d
```

In C++14, it is very easy to write a lambda version, which is also straight-forward to read:

```cpp
auto setSoundL = [](Sound s)
                 {
                     using namespace std::chrono;
                     using namespace std::literals;
                     setAlarm(steady_clock::now() + 1h,  // alarm to go off
                              s,                         // in an hour for
                              30s);                      // 30 seconds
                 }
```

If we decide to use `std::bind`, it looks like this:

```cpp
auto setSoundB = 
    std::bind(setAlarm,
              std::bind(std::plus<>(),
                        std::bind(steady_clock::now),
                        1h),
              _1,
              30s);
```

Here, we used two extra `bind` inside the outer `bind` instead of passing `now() + 1h` directly as an argument of `std::bind`, because we want to defer evaluation of the timestamp expression until when `setAlarm` is called, rather than when `std::bind` is called. In C++11, however, the template type argument for the standard operator tempaltes can not be omitted, so the C++11 `std::bind` equivalent look like this shxt:

```cpp
struct genericAdder {  
    template<typename T1, typename T2>  
    auto operator()(T1&& param1, T2&& param2)    
        -> decltype(std::forward<T1>(param1) + std::forward<T2>(param2))  
    {    
        return std::forward<T1>(param1) + std::forward<T2>(param2);  
    }
};
auto setSoundB = 
    std::bind(setAlarm,
              std::bind(genericAdder(),
                        std::bind(steady_clock::now),
                        hours(1)),  // std::literals is in C++14
              _1,
              seconds(30));
```

Moreover, if we have another overloaded function for `setAlarm`, which takes a new parameter specifying the alarm volume:

```cpp
enum class Volum {Normal, Loud, VeryLoud};
void setAlarm(Time t, Sound s, Duration d, Volume v);
```

The lambda above continues to work, because overload resolution chooses the three-argument version of `setAlarm`. 

However, the `std::bind` version fails to compile now, because compilers have no way to determine which of the two `setAlarm` functions they should pass to `std::bind` - by the function name alone it is ambiguous.

To specify the exactly which one we want, we need to cast `setAlarm` to the proper function pointer type:

```cpp
using SetAlarm3ParamType = void(*)(Time t, Sound s, Duration d);
auto setSoundB = 
    std::bind(static_cast<SetAlarm3ParamType>(setAlarm),
              std::bind(std::plus<>(),
                        std::bind(steady_clock::now()),
                        1h),
              _1,
              30s);
```

# More efficient

The cast above introduces another side effect: 

* `std::bind` passes a function pointer to `setAlarm`, which means inside the function call operator for `setSoundB` (i.e., the function call operator `()` for the bind object), the call to `setAlarm` takes place through a function pointer, which generally can't be fully inlined
* inside the function call operator for `setSoundL` (i.e., the function call operator of the lambda's closure class), the call to `setAlarm` is a normal function invocation, which can be inlined by compilers

This means using lambdas might generate faster code than using `std::bind`.

# More expressive

```cpp
auto betweenL = 
    [lowVal, highVal]
    (const auto& val)
    { return lowVal <= val && val <= highVal; };

using namespace std::placeholders;
auto betweenB = 
    std::bind(std::logical_and<>(),
              std::bind(std::less_equal<>(), lowVal, _1),
              std::bind(std::less_equal<>(), _1, highVal));
```

Moreover, the placeholders (e.g., `_1`, `_2`, etc.) are opaque in that it doesn't specify how parameters are passed and stored in the bind object, by value or by reference. We have to memorize that it's stored by value. Lambda, however, specifies capture mode very clearly.

# Edge cases

In C++14, there's no reasonable use case for `std::bind`. In C++11, two constrained situations my be useful:

1. Move capture, as item 32 explains.
2. Polymorphic function objects: this takes use of bind object's perfect forwarding ability

    ```cpp
    class PolyWidget {
    public:
        template<typename T>
        void operator()(const T& param) const;
        ...
    };
    PolyWidget pw;
    auto boundPW = std::bind(pw, _1);
    boundPW(1942);  // pass int to PolyWidget::operator()
    boundPW(nullptr);  // pass nullptr to PolyWidget::operator()
    boundPW("RoseGun");  // pass string literal to PolyWidget::operator()
    ```

    In C++14, simply do this combining lambda with `auto`:

    ```cpp
    auto boundPW = [pw](const auto& param) { pw(param); };
    ```
