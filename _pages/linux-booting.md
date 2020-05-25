---
title: "Booting"
permalink: /kdb/linux/boot/
toc_sticky: true
toc_ads : true
layout: single
---

# Table of contents
1. [Boot Protocol](#boot-protocol)    
	1. [setup header](/kdb/linux/boot_setup/)     
2. [Boot Sequence](#boot-sequence)       
	1. [from firmware to kernel](#1-from-firmware-to-kernel)     
    2. [from kernel to init proecss](#2-from-kernel-to-init-process)     
		1. [real mode functions](#221-real-mode-functions)      
		2. [protected mode functions](#222-protected-mode-functions)      
		3. [long mode](#223-long-mode)      
    4. [2. init calls](#2-__init-and-__init_calls)       
3. [Analysis of boot process](#analysis-of-boot-processing)      
    1. [1. Efi boot 방식 확인](#1-efi-boot-%EB%B0%A9%EC%8B%9D-%ED%99%95%EC%9D%B8)        
    2. [2. Checking of file system](#2-checking-of-file-system)        
    3. [3. Firmware test](#3-firmware-test)        

# Boot Protocol
v5.7-rc6 기준으로 boot protocol은 2.15 version 까지 존재한다.   
kernel size가 512kb를 넘으면 사용하는(사실상 모든 kernel이 사용하는) 메모리 layout은 다음과 같다.    
![bzImage](../../../assets/images/linux_layout_inmemory.png)   

장치의 실제 sector size와는 무관하게, boot protocol에서 한 sector는 512 byte를 의미한다.   
(어짜피 GTP의 1LBA도 512 byte이다.)   
kernel loading의 첫 단계로 real-mode code(kernel setup and boot sector)가 load된다.   
real mode에 대한 좀 더 상세한 설명은 [segmentation](/kdb/linux/memory/#segmentation)을 참조한다.      
이 주소는 bootloader에 의해 결정되는 X값 + 0x8000이다.     
protected kernel인 vmlinux.bin은 0x100000에 load된다.        
그리고 더 낮은 부분에 setup code가 배치되고, MBR에서 읽어온 stage 1 bootloader도 배치된다.    

boot protocol의 핵심은 setup이다.      
[setup header](/kdb/linux/boot_setup)      
보통 16 real mode setup header라고 부르지만, 아래의 내용과 같이 64bit에서도, 또 UEFI에서도 booting을 위해서       
이 정보를 이용한다.      
setup header for booting이 적당할 것이다.     

# Boot Sequence
x86의 경우, bios에서 UEFI가 나오면서, 뭐랄까 부팅 초기화 과정이 좀 넝마가 되어버린 듯한 모습니다.      

# 1. from firmware to kernel
x86 기준으로 그림을 그려보았다.     
firmware의 UEFI는 efi bootmanager를 의미한다.(legacy bootloader를 대체하는 부분이라고 볼수 있다.)        
*arm64 부분도 추가하도록 하자.*     
![boot sequence on x86_64](../../../assets/images/linux_boot_sequence.png)       
Mainboard가 power supply에 signal을 보내면 전력공급 시작되고, Mainboard가 power good signal을 받게되면 cpu를 start 시킨다.     
Cpu는 register를 초기화 하고, 첫 instruction을 실행하게 된다.     
uefi firmware는 직접 kernel을 실행할 수 있지만, ubuntu의 경우,       
handover를 써서, grub2를 이용하는 것으로 보인다.      
/boot/efi/EFI/ubuntu/shimx64.efi(UEFI secure booting)로  boot를 시작해서,            
/boot/efi/EFI/ubuntu/grubx64.efi로 booting을 시작한다.                
그리고 /boot/grub/grub.cfg에 지정된 /boot/vmlinuz-xxxx를 로드하게 된다.       

# 2. from kernel to init process
architecture 고유의 코드로 진행되다고 공통의 코드로 합쳐지는, init process 즉 start_kernel() 부분까지를 정리하였다.     
여기서 부터는 arm64쪽도 같이 정리하도록 한다.      
![Boot Process](../../../assets/images/linux-to_start_kernel.png)     

x86의 경우 **real mode에서 IA32e의 64bit mode(흔히 long mode)까지의 여정**이라고 볼수 있다.     
그림에서 가장 눈에 띄는 부분은 efi boot manager로 start되는 경우는 32bit protected mode 부터로 16bit real mode가 없다는 점일 것이다.      
firmware가 BIOS나 UEFI CSM mode이면, 16bit real mode로 진행될 것이고,      
UEFI를 사용중이라면, 32bit protected mode로 진행되게 되는 것이다.      

default인 EFI boot stub에 의해서 direct로 kernel을 로드한 경우에는 direct로 firmware가 kernel image를 load하게 된다.       
이 경우 그림에서와 같이 efi_pe_entry()로 jmp하게 된다.       
또한 kernel setup header(PE file)에 handover_offset을 지정하고, xloadflags에 해당 flag를 set하면,     
efi_stub_entry64()로 jump하게 된다.       

## 2.2.1 real mode functions
Legacy boot process를 먼저 살펴보도록 하자.      
kernel code에서 확인할 수 있듯이, real mode가 16bit라는 것은 address의 의미이다.      
eax와 같은 32bit register를 사용하지 못하는 것은 아니다.     
> **main()**:     
**Bios interrupt를 이용해서, 정보를 파악해서, boot_params를 완성한다.**      
먼저 boot_params가 무엇인지를 좀더 확실히 할 필요가 있다.     
1. 쉽게 말해서, Kernel compile time에 kernel configure등에 의해서 설정된 값,      
2. bootloader에 의해 구해진 값.      
3. bios interrupt나 efi boot service에 의해서,  구해진 값.       
이런 값들이 저장되는 곳이다.       
copy_boot_params()를 실행해서 boot paramter의 real mode setup header를 채워넣는다.     
boot_params에는 setup header도 포함된다.              
```
include/uapi/asm/bootparams.h   
struct boot_params {
    ...
	__u8  sentinel;					/* 0x1ef */
	__u8  _pad6[1];					/* 0x1f0 */
    ...
	struct setup_header hdr;    /* setup header */	/* 0x1f1 */
```

>>**console_init()**을 실행해서 console로 message를 출력할 수 있도록 한다.     

>>**init_heap()**으로 heap을 초기화 한다.       

>>**check_cpu()**로 cpu의 flag들을 확인한다.(long mode등)       

>>**set_bios_mode()**에서는 bios interrupt 0x15를 사용해서,       
firmware에 long mode가 사용될 것임을 전달한다.       

>>**detect_memory()**를 실행해서, DRAM의 메모리 layout을 파악한다.     

>>**detect_memory_e820()**을 실행해서,     
Bios interrupt로 e820 memory layout정보를 구해서, boot_params.e820_table에 저장한다.       
```
struct biosregs ireg
ireg.ax  = 0xe820;
ireg.cx  = sizeof(buf);
ireg.edx = SMAP;
ireg.di  = (size_t)&buf;
intcall(0x15, &ireg, &oreg);
```

>>**detect_memory_e801()**을 실행해서, bios interrupt로  e801 layout을 구해서,     
boot_params.alt_mem_k에 저장한다.     
```
ireg.ax = 0xe801;
intcall(0x15, &ireg, &oreg);
```

>>**detect_memory_88()**을 실행해서, bios interrupt로 boot_params.screen_info.ext_mem_k에 저장한다.            
```
ireg.ah = 0x88;
intcall(0x15, &ireg, &oreg);
```

>>**keyboard_init()**을 실행해서, bios interupt로 keyboard를 초기화 한다.      

>>**set_video()**를 실행해서,  boot_params.hdr.vid_mode를 채운다.     
대략적으로 이런것들을 하고, **go_to_protected_mode**로 jmp한다.      

>**go_to_protected_mode()**:      
**한 마디로 이 녀석은 32bit protected mode로의 진입을  준비한다.**         

>>**realmode_switch_hook()**에서는,          
setup header의 realmode_swtch가 설정되어 있는 경우 이 hook()을 실행한다.      
이전의 MSDOS의 LOADLIN등에서 사용하던 option이라서 현재는 거의 쓰이지 않는다.       
realmode_swtch가 설정되어 있지 않다면,          
cli로 interrupt를 disable 시키고, outb(0x80, 0x70);으로 0x70 port에 0x80 전송해서 NMI까지 disable시킨다.      
0x70은 CMOS address register이다.         

>>**enable_a20()**에서는 a20 gate를 enable 시킨다.
a20게이트는 real mode의 잔재이다.      
이런 코드를 실행하지 않는 EFI는 얼마나 아름다운가 어서, firmware menu에서 UEFI를 enable 시키자.      
20bit address bus로 1M의 주소만 접근가능한 real mode에서 MSDOS 등은 A20 gate를 on시켜서,     
0xFFFF:0x0010 ~ 0xFFFF:0xFFFF까지 사용할수 있었다.        
이걸 켜지 않으면 0x200000는 접근가능하나 0x300000은 접근하지 못하는 식으로       
홀수 접근이 안되서 접근할 수 있는 범위가 줄어든다.       

>>**setup_idt()**를 실행한다. 이름은 setup이지만, 그냥 IDT에 null idt를 넣는다.     
size와 address가 둘다 0.      

>>**setup_gdt()**를 실행한다.       
Real mode에서는 segment base + offset으로 구성된 segment가 64kb의 고정 크기 segment를 가르켰고, 그것이 물리주소였다.       
하지만. 32bit protected mode에서는 segmention이 GDT를 가르켜야 한다.(물론 GDT -> LDT이후 logical address가지고 paging)       
그래서, 4G 크기의 CS와 4G 크기의 DS, 그리고 Intel VT를 위한(다른데서는 사용 안함)       
TSS(Task State Segment)를 위해 descriptro table을 구성해서, lgdtl instruction으로 gdtr register에 로드한다.      

>>**mask_all_interrupts()**를 실행해서, APIC의 모든 interrupt를 masking해서 금지 시킨다.       
outb(0xfb, 0x21)로 primary PIC를, outb(0xff, 0xa1)으로 secondary PIC에 disable all interrupt.      

>>**protected_mode_jump()**를 실행한다. 코드는 다음과 같다.       
```
protected_mode_jump(boot_params.hdr.code32_start, (u32)&boot_params + (ds() << 4));
```
첫번째 인자는 protected mode의 진입 entry이다.         
setup header의 code32_start 부분이 지정된다.      
kernel compile후에 확인해 보면, 0x00100000.       
즉 big kernel의 default값이다. 이 주소는 startup_32()를  가르키고 있다.     
두번째 인자는 boot parameter의 주소이다.      
```
movl	%cr0, %__KEEPIDENTS__CF
__KEEPIDENTS__CG	$__KEEPIDENTS__CH, %dl	# Protected mode
movl	%__KEEPIDENTS__CI, %cr0
```
cr0에서 PE(보호 활성화) 비트를 설정하고, long jmp로 in_pm32()실행.     
Jmp로 호출되었기 때문에 go_to_protected_mode()에서 protected_mode_jump()호출 시,       
첫 인자 Boot_params.hdr.code_start가 그대로 eax에 담겨있는 상황이다.      
in_pm32() 마지막에     
```
jmpl    *%eax
```
즉 startup_32()로 jump하게 된다.     
5.7-rc6에서는       
```
jmpl	*%__KEEPIDENTS__JB
```
와 같이 macro로 변경되었다. 하지만 같은 의미이다.      

## 2.2.2 protected mode functions
64bit cpu가 나오기 이전, main mode였던 protected mode에 접어들었다.       
>**startup_32()**     
IA32e의 64bit mode 즉 long mode 진입준비를 한다.       
파일의 위치는 arch/x86/boot/compressed/head_64.S이다.     
compressed안에 들어있는 파일은 압축된 kernel을 의미한다.      
big kernel인 경우(대 부분의 경우), 0x100000에 로드된다.      
```
code32
.text
__HEAD
.code32
```
__HEAD는     
```
include/linux/init.h에
#define __HEAD		.section	".head.text","ax"
로 선언되어 있다. 즉 ax 실행 가능한 코드섹션.
```
>>scratch를 이용해서 현재 로드된 주소 구하기.      
```
leal	(BP_scratch+4)(%esi), %esp
call	1f
1:	popl	%ebp
subl	$1b, %ebp
```
BP_scaratch는 다음과 같이 boot_params의 member로 call 1f를 위한 임시 4 bytes stack이다.     
```
arch/x86/include/uapi/asm/bootparam.h
struct boot_params {
	__u32 scratch;		/* Scratch field! */	/* 0x1e4 */
kernel/asm-offsets.c
OFFSET(BP_scratch, boot_params, scratch);
```
binary의 section을 정의한, vmlinuz.ld에서 정의된 대로,        
현재 시작주소는 0x0이다.        
Call 1f를 하게 되면 return address를 push해서,      
Stack pointer에는 return address가 위치하게 된다.     
0x0 -----------------------------------      
0x4 return address       
1F ------------------------------- <- ebp     
subl	$1b, %ebp      
을 실행하고 나면      
Ebp에는 startup_32의 주소인 0x100000이 담기게된다.     

>>새로운 GDT를 32bit descriptor를 이용해서,  64bit segment들을 구성한다.      
```
leal	gdt(%ebp), %eax
movl	%eax, 2(%eax)
lgdt	(%eax)
```
같은 head_64.S에 gdt가 선언되어있다.     
```
.data
SYM_DATA_START_LOCAL(gdt64)
	.word	gdt_end - gdt - 1
	.quad   gdt - gdt64
SYM_DATA_END(gdt64)
	.balign	8
SYM_DATA_START_LOCAL(gdt)
.word	gdt_end - gdt - 1
.long	0
.word	0
.quad	0x00cf9a000000ffff	/* __KERNEL32_CS */
.quad	0x00af9a000000ffff	/* __KERNEL_CS */
.quad	0x00cf92000000ffff	/* __KERNEL_DS */
.quad	0x0080890000000000	/* TS descriptor */
.quad   0x0000000000000000	/* TS continued */
SYM_DATA_END_LABEL(gdt, SYM_L_LOCAL, gdt_end)
```
32bit kernel을 위한 segment, 64bit kernel을 위한 segment kernel을 위한 data segment를 확인할 수 있다.      
그리고, **로드한 ds로 ds,es,fs,gs,ss를 전부 같게 만든다.**     
```
movl	$__BOOT_DS, %eax
movl	%eax, %ds
movl	%eax, %es
movl	%eax, %fs
movl	%eax, %gs
movl	%eax, %ss
```

>>**verify_cpu()**를 실행해서, 64bit를 지원하는지 확인한다.      
```
call	verify_cpu
testl	%eax, %eax
jnz	.Lno_longmode
```
no_longmode에서는 hlt로 시스템 정지 시킨다.

>>decompression을 위해 relocate하기 위한 주소를 구한다.     
```
addl	BP_init_size(%esi), %ebx
subl	$_end, %ebx
//OFFSET(BP_init_size, boot_params, hdr.init_size);
```
setup header의 init_size는      
커널이 메모리 맵을 검사하기 전에 커널 런타임 시작 주소에서 시작하는 선형 연속 메모리의 크기를 의미한다.               
kernel의 안전한 로드 주소를 선택하는데 사용된다.       
즉 이 주소에 relocate를 하는 것.       

>>**PAE**를 활성화 한다.      
```
movl	%cr4, %eax
orl	$X86_CR4_PAE, %eax
movl	%eax, %cr4
```
X86_CR4_PAE는 다음과 같이 cr4의 5번째 bit를 set한다.      
```
#define X86_CR4_PAE		(1ul << 5)
```

>>4G의 early boot page table을 초기화 한다.           
build후에 cr3 register에 로드한다.       
```
call	get_sev_encryption_bit
xorl	%edx, %edx
testl	%eax, %eax
jz	1f
subl	$32, %eax	/* Encryption bit is always above bit 31 */
bts	%eax, %edx	/* Set encryption mask for page tables */
arch/x86/boot/compressed/mem_encrypt.S
SYM_FUNC_START(get_sev_encryption_bit)
```
먼저 cpuid instruction을 이용ㅎ서, **page table** 암호화 여부를 체크한다.      
암호화를 사용하면 커널이 복사되고 압축해제될 때 보안을 보장한다.       
그리고 page table을 0으로 초기화 한다.       
```
leal	pgtable(%ebx), %edi
xorl	%eax, %eax
movl	$(BOOT_INIT_PGT_SIZE/4), %ecx
rep	stosl
```
rep는 repeat이고, 접미어 l은 32bit를 의미한다. 즉 다음의 의미.      
```
while(ecx>0) {
	edi = eax
	edi+=4
}
```
page table은 같은 head_64.S에 writable한 section에 설정되어 있다.      
```
.section ".pgtable","aw",@nobits
.balign 4096
SYM_DATA_LOCAL(pgtable,		.fill BOOT_PGT_SIZE, 1, 0)
```
즉 edi에 page table 주소가 담겨 있었기 때문에, 0으로 초기화하는 것.     

>>4개의 page table을 build한다.             
level 4 page table이자 최상위 page table인 PML4를 build.        
다음으로 level 3, leve 2 page table을 build한다.     

>>c3에 page table을 로드.        
```
leal	pgtable(%ebx), %eax
movl	%eax, %cr3
```

>>long mode로 전환       
MSR의 EFER.LME 플래그를 0xC0000080으로 설정해서 long mode로 전환.       
```
movl	$MSR_EFER, %ecx
rdmsr
btsl	$_EFER_LME, %eax
wrmsr
```

>>startup_64로 jmp
CONFIG_EFI_MIXED는 EFI 32bit firmware에서, 64bit kernel을 실행 해주도록 하는 기능이다.      
default로 y.  
efi boot stub으로 booting된 경우(efi_pe_entry()를 타는)에는 지원되지 않고, handover로 넘어온 경우에만 적용 가능하다.   
```
pushl	$__KERNEL_CS
leal	startup_64(%ebp), %eax
pushl	%eax
movl	$(X86_CR0_PG | X86_CR0_PE), %eax
movl	%eax, %cr0
lret
```
64bit kernel용 code segment의 주소를 push 하고(GDT에 정의된)     
Startup_64의 주소를 eax에 넣는다. 그리고 stack에 push.      
Paging과 protected mode를 enable하고,      
lret으로 startup_64로 return.  아직은 32bit kernel이기 때문에 lret.     

>**efi_pe_entry()**   
Grub과 같은 bootloader가 생략된 방식이기 때문에 efi system service로 boot param을 작성해 준다.   
(efi_allocate_pages())   
이것을 인자로 efi_stub_entry()를 실행한다.   

>**efi_main()**    
Efi의 boot service이용해서, (기존 bios의 interrupt를 통한 것과 유사하게) boot를 위한 초기화를 수행하는 function 이다.   

>>**efi_relocate_kernel()**을 실행해서 kernel을 relocate한다.   
실패하면 return대신 efi_exit()를 통해 firmware로 return 함.(efi bios call을 이용한다.)    
>>setup_graphics(boot_params)를 실행해서, 그래픽 초기화,   
>>setup_efi_pci(boot_params)를 실행해서, PCI 초기화   
>>exit_boot()로 efi boot service를 종료.   


## 2.2.3 long mode
>**startup_64()**    
long mode에 진입한 상태로 시작된다.   
**커널의 압축해제와 Relocation이 주된 임무**이다.   
efi로 부터 호출되었거나, startup_32()로 부터 호출된 상태.   
kernel 주석에서는 직접적으로 64bit bootloader로 부터 호출되었거나, startup_32()로 부터 호출된 다고 표현한다.   

>> CS를 빼고는 모든 segment를 0으로 초기화   

>> kernel이 load된 위치와 compile된 위치의 차이를 계산한다.  

>> 압축해제를 위해 relocate할 주소를 계산한다.   

>> stack을 재계산하고, adjust_got()를 호출해서, got(plt의 그 got)의 offset을 재조정한다.    

>> long mode의 4 level paging이 enable된다.   
먼저 GOT를 재설정한다. startup_32()에서 수행했지만, efi_stub_entry()에서 호출되서 온 경우도 있기 때문에 다시 수행.   
```
leaq	gdt64(%rip), %rax
addq	%rax, 2(%rax)
lgdt	(%rax)
```
**paging_prepare()**를 실행해서, trampoline을 설정하고,   
5 level paing을 활성화 해야 하는지 확인한다.  
이 function은 rdx:rax 쌍즉 2 quadword를 return한다.   
tramponline 주소는 rax에 담기고,   
Rdx가 0이 아니면 tramponline으로 5 level paging을 활성화 해야 함을 의미한다.   
CONFIG_X86_5LEVEL은 보통 disable이다.   
아무튼 이것이 활성화 되어 있든 말든, tramponline의 주소는 setting되고 관련 설정이 진행된다.
rsi에는 boot_params가 담겨있고, rcx에는 tramponline의 주소가 담겨 있다.   

>>**relocated label**로 jump한다.  
```
leaq	.Lrelocated(%rbx), %rax
jmp	*%rax
```
relocated에서는 **.bss** section을 초기화(c code로 넘어가면 사용하기 위해)한다.    

>>**extract_kernel()**을 호출한다.  
압축을 해제하고, 해제한 주소를 return한다.    
이 주소로 jump한다
이 주소는 바로 **start_kernel()**이다.   
```
pushq	%rsi			/* Save the real mode argument */
movq	%rsi, %rdi		/* real mode address */
leaq	boot_heap(%rip), %rsi	/* malloc area for uncompression */
leaq	input_data(%rip), %rdx  /* input_data */
movl	$z_input_len, %ecx	/* input_len */
movq	%rbp, %r8		/* output target address */
movl	$z_output_len, %r9d	/* decompressed length, end of relocs */
call	extract_kernel		/* returns kernel location in %rax */
popq	%rsi
/*
 * Jump to the decompressed kernel.
 */
	jmp	*%rax
```
* mode - 초기 커널 초기화중 또는 부트로더로 채워진 채워진 boot_params 포인터  
* heap - 초기 부팅 힙의 시작 주소를 나타내는 boot_heap의 포인터;   
* input_data - 압축 된 커널의 시작을 가리키는 포인터 또는 다른말로 arch/x86/boot/compressed/vmlinux.bin.bz2를 가리키는 포인터;  
* input_len - 압축된 커널의 크기;   
* output - 향후 압축 해제 된 커널의 시작 주소;   
* output_len - 압축 해제 된 커널의 크기;   

## 2. __init and __init_calls

BSP에서 booting이 진행 되다가,  


xxx_initcall() 와 같은 function들이 있다.     
```
[include/linux/init.h]
#ifdef CONFIG_HAVE_ARCH_PREL32_RELOCATIONS
#define ___define_initcall(fn, id, __sec)			\
	__ADDRESSABLE(fn)					\
	asm(".section	\"" #__sec ".init\", \"a\"	\n"	\
	"__initcall_" #fn #id ":			\n"	\
	    ".long	" #fn " - .			\n"	\
	    ".previous					\n");
#else
#define ___define_initcall(fn, id, __sec) \
	static initcall_t __initcall_##fn##id __used \
		__attribute__((__section__(#__sec ".init"))) = fn;
#endif

#define __define_initcall(fn, id) ___define_initcall(fn, id, .initcall##id)

/*
 * Early initcalls run before initializing SMP.
 *
 * Only for built-in code, not modules.
 */
#define early_initcall(fn)		__define_initcall(fn, early)

/*
 * A "pure" initcall has no dependencies on anything else, and purely
 * initializes variables that couldn't be statically initialized.
 *
 * This only exists for built-in code, not for modules.
 * Keep main.c:initcall_level_names[] in sync.
 */
#define pure_initcall(fn)		__define_initcall(fn, 0)

#define core_initcall(fn)		__define_initcall(fn, 1)
#define core_initcall_sync(fn)		__define_initcall(fn, 1s)
#define postcore_initcall(fn)		__define_initcall(fn, 2)
#define postcore_initcall_sync(fn)	__define_initcall(fn, 2s)
#define arch_initcall(fn)		__define_initcall(fn, 3)
#define arch_initcall_sync(fn)		__define_initcall(fn, 3s)
#define subsys_initcall(fn)		__define_initcall(fn, 4)
#define subsys_initcall_sync(fn)	__define_initcall(fn, 4s)
#define fs_initcall(fn)			__define_initcall(fn, 5)
#define fs_initcall_sync(fn)		__define_initcall(fn, 5s)
#define rootfs_initcall(fn)		__define_initcall(fn, rootfs)
#define device_initcall(fn)		__define_initcall(fn, 6)
#define device_initcall_sync(fn)	__define_initcall(fn, 6s)
#define late_initcall(fn)		__define_initcall(fn, 7)
#define late_initcall_sync(fn)		__define_initcall(fn, 7s)

#define __initcall(fn) device_initcall(fn)
```

## setup header
x86에서 bootloader를 위해 존재하는 real mode를 위한 header지만, UEFI와 같이 16bit를 건너뛰는 process에서도 사용된다.   
bzImage의 layout에서 확인했듯이, binary의 offset 0x01F1의 위치에 .header section으로 존재한다.    
header 는 arch/x86/boot/header.S에 구현되어 있다.    
sentinel이라고 되어 있는 0xffff 다음부터가 header의 시작이다.     
header.S에 구현된 real mode에서 동작하는 setup header가 어떻게 구현되어 있는지 살펴보자.    
시작은 다음과 같이 0xffff로 시작 한다.    
그 다음 부터가 실제 heder.    
<pre>
sentinel:	.byte 0xff, 0xff 
</pre>
여기서 real value 부분은 ubuntu의 /boot/vmlinuz-5.3.0-46-generic의 binary에서 발췌한 값이다.

|offset|field|header.S|real value|description|
|---|---|---|---|---|
|01F1|setup_sects|setup_sects: .byte 0 |0x22|build.c에 의해서 채워진다. 첫 sector 512 byte안에 있는 setup code의 크기이다.|
|01F2|root_flags|root_flags: .word ROOT_RDONLY|0x0001|ROOT_RDONLY면 /를 rean only로 mount한다. 0이 아니면, read only의미.|
|01F4|syssize|syssize: .long 0 |0x0008b438|build.c에 의해서 채워짐. protected mode kenrel code의 크기이다.|
|01F8|ram_size|ram_size: .word 0|0x0000|obsolute|
|01FA|vid_mode|vid_mode: .word SVGA_MODE|0xFFFF|0xffff 즉  NORMAL_VGA로 설정되어 있다.|
|01FC|root_dev|root_dev: .word 0|0x0000|root device의 number인데, deprecated되었다. 지금은 command line의 root= option을 사용한다.|
|01FE|boot_flag|boot_flag: .word 0xAA55|0xAA55|magic number of MBR|
|0200|jump|.byte 0xeb # short (2-byte) jump|0xeb66|x86 short jmp|
|||.byte start_of_setup-1f|||
|0202|header|.ascii "HdrS"|0x48647253|signature|
|0206|version|.word 0x020f|0x020d|linux boot protocol의 version 2.15가 가장최신인데, 2.14버전을 사용중이다.|
|0208|realmode_swtch|realmode_swtch: .word 0, 0|0x00000000|bootloader가 DOS에서 실행되는 LOADLIN에서 실행되는 경우처럼, memory 공간 부족으로 memory 위치 요구사항을 준수하는 것이 어려운 경우에 16bit real mode에서 hook을 걸때 사용한다.|
|020C|start_sys_seg|start_sys_seg: .word SYSSEG|0x1000|obsolete|
|020E|kernel_version|.word kernel_version-512|0x37c0|kernel version NULL로 끝나는 kernel version string의 offset을 나타낸다.|
|0210|type_of_loader|type_of_loader: .byte 0|0x00|bootloader identifier|
|0211|loadflags|loadflags: .byte LOADED_HIGH|0x01|boot protocol의 option bit mask flag이다.|
|0212|setup_move_size|setup_move_size: .word 0x8000|0x8000|boot protocol 2.02 이상이거나, real mode code(setup code)가 0x90000에 로드되다면 무시된다. 참고로 bzImage의 setup code는 X+0x8000에 위치한다.|
|0214|code32_start|code32_start: .long 0x100000|0x00100000|code32는 32bit protected kernel을 의미 즉 protected mode를 위해서 jump할 entry point를 의미한다. 아래 상세설명을 참조하자.|
|0218|ramdisk_image|ramdisk_image: .long 0|0x00000000|ramdisk나 ramfs를 위한 32bit 선형주소.|
|021C|ramdisk_size|ramdisk_size: .long 0|0x00000000|위에서 지정한 ramdisk/ramfs(대 부분의 경우 initrd)의 크기.|
|0220|bootsect_kludge|bootsect_kludge:.long 0|0x00000000|obsoleted  DO NOT USE - for bootsect.S use only|
|0224|heap_end_ptr|heap_end_ptr: .word |0x5a50|setup code가 사용하는 heap의 끝이다.|
||_end+STACK_SIZE-512|||
|0226|ext_loader_ver|ext_loader_ver:.byte 0|0x00|Extended boot loader version.|
|0227|ext_loader_type|ext_loader_type:.byte 0|0x00|Extended boot loader type|
|0228|cmd_line_ptr|cmd_line_ptr: .long 0|0x00000000|Set this field to the linear address of the kernel command line. The kernel command line can be located anywhere between the end of the setup heap and 0xA0000; it does not have to be located in the same 64K segment as the real-mode code itself. Fill in this field even if your boot loader does not support a command line, in which case you can point this to an empty string (or better yet, to the string "auto".) If this field is left at zero, the kernel will assume that your boot loader does not support the 2.02+ protocol.|
|022C|initrd_addr_max|initrd_addr_max: .long 0x7fffffff|0x7fffffff|The maximum address that may be occupied by the initial ramdisk/ramfs contents. For boot protocols 2.02 or earlier, this field is not present, and the maximum address is 0x37FFFFFF. (This address is defined as the address of the highest safe byte, so if your ramdisk is exactly 131072 bytes long and this field is 0x37FFFFFF, you can start your ramdisk at 0x37FE0000.)|
|0230|kernel_alignment|kernel_alignment: .long CONFIG_PHYSICAL_ALIGN|0x00200000|Alignment unit required by the kernel (if relocatable_kernel is true.) A relocatable kernel that is loaded at an alignment incompatible with the value in this field will be realigned during kernel initialization. Starting with protocol version 2.10, this reflects the kernel alignment preferred for optimal performance; it is possible for the loader to modify this field to permit a lesser alignment. See the min_alignment and pref_address field below.|
|0234|relocatable_kernel|relocatable_kernel: .byte |0x01|If this field is nonzero, the protected-mode part of the kernel can be loaded at any address that satisfies the kernel_alignment field. After loading, the boot loader must set the code32_start field to point to the loaded code, or to a boot loader hook. |
|0235|min_alignment|min_alignment: .byte MIN_KERNEL_ALIGN_LG2|0x15|This field, if nonzero, indicates as a power of two the minimum alignment required, as opposed to preferred, by the kernel to boot. If a boot loader makes use of this field, it should update the kernel_alignment field with the alignment unit desired; typically:: kernel_alignment = 1 << min_alignment There may be a considerable performance cost with an excessively misaligned kernel. Therefore, a loader should typically try each power-of-two alignment from kernel_alignment down to this alignment. |
|0236|xloadflags|xloadflags: .word XLF0 or XLF1 or XLF23 or XLF4|0x003f|아래의 상세설명을 참조하자.|
|0238|cmdline_size|cmdline_size: .long COMMAND_LINE_SIZE-1 |0x000007FF|COMMAND_LINE_SIZE가 2048이기 때문에 0x800-1 = 0x07FF 가 됨. The maximum size of the command line without the terminating zero. This means that the command line can contain at most cmdline_size characters. With protocol version 2.05 and earlier, the maximum size was 255.|
|023C|hardware_subarch|hardware_subarch: .long 0 # subarchitecture, added with 2.07|0x00000000|In a paravirtualized environment the hardware low level architectural pieces such as interrupt handling, page table handling, and accessing process control registers needs to be done differently. This field allows the bootloader to inform the kernel we are in one one of those environments.|
|0240|hardware_subarch_data|hardware_subarch_data: .quad 0|0x0|A pointer to data that is specific to hardware subarch This field is currently unused for the default x86/PC environment, do not modify. |
|0248|payload_offset|payload_offset: .long ZO_input_data|0x000003b1|If non-zero then this field contains the offset from the beginning of the protected-mode code to the payload. The payload may be compressed. The format of both the compressed and uncompressed data should be determined using the standard magic numbers. The currently supported compression formats are gzip (magic numbers 1F 8B or 1F 9E), bzip2 (magic number 42 5A), LZMA (magic number 5D 00), XZ (magic number FD 37), and LZ4 (magic number 02 21). The uncompressed payload is currently always ELF (magic number 7F 45 4C 46)
|
|024C|payload_length|payload_length: .long ZO_z_input_len|0x00872fd6|The length of the payload.|
|0250|setup_data|setup_data: .quad 0|0x0|상세설명을 참조하자.|
|0258|pref_address|pref_address: .quad LOAD_PHYSICAL_ADDR|0x01000000|This field, if nonzero, represents a preferred load address for the kernel. A relocating bootloader should attempt to load at this address if possible. A non-relocatable kernel will unconditionally move itself and to run at this address|
|0260|init_size|init_size: .long INIT_SIZE|0x02b6a000|상세설명을 참조하자|
|0264|handover_offset|handover_offset: .long 0|0x00000190|EFI handover protocol을 참조하자|
|0268|kernel_info_offset|kernel_info_off: .long 0|0xc08ed88c||

### 1.1 vid_mode
들어갈 수 있는 값은 다음과 같다.   
```
arch/x86/include/uapi/asm/boot.h
#define NORMAL_VGA 0xffff /* 80x25 mode */
#define EXTENDED_VGA 0xfffe /* 80x50 mode */
#define ASK_VGA 0xfffd /* ask for it at bootup */
```
### 1.2 bootloader identifier
bootloader identifier에 들어갈수 있는 값은 다음과 같다.   
0은 boot protocol 2.0 이전을 의미. 즉 ancient bootloader.    
최신 bootloader는 이 값을 변경한다.    
ubuntu18.04에서는 그냥 0임...grub2를 사용 중임에도..    
```
1은 Loadlin
..
5 ELILO 
7 GRUB 
8 U-Boot
9 Xen 
A Gujin 
B Qemu 
..
```

### 1.3 boot protocol option flag
다음과 같은 값이 들어갈 수 있다.    
```
arch/x86/include/uapi/asm/bootparam.h
#define LOADED_HIGH (1<<0) 
#define KASLR_FLAG (1<<1) 
#define QUIET_FLAG (1<<5) 
#define KEEP_SEGMENTS (1<<6) 
#define CAN_USE_HEAP (1<<7)
```
bit 0은 protected mode kernel의 load주소를 의미 한다.                
0은 0x10000    
1은 0x100000     
bit 1은 KASLR 즉 kernel의 base 주소를 부팅 시 랜덤하게 결정하도록 한다.    
1은  enlable    
0은 disable    
bit5는 QUIET_FLAG로서, 0이면 early message를 출력 1이면 메세지를 supress     
bit 7은  CAN_USE_HEAP으로서, 1이면 heap_en_ptr이 valid하다는 의미, 0이면 disabled된다는 의미.     
### 1.4 code32_start
두 가지 목적으로 사용할 수 있다.    
1. bootloader hook
2. hook를 설치하지 않은 경우, relocatable kernel을 nonstandard 주소에 로드하기 위해서 사용한다.
UEFI를 사용하는 현 시점에서 거의 2의 목적으로 사용된다.    
header.S에 지정된 값인 0x100000은 Big kernel의 기본 값이다.     

### 1.5 ramdisk_image
initrd의 load주소이다.    
bootloader에 의해 설정되고, kernel에 의해서 읽어진다.     
grub의 경우 /boot/grub/grub.cfg에 initrd 항목에 ramdisk를 지정해 놓았고 이 값을 읽고 채울 수 있게 된다.     

### 1.6 xloadflags
```
xloadflags: .word XLF0 | XLF1 | XLF23 | XLF4
bit mask flag이다.
arch/x86/include/uapi/asm/bootparam.h에
/* xloadflags */ 
#define XLF_KERNEL_64 (1<<0)  //1
#define XLF_CAN_BE_LOADED_ABOVE_4G (1<<1)  //2
#define XLF_EFI_HANDOVER_32 (1<<2)  //4
#define XLF_EFI_HANDOVER_64 (1<<3)   //8
#define XLF_EFI_KEXEC (1<<4) 
#define XLF_5LEVEL (1<<5) 
#define XLF_5LEVEL_ENABLED (1<<6)
각 값은 bit flag이기 때문에 소수를 제외한 값들 1,2,4,8로 쭉가는 값일 뿐이다.
64bit라면 XLF_KERNEL_64이 set되고, 0x200에
전통적인 entry point를 가진다.
64bit+relocatable하다면( default)XLF_CAN_BE_LOADED_ABOVE_4G도 set 되고, kernel/boot_prarms/cmdline/ramdisk가 4G 이상에 위치할 수 있게된다.
CONFIG_EFI_STUB(default)과  CONFIG_EFI_MIXED(default)가 set되었다면 
XLF_EFI_HANDOVER_32이 set되고, kernel은 주어진 handover_offset에 32bit EFI handoff entry point를 지원 하게 된다.
또한 XLF_EFI_HANDOVER_64도 set되고, kernel은 주어진 handover_offset+ 0x200에 64bit EFI handoff entry point를 지원하게 된다.
또한 default인 CONFIG_KEXEC_CORE이 set되어 있다면 kernel은 kexec EFI boot를 지원해서 EFI runtime을 지원하게 된다.
여기서 3F는 63으로서, 이진수로 바꾸면 
111111
즉 flag들이 전부 set되어 있는 것을 확인할수 있다.
EFI handover부분을  참조하자.
```

### 1.7 setup_data
```
arch/x86/include/uapi/asm/bootparam.h
struct setup_data { 
__u64 next; 
__u32 type; 
__u32 len;
 __u8 data[0]; 
};
```
boot paramter를 더욱 확장할 수 있도록 해주는 setup_data의 linked list의 64bit offset을 가르킨다.     
현재 특별히 사용하고 있지 않음        

### 1.8 init_size
```
This field indicates the amount of linear contiguous memory starting at the kernel runtime start address that the kernel needs before it is capable of examining its memory map. 
This is not the same thing as the total amount of memory the kernel needs to boot, but it can be used by a relocating boot loader to help select a safe load address for the kernel. The kernel runtime start address is determined by the following algorithm:: 

if (relocatable_kernel) 
    runtime_start = align_up(load_address, kernel_alignment) 
else 
    runtime_start = pref_address
```

### 1.9 Kernel version
kernel version은 header.S에    
```
.word kernel_version-512
```
로 선언되어 있기 때문에, offest 값 + 512 (0x200)을 해주어야 한다.    
즉 
0x37c0 + 0x200 = 0x39c0
/boot/vmlinuz-5.3.0-46-generic을 :%!xxd로 확인해 보면 다음과 같다.    
```
000039c0: 352e 332e 302d 3436 2d67 656e 6572 6963  5.3.0-46-generic
000039d0: 2028 6275 696c 6464 406c 6379 3031 2d61   (buildd@lcy01-a
000039e0: 6d64 3634 2d30 3133 2920 2333 387e 3138  md64-013) #38~18
000039f0: 2e30 342e 312d 5562 756e 7475 2053 4d50  .04.1-Ubuntu SMP
00003a00: 2054 7565 204d 6172 2033 3120 3034 3a31   Tue Mar 31 04:1
00003a10: 373a 3536 2055 5443 2032 3032 3000 0000  7:56 UTC 2020...
```

## 2. EFI Handover protocol
이것을 살펴보기 전에 EFI를 보다 명확하게 이해할 필요성이 있다.    
EFI boot stub은 OS와 상관없는 firmware에서 직접 kernel을 로드할 수 기능이다.    
즉 이 경우 bootloader는 필요 없고, firmware가 직접 kernel을 로드하기 때문에,     
PE header의  Address of EntryPoint가 kernel에게 제어를 넘기는 point가 된다.    
이 주소는 다음과 같이 arch/x86/boot/tool/build.c에서 kernel을 컴파일 할 때 채워진다.    
```
static void update_pecoff_text(unsigned int text_start, unsigned int file_sz,nsigned int init_sz)
{
...
        put_unaligned_le32(text_start + efi_pe_entry, &buf[pe_header + 0x28]);
...
}
```
즉 이때의 시작 주소는 바로 **efi_pe_entry()**가 된다.    
setup header의 handover_off은 kernel image의 시작 지점에서 EFI handover protocol 진입점으로의 offset을 의미한다.    
EFI handover protocol이라는 것은 bootloader가 EFI boot stub에 대한 초기화를 지연할 수 있도록 하는 것이다.        

XLF_EFI_HANDOVER_32이 set되고, kernel은 주어진 handover_offset에 32bit EFI handoff entry point를 지원 하게 된다.
또한   
XLF_EFI_HANDOVER_64도 set되고, kernel은 주어진 handover_offset+ 0x200에 64bit EFI handoff entry point를 지원하게 된다.   
EFI handover을 사용하는 bootloader는 이 offset으로 jump해야한다.   
부트 로더는 부트 미디어에서 커널/initrd를 로드하고, EFI 핸드오버 프로토콜 진입점인 hdr->handover_offset 바이트로 점프해야 한다.    
startup_{32,64}.   
핸드오버 진입점의 기능 프로토타입은 다음과 같다.:    
```
unsigned long efi_main(
		       efi_handle_t handle,
		       efi_system_table_t *sys_table_arg,
		       struct boot_params *boot_params
		      )
```
**handle**은 EFI 펌웨어에 의해 부팅 로더에 전달되는 EFI 이미지 핸들,      
**table**은 EFI 시스템 테이블,       
**bp**는 부트 로더로 작동되는 부트 매개 변수다.   

부트 로더는 bp의 다음 필드를 입력해야 한다.    
* hdr.code32_start
* hdr.cmd_line_ptr
* hdr.ramdisk_image(해당되는 경우)
* hdr.ramdisk_size(해당되는 경우)
다른 모든 필드는 0이어야 한다(?)    

# analysis of boot processing
## 1. efi boot 방식 확인
```
$ efibootmgr -v
BootCurrent: 0000
Timeout: 1 seconds
BootOrder: 0000,0001,0002,0003,0004,0005
Boot0000* ubuntu	HD(1,GPT,f7ea2739-6273-43c0-b609-490bf9ab4456,0x800,0x100000)/File(\EFI\ubuntu\shimx64.efi)
Boot0001* Hard Drive	BBS(HD,,0x0)..GO..NO........q.S.a.m.s.u.n.g. .S.S.D. .9.7.0. .E.V.O. .5.0.0.G.B....................A...........................%8V..K......4..Gd-.;.A..MQ..L.S.4.6.6.N.X.0.M.6.4.1.7.4.5.X........BO
Boot0002* USB	BBS(HD,,0x0)..GO..NO........y.W.D. .M.y. .P.a.s.s.p.o.r.t. .2.5.F.3.1.0.1.2....................A.............................F..Gd-.;.A..MQ..L.3.1.3.8.3.4.3.5.3.7.3.5.3.4.3.2.3.3.3.3.3.6.3.8........BO
Boot0003* UEFI:CD/DVD Drive	BBS(129,,0x0)
Boot0004* UEFI:Removable Device	BBS(130,,0x0)
Boot0005* UEFI:Network Device	BBS(131,,0x0)
```
여기서 shimx64.efi 즉 UEFI의 보안 부팅을 이용하고 있는 것을 확인할 수 있다.    

## 2. checking of file system
fdisk가 이제는 gpt 형식을 지원하기 때문에, fdisk, gdisk, parted, df, /etc/fstab 등등을 이용해서 확인이 가능하다.    
```
$ sudo fdisk -l
...
Disk /dev/nvme0n1: 465.8 GiB, 500107862016 bytes, 976773168 sectors
Units: sectors of 1 * 512 = 512 bytes
Sector size (logical/physical): 512 bytes / 512 bytes
I/O size (minimum/optimal): 512 bytes / 512 bytes
Disklabel type: gpt
Disk identifier: A80A83A3-1EFB-4DC3-A8D1-C7E880A54F41

Device           Start       End   Sectors   Size Type
/dev/nvme0n1p1    2048   1050623   1048576   512M EFI System
/dev/nvme0n1p2 1050624 976771071 975720448 465.3G Linux filesystem
...
Disk /dev/sda: 476.9 GiB, 512076283904 bytes, 1000148992 sectors
Units: sectors of 1 * 512 = 512 bytes
Sector size (logical/physical): 512 bytes / 4096 bytes
I/O size (minimum/optimal): 4096 bytes / 1048576 bytes
Disklabel type: gpt
Disk identifier: C4D811EE-15E6-47A7-BEDF-A70C0E10B3A4

Device      Start       End   Sectors   Size Type
/dev/sda1      34    409633    409600   200M EFI System
/dev/sda2  411648 999884799 999473152 476.6G Linux filesystem
...

$ df -h
Filesystem      Size  Used Avail Use% Mounted on
/dev/nvme0n1p2  457G  167G  268G  39% /
/dev/nvme0n1p1  511M  6.1M  505M   2% /boot/efi
..
/dev/sda2       469G   90G  356G  21% /media/devdevil/aosp
..
$ sudo gdisk -l /dev/nvme0n1
GPT fdisk (gdisk) version 1.0.3

Partition table scan:
  MBR: protective
  BSD: not present
  APM: not present
  GPT: present

....

Number  Start (sector)    End (sector)  Size       Code  Name
   1            2048         1050623   512.0 MiB   EF00  EFI System Partition
   2         1050624       976771071   465.3 GiB   8300  

$ sudo parted 
GNU Parted 3.2
Using /dev/sda
Welcome to GNU Parted! Type 'help' to view a list of commands.
(parted) print all                                                        
Model: WD My Passport 25F3 (scsi)
Disk /dev/sda: 512GB
Sector size (logical/physical): 512B/4096B
Partition Table: gpt
Disk Flags: 
Number  Start   End    Size   File system  Name                  Flags
 1      17.4kB  210MB  210MB  fat32        EFI System Partition  boot, esp
 2      211MB   512GB  512GB  ext4         My Passport
Model: Samsung SSD 970 EVO 500GB (nvme)
Disk /dev/nvme0n1: 500GB
Partition Table: gpt
Number  Start   End    Size   File system  Name                  Flags
 1      1049kB  538MB  537MB  fat32        EFI System Partition  boot, esp
 2      538MB   500GB  500GB  ext4
```
여기서 확인할 수 있는 것은 삼성 SSD 970 EVO 500G가 /dev/nvme0n1에, My passport 외장하드가 /dev/sda에 존재한다는 것이다.     

## 3. firmware test
```
$ sudo apt-get install fwts
$ sudo fwts uefi --log-level=medium
Running 1 tests, results appended to results.log
Test: UEFI Data Table test.                                                 
  UEFI Data Table test.                                   1 passed                                                                                                                   
...
--------------------------------------------------------------------------------
FADT X_FIRMWARE_CTRL 64 bit pointer was zero, falling back to using
FIRMWARE_CTRL 32 bit pointer.
Test 1 of 1: UEFI Data Table test.
UEFI ACPI Data Table:
  Identifier: C68ED8E2-9DC6-4CBD-9D94-DB65ACC5C332
  DataOffset: 0x0036
  SW SMI Number: 0x00000001
  Buffer Ptr Address: 0x00000000da8da000
PASSED: Test 1, No issues found in UEFI table.

================================================================================
1 passed, 0 failed, 0 warning, 0 aborted, 0 skipped, 0 info only.
================================================================================
...
``` 
[more detail](https://wiki.ubuntu.com/FirmwareTestSuite/Reference)    

