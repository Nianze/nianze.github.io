---
title: Binary search basic
date: 2016-08-05
categories:
- article
- coding
tags:
- algorithm
- binary search
- java
slug: binary search
thumbnailImagePosition: right
thumbnailImage: /images/2016-08-05.jpg
---

What should be noted when doing binary search.
<!--more-->

### BS search - search for first or last target's position
**Key points**

1. `start + 1 < end` -> avoid never-end loop 
2. `start + (end - start) / 2` -> avoid stack overflow 
3. `nums[mid]` judgement depends on the purpose: 
    1. `start = mid;` for case of "return last position"
    2. `end = mid;`  for case of "return first position"
    3. `return mid;` for case of "return any position"
4. After the while loop, start + 1 = end, there may are 5 possible scenarios: 
    1. `target < nums[start]`, now start == 0
    2. `target == nums[start]`
    3. `nums[start] < target < nums[end]`
    4. `target == A[end]
    5. `nums[end] < target`, now end = nums.length - 1;

### Binary search template:

```java	
public class Solution {
    /**
     * @return first occurrence position of the target
     */
    int findPosition(int[] nums, int target) {
        if (nums == null || nums.length == 0) {
            return -1;
        }	
        int start = 0, end = nums.length - 1;
        while (start + 1 < end) {
            int mid = start + (end - start) / 2;
            if (nums[mid] == target) {
                end = mid; // for case of "return first position"
                //start = mid; for case of "return last position"
                //return mid; for case of "return any position"
            } else if (nums[mid] < target) {
                start = mid;
            } else if (nums[mid] > target) {
                end = mid;
            }
        }	
        // exchange the position of two [if statement] if want to return last postion
        if (nums[start] == target) {
            return start;
        }
        if (nums[end] == target) {
            return end;
        }
        // target strictly between {A[start-1], A[start]}
        // or strictly between {A[start], A[end]}
        // or strictly between {A[end, A[end+1]}
        return -1;
    }
}
```

* **Note 1:** It's a good habit to always to include trivial test case at first line:

```java
if (nums == null || nums.length == 0) { 
	return -1; 
}
```

* **Note 2:** Remember to consider all the corner case at the end:

```java
if (target <= start) { return ??; }
if (target <= end) { return ??; }
return ???; // corner case!
```