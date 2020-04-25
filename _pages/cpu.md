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


# References
[CPU Technology and Future Semiconductor Industry](https://ettrends.etri.re.kr/ettrends/182/0905182009/35-2_104-119.pdf)   

