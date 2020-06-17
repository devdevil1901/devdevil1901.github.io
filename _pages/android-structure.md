---
title: "Android Structure"
permalink: /kdb/android/structure/
toc_sticky: true
toc_ads : true
layout: single
---

# Table of content

# Outline
Android의 layout은 다음과 같다.   

<pre>
++++++++++++++++++++++++++++
+ Application              +
++++++++++++++++++++++++++++
+ Application Framework    +
++++++++++++++++++++++++++++
+ Binder IPC Proxies       +
++++++++++++++++++++++++++++
+ Android System Service   +
++++++++++++++++++++++++++++
+ HAL                      +
++++++++++++++++++++++++++++
+ BIONIC                   +
++++++++++++++++++++++++++++
+ Kernel                   +
++++++++++++++++++++++++++++
+ Hardware                 +
++++++++++++++++++++++++++++
</pre>

# System Service
Hardware와 같은 raw level과 Application Framework가 communication할 수 있게 해주는 layer.   
App을 개발하는 개발자들은 Android Framework에서 제공하는 API를 이용해서 개발을 하게 되는데.    
이 API들중에 일부는 System Service를 통해서 구현되어 있다.   
Window Manager, Notification Manager, Playing Manager, SurfaceFlinger, netd, logcatd, rild등이 있다.   
 
System Service의 구현을 살펴보도록 하자.  
각 System Service는 **SystemServer class를 상속**받아 구현하고, 
**com.android.server** domain을 가진다.   
 

# Google Play Service API
다음과 같은 구조이다.    
<pre>
+++++++++++++++++                
|  APP          |                
+++++++++++++++++                     ++++++++++++++++++++++++++
|  API()         |++++++ IPC  +++++++| Google Play Services    | 
+++++++++++++++++                     ++++++++++++++++++++++++++
</pre>

Google Play Service는 별도의 apk이고,    
Background Service로 실행된다.    
client library는 IPC를 통해 이 service와 통신하는 것이다.    

[PendingResult](https://developers.google.com/android/reference/com/google/android/gms/common/api/PendingResult?hl=ko)

## 사용
4.1이전에서는 사용할 수 없다.   
이를 검사하기 위해서는,(Global APP에서는 또 다른 의미로 필요할 수 있다.)    
GoogleApiAvailablility::isGooglePlayServicesAvailable()로 확인하였다.     
Google Service를 호출하려면, Google Developer Console에서 App을 등록해야한다.   

## lists

|API|build.gradle|
|---|---|
|Google+|com.google.android.gms:play-services-plus:17.0.0|
|Google Account Login|com.google.android.gms:play-services-auth:18.0.0|
|Google Actions, Base Client Library|com.google.android.gms:play-services-base:17.3.0|
|Google Sign In|com.google.android.gms:play-services-identity:17.0.0|
|Google Analytics|com.google.android.gms:play-services-analytics:17.0.0|
|Google Awareness|com.google.android.gms:play-services-awareness:18.0.0|
|Google Cast|com.google.android.gms:play-services-cast:18.1.0|
|Google Cloud Messaging|com.google.android.gms:play-services-gcm:17.0.0|
|Google Drive|com.google.android.gms:play-services-drive:17.0.0|
|Google Fit|com.google.android.gms:play-services-fitness:18.0.0|
|Google Location and Activity Recognition|com.google.android.gms:play-services-location:17.0.0|
|Google Mobile Ads|com.google.android.gms:play-services-ads:19.1.0|
|Mobile Vision|com.google.android.gms:play-services-vision:20.1.0|
|Google Nearby|com.google.android.gms:play-services-nearby:17.0.0|
|Google Panorama Viewer|com.google.android.gms:play-services-panorama:17.0.0|
|Google Play Game services|com.google.android.gms:play-services-games:19.0.0|
|SafetyNet|com.google.android.gms:play-services-safetynet:17.0.0|
|Google Pay|com.google.android.gms:play-services-wallet:18.0.0|
|Wear OS by Google|com.google.android.gms:play-services-wearable:17.0.0|

상세한 API의 package는 [여기서](https://developers.google.com/android/reference/packages?hl=ko) 확인할 수 있다.      


# References
[Google Play Service](https://developers.google.com/android?hl=ko)   

