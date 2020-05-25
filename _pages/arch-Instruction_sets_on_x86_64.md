---
title: "Instruction sets on x86_64"
permalink: /kdb/arch/instruction_sets_on_x86_64/
toc_sticky: true
toc_ads : true
layout: single
---

# Table of content
[Register](#register)      
	1. [General Purpose Register](#1-general-purpose-register)     
	2. [System Register](#2-system-register)         
    3. [Control Register](#3-control-register)       
[Base structure](##base-structure)      

# Register
## 1. General Purpose Register
rax
rbx
rcx
rdx
rsi
rdi
rsp
r8 ~ r15

32bit일때는 eax    
16bit일때는 ax     

The new registers R8 to R15 can be accessed in a similar manner like this: R8 (qword),     
* R8D (lower dword)      
* R8W (lowest word)     
* R8B (lowest byte MASM style, Intel style R8L).       

Note there is no R8H.       

함수의 인자로는 순서대로,       
**rdi**, **rsi**, **rdx**, **rcx**, **r8**, **r9**를 통해 넘겨지고, 인자가 6개 이상이면, stack을 이용한다.       
return 값은 기존과 같이, 하위 8byte는 rax 상위 8byte는 rdx에 담긴다.      
부동소수점의 경우의 인수는 XMM0L, XMM1L, XMM2L 및 XMM3L를 통해서 전달된다.     

스택을 통해 전달한다
## 2. System Register
> **cld**       
RFLAGS register에서 DF flag를 clear한다(0으로 만듬)    
이렇게 되면 string operation을 위해서 index registers(esi나 edi register)를 증가시킨다.    
stos, scas 등과 같은 문자열 연산 instruction에서 사용된다.    
Page table등의 공간을 비울 때도 사용된다.    

> **sti**      
Set Interrupt Flag    
RFLAGS register에 IF(interrupt flag)를 set한다.     
이것은 processor가 IRQ(hardware interrupt)에 응답할 수 있도록 세팅하는것.     

>  **cli**       
Clear Interrupt Flag    
RFLAGS register에 IF를 clear한다.     
IRQ를 pending시킨다.         

## 3. Control Register
[참조](https://en.wikipedia.org/wiki/Control_register)     
> **cr0**     
각 bit(총 32bit다) 별로 다음을 제어한다.    
PE(Protected Mode Enable) bit가 1이면 **protected mode**, 0이면 **real mode**      
MP(Monitor co-processor)     
EM(Emulation): bit가 0이면 x87 FPU를 사용. Bit가 1이면 x87 FPU가 없고, emulation한다는 의미.    
TS(Task switched): Allows saving x87 task context upon a task switch only after x87 instruction used     
ET(Extension type): On the 386, it allowed to specify whether the external math coprocessor was an 80287 or 80387     
NE(Numeric error): Enable internal x87 floating point error reporting when set, else enables PC style x87 error detection      
WP(Write Protect): When set, the CPU can't write to read-only pages when privilege level is 0     
AM(Alignment mask): Alignment check enabled if AM set, AC flag (in EFLAGS register) set, and privilege level is 3    
NW(Not-write through): Globally enables/disable write-through caching     
CD(Cache disable): Globally enables/disable the memory cache     
PG(Paging): bit가 1이면, paging을 활성화 시킨다. 0이면 paging을 disable 시킨다.     
지금으로서는 PE, PG등이 중요하기 때문에, 여기에 집중한다.
다음과 같이,    
```
arch/x86/boot/compressed/head_64.S
/* Enter paged protected Mode, activating Long Mode */
movl    $(X86_CR0_PG | X86_CR0_PE), %eax /* Enable Paging and Protected mode */
movl    %eax, %cr0
```
추가적으로,     
WP를 clear하면, read-only page에도 write할 수가 있다.     
**보호모드와 paging을 동시에 활성화 시키는데, cr0를 사용하고 있다.**    
64bit에서는 상위 32bit는 0으로 설정하고, 나머지 32bit만 사용한다.      
CR0, CR4, CR8 레지스터는 64비트 확장 시, 상위 32비트는 0으로 설정 해야 함    
CR2 레지스터는 64비트 모드 사용 가능, CR3 레지스터는 비트[51:40]은 0으로 설정 해야 함     

> **cr1**     
Reserved, the CPU will throw a #UD exception when trying to access it.    

> **cr2**     
Paging fault 발생 시 page fault가 발생한 linear address(segmentation으로 얻어진 가상주소)가 저장되는 레지스터     

> **cr3**     
페이지 디렉터리의 물리 주소와 페이지 캐시에 관련된 기능을 설정     

> **cr4**      
프로세서에서 지원하는 확장 기능을 제어, 페이지 크기 확장, 메모리 영역 확장 등의 기능을 활성화     
PAE(Page Address Extension)을 활성화     

> **cr8**      
x64에서 cr8이 추가되었다.     
테스크 우선 순위 레지스터의 값을 제어, 프로세스 외부에서 발생하는 인터럽트 필터링, IA-32e 모드만 접근 가능.        

# Base structure
suffix b: 1 byte    
suffix w: 2 bytes    
suffix l: 4 bytes     
suffix q: 8 bytes     

shl:     
Logical shift left    
왼쪽으로 amount bit만큼 shift한다.    
Arithmetic left shift와 logical left shift는 같다.     
즉 shl == sal    

shr:
Logical shift right    

sar:    
Arithmetic shift right      
msb 유지      

shl:     
Logical shift left 왼쪽으로 amount bit만큼 shift한다.     
Arithmetic left shift와 logical left shift는 같다.     
즉 shl == sal     

x87:     
x86에서 floating-point관련 부분을 의미한다.      


