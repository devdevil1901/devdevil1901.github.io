---
title: "Instruction sets on aarch64"
permalink: /kdb/arch/instruction_sets_on_aarch64/
toc_sticky: true
toc_ads : true
layout: single
---

# Table of content
[Exception Level](#exception-level)     
[Basic structure of instruction on aarch64](#basic-structure-of-instruction-on-aarch64)      
[Register](#register)      
	1. [General purpose register](#1-general-purpose-register)      
		1. [Integer operation](#11-integer-operation)      
		2. [FP and SIMD Operation](#12-fp-and-simd-operation)      
		3. [Vector OperationPermalink](#13-vector-operation)      
	2. [Special Purpose RegisterPermalink](#2-special-purpose-register)      
	3. [System Register Access Register](#3-system-register-access-register)         
	4. [System Register](#4-system-register)      
		1. [Exception Handing Register](#41-exception-handling-register)      
[Instruction set](#instruction-set)      
	1. [Data Processing](#1-data-processing)      
		1. [Arithmetic](#11-arithmetic)      
		2. [Logical](#12-logical)      
		3. [Bit Maniplulation Instructions](#13-bit-maniplulation-instructions)      
		4. [Comparison](#14-comparison)      
		5. [Memory Load](#15-memory-load)      
[References](#references)      

# Exception Level
Coretex-a7에서 Priviledge level 처럼 EL0~ EL3의 4가지 Exception Level이 도입되었다.    
EL0 와 EL1은 secure 와 non-secure    
EL2는 hypervisor level이고, non-secure mode에서만 존재한다.    
EL3는 highest priority level이고, secure mode에서만 존재한다.    
    
|level|non-secure mode|secure mode|
|---|---|---|
|el0|User level application||
|el1|Kernel or Guest OS|TEE|
|el2|Hypervisor OS|X|
|el3|X|Secure Monitory|

EL2와 EL3는 optional하게 되어 있다.    
TEE나 virtualization을 사용하기 위해서는 당연히 활성화 되어 있어야 한다.   
Non-secure mode와 secure mode 사이의 전환은 EL3가 담당한다.    
IRQ나 Secure Monitor Call(SMC)를 통해서 EL3에 진입할 수 있다.    
Exception이 발생하면 동일 레벨이나 상위레벨로 전달되기 때문에 EL0에서의 exception은 EL0에서는 처리할 수 없다.    

# Basic structure of instruction on aarch64   
instruction set를 이해하기 위해서 instruction set의 표현기법을 알아보도록 하자.    

* Rd, Rn, #imm   
**Rd**는 Xd or Wd   
즉 destination으로 사용되는   
General Purpose Register를 의미한다.   
즉 R은 can be either W or X    
**Rn**은 Xn or Wn   
operation으로 사용되는 General Purpose Register를 의미한다.   
X31이나 W31이 사용되면, Zero Register로 취급된다.   

* Rd, Rn, Rm{shift #amount}  
Rm에 대해서, shift 연산을 적용하고,Rn과 연산한 값을 Rd에 저장하라는 의미이다.   
shift 부분에는 LSL, LSR, ASR 중에 하나가 들어간다.(ASL은 LSL과 같다)   
**LSL**은 Logical Shift Left 왼쪽으로 amount bit만큼  shift한다.   
signed/UnSigned 모두 적용된다.   
예를 들면은   
mov w2, #0   
mov w3, #2   
add w1, w2, w3, lsr #1   
2를 오른쪽 으로 1bit shift하면 1이다.   
w3은 1이되고, w2는 0이니까 w1은 1이된다.   
즉   
add w1, w2, w3, lsr #1     
w1 = w2 + (w3 >> 1)   

**LSR**은 Logical Shift Right로 오른쪽으로 amount bit만큼  shift.   
마지막으로 밀려난 bit는 c flags에 저장된다.   
UnSigned에 저장된다.   
**ASR**은 arithmetic shift right 오른쪽으로 amout bit만큼 shift.   
마지막으로 밀려난 bit는 c flag에 저장된다.   
Signed에서 사용된다.   
LSR과 같지만, msb는 유지된다는 점이 다르다.   
예를 들면,   
mov w1, #-3   
mov w2, #-1   
add w0, w2, w1, asr #1    
-3을 asr >> 1 하면 -2가된다.      
111111111111111111111111 == -1    
111111111111111111111101 == -3    
111111111111111111111110 == -2    
즉 -1 + -2면 = w0은 -3이된다.    
nzcv는 전부 clear이다.   
- - 인데 +가아니기 때문에 overflow는 clear   
w1, asr #1은    
오른쪽으로 마지막으로 밀려난 bit가 1이다.   
111111111111111111111101 == -3   
즉 이 값이 carry flag에 들어가야 한다.   
add만으로는 어떤 flag도 update하지 않는 것을   
확인할 수 있다.   
mov w1, #-3    
mov w2, #-1   
adds w0, w2, w1, asr #1   
add를 adds로 바꾸면,    
w0이 negative이기 때문에, n flag와,   
w1, asr #1때문에 c flag가 켜진다.    
(gdb) info r cpsr   
cpsr 0xa0000000    
10100000000000000000000000000000    

* Xd|SP, Xn|SP, Rm{, extend {$amount}}   
Extending shift를 의미한다.   
register의 size를 확장한다.   
**u**로 시작하는 것은 **UnSigned**를   
**s**로 시작하는 것은 **Signed**를 의미한다.   
**b**로 끝나는 것은 **Byte**   
**h**로 끝나는 것은 **Half Word**   
**w**로 끝나는 것은 **Word**    
amount가 없다면 **0**으로 취급된다.   
amount가 있다면 amount bit만큼 left shift한다.   
Rm이 Xm이라면, LSL | uXTX or SXTX가 올수 있고,   
Rm이 Wm이라면, 나머지가 올수 있다.   
즉 sxtx의 경우 destination register가 X로 와야 하는 것을 의미한다.   
sxtx x0, x1   
예를 들면,   
mov w1, #-1   
mov x0, #0   
add x0, x0, w1, sxtw #2   
(gdb) info r x0   
x0 0xfffffffffffffffc -4   
sxtw니까 sign_extend이다. word만큼   
word는 arm64에서는 4byte이다.(x64에서는 2 byte이지만)   
111111111111111111111111   
즉 word만큼 부호를 확장하면 다음과 같다.   
111111111111111111111111 111111111111111111111111    
left shift를 2bit하면    
111111111111111111111111 111111111111111111111100    
즉 -4가 된다.   
즉 0 + -4는    
-4가 된것이다.    
**uxtb**: unsigned로 (0)으로 8 bit 확장한다.      
**uxth**: unsigned로 (0)으로 16bit 확장한다.   
**uxtw**: unsiged로(0)으로 32bit 확장 한다.   
**Lsl | uxtx**: unsigned로 (0)으로 64bit 확장한다.   
**sxtb**: signed(1)로 8bit 확장한다.    
**sxth**: signed(1)로 16bit 확장한다.    
**sxtw**: signed(1)로 32bit 확장한다.    
**sxtx**: signed(1)로 64bit 확장한다.     

* cond   
예를들면    
b.cond label   
이런 식으로 조건부 실행을 의미한다.   
Branch와 data processing instruction에서 이렇게 conditional을 봐서 조건부로 동작하는 것이 가능하다.   
이렇게 flag를 넣는 이유는 이것을 **flag가 아니라 계산으로 처리하고 하면 성능 성의 큰 손해가 발생**하기 때문이다.    
상세한 flag는 다음을 참조하자.   
[3.Conditional Code](https://devdevil1901.github.io/kdb/arch/basic_of_instruction_set)   

* invert(cond)   
cond의 반대를 의미한다.   

* Rt1, Rt2, [Xn|SP{, #imm}] Rt1, Rt2, [Xn|SP, #imm]!    
Pair register를 Xn이나 sp로 저장하거나,   
sp나 xn의 값을 pair register로 로드한다.   
imm부분이 없다면 default인 0이다.     
**Rt1,Rt2** Pair instruction에 사용되는 두개의 register를 의미한다.    
**!**의 경우는 이게 있으면 pre-index, 없다면, post index.    
**uimmn**은 UnSigned Immediate 값 즉 상수.    
**simmn**은 Signed immediate 값.    


# Register
## 1. General purpose register

### 1.1 Integer operation
integer값 계산을 위한 register이다.   
64bit의 경우 x0~x30 까지 제공.   
32bit의 경우 w0~w30.   
예를 들어   
<code>ADD w0, w1, w2</code>
여기서 w의 경우, register 자체는 64bit 이지만, upper 32bit를 무시하고 사용하는 것이다.   


* **parameter register**
```
w0~w7   
x0~x7   
```
32bit와 비교해서 개수가 x2가 됨.   당연히 x0, w0 return value로도 사용된다.   

* **temporary register**
```
x8~x18   
w8~w18   
```

말 그대로 자유롭게 사용할 수 있는 register   

* **intra procedure**
```
x16,x17
w16,w17
```

IP0와 IP1이라고 부른다.   
이전에 thumb에서 처럼 한번에 못 뛰어서, 중간에 한번 더 뛰도록 linker가 한번 더 뛰도록 삽입한 코드.   
arm32에서 링커가 코드에 삽입하는 vaneer와 유사한 역활.   
aarch64가 4byte로 정렬되는 instruction이기 때문에, 64bit 가상 메모리 주소를 한번에 뛰지 못하는 것을 기억하자.   

* **Callee saved register**
```
x19~x28
w19~w28
```
한 마디로 임의 사용 레지스터이다.   
Callee쪽에서는 전혀 신경쓰지 않고, Caller 쪽에서, stack에 백업해 놓고, 호출 완료 후 복구 해서 써야 한다.   

* **Frame Pointer(FP)**
```
x29
w29
```

stack pointer를 저장해 놓는 register.

* **Link Register(LR)**
```
x31
w31
```

* **Stack Pointer** or **Zero Register**
```
x31, zxr
w31, wzr
```

Instruction에 따라서, xzr, wzr 즉 zero register로 해석되거나, stack pointer로 해석된다.   
Zero Register이면, source로 사용하면 0으로 읽혀지고, dest로 사용하면 값이 버려진다.   


### 1.2 FP and SIMD Operation

**8 bit b0~b30**   
**16bit h0~h30**   
**32bit s0~s30**   
**64bit d0~d30**   
**128bit q0~q3**   

<code>FADD s0, s1, s2</code>

### 1.3 Vector Operation
<code>v0~v20</code>    

정수연산이면, 
Add v0.2D, v1.2d, v2.2d   
floating point라면,   
FAdd v0.2D, v1.2d, v2.2d
simd에서도 마찬가지로, vector 를 표현하는데, v0~v20을 사용한다.   
v0.2d   
v9.S[1]   
v1.4S[1]   
이런식으로 표현되는데,   
**8bit는 B**      
**16bit는 H**      
**32bit는 S**      
**64bit는 D**      

로서 바로 위 for floating point and SIMD에서와 동일하다.   

## 2. Special Purpose Register

* **PC(Program Counter)**
armv7과는 다르게, aarch64에서는 pc는 general purpose register가 아니다.   
더이상 data processing instruction에서 사용할 수 없다.   
다음과 같은 식으로 읽어야 한다.   
<code>ADR x1, .</code>   
Dot(.)의 의미는 here의 의미이다.   
adr이외에도 몇몇 branch instruction과 몇몇 load/store에서도 암시적으로 pc를 읽을 수 있다.   
이 효과로 복귀에 대한 예측이 쉬워지고, ABI의 스펙이 심플해짐.   
보안 적으로도 크게 의미가 있는 design임.    

* **Stack Pointer**
```
sp_el0
sp_el1
sp_el2
sp_el3
```

Exception level에 따른 stack pointer를 가르킨다.   
매우 편리한 점이, SPsel register의 값이 0이면, exception level과 상관없이, sp_el0을 사용한다.   
이 설정에 따라서, exception handler vector의 위치도 같이 변한다.   
SPsel이 1이면, 각 exception level에 맞게 sp_eln을 사용하게 되는데,    
linux kernel에서는 SPsel의 값을 바꾸지 않고 그냥 1인 채로 사용하고 있다.   

* **Exception Link Register**
```
elr_el1
elr_el2
elr_el3
```

Exception에서 복귀 시 돌아갈 위치를 저장한다.   
복귀 시에 pc에 이 값을 복사하게 된다.   

* **Save Process Status Register**
```
spsr_el1
spsr_el2
spsr_el3
```

Exception이 발생하면, PSTATE 로 부터 SPSR 레지스터에 백업된다.   
Exception에서 복귀할 때는 프로세서에 의해서 PSTATE로 복귀된다.   
PSTATE 는 Processor State의 약자.   
exception에서 복귀할때는 pc와 pstate를 복귀해 줘야하는 것이다.   
32bit register로서, 상세한 설명은    
[2.3 SPSR Register](https://github.com/devdevil1901/devdevil1901.github.io/blob/master/_pages/basic_of_instruction_set.md)   
를 참조하자.

## 3. System Register Access Register
* **MRS**   
Move Register To Status   
r즉 load, 즉 system register에서 값을 읽어 온다는 의미.   
System register를 General purpose register에 읽어온다.   
<code>Mrs xn, <system register></code>   
예를 들어서, conditional flag를 확인하게 위해서, printf로 찍는 code로 활용한다고 하면, 다음과 같다.   
```
showFlags:
        stp  x29, x30, [sp, -16]!
        mrs x1, NZCV
        adrp x0, msg
        add  x0, x0, :lo12:msg
        bl   printf
        ldp  x29, x30, [sp], 16
        ret
.section .rodata
.balign 4
msg:
        .asciz "Result: %p\n\0"
```

* **MSR**   
Move Status To Register   
s는 save즉 저장이다. 즉 system register에 write한다는 의미.   
General purpose register를 system register에 쓴다.   
이것을 Conditional flag를 clear 하는 용도로 사용한다고 하면 다음과 같다.   
```
clearFlags:
        mov x0, #0
        msr NZCV, x0
        ret
```

## 4. System Register
System register는 processor가 system을 control하기 위해 사용한다.   
Exception handling이나, MMU의 제어와 같은 것들이다.   
System register의 값은 data processing register나,   
load/store instruction으로는 제어할 수 없고, Xn register에 담아서 읽고,    
변조 후 그 값을 system register에 반영하는 식으로 제어해야 한다.   
읽기는   
mrs x1, <system register>   
쓰기는   
msr <system register>, x1   

* **NZCV**   
64bit register로서, NZCV flag를 저장하고 나머지 bit는 reserved이다.  
상세한 내용은 다음을 참조하자.   
[2.2 NZCV](https://github.com/devdevil1901/devdevil1901.github.io/blob/master/_pages/basic_of_instruction_set.md)   

* **Auxiliary Control Register**   
```
actlr_el1
actlr_el2
actlr_el3
```

Auxiliary 어그질러리 가 뜻이다(조동사할때 쓰는 단어이다)   
즉 보조 Control register.   
Processor-specific feature를 control한다.   

* **Current cache size id register**   
```
ccsidr_el1
```
Provides information about the architecture of the currently selected cache   

* **Hypervisor call**   
<code>hvc</code>   
Guest OS에서 Hypervisor 서비스를 요청할 때 쓰이며,   
Level 상승이 필요하므로 당연히 exception을 발생시킨다.     
(el1 -> el2)   
일종의  system call이다.   

* **Supervisor call**   
<code>svc</code>   
User mode의 application이 OS 서비스를 요청할 때 쓰인다.   
Level 상승이 필요하므로 당연히 exception을 발생시킨다.   
svc는 기존 arm의 supervisor mode와 비슷하다.   
그리고 system call 개념과 동일하다.   
정식 aarch64에서도 system call이라고 부르고 있다. 그냥 동일.   
즉 malloc -> libc malloc() -> el1(kernel) sys_brk   
mov x1, #45   
svc 01   
이렇게..   
el0 -> el1을 호출하려면 svc   
el1에서 el2를 호출하려면 hvc.   
el2에서 el3를 호출하려면 smc.   
el1에서 el3를 호출하려면 smc   
높은 EL에서는 낮은 EL을 el 변화없이 접근할 수 있다.   

* **Security Monitor call**   
```smc```   
Non-secure mode에서 secure mode의 서비스를 요청할 때 쓰인다.    
이것도 Exception으로 취급된다.    
일종의 system call이다.    


### 4.1 Exception Handling Register
* **Exception Syndrom Register**   
```
esr_el1
esr_el2
```
동기 exception에서 exception의 발생 원인을 저장한다.  
발생 원인을 Syndrome information이라고 한다.    
이 register가 어떤 것인지는 aarch64의 el1_sync_handler()를 보면 명확히 알수 있다.   
```
arch/arm64/kernel/entry-common.c
asmlinkage void notrace el1_sync_handler(struct pt_regs *regs)
{
	unsigned long esr = read_sysreg(esr_el1);
	switch (ESR_ELx_EC(esr)) {
	case ESR_ELx_EC_DABT_CUR:
	case ESR_ELx_EC_IABT_CUR:
		el1_abort(regs, esr);
		break;
	case ESR_ELx_EC_PC_ALIGN:
		el1_pc(regs, esr);
		break;
	case ESR_ELx_EC_SYS64:
	case ESR_ELx_EC_UNKNOWN:
		el1_undef(regs);
		break;
	case ESR_ELx_EC_BREAKPT_CUR:
	case ESR_ELx_EC_SOFTSTP_CUR:
	case ESR_ELx_EC_WATCHPT_CUR:
	case ESR_ELx_EC_BRK64:
		el1_dbg(regs, esr);
		break;
	default:
		el1_inv(regs, esr);
	};
}
```
동기화 exception의 원인을 알아내어 적당한  handler로 분배할 수 있도록 하는 것.   
또한 debugging 역시 이를 통해 구현되고 있다.   

* **Falut Address Register**   
```
far_el1
far_el2
```

동기 exception에서 발생한 주소를 저장한다.   

* **Exception Return**   
```
eret
```

Exception 처리를 끝내고 복귀시킨다.   
spsr_eln을 PSTAE로 복원하고, elr_eln에서 return주소를 가져와서 PC에 로드한다.    

* **Vector based address register**   
```
vbar_el1
vbar_el2
vbar_el3
```

Exception Handler들을 담고 있는 vector table의 주소를 담고 있다.   

# Instruction set

## 1. Data Processing
### 1.1 Arithmetic
#### ADD and ADDS   
```
ADD Rd|SP, Rn|SP, Rm{, extend {#amount}}    
ADD Rd|SP, Rn|SP, #imm{, shift}    
ADD Rd, Rn, Rm{, shift #amount}   
```
**중요한것은 ADD는 NZCV를 갱신하지는 않는다.**   
**ADDS는 NZCV를 갱신한다**   
CMN(Compare Negative)가 사실은 ADDS의 alias이다.   

#### ADC and ADCS     
```ADC Rd, Rn, Rm```   
Add With Carry이다.   
ADD와 같지만, 만약 carry flag가 set되어 있다면, 이 값 마져 더한다.    
ADCS는 계산후에 NZCV를 갱신한다.   

#### SUB and SUBS
```
SUB Rd|SP, Rn|SP, Rm{, extend {#amount}}
SUB Rd|SP, Rn|SP, #imm{, shift} 
SUB Rd, Rn, Rm{, shift #amount}
```

#### SBC and SBCS   
Substract With Carry.   

#### MUL   
Multiply   
```
mul rd, rn, rm
rd = rn x rm
```

#### MADD   
Multiply ADD    
```
madd rd, rn, rm, ra
rd = ra + rn × rm   
```
정말 RISC 스러운 instruction이다.   
앞에 두개를 곱한뒤 뒤의 것을 더한다.   
M prefix가 붙은것은 4개의 register가 있는데 가운데 것을 곱한다고 생각하면 된다.   

#### MSUB   
Multiply substract   
```
msub rd, rn, rm, ra
rd = ra - (rn x rm)   
```

#### MNEG   
Multiply Negative    
```
mneg rd, rn, rm
rd = - (rn x rm)    
```   

#### NEG, NEGS   
Negate, shifted register가 올수도 있고, 그냥 register가 올수도 있다.   
이것은 사실 sub의 alias이다.    
NEGS는 subs의 alias이다.   
```
neg rd, op2   
rd = -op2   
예를 들면   
NEG <Wd>, <Wm>{, <shift> #<amount>}    
은    
SUB <Wd>, WZR, <Wm> {, <shift> #<amount>}   
과 같다. zero register에서 빼기 때문에... 무조건 그 값으로 -가 되는 것.    
neg     tmp3, tmp1, lsl #3    
tmp1을 3bit만큼 left shift 해서, tmp3에 저장하라.    
```

#### NGC, NGCS   
Negte With Carry   
SBC의 alias, SBCS의 alias이다.   
```
ngc rd, rm   
ngcs rd, rm  
rd = -rm  - ~C   
NGC <Xd>, <Xm>    
은   
SBC <Xd>, XZR, <Xm>   
과 같다.   
```
즉 carry값을 추가로 빼준다.   

#### SMADDL
Signed Multiply-add long    

#### SMNEGL
Signed Multiply-negte long    

### 1.2 Logical
#### AND, ANDS
```
and  Rd|SP, Rn, #imm
and  Rd, Rn, Rm{, shift #amount}
Rd = (rn and imm) or (rn and rm)
```

#### BIC, BICS
Bitwise bit Clear    
```
bic  Rd, Rn, Rm{, shift #amount}
Rd = Rn and Rm
```
BICS는 NZCV를 갱신.     

### 1.3 Bit Maniplulation Instructions
#### BFM
Bitfield move
```
bfm  Rd, Rn, #immr, #imms
```
#### BFI
Bit Field Insert    
BFM의 alias이다.    
결국 dest register의 bit값을 변경한다.    
Src register의 index가 0을 가정하고 있다.   
Bfi w0, w1, #9, #6   
w1의 0~5bit를 w0의 9~14bit까지 overwirte한다.   
즉 dest, src, dest index, src의 bit크기   
Bfi dst, src, dst bit index, src bit 크기     
즉 source index 의 경우는 source register의 0bit부터 크기를 가정하고 있다.     
w0 register의 3번째 bit를 5bit만큼 clear하고 싶다면,     
bfi w0, wzr, #3, #5     
즉 w0의 3~7 bit가 clear되서 0이된다.    
Wzr즉 rero register를 이용했음을 기억하자.    

```
bfi  Rd, Rn, #lsb, #width
```
#### UBFX
Unsigned bit field extract      
결국 dest register의 bit값을 변경한다.    
Dst register의 index가 0을 가정하고 있다.    
Ubfx w0, w1, #18, #7     
w1의 17 bit 부터 7bit 만큼을    
w0의 0~6bit에다가 overwrite한다.    

#### ROR
Rotate Right       
((unsigned) x >> y | (x << (32 – y)    
밀려난 bit는 c flag에 저장.    
먼가 되게 어려워 보이지만, 별거 아니다.    
1인 값들을 오른쪽으로 1bit 이동 시키는 것이다.    
다만 밀려나면 반대쪽에서 나온다. 뫼비우스의 띠처럼.    
0001 0001   
을 ror하면,    
1000 1000     
이되고, 한번 ror하면     
0100 0100     
이 되는 셈.     

### 1.4 Comparison
#### CMN
ADDS의 alias이다. 다만 더해진 값은 버리고, compare negative만을 한다.    

#### CCMN
Conditional compare negative    
비교 결과를 conditional flag에 set한다.    
타 instruction과 마찬가지로 Rn다음에 imm이나 Register둘다 올수있다.     
CCMN Wn, Wm, #uimm4, cond    
NZCV = if cond then CMP(Wn,-Wm) else uimm4.     
CCMN Xn, Xm, #uimm4, cond     
NZCV = if cond then CMP(Xn,-Xm) else uimm4.      
PRD03-GENC-010197     
CCMN Wn, #uimm5, #uimm4, cond    
NZCV = if cond then CMP(Wn,-uimm5) else uimm4.     
CCMN Xn, #uimm5, #uimm4, cond    
NZCV = if cond then CMP(Xn,-uimm5) else uimm4.      
nzcv는 0~15의 값이다. NZCV의 bitmask이다.     
Bit3은 n, BIT2는 Z, bit1은 C, bit 0은 V이다.     
ccmn w26, w3, #0x7, mi // mi = first     
ccmn x0, #0x4, #0x0, hi    
hi는 (C==1) && (Z==0) 일때 true이다.    
ccmn w0, #0x1, #0x0, ne     

### 1.5 Memory Load
#### ADR
```
ADR Rd, label
```
PC-relative offset의 label주소를 로드한다.    
label은 pc +/- 1M를 지정할 수 있다.    
단순히 Xd에 label의 pc relative offset을 저장한다.    
adr x0, addrmsg    
adr x1, setNBit    

#### ADRP
ADR과 같지만, label에 +/- 4G의 offset을 저장할 수 있다.    

#### ADRL
Sudo-instruction이다.    
사실은 두개의 instruction으로 구성된다.     
adrp와 add이다.    
때문에 더 큰 주소 범위를 담을 수 있고,     
pc에 의해서 계산되서, relocation 코드로 적용되기 때문에, position independent한 코드를 생성할 수 있다.    
sudo-instruction이라서, objdump로는 볼 수 없다.     
b0000301 adrp x1, 461000 <errstring.11975+0x10>     
910a4021 add x1, x1, #0x290     
f00003e0 adrp x0, 47f000 <__progname_full>      
91286000 add x0, x0, #0xa18     

# References
[aarch64 official](http://infocenter.arm.com/help/index.jsp?topic=/com.arm.doc.ddi0488c/CIHIDFFE.html)   
[instruction description](https://static.docs.arm.com/ddi0596/a/DDI_0596_ARM_a64_instruction_set_architecture.pdf)   
[armv8 a64 quick reference](https://courses.cs.washington.edu/courses/cse469/19wi/arm64.pdf)    

instruction 검색해 보기 좋은 곳    
[search](http://infocenter.arm.com/help/index.jsp?topic=/com.arm.doc.dui0802a/ADDS_addsub_ext.html)     

