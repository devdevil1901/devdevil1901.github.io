---
title: "Booting"
permalink: /kdb/linux/boot/
toc_sticky: true
toc_ads : true
layout: single
---

# Table of contents
[Boot Protocol](#boot-protocol)       
[1. setup header](#1-setup-header)       
[1.1 vid_mode](#11-vid_mode)        
[1.2 bootloader-identifier](#12-bootloader-identifier)          
[1.3 boot protocol option flag](#13-boot-protocol-option-flag)               
[1.4 boot protocol option flag](#14-code32_start)               
[1.5 ramdisk image](#15-ramdisk_image)               
[1.6 xloadflags](#16-xloadflags)               
[1.7 setup data](#17-setup_data)               
[1.8 init_size](#18-init_size)               
[1.9 kernel version](#19-kernel-version)               
[2. Efi handover protocol](#2-efi-handover-protocol)       
[Analysis of boot process](#analysis-of-boot-processing)      
[1. Efi boot 방식 확인](#1-efi-boot-%EB%B0%A9%EC%8B%9D-%ED%99%95%EC%9D%B8)        
[2. Checking of file system](#2-checking-of-file-system)        
[3. Firmware test](#3-firmware-test)        

# Boot Protocol
v5.7-rc3 기준으로 boot protocol은 2.15 version 까지 존재한다.   
kernel size가 512kb를 넘으면 사용하는(사실상 모든 kernel이 사용하는) 메모리 layout은 다음과 같다.    
![bzImage](../../../assets/images/linux_layout_inmemory.png)   

장치의 실제 sector size와는 무관하게, boot protocol에서 한 sector는 512 byte를 의미한다.   
(어짜피 GTP의 1LBA도 512 byte이다.)   
kernel loading의 첫 단계로 real-mode code(kernel setup and boot sector)가 load된다.   
protected kernel인 vmlinux.bin은 0x100000에 relocation된다.   
그리고 더 낮은 부분에 setup code가 배치되고, MBR에서 읽어온 stage 1 bootloader도 배치된다.    

## 1. setup header
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

