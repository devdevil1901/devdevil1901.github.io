---
title: "Memory Management"
permalink: /kdb/android/memory_management/
toc_sticky: true
toc_ads : true
layout: single
---

<pre> 자 이제 practical 한 부분 정말 시작이다. gc 등의 메모리 관련 로직 완벽히 분석해서,  qemu등에서 테스트 하고 .. 확인하도록 하자.!!! 오키....   </pre>

ART와 Dalvik에서는 paging 및 memory map을 사용하여 메모리를 관리한다.     
object를 할당 하거나, mmap으로 로드한 메모리 어떤 것이든 RAM에 상주하며 paged out(aka swapsapce)되지 않는다.     

# Shared Memory
linux에서 fork시에 copy-on-write를 사용하고 있다.     
Android에서 App의 실행은 Zygote process에서 fork되는 것이기 때문에,     
framework의 code 및 resource 대 부분이 모든 App에서 공유되게 된다.    

또 많은 곳에서 Android에서 명시적으로 할당 된 공유메모리 영역인 ashmem과 gralloc을 사용해서 DRAM을 공유한다.     
windows surfaces는 app과 screen compositor 사이에서 memory를 공유하고, cursor buffer는 content provider 사이에 memory르 공유한다.         


# GC(Garbage Collection)
ART의 GC도 JVM에서와 동일했다.    
그렇지만, AndroidO에서 부터 새로운 병렬 gabage collector를 선보였다.    

## Generation
ART나 Dalvik에서 Heap 메모리를 회수하는 메커니즘.     
JVM과 거의 동일하다.      
Android에서는 Heap을 세가지 세대로 분류한다.     
1. Young Generation
2. Older Generation
3. Permanent Generation

Young Generation에서는 eden, S0, S1 세개의 container를 가지고 있다.     

할당 되자 마자는 Young이고 시간이 지나면 세대가 변하는 식이다.     
Java Script의 v8 엔진도 2 generation으로 나누어 gc를 한다.    
각 세대는 각각 메모리양에 제한이 있다.     

## GC Root and Root set
여기서 root set이라는 것은 다음을 나타낸다.     

      GC Root     
	|     
------------------------------------------ GC Root set    
       |      
     Object1    
    |       |     
Object2   Object3    Object4     
                       |     
                     Object5      

여기서 object1,2,3은 살아남게 되고, 4,5는 GC된다.      
이것이 Reachability Analysis Algorithm의 기본개념이다.         

|type|example|description|
|---|---|---|
|method에서 로컬 변수로 생성한 object|public void function() {<br/>Object gcroot = new Object();<br/>}|gcroot 변수가 gc root가 된다.|
|class에서 static member인 object|public class TestClass {<br/>public static WhatEver gcroot;<br/>}<br/><br/>public void function() {<br/>Object localGcRoot = new Object();<br/>localGcRoot.gcroot = new WhatEver(); }|static member인 gcroot도 gc root가 된다.<br/>localGcRoot가 null이 되도. gcroot는 여전히 gcRoot이다.|
|class에서 static final member인 object|public class TestClass {<br/>public static final WhatEver gcroot = new WhatEver();<br/>}<br/><br/>public void function() {<br/>Object localGcRoot = new Object();<br/> }|static final member인 gcroot도 gc root가 된다.|
|JNI가 참조하는 object(native method에서 local variable로 참조된 object)|||

1번의 경우 다음과 같은 상황이다.     
```
public
```


## Mark and Sweep 방법
gc를 하는 algorithm의 하나이다.    
1. mark stage에서는 tree를 탐색한다.    
각 object를 사용중으로 표시한다.    
2. sweep stage에서는 전체 memory를 scan해서, 

순진한 표시와 스위프 방식에서 기억 속의 각 개체는 쓰레기 수집용으로만 예약된 깃발(일반적으로 하나의 비트)을 가지고 있다. 이 플래그는 수집 주기 동안을 제외하고 항상 지워진다.     
첫 번째 단계는 전체 rootset tree 검색을 하고,   하고 루트가 가리키는 각 개체를 '사용 중'으로 표시하는 마크 스테이지다.      

그 개체가 가리키는 모든 개체도 표시되므로 루트 집합을 통해 도달할 수 있는 모든 개체가 표시된다.    
두 번째 단계인 스위프 단계에서는 모든 메모리를 처음부터 끝까지 스캔하여 무료 또는 사용된 모든 블록을 검사한다.       
'사용 중'으로 표시되지 않은 블록은 어떤 루트에서도 접근할 수 없고, 메모리는 자유롭다.  
사용 중으로 표시된 물체의 경우 사용 중 플래그가 지워져 다음 사이클을 준비한다.     
이 방법은 몇 가지 단점이 있는데, 가장 주목할 점은 전체 시스템을 수거하는 동안 중단해야 한다는 것이다.    
작업 세트의 변이는 허용되지 않는다. 이로 인해 프로그램이 주기적으로(그리고 일반적으로 예측 불가능하게)     
'해제'되어 일부 실시간 및 시간에 중요한 애플리케이션이 불가능해질 수 있다.           
또한 전체 작업 메모리를 검사해야 하며, 그 중 상당 부분은 두 번 검사해야 하며, 이는 잠재적으로 페이징 메모리 시스템에 문제를 일으킬 수 있다.     

이 방법 역시 android에서 사용 중이다. 
```
art/runtime/gc/collector/garbage_collector.h
class GarbageCollector
```

```
[art/runtime/gc/collector/mark_sweep.cc]
MarkSweep
[art/runtime/gc/collector/semi_space.cc]
SemiSpace
[art/runtime/gc/collector/consurrent_copying.cc]

```

## Garbage Collector

```
art/runtime/gc/collector/garbage_collector.h
class GarbageCollector
```


## 1. GC Timing
### TO DO 정리 필요
메모리 할당 및 회수     
Heap은 단일 가상 메모리 범위로 제한되며 이것은 logical heap size를 정의하며, 시스템이 정의 한 한계 까지 증가가가능하다.     
힙의 논리적 크기는 힙에서 사용하는 물리적 메모리의 양과 다르다.     
앱의 힙을 검사할 때 안드로이드는 다른 프로세스와 공유되는 더티 페이지와 클린 페이지(예 램을 공유하는 앱 수에 비례하는 양)만 차지하는 Proportional Set Size (PSS)라는 값을 계산합니다.     

이 PSS 총계는 시스템이 실제메모리 풋 프린트로 간주하는 것이다. (음 일단 넘어가자)     

Dalvik의 heap은 defragment(조각 모음)하면서 공간을 닫지 않기 때문에 heap끝에 사용되지 않는 공간이 있는 경우에만 논리 힙 크기를 줄일 수 잇다.     j
그래도 pyysical memory를 감소 시킬 수 있다.     
gc후에 Dalvik은 madvise를 사용하여 해당 page를 kernel로 반환한다.      

따라서 큰 paired 할당과 큰 chunk들의 deallocation은 회수해야만 합니다.     
ActivityManager의 getMemoryClass()를 호출해서, 현재 사용할 수 있는 가용한 heap의 크기를 정확하게 파악할 수 있다.       

https://developer.android.com/reference/android/app/ActivityManager.html#getMemoryClass()     
사용자가 앱간 전환을 할 때, Background에 있는 앱을(뮤직 같은 것도 포함) 앱을 LRU(Least-Recently Used) Cache에 유지한다.      
역시 메모리가 low memory가 되면 LRU에서 앱을 삭제한다. 또 메모리 제일 많이 쓰는 녀석을 먼저 종료할 수 있다.      

```
art/runtime/gc/gc_cause.h

```
특정 세대가 채워지기 시작할 때,     


### Reachability
일반적인 객체 생성은 strong reference라고 불린다.     
```
val AObject = new A
```

다음과 같은 code도 strong reference이다.    
 
```
val value: Integer = 3
```

# Profiling

# TODO. 
## ahat
AOSP를 compile하면 다음과 같은 profiling tool이 생성된다.     
./host/linux-x86/framework/ahat.jar       
source는     
art/tools/ahat     


# References
[GC Alorithm](https://en.wikipedia.org/wiki/Tracing_garbage_collection#Na%C3%AFve_mark-and-sweep)     
