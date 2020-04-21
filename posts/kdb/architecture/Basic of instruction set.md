instruction set을 이해하기에 앞선 선행 지식들을 정리 한다.
x86_64와 aarch64를 기준으로 설명하며, x86과 aarch64에서 공통적인 부분들을 추려보았다.

# Data Type

|Type|Size on x86_64|size on aarch64|
|---|:---:|---:|
|Byte|8 bit|8 bit|
|Half-word||16 bit|
|Word|16 bit|32bit|
|Double-word|32 bit|64 bit|
|Quad-word|64 bit|128 bit|

# Signed vs UnSigned

Signed는 negative 즉 음수도 포함하는 값, Unsigned는 양수만의 값.
Signed char는 -128~+128까지를 저장할 수 있고, 
Unsigned char의 경우는 0~256까지를 저장할 수 있게 되는 것.

즉 Unsigned가 양수라면, 2배를 담을 수 있다.(그래서 hexa값을 unsigned에 담는 것이다)
signed는 부호를 표현하기 위해서, 다음과 같이 msb(마지막 bit)를 사용한다. positive(+)는 0, nagative(-)는 1이다.

## 1. MSB(Most Significant Bit)
signed bit  즉 부호를 표현하는 bit이다.
8bit가 있다고 하면 다음과 같이, 7번째 bit가 부호bit가 된다.
msb가 1이면, negative 즉 음수.

|MSB(7)|6|5|4|3|2|1|LSB(0)|
|---|---|---|---|---|---|---|---|

## 2. Negative expression of signed
10진수에서는 +/- 기호를 이용하지만, 2진수에는 signed에서 음수를 표현하기 위해서는 크기를 표현하는 marking을 1로 볼것이냐 0으로 볼 것이냐로 구분된다.
positive(양수)에서는 1이 값을 marking하지만, nagative에서는 0이 값을 marking한다.

<pre>
2진수로 9는  0000 1001 이다.
      -9는  1000 1001 일것 같지만,
           1111 0111 이다.
</pre>

즉 크기 8을 나타내는 부분이 0으로 marking되었다. 그렇다면 왜 -1이 더된 것일까?
1111 1111이 0이 아니라, -1이기 때문이다.

다음 표를 참조하자.
|10진수|이진수|16진수|
|---|---|---|
|8388607|011111111111111111111111|0x007fffff|
|1|0000 0000 0000 0000 0000 0001|0x00000001|
|0|000000000000000000000000|0x00000000|
|-1|111111111111111111111111|0xffffffff|
|-2|111111111111111111111110|0xfffffffe|
|-3|111111111111111111111101|0xfffffffd|
|-4|111111111111111111111100|0xfffffffc|
|-8388608|100000000000000000000000|0xff800000|

# Shift

* Logical shift
일반적인 bit shift로서 밀린 bit는 보통 0으로 채워진다.

* Arithmetic Shift
2의 제곱수와 관련된 곱셈과 나눗셈을 연산할 때 사용된다.
Logical shift와 bit를 이동한다는 점은 같으나, logical의 경우는 부호bit가 보존되지 않지만, arithmetic shift의 경우는 부호 bit가 보존된다는 차이가 있다.
left shift의 경우는, 0으로 채우기 때문에 logical shift와 같다.
right shift의 경우도 부호 bit 빼고는 같다.

# Conditional flags

x86에서는 FLAGS register(16bit), EFLAGS(32bit) register, RFLAGS(64bit) register에서 확인할 수 있다.

arm에서는 cpsr, spsr register가 있었다.
aarch64에서는 PSTATE register가 있고, 이것을 저장하는 spsr_eln register가 존재 한다. (n은 1,2,3 0은 없음)
 
## 1. carry and overflow
간단하지만 헷갈리는 부분이 carry와 overflow이다. 인터넷에 있는 자료들중 태반의 설명이 잘못되어 있는 것을 확인하였다 때문에 예제를 들어 자세히 정리한다.

간단하게 정리해서, carry는 **올림**이 발생하는 현상으로 **unsigned** 에서만 의미가 있다.
overflow는 연산으로 부호 bit가 변하면 발생하는 현상으로 **signed**에서만 의미가 있다.
하지만 기억해야 할 것은 ALU나 FPU등이 flag를 set할때는 이 값이 signed 인지 unsigned인지는 알고하는 것은 아니라는 것이다.

carry가 발생하는 조건은 현재 자료형의 최대 값을 초과하는 올림이 발생했느냐는 것이다.

11 + 15 = 26이다.
이것을 2진수로 계산해 보자.
<pre>
  1011
+ 1111
 11010
</pre>

carry가 발생 했을까? 이 계산을 한 register가  1 byte짜리라면 맞다 하지만, 4 byte register였다면 아니다.
1011은 0000 0000 0000 1011 이기 때문이다

다음과 같이 4byte에서 덧셈으로 올림이 일어나는 경우는 다음과 같다.
65531 + 4

  1111 1111 1111 1011
+ 0000 0000 0000 0100                        
 11111 1111 1111 1111
4byte를 초과하는 값이 발생했는데 이값을 담는 레지스터는 4 byte여서 가장 위의 값인 1은 담을 수가 없게 되었다.
대신 carry flag를 set하는 것이다.

-1 + -1은 어떻게 될까?
<pre>
   1111 1111 1111 1111 1111 1111 1111 1111
   1111 1111 1111 1111 1111 1111 1111 1111
(1)1111 1111 1111 1111 1111 1111 1111 1110
</pre>
-2가 되었기 때문에 n flag가 set되고, carry가 발생 하였다.

-1 + 0
1111 1111 1111 1111 1111 1111 1111 1111

지금까지는 간단했지만,
3 + -1을 생각해 보자.
10진수로 했을 경우에는 2가 되기 때문에, carry는 발생하지 않을 것 같지만 그렇지 않다.

<pre>
   0000 0000 0000 0000 0000 0000 0000 0011
   1111 1111 1111 1111 1111 1111 1111 1111
 1 0000 0000 0000 0000 0000 0000 0000 0010
</pre>

이것이 3-1을 했을때 carry flag가 set되는 이유이다.
실제로 다음과 같은 코드에서는 carry flag가 set된다.

<pre>
mov x0, #3
cmp x0, #1
</pre>

overflow는 두 연산에서 **부호가 같은데** 연산의 **결과는 부호가 반대**인 경우를 의미한다.
(즉 부호가 다른 경우에는 overflow가 없다)

32bit 덧셈에서 
16384 + 16384 = 32768 된다. 2진수로 보면.

<pre>
   0100 0000 0000 0000
 + 0100 0000 0000 0000
   1000 0000 0000 0000
</pre>

양수 + 양수가 음수가 되었다
즉 같은 부호가 다른 부호가 되었다. 이런 경우 v flag가 set된다.

(aarch64의 경우, overflow나 carry가 같은 C flag를 set하게 된다.)

## 2. Register
### 2.1 RFLAGS(64bit on x86_64)

|Bit|Flag|Description|
|---|---|---|
|0|**CF**|Carry Flag|
|1|Reserved||
|2|PF|Parity flag로서, 마지막 byte가 짝수면 1|
|3|Reserved|   |
|4|AF|Auxiliary Carry Flag. 10진수일때의 byte단위의 carry를 나타낸다.|
|5|Reserved|   |
|6|**ZF**|Zero Flag|
|7|**SF**|Sign Flag 이게 aarch64의 N flag이다.msb가 1이면 1|
|8|TF|Trap flag set되었다면, debugging의 single step mode를 수행중.|
|9|IF|Interrupt flag|
|10|DF|*Direction flag* increament or decrement에서 사용하는 stirng 방향 flag set되어 있다면 높은 주소에서 낮은 주소쪽으로 처리.|
|11|**OF**|*Overflow flag*|
|12-13|IOPL|I/P Privilege level|
|14|NT|Nested Task|
|15|Reserved|   |
|16|RF|Resume flag|
|17|VM|Virtual-8086 Mode|
|18|AC|Alignment Check/Access Control|
|19|VIF|Virtual Interrupt Flag|
|20|VIP|Virtual Interrupt Pending|
|21|ID|ID flag CPUID|
|22~64|Reserved||

### 2.2 NZCV(64bit on aarch64)
|Bit|Flag|Description|
|---|---|---|
|0~27|Reserved||
|28|V|**Signed overflow** if occurred == set|
|29|C|**Carry or unsigned overflow** if occurred == set|
|30|Z|**Zero** 실제로는 sub를 하는 것이라서, equal == set  non equal == clear|
|31|N|Negative operation의 결과가 negative(-) == set positive(+) == clear|
|32~64|Reserved|

정리해보면 다음과 같다.

1. N(negative)는 if negative set
2. Z(Zero)는 if eqaul or zero set
3. C(carry)는 **carry or unsigned overflow set**
4. V(overflow)는 **signed overflow**일때 set


### 2.3 SPSR(32bit Saved Process Status Register on aarch64)
|Bit|Flag|Description|
|---|---|---|
|0~3|M[3:0]|4Bit Mode or Exception level|
|4|M|Execution state if 0 == aarch64|
|5|Reserved||
|6|F|FIQ Mask|
|7|I|IRQ Mask|
|8|A|Serror Interrupt |
|9|D|Debug exception mask|
|10~19|Reserved||
|20|IL|Illegal flag|
|21|SS|Software stepping bit|
|22~27|Reserved||
|28|V|Overflow see 2.2|
|29|C|Carry see 2.2|
|30|Z|Zero see 2.2|
|31|N|Negative see 2.2|


## 3. Conditional code
branch와 data processing instruction들은 조건 부로 동작이 가능한데 conditional code의 접미어로 사용한다.
aarch64에는 
N,Z,C,V
#### aarch 

