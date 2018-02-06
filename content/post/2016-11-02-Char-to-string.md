---
title: Convert Char to String in Java
date: 2016-11-02
categories:
- article
- coding
tags:
- algorithm
- java
slug: char to string
thumbnailImagePosition: right
thumbnailImage: /images/2016-11-02.jpg
---

Convert Char to String.
<!--more-->

1. Use `String.valueOf(char)`
2. Use `Character.toString(char)`
    * Note: this method simply returns a call to `String.valueOf(char)`
3. Use string concatenation `String s  = "" + 'c'`
    * Note: this compiles down to 
    ```java
    String s = new StringBuilder().append("").append('c').toString();
    ```
    * which is less efficient because `StringBuilder` is backed by `char[]` (over-allocated by StringBuilder() to 16) and this array will be copied to the resulting `String`. On the other hand, `String.valueOf(char)` wraps the `char` in a single-element array and passes it to the package private constructor `String(char[], boolean)`, which avoids the array copy.[^1]

[^1]: <http://stackoverflow.com/questions/8172420/how-to-convert-a-char-to-a-string-in-java>