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

# Background
applicationContext는 Application을 의미하고,    
baseContext는 acitivity의 Lifecycle을 따르는 Context.   

# Maintaining data
GUI에 대해서 자세히 살펴보기 전에,  어디에 뭘 저장해야 하는지를 정리해 놓고 가는 것이 중요하다.    
여기서 data는 method, data를 포괄하는 개념으로 사용하도록 하겠다.      
다양한 componet, 즉 service, activity 등에서 사용해야 하는 network client wrapper라던가,    
광고의 API들을 쉽게 사용할 수 있게 하는 wrapper등은 어디에 위치해야 할까?    

Data를 저장하는데 있어서, 생각해야 할 것은 **시점**, **속성**, **범위**이다.   
예를 들어서, mutable한 속성의 data를 저장하는데 가장 좋은 곳은 ROOM(SQLite), SharedPreferences가 될 것이다.   

# Holding data separated from life cycle
생명주기와 분리된 데이터를 유지할 필요성은 항상 발생한다.   
Acitivty에서 **onSaveInstanceState()**를 통해서 저장후 **onCreate()**에서 복구하는 방법도 있지만,   
Serialization이 가능한 data며, 작은 크기여야 하는 제약이 있다.   
역시 **시점**, **속성**, **범위**에 맞춰서 결정해야 한다.   

이런때 사용할 수 있는 대표적인 것이 Application과 ViewModel이다.   

## Application
[Application](https://developer.android.com/reference/android/app/Application)은 Activity나 ViewModel에서 getApplication()으로 쉽게 구해다 쓸 수 있다는 큰 편리성 혹은 유혹이 존재한다.   
Application은 다음과 같은 상황에서 추천된다.   
1. **매우 이른 시점(첫 activity가 실행되기 전)**
2. **생명주기와 분리된 지속적인 시점**과 **넒은 범위의 접근이 필요할 때** 
3. **static immutable한 object**

static한, network client object를 쉽게 접근하게 해주는 wrapper라던가,   
device의 설정을 추상화 시켜놓은 것,    
서버로 부터 받은 다양한 component에서 사용되는 전역 설정등이 여기에 해당한다.      

Device의 설정을 예로 들어보자, 사용자가 구글광고설정이나 다중 창모드등을 변경했다고 해보자.   
이런 경우, Applicatoin에서 해당 정보를 유지하고, 각 component에서 필요할 때 사용하는 것이 바람직하다.  
한곳에서 Device 설정의 변경을 유지하지 않으면 각각의 코드에서 중복해서 이를 구하는 코드가 생기게 될 것이고,   
다양한 문제를 야기하게 될 것이다.   

Application class를 상속받아 onConfigurationChanged()를 구현함으로서, 위의 문제를 깔끔하게 해결할 수 있다.    
```
class CustomAppliction : Application() {
	override fun onConfiratuionChanged(newConfig: Configuration) {
		super.onConfigurationChanged(newConfig)
	}
}
```

물론 static object가 그렇듯이 남용은 금물이다.   
**특히 Application에 Mutable한 object를 저장해서는 안되**는데.   
그 이유는 Application 객체가 죽을 수 있으며,   
그런경우 Application은 onCreate()를 타면서 재 생성 될 것이기 때문이다.    
문제는 App이 재시작되지 않고, 사용자 기존에 있던 위치 부터 시작 될 수 있기 때문이다.   
즉 Application object가 재 생성된 것을 인지하지 못한 상태에서 사용자 활동이 이어지게 될 수 있다.    

즉 이런 경우를 위해서 Application에 저장되는 data나 object는 onCreate()에서 초기화 해주어야 한다. 자체적인 생명주기 처리를 해주어야 한다.   

또한 동기화 코드의 경우 초기 실행 시간을 지연시키고, 메모리 점유율을 높인 다는 큰 단점도 존재한다.   
비동기 코드의 경우도 이걸 사용하는 측에서 사용시 문제가 존재한다.   
뭔가 여러모로 편리하지만, 단점이 많은 양날의 칼 같은 느낌이 강하다.   

## [ViewModel](https://developer.android.com/topic/libraries/architecture/viewmodel?hl=ko)   
Fragment가 detached되게 되면,    

FragmentManagerImpl::moveToState()
FragmentManagerViewModel::clearNonConfigState(Fragment f)    
ViewModelStore::clear()   
mMap에 저장된 해당 fragment가 own하고 있는 ViewModle들의 clear()를 실행한다.   

FragmentManagerImpl::moveToState()에서는 이후 Fragment::performDetach()를 실행해서 detach를 수행한다.   




항상 오해하는 것이 구글 내부에서 지능적으로 뭘 처리해 준다고 믿는 것이다.    
하지만 내부를 분석해 보면 항상 별거 없으며 그렇기 때문에 정확하게 이해하는 것이 매우 중요하다.   

간단하게 View에서 data를 분리 시킨 AAC(Android Architecture Component)이다.(androidx.lifecycle.ViewModel)       
View는 Android OS와의 처리를 담당하고,     
(가능하면 Passive View Pattern을 사용해서, 오직 데이터를 표시하고, 사용자의 Action을 ViewModel에게 전달하는 방법만 알고 있어야 한다.)    
ViewModel은  Activity나 Fragment의 onCreate()에서 ViewModelProviders의 of() method를 통해 생성되며,    
자신을 생성한 owner(activity나 fragment)의 생명주기와는 분리된다.   

해당 Activity와 Fragment의 Lifecycle에 따라 유지 된다.   
이말은 Activity가 finish()등으로 onDestroy()를 타고 종료되거나,   
Fragment가 onDetach()를 타고 종료되는 경우까지 ViewModel이 유지된다는 의미이다.   
즉 ViewModel이 생성된 곳의 Lifecycle에 따라서 유지되며,    
이 경우 ViewModel은 onCleared()를 타면서 제거된다.   
때문에 Fragment나 Activity가 다시 onCreate()타면서 재 생성되는 경우의 처리,    
즉 **onSaveInstanceState()와 onCreate()에서의 Bundle 처리도 마찬가지로 해주어야 한다**. [참고](https://developer.android.com/topic/libraries/architecture/viewmodel-savedstate)      

폰을 회전한다던가 해서, ViewModel의 소유자가 finish되면 activity가 onDestroy()를 타고 제거되고,   

구글 문서를 읽다보면, 마치 ViewModel이 onSaveInstanceState()를 대체해주는 느낌을 가질수 밖에 없는데,       
이것은 얼마전 Deprecated된 ASyncTask가 마치 생명 주기나 내부적으로 동기화 처리에 관련된 무언가를 해주는 느낌을 주던 것과 동일하다.   
즉 기존에 가지고 있던 Serial 데이터와 용량의 제약은 ViewModel을 쓰건 안쓰건 동일하게 유지된다.    
이 ViewModle이 개발 편의성이 아니라, 구글 내부의 관리 편의성에 초점을 맞춰서 개발된 것임을 알수 있는 부분이다.   
이 ViewModel의 목적이 Activity나 Fragment의 Lifecycle과 데이터의 분리이기 때문에,    
ViewModel과 Fragment는 서로를 전혀 모르는 채로 완전히 분리해야 한다.   
Application 쪽에서 살펴본 봐와 같이, ViewModel에서 Activity 쪽을 접근했을 때, 해당 Activity가 제대로 살아있다는 보장이 없다.        
그렇기 때문에, **View, Fragment, Activity의 참조가 ViewModel에 저장되면 안되는 것**이다.    
때문에 ViewModel에서는 LiveData를 사용하고,    
View에서는 ViewModel의 변경을 구독하는 형태가 가장 이상적이다.    
즉 Presentation Layer에서는 View와 ViewModel이 있고, Data Layer에는    
Repository가 있는 구조.     


ViewModel의 접근은 다음과 같이 **ViewModelProviders**를 이용한다.      
```
pageViewModel = ViewModelProviders.of(this).get(PageViewModel::class.java)
```
여기서 of method는 static이기 때문에, 당연히 Fragment간 데이터 공유가 가능하다.(사실 어느 곳에서나)    
사실 ViewModel은 해당 데이터의 저장에 Application을 이용하고 있다.   



정리할 것...     
ViewModel은 activity가 destroy되거나, fragment가 detached 될때 까지 유지된다.    
아닌듯 한데..   

# 검증할 것

[아래는 요약](https://munk.tistory.com/8)    
Context는 40여종의 직/간접적 children을 소유하고 있습니다. 잘못된 Context는 필요치 않은 children의 reference 까지 같이 딸려오게 되므로 메모리가 누수되는 것은 어찌보면 당연합니다. 그래서 우리는, 화면에 종속된 작업을 하는 경우에 getBaseContext() 같은 메소드 호출을 피해야 하는 것입니다. 당연히 해당 Activity or Fragment 등을 호출하는 것이 가장 좋겠죠.    


