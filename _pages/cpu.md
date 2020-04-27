---
title: "CPU"
permalink: /kdb/arch/cpu/
toc_sticky: true
toc_ads : true
layout: single
---

x86 CPU의 경우, Intel, AMD, 대만의 VIA 세개의 업체가 있다.   
VIA는 Cyrix를 인수하여 중국 정부의 지원을 통해 생존하고 있고, Intel이 주로 이루고 AMD가 뒤따라가는 형국이다.   
본인은 저렴하고 가성비 좋은 AMD를 이용하고 있지만, Intel의 경우, Clock당 명령어 처리 능력이나, CPU의 inter connect bus 기술에서 앞서가고 있다.   


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

다음은 lagacy PC의 구조이다.   
![layout](https://devdevil1901.github.io/assets/images/arch_cpu_fsb.png)   

fsb(front side -bus)는 core를 northbridge와 연결시켜준다.  
이 north bridge를 통해서, memory, AGP, PCIe에 접근할 수 있게된다.   

그러나 L3 cache가 도입되면서, FSB는 사라지고, Intel에서는 fsb의 성능 향상을 위한 개선으로 QPI(Quick Path Interconnect)를 만들었고,   
AMD에서는 HTT(Hyper Transport Technology)를 만들었다.  
이 bus protocol은 processor 끼리의 통신과 외부 chipset과의 통신에 사용된다.   
즉 CPU는 PCIe를 이용해서 그래픽 카드등의 주변장치와 통신하고, QPI를(Intel 기준) 이용해서,   
DRAM과 통신하는 것이다.  
예를 들면 한 die에는 4개의 PCIe 3.0이 꼽혀있는 식이다.   

L3 cache와 발전된 bus 기술이 도입되면서, bus는 ring bus 구조를 따르게 되었다.   
Intel의 경우 샌디브릿지 부터, IBM의 네트워크 구조인 Token Ring과 흡사한 Ring BUS 구조를 도입하였다.   
이것은 core 숫자가 늘어나게 되면서 latency를 해결하기 위한 노력이었다.   

이런 발전과 더불어서, DRAM을 연결하고, South Bdridge를 연결해 주던 NorthBridge의 경우도 Processor의 Chip으로 옮겨가게 되었다.  
Mobile의 경우에는 South Bridge마저 CPU와 묶어서 package화 하고, OPI(On Package Inter-connect)를 통해 연결한다.    
core는 산술연산과 논리연산을 수행하는 ALU, Control Unit, Register등으로 구성된다. 

![cpu layout](https://devdevil1901.github.io/assets/images/arch_cpu_layout.png)

다음 그림에서와 같이, ringbus는 양방향(core 수에 따라 세개가 될 수도 있다)으로 원형을 이루는 bus들이 있는 것이다.  
각 bus에는 snoop bus, request bus, acknowledgement bus, 256개 선으로 구성되는 data bus등으로 구성되어 있다.   
core1이 core4의 L3에 data를 전송한다고 하면, 3 cycle의 latency를 가지게 된다. 

또 QPI의 경우에는 42개의 lane이 있고, 반은 송신에 반은 수신에 사용된다.   
각 lane은 2개의 통신선으로 구성되어 있다.   
![UPI](http://devdevil1901.github.io/assets/images/arch_cpu_ringbus.png)   


하지만 core가 더 늘어나게 되자 latency가 다시 문제가 되었고, Intel에서는 문제 해결을 위해 Mesh interconnect 방식을 개발하였다.   
이후 core가 10개 이상인 경우에는 Intel은 Mesh를 사용해서, ring bus 방식을 대체하고 있다.   
Mesh interconnect 구성에서는 bus protocol도  QPI가 아닌 UPI(Ultra Path Interconnect)를 사용하게 된다.   
UPI 역시 QPI와 마찬가지로 pointer-to-pointer 일대일 통신 구조.   
애초에 Ring BUS도, 일대일 연결로 QPI를 연결하면 각 core에서 다른 모든 core 까지 QPI로 연결해야 해서 리소스가 낭비되기 때문에 나온것이다.   
![UPI](http://devdevil1901.github.io/assets/images/arch-cpu-mesh.png)

cpu에는 전용 L1 cache가 core에는 L2 cache가 그리고 전 core가 공유하는 혹은 core 별로 존재하는   
L3 Cache와 CHA(caching/home agent)를 가지게 된다.  

이 방식은 기존 ring bus 방식에서 core0에서 core51로 data 전송 시 50개 이상의 접점을 지나쳐야 하는데 비해서,   
CHA를 경유하여, routing을 담당하는 CMS(converged mesh stop)에 의해서 가장 빠른 경로를 선택하는 기능으로 7번의 접점으로 가능해 진다.   
Intel의 강점이 드러나는 부분이다.   
참고로 Intel의 경우 server용은 한 die에 core가 10개, 18개, 28개의 core가 들어갈 수 있다.   

이 구조는 Intel에서 제조한 AP에도 그대로 적용된다.    

# CPU topology
Topology란 말 자체가 구성 방식이라는 뜻을 가지고 있다.   
CMP(Chip-level Multi Processor), AMP(Asymmetric Multi Processor), SMP(Symmetric Multi Processor)등으로 구분한다.   

SMP는 하나의 socket에 하나의 core인 구조로 여러 cpu가 있는 구조로서,   
cpu마다 고유의 cache(L1)가 있고, core 전체가 공유하는 shared cache 존재(L2).   
SMP는 CMP 여러개를 FSB로 병렬로 연결한 것이다.   
다음 그림은 cpu와 core를 바꾸어 봐야 한다.(이전에 그린 거라서...)   
[SMP](http://devdevil1901.github.io/assets/images/arch_cpu_smp.png)   

AMP는 Master cpu와 slave cpu들도 나뉘고, system call 같은 것은 master cpu에 요청하는 형태이다.   
이 말이 무엇이냐면, SMP는 모든 cpu에서 os가 동작하지만, AMP는 master cpu만 os가 동작한다.   
Kernel 분석을 위해서는 사실 상 SMP만 알면 된다.   

# MMU and Cache
cpu의 대표적인 cache는 이렇게, TLB와 cpu cache가 있다.   
TLB는 page table을 cache해서, 더 빠르게 virtual address를 physical address로 변환하려는 목적을 가지고 있다.   
CPU cache의 경우는, dram에 저장된 정보를 cache해서, cpu의 register에 더 빠르게 로드하려는 목적을 가지고 있다.   
TLB miss가 발생하면, 해당 page의 physical address를 찾아가는 작업을 page walk라고 하고,    
page table을 찾아가는 작업을 page table walk라고 한다.   
Cpu cache는 Level1이 instruction cache와 data cache로 구별되고, L2,L3,L4는 보통 data cache이다.   
보통 L1 cache를 먼저 접근하고, miss 발생하면, mmu를 거쳐 주소 값을 알아낸 후에 l2,l3,l4,dram에 접근한다.   
속도의 경우, tlb가 cpu cache 보다 빠르거나 비슷하다.   

## 1. Cache
memory보다 더 빠른 접근을 위한 cpu 내부 장치.   
Cache가 memory 관련 된 성능 향상을 시켜준다.  
때문에 cache대신 ALU만 무지하게 때려 박은 gpu가 memory 접근 작업은 더 느린것이다.   
속도는 L1 > L2 > L3   
용량은 L3 > L2 > L1   
**L1에서 miss나면, L2 또 miss 면 L3이런식**.   
Physical core마다, L1 cache가 있고,   
cpu마다 L2 cache가 있으며,   
socket(아마도)이 공유하는 L3 cache가 있다.   
L1 cache는 instruction cache와 data cache로 나뉜다.   

cpu가 cache miss 나서, Front side bus 통해서, north-bride를 타고 memory로 가는 길이 병목이 잡힐수 있다.   
(core가 많기 때문에)때문에 L3 cache를 두는 것이다.(그래서, numa가 나온 것이고, QPI등이 나온 것이다.)   
L3 cache는 다 있는 것은 아니고, mainboard에 내장되어 있는 경우도 있고, 없는 경우도 있다.(최신에는 거의 있다)     
<pre>
L1d cache: 32K
L1i cache: 64K
L2 cache: 512K
L3 cache: 8192K
</pre>

현재 내 pc는 numa가 on이기는 하지만, fsb의 병목을 l3로 해결하고 있다.(numa node가 1이라서)   

## 2. MMU(Memory Management Unit)
원래는 별도의 IC(intergrated Chip)에 위치하였다가, 최근에는 대 부분 CPU안에 위치한다.   
Virtual memory system + demand paing(cpu가 요구할 때 마다 page 단위로 dram에 올리는 )을 위한 필수 요수이다.   
즉 Page table walk를 수행하는 장치이다.   
최신 성공한 page table walk 항목을 cache에 저장하는데 이것이 바로 TLB이다.   
즉 virtual address request가 오면, tlb를 먼저 확인하고, tlb hit면 physical address를 return하고, tlb miss면, page walk를 수행.   
   
Page table walker + TLB로 구성.   
   
x86과 arm에서는 hardware인, MMU에서 page table walker가 있고,   
mips에서는 tlb miss를 cpu 예외를 trigger한 다음에 os가 software에서 page table walking을 수행한다.    
그리고 android에도 mips에만 tlb 코드가 존재하는 것이다. 

aarch64에서는   
Page walk외에도, 해당 memory에 대한 access control을 caching하고 있다.   
Page 뿐만 아니라, section으로 memory에 대해 접근 가능하다.   
section은 1M단위로 접근, page는 small page(4K), large page(64K)로 접근이 가능하다.   
Section은 1 level translation table에 유지하고, page는 2 level translation table에 유지한다.   

## 3. Out-of-order execution
비 순차적 명령어 처리.   
순차적으로 실행하다가, memory load 명령어가 cache miss가 발생하면,    
뒤의 명령어가 memory load명령어에 영향을 받지 않는 다면 미리 실행할 수 있다면 효율적일 것이다.   
즉 동시에 처리할 수 있는 명령어가 있으며, 이것을 ILP(Instruction level parallelism) 명령어 수준의 병렬 성이라고 부른다.   
현재의 processor는 100여개 이상의 명령어 속에서, ILP를 찾아 비 순차 실행을 한다.   
Coretex-a8에서 arm 사는, 저전력을 위해서 비순차적 명령어 처리를 넣지 않았다고 했지만, a9에서 저전력을 하고도 비순차적 명령어 처리를 넣었다고 주장함.   
비순차적 처리를 가능하게 하는 것은 재정렬 버퍼(Reorder Buffer: ROB)이다.   

## 4. Pipeline
instruction cycle의 각 단게를 다음 단계로 전달하면서, 각 단계를 동시에 병렬로 처리하는 함으로서,   
instruction processing 속도를 향상시키는 방법이다.   




## 5. Cache

## 6. Branch Prediction

## 7. Speculative execution

# AP(Application Processor)
흔히 mobile AP, mobile CPU라고도 불린다.   
하나의 Chip에 다수의 소자가 집적된 SoC구조이다.   

# ARM vs x86 or CISC vs RISC
먼저 ARM과 x86을 생각해 보자.    
ARM은 aarch64의 경우 4byte로 고정되어 있고, x86의 경우는 길이가 다양하다.   
때문에 CPU에 instruction을 fetch로 가져오고, predecode에서 instruction 간 경게를 확인하고,   
fusion에서 연속적으로 실행가능한 instruction들을 결합하는 fusion등의 작업 까지가 더 복잡할 수 밖에 없다.   
coretex-a7의 경우 thumb, thumb2, thumb-extension이 있어서, arm mode에서는 4byte thumb에서는 2 byte.   
thumb2에서는 특별히 (branch등의)  큰 값이 필요한 instruction들만 4 byte 이런 식으로 나누어져 있었다.  
아마도 aarch64로 오면서 thumb이 사라진 것은 (물론 arch64에서도 aarch32 mode에서는 thumb이 남아 있다.)   
이런 이슈들과의 연관성도 있을 것이다.

또한 ARM은 instruction 중에 가장 load가 크다는 memory를 접근하는 instruction은 LOAD와 STORE로 엄격하게 제한되어 있으며   
mov, add에서는 register가 아닌 memory 영역을 접근할 수 없다.    

이런 차이들에서 일반적인 instruction을 기준으로 성능적인 측면에서는 arm이 장점을 가질 수 밖에는 없다.    

# SMT(Simultaneous Multi-Threading)
용어 그대로 해석하자면, 동시 multi threading.   
SMT의 반대는 TMT(Temporal Multi Threading)이다.   
즉 일시적 멀티 threading.   
TMT는 timeslice 단위의 시분할 multi threading즉 우리가 scheduling이라고 부르는 것으로, 나누어 실행해서 동시 실행처럼 느끼게 하는 것이다.   
즉 SMT는 hardware 즉 core단에서 정말 동시 실행되는 것.   
쉽게 말하면 하나의 물리적 cpu를 두 개의 core(2-way)처럼 해주는 virtual cpu기술.   
Hyper-Threading과 AMD의 SMT 모두(내 pc역시) 2-way smt(양 방향)   
즉 하나의 core가 2개의 core인 것 처럼 해주는 virtual core를 의미한다.(4-way는 4개인 것 처럼 해주는것)   
현재 대 부분 2-way를 사용 중이다.   
Hyper-Threading은 Intel에서 개발한 SMT 기술이자, 상호명이다.   
AMD도 2017년 라이젠 시리즈 부터 양방향 SMT를 적용하였다.   
이 virtual core 마다, hardware thread를 만들 수 있으며,   
이 기술을 활성화 하면, 3D rendering 시에 35% 정도의 성능상의 이점을 누릴 수 있게 된다.    
그렇지만, SMP로 실제 core를 늘리는 것과는 성능이 확실히 떨어진다.   
Virtual core간에는 cache를 공유하기 때문에, SMP 처럼 별도의 cache를 가지고 있는 경우보다,   
context switching overhead가 거의 없는 데도 그렇다.   
1개의 physical core안의 두 virtual core에서 동시에 thread를 실행하게 되면,   
thread의 성능은 SMT를 사용하지 않을 때 보다 떨어진다.   
때문에 windows에서는 이 virtual core를 따로 구별해 내부에서 리소스 충돌이 일어나지 않도록 thread를 schedule한다.   
또 linux는 sched_domain과 sched_group 자료구조를 통해 이것을 구현한다.   

# NUMA(Non-Uniformed Memory Access)
SMP(Symmetric Multi Processor)에서 확장 된 개념이다.   
SMP에서 각 Core들이, DRAM을 접근하기 위해서는 공통의 bus인 HTT나 QPI를 이용하게된다.   
물론 Ring BUS나, Mesh Inter-connect에서는 위의 내용을 참고하자.   
때문에 이 bus에서 병목이 발생하게 된다.   
이 병목의 해결을 위해 FSB를  HTT/QPI로 개선했고, Ring BUS로 core간 연결을 제공했고,   
L3 cache도 제공되지만, 한계가 있다.    
때문에 이 NUMA가 나왔다.   
[NUMA](https://devdevil1901.github.io/assets/images/arch_cpu_numa.png)    

그냥 SMP topology에서 memory controller를 core가 포함된 Chip에 넣고, local에 memory를 연결하는 것이다.   
이 방식은 특별한 방식아라기 보다는 최신의 기법이라고 보는 것이 올바르다.    
CPU의 local에 memory를 두고 매우 빠르게 접근할 수 있도록 하는 구조이다.   
그리고 main bus인 FSB를 통한 remote memory access는 상대적으로 효율이 떨어지기 때문에,    
최대한 local의 memory를 사용하도록 하는 것이 핵심이다.    
이것을 위해서 ccNUMA라는 cache coherence NUMA라는 cache를 두어서, cache 일관성을 보장하게 된다.
dram 접근의 병목 해결 뿐만 아니라, 또한 HTT나 QPI등의 main bus를 추가만 하기 때문에, 확장이 쉬운 장점도 있다.   

## Node
같은 local memory를 공유하는 단위를 NUMA Node라고 한다.   
이것이 반드시 cpu socket과 1:1로 mapping되지는 않는다.   
socket 1개에 NUMA node 2개가 있기도 하고, socket 2개에 NUMA node 1개가 있기도 하다.   
즉 CPU 마다 틀리다.   
node는 32bit integer의 고유한 id를 가지고 있다.   

## interleaving
firmware의  Node Interleaving을 enable 시키면 NUMA 구조를 가지고 있더라도, SMP 처럼 동작할 수 있도록 할 수 있다.   
즉 memory들은 하나의 연속된 memory로 mapping되고, memory page는 round-robin 형태로 node에 분배되고,    
local memory 접근 보다는 느리고, remote access  보다는 빠른 속도로 전 node가 균일한 속도로 접속하게 된다.    

## Support
UEFI firmware configuration(del 이나 F2로 진입하는)에서 활성화 가능한지 확인해야 한다.  
mainboard firmware 지원해야 지만 사용할 수 있다.   
일예로 Mac pro등에서는 NUMA를 지원하지 않는다.   
또 chip layout 자체가 NUMA 구조로 구성되어 있다고 해도, kernel에서 NUMA를 지원하기 위해서는   
hardware의 configuration이 NUMA node가 어떻게 구성되는지 정보를 kernel에 제공해야 지만 지원이 된다.   
내 개인 PC도 NUMA 구조로 되어 있지만, kernel 에서 인식하지 못하고 있다.   
자세한 내용은 linux의 boot process part를 참고한다.   

## GPU(Graphic Processing Unit)
CPU에서 Control과 Cache를 대폭 축소해서, ALU로 채운것이 바로 GPU.   

# SOC(System-on-chip)
on-chip즉 단일 chip에 여러 장치를 부착해서, 보드 사이즈를 축소하는 방향성에 맞는 제품들을 일컫는다.   
즉 여러 기능을 가지는 system을 하나의 chip으로 만드는 기술이다.   
간단히 도식화 하면 이런 것들이 모두 하나의 chip으로 구성된다.   
<pre>
Soc = CPU + GPU + Model(5G) + NPU + VIDEO + CAMERA + CONNECTIVITY(4G/Wifi) + AUDIO    
</pre>
또한 soc의 CPU는 다음과 같이 구성된다.   
Cpu = core + system bus + peripherals(hardware ip) + memory + optional   
이것이 가지는 장점은 다음과 같다.   
사이즈 축소   
on-chip에 비해, off-chip 활동은 전력을 더 소모하기 때문에 저전력   
제조 및 조립 비용감소   

## 1.AP(Application Processor)
대표적인 것인 smart phone에서 사용되는 Mobile AP(Application Processor)이다.   
즉 AP가 SOC다.   
ARM에서는 core(ALU, CU, Register)와 Cache, JTAG, WB, CP + bus를 licensing하고,   
삼성, 퀄컴등은 여기서 라이센스를 구매해서 여기에다가, timer, sram, nor등의 peripheral 장치들을 추가해서 soc를 만들어서 판매하는 것이다.   
실제 크기는 1cm 남짓으로 손톱보다도 작다.   
JTAG debugger는 core를 test하기 위해 추가되는 국제 규약의 pin이다.   
DSP(Digital Signal Processor) 영상과 오디오 재생에 특화된 처리를 하는 곳.   
Connectivity 4G, 5G, WIFI등의 네트워크 연결담당.   
2d/3d accelerator와 동영상 재생에 필요한 codec이 들어 있다. (pc는 cpu가 codec실행)   

### 1.1 Brand
2019년 11월 19일 기준으로 점유율은 다음과 같다.   
ap계의 공룡은 퀄컴.   
주요 벤더는 다음과 같다.   
|Vendor|Scale of hundred|
|---|---|
|Qualcomm|39|
|Apple|19.9|
|SamSung|13.1|
|HiSilicon|12.9|
|MediaTek|12.7|

중국의 두 회사를 합치면, 삼성을 능가하는 것도 눈여겨볼 점.   
주요 Brand를 살펴보자면,    
**Exynos** 
삼성전자에서 만든 ap.   
최신 버전은 Exynos 9(990)로서    
3중 클러스터 설계로 2개의 coretex-a76 core와    
4개의 cortex-a55 core로 구동 됨.   
Arm Mali-G77 GPU   
인공신경망 procssor인 NPU   

gallaxy 10이 Exynos 9가 있다.   

**SnapDragon**
퀄퀌에서 만든 ap.   
Msm series가 대표적으로, android kernel에서 msm 붙은 것이 바로 이것이다.   
최신 버전은 snapdragon 865.   
LG, Xiaomi, Google Pixel등에서 사용 중.   
LG V50S thinQ가 snapdragon 855이다.   

**Helio**
중국의 미디어택에서 만든 ap.   
x는 고급형   
p는 중급   
a는 저가형   
최신 LG phone인 LG Q51이 MT672를 사용 중이다.   

**Hi Silicon**
화웨이의 자회사 하이실리콘에서 개발.   

**NUCLUN**
LG 전자에서 개발.   
G3등에서 실험적으로 사용하였다.   

**Apple A series**
애플에서 개발. 자사 제품에만 사용.   
애플이 설계하고, 삼성,TSMC가 생산.   

**Intel Atom**
intel이 x86 기반으로 생산   
모토롤라 레이저 i에 적용 됨.   



# Co-Processor
말 그래도 보조 processor, 독립적으로 존재하지만, cpu에 연결되어서 instruction set을 확장해 주는 등의 역활을 한다.   
대표적인 것이, Floating point Unit(FPU)이다. fp는 fadd와 같이 부동소수점 연산 instruction set을 확장해 준다.   
coretex-v7a에서 cp0~cp15가 있었다. cp15는 mmu를 control 하는 instruction set을 확장해 주었다.   
하지만 coretext-a8로 오면서, cp0~cp15는 전부 사라짐.   

# References
[CPU Technology and Future Semiconductor Industry](https://ettrends.etri.re.kr/ettrends/182/0905182009/35-2_104-119.pdf)   
