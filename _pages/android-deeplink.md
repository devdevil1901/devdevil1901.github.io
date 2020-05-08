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

# deferred deeplink?

단순히 App을 실행해서 특정 in-app page로 이동하던 deeplink에서 한발짝 발전해서,     
app이 없으면 app을 설치하도록 유도하고, 앱이 설치되면 특정 in-app page로 유도하는 방식이다.     
다음 그림은 대표적인 fallback 방식으로 구현한 deferred deeplink를 표현한 것이다.     

![deferred deeplink](../../../assets/images/linux_deferred_deeplink.png)    

이런 deeplink 방식을 android 단에서 지원하는 것은 아니고, 그림에서 처럼 startActivity()를 통해서 app을 실행 후,      
exception이 발생하면 appstore의 url을 실행하는 방식을 코드단으로 구현해야 하는 것이다.    
또한 deeplink url 자체에 appstore url도 포함되어 있어야 할 것이다.      
(market://package_name://url)      

이런 것을 시스템 적으로 풀어낸 것이 바로 IOS의 Universal link와 Android의 app link이다.     

# Android AppLink
명백히 IOS 9에 도입된 Universal Link를 따라한 것이다.      
Deeplink를 구현한다면 IOS에서는 Universal Link를 Android에서는 AppLink를 구현하는 것이 바람직하다.     
서버에서는 동일한 형식의 format으로 deeplink를 전달해 줄 수 있다.     
사실 Android는 IOS의 전반적인 부분을 많이 모방한다.     

위에서 설명한 fallback 방식의 deeplink를 사용하게 되면, 앱을 실행할 때 app selection dialog가 뜨게 된다.    
하지만 AppLink를 사용하게 되면, dialog는 표시되지 않는다.      
이것은 link가 hash value로 verified되기 때문에다.     
※  이러기 위해서는 [digital asset link](https://developers.google.com/digital-asset-links/v1/getting-started) 가 https의 웹 서버에서 service 되어야 한다.      
   android는 Manifest 파일에서 지정된(assetlinks.json) host만 검색한다.[참조](https://developer.android.com/training/app-links/verify-site-associations)      

fallback의 처리는 server side에서 redirection으로 처리된다.(universal link와 같음)    

형식은 다음과 같다.     
```
https://mydomain.com/path/to/content
````
이 형식은 Universal Links와 동일하다.     


API 23(Android 6.0) 부터 사용가능하다.     

# References
[Universal links, Uri schemes, App Link, and Deep links what's difference](https://blog.branch.io/universal-links-uri-schemes-app-links-and-deep-links-whats-the-difference/)     
[Android App Linking](https://simonmarquis.github.io/Android-App-Linking/)    
[Add Android App Links](https://developer.android.com/studio/write/app-link-indexing)     

