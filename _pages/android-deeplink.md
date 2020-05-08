---
title: "Deeplink"
permalink: /kdb/android/deeplink/
toc_sticky: true
toc_ads : true
layout: single
---

광고를 출력한다고 수익이 발생하는 것은 아니다.    
Image 광고라면 얼마나 Impression이라고 얼마나 광고가 노출되었는지, 또 Click은 되었는지가 중요할 것이고,     
Video 광고라면 얼마동안 시청했는지, skip은 하지 않았는지 등등의 사용자 행위를 가지고 광고주로 부터 수익이 발생하게 될 것이다.     
특히 광고를 click하는 경우 수익이 발생하게 되는 경우가 많다.     
그만큼 click이라는 행위는 매우 중요하다.    
App의 광고거나, Amazon, 쿠팡 같은 e커머스 광고인 경우 click을 통해 직접적으로 구매 창을 띄우거나, App을 다운로드 받을 수 있도록 해야 할 것이다.     
바로 이런 것이 deeplink이다.   

deferred deeplink는 앱이 설치되어 있다면 특정 페이지로 유도하고,    
앱이 설치되어 있지 않다면, PlayStore로 유도한 후, 앱이 설치되면 특정 페이지로 유도해야 한다는 점이다.     
     
여기에는 난제가 하나 있는데,  이런 deeplink가 fallback에 대한 정보를 제공해 주지 못하고 있는 점이다.    
즉 deeplink가 성공했는지 실패 했는지     

나중에 광고 시스템은 따로 한번 정리를 하려고 하고 있지만.    
전통적인 url과 uri 체계가 있다.     
app_link 체계가 있다.     
이것에 대해서 살펴 보도록 하자.     



# deferred deeplink?

단순히 App을 실행해서 특정 in-app page로 이동하던 deeplink에서 한발짝 발전해서,     
app이 없으면 app을 설치하도록 유도하고, 앱이 설치되면 특정 in-app page로 유도하는 방식이다.     
다음 그림은 대표적인 fallback 방식으로 구현한 deferred deeplink를 표현한 것이다.     

![deferred deeplink](../../../assets/images/linux_deferred_deeplink.png)    

이런 deeplink 방식을 android 단에서 지원하는 것은 아니고, 그림에서 처럼 startActivity()를 통해서 app을 실행 후,      
exception이 발생하면 appstore의 url을 실행하는 방식을 코드단으로 구현해야 하는 것이다.    
또한 deeplink url 자체에 appstore url도 포함되어 있어야 할 것이다.      

# Dynamic link on Firebase One link on Appsflyer
iosiiaisfsafis
ios와 android는 다른 link를 가져야 하는 것을 해결한 것이다.    

