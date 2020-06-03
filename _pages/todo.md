---
title: "정리중"
permalink: /kdb/todo/
toc_sticky: true
toc_ads : true
layout: single
---

# Table of content
1. [booting](#booting-init)   

# booting 

[very good document](https://junsoolee.gitbook.io/linux-insides-ko/summary/initialization/linux-initialization-4)    
[very good document2](http://www.iamroot.org/ldocs/linux.html)     

> kernel_init 관련(kernel thread)  
cpu_init() 함수는 CPU에 관련된 여러 정보들 (TSS, IST, GDT, IDT, ...)을 설정하는데  
여기서 percpu 데이터에 접근하기 위한 gs 레지스터 정보를 설정한다.   

> start_kernel rest_init()
여기서는 scheduler, memory zone 등을 초기화 한다.    
rest_init()에서는 kernel_init()을 [kernel thread](/kdb/linux/process/#1-kernel-thread)로 실행한다.   
kernel_init()에서는 smp_init()을 호출해서, bsp이외의 cpu인 application processor를 실행하게 된다. 이들은 real mode 부터 시작해서, startup_32()등을 거친다.   
hotplug가 활성화 되었다면(defaul로 활성) [ksoftirqd](/kdb/linux/exception/#4-ksoftirqd)에서 살펴보았듯이,  
cpu_up()은 cpu를 online으로 만든다.   

```
realmode/init.c:    trampoline_header->start = (u64) secondary_startup_64;
```
setup_tramponline()을 실행해서, AP가 real mode로 깨어나기 때문에 이를 처리할  tramponline을 준비 한다. 
arch/x86/kernel/tramponline_64.S에서는 real -> protected -> long mode 전환을 위한 코드가 있는 것.    
secondary_startup_64()는 AP가 BSP의 초기화 코드를 실행하게 해준다.    
do_boot_cpu()는 AP에서 수행될 idle task를 생성하고(do_idle_fork()) AP의 bootstrap을 위한 tramponline을 준비한 후에(setup_trampoline())   
local APIC를 토해 IPI(Inter Processor Interrupt)를 보내서 AP를 깨우게 된다.(wakeup_secondary_cpy_via_init())       

init_post()에서는 user mode process들인 /sbin/init /etc/init /bin/init /bin/sh을 실행한다. 




