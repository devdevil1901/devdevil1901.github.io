---
title: "Exception"
permalink: /kdb/linux/exception/
toc_sticky: true
toc_ads : true
layout: single
---

# Table of contents
1. [Outline](#outline)       
	1. [Glossary](#1-glossary)      
	2. [Classificatio](#2-classification)      
2. [Handling](#handling)   
	1. [threaded IRQ or IRQ Thread](#1-threaded-irq-or-irq-thread)  
3. [IRQ Source Mapping](#irq-source-mapping)          
	1. [irq_domain](#11-irq_domain)       
		1. [Registeration of IRQ number](#111-registeration-of-irq-number)       
		2. [Registeration of IRQ domain](#112-registeration-of-irq-domain)       
		3. [Mapping](#113-mapping)       
	2. [irq_desc](#12-irq_desc)        
	3. [irq_chip](#3-irq_chip)        

# Outline
Exception도 architecture에 따라서 의미가 다르다.    
x86 architecture에서는 interrupt가 더 큰 범위로서, exception을 포함한다.    
arm64 architecture에서는 exceptin이 더 큰 범위로서, interrupt를 포함한다.    
그리고 특정 유형의 asynchronous exception을 interrupt라고 한다.     
이후 글에서는 aarch64를 좀 더 좋아하는 개인 취향상, arm64에서의 정의를 따르도록한다.     

Exception이라는 개념은 예외의 의미이지만, interrupt의 의미는 OS와 사용자간의 interactive한 것들을 가능하게 해 주는 개념이라고 할 수 있다.      
마우스, 키보드를 연상하면 쉬울 것이다.     
system call의 경우도 이전에는 하나의 interrupt도 구현되어 있었고, 비슷한 개념이다.(속도를 위해서 현재는 별도의 개념이 되었다.)       
즉 interactive를 넘어 multitasking 자체를 가능하게 해주는 것도 이를 통한 것이다.      

## 1. Glossary

|name|description|
|---|---|
|irq|hardware interrupt를 의미한다.<br/>device로부터의 request이다.<br/>pin이나 packet을 통해서 전달된다.<br/>같은 pin에 여러개의 device가 연결된 경우에는<br/>irq를 공유하게 된다.|
|hardware interrupt number|irq_data의 hwirq<br/>local의 interrupt domain에서의 irq number이다.|
|irq number|irq source의 식별자로서 사용된다.<br/>linux의 irq number이다.<br/>irq_data의 irq|
|irq domain|irq의 grouping 개념<br/>hardware irq number와  irq number를 mapping해주는 책임을 가지고 있다.(서로 변환가능하게)<br/>그래서 interrupt translation domain이라고 불림.|

추가적으로 [interrupt controller](/kdb/arch/interrupt_controller/)에서 살펴본봐와 같이, ic는 irq를 routing 해주고, 우선순위를 지정해 주고, masking 까지 담당한다.     

## 2. Classification

|Type|interrupt|description|
|---|---|---|
|asynchronous interrupt|IRQ|IRQ pin으로 전달되기 때문에, 같은 pin으로 묶여 있다면, IRQ를 공유하게된다.<br/>instruction의 실행과 무관한 비동기 익셉션.<br/>IRQ 번호는 미리 정의된 spec으로<br/> IRQ0는 system timer[시간 계산 클럭 펄스(8235)] <br/> IRQ1은 키보드<br/>IRQ3은 com2 com4<br/>IRQ4는 com1 com3<br/>IRQ5 LPT2 또는 사운드카드<br/>IRQ6 플로피디스크<br/>IRQ7은 LPT1 parallel port<br/>IRQ10은 lan card<br/>IRQ12는 ps/2 mouse<br/>이런 식이다.<br/>상세한 것은 /proc/interrupt에서 확인할 수 있다.(android 포함)<br/>$ sudo cat /proc/interrupts<br/>0:       IR-IO-APIC    2-edge      timer<br/>7:       IR-IO-APIC    7-fasteoi   pinctrl_amd<br/>8:       IR-IO-APIC    8-edge      rtc0<br/>9:       IR-IO-APIC    9-fasteoi   acpi<br/>25:      PCI-MSI 4096-edge      AMD-Vi<br/>26:      IR-PCI-MSI 18432-edge      aerdrv<br/>..<br/>41:      IR-PCI-MSI 1048576-edge      xhci_hcd<br/>..<br/>58:       IR-PCI-MSI 1050624-edge      ahci[0000:02:00.1]<br/>...<br/>TLB:        TLB shootdowns<br/>TRM:        Thermal event interrupts<br/>..|
||FIQ|Fast Interrupt<br/> FIQ pin에서 전달되는 interrupt로서, IRQ보다 우선순위가 높다.<br/>|
||SError|System Error<br/>예를 들면 external memory에 접근할 때, permission failure 등이 발생할 수 있다.<br/>Interrupt exception class는 GIC(Generic Interrupt Controller Architecutre) Specification V3에 정의 되어 있다.|
||Abort|instruction fetch 실패(Instruction Aborts), data 접근 실패(Data Abort)에서 생성된다.<br/>MMU에서도 ABort를 발생시킬수 있다. MMU abort를 이용해서 리눅스는 demand paging을 구현했다.<br/>보통은 interrupt를 발생시킨 주소를 파악하지 못하기 때문에 비동기로 분류되었다.<br/>Abort에서 원인이 된 주소를 반환하는 경우는 동기화로 분류된다.<br/>Abort를 제외한 모든 exception class는 ARM Architecutre Reference Manual ARMv8에 정의되어 있다|
|| NMI(Non-markable interrupt)|한 마디로 pending될 수 없는 interrupt이다.<br/>interrupt가 발생하면, RFLAGS의 IF flag가 set되어서, 이후 발생하는 interrupt는 pending 상태가 된다.<br/>arm64에서는 PSTATE의 I flag가 set되어 이후 발생하는 interrupt는 pending 상태가 된다.<br/>하지만 이 interrupt는 깡패처럼 pending 불가로 우선 처리되게 되는 것이다. <br/>x86에서만 있고, aarch64에서는 없다.<br/>※ arm사에서 design하는 interrupt controller인 GIC v3에서는 pseudo-NMI로 비슷하게 동작할 수 있도록 하였다.<br/>즉 PSTAE의 I flag를 set해서, local irq가 disable 될때, psuedo-NMI를 사용하는 interrupt는 허용하도록 하는 방법이다.<br/>kernel v5.3이상에서 CONFIG_ARM64_PSEUDO_NMI=y로 설정해야 한다고 한다.|
|synchronous interrupt|Software interrupt, logical interrupt|
||Abort by MMU|instruction과 data 접근 instruction에서 발생되는 점은 비동기 Abort와 마찬가지이다.<br/>하지만 MMU로 부터 발생해서, 원인이 된 주소를 반환할 수 있다는 점 때문에 동기로 분류되었다.|
||Fault|page fault 처럼 fault handling 실행 후, 다시 재시작이 가능한 상황의 예외이다.<br/>|
||Trap|Single step, breakpoint reached 등의 상황이다.|
||Reset|booting 가장 초기 단계에서 전원이 들어오면, arm core나 cpu에 reset이 전달되도록 한다.<br/>core는 reset vector로 jump한다.<br/>arm의 경우 rvbar_eln register에 reset vector가 저장되어 있다.|
||System call or Service call|Exception generation exception이라고 한다.<br/>priviledged level을 상승 시키는 instruction을 통해서 발생한다.<br/>arm의 경우 svc,hvc, smc같은 instruction.<br/>x86의 경우 이전의 int 80에서 더 빠른 interrupt를 위해 sysenter와 syscall이 도입되었다.<br/>64bit long mode에서는 Intel,AMD 모두, syscall을 지원하고, Legacy mode에서는 sysenter를 Intel,AMD 모두 지원한다.|

High Priority                                                                                Low Prioirty      
Reset-------Data Abort-----------FIQ--------IRQ------------Instruction Abort------Software Interrupt(SWI)      

Timer의 경우는 IRQ0인 timer interrupt를 처리하는 callback은 do_timer이다.      
Boot이후의 tick값인 jiffies_64에 해당 값을 더해 주고, calc_global_load()를 호출한다.     


```
arch/arm64/kernel/entry.S
    .pushsection ".entry.text", "ax"

    .align  11
ENTRY(vectors)
    kernel_ventry   1, sync_invalid         // Synchronous EL1t
    kernel_ventry   1, irq_invalid          // IRQ EL1t
    kernel_ventry   1, fiq_invalid          // FIQ EL1t
    kernel_ventry   1, error_invalid        // Error EL1t

    kernel_ventry   1, sync             // Synchronous EL1h
    kernel_ventry   1, irq              // IRQ EL1h
    kernel_ventry   1, fiq_invalid          // FIQ EL1h
    kernel_ventry   1, error            // Error EL1h

    kernel_ventry   0, sync             // Synchronous 64-bit EL0
    kernel_ventry   0, irq              // IRQ 64-bit EL0
    kernel_ventry   0, fiq_invalid          // FIQ 64-bit EL0
    kernel_ventry   0, error            // Error 64-bit EL0

#ifdef CONFIG_COMPAT
    kernel_ventry   0, sync_compat, 32      // Synchronous 32-bit EL0
    kernel_ventry   0, irq_compat, 32       // IRQ 32-bit EL0
    kernel_ventry   0, fiq_invalid_compat, 32   // FIQ 32-bit EL0
    kernel_ventry   0, error_compat, 32     // Error 32-bit EL0
#else
    kernel_ventry   0, sync_invalid, 32     // Synchronous 32-bit EL0
    kernel_ventry   0, irq_invalid, 32      // IRQ 32-bit EL0
    kernel_ventry   0, fiq_invalid, 32      // FIQ 32-bit EL0
    kernel_ventry   0, error_invalid, 32        // Error 32-bit EL0
#endif
```

[More Detail](https://developer.arm.com/docs/den0024/a/aarch64-exception-handling)     

# Handling
exception이 발생하면, el1이나 kernel level에 진입하게 된다.   
kernel level에서 이것을 처리하는데 vector table이 활용된다.   
vector에는 exception type에 따라 handler의 주소가 담겨 있고,  
processor는 이 주소를 실행하게 되는 것이다.    

aarch64에서 exception handler는 vbar_eln register에 담긴 vector table을 보고 실행된다.    
![vector table 등록](../../../assets/images/arm64_reg_exception_handler.png)  
core 0는 booting 초반에 __primary_switched()를 실행에서,    
entry.S에 선언된 vectors를 vbar_el1 register에 load한다.   
그밖의 core는 cpu_operations 구조체를 통해, 해당 core가 booting될 때,  
역시 entry.S에 선언된 vectors를 vbar_el1 register에 load한다.   

x86_64에서는 다음과 같다.   

Exception의 처리는 Top Half(전반부 처리)와 Bottom Half(후반부처리)로 나누어 진다.   
Top Half는 즉각적으로 처리하는 방식이고,    
Bottom Half는 좀 미루어 놓고 실행하는 방식이다.   
즉각적으로 처리한다는 것은 interrupt handler에서 처리한다는 의미.    

보통 Top Half는 NMI(x86 only), FIQ, IRQ등을 처리하는 과정이고,  
Bottom Half는 MI(Maskable Interrupt), SoftIrq를 처리하지만,   
꼭 그렇지는 않다.      
kernel configuration의 Scheudling level에 따라서 달라지지만,  
보통 일반적인 PREEPT나, PREEMPT_VOLUNTARY 같은 경우에는 interrupt 처리 상황에서는 scheduling 되지 않는다.  
PREEPT_RT가 되어야지 이 상황에서도 scheduling이 된다.   
그렇기 때문에 interrupt가 LAN card에서 packet을 수신하고, 발생시키는 것과 같이 너무 많은 상황이라면 시스템은 사실상 정지 상태가 될 것이다.   
이것이 Bottom Half를 두는 이유이다.    

즉 IRQ를 처리할 때, bottom half flag를 set하고, 종료한 후에, do_softirq()에서 처리하도록 미룰 수 있다.   

Bottom Half는 IRQ Thread, SoftIRQ, WorkQueue등에서 처리된다.    

## 1. threaded IRQ or IRQ Thread
Bottom Half 처리를 위한 [kernel thread](/kdb/linux/process/#1-kernel-thread)이다.          
다음의 프로세스들이 바로 IRQ Thread이다.   
```
$ ps -ef
UID        PID  PPID  C STIME TTY          TIME CMD
root         1     0  0  5월24 ?      00:00:44 /lib/systemd/systemd --system --deserialize 41
root         2     0  0  5월24 ?      00:00:00 [kthreadd]
oot       221     2  0  5월24 ?      00:00:00 [irq/25-AMD-Vi]
root       230     2  0  5월24 ?      00:00:00 [irq/26-aerdrv]
root       231     2  0  5월24 ?      00:00:00 [irq/27-aerdrv]
root       232     2  0  5월24 ?      00:00:00 [irq/28-aerdrv]
root       233     2  0  5월24 ?      00:00:00 [irq/29-aerdrv]
root       234     2  0  5월24 ?      00:00:00 [irq/31-aerdrv]
root      1144     2  0  5월24 ?      00:46:14 [irq/104-nvidia]
```
irq/25-AMD-Vi는 25번 interrupt를 처리하는 irq thread라는 의미.   
irq/xxx들은 모두 부모의 pid가 2이고, pid 2는 kthreadd이다.   

# IRQ source mapping
linux는 IRQ source를 식별하기 위해서, irq number를 사용하고 있다.     
interrupt controller가 하나일때는 문제가 없지만, interrupt controller가 여러개 있을 때에는 irq number를 중첩되지 않게 해야 한다.      
그래서 hardware irq라고 불리는 interrupt controller의 local interrupt number를, interrupt number와 분리하고,     
mapping을 irq_domain을 통해서 하게 된것이다.     
즉 hardware irq number는 domain 내에서는 중첩되지 않는 것.     

이런 mapping에서는     
irq number -> hardware irq number로 변환하는 mapping과     
hardware irq number -> irq number로 변환하는 reverse mapping이 있다.          

## 1.1 irq_domain
```
[include/linux/irqdomain.h]
struct irq_domain {
	struct list_head link;
	const char *name; // interrupt domain 이름
	const struct irq_domain_ops *ops; 
	void *host_data;
	unsigned int flags;
	unsigned int mapcount;

	/* Optional data */
	struct fwnode_handle *fwnode;
	enum irq_domain_bus_token bus_token;
	struct irq_domain_chip_generic *gc;
#ifdef	CONFIG_IRQ_DOMAIN_HIERARCHY
	struct irq_domain *parent;
#endif
#ifdef CONFIG_GENERIC_IRQ_DEBUGFS
	struct dentry		*debugfs_file;
#endif

	/* reverse map data. The linear map gets appended to the irq_domain */
	irq_hw_number_t hwirq_max;
	unsigned int revmap_direct_max_irq;
	unsigned int revmap_size;
	struct radix_tree_root revmap_tree;
	struct mutex revmap_tree_mutex;
	unsigned int linear_revmap[];
};
```

irq_domain은 ops에서 각 동작들을 함수포인터로 추상화 시켜 놓았다.           
```
[include/linux/irqdomain.h]
struct irq_domain_ops {
	// Match an interrupt controller device node to a host, returns 1 on a match
	int (*match)(struct irq_domain *d, struct device_node *node, enum irq_domain_bus_token bus_token);
	// Create or update a mapping between a virtual irq number and a hwirq number. This is called only once for a given mapping.
	int (*select)(struct irq_domain *d, struct irq_fwspec *fwspec, enum irq_domain_bus_token bus_token);
	int (*map)(struct irq_domain *d, unsigned int virq, irq_hw_number_t hw);
	void (*unmap)(struct irq_domain *d, unsigned int virq);
	int (*xlate)(...)
#ifdef	CONFIG_IRQ_DOMAIN_HIERARCHY
	/* extended V2 interfaces to support hierarchy irq_domains */
	int (*alloc)(struct irq_domain *d, unsigned int virq,
		     unsigned int nr_irqs, void *arg);
	void (*free)(struct irq_domain *d, unsigned int virq,
		     unsigned int nr_irqs);
	int (*activate)(struct irq_domain *d, struct irq_data *irqd, bool reserve);
	void (*deactivate)(struct irq_domain *d, struct irq_data *irq_data);
	int (*translate)(struct irq_domain *d, struct irq_fwspec *fwspec,
			 unsigned long *out_hwirq, unsigned int *out_type);
#endif
```

### 1.1.1. registeration of irq number

irq number는 다음과 같이 등록된다.     
![irq number 등록](../../../assets/images/linux_irq_register_irqnumber.png)    

__init macro는 .init.text section에 위치해서 booting시에 한번 실행된다는 macro이다.    

### 1.1.2 registeration of irq domain

interrupt controller의 driver는 irq_domain_add_xxx() 중 하나를 호출해서 irq_domain을 생성하게 된다.      
<pre>
[include/linux/irqdomain.h]
irq_domain_add_linear() 
irq_domain_add_nomap()
irq_domain_add_tree()
irq_domain_add_legacy()
irq_domain_add_simple()
</pre>

irq_domain의 irq_domain_ops는 위의 function을 호출한 곳에서 채워줘야한다.     
이렇게 생성된 irq_domain은 mapping 정보는 없는 상태로서, 다음 function을 통해서 채워준다.    
```
[kernel/irq/irqdomain.c]
unsigned int irq_create_mapping(struct irq_domain *domain, irq_hw_number_t hwirq)
```

### 1.1.3 mapping
hardware irq number로 irq number를 찾는 reverse mapping은 **irq_find_mapping()**를 이용한다.      
```
[kernel/irq/irqdomain.c]
unsigned int irq_find_mapping(struct irq_domain *domain, irq_hw_number_t hwirq)
```

좀 더 상세한 내용은 kernel의 [document](https://elixir.bootlin.com/linux/v5.7-rc5/source/Documentation/IRQ-domain.txt)를 참조하자.     

## 1.2 irq_desc
각 hardware interrupt에 대한 descriptor이다.     
다음과 같이, irq number로 irq_desc를 구할 수 있다.    
```
[include/linux/irqnr.h]
extern struct irq_desc *irq_to_desc(unsigned int irq);
```
선언을 살펴보자.     
```
[include/linux/irqdesc.h]
쓸데없는 것은 정리후에 지우자.     
struct irq_desc {
	struct irq_common_data	irq_common_data;
	struct irq_data		irq_data;
	unsigned int __percpu	*kstat_irqs;
	irq_flow_handler_t	handle_irq;
#ifdef CONFIG_IRQ_PREFLOW_FASTEOI
	irq_preflow_handler_t	preflow_handler;
#endif
	struct irqaction	*action;	/* IRQ action list */
	unsigned int		status_use_accessors;
	unsigned int		core_internal_state__do_not_mess_with_it;
	unsigned int		depth;		/* nested irq disables */
	unsigned int		wake_depth;	/* nested wake enables */
	unsigned int		tot_count;
	unsigned int		irq_count;	/* For detecting broken IRQs */
	unsigned long		last_unhandled;	/* Aging timer for unhandled count */
	unsigned int		irqs_unhandled;
	atomic_t		threads_handled;
	int			threads_handled_last;
	raw_spinlock_t		lock;
	struct cpumask		*percpu_enabled;
	const struct cpumask	*percpu_affinity;
#ifdef CONFIG_SMP
	const struct cpumask	*affinity_hint;
	struct irq_affinity_notify *affinity_notify;
#ifdef CONFIG_GENERIC_PENDING_IRQ
	cpumask_var_t		pending_mask;
#endif
#endif
	unsigned long		threads_oneshot;
	atomic_t		threads_active;
	wait_queue_head_t       wait_for_threads;
#ifdef CONFIG_PM_SLEEP
	unsigned int		nr_actions;
	unsigned int		no_suspend_depth;
	unsigned int		cond_suspend_depth;
	unsigned int		force_resume_depth;
#endif
#ifdef CONFIG_PROC_FS
	struct proc_dir_entry	*dir;
#endif
#ifdef CONFIG_GENERIC_IRQ_DEBUGFS
	struct dentry		*debugfs_file;
	const char		*dev_name;
#endif
#ifdef CONFIG_SPARSE_IRQ
	struct rcu_head		rcu;
	struct kobject		kobj;
#endif
	struct mutex		request_mutex;
	int			parent_irq;
	struct module		*owner;
	const char		*name;
} ____cacheline_internodealigned_in_smp;
```

**irq_common_data**는 모든 irqchips에 의해 공유된 irq당 data     
**irq_data**는 

```
[include/linux/irq.h]
struct irq_data {
	u32			mask; //chip register들에 접근하기 위해 사전 compile된 bitmask
	unsigned int		irq; // interrupt number, irq source의 식별자. 
	unsigned long		hwirq;// irq number(interrupt domain의 local)
	struct irq_common_data	*common; // point to data shared by all irqchips
	struct irq_chip		*chip; // low level interrupt hardware access
	struct irq_domain	*domain; 
#ifdef	CONFIG_IRQ_DOMAIN_HIERARCHY
	struct irq_data		*parent_data;
#endif
	void			*chip_data;
};
```

## 3. irq_chip
hardware interrupt chip의 descriptor이다.     
irq_domain과 같이, **interrupt controller driver**의 동작은 추상화 되어 있으며 그것이 구현되어 있는 것이 irq_chip이다.     
예를 들면, 새로운 interrupt handling을 시작하면, irq_ack()를 실행하고,      
interrupt handling을 마치면 irq_eio()를 호출한다.     
 
```
[iclude/linux/irq.h]
struct irq_chip {
	struct device	*parent_device;
	const char	*name;
	unsigned int	(*irq_startup)(struct irq_data *data);
	void		(*irq_shutdown)(struct irq_data *data);
	void		(*irq_enable)(struct irq_data *data);
	void		(*irq_disable)(struct irq_data *data);
	void		(*irq_ack)(struct irq_data *data);
	void		(*irq_mask)(struct irq_data *data);
	void		(*irq_mask_ack)(struct irq_data *data);
	void		(*irq_unmask)(struct irq_data *data);
	void		(*irq_eoi)(struct irq_data *data);
	int		(*irq_set_affinity)(struct irq_data *data, const struct cpumask *dest, bool force);
	int		(*irq_retrigger)(struct irq_data *data);
	int		(*irq_set_type)(struct irq_data *data, unsigned int flow_type);
	int		(*irq_set_wake)(struct irq_data *data, unsigned int on);
	void		(*irq_bus_lock)(struct irq_data *data);
	void		(*irq_bus_sync_unlock)(struct irq_data *data);
	void		(*irq_cpu_online)(struct irq_data *data);
	void		(*irq_cpu_offline)(struct irq_data *data);
	void		(*irq_suspend)(struct irq_data *data);
	void		(*irq_resume)(struct irq_data *data);
	void		(*irq_calc_mask)(struct irq_data *data);
	void		(*irq_print_chip)(struct irq_data *data, struct seq_file *p);
	int		(*irq_request_resources)(struct irq_data *data);
	void		(*irq_release_resources)(struct irq_data *data);
	void		(*irq_compose_msi_msg)(struct irq_data *data, struct msi_msg *msg);
	void		(*irq_write_msi_msg)(struct irq_data *data, struct msi_msg *msg);
	int		(*irq_get_irqchip_state)(struct irq_data *data, enum irqchip_irq_state which, bool *state);
	int		(*irq_set_irqchip_state)(struct irq_data *data, enum irqchip_irq_state which, bool state);
	int		(*irq_set_vcpu_affinity)(struct irq_data *data, void *vcpu_info);
	void		(*ipi_send_single)(struct irq_data *data, unsigned int cpu);
	void		(*ipi_send_mask)(struct irq_data *data, const struct cpumask *dest);
	int		(*irq_nmi_setup)(struct irq_data *data);
	void		(*irq_nmi_teardown)(struct irq_data *data);
	unsigned long	flags;
};
```

irq_data에는 irq_chip이 들어있고, irq_desc에 irq_data가 들어있다.      
irq_set_chip(irq number, irq_chip *)을 호출해서, irq_desc->irq_data->chip에 set하게 된다.      

core irq code에서 직접 호출된다.     

> TODO.이 부분은 그림으로 그려서 보강하도록 하자.         
Exception을 처리한다는 것은 다음을 의미한다.     

|arch|phase1|phase2|phase3|
|---|---|---|
|x86|현재 cpu를 점유하고 있는 프로세의 실행을 멈춘다.<br/>현재 status(pc, register)를 save한다. |interrupt의 handler를 실행.<br/>  Kernel mode 진입. Exception Vector table에서 해당 ISR를 실행<br/> interrupt handler(ISR)의 주소는 Interrupt Descripter Table (IDT)에 저장된다. |interrupted process의 실행을 재개한다.(time slace를 이어서 실행)|
|aarch64|Exception이 발생하면, ELR_ELx instruction을 이용해서, 돌아올 address를 저장해 놓는다.|SPSR_ELx instruction을 실행해서, 현재 processor의 state인 PSTATE 값을 에 PSTATE를 저장한다.|그리고 exception 처리가 끝나면 ERET을 써서, pc에 복귀할 주소를 넣고, spsr에서 PSTATE를 복구한다.|

# Interrupt Controller
## 1. on x86_64
초기화를 위해서 먼저 APIC의 spec을 확인해야 한다.     
이 정보는 apic_driver와 apic_drivers에 초기화 된다.      
**apic_boot_init()**       
**apic_intr_mode_init()**        
이후에는
**setup_local_APIC()**       
를 통해서 APIC에서 다양한 register를 구성하게 된다.      
예를 들어 LVT0/1을 설정하는 것이다.       

다음과 같이 해당 interrupt vector를 초기화 한다.      
```
start_kernel()
    init_IRQ()
        native_init_IRQ()
            idt_setup_apic_and_irq_gates()
                idt_setup_from_table(idt_table, apic_idts, ARRAY_SIZE(apic_idts), true);
```  


