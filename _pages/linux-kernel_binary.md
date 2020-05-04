---
title: "Kernel Binary"
permalink: /kdb/linux/binary/
toc_sticky: true
toc_ads : true
layout: single
---

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
## on x86_64
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


