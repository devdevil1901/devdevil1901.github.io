# Data Type


|Type|Size on x86_64|size on aarch64|
|---|:---:|---:|
|Byte|8 bit|8 bit|
|Half-word||16 bit|
|Word|16 bit|32bit|
|Double-word|32 bit|64 bit|
|Quad-word|64 bit|128 bit|


# Signed vs UnSigned

Signed는 negative즉 음수(-)도 포함하는 값, Unsigned 는 양수를 포함하는 값.
즉 signed char는 -128~+128까지를 저장할 수 있고, 
unsigned char의 경우는 0~256까지를 저장할 수 있게 되는 것.

즉 unsigned가 양수라면, 2배를 담을 수 있다.(그래서 hexa값을 unsigned에 담는 것이다)
signed는 부호를 표현하기 위해서, 다음과 같이 msb(마지막 bit)를 사용한다. positive(+)는 0, nagative(-)는 1이다.

## 1. MSB(Most Significant Bit)
signed bit  즉 부호를 표현하는 bit이다.
8bit가 있다고 하면 다음과 같이, 7번째 bit가 부호bit가 된다.
msb가 1이면, negative 즉 음수.

|MSB(7)|6|5|4|3|2|1|LSB(0)|
|---|---|---|---|---|---|---|---|

## 2. Negative expression of signe
10진수에서는 +/- 기호를 이용하지만, 2진수에는 signed에서 음수를 표현하기 위해서는 크기를 표현하는 marking을 1로 볼것이냐 0으로 볼 것이냐로 구분된다.

positive(양수)에서는 1이 값을 marking하지만, nagative에서는 0이 값을 marking한다.



2진수로 9는 0000 1001 이다.
      -9는 1000 1001 일것 같지만,
           1111 0111 이다.

즉 크기 8을 나타내는 부분이 0으로 marking되었다. 그렇다면 왜 -1이 더된 것일까?
1111 1111이 0이 아니라, -1이기 때문이다.

다음 표를 참조하자.
