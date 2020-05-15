---
title: "Memory Management"
permalink: /kdb/linux/memory/
toc_sticky: true
toc_ads : true
layout: single
---

# Table of contents
[Outline](#outline)         
[Segmentation](#segmentation)          
[1. Real mode segmentation](#1-real-mode-segmentation)         
[2. Protected mode segmentation](#2-protected-mode-segmentation)        
[3. IA32e-64bit mode segmentation](#3-ia32e-64bit-mode-segmentation)       
[4. System descriptor](#4-system-descriptor)         
[Paging](#paging)         
[1. Paging on protected mode](#1-paging-on-protected-mode)        
[SLAB](#slab)       
[Memory Model](#memory-model)      

# Outline

# Segmentation
먼저 Segmentation을 살펴보자.      

## 1. real mode segmentation
Segmentation은 real mode에서는 physical memory에 대한 접근 방법이고, protected mode에서는 paging을 위한 선형주소에 대한 접근 방법이다.      
먼저 real mode를 이해해야 한다.       
real mode에서는 segmentation 방식으로 memory를 접근한다. (paging 자체가 protected mode 부터 가능한 것을 상기하자.)       
real mode는 전원이 들어오고, bios 쪽의 코드를 실행하는 상황이며, kernel을 load하고 protected mode로 변경하는 작업을 수행 해야 한다.      
최대 주소공간은 1M(2의 28승)이다.      
그런데 일반 레지스터와 세그먼트 레지스터는 real mode에서 16bit 크기이다.       
즉 8byte, 64K이다.        

즉 한 레지스터에 주소 공간을 전부 담을 수가 없다.      
때문에 다음의 방식으로 주소를 접근하게 된다.       
segment register * 16 + 일반 레지스터       
또한 이렇게 계산된 값이 바로 physical address이다.       

16을 곱하는 이유는 전체 메모리인 1M에 근접해 지기 때문이다.       
2의 16승 * 2의 4승 = 2의 20 - 16 이 됨.      
사실 그렇다면 여기에 주소를 담아서 접근해도 되는데 굳이 16bit 일반 레지스터를 써서 접근하는 이유는 다음과 같은 히스토리 때문인 것으로 보인다.      
```
8086은  20bit address bit를 가지고 있었기 때문에, 1Mb의 주소 공간으로 동작할 수 있었다.    
그러나 8086의 register는 16bit였기 때문에 2에 16승 즉 64KB가 최대 였다.        
즉 전체 address 공간을 접근할 수가 없었다.  
```
그래서 segmentation이 나오게 된 것이다.        
모든 메모리를 16bit register의 접근 최대 값인 64kb(65535)의 크기를 가진 작은 세그먼트로 나누어 세그먼트 레지스터와 함께 참조하게 된 것이다.      
즉 어떻게 보면, paging이 나오기 전에 나온 segmentation이 부팅 과정에서 아직도 사용되고 있는 것으로 일단 이해할 수 있다.        

## 2. Protected mode segmentation
다음과  같은 real mode와의 차이 때문에 segment register를 보호 모드에서는 **segment selector**라고 부르며,       
segment unit이라는 hardware가 세그먼트 셀렉터에서 address  변환 작업을 해준다.      
(즉 이 부분은 자동으로 되는 것이다.)       
Segment register가  segment selector와 동일하기 보다는 protected mode에서는 항상 segment register가 selector값을 저장하기 위한 용도로 사용되기 때문이다.       

Protected mode에서 64K의 고정 크기 segment는 segment descriptor로 대체된다.      
이 segment descriptor는 GDT(Global Descriptor Table)에 저장된다.       
GDT는 kernel mode에서 사용하는 table로 하나만이 생성된다.(gdtr에 저장된다.)       
LDT는 user mode에서 사용하는 table로 각 process 별로 만들어 지는 테이블이다(ldtr에 저장된다.). 그렇지만 하나의 LDT를 공유할 수도 있다.         
LDT는 실제 segment에 저장되며 ldt의 위치를 gdt안에 저장한 뒤에 그 index를 ldtr에 넣어두면, cpu는 ldt를 로드해서 task 의 전환이 일어 나게 된다.        

GDT의 주소는 gdtr register에 저장된다.         
Gdtr은 48bit의 register이며 16bit에 크기를 32bit에 gdt의 주소를 저장한다.      
(protected mode는 32bit이다.)       
각각의 segment descriptor는 64bit이다.      
Segment descriptor의 type에는 Data와 Code가 있다.       
그리고 description 부분에 Read-Only, Read/Write, Execute/Read 등이 설정된다.        
Protected mode에서는 segment register가 다르게 해석된다.(16을 곱하지 않는다.)      
GDT에서 segment desriptor를 찾고 그 값에 + 일반 레지스터의 값을 더한다.       
**Segmentation이 끝나고 나면 나오는 linear address가 바로 paging의 시작 주소가 되는것.**이다. 이것을 linear address 즉 선형주소라고 부른다.      

Protected mode와 ia32e-64bit에서의 segment descriptor는 다음과 같이 구성된다.       
![segment descriptor](../../../assets/images/linux_seg_desc.png)

## 3. IA32e-64bit mode segmentation
사실 일반적으로 사용하는 mode가 여기이다.       
여기서의 segmentation은 기준 주소는 0크기는 64bit 전체로 설정된다.      
즉 선형주소 자체가 64bit 전체가 되는 것이다.      
이말은 segmentation을 사실 상 하지 않는 다고 할 수 있다.      

## 4. System descriptor
segment descriptor의 sbit가 0이라면, 이 segment descriptor는 CS,DS와 같은 것이 아니라, System Descriptor라는 의미이다.      
System descriptor에는 다음이 존재한다.        
|System descriptor|desc|
|---|---|
|LDT|Local Descripter Table Segment에 대한 descriptor|
|TSS|Task State Descriptor|
|Call|Gate Descriptor|
|Interrupt||
|Trap|Gate Descriptor|
|Task|Gate Descriptor|

# Paging
Segmentation이 physical address로 즉시 변경되는데 반해서,        
paging에서는 linear address로 불리는 logical address가 paging을 거쳐서 physical address로 변환된다.       
Paging을 이해하기 위해서는 먼저 protected mode를 확실하게 이해해야 한다.       
Protected mode는 1982년에 x86 아키텍쳐에 추가되었다. 큰 RAM의 메모리에 접근하기 위해서 였다.         
(64K의 고정 크기 세그먼트)       
이후 64bit에서 IA-32e(amd에서는 long mode)가 나오기 전까지 메인 모드였다.      
protected mode에서 memory 접근은 segment와 paging으로 이루어진다.     

# 1. paging on protected mode
4k의 page를 사용하는 3단계 paging을 사용한다.     
Protected mode segmentation을 통해서 찾아진 Linear Addresss는 다음과 같다.        
31-----Page Directory Index---22-21---Page Table Index---12-11---Offset into Page---0           

32bit protected mode에서의 메모리 접근을 그림으로 표현해 보았다.       
![protected mode access memory](../../../assets/images/linux_protected_access.png)      

Page Directory Index를 통해서 Page Table을 찾고, 그 Page Table에서 Page Table Index로 address를 구해서 Offset into Page를 더하면     
물리주소를 구하는 것을 확인할 수 있다.        

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

# Fixmap
Compile 시점에서 virtual address가 결정되는 공간이다.     
fixmap이란 것은 고정(fix)된 가상 주소 영역을 사용해서 물리 주소를 매핑하는 것이다.      
보통 vmap과 같은 mapping subsystem이 활성화 되기 전에 mapping이 필요할 때 사용된다.      
* console device를 정식으로 초기화하기전에 사용하고자 할때 early_ioremap()으로     
* read only로 설정된 kernel code를 변경하고자 할때, fixmap을 임시로 사용.     

Fixmap은 slot을 나우어서, architecture나 kernel version등에 맞추어 여러가지 용도로 나누어 제공된다.       
FDT slot(for dtb)은 최대 2M이지만, align을 사용해서 4M의 영역을 지원한다.       
소스레벨에서 살펴보게 되면,       
```
early_fixmap_init()에서 초기화 되고, 
다음과 같이 fixmap_remap_fdt()에서 활성화 된다.
__init setup_arch() [arch/arm64/setup.c]
-> setup_machine_fdt() [arch/arm64/kernel/setup.c]
    -> fixmap_remap_fdt() 
    -> early_init_dt_scan()
```    

관련 API는 다음과 같다.      
```
set_fixmap()
clear_fixmap()
set_fixmap_nocache()
set_fixmap_io()
__set_fixmap() (arch/arm64/mm/mmu.c)
```

# memory model
flatmem, discontigmem등의 model이 있지만, 현재 x86_64와 arm64 모두 sparse model을 사용중이기 때문에    
여기에 초점을 맞추도록 한다.      
x86_64에서 NUMA를 사용하는 경우도 이 model을 사용한다.    
