---
title: "Graphic User Interface"
permalink: /kdb/android/ui/
toc_sticky: true
toc_ads : true
layout: single
---


# Table of contents    

# Outline
GUI 부분은 사실 어려운 부분은 아니다.   
하지만, 상당히 복잡한 부분이 있기 때문에(특히 Android) 기본 개념을 잘 잡아 놓는 것이 중요하다.    
Application 개발자로 전직후에 중요한 프로젝트를 맡으면서, 처음 개발해 보는 GUI를 미루지 않고,    
직접 개발했던 이유는 사용자가 직접 사용하는 부분이기 때문에 그 만큼 중요하다고 생각 했기  때문이다.    

# Maintaining data
GUI에 대해서 자세히 살펴보기 전에,  어디에 뭘 저장해야 하는지를 정리해 놓고 가는 것이 중요하다.    
여기서 data는 method, data를 포괄하는 개념으로 사용하도록 하겠다.      
다양한 componet, 즉 service, activity 등에서 사용해야 하는 network client wrapper라던가,    
광고의 API들을 쉽게 사용할 수 있게 하는 wrapper등은 어디에 위치해야 할까?    

Data를 저장하는데 있어서, 생각해야 할 것은 **시점**, **속성**, **범위**이다.   

# Holding data separated from life cycle
생명주기와 분리된 데이터를 유지할 필요성은 항상 발생한다.   
이런때 사용할 수 있는 것이 Application과 ViewModel이다.   

Application은 다음과 같은 상황에서 추천된다.   
1. **매우 이른 시점(첫 activity가 실행되기 전)**
2. **생명주기와 분리된 지속적인 시점**과 **넒은 범위의 접근이 필요할 때** 
3. **static immutable한 object**


Application은 첫 번째 activity가 실행되기 전에 초기화 해야 할 작업들에 적당하다.   
예를 들면, 서버에서 설정을 받아온다거나, Login 처리라던가 이런 작업들이 해당 할 수 있을 것이다.   
또한 매우 넓은 범위에서의 data에 적당하다.   모든 component의 범위, 즉 activity와 service등

1. Application은 첫 번째 activity가 실행되기 전에 초기화 해야 하는 작업들.    
서버에서 설정 받아오기, login 처리 등.   
2. 모든 component들에 공유되어야 하는 전역 초기화 정보.    
서버에서 받은 설정이나, exception/crash reporting option, rxjava 예외 처리 option 같은 것들.      
3. 

Application class는 다음과 같은 상황에서 사용된다.   
* 첫 번째 activity가 실행되기 전에 실행해야 하는 작업.    
* crash report나 서버에서 받은 설정 정보와 같이, 모든 component들에서 참조해야 하는 초기화 status.    
* 정적이고, immutable한 data에 쉽게 접근할 수 있는 method.   


Application class는 Android의 설명에는   
> Base class for maintaining global application state.   
즉 application의 전역 상태 저장을 하는 곳이다.   
주로 첫 activity가 초기화 되기 전에, 전역 state를 초기화 하는 데 사용된다.   

