---
title: "Kernel Binary"
permalink: /kdb/linux/binary/
toc_sticky: true
toc_ads : true
layout: single
---

# Table of content
[Outline](#outline)   
[Layout](#layout)   
	1. [on x86_64](#1-on-x86_64)   
	2. [on aarch64](#2-on-aarch64)   
[UEFI Boot stub](#uefi-boot-stub)   

# Outline
kernel을 compile 하면, 생성되는 binary와 layout에 대해서 살펴보도록 하자.   
x86에서 최종 output은 vmlinuz나 bzImage, aarch64에서는 vmlinux or Image.gz이다.   

|file|location on x86|location on aarch64|description|
|---|---|---|---|
|vmlinux|/|/|ELF형식. kernel image|
|vmlinux.bin|arch/x86/boot/compressed||vmlinux에서 symbol과 comment section정보를 제거한것|
|vmlinux.bin.gz|/arch/x86/boot/compressed/||vmlinux.bin을 gzip으로 압축|
|Image||/arch/ar64/boot||
|zImage|||512kb미만일 때의 압축한것|
|bzImage|arch/x86/boot/||bzip2로 압축한것이다. setup.bin + header + vmlinux.bin efi stub kernel일 경우 PE 파일이다.|
|piggy.o|arch/x86/boot/compressed||압축 정보 symbol과 vmlinux.bin.gz를 include한 object|
|setup.elf|arch/x86/boot||linux의  boot protocol을 구현한 코드이다.|

# Layout
## 1. on x86_64
x86의 최종 커널 binary라고 할 수 있는 bzImage의 구조이다.   
![bzImage layout](https://devdevil1901.github.io/assets/images/linux_bzImage.png)    
bzImage는 크게 16bit real mode에서 동작하는 setup code와 32bit protected mode에서 동작하는 vmlinux.bin으로 구성되어 있다.   
bzImage의 첫 부분인 setup.bin은 setup.elf 파일을 binary로 만든것이다.    
<pre>
[arch/x86/boot/Makefile]
OBJCOPYFLAGS_setup.bin := -O binary
$(obj)/setup.bin: $(obj)/setup.elf FORCE
</pre>
${SETUP_OBJS}에 지정된 object들이 바로, setup code로, linux의 boot protocol을 구현한 것이다.    
16bit real mode에서 동작하는 코드(elf)    
<pre>
[arch/x86/boot/Makefile]
$(obj)/setup.elf: $(src)/setup.ld $(SETUP_OBJS) FORCE
    $(call if_changed,ld)
</pre>
setup.bin의 header 부분은 arch/x86/boot/header.S에 선언되어 있고 다음과 같이,     
.bstext .bsdata .header .entrytext .initdat section으로 구성되어 있다.   
![setup.bin의 header 부분](https://devdevil1901.github.io/assets/images/linux_setup_bin.png)    

section 부분을 살펴보자면  
[arch/x86/boot/compressed/vmlinux.lds.S]  
**.head.text** (startup_32() 즉 protected kernel이 위치)      
**.rodata** (압축된 코드)    
**.text** (여기에 압축해제 코드도 있다.)   
**.got**    
**.data**   
**.bss**     
**.pgtable**  
이런 구조로 구성되어 있다.   

## 2. on aarch64
arm64의 64 bytes image header는 다음과 같이 구현되어 있다.   
```
arch/arm64/include/asm/image.h
struct arm64_image_header {
	__le32 code0; // stext로 분기하거나 PE의 MZ header로 사용됨.
	__le32 code1; // executable code
	__le64 text_offset; // kernel image를 로드할 RAM의 offset
	__le64 image_size; 
	__le64 flags;
	__le64 res2; // reserved
	__le64 res3; // reserved
	__le64 res4; // reserved
	__le32 magic; // magic값 0x644d5241
	__le32 res5; // pe header를 가르킨다. 바로 아래 주소인 0x00000040을 가르킨다.
};
```
여기서 flags는 bit flags로서 의미는 다음과 같다.   

|64bit<br/>~4 bit|3 bit|1,2 bit|0 bit| 
|---|---|---|---|
|reserved|kernel의 물리적 위치를 나타낸다.<br/> 0이면 2MB 정렬 베이스는 D램 베이스에 최대한 근접해야 하며,<br/> 그 아래의 메모리는 선형 매핑을 통해 접근할 수 없기 때문이다.<br/>1이면 2MB 정렬 베이스는 physical memory의 어디에든 위치할 수 있다.<br/>|page size를 나타낸다.<br/>1이면 4K, 2이면 16K, 3이면 64k이다.|0이면 little endian 1이면 big endian이다.|

x86에서 setup header를 실제 구현한 부분이 header.S이듯이, 위의 image header를 실제로 구현한 부분은 다음과 같다.    
```
arch/arm64/kernel/head.S
_head:
#ifdef CONFIG_EFI
        add     x13, x18, #0x16 // MZ다.
        b       stext
#else
        b       stext
        .long   0
#endif
        le64sym _kernel_offset_le               // Image load offset from start of RAM, little-endian
        le64sym _kernel_size_le                 // Effective size of kernel image, little-endian
        le64sym _kernel_flags_le                // Informative flags, little-endian
        .quad   0                               // reserved
        .quad   0                               // reserved
        .quad   0                               // reserved
        .ascii  ARM64_IMAGE_MAGIC               // 다음 값이다. 0x00004550	/* "PE\0\0" */
#ifdef CONFIG_EFI
        .long   pe_header - _head               // Offset to the PE header.
pe_header:
        __EFI_PE_HEADER
#else
        .long   0                               // reserved
#endif
```

## UEFI boot stub
최종 kernel file인 bzImage(x86)와 Image(arm64)가 PE파일로 compile되어 있다면, 이것은 UEFI boot stub을 사용하고 있는 것이다.    
EFI boot stub을 사용한다는 의미는 UEFI firmware specification을 따르는 firmware에서 직접 kernel을 booting한다는 의미이다.     
arm64에서는 이것이 EFI를 사용하면 efi boot stub 을 사용한 다는 의미이고, x86에서는 legacy 방식인  stage2 bootloader와 유사하게,     
GPT의 ESP에서  stage 2 bootloader를 이용하는 방법도 있기 때문에, CONFIG_EFI_STUB을 통해 활성화 된다.    
linux kernel booting을 위해서, PE header를 사용하는 이유가 바로, UEFI boot stub 을 사용한다는 의미이다.    
EFI boot stub은 다음과 같이 구성된다.    
PE header + setup.elf = setup.bin    
```
[arch/x86/boot/header.S]
    .global bootsect_start
bootsect_start:
#ifdef CONFIG_EFI_STUB
    # "MZ", MS-DOS header
    .byte 0x4d
    .byte 0x5a
#endif
...
#ifdef CONFIG_EFI_STUB
pe_header:
	.ascii	"PE"
	.word 	0
..
	# Filled in by build.c
	.long	0x0000				# AddressOfEntryPoint
...
#endif

~linux/arch/x86/boot$ xxd setup.bin | head
00000000: 4d5a ea07 00c0 078c c88e d88e c08e d031  MZ.............1
```

entry point는 compile시에 동적인 부분을 계산해서 채워주는 build.c에서     
```
[arch/x86/boot/tools/build.c]
static void efi_stub_entry_update(void)
{
#ifdef CONFIG_X86_64
	addr = efi64_stub_entry - 0x200;
#endif

```
**efi64_stub_entry**에서 들어가게 된다.    
arm64에서는 CONFIG_EFI를 활성화 하면, EFI stub 을 사용한다.     
그리고, __EFI_PE_HEADER가 추가된다.    
__EFI_PE_HEADER는 Macro로서, arch/arm64/kernel/efi-header.S에서 .macro로 구현되어 있는 pe coff header이다.    
이 header에 지정된  entry point는 efi_entry()이다.    
arm과 arm64 모두 efi boot stub을 사용할 때 entry로 efi_entry()를 사용하고 있다.     
```
[arch/arm64/kernel/efi-header.S]
.long   __efistub_entry - _head                 // AddressOfEntryPoint

[drivers/firmware/fi/libstub/arm-stub.c]
efi_status_t efi_entry(efi_handle_t handle, efi_system_table_t *sys_table_arg) {}    
```

실제 compile된 Image 파일 첫 부분을 확인해 보자.   

```
$ xxd Image | head
00000000: 4d5a 0091 ffff 4c14 0000 0800 0000 0000  MZ....L.........
00000010: 0070 ad01 0000 0000 0a00 0000 0000 0000  .p..............
00000020: 0000 0000 0000 0000 0000 0000 0000 0000  ................
00000030: 0000 0000 0000 0000 4152 4d64 4000 0000  ........ARMd@...
// res5 -> 0x00000040
00000040: 5045 0000 64aa 0200 0000 0000 0000 0000  PE..d...........
00000050: 0000 0000 a000 0602 0b02 0214 0020 4001  ............. @.
00000060: 0040 6d00 0000 0000 9856 3401 0010 0000  .@m......V4.....
```

x86에서는 bzImage가 확장자를 .efi로 바꿔서, ESP(EFI System Partitio)로 복사하고 이것이 efi boot stub으로서, UEFI firmware에 의해서 부팅된다.    
arm64에서는 압축 커널을 사용하지 않기 때문에, Image파일을 /system에 복사해야 하고, 확장자는 변경할 필요가 없다.   
이렇게 부팅하는 방법을 direct kernel loading이라고 표현하기도 하며, stage2 bootloader대신 kernel이 로드된다.   
이런 방법에서 grub2와 같은 역활은 필수는 아니고, secure boot 지원등의 역활을 수행하는 것으로 보여진다.   

