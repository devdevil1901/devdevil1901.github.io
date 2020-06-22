---
title: "Android Booting"
permalink: /kdb/android/build/
toc_sticky: true
toc_ads : true
layout: single
---

# How to build

|stage|to do|
|---|---|
|requirement|sudo apt-get install git-core gnupg flex bison gperf build-essential zip<br/>sudo apt-get install curl zlib1g-dev gcc-multilib g++-multilib libc6-dev-i386<br/> sudo apt-get install lib32ncurses5-dev x11proto-core-dev<br/>sudo apt-get install libx11-dev lib32z-dev libgl1-mesa-dev libxml2-utils xsltproc unzip<br/>sudo apt-get install python-networkx<br/>sudo apt install repo<br/>|
|config|~/.profile<br/>export OUT_DIR_COMMON_BASE=/home/devdevil/aosp<br/>source ~/.profile|
|download|branch는 https://source.android.com/setup/start/build-numbers#source-code-tags-and-builds를 참고해서 고른다.<br/>Branch 변경 시에도 repo init 을 다시 해줘야한다.<br/>repo init -u https://android.googlesource.com/platform/manifest -b android-10.0.0_r33<br/>repo sync -j16<br/><br/>만약에 다음과 같은 error가 나온다면,<br/>repo: warning: Python 2 is no longer supported; Please upgrade to Python 3.6+.<br/>다음과 같이 해준다.<br/>sudo apt install python3.7<br/>sudo rm -f /usr/bin/python<br/>sudo ln -s /usr/bin/python3.7 /usr/bin/python<br/>python --version<br/>Python 3.7.7<br/><br/>j16의 16은 내 PC의 hardware thread가 16개이기 때문이다.<br/>|
|select|source build/envsetup.sh<br/>lunch<br/><br/>You're building on Linux<br/>보통 aosp_x86_64-eng를 선택한다. eng는 engineer를 의미한다. development engineer.<br/>가장 큰 권한이 부여된다. (root, etc)<br/>그리고 debugging을 위한 tool들과 개발자 설정이 포함된다.</br>user는 market에 release되는 버전이다.<br/>debug할 수 없고, root도 아닌버전<br/>userdebug는 user version기반에서 root와 debug permission이 추가된 것.|
|compile|m -j16|
|execution|compile이 완료된 후에 emulator를 입력하면 새로 compile된 image로 emulator를 실행한다.<br/>$ emulator<br/>이것이 사실 실행하는 것은 <br/>prebuilts/android-emulator/linux-x86_64/emulator이다.<br/>eng 버전 이기 때문에 adb shell도 그냥 root이다.<br/>emulator 실행을 위한 image는 aosp/target/product/generic_x86_64/<br/>에 생성된다.|
|rebuild|build/envsetup.sh에서는 lunch를 실행했을 때, path 작업을 해주기 때문에 m -j16이 아니라, lunch부터 다시 해 줘야 한다.<br/>그래야 emulator를 제대로 실행가능<br/>물론 m -j16으로 컴파일을 할 필요는 없다.|

Android 공식 문서는 다음을 참조하자.   
[downloading](https://source.android.com/setup/build/downloading)   
[setup](https://source.android.com/setup/build/initializing)   


# location

|location|description|
|---|---|
|./device/|architecture별, configuration<br/>x86_64는 ./device/generic/x86_64/BoardConfig.mk<br/>aarch64는 ./device/generic/arm64/BoardConfig.mk|
|./art|binary davlikvm, dex2oat, dexoptanlyzer, profman과<br/> library libart, libart-compiler, libopenjdkjvm, libopenjdkjvmti를 compile하기 위한 source directory|


