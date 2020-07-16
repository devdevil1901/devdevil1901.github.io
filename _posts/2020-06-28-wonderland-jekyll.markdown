---
layout: post
title:  "Wonderland"
date:   2020-06-28 12:38:33 +0900
published : false
categories: jekyll update
---

며칠간 고민해 보았는데 치킨 집 보다 더 안좋다.   
결국에 이것으로 사업을 하는 것은 매우 아닌듯 하다. 그렇지만 wonderland는 틈틈히 개발 하도록 하자.   
취업이 맞다.    
그래 공부를 하자. 공부를.  

> Idea는 실제로 그것이 구현되어 가면서 비로서 완성될 수 있는 것이다. 마크 주커버그      

# Strategy
1. 개발 효율성 향상을 위해서, APP을 root 권한으로 권한 상승 시키는 방법을 사용한다.    
즉 kotlin 코드로 root 권한 동작이 가능하도록 한다.   

2. kernel 자체를 수정 해서, diff로 코드를 관리 하는 식으로 가도록 한다. 근데 그러면 전체 커널 소스를 유지 보수 해야 한다.  
즉 개발은 커널 소스로 하고, git에서는 patch 형태로 유지해야 할 듯 하다.   

3. 음... binder에서 king을 호출하고 king은 device driver가 아니라, character device를 열면 된다.  
대세인 miscdevice를 이용하도록 하자. 

king은 먼저 App인 Cheshire Cat은 root 권한으로 상승 시킨다.  

4. injection 필요 없이. file_operations에서, .mmap을 이용하는 방법이 있을 수 있겠다.!! madcode 처럼. 

5. kernel module이 변경되었다면 이의 반영을 위해 -no-snapshot 옵션을 줘서, 콜드 부트를 해야 한다.   
qemu 이것 부터 확실히 공부해서 마스터 해 놓고 넘어가도록 하자.   
각 image 그리고 그것의 unpack and pack 이런 것들을 마스터 하고 가도록 하자.   

# Design
![rough 한 design](https://docs.google.com/drawings/d/e/2PACX-1vRVTNgPyqASYIH5N2KAJNLYpJ04HOZg3-YztOiYeCcUpdByItm50qFz0boKXB5LJB5p3IOSzOUxzitX/pub?w=1440&h=1080)   


## 1. 시퀀스 
White Rabbit이 wonderserver
king은 먼저 App인 Cheshire Cat은 root 권한으로 상승 시킨다.  
2.

# Mock이라던지 Module Test를 대체할 수 있는 개념. 
Build Variant에 wonderland를 추가해서, 이거용으로 빌드 한다.  

# 구상-> Specification by example로 변형시켜야 한다.  
1. 개인 라이센스로 구매할 수 있도록 하는 시스템. 
즉 IDA와 같은 식으로 몇 십만원 내면 구매. 
개발툴은 팔린다. 때문에 이것은 가능성이 있다. 그리고 파편화도 대응케 해주는 식으로.

2. hooking 구조로 가야 한다.  
그래야 호환성을 높일 수가 있다. 또 live update도 가능하다.   

3. avd image manager 구조가 있어서, image 생성 부터 편하게 해주고 여기서 유명한 phone의 사양으로 세팅할 수 있도록 해주어야 한다.  
또 가능하면 (이건 좀 어렵다) phone의 architecture를 반영해 주면 좋다. 

4. packet을 class나 package를 지정하면 지정한 녀석의 packet을 모니터링 해 주고, json등의 내용도 추출해 준다.   

5. 가장 중요한 것은 이 VM에서 실행 할 때는 Wonderland라는 system services를 추가해서, 특정 API로 detail 하게 제어할 수 있도록 하는 것이다. 

6. 특정 object가 살아남는 

# 버전 별 호환성을 높이기 위해서는  
각 유명한 폰의 사양을 정확히 파악해야 한다. 즉 기기에 대한 이해도가 높아야 한다. 
그래서 vm에 구현해야 한다.   


# To do

* Google play 버전에서, kernel만 바꿔서 하는 것을 확인 해 봐야 한다.   
만약에 이게 된다면, 커널에서 CheshireCat, wonderserver등등을 전부 root 권한으로 바꾸어 주자.  
GooglePlay와 GoogleApi 버전 모두 확인해 보아야 한다.  

ok 확실히 감은 잡았다. 

된다!! ok 감잡았다. 모든 파일들은 일반 권한으로 설치 하고, 커널단에서 root 권한을 부여 하도록 하자.  
아니다. -kernel option은 먹히지 않는다.  
Google API 까지만 된다. okay!!! 
일단 이걸로 가자.  

* cuttlefish를 살펴 봐야 한다. android emulator와는 다르게 서버단에서 혹은 이를 이용해서 로컬에서도 동작하도록 하는 것 같다.    
뭔가 framework의 높은 충성도를 이야기 하는데 avd의 aosp가 일반 폰과 동일 소스로 컴파일 하기 때문에 HAL쪽 즉 Hardware쪽을 이야기 하는 듯도 싶다.  
https://www.linuxplumbersconf.org/event/2/contributions/269/attachments/56/63/Kernel_Hacking_with_Cuttlefish.pdf   
https://source.android.google.cn/setup/create/cuttlefish?hl=ko   

# Reference  
[Xiomi black shark2 rooting 방법](https://www.getdroidtips.com/root-black-shark-2-pro/)   
[diff로 patch 만들기](https://twpower.github.io/195-how-to-apply-patch-file)    
