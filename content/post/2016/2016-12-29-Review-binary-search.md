---
title: Binary search review
date: 2016-12-29
categories:
- technology
- coding
tags:
- algorithm
- binary search
- java
slug: binary search review
thumbnailImagePosition: right
thumbnailImage: /images/2016/2016-12-29.jpg
---

Detailed review on binary search.
<!--more-->

This post is based on an article on binary search from [Topcoder](http://www.topcoder.com/community/data-science/data-science-tutorials/binary-search/).

### Classic: Finding a value in a sorted sequence

Consider the following sequence of integers sorted in ascending order and say we are looking for the number 55:

| 0 | 5 | 13 | 19 | 22 | 41 | 55 | 68 | 72 | 81 | 98 |

-->

| 55 | 68 | 72 | 81 | 98 |

-->

| 55 | 68 |

Depending on how we choose the median of an even number of elements we will either find 55 in the next step or chop off 68 to get a search space of only one element. Either way, we conclude that the index where the target value is located is 7.

```python
binary_search(A, target):
   lo = 1, hi = size(A)
   while lo <= hi:
      mid = lo + (hi-lo)/2
      if A[mid] == target:
         return mid            
      else if A[mid] < target: 
         lo = mid+1
      else:
         hi = mid-1
            
   // target was not found

```

### Taking it further: the main theorem

Consider a predicate p defined over some ordered set S (the search space). The search space consists of candidate solutions to the problem. We use the predicate to verify if a candidate solution is legal (does not violate some constraint) according to the definition of the problem.

> "Main theorem": **binary search can be used if and only if for all x in S, p(x) implies p(y) for all y > x**

We can use binary search to find the smallest legal solution (i.e. the smallest x for which p(x) is true) by following two steps:

1. Designing a predicate. Note that we need to choose what the algorithm should find - either the first x for which p(x) is true or the last x for which p(x) is false.
2. Proving that binary search can be applied to the predicate. This is where we use the main theorem, verifying that the conditions laid out in the theorem are satisfied.

These two parts are most often interleaved: when we think a problem can be solved by binary search, we aim to design the predicate so that it satisfies the condition in the main theorem.

### Implementation

Given an array A (following array) and a target value (say 55), return the index of the first element in A equal to or greater than the target value.

Sample sequence:

| 0 | 5 | 13 | 19 | 22 | 41 | 55 | 68 | 72 | 81 | 98 |

Solution:

Predicate p(A[x]): "Is A[x] greater than or equal to the target value?".

Search space **S** (indices):

| 1 | 2 | 3  | 4  | 5  | 6  | 7  | 8  | 9  | 10 | 11 |

Apply the predicate (with a target value of 55) to array A:

| no | no | no | no | no | no | yes | yes | yes | yes | yes |

Implementing the discrete algorithm:

```python
binary_search(lo, hi, p):
   while lo < hi:
      mid = lo + (hi-lo)/2
      if p(mid) == true:
         hi = mid
      else:
         lo = mid+1
          
   if p(lo) == false:
      complain                // p(x) is false for all x in S!
      
   return lo         // lo is the least x for which p(x) is true

```

Two crucial lines:

1. hi = mid :
    When p(mid) is true, we can discard the second half of the search space, since the predicate is true for all elements in it (by the main theorem). However, we can not discard mid itself, since it may well be the first element for which p is true. This is why moving the upper bound to mid is as aggressive as we can do without introducing bugs.
2. lo = mid+1
    If p(mid) is false, we can discard the first half of the search space, but this time including mid. p(mid) is false so we don’t need it in our search space. This effectively means we can move the lower bound to mid+1.

If we wanted to find the last x for which p(x) is false:

```python
binary_search(lo, hi, p):
   while lo < hi:
      mid = lo + (hi-lo+1)/2    // note: rounds up instead of down
      if p(mid) == true:
         hi = mid-1
      else:
         lo = mid
          
   if p(lo) == true:
      complain                // p(x) is true for all x in S!
      
   return lo         // lo is the greatest x for which p(x) is false
```

Explanation:
If we use `mid = lo + (hi-lo)/2`, which rounds down, consider what happens when running this code on some search space for which the predicate gives:

| no | yes |

The code will get stuck in a loop. It will always select the first element as mid, but then will not move the lower bound because it wants to keep the no in its search space. So `mid` needs to round up instead of down.

Note: 

* Why using mid = lo + (hi-lo)/2 instead of the usual mid = (lo+hi)/2?
    1. To avoid another potential rounding bug: in the first case, we want the division to always round down, towards the lower bound. But division truncates, so when lo+hi would be negative, it would start rounding towards the higher bound. Coding the calculation this way ensures that the number divided is always positive and hence always rounds as we want it to. 
    2. To avoid integer overflow.

* Just remember to always test the code on a two-element set where the predicate is false for the first element and true for the second.

### Example: [_FairWorkload_](http://community.topcoder.com/stat?c=problem_statement&pm=1901&rd=4650)

In the problem, a number of workers need to examine a number of filing cabinets. The cabinets are not all of the same size and we are told for each cabinet how many folders it contains. We are asked to find an assignment such that each worker gets a sequential series of cabinets to go through and that it minimizes the maximum amount of folders that a worker would have to look through.

Solution:

1. Imagine that we have an unlimited number of workers. For some number _MAX_, we can calculate the minimum number of workers needed so that each worker has to examine no more than _MAX_ folders (if this is possible) by greedy algorithm: 
    We assign first worker to the cabinet 1. Since the cabinets must be assigned in sequential order (a worker cannot examine cabinets 1 and 3 without examining 2 as well), it’s always optimal to assign him to the second cabinet as well, if this does not take him over the limit we introduced (_MAX_). If it would take him over the limit, we conclude that his work is done and assign a new worker to the second cabinet. We proceed in a similar manner until all the cabinets have been assigned and assert that we’ve used the minimum number of workers possible, with the artificial limit (_MAX_) we introduced. Note here that the number of workers is inversely proportional to MAX: the higher we set our limit, the fewer workers we will need.

2. What we want is the smallest _MAX_ such that the number of workers required is less than or equal to the number of workers available. So the predicate is:
 
    **Can the workload be spread so that each worker has to examine no more than x folders, with the limited number of workers available?**

3. The code:

```cpp
int getMostWork( vector  folders, int workers ) {
   int n = folders.size();
   int lo = *max_element( folders.begin(), folders.end() );
   int hi = accumulate( folders.begin(), folders.end(), 0 );

   while ( lo < hi ) {
      int x = lo + (hi-lo)/2;

      int required = 1, current_load = 0;
      for ( int i=0; i<n; ++i ) {
         if ( current_load + folders[i] <= x ) {
            // the current worker can handle it
            current_load += folders[i];
         }
         else {
            // assign next worker
            ++required;
            current_load = folders[i];               
         }
      }

      if ( required <= workers )
         hi = x;
      else
         lo = x+1;
   }

   return lo;
}
```

To verify that the solution doesn’t lock up, we can use a small no/yes example with folders={1,1} and workers=1.

The overall complexity of the solution is O(n log SIZE), where SIZE is the size of the search space. This is very fast.

In this example, we used a greedy algorithm to evaluate the predicate. In other problems, evaluating the predicate can come down to anything from a simple math expression to finding a maximum cardinality matching in a bipartite graph.

### Conclusion

* Design a predicate which can be efficiently evaluated and so that binary search can be applied
* Decide on what you’re looking for and code so that the search space always contains that (if it exists)
* If the search space consists only of integers, test your algorithm on a two-element set to be sure it doesn’t lock up
* Verify that the lower and upper bounds are not overly constrained: it’s usually better to relax them as long as it doesn’t break the predicate. An all-around template looks like this according to my previous [post](https:nianze.tk/2016/08/binary-search) on binary search:

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
