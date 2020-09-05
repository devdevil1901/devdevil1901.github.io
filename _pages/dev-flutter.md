---
title: "Flutter"
permalink: /kdb/dev/flutter/
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

찾아 보니 다음과 같은 특징을 지닌 framework.         
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

# Install
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
license 이슈가 있다면,    
```
$ flutter doctor --android-licenses
$ flutter doctor
Doctor summary (to see all details, run flutter doctor -v):
[✓] Flutter (Channel stable, 1.20.3, on Linux, locale ko_KR.UTF-8)
[✓] Android toolchain - develop for Android devices (Android SDK version 30.0.2)
[✓] Android Studio (version 4.0)
[✓] Connected device (1 available)

• No issues found!
```
6. 이제 Android Studio나 IntelliJ에서 Flutter project를 생성할 수 있다.   

좀더 상세한 [가이드](https://flutter-ko.dev/docs/get-started/codelab)는 이곳을 참조한다.   

# Configuration
flutter로 앱을 만들게 되면, project가 gradle을 사용하지만 구조가 일반 Android Gradle 구조가 아니다.    
주요 설정 파일은 **pubspec.yaml**로서,    
dependency 설정들이 포함된다.   

# Development
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
현실적으로 flutter로만으로 앱을 개발하는 한계는 있다.    
물론 그렇게 되면 아주 좋겠지만,          
현실적으로 어려운 이야기 이다.        
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




# Reference
[flutter official](https://flutter.dev/)    


