---
title: "Hardware"
permalink: /kdb/arch/hardware
toc_sticky: true
toc_ads : true
layout: single
---

# Memory

## 1. RAM(Random Access Memory)

### 1.1 SRAM(Static RAM)
dynamic ram, 즉 dram과 비교하면, refresh가 필요없기 때문에 속도가 빠르지만, 크기가 크다.    
전원을 끄면, 내용이 날아가는 volatile(휘발성) ram이다.    
cpu의 L1, L2 cache가 바로 static ram이다.    


### 1.2 DRAM(Dynamic RAM)
우리가 일반적으로 이야기 하는 ram이 이것이다.    
sram이 회로구조인데 반해 커패시터에 전하가 쌓여서 메모리가 저장되기 때문에 전하 소실 문제가 있고, 백만분의 몇초마다 refresh를 해줘야 한다.    
역시 volatile ram이다.    

### 1.3 Flash RAM
재 사용 가능한 ROM인 EEPROM(Erasable Programmable Rom)에서 발전한 것.     
전원을 꺼도 결과가 남아 있는 비휘발성 메모리이다.    
쓰기 속도가 dram이 아니라 하드디스크 보다도 느리다.    
SSD가 harddisk 보다 빠른 이유는 여러 flash memory에 나눠서 읽고 쓰기 때문이다. Raid-0와 비슷    
Harddisk 처럼 overwirte가 안되고 block을 지우고 써야한다.    
검색 속도는 매우 빠르다.    
읽기는 block단위 아니고, 1byte단위로 가능.

NAND와 NOR 두 type이 존재한다. 익히 알려졌다 시피 smart phone에서는 NAND를 사용한다.    

|feature|NAND(고밀도,저가)|NOR(저밀도,고가)|
|---|---|---|
|Brand|삼성전자, 하이닉스, 도시바|Intel|
|읽기 속도|Block단위로서 느림|Shell 단위로 빠름|
|쓰기 속도|Block단윈로 기록해서 빠름|한 Shell씩 기록하기 때문에 느림|

원래 boot시에 필요한 firmware를 nor flash memory에 넣어두었는데,    
그러나 smart phone에서는 bootloader가 nand flash에서 읽어서,    
ram에 복사해 놓고 실행하기 때문에, NOR의 입지는 매우 줄어든 상태.   

Nand flash는 block을 지울수 있는 횟수가 정해져있기 때문에, Wear leveling이라고 해서, 이런 것들을 소프트웨어적으로 control해야한다.    

#### 1.3.1 Managed NAND 
eMMC나 SSD 처럼 하나의 chip에    
<code> nand flash memory + controller + error mangement + wear leveling + sdio와 같은 전용bus </code>    

이런 방식을 managed nand flash라고 부르고, 기존에 nand만 있는 방식을 raw nand flash라고 부른다.    
raw nand의 경우에는 jffs2(jounaling flash file system2), yaffs2, ubifs등의  file system을 사용하며 대 부분이 yaffs2이다.    
managed nand의 경우에는 ext4, F2FS(Flash Friendly File System by SAMSUNG)등이 있다.    


#### 1.3.2 eMMC(Embeded Multi Media Card)

SOC에서 처럼 embeded에서 하나의 chip에 nand flash memory + controller + MMC interface를 구현한 것이다.    
PC에서 FSB가 발전된 QPI/HTT등으로 Memory에 접근하듯이, SOC에서도 SDIO라는 bus를 통해서, eMMC에 접근하게 된다.    
nand flash memory에 controller를 포함시켜서, soc가 직접하지 않아도 되도록 만든것이다.     
그래서 soc와 eMMC 사이의 호환성이 올라갔지만(공간활용도 즉 슬림해짐), 한 chip에 넣다보니,    
속도와 안정성은 같은 nand flash memory인 ssd와 비교하면 떨어진다.    
이것 ssd가 ATA interface를 통해 연결되는데 반해 MMC interface를 통해 연결된다는 점도 한 몪한다. Interface 자체의 부하도 더 높기 때문이다.    
히스토리를 살펴보면, Infineon과 sandisk가 중심이 되어서, MMC를 만들었고, MMC에서 파생된 sdcard는 파나소닉, sandisk,도시바 에서 만들었다.    
MMC는 차츰 sdcard에 밀리게 된다.    
지금은 eMMC 5.1(command queue를 도입해서 성능향상)이고 대용량 flash memory 시장이 UFS2.0(Universal Flash Storage)로 넘어가게될 전망임.    
Soc와 eMMC간에는 읽기 or 쓰기의 half duplex이지만, ufs는 동시에 읽고 쓰기가 되는 full deplext 방식이며, 읽고 쓰기가 더 빠르다.    


# Mainboard
motherboard라고도 한다.   
기본적으로 다음 3가지 chip으로 구성된다.    

* CPU
* Northbridge
* Southbridge

하드디스크, 모니터, 키보드, 마우스, USB, Audio, PCI-express card등은 South bridge chip에 연결된다.   
RAM과 Graphic을 위한 AGP나 PCIe들은 Northbridge chip에 연결된다.   
즉 CPU는 이런 chip들을 통해서, 다른 device들과 통신하게 되는 것이다.   
이 모든 것들이 하나의 chip에 들어가있는 application processor와는 대조적이다.   


# BUS
## 1.AMBA
아직 젊었을 때 MMA를 수련했었는데, 스파링에서 첫 서브미션을 암바로 잡았다.   
이후로는 오직 스탠딩 길로틴으로만 서브미션 승을 따냈지만...   
아무튼 개인적으로 익숙한 이 이름은 ARM에서 제공하는 bus protocol이다.    
ARM에서 설계해서 판매하는 core architecture, GIC와 마찬가지인것, 즉 버스 설계 규격.   

느린 device에 고속 bus를 달아 봐야, 발열만 올라가고 속도는 향상은 잘 안된다.   
즉 저전력을 위해서라도, 느린 장치에는 느린 bus를 빠른 device에는 빠른 bus를 연결한다.   

|Type|Description|
|---|---|
|AHB(Advanced High-Performance Bus)|고속BUS|
|ASB(Advanced System Bus)|고속 BUS, AHB와는 다르게 Rising Edge와 Failing edge Clock을 모두 사용|
|APB(Advanced Periphearal Bus)|느린 BUS, 저 전력|
|AXI(Advanced eXtensible interface)||

cpu에서 l3 cache를 연결하는 것도 AMBA interconnect이고, dram이나, external l4 cache와 연결하는 것도 바로 AMBA.   

## 2.PCI(PCI(Peripheral Component Interconnect)
CPU와 주변 기기를 연결하는 Local Bus의 일종으로 테이터 전송률이 우수하다.   
CPU와 PCI bus 사이에 System/PCI Bus Bridge를 두어서 Peripheral device에 상관 없이 추상화된 통신을 할 수 있다.   
그래픽/사운드/네트워크 카드와 SCSI 카드드을 연결하여 사용한다.   
external interrupt의 경우, I/O APIC로 전달되고, PCI를 타고, NorthBridge로 전달되고,    
Interrupt controller communication bus를 타고, CPU로 진입하게 된다.   
