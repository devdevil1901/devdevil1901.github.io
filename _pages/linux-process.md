---
title: "Process"
permalink: /kdb/linux/process/
toc_sticky: true
toc_ads : true
layout: single
---
[Outline](#outline)     
[Task](#task)      
[    1. Creation of task](#1-creation-of-task)       
[        1.1 Kernel mode stack 할당](#11-kernel-mode-stack-%ED%95%A0%EB%8B%B9)      
[        1.2 Processor affinity](#12-processor-affinity)      
[Thread](#thread)      

# Outline
process는 하나이상의 thread로 구성된다.   
kernel level에서는 process와 thread를 구별하지 않고, scheduling을 포함한 모든 작업에서 **task**단위로 이루어진다.   

# Task
kernel단에서 작업은 task단위로 이루어진다.    
task를 표현하기 위한 자료구조에는 다음과 같은 것들이 존재한다.    
1. task_struct
2. thread_struct
3. thread_info

task_struct는 architecture 독립적인 task를 표현하는 자료구조이다.    
선언은    
include/linux/sched.h    

thread_struct는 architecture에 의존적인 부분을 표현하는 자료구조이다.    
선언은    
arch/arm64/include/asm/processor.h   
arch/x86/include/asm/processor.h     

thread_info는 architecture 의존적인 부분으로, kernel의 entry code(entry.S)에서 접근하는 부분을 표현하는 자료구조이다.    
(arm64쪽 주석에는 entry.S에서 즉시 접근하기 위한 low level data라고 표현하고 있다.)    
선언은    
arch/arm64/include/asm/thread_info.h    
arch/x86/include/asm/thread_info.h     

## 1. creation of task
### 1.1 kernel mode stack 할당
Task가 생성될때 마다, task_struct 자료구조를 생성하고,  kernel mode stack을 할당한다.    
default로 **16k**를 할당하지만, page를 64k로 설정하고, vmap stack 사용시는 64k 크기로 할당한다.    
task_struct에서 thread_info는 kernel mode stack에 위치하게 되는데, **CONFIG_THREAD_INFO_IN_TASK**의 값에 따라 위치가 결정된다.    

CONFIG_THREAD_INFO_IN_TASK == n 인 경우에는     
```
High memory of stack
|
|
| STACK_AND_MAGIC
|
| thread_info
Low memory of stack
```
즉 Thread_info가 kernel mode stack의 가장 낮은 주소 부분(top)에 존재한다.    

CONFIG_THREAD_INFO_IN_TASK == y 인 경우에는    
```
High memory of stack
| thread_info
|
| 
|
| STACK_AND_MAGIC
Low memory of stack
```
thread_info가 task_struct의 최 상위의 member로 존재하게 된다.     
arm32는 CONFIG_THREAD_INFO_IN_TASK == n 이지만,     
arm64, x86_64, goldfish 등과 같이 대 부분의 경우에는     
CONFIG_THREAD_INFO_IN_TASK == y이다.     

Stack은 high memory에서 low memory 쪽으로 자라는 것을 명심하자.    

### 1.2 processor affinity
직역하면, processor 친밀도.    
어떤 core에서 process나 thread가 실행될 수 있는가를 나타낸다.    
taskset command로 설정 및 확인이 가능하다. 다음은 0~15번까지의 core들에 할당 가능한것을 나타낸다.    
```
/proc/1890$ taskset -pc 4683    
pid 4683's current affinity list: 0-15    
```

# Thread
Process는 두가지 방식으로 생성한다.     
heavy-weight creation으로 부모의 task info, fs, tty, fs, mm, signal을 전부 글대로 복사하는 방식(legacy)      
copy-on-write로 실재 사용시에 복사되는 방식.(current)        
(vfork()는 논외로)     
여기서 Thread는 light-weight creation으로 최소한 만을복사한다.    
물론 Process는 별도의 가상메모리 공간만을 가지고, Thread는 같은 Process내에서 별도의 stack및 TLS를 가지고 하는      
차이가 있지만 생성 로드 관점에서 이야기 한 것이다.     

## 1. kernel thread
Kernel process가 clone()을 호출해서, light weight overhead로 생성한 것이다.    
보통 서버나 데몬에 사용된다.    
Kernel mode에서만 동작하고, user mode thread와는 달리 고유의 공간은 가지고 있지 않다.    
모든 user task보다 우선순위가 높다. (Scheduler-Priory 부분 참조)    

# 
