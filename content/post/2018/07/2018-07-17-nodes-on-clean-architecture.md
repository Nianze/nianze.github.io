---
title: "Nodes on Clean Architecture"
date: 2018-07-17T19:45:47-04:00
categories:
- technology
- coding
tags:
- technique
slug: Nodes on Clean Architecture
autoThumbnailImage: true
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-07/17.jpg
coverImage: /images/2018/2018-07/17.jpg
metaAlignment: center
---

A brief notes on Clean Architecture
<!--more-->

## Chapter 1 What is design and architecture

* The Goal: 

> The goal of software architecture is to minimize the human resources required to build and maintain the required system.

* Low-level details andd the high-level structure are all part of the same whole, forming a continuous fabric that defines the shape of the system. There is simply a continuum of decisions from the highest to the lowest levels.

## Chapter 2 A Tale of Two Values

* Eisenhower matrix:

|  | Urgent | Not urgent |
|:---:|:---:|:---:|
| **Important**  | Important/Urgent | Important/Not urgent |
| **Unimportant** | Unimportant/Urgent | Unimportant/Not urgent |

In terms of priorities:

1. Urgent and important
2. Not urgenet and important
3. Urgent and not important
4. Not urgent and not ipmortant

The common mistake we make: elevate items in position 3 to position 1 - fail to separate those that are urgent but not important from those that truly are urgent and important (i.e, ignoring the important architecture of the system in favor of the unimportant features of the system).

It is the responsibility of the software development team to assert the importance of architecture over the urgency of features.

## Chapter 3 Paradigm Overview

1. Structured Programming: remove `goto` - imposing discipline on direct transfer of control
2. Object-oriented Programming: polymorphism through the disciplines use of function pointer - imposing discipline on indirect transfer of control
3. Functional Programming: remove assignment statement (immutability) - imposing discipline upon assignment

**Conclusion**: We use polymorphism as the mechanism to cross architectural boundaries; we use functional programming to impose discipline on the location of and access to data; and we use structured programming as the algorithmic foundation of our modules.

## Chapter 4 Sturctured Programming

>It is this ability to create falsifiable units of programming that makes structured programming valuable. 

* Mathematics is the discipline of proving provable statements true; 
* Science is the discipline of proving provable statements false

Software is like a science - we show correctness by failing to prove incorrectness, despite our best efforts. Specifically, we prove incorrectness by tests. Note that:

* such proofs of incorrectness can be applied only to _provable_ programs. A program that is not provable (due to unrestrained use of `goto`) cannot be deemed correct no matter how many tests are applied to it.
* structures programming forces us to recursively decompose a program into a set of small provable functions. We can then use tests to try to prove those small provable functions incorrect.

Therefore, all that tests do, after sufficient testing effort, is allow us to deem a program to be correct enough for our purposes.

From the smallest function to the largest component, sofwware is driven by falsifiability. Under such a perspective, software architects strive to define modules, components, and services that are easily fasifiable (testable).
