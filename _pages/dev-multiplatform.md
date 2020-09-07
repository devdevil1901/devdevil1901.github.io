---
title: "Multiplatform"
permalink: /kdb/dev/multiplatform/
toc_sticky: true
toc_ads : true
layout: single
---

# Table of content

# Outline 
오늘 저녁에 뜬금없이 인생에 도움 안되는 형이 전화가 와서,    
flutter를 몇십분 동안, 엄청 칭찬하고 끊었다.    
대부분 틀린 이야기들 이었지만, 최근 3개월간 이걸로 개발해서 개발 단축 효과를 보았다는 말에,    
크게 꽃히게 되었다.    
개발 프리랜서를 하게 되면, 극한의 효율성을 추구해야 할 것이기 때문이다.    

UI 부분을 Flutter로 해결하고, 나머지는 kotlin Multiplatform으로 어느정도 까지 효율성을 보장할 수 있는지가 이 페이지를 만든 이유이다.    

# Architecture
여러 회사들에서, 심지어 10억이상의 사용자를 보유한 앱을 만드는 회사에서도,     
백명 이상의 개발자가 지속적이고, 근본적인 대규모 refactoring을 병행한다고 해도,    
너무나 엉망이된 그러나 손댈 수 없는 부분이 많은 그런 소스 코드를 너무 많이 보아 왔다.   
개인적으로 이런 부분들은 큰 방향에서 개발 철학과 architecture의 부재라고 보고 있다.       

때문에 극도의 효율을 추구해야 하는 현 상황에서,    
여러 architecture들을 간단히 재 정리할 필요성을 느꼈다.    

## MVP(Model View Presenter)
Microsoft .Net에 적용되어 있는 패턴.    

<pre>
                call business logic                         request data
[Passive View] --------------------->   [Presenter] --------------------------------->   [Model]
               <---------------------               <---------------------------------
			     render request                          return data as callback

Passive View: Activity, Fragment
Presenter: Mediateor
Model: DB business logic, models
</pre>

Passive View이기 때문에 사용자 event 발생시 Presenter에 business logic을 요청하지만,    
View갱신은 Preseenter에 의해서 수행된다.   
중재인인 Presenter는 Model과 View사이에서, 사용자 event와 lifecycle에 따라서 작업을 수행한다.   

## MVVM(Model View ViewModel)
Presenter가 없는 것에서도 알수 있듯이, Passive View가 아닌 Activit View이다.        



## Clean Architecture
저 유명한 밥 아저씨의 system architecture인 clean architecture를 살펴보자.    
가장 큰 모토는 다음과 같다.    

1. Infrastructure(Frameworks, UI, any external agency, DB), Adapter, Domain Layer로 구분한다.   
Domain Layer는 비지니스 로직으로, Application layer와 Enterprise layer로 구분한다.     
프로젝트와 상관없는 password 보안 정책 같은 것들이 존재 하는 layer가 Enterprise.    
특정 App의 로그인 폼같은 것이 존재하는 부분이 Application layer.      
하위 레이어는 상위 레이어에 종속성을 가지지만, 상위 layer에 하위 레이어를 참조하면 안되고,     
독립적으로 존재해야 한다.     
이것을 Dependency Rule이라고 한다.    
Adapters는 Domain과 Frameworks & Drivers 사이의 interface 역활을 수행한다.      
Presenter, View, Controller 혹은 View, ViewModel, Controller를 
이를 위해서, MVC 자체를 포함하고 있다.(Presenter,  View, Controller)         
MVVM 구조에서라면, ViewModel
2. 각 layer는 독림적으로 Testable 해야 한다.       

<pre>
+-----------------------------------------------------------------------------------------------------+
|           Frameworks & Drivers (External interfaces, DB, Devices, UI, Web)                          |
|  +----------------------------------------------------------------------------------------------+   |
|  |        Interface Adapter(Presenters, Gateways, Controller)                                   |   |
|  |  +----------------------------------------------------------------------------------------+  |   | 
|  |  |     Application Business Rules (Use cases)                                             |  |   |
|  |  |  +-------------------------------------------------------------------------------+     |  |   |
|  |  |  |  Enterprise Business Rules(Entities)                                          |     |  |   |
|  |  |  +-------------------------------------------------------------------------------+     |  |   |
|  |  +----------------------------------------------------------------------------------------+  |   |
|  +----------------------------------------------------------------------------------------------+   |
+-----------------------------------------------------------------------------------------------------+
</pre>

반드시 딱 이 layer만 존재해야 된다는 것 보다는,    
layer로 나누고, layer간 interface 역활의 adapter가 필요하고,    
상위 layeer는 하위 layer를 전혀 몰라야 하며,    
하위 layer는 상위 layer에 종속성을 가진다는 원칙만 기억하면 된다.   

상위 layer는 하위 layer를 전혀 몰라야 하기 때문에 접근의 필요성이 있는 경우는 **interface**를 사용한다.   
이를 Kotlin Multiplatform과 연결해서 생각해 본다면,    
Domain Layer(Enterprise와 Application)는 shared에,    
Adapter 부터는 androidApp,iosApp에 위치하는 것이 적당해 보인다.    

# Flutter
다음과 같은 특징을 지닌 framework.         
* google에서 만들었다.     
* Qt, Xamarin과 같이 Multiplatform을 지원하는 UI framework이다.   
* Android Studio를 이용해서, Dart라는 언어로 개발한다.   

design이 좋은 풍부하고 유연한 design을 제공하는 위젯, 애니메이션 라이브러리 및 확장 가능한 계층형 아키텍쳐를 제공한다.   
인터넷에서 가볍게 검색했을 때 상당히 감각적인 룩앤필의 UI를 확인할 수 있었다.    
가장 좋은 점은 아주 많은 위젯들이 있기 때문에,    
그냥 가져다 커스터마이징 개념이라는 점이다.    

이제에 글로벌에서 사용되는 앱을 개발할때 UI 디지이너와의 실랑이 커뮤니테이션 리소스 낭비등이 떠오르면서,     
그리고 앞으로 할 계획들을 생각하면서 흥미는 점점 커져만 가고 있었다.    

flutter는 React의 Component와 비슷하게, Widget 기반으로 APP을 개발하는 Framework이다.    
button, text, layout등이 Android에서는 전부 View라면 flutter에서는 전부 Widget이다.   
ViewGroup 처럼 서브 뷰를 가지고 있는 Widget은 **Container Widget**이라고 불린다.   
또한 jvm code가 아닌 arm code를 직접 생성하기 때문에 dex를 native로 변화하는 과정이 없다는 점,     
GPU 가속 rendering을 사용한다는 점에서 성능상의 장점이 존재한다.     

가장 큰 장점은 바로 build-in container widget일 것이다.     
이런 Widget을 사용하면 미리 제공되는 골격으로 화면 구성을 쉽게 할 수 있다.   

또한 Hot reload를 지원해서, 앱이 동작하고 있는 동안에 앱에 변경을 줄 수 있다.    

## Install 
우분투에서는 flutter를 먼저 설치해야, Configuration-Plugin에서 flutter가 검색된다.     

먼저 [snap](https://snapcraft.io/docs/installing-snapd)를 설치한다.   
1. 우분투 소프트웨어에서 Retroarch를 검색하고 설치한다.    
2. flutter를 설치한다.   
```
$ sudo snap install flutter --classic
$ which flutter
/snap/bin/flutter
```

3. Android studio나 IntelliJ에서 Configuration-Plugin에서 flutter를 검색해서 설치한다.    
4. Intellij에서 New Project-Flutter-Install Sdk를 설치해준다.     
5. avd를 실행해 놓고, flutter doctor를 실행한다.    
```
$ flutter doctor
```

6. 이제 Android Studio나 IntelliJ에서 Flutter project를 생성할 수 있다.   

license 이슈가 있다면 다음과 같이 해준다.     

```
$ flutter doctor --android-licenses
$ flutter doctor
Doctor summary (to see all details, run flutter doctor -v):
[✓] Flutter (Channel stable, 1.20.3, on Linux, locale ko_KR.UTF-8)
[✓] Android toolchain - develop for Android devices (Android SDK version 30.0.2)
[✓] Android Studio (version 4.0)
[✓] Connected device (1 available)

No issues found!
```

좀더 상세한 [가이드](https://flutter-ko.dev/docs/get-started/codelab)는 이곳을 참조한다.   

## Configuration
flutter로 앱을 만들게 되면, project가 gradle을 사용하지만 구조가 일반 Android Gradle 구조가 아니다.     
주요 설정 파일은 **pubspec.yaml**로서,    
프로젝트가 app인지, appbundle인지, module인지,    
dependency 등의 설정들을 명시하게 된다.       

## Development
Project를 생성하면 다음과 같이 main이 존재한다.    
```
void main() {
  runApp(MyApp());
}
```
여기에 들어가는 MyApp이 바로 main Widget이다.   
Widget은 다음과 같이 build function을 통해서, 하위 widget의 구성을 전달한다.      
```
@override
  Widget build(BuildContext context) {
```

Immutable한 Stateless Widget과 State에 반응을 제공하는 Mutaable한 State Widget 두종류 있다.    
```
abstract class StatelessWidget extends Widget
abstract class StatefulWidget extends Widget
```

home 화면 widget이 있고, 그 안에 Image widget과 scroll이 있다고 할대,   
Image Widget이, Scroll에 따라서 변경된다면,    
Image Widget은 stateful widget이 될 것이다.     
home widget은 stateless.    

Stateless는 event에 반응하지 않기 때문에 event 발생 시 화면 갱신을 하지 않는다.    
때문에 비용이 적게든다.    
State는 creeateState()를 override해서 event를 처리하고, build()가 다시 호출되서 UI가 갱신되게 된다.   

## Widget
Widget과 View는 비슷한 개념으로 맵핑될 수 있지만,    
Lifecycle이 다르다.   
View는 한번만 그려지고, invalidate()가 호출되기 전까지는 다시 그려지지 않는다.   

## Design
flutter는 다음과 같이 import하여 사용할 수 있는      
```
import 'package:flutter/material.dart';
```
MaterialApp을 제공한다.    

이것은 모든 플랫폼에 최적화된 유연한 Design System인, [Material Design Guideiine](https://material.io/design)을 따르는 component이다.    
pubspec.yaml에는 다음 항목을 추가해야 한다.    
```
flutter:
  uses-material-design: true
```

Cupertino Widget을 사용하면, iOS의 Design과 유사한 design interface를 제공한다.     

[Widget Catalog](https://flutter-ko.dev/docs/development/ui/widgets/material)을 확인해 보자.     
|Catalog|Widget|Desc|
|Accessibility|Semantics||
||ExcludeSemantics|Creates a widget that drops all the semantics of its descendants.|
||MergeSemantics|A widget that merges the semantics of its descendants.|
|Animation and Motion|AnimatedBuilder|애니메이션 제작을 위한 범용 위젯.<br/>더 큰 빌드 기능의 일부로 애니메이션을 포함하려는 더 복잡한 위젯에 유용|
||AnimatedContainer|일정 기간 동안 값이 변화되는 container|
||AnimatedCrossFade|A widget that cross-fades between two given children and animates itself between their sizes.|

Theme가 미리 적용되어 있는 Custom Design들도 선택할 수 있다.    
|Widget|Description|
|MaterialApp|Material Theme가 적용되어 있다.<br/>StatefulWidget|
|Cupertino||

## Dart language
dart는 구글이 javascript를 대체하기 위해서, 2011년에 개발한 언어이지만,   .    
현재는 App, Web App, script, server 등을 전부 dart를 사용해 만들 수 있다.    
Single Evnet Queue를 사용하는 점에서는 javascript와 비슷하지만, bridge를 사용하지 않기 때문에 상대적으로 빠르다.       

null, number, function이 전부 object이다.    

var로 선언하면, type을 추정해서 저장한다.    
dynamic으로 선언하면, 명시적으로 여러 타입을 지정할 수 있다.    

python과 비슷하게, property와 function에 _를 추가하면 private 된다.    
class 단위가 아닌 page단위의 private임.    

## With kotlin 
현실적으로 flutter로만으로 앱을 개발할 수 있다면 아주 좋겠지만, 한계는 있다.       
때문에 UI를 쉽게 쓰는 부분만 가지고 가고, 나머지 부분은 kotlin으로 개발하는 방법을 살펴보자.         

그렇게 위해서는 먼저 flutter를 module로 만들어서, 기존의 kotlin으로 작성된 project에 추가할 수 있는 project를 생성한다.     
```
$ flutter create -i swift -a kotlin -t module flutterModule
Creating project flutterModule...
  flutterModule/README.md (created)
  flutterModule/test/widget_test.dart (created)
  flutterModule/.gitignore (created)
  flutterModule/lib/main.dart (created)
  flutterModule/pubspec.yaml (created)
  flutterModule/.idea/modules.xml (created)
  flutterModule/.idea/workspace.xml (created)
  flutterModule/.idea/libraries/Dart_SDK.xml (created)
  flutterModule/.metadata (created)
  flutterModule/flutterModule.iml (created)
  flutterModule/flutterModule_android.iml (created)
Running "flutter pub get" in flutterModule...                       1.7s
Wrote 11 files.

All done!
Your module code is in flutterModule/lib/main.dart.
```

이렇게 생성된 project의 **pubspec.yaml**에는,     
Module로 생성하기 위해, 다음과 같이 module 항목이 추가된다.     
```
module:
    androidX: true
    androidPackage: com.example.flutterModule
    iosBundleIdentifier: com.example.flutterModule
```

생성된 project를 aar로 빌드한다.(Android Studio에서도 Build-Flutter-Build AAR로 가능하다)        
'''
flutter build aar
'''

aar를 기존 project에 포함시킨다.    
<pre>
Consuming the Module
  1. Open <host>/app/build.gradle
  2. Ensure you have the repositories configured, otherwise add them:

      String storageUrl = System.env.FLUTTER_STORAGE_BASE_URL ?: "https://storage.googleapis.com"
      repositories {
        maven {
            url '/home/lbdragon/test/flutterModule/build/host/outputs/repo'
        }
        maven {
            url '$storageUrl/download.flutter.io'
        }
      }

  3. Make the host app depend on the Flutter module:

    dependencies {
      debugImplementation 'com.example.flutterModule:flutter_debug:1.0'
      profileImplementation 'com.example.flutterModule:flutter_profile:1.0'
      releaseImplementation 'com.example.flutterModule:flutter_release:1.0'
    }


  4. Add the `profile` build type:

    android {
      buildTypes {
        profile {
          initWith debug
        }
      }
    }

To learn more, visit https://flutter.dev/go/build-aar
</pre>

## Reference
[flutter official](https://flutter.dev/)    


# Kotlin multiplatform
작년에 덴마크에서 열린, Kotlin conference에 참여했을 때,   
가장 강조 했던 것이 1.4 compiler의 예고와    
kotlin의 multiplatform이었다.   
그 당시도 상당히 흥미롭다고 생각했었지만,   
개발 프리랜서를 하려고 생각하고 있는 지금에서는 흥미를 넘어서 절실하다고 생각된다.     
앱, 서버 시스템 전반을 혼자 개발하는 원대한 계획을 실행하기 위해서는 극도의 효율성을 추구할 수 밖에 없기 때문이다.     

IntelliJ의 Kotlin/Native Plugin을 이용해서,    
iOS의 개발의 최상위 레벨의 Framework인 Cocoa Touch Framework(Foundation, UIKit등)와 POSIX를 거의 대부분 호출할 수 있다.    
Objective-c,c++과 swift 없이 ios app을 실행할 수 있다니 상당히 매력적이 아닐 수 없다.   

기본적으로 다음과 같은 계층 구조를 가지고 있다.    
![그림](https://4d4f6p22cgml1ale382crgth-wpengine.netdna-ssl.com/wp-content/uploads/2020/01/slide-25.001.jpeg)    

## 구조 
kotlin multiplatform에서는 다음과 같은 platform hierarchy structure를 지원한다.    
![전체 platform 구조](https://kotlinlang.org/assets/images/reference/mpp/flat-structure.png)     

이런 mapping(platform 별 main)을 변경하고 싶다면,     
다음과 같이 build.gradle 파일을 수동으로 수정해 주면 된다.   
```
kotlin {
    sourceSets {
        desktopMain {
            dependsOn(commonMain)
        }
        linuxX64Main {
            dependsOn(desktopMain)
        }
        mingwX64Main {
            dependsOn(desktopMain)
        }
        macosX64Main {
            dependsOn(desktopMain)
        }
    }
```
이때 가각의 main들의 위치는     
src/commonMain   
src/desktopMain    
이런 식이 된다.   

즉 platform 별도 구현해야 할 function과 공통 로직을 분리하게되는데,    
commonMain()에서 expect keyword를 사용했다면, 하위 Main들에서 이를 각각 구현해주어야 하고,    
keyword를 사용하지 않으면 공통적으로 사용가능하다는 것을 의미한다.   
즉 commonMain에 다음과 같이 선언되었다면,   
```
expect fun souldImplementMe()
fun justFunc() {
}
```
jvmMain, jsMain, macosX64Main 등에서는     
~~~~
actual fun souldImplemenatMe() {
}
~~~~
이렇게 되어야 한다는 의미.    


multiplatform에서는 주요한 target shortcut이 미리 내장되어 있다.     
이런 target에는 ios, watchos, tvos등이 있고,    
ios target shortcut에는 iosArm64, iosX64와 같은 target들이 내장되어 있다.   
(각각 iosMain, iosArm64Main, iosX64Main을 지닌고 있다.)    
이런 hierarchical한 구조를 사용하고 싶다면, gradle.properties에 다음을 명시해야 한다.    
```
kotlin.mpp.enableGranularSourceSetsMetadata=true
```

역시 이 부분을 Customizing하고 싶다면,     
```
kotlin {
    sourceSets{
        iosMain {
            dependsOn(commonMain)
            iosX64Main.dependsOn(it)
            iosArm64Main.dependsOn(it)
        }
    }
}
```
이런식으로 해준다.   

platform dependent한 library들은 iosArm64나 iosX64에는 적용되지 않고,    
부모인 iosMain에만 적용 가능하다.   
부모에 적용한 library를 자식들에서 사용하게 하려면, **gralde.properties**에 다음을 추가해 주도록 한다.    
```
kotlin.mpp.enableGranularSourceSetsMetadata=true
kotlin.native.enableDependencyPropagation=false
```

좀더 상세한 내용은 [이곳](https://kotlinlang.org/docs/reference/mpp-intro.html)을 참조하자.       
