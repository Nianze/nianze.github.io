---
title: Task schedule - greedy algorithm
date: 2016-11-14
categories:
- article
- coding
tags:
- algorithm
- greedy
slug: task schedule
thumbnailImagePosition: right
thumbnailImage: /images/2016-11-14.jpg
---

Use greedy algorigthm to solve task scheduleing problem.
<!--more-->

### Starter

Given tasks with cooldown time between the same task. Calculate the minimum total time to finish all the tasks. The order of tasks cannot be changed.
e.g.:
    Given tasks：[12323], and cooldown time is 3
    Return: 7, since length of [1 2 3 _ _ 2 3] is 7

Method: Use hashmap to store the most recent same tasks's time

```java
public static int min_time(int[] tasks, int interval){
    if(tasks == null || tasks.length == 0){
        return 0;
    }
    Map<Integer, Integer> map = new HashMap<Integer, Integer>();
    int time = 0;
    for(int task : tasks){
        Integer task_last_time = map.get(task);
        if(task_last_time != null && task_last_time + interval + 1 > time){
            time = task_last_time + interval + 1;
        }
        map.put(task, time);
        time++;
    }
    return time;
}
    // Improve: space complexity a little to no more than  O(n)
    // use LinkedHashMap to remove the elder task that exceeds the cooldown time
    Map<K,V> map = new LinkedHashMap<K,V>(int cooldown, 1.0f) {  // load factor 1.0
        @Override
        protected boolean removeEldestEntry(Map.Entry<K,V> eldest) {
            return size() > cooldown;
        }
    };

```

### Follow up: What if the order is OK to change?

Method: Greedy algorithm - always look for the task with highest remaining time at each time.

There are two version of implementation:

1. Use priorityQueue to sort the tasks with highest remaining times, time: O(nlog(n)), where n is the total number of tasks, space: O(n)
2. Use two array to store the remaining times and available time for each task, and each time scan these two arraies to find the appropriate task time: O(klog(n)), where k is the number of task kinds, space: O(n)

Using method One：

```java
    public int schedule(int[] tasks, int cooldown) {
        HashMap<Integer, Integer> freqMap = new HashMap<>();
        for (int t : tasks) {
            freqMap.put(t, freqMap.getOrDefault(t, 0) + 1);
        }
        Queue<Map.Entry<Integer, Integer>> maxHeap =
            new PriorityQueue<>(freqMap.size(), new Comparator<Map.Entry<Integer, Integer>>() {
                    @Override
                    public int compare(Map.Entry<Integer, Integer> e1, Map.Entry<Integer, Integer> e2) {
                        return e2.getValue() - e1.getValue();
                    }
                });
        Deque<Map.Entry<Integer, Integer>> waitQueue = new ArrayDeque<>();
        HashMap<Integer, Integer> timeMap = new HashMap<>();
        int time = 0;
        maxHeap.addAll(freqMap.entrySet());        
        while (!maxHeap.isEmpty() || !waitQueue.isEmpty()) {
            if (!maxHeap.isEmpty()) {
                Map.Entry<Integer, Integer> cur = maxHeap.poll();
                time++;
                timeMap.put(cur.getKey(), time);
                cur.setValue(cur.getValue() - 1);
                waitQueue.offer(cur);
                if (waitQueue.size() < cooldown + 1) continue;
                Map.Entry<Integer, Integer> front = waitQueue.poll();
                if (front.getValue() > 0) maxHeap.offer(front);
            } else {
                Map.Entry<Integer, Integer> front = waitQueue.poll();
                if (front.getValue() > 0) {
                    maxHeap.offer(front);
                    time = timeMap.get(front.getKey()) + cooldown;
                }
            }
        }
        return time;
    }        
```


Similar question: LC358 Rearrange String k Distance Apart

Method one: 

```java
    public String rearrangeString(String str, int k) {
        HashMap<Character, Integer> map = new HashMap<>();
        for (char c : str.toCharArray()) {
            map.put(c, map.getOrDefault(c, 0) + 1);
        }
        Queue<Map.Entry<Character, Integer>> maxHeap =
            new PriorityQueue<>(map.size(), new Comparator<Map.Entry<Character, Integer>>() {
                    @Override
                    public int compare(Map.Entry<Character, Integer> e1, Map.Entry<Character, Integer> e2) {
                        return e2.getValue() - e1.getValue();
                    }
                });
        Deque<Map.Entry<Character, Integer>> waitQueue = new ArrayDeque<>();
        maxHeap.addAll(map.entrySet());
        StringBuilder sb = new StringBuilder();
        while (!maxHeap.isEmpty()) {
            Map.Entry<Character, Integer> cur = maxHeap.poll();
            sb.append(cur.getKey());
            cur.setValue(cur.getValue()-1);
            waitQueue.offer(cur);
            if (waitQueue.size() < k) continue;
            Map.Entry<Character, Integer> front = waitQueue.poll();
            if (front.getValue() > 0) maxHeap.offer(front);
        }
        return sb.length() == str.length() ? sb.toString() : "";
    }
```

Method two: 

```java
    public String rearrangeString(String str, int k) {
        int[] count = new int[26];
        int[] valid = new int[26];
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < str.length(); i++) {
            count[str.charAt(i) - 'a']++;
        }
        for (int i = 0; i < str.length(); i++) {
            int c = findNext(count, valid, i);
            if (c == -1) return "";
            sb.append((char)('a'+c));
            count[c] -= 1;
            valid[c] = i + k;
        }
        return sb.toString();
    }
    private int findNext(int[] count, int[] valid, int index) {
        int pos = -1, max = -1;
        for (int i = 0; i < 26; i++) {
            if (count[i] > 0 && count[i] > max && index >= valid[i]) {
                pos = i;
                max = count[i];
            }
        }
        return pos;
    }
```