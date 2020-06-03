---
title: "TEE(Trusted Execution Environment)"
permalink: /kdb/security/tee/
toc_sticky: true
toc_ads : true
layout: single
---

# Outline
작성중이다.   
영국의 TEE 관련 회사의 제품을 글로벌로 서비스되는 앱에 도입 검토를 한적이 있었다.   

# TEE

# Trusty
Trusty는 Android의 TEE에서 제공하는 secure os로서,      
Trusty OS는 Android OS와 동일한 프로세서에서 실행되지만, Trusty는 하드웨어와 소프트웨어에 의해 시스템의 나머지 부분과 분리된다.    
Trusty와 Android는 서로 평행하게 실행됩니다. 
Trusty는 장치의 메인 프로세서와 메모리의 최대 전원에 액세스할 수 있지만 완전히 격리되어 있습니다.
Trusty의 분리는 사용자가 설치한 악성 앱과 Android에서 발견될 수 있는 잠재적인 취약성으로부터 이를 보호합니다.

Trusty는 ARM 및 Intel 프로세서와 호환됩니다. 
ARM 시스템에서 Trusty는 ARM의 Trustzone™을 사용하여 메인 프로세서를 가상화하고 안전한 신뢰할 수 있는 실행 환경을 만듭니다. 
Intel의 가상화 기술을 사용하는 Intel x86 플랫폼에서도 유사한 지원이 제공됩니다.

Trusty는 다음으로 구성된다.   
* 작은 kernel
* user level의 library(kernel driver로 trusted tasks/service와 communication하기 위한 kernel driver.   
[Trusty API Reference](https://source.android.com/security/trusty/trusty-ref)   

Trusty는 opensource이고, 다른 TEE는 비싸다.(내가 검토 했던 영국의 .... 쯔쯔쯔)   
구글에서는 다음과 같이 권고하고 있다.(아니, 홍보)       
Trusty를 표준으로 사용하면 애플리케이션 개발자가 여러 TEE 시스템의 단편화를 고려하지 않고 애플리케이션을 쉽게 만들고 배포할 수 있습니다. Trusty TEE는 개발자와 파트너에게 투명성, 협업, 코드의 검사 가능성 및 디버깅 용이성을 제공합니다. 신뢰할 수 있는 응용프로그램 개발자는 공통 도구 및 API를 중심으로 통합하여 보안 취약점을 도입하는 위험을 줄일 수 있습니다. 이러한 개발자는 추가 개발 없이 애플리케이션을 개발하여 여러 기기에서 애플리케이션을 재사용할 수 있다는 확신을 가질 수 있습니다.

TEE는 모바일 기기에서 빠르게 표준이 되어가고 있다고 함.   
TEE를 활용할 수 있는 분야는 모바일 결제, Banking, 다중인증, 장치재설정 보호, 재생 방지 영구 스토리지, 보안 PIN 및 지문처리, Malware 탐지 등이라고 이야기 함 (구글)   

## 1. Application과 Service
Trusty Application은 실행파일과 resource 파일들, 이진 manifest 파일, 암호화 서명의 collection으로 구성된다.    
Trusty application은 Trusty kernel아래 unpriviledged mode의 격리된 process로 실행된다.      
각 프로세스는 TEE의 자체 가상 memory sandbox에서 실행된다.    

-> Schduling에도 추가해야 할 듯.
모든 Trusty application은 같은  priority를 공유한다.  
secure timer tick에 의한 round-robin scheduler의 priority기반으로 스케줄링 된다.   

## 2. third-party trusty applications 
현재 모든 신뢰할 수 있는 응용프로그램은 단일 당사자에 의해 개발되고 신뢰할 수 있는 커널 이미지와 함께 패키지됩니다. 부팅하는 동안 부트 로더에 의해 전체 이미지가 서명 및 검증됩니다.
현재 Trusty에서는 타사 애플리케이션 개발이 지원되지 않습니다.
Trusty는 새로운 응용 프로그램을 개발할 수 있지만 이를 위해 최대한 주의를 기울여야 합니다. 새로운 응용 프로그램은 시스템의 신뢰할 수 있는 컴퓨팅 기반(TCB) 영역을 늘립니다.
신뢰할 수 있는 응용 프로그램은 장치 기밀에 액세스하고 이를 사용하여 계산 또는 데이터 변환을 수행할 수 있습니다.
TEE에서 실행되는 새로운 애플리케이션을 개발할 수 있는 능력은 혁신의 많은 가능성을 열어줍니다.
그러나 TEE의 정의로 인해 이러한 응용프로그램은 어떤 형태의 신뢰가 연결되지 않으면 배포될 수 없습니다.

## 3. Build
```
mkdir trusty
cd trusty
repo init -u https://android.googlesource.com/trusty/manifest -b master
repo sync -j32
./trusty/vendor/google/aosp/scripts/build.py generic-arm64
ls build-root/build-generic-arm64/lk.bin
```


# References
[Trusty-kernel](https://android.googlesource.com/kernel/common/+/android-trusty-4.14)  
[TrustZone Technology](http://infocenter.arm.com/help/topic/com.arm.doc.prd29-genc-009492c/PRD29-GENC-009492C_trustzone_security_whitepaper.pdf)   

 
