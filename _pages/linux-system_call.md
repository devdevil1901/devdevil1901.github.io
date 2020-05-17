---
title: "System call"
permalink: /kdb/linux/system_call/
toc_sticky: true
toc_ads : true
layout: single
---

# Outline

# 1. on x86_64
64bit에서 SYSCALL instruction은 최대 6개의 parameter를 허용한다.     
* rax  system call number      
* rcx  return address     
* r11  saved rflags (note: r11 is callee-clobbered register in C ABI)      
* rdi  arg0        
* rsi  arg1     
* rdx  arg2      
* r10  arg3 (needs to be moved to rcx to conform to C ABI)      
* r8   arg4     
* r9   arg5     

SYSCALL instruction은 RIP를 RCX에 저장하고,      
rflags.RF를 clear한다.      
64-bit SYSCALL saves rip to rcx, clears rflags.RF, then saves rflags to r11, then loads new ss, cs, and rip from previously programmed MSRs.
64비트 SYSCALL Rip을 rcx에 저장하고 rflags.rf 즉 resume flag를 clear.
그리고 rflag를 r11에 저장한 다음, 이전에 프로그래밍된 MSR에서 새 ss, cs 및 rip를 로딩한다.      
rflga는 이 새로운 MSR로 masking된다.     
즉 SYSCALL instruction은 stack및 stack pointer도 건드리지 않는다.       


