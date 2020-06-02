---
title: "Interrupt Controller"
permalink: /kdb/arch/interrupt_controller/
toc_sticky: true
toc_ads : true
layout: single
---

# Table of content
1. [Outline](#outline)   
2. [APIC(Advanced Programmable Interrupt Controller)](##apicadvanced-programmable-interrupt-controller)    
3. [GIC(Generic Interrupt Controller](#gicgeneric-interrupt-controller)  
4. [References](#reference)  

# Outline
software 개발자도 hardware를 이해해야 할 때가 있다.      

# APIC(Advanced Programmable Interrupt Controller)
PIC는 x86 architecture의 interrupt controller이다.   
software로서 control가능하기 때문에, programmable IC즉 PIC라고 부른다.   
APIC는 SMP 환경에서의 IC이다.   

![APIC](https://devdevil1901.github.io/assets/images/arch_ic_1_apic.png)

IRQ를 처리하는 external I/O APIC와 추가적으로 scheduler의 time slice를 가능하게 하는 timer interrupt,      
IPI(Inter Processor Interrupt), IRQ from locally conected I/O device의 interrupt들을 처리하는 local APIC로 구성된다.   

APIC는 master-slave 방식으로 되어 있고, 15개의 interrupt를 동시에 처리하능하다고 한다.   

# GIC(Generic Interrupt Controller)
ARM사에 설계하는 interrupt controller.

ARM사는 hardware를 제조하는 것이 아니라, application processor(AP)를 설계해서 라이센스를 파는 회사이다.   
AMBA와 같은 BUS와 Interrupt Controller도 마찬가지의 ARM사의 영역인 것이다.   
원래는 SOC 제조사 별로, 제각기 표준이 있었다.   
Exynos-combiner, Armada-mpic,Atmel-aic,bcm2835-ic, bcm2836등등   
하지만 coretex-v8a로 오면서 대부분 GIC를 사용한다.   
Distributor block, CPU Interface block, Virtual CPU interface로 구성된다.   
GIC는 다음을 지원한다.   
SPI(Shared Peripheral Interrupts) 공유된 주변 interrupt multi cpu에 전달되는 interrupt.   
PPI(Private Peripheral Interrupts) 개인적인 주변 interrupt 특정 cpu에게 전달되는 interrupt   
SGI(Software Generated Interrupts) software에서 발생된 interrupt (0~15)   

1. distributor block:   
말 그대로 interrupt의 우순순위화와 분배를 수행.   
진입 된 interrupt는 다음과 같다   
non-secure extension에서 fiq로, secure extension에서 group0이 fiq, 1이 irq로.   

2. CPU interface block:   
각 cpu 마다 존재.   
priority masking(16~256)과 preemption   

3. Virtual CPU Interface : 
virtual core 마다 존재   



# Reference
이 GIC에 대한 명세는 ARM® Generic Interrupt Controller Architecture Specification에 나와있다.   
[link](https://static.docs.arm.com/ihi0069/d/IHI0069D_gic_architecture_specification.pdf)
