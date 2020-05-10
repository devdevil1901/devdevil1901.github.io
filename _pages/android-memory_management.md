---
title: "Memory Management"
permalink: /kdb/android/memory_management/
toc_sticky: true
toc_ads : true
layout: single
---

<pre> 자 이제 practical 한 부분 정말 시작이다. gc 등의 메모리 관련 로직 완벽히 분석해서,  qemu등에서 테스트 하고 .. 확인하도록 하자.!!! 오키....   </pre>

# MemoryMap

# GC(Garbage Collection)
ART는 AndroidO에서 부터 새로운 병렬 gabage collector를 선보였다.    
ART나 Dalvik에서 Heap 메모리를 회수하는 메커니즘.     
Android에서는 Heap을 세가지 세대로 분류한다.     
1. Young Generation
2. Older Generation
3. Permanent Generation

할당 되자 마자는 Young이고 시간이 지나면 세대가 변하는 식이다.     
각 세대는 각각 메모리양에 제한이 있다.     

## 1. GC Timing

```
art/runtime/gc/gc_cause.h

```
특정 세대가 채워지기 시작할 때,     

 


