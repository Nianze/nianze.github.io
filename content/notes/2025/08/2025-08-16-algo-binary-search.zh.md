---
title: "Algo Review: Binary Search"
date: 2025-08-16T02:45:44-04:00
series:
- algorithm
categories:
- coding
tags:
- algorithm
- binary-search
slug: "Algo Review binary search"
featured_image: 2025/08/16/bs.jpg
---

A review on binary search algorithm.
<!--more-->

# Mindset model

In binary search, key points:

- if `right` is defined as `len(nums) - 1`, then
    - search space is between `[left, right]`
    - termination condition: while (left `<=` right)
    - in each shrinking iteration: `left = mid + 1` and `right = mid - 1`
    - final state: `left == right + 1` 
- if `right` is defined as `len(nums)`, then
    - search space is between `[left, right)`
    - termination condition: while (left `<` right)
    - in each shrinking iteration: `left = mid + 1` but `right = mid`
    - final state: `left == right`
- for left bound searching, `right = mid (-1)` if f(mid) == target, return `left` (this will be immediate ceiling item if target is not in f(x))
- for right bound searching, `left = mid + 1` if f(mid) == target, return `left - 1` (this will be immediate floor item if target is not in f(x))

```python
# monotone function
def f(x: int) -> int:
    pass

# binary search to get target
def binary_search(nums: List[int], target: int) -> int:
    if len(nums) == 0:
        return -1
    left = ... # min of x
    right = ... + 1 # max of x

    while left < right:
        mid = left + (right - left) // 2
        if f(mid) == target:
            # left bound or right bound
        elif f(mid) < target:
            # how to make f(x) larger
        elif f(mid) > target:
            # how to make f(x) smaller
    return left # or left - 1
```