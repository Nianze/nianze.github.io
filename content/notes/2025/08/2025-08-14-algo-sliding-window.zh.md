---
title: "Algo Review: sliding window"
date: 2025-08-14T22:11:00
series:
- algorithm
categories:
- coding
tags:
- algorithm
- two-pointers
- sliding-window
slug: "2025 08 14 Algo Review sliding window"
featured_image: 2025/08/14/sliding-window.png
---

A review on basic operation of sliding window.
<!--more-->

# Base template

{{< img src="/images/2025/08/14/lsliding-window.png">}}

```python
def sliding_window(s: str):
    window = ... # int/map/etc.

    left, right = 0, 0
    while right < len(s):
        # enlarge window
        window.add(s[right])
        right += 1

        while left. < right and window.need_shrink():
            window.remove(s[left])
            left += 1
            # update result
```
