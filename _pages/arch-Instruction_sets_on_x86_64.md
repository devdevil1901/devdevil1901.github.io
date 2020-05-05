---
title: "Booting"
permalink: /kdb/arch/instruction_sets_on_x86_64/
toc_sticky: true
toc_ads : true
layout: single
---

# Operation mode on x86
UEFI로 인해서, 생략된 감도 있지만,    
x86에서 부팅 과정이라는 것은,    
real에서 protected로 그리고 IA-32e로의 전환 과정이다.   
때문에 먼저 operation mode를 이해할 필요가 있다.    
다음의 5가지 operation mode가 존재하고, control register와 interrupt로 mode 전환이 가능하다.   

1. Real mode
boot 초기 상태의 모드이다. 16bit로 동작한다.   
최대 1M의 주소 공간을 지원한다. 이전의 8086의 memory bus가 20bit였기 때문에 2의 20승 == 1M가 되었다.   
예전 windows 전의 MSDOS가 바로 real mode.   
2. Protected mode
32bit로 동작. 2의 32승 즉 4G의 memory공간 지원.   
real, system management, IA-32e, virtual 8086으로 전환 가능한 mode이다.   
3. IA-32e mode
AMD에서는 Long mode.   
32bit compatible mode와 64bit mode가 존재한다.   
이론적으로는 2의 64승, 16EB 주소 공간을 지원한다. (나중에 살펴 보겠지만, 전부 쓰지 않는다)   
4. system management mode
전원 관리나 hardware 제어등의 특수 기능을 제공한다.   
5. virtual 8086 mode
protected mode내부에서 가상의 환경을 설정하여 Real mode처럼 동작.   

## 1. Real mode
전원이 들어오고, CPU에서 실행되는 첫 번재 명령어의 위치는 0xFFFFFFF0에 위치한다.    
2의 20승 즉 1M의 메모리를 가진 real mode보다 큰 주소이다.    
이것은 0xFFFE 0000 ~ 0XFFFF FFFF 에 128K의 롬이 주소 공간에 맵핑되기 때문이다.   
즉 맨 처음 CPU가 시작하는 주소는 바로 ROM이다.    
즉 0xFFFFFFF0에서 bios로 jmp하게 된다.    



