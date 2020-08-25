---
title: "Hardware"
permalink: /kdb/linux/hardware/
toc_sticky: true
toc_ads : true
layout: single
---

# Table of content
[Outline](#outline)   
[DTB](#dtb)    
	1. [process](#1-process)    
	2. [location](#2-location)    
	3. [tpye](#3-type)    
	4. [overlay](#4-overlay)   
[ACPI](#acpiadvanced-configuration-and-power-interface)   

# Outline
[numa](/kdb/linux/numa/)에서 살펴 보았듯이, hardware가 어떻게 구성되었는지에 대한 정보를 kernel에서는 필요로 한다.       
왜냐면 RAM,CPU,EMMC등 device들의 상세한 Hardware Spec은 제조사 마다 다를 것이고,      
구성도 제품마다, 틀릴 것이기  때문이다.      
x86에서는 이 정보를 **ACPI** 형식으로 bootloadr나 efi manager가 kernel에 parameter로 전달하고,      
arm64에서는 **DTB** 형식으로 전달한다.       
kernel은 이정보를 가지고 device 관련 data들을 초기화 한다.      
예를 들어 NUMA의 node 구성 정보로 schduling관련 자료구조들의 값을 초기화 해야 하는데 이 정보를 바로 DTB형식으로 전달받는 것이다.        
이전kernel에서 machine descriptor를 이용하던 것을 대체한 개념.       
관련 정보는      
**/sys/firmware/acpi**      
**/sys/firmware/devicetree**     
에서 확인 가능하다. 

# DTB
DTB(Device Tree Blob)/FDT(Flattened Device Tree)   
linux aarch64 architecture에서는  booting시에, bootloader가 구성해서 kernel로 전달하는 자료구조이다.   
kernel은 DTB를 이용해서 초기화를 수행한다.        
때문에 Android와 Linux에서는 매우 중요한 부분이다.   
결국 Hardware device의 명세역활.   

먼저 용어를 살펴보자.   

|||
|---|---|
|DT|Device Tree<br/>node와 node의 property들로 구성된 tree 구조.<br/>|
|DTB|Devie Tree Blob<br/>FDT blob을 의미한다.|
|DTBO|Overlay용 DTB|
|DTC|Device Tree Compiler|
|DTO|Device Tree Overlay|
|DTS|Device Tree Source<br/>board-level definitions|
|DTSI|Device Tree Source Include<br/>SoC-level definition|
|FDT|Flattened Device Tree|

hardware 업체에서는 dts를 제공하고, linux는 dtb로 이를 compile한다.   
이 dtb는 kernel Image안에 포함되거나(Image.gz-dtb),   
dt.img(Android에서)와 같이 별도로 존재하기도한다.   
**최신 pixel의 factory image의 boot.img를 extract해 보면, 별도의 image 파일로 존재하고 있음을 확인할 수 있다.**   
즉 이 dtb를 bootloader가 읽어서, kernel로 전달하는 것.    
DTB를 사용하기 이전에는(arm64이전) machine code만 받았고, 이를 처리하는 명세는 커널 코드에 있었다.    
이것이 특히 문제가 된 것은 SoC였다.   
**SoC**에서는 다양한 vendor에 다양한 코드가 있었고, 다음과 같이 vendor별 코드들이 존재 하였다. 
```
$ cd arch/arm/mach-
mach-actions/    mach-axxia/      mach-digicolor/  mach-footbridge/ mach-iop32x/     mach-meson/      mach-mxs/        mach-orion5x/    mach-rda/        mach-s5pv210/    mach-stm32/      mach-ux500/
mach-alpine/     mach-bcm/        mach-dove/       mach-gemini/     mach-ixp4xx/     mach-milbeaut/   mach-nomadik/    mach-oxnas/      mach-realview/   mach-sa1100/     mach-sunxi/      mach-versatile/
mach-artpec/     mach-berlin/     mach-ebsa110/    mach-highbank/   mach-keystone/   mach-mmp/        mach-npcm/       mach-picoxcell/  mach-rockchip/   mach-shmobile/   mach-tango/      mach-vexpress/
mach-asm9260/    mach-clps711x/   mach-efm32/      mach-hisi/       mach-lpc18xx/    mach-moxart/     mach-nspire/     mach-prima2/     mach-rpc/        mach-socfpga/    mach-tegra/      mach-vt8500/
mach-aspeed/     mach-cns3xxx/    mach-ep93xx/     mach-imx/        mach-lpc32xx/    mach-mv78xx0/    mach-omap1/      mach-pxa/        mach-s3c24xx/    mach-spear/      mach-u300/       mach-zx/
mach-at91/       mach-davinci/    mach-exynos/     mach-integrator/ mach-mediatek/   mach-mvebu/      mach-omap2/      mach-qcom/       mach-s3c64xx/    mach-sti/        mach-uniphier/   mach-zynq/
```
aarch64에서는 각 vendor 별로 각가 code로 위처럼 코드로 존재 하던 부분들을,   
공통적인 DTB라는 interface 형식에 맞춰서,  
.config에서 활성화 되어 있느냐에 따라,       
dtb 파일로 아래 위치에서  다음과 같이 생성하도록 하였고,     
```
$ cd arch/arm64/boot/dts/
Makefile  al         altera  amlogic  arm      broadcom  exynos     hisilicon  lg       mediatek  qcom     renesas   socionext  synaptics  xilinx
actions   allwinner  amd     apm      bitmain  cavium    freescale  intel      marvell  nvidia    realtek  rockchip  sprd       ti         zte
```
arch/arm64/Kconfig.platforms에서, 각 product별로 필요한 option을,  
kernel compile시, **make menuconfig**을 통해서,   
선택할 수 있도록 하였다.   
즉 삼성 엑시노스는 다음과 같은 kernel compile항목을 선택할 수 있도록 한 것이다.  
```
config ARCH_EXYNOS
    bool "ARMv8 based Samsung Exynos SoC family"
    select COMMON_CLK_SAMSUNG
    select EXYNOS_CHIPID
    select EXYNOS_PM_DOMAINS if PM_GENERIC_DOMAINS
    select EXYNOS_PMU
    select HAVE_S3C2410_WATCHDOG if WATCHDOG
    select HAVE_S3C_RTC if RTC_CLASS
    select PINCTRL
    select PINCTRL_EXYNOS
    select PM_GENERIC_DOMAINS if PM
    select SOC_SAMSUNG
    help
      This enables support for ARMv8 based Samsung Exynos SoC family.
```

이 옵션에 대한 상세 구현은 drivers/soc/vendor에 존재한다.     
예를 들어, EXYNOS_CHIPID를 선택했다면, 
```
drivers/soc/samsung
Makefile:obj-$(CONFIG_EXYNOS_CHIPID)	+= exynos-chipid.o
```
추가 파일이 compile되게 한다.  

>참고로 Kconfig.xxx 파일들이 menuconfig을 구성하게 해주는 파일이다.   

Linux에서 다음과 같은 제약이 존재 한다.   
* DTB는 8 bytes boundary에 위치해야한다.    
* 크기가 2MB를 초과할 수 없다. 2MB 크기의 block들로 구성된다.       
* cache할 수 있도록 mapping된다.  
* kernel image 아래의 text_offset bytes에서 시작하는 512MB 영역이다.    

새로운 Device Tree의 추가를 위해서는,   
arch/arm64/boot/dts/vendor에 dts를 추가후에,   
같은 디렉토리 Makefile에 CONFIG_ARCH_namexxx을 추가해 주어야 한다.   
## 1. process
DTB가 kernel의 boot parameter로 전달 받는 것이기 때문에,      
page table이 활성화 되기 이전에 사용해야 하는 상황이 된다.     
때문에 Fixmap을 이용해서 mapping한다.      

```
start_kernel()
-> setup_arch()
-> setup_machine_fdt()
-> early_init_dt_scan()
-> early_init_dt_scan_nodes()
-> of_scan_flat_dt()
-> early_init_dt_scan_memory()
```

## 2. location
kernel에서, **arch/arm64/boot/dts/vendor/**에 DTB source가 위치한다.     
dts와 dtsi 파일이 여기에 있으며, kernel을 build하면 dtb 파일이 만들어 진다.       
중국의 hisilicon, 가장 많이 쓰이는 qualcom의 msm등, smart phone의 dtb들도 여기에 위치하고 있다.      
예를 들어 퀄퀌의 MSM관련 dtbs는  arch/arm64/boot/dts/qcom에서 확인가능하다.   
(dts는 include로 dtsi파일을 포함하게 된다.)   

## 3. type
dtb.img는 두 형식중에 하나이다.(dtbo도 dtb와 동일한 형식에 만든 주체와 확장자만 틀린것을 기억하자)   
* fdt_header type   
* dt_table type  

fdt_header는 dt blob이 순차적으로 연결된다.     
구현은 다음과 같다.   
```
kernel/scripts/dtc/libfdt/fdt.h
struct fdt_header {
	fdt32_t magic;       	/* magic word FDT_MAGIC */
	fdt32_t totalsize;   	/* total size of DT block */
	fdt32_t off_dt_struct;   	/* offset to structure */
	fdt32_t off_dt_strings;  	/* offset to strings */
	fdt32_t off_mem_rsvmap;  	/* offset to memory reserve map */
	fdt32_t version;     	/* format version */
	fdt32_t last_comp_version;   /* last compatible version */

	/* version 2 fields below */
	fdt32_t boot_cpuid_phys; 	/* Which physical CPU id we're
                    	booting on */
	/* version 3 fields below */
	fdt32_t size_dt_strings; 	/* size of the strings block */

	/* version 17 fields below */
	fdt32_t size_dt_struct;  	/* size of the structure block */
};

#define FDT_MAGIC   0xd00dfeed  /* 4: version, 4: total size */
```

dt_table type은 dtb/dtbo partition 구조로서,   
구현은 다음과 같다.         

```
aosp/system/libufdt/utils/src/dt_table.h
#define DT_TABLE_MAGIC 0xd7b7ab1e
#define DT_TABLE_DEFAULT_PAGE_SIZE 2048
#define DT_TABLE_DEFAULT_VERSION 0

struct dt_table_header {
  uint32_t magic;         	/* DT_TABLE_MAGIC */
  uint32_t total_size;    	/* includes dt_table_header + all dt_table_entry
                             	and all dtb/dtbo */
  uint32_t header_size;   	/* sizeof(dt_table_header) */

  uint32_t dt_entry_size; 	/* sizeof(dt_table_entry) */
  uint32_t dt_entry_count;	/* number of dt_table_entry */
  uint32_t dt_entries_offset; /* offset to the first dt_table_entry
                             	from head of dt_table_header.
                             	The value will be equal to header_size if
                             	no padding is appended */

  uint32_t page_size;     	/* flash page size we assume */
  uint32_t version;       	/* DTBO image version, the current version is 0.
                             	The version will be incremented when the dt_table_header
                             	struct is updated. */
};
```

pixel 최신 버전의 factory image의 boot.img를 풀어서 본 magic을 확인해 보면,   
dtb는 다음과 같이 fdt_header type을 사용하고 있는 것을 확인할 수 있다.   
```
$ xxd dtb | head
00000000: d00d feed 0007 aab3 0000 0038 0007 0928  ...........8...(
00000010: 0000 0028 0000 0011 0000 0010 0000 0000  ...(............
00000020: 0000 a18b 0007 08f0 0000 0000 0000 0000  ................
00000030: 0000 0000 0000 0000 0000 0001 0000 0000  ................
00000040: 0000 0003 0000 0004 0000 0000 0000 0002  ................
00000050: 0000 0003 0000 0004 0000 000f 0000 0002  ................
00000060: 0000 0003 0000 002a 0000 001b 5175 616c  .......*....Qual
00000070: 636f 6d6d 2054 6563 686e 6f6c 6f67 6965  comm Technologie
00000080: 732c 2049 6e63 2e20 534d 3831 3530 2076  s, Inc. SM8150 v
00000090: 3220 536f 4300 0000 0000 0003 0000 000c  2 SoC...........
```

## 4. overlay
basic dt와 overlay dt 두가지 형식이 존재한다.   
이 두개가 합쳐져서 사용되기 때문에 호환성도 중요한 부분이다.    
두 dt 모두, bootloader가 접근할 수 있는 partition에 위치해야 한다.   

**basic dt**는 SOC 전용 부분 및 기본 구성에 대한 것으로 SOC 공급업체에 의해서 제공된다.   
.dts를 dtc로 .dtb로 compile   
Boot partition의 일부로 kernel(image.gz)에 추가하거나 별도의 partition(dtb)에 배치한다.   

**overlay dt**는, ODM/OEM에 의해 제공되며, device의 전용 구성이다.   
.dts를 dtc로 .dtbo로 compile  
사실 dtb와 동일한 형식이다.   
Dtbo partition에 배치하거나, odm partition에 위치시킨다.   
물론 이 경우, bootloader가 odm partition에 access할 수 있어야 한다.   



# ACPI(Advanced Configuration and Power Interface) 
DTB와 같이 hardware를 기술하기 위한 표준이다.
[more detail](https://elinux.org/images/f/f8/ACPI_vs_DT.pdf)

