---
title: "BIOS/UEFI"
permalink: /kdb/arch/bios_uefi/
toc_sticky: true
toc_ads : true
layout: single
---

# BIOS
mainboard의 EEPROM(Electrically Erasable Programmable ROM)이나 flash memory같은 비휘발성 메모리에 존재하는 software, 즉 일종의 firmware이다.   
좁은 의미로는 legacy mainboard firmware라고 볼 수 있고, 크게는 mainboard firmware라고 볼 수 있다.   
최근에 사용되는 UEFI의 경우는 BIOS/UEFI로도 표기한다.   
전원이 들어오면, 가장 먼저 실행하는 코드가 바로 BIOS로서 다음의 역활을 수행한다.   

* Boot option이나 system 설정 값 저장 및 변경등의 관리   
* POST(power-on self Test) 수행   
* hardware관련 초기화 작업을 수행한다.    
* booting    

Real mode에서 동작하는 이 bios interrupt의 handler는 4 byte에 담겨있다.   
이 bios interrupt call의 최대 개수는 256개이다.   
OS의 bootloader는 이것을 이용해서, firmware를 이용한다.   
<pre>
arch/x86/boot/tty.c   
intcall(0x10, &ireg, NULL);   
video-vga.c:    
intcall(0x10, &ireg, &oreg);   
arch/x86/boot/bioscall.S    
.type intcall, @function intcall: .. /* Actual INT */    
.byte 0xcd /* INT opcode */    
.byte 0
</pre>

대표적인 것들은 다음과 같다.
|||
|---|---|
|int 0x00|Devide by zero|
|int 0x01|Single step for debugging|
|int 0x02|NMI(Non-Maskable Interrupt)|
|int 0x11|device list를 반환|
|int 0x12|memory 크기를 반환|
|int 0x13|Disk I/O service|

# POST
쉽게 말해서, PC 부팅하면서 삐소리 내는 부분이다.   
주로 Hardware가 정상인지 검사하는 부분.  
Hardware에서 문제 있다면, Fatal Error를 software에서 문제가 있다면, Non Fatal Error를 발생시킬 수 있다.   

POST 작업의 책임은 다음과 같다.   

* Verify CPU registers.    
* Verify the integrity of the BIOS code itself.    
* Verify some basic components like DMA, timer, interrupt controller.   
* Find, size, and verify system main memory.    
* Initialize BIOS
* Identify, organize, and select which devices are available for booting.

POST 작업 후에 삐 소리가 나면서, 결과를 나타낸다.   

짧은 신호음이 울리면 POST 작업 성공을 의미,   
짧은 신호음이 2개일때는 오류를 나타낸다.   





