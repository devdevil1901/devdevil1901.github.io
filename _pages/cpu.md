---
title: "CPU"
permalink: /kdb/arch/cpu/
toc_sticky: true
toc_ads : true
layout: single
---

# Define
cpu와 processor 그리고 core의 정의는 문서나 architecture 그리고 사람 마다 틀리다.   
마치 x86의 interrupt가 exception을 포함하는 개념인데, aarch64에서는 exception이 interrupt를 포함하는 개념인것 처럼 헷갈리는 부분이 있다.   

가장 대표적인 두 가지를 살펴보자.   

첫 번째는 CPU를 가장 포괄적인 개념으로 보는 경우이다.   
![APIC](https://devdevil1901.github.io/assets/images/arch_cpu_define1.png)   

두 번째는 core안에 cpu가 있는 개념이다.   
![APIC](https://devdevil1901.github.io/assets/images/arch_cpu_define2.png)   

processor안에 cpu 그리고 그 안에 core 이렇게도 많이 쓴다.

본인은 첫 번째 개념으로 쭉 써왔는데, 최근에 두 번째 정의로 사용하는 부분이 많아서 이 후 문서는 모두 2번째를   
기준으로 하도록 하겠다.   
linux에서 lscpu를 치면은 다음과 같이 2번째 개념으로 사용한다.    
<pre>
$ lscpu
Architecture:        x86_64
CPU op-mode(s):      32-bit, 64-bit
CPU(s):              16
Thread(s) per core:  2
Core(s) per socket:  8
Socket(s):           1
L1d cache:           32K
L1i cache:           64K
L2 cache:            512K
L3 cache:            8192K
NUMA node0 CPU(s):   0-15
</pre>

참고로 cpu의 추가 적인 정보는 다음 command로 확인이 가능하다.
<pre>
# dmidecode 3.1
    ...
    External Clock: 100 MHz
    Max Speed: 4100 MHz
    Current Speed: 3200 MHz
    L1 Cache Handle: 0x002B
    L2 Cache Handle: 0x002C
    L3 Cache Handle: 0x002D
    Core Count: 8
    Core Enabled: 8
    Thread Count: 16
    Characteristics:
        64-bit capable
        Multi-Core
        Hardware Thread
        Execute Protection
        Enhanced Virtualization
        Power/Performance Control
</pre>

maniboard에 core를 장착할 수 있게 해주는 socket은 pc에는 보통 하나지만, 서버에서는 여러개가 꽃힌다.   
또 한 socket에 여러 core가 장착된다.   
내 pc의 경우는 8개의 core가 꼽혀 있다.   
이런 것을 multi-core system이라고 한다.   

fsb(front side -bus)는 core를 northbridge와 연결시켜준다.   
이 north bridge를 통해서, memory, AGP, PCIe에 접근할 수 있게된다.   

![layout](https://devdevil1901.github.io/assets/images/arch_cpu_fsb.png)

core는 산술연산과 논리연산을 수행하는 ALU, Control Unit, Register등으로 구성된다.   
Intel에서는 fsb의 성능 향상을 위한 개선으로 QPI(Quick Path Interconnect)를 만들었고,   
AMD에서는 HTT(Hyper Transport Technology)를 만들었다.   
![cpu layout](https://devdevil1901.github.io/assets/images/arch_cpu_layout.png)



