---
title: "Memory Management"
permalink: /kdb/linux/memory/
toc_sticky: true
toc_ads : true
layout: single
---

# SLAB
Slab은 memory의 assign 속도와 fragmentation의 최소화를 통한 성능 개선을 위해 도입되었다.    
즉 memory를 빨리 할당하고, 잔여 memory를 최대한 남기려고 하는 것이다.    
세 가지 종류가 있으며 대 부분 slub 방식을 사용하고 있다.    

1. slab
2.6.23에서 slub assigner로 대체되었다.(즉 중요하지는 않다)    
|--------------------------------------------------------------------- slab cache -----------------------------------------------|    
|metainfo------ slab -------||metainfo------ slab -------||metainfo------ slab -------||metainfo------ slab -------|     

Metainfo가 있었고, slab들을 full, partial, empty로 나누어 관리하였다.     
Full : 사용중인 slab    
Partial: 사용 중이거나 미 사용 중인 slab    
Empty: 미사용 중인 slab   

2. slub
partitial만을 사용한다.    
metainfo를 사용하지 않고, memory map을 사용한다.     
이로써, memory 사용량이 줄어들게 된다.     
CONFIG_SLUB으로 활성화 된다.    
embeded와 pc 전부 이것이 기본이다.    
Slub내 모든 slub object가 전부 할당되면, partial list에서 제거된다.     
Free 되면 재 할당을 위해서, 다시 partial list에 추가됨.    
성능을 위해 Cpu cache 및 node별로 존재(이것은 slab과 같다)한다.         
slab->slub으로 되면서, cpu cache가 50% 정도 줄었고, 메모리 단편화도 줄고, assigner의 locality도 향상되었다.        
slub object의 구조는 처음은 다음 처럼, fp(free pointer)로 시작해서, padding으로 끝난다.    
|[free pointer]---------- slub object -----------[padding]|     
object size는 padding 뺀 값이다.    

3. slob
성능은 떨어지지만 memory는 가장 적게 차지 즉 메모리 적은 embeded 용이다.    

간단히 말해서 다음과 같은 구조이다.     
|--------------------------------------------------------------------- slab cache -------------------------------------------------------------------|    
|---------- slab ------------||---------- slab ------------||---------- slab ------------||---------- slab ------------||---------- slab ------------|    
Slab은 memory block을 의미하고, slab 들이 모인 것이 slab cache이다.    
Slab cache는 **slab object들을 미리 할당해 놓고, memory 할당 요청이 오면 slab object를 return한다.**      
                                                        |-------------------- slab cache  --------------------------|    
-- memory assign request--->   |-- slab object --| |-- slab object --| |-- slab object --|     

slab cache는 자주 사용되는 형식의 memory assign pattern을 미리 정의 정의해서 할당해 놓는다.    
또한 해당 pattern으로 메모리를 해제해도 다시 사용할 가능성이 높기 때문에 계속 유지해 놓음.    
여기서 memory pattern으로는 다음의 것들이 있다.    
(내 ubuntu에서 확인하면 180개나 된다.     
```
$ sudo cat /proc/slabinfo
slabinfo - version: 2.1
# name            <active_objs> <num_objs> <objsize> <objperslab> <pagesperslab> : tunables <limit> <batchcount> <sharedfactor> : slabdata <active_slabs> <num_slabs> <sharedavail>
ufs_inode_cache        0      0    792   41    8 : tunables    0    0    0 : slabdata      0      0      0
task_struct         1208   1330 5888    5    8 : tunables    0    0    0 : slabdata    266    266      0
..
dma-kmalloc-128        0      0    128   32    1 : tunables    0    0    0 : slabdata      0      0      0
dma-kmalloc-64         0      0     64   64    1 : tunables    0    0    0 : slabdata      0      0      0
kmem_cache_node      215    960     64   64    1 : tunables    0    0    0 : slabdata     15     15      0
kmem_cache           195    576    448   36    4 : tunables    0    0    0 : slabdata     16     1
```

즉 task가 생성되면, task_strurct 만큼 메모리 할당을 요청하면 slab memory assigner가 미리 할당해 놓은 시작주소를 돌려주게 되는 것이다.    


# memory model
flatmem, discontigmem등의 model이 있지만, 현재 x86_64와 arm64 모두 sparse model을 사용중이기 때문에    
여기에 초점을 맞추도록 한다.      
x86_64에서 NUMA를 사용하는 경우도 이 model을 사용한다.    
