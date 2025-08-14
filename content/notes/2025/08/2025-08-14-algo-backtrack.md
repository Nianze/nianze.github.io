---
title: "Algo Review: backtracking"
date: 2025-08-14T10:56:05-04:00
series:
- algorithm
categories:
- coding
tags:
- algorithm
- backtracking
slug: "2025 08 14 Algo Review backtracking"
featured_image: 2025/08/14/combination-dupable-no-multi-sel.jpg
---

A review on backtracking algorithm.
<!--more-->

# Base template

Find follwing 3 elements in the tree model:

1. what is the track (edges from root down to the leaf)
2. what is the possible options (possible children in each node, optimizing on cutting unwanted edges in advance)
3. what is the ending criteria (how to tell the leaf is reached during tracking)

```python
res = []
track = []
def backtrack(options):
    if track.meet_requirement():
        res.append(track)
        return
    for opt in options:
        track.add(opt) # options.remove(opt)
        backtrack(options)
        track.remove(opt) # options.add(opt)
```

# Alternatives

## No duplicated elements, no duplicated selection

{{< img src="/images/2025/08/14/combinatation_no_dup.jpg">}}

```python
# combination/subset
def backtrack(nums: List[int], start: int):
    for i in range(start, len(nums)):
        # select
        track.append(nums[i])
        # next layer in tree
        backtrack(nums, i + 1)
        # restore
        track.pop()

# permutation
def backtrack(nums: List[int]):
    for i in range(len(nums)):
        # cutting edge
        if used[i]:
            continue
        # select
        used[i] = True
        track.append(nums[i])
        # next layer
        backtrack(nums)
        # restore
        track.pop()
        used[i] = False
```

## Duplicable elements, no duplicated selection

{{< img src="/images/2025/08/14/combination-dupable-no-multi-sel.jpg">}}

```python
nums.sort()

# combination/subset
def backtrack(nums: List[int], start: int):
    for i in range(start, len(nums)):
        # cutting edge
        if i > start and nums[i] == nums[i-1]:
            continue
        # select
        track.append(nums[i])
        # next layer in tree
        backtrack(nums, i + 1)
        # restore
        track.pop()

# permutation
def backtrack(nums: List[int]):
    for i in range(len(nums)):
        # cutting edge
        if used[i]:
            continue
        if i > 0 and nums[i] == nums[i-1] and not used[i-1]:
            continue
        # select
        used[i] = True
        track.append(nums[i])
        # next layer
        backtrack(nums)
        # restore
        track.pop()
        used[i] = False
```

## No duplicated elements, duplicable selection

{{< img src="/images/2025/08/14/combination_duplicatble_selection.jpg">}}

```python
# combination/subset
def backtrack(nums: List[int], start: int):
    for i in range(start, len(nums)):
        # select
        track.append(nums[i])
        # next layer in tree
        backtrack(nums, i)
        # restore
        track.pop()

# permutation
def backtrack(nums: List[int]):
    for i in range(len(nums)):
        # select
        track.append(nums[i])
        # next layer
        backtrack(nums)
        # restore
        track.pop()
```