---
title: "Assembly Programming"
permalink: /kdb/arch/assembly_programming
toc_sticky: true
toc_ads : true
layout: single
---

# table of content
[Outline](#outline)       
[on x86_64](#x86_64)       
	1. [Grammer](#1-grammer)       
[on aarch64](#aarch64)       
	1. [Prepare](#1-prepare)       
	2. [Compile](#2-compile)       
	3. [Debugging](#3-debugging)      
	4. [Grammer](#4-grammer)      

# Outline
여기서는 assembly를 테스트 하기 위한 방법을 정리한다.    
물론 ndk를 이용해서, ndk나 cmake를 이용해서 compile할 수 있지만 여기서는 android platform 없이 간단히 코드를 작성하고 테스트 해 볼 수 있는   
방법을 다룬다.    
x86 linux에서 aarch64를 compile하는 방법과 간단한 문법을 정리 해 보자.   

# x86_64
NASM을 이용하려면,            
먼저 NASM을 설치하자.     
> apt-get intsall nasm       
compile은 다음과 같다.      
> nasm -felf64 file.asm      
> ld file.o -o file
> ./file

GAS방식을 이용하려면,
> gcc -c file.s     
> ld file.o -o file     
> ./file       

NASM과 GAS는 source register와 destination register가 반대인것과 같이 차이가 좀 있다.      
개인적으로는 NASM에 익숙하지만, linux kernel이 GAS(GNU Assembler)형식이기 때문에 이 방법을 기준으로 설명한다.       

## 1. Grammer
* Register 이름 앞에 %가 붙는다.      
* Operand는 source가 먼저고, destination이 뒤에 나온다.       
* Operand에 **q**가 붙으면 64bit, **l**이 붙으면 32bit, **w**이 붙으면 16bit, **b**가 붙으면 8bit.        

# aarch64
## 1. Prepare
<pre>
sudo apt-get install binutils-aarch64-linux-gnu gcc-aarch64-linux-gnu
sudo apt-get install gdb-multiarch
sudo apt-get install qemu
</pre>

## 2. Compile
<pre>
$ sudo apt-get install binutils-aarch64-linux-gnu gcc-aarch64-linux-gnu
$ /usr/bin/aarch64-linux-gnu-gcc hello.S -o hello -static \
    ~/dev/qemu-4.2.0/aarch64-linux-user/qemu-aarch64 ./hello
</pre>

## 3. Debugging
gdb-multicarch를 이용한다.   

$ ~/dev/qemu-4.2.0/aarch64-linux-user/qemu-aarch64 -L /usr/aarch64-linux-gnu/ -g 8888 ./debugme   
$ gdb-multiarch ./debugme   
(gdb) **set arch aarch64**   
(gdb) **target remote localhost:8888**   
Remote debugging using localhost:8888   
0x00000000004002b4 in _start ()   
(gdb) b showStack   
Breakpoint 2 at 0x400400   
(gdb) **c**   
Continuing.   
Breakpoint 2, 0x0000000000400400 in showStack ()   

## 4. Grammer
간단하게 기본적이 frame은 다음과 같다.   
<pre>
.global main
.section .text
.balign 4
.type funcName, %function

funcName:
        ...

.type funcName2, %function

funcName2:
        ...
        ret

main:
        ...
        ret


.section .rodata
.balign 4
msg:
        .asciz "Result: %p\n\0"
</pre>
