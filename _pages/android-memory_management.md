---
title: "Memory Management"
permalink: /kdb/android/memory/
toc_sticky: true
toc_ads : true
layout: single
---

#Table of content
1. [Outline](#outline)  
2. [Shared Memory](#shared-memory)   
3. [GC(Garbage Collection)](#gcgarbage-collection)   
	1. [Generation](#1-generation)   
	2. [GC Root and Root set](#2-gc-root-and-root-set)   
	3. [Mark and Sweep 방법](#3-mark-and-sweep-%EB%B0%A9%EB%B2%95)   
	4. [Garbage Collector](#4-garbage-collector)   
		1. [GC Timing](#1-gc-timing)   
		2. [Reachability](#2-reachability)   

#Outline
내가 일해본 Android 개발자들은 memory에 대한 제대로 된 이해가 없는 경우가 마찬가지였다.    
앱이 background로 전환시에 GC가 발생한다는 것을 몰라서 큰 문제가 발생한 적도 있었고,  
memory leak이 발생했지만, 제대로 원인을 찾아낼 수 있는 사람들 없었다.    
오직 leak canary등의 툴에만 의지할 뿐이었다.   
(무료 백명 가까운 사람들이 같이 개발하고 있었음에도...)     
작성한 코드가 실제로 memory에 어떻게 배치되는지 전혀 개념이 없는 사람들이 많았다.   
하긴 나도 application 개발만 했었다면 memory를 깊게 이해하려 하지 않았을 것이다.   
memory hacking을 일로 하지 않았었다면 굳이 하지 않았을 가능성이 크다.   

ART와 Dalvik에서는 paging 및 memory map을 사용하여 메모리를 관리한다.     
object를 할당 하거나, mmap으로 로드한 메모리 어떤 것이든 RAM에 상주하며 paged out(aka swapsapce)되지 않는다.     

# Shared Memory
linux에서 fork시에 copy-on-write를 사용하고 있다.     
Android에서 App의 실행은 Zygote process에서 fork되는 것이기 때문에,     
framework의 code 및 resource 대 부분이 모든 App에서 공유되게 된다.    

또 많은 곳에서 Android에서 명시적으로 할당 된 공유메모리 영역인 ashmem과 gralloc을 사용해서 DRAM을 공유한다.     
windows surfaces는 app과 screen compositor 사이에서 memory를 공유하고, cursor buffer는 content provider 사이에 memory르 공유한다.         


# GC(Garbage Collection)
객체의 해제를 System에서 자동으로 처리해주는 Garbage Collection.   
Kernel에서 fragmenation을 최소화 하기 위해서 slub을 사용하는 것과 마찬가지로.   
다양한 효율성 및 파편화 문제를 GC 측에서 떠 맡게 되었다.   
ART의 GC도 JVM에서와 동일했다.    
Android O에서 Concurrent Copying Collector가 도입되었고,  
이것이 default collector가 되었다.   

RegionTLAB은 TLAB(Thread Local Allocation Buffer)를 App의 Thread에 할당 한다.   


ConcurrentCopying::RunPhases()에서 다음의 6 단계로 진행된다.   
1. InitializePhase
2. MarkingPhase
3. FlipThreadRoots
4. CopyingPhase
5. ReclaimPhase
6. FinishPhase

```
[frameworks/base/core/jni/include/android_runtime/AndroidRuntime.h]
[frameworks/base/core/jni/AndroidRuntime.cpp]
class android::AndroidRuntime 
    int startVm(JavaVM** pJavaVM, JNIEnv** pEnv, bool zygote);
```


Image space: boot.oat가 mapping된다.   

## 2. GC Algorithm
### 1. GC Root and Root set
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

여기서 root set과 연관성이 있는 object1,2,3은 Reachable이라서, 살아남게 되고, 4,5는 GC된다.      
즉 GC의 대상은 Unreachable Object인 것이다.   
결국 GC으 기준이 되는 것이 바로, Root set인 것.   
이것이 Reachability Analysis Algorithm의 기본개념이다.         
Object가 Root set에 참조는 되지만 사용되지 않는 다면, Memory Leak Object.   

stack즉 local 변수, method인자 그리고, static, jni에 의한 참조 등이 gc root가 된다.   

|type|example|description|
|---|---|---|
|method에서 로컬 변수로 생성한 object|public void function() {<br/>Object gcroot = new Object();<br/>}|gcroot 변수가 gc root가 된다.|
|method의 argument로 전달된 object|public void function(Object gcroot) {<br/>}<br/>|gcroot가 gc root가 된다. |
|class에서 static member인 object|public class TestClass {<br/>public static WhatEver gcroot;<br/>}<br/><br/>public void function() {<br/>Object localGcRoot = new Object();<br/>localGcRoot.gcroot = new WhatEver(); }|static member인 gcroot도 gc root가 된다.<br/>localGcRoot가 null이 되도. gcroot는 여전히 gcRoot이다.|
|class에서 static final member인 object|public class TestClass {<br/>public static final WhatEver gcroot = new WhatEver();<br/>}<br/><br/>public void function() {<br/>Object localGcRoot = new Object();<br/> }|static final member인 gcroot도 gc root가 된다.|
|JNI가 참조하는 object(native method에서 local variable로 참조된 object)|||

### 2. Copying Algorithm 
Heap을 Active와 InActive 영역으로 나눈후에, Active 영역에만 object를 할당한다.    
Active가 가득차게 되면, suspend후에,  gc 대상이 아닌 object들을  InActive로 옮기고,    
Active의 object들을 일괄 삭제한다.   
이후 InActive의 object들을 다시 Active 영역으로 옮긴다.   
Fragmentation을 제거 한다는 장점이 있다.    

### 3. Generation
IBM이나 Oracle에서 조사한 결과에 따르면,   
대 부분 allocation은 application이 실행되는 단게에서 발생하게 된다.   
또한 수명 또한 점점 감소한다.  
즉 시간이 지남에 따라 객체의 할당량과 살아남는 시간도 감소하게 되는 것.   
또한 오래전에 생성된 object에서 최근에 생성된 object로의 reference는 아주 적게 존재 한다.   
이런 이유로 ART나 Dalvik에서 Heap memory 회수를 위해 Heap을 세가지 세대로 분류하였는데,   
이는 JVM과 거의 동일하다.      
또 objcet의 98%는 수명이 짧다.   

1. Young Generation
2. Older Generation
3. Permanent Generation

할당 되자 마자는 Young이고 시간이 지나면 세대가 변하는 식이다.     
이 말은 Young에서 Old로 copying을 한다는 것.(copying Algorithm과 비슷하다)    
대 부분은 Young에서 reference가 끊어지기 때문에, copy의 부하를 최소화 할 수 있다.   
Young에서 GC하는 것을 Minor GC라고 하고, Old에서 GC를 Major GC라고 한다.    
Minor GC는 자주하고, 속도도 빠르다.   

Hotspot JVM에서는 이 generational이 적용되어 있다.   
(Young Generation에서는 eden, S0, S1 세개의 container를 가지고 있다.)     
```
+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
|  Young Generation             |                 Old Generation            |  Permanent Generation   |
+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
| Eden | Survivor 0 | Survivor 1|                    Tenured                | Permanent               |
+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
```

Old Generation은 오래된, Young에서 넘어온 object들이 복사된 것이다.   
영역은 Young 보다 크게 할당 된다. 
Permanent Generation에는 class와 method들을 설명하기 위한 meta data들을 포함하고 있습니다.    


좀더 상세한 동작을 살펴보자.    
1. 새로운 할당은 Eden에서 이루어 진다.   
2. Eden이 가득차면, GC를 수행하고, 살아남을 object들은 Survivor 0로 이동시킨다.    
이동이 완료되면 eden은 전부 empty로 만든다.   
3. Eden이 다시 가득차면, GC를 수행하고, 살아남을 object들은 Survivor 1로 이동한다.    
Survivor0에 있던 object들도 나이를 증가시킨후, Survivor1로 옮긴다.   
Eden과 S0는 empty상태가 된다.   
4. 다시 Eden이 가득 차게 되면, GC기 일어나고 살아 남은 object들은 S0으로 push된다.    
현재 S1안에 있는 모든 object들은 나이를 증가시키고, S0로 옮긴다.   
5. 이런 과정이 반복되면서 나이가 일정치에 이르면 Old Generation으로 이동하게 된다.   
**물론 공간이 충분하지 않다면 old generation으로 직접 승격된다.**   

Copying Algorithm과 유사한 것을 볼 수 있다.   
Young은 자주 GC가 되고, Old에서는 거의 GC가 되지 않게 되는 것이 핵심이다.   

Java Script의 v8 엔진도 2 generation으로 나누어 gc를 한다.    
각 세대는 각각 메모리양에 제한이 있다.     


### 4. Mark and Sweep
Root Set Reference를 이용하는 GC 방법.    

다음 두 단계로 진행된다.    
1. root set reference가 있는 object에 marking.  
2. free또는 used인 모든 memory를 scan,   
marking되지 않은 object를 삭제.   
남아있는 object들의 marking은 초기화 한다.   
지워진 object의 공간의 fragmentation은 어쩔수 없는 문제.   

gc가 발생하는 동안, block되지 않는다면 memory corruption 등의 문제가 발생할 수 있다.   
때문에 memory 사용을 suspend 시킨다.   

fragmentation을 해결하기 위해서,  
Mark and Compact 기법이 등장하였다.   
sweep까지는 똑같지만,   
compact 단계를 추가해서,   
fragment된 부분을 제거한다.   
즉  
|object-a(marked)|object-b|object-c(marked)|   
이 sweep되면,    
|object-a(marked)|        |object-c(marked)|   
이렇게 중간에 조각이 발생하는데,    
|object-a(marked)|object-c(marked)|   
이렇게 공간을 땡겨주는 것.   

## 4. Garbage Collector

```
art/runtime/gc/collector/garbage_collector.h
class GarbageCollector
```

### 1. GC Timing

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


### 2. Reachability
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


heap.h의 class Heap의 ConcurrentCopyingCollector()는 Collector인, collector::ConcurrentCopying을 반환한다.   
실제 반환 값은 active_concurrent_copying_collector_.   

# 여기다 정리 중  

* Heap의 할당   
Runtime class가 Init()에서 heap을 생성하여 유지한다.      
```
[art/runtime/runtime.cc]
Runtime::Init(RuntimeArgumentMap&& runtime_options_in) {
	heap_ = new gc::Heap(runtime_options.GetOrDefault(Opt::MemoryInitialSize),
    ...
}
```

* GCReason   
```
[art/runtime/gc/gc_cause.h]   
enum GcCause {
  // Invalid GC cause used as a placeholder.
  kGcCauseNone,
  // GC triggered by a failed allocation. Thread doing allocation is blocked waiting for GC before
  // retrying allocation.
  kGcCauseForAlloc,
  // A background GC trying to ensure there is free memory ahead of allocations.
  kGcCauseBackground,
  // An explicit System.gc() call.
  kGcCauseExplicit,
  // GC triggered for a native allocation when NativeAllocationGcWatermark is exceeded.
  // (This may be a blocking GC depending on whether we run a non-concurrent collector).
  kGcCauseForNativeAlloc,
  // GC triggered for a collector transition.
  kGcCauseCollectorTransition,
  // Not a real GC cause, used when we disable moving GC (currently for GetPrimitiveArrayCritical).
  kGcCauseDisableMovingGc,
  // Not a real GC cause, used when we trim the heap.
  kGcCauseTrim,
  // Not a real GC cause, used to implement exclusion between GC and instrumentation.
  kGcCauseInstrumentation,
  // Not a real GC cause, used to add or remove app image spaces.
  kGcCauseAddRemoveAppImageSpace,
  // Not a real GC cause, used to implement exclusion between GC and debugger.
  kGcCauseDebugger,
  // GC triggered for background transition when both foreground and background collector are CMS.
  kGcCauseHomogeneousSpaceCompact,
  // Class linker cause, used to guard filling art methods with special values.
  kGcCauseClassLinker,
  // Not a real GC cause, used to implement exclusion between code cache metadata and GC.
  kGcCauseJitCodeCache,
  // Not a real GC cause, used to add or remove system-weak holders.
  kGcCauseAddRemoveSystemWeakHolder,
  // Not a real GC cause, used to prevent hprof running in the middle of GC.
  kGcCauseHprof,
  // Not a real GC cause, used to prevent GetObjectsAllocated running in the middle of GC.
  kGcCauseGetObjectsAllocated,
  // GC cause for the profile saver.
  kGcCauseProfileSaver,
};
```

* gc 범용 이론.   
1. Reference couting
count가 0이 되면, gc를 하기 때문에, gc 부하의 분산이라는 장점이 있지만,   
linked list의 순환 참조 구조에서는 memory leak이 발생할 수도 있다.    
그리고, 많은 객체가 참조하고 있는 객체의 count가 0이되면 연쇄적으로 대량의 object에   
gc가 발생해서 부하가 가중될 수 도 있다.    

2. Mark-and-Sweep    

* collector의 종류   
GarbageCollector의 자식들.    

|class|location|parent|description|
|---|---|---|---|
|ConcurrentCopying|art/runtime/gc/collector/concurrent_copying.h/GarbageCollector||
|MarkSweep|gc/collector/mark_sweep.h|GarbageCollector||
|PartialMarkSweep|gc/collector/partial_mark_sweep.h|MarkSweep||
|StickyMarkSweep|gc/collector/sticky_mark_sweep.h|PartialMarkSweep||
|SemiSpace|gc/collector/semi_space.h|GarbageCollector||

[art/runtime/gc/heap.h]의 Heap에는    
collector들의 vector가 존재한다.  
```std::vector<collector::GarbageCollector*> garbage_collectors_;```
Heap의 생성자에서는 여기에 다양한 collector들을 push  한다.   

충분한 권한이 있다면, debuggerd command로 현재 실행중인 프로세스의 call stack을 확인할 수 있다.   
```debugger -b pid```
java 쪽만 보고 싶다면,    
```debugger -j pid```


* 객체의할당   
Heap class의   
```
AllocObject()
AllocNonMovableObject()

```

# App에서의 처리(정리중)     
Activity에서 import android.content.ComponentCallbacks2을 상속받아서, onTrimMemory()를 구현한다.
System에서 App을 종료시키지 않도록 하거나, ...
[상세한내용](https://developer.android.com/topic/performance/memory?hl=ko)   




# References
[GC Alorithm](https://en.wikipedia.org/wiki/Tracing_garbage_collection#Na%C3%AFve_mark-and-sweep)     
