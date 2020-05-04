---
title: "Assembly Programming"
permalink: /kdb/arch/assembly_programming
toc_sticky: true
toc_ads : true
layout: single
---

여기서는 assembly를 테스트 하기 위한 방법을 정리한다.    
물론 ndk를 이용해서, ndk나 cmake를 이용해서 compile할 수 있지만 여기서는 android platform 없이 간단히 코드를 작성하고 테스트 해 볼 수 있는   
방법을 다룬다.    
x86 linux에서 aarch64를 compile하는 방법과 간단한 문법을 정리 해 보자.   

# Prepare
<pre>
sudo apt-get install binutils-aarch64-linux-gnu gcc-aarch64-linux-gnu
sudo apt-get install gdb-multiarch
sudo apt-get install qemu
</pre>

# Compile
<pre>
$ sudo apt-get install binutils-aarch64-linux-gnu gcc-aarch64-linux-gnu
$ /usr/bin/aarch64-linux-gnu-gcc hello.S -o hello -static \
    ~/dev/qemu-4.2.0/aarch64-linux-user/qemu-aarch64 ./hello
</pre>

# Debugging
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

# Grammer
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
