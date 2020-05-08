---
title: "Exception"
permalink: /kdb/linux/exception/
toc_sticky: true
toc_ads : true
layout: single
---

Exception도 architecture에 따라서 의미가 다르다.    
x86 architecture에서는 interrupt가 더 큰 범위로서, exception을 포함한다.    
arm64 architecture에서는 exceptin이 더 큰 범위로서, interrupt를 포함한다.    
이후 글에서는 aarch64를 좀 더 좋아하는 개인 취향상, arm64에서의 정의를 따르도록한다.     

> 이 부분은 그림으로 그려서 보강하도록 하자.         
Exception을 처리한다는 것은 다음을 의미한다.     

|arch|phase1|phase2|phase3|
|---|---|---|
|x86|현재 cpu를 점유하고 있는 프로세의 실행을 멈춘다.<br/>현재 status(pc, register)를 save한다. |interrupt의 handler를 실행.<br/>  Kernel mode 진입. Exception Vector table에서 해당 ISR를 실행<br/> interrupt handler(ISR)의 주소는 Interrupt Descripter Table (IDT)에 저장된다. |interrupted process의 실행을 재개한다.(time slace를 이어서 실행)|
|aarch64|Exception이 발생하면, ELR_ELx instruction을 이용해서, 돌아올 address를 저장해 놓는다.|SPSR_ELx instruction을 실행해서, 현재 processor의 state인 PSTATE 값을 에 PSTATE를 저장한다.|그리고 exception 처리가 끝나면 ERET을 써서, pc에 복귀할 주소를 넣고, spsr에서 PSTATE를 복구한다.|

|Type|interrupt|description|
|---|---|---|
|Hardware Interrupt|IRQ|IRQ pin으로 전달되기 때문에, 같은 pin으로 묶여 있다면, IRQ를 공유하게된다.<br/>instruction의 실행과 무관한 비동기 익셉션.<br/>IRQ 번호는 미리 정의된 spec으로<br/> IRQ0는 system timer[시간 계산 클럭 펄스(8235)] <br/> IRQ1은 키보드<br/>IRQ3은 com2 com4<br/>IRQ4는 com1 com3<br/>IRQ5 LPT2 또는 사운드카드<br/>IRQ6 플로피디스크<br/>IRQ7은 LPT1 parallel port<br/>IRQ10은 lan card<br/>IRQ12는 ps/2 mouse<br/>이런 식이다.<br/>상세한 것은 /proc/interrupt에서 확인할 수 있다.(android 포함)<br/>$ sudo cat /proc/interrupts<br/>0:       IR-IO-APIC    2-edge      timer<br/>7:       IR-IO-APIC    7-fasteoi   pinctrl_amd<br/>8:       IR-IO-APIC    8-edge      rtc0<br/>9:       IR-IO-APIC    9-fasteoi   acpi<br/>25:      PCI-MSI 4096-edge      AMD-Vi<br/>26:      IR-PCI-MSI 18432-edge      aerdrv<br/>..<br/>41:      IR-PCI-MSI 1048576-edge      xhci_hcd<br/>..<br/>58:       IR-PCI-MSI 1050624-edge      ahci[0000:02:00.1]<br/>...<br/>TLB:        TLB shootdowns<br/>TRM:        Thermal event interrupts<br/>..|
| NMI(Non-markable interrupt)||한 마디로 pending될 수 없는 interrupt이다.<br/>interrupt가 발생하면, RFLAGS의 IF flag가 set되어서, 이후 발생하는 interrupt는 pending 상태가 된다.<br/>arm64에서는 PSTATE의 I flag가 set되어 이후 발생하는 interrupt는 pending 상태가 된다.<br/>하지만 이 interrupt는 깡패처럼 pending 불가로 우선 처리되게 되는 것이다. <br/>x86에서만 있고, aarch64에서는 없다.<br/>※ arm사에서 design하는 interrupt controller인 GIC v3에서는 pseudo-NMI로 비슷하게 동작할 수 있도록 하였다.<br/>즉 PSTAE의 I flag를 set해서, local irq가 disable 될때, psuedo-NMI를 사용하는 interrupt는 허용하도록 하는 방법이다.<br/>kernel v5.3이상에서 CONFIG_ARM64_PSEUDO_NMI=y로 설정해야 한다고 한다.|
||Abort|Abort를 제외한 모든 exception class는 ARM Architecutre Reference Manual ARMv8에 정의되어 있다.|
||SError|Interrupt exception class는 GIC(Generic Interrupt Controller Architecutre) Specification V3에 정의 되어 있다.|


