var store = [{
        "title": "Useful Markdown grammer tip",
        "excerpt":"앞으로 유용한 tip들은 여기다 정리하도록 하자.   table에서 줄 바꿈하기  &lt;br\\/&gt; tag를 사용한다.   예    |f1 | f2 |    |— | — |    |첫 줄 &lt;br\\/&gt; 두 번째 줄 | |                  f1       f2                       첫 줄   두 번째 줄                   ","categories": ["jekyll","update"],
        "tags": [],
        "url": "http://localhost:4000/jekyll/update/useful-markdown-tip-jekyll/",
        "teaser": null
      },{
        "title": "Useful Markdown grammer tip",
        "excerpt":"대학교 1학년때, 학교에서 LUG(Linux User Group)을 만들어서 Linux를 공부하고,       전국러그에서 1대 서울러그 리더가 되서 언더그라운드 해커들과 서울러그를 결성해서 헛 소리하던 때가 엇그제 같은데.     어드덧 이렇게 나이를 먹게 되었다.       그 당시 내가 좋아하던 리눅스는 console로만 쓰는 linux 였다.      리눅스를 설치하면 init 3로 부팅되게 수정해서, x-windows 없이 부팅하도록 해놓는게 가장 먼저하는 일이었다.   하지만 RHCE도 데비안 계열의 ubuntu를 쓰게 만드는 날이 오고, x windows도 많이 발전해서, MAC 짭 정도는 될 수준에 이르렀다.    이쯤되면 console모드에서 리눅스를 쓰는 것은 너무나도 비효율적인 일일 것이다.     그래서 나도 x windows에서 작업을 하고 있다.      내 비디오 카드는 GeForce-GTX1650인데, nvidia에서 제공하는  아직도 graphic card가 windows 만큼 linux에서는 원활하게 동작하지 않는 것으로 보인다.    그래서 드라이버 재 설정을 위해서 x windows 없이 부팅해야 할 일들이 생긴다.    그때 유용한 command를 정리 해 둔다.   x windows 없이 부팅.  $ sudo systemctl set-default multi_user target $ sudo reboot 0   x windows로 다시 복구.  $ sudo systemctl set-default graphical target $ sudo reboot 0   ","categories": ["jekyll","update"],
        "tags": [],
        "url": "http://localhost:4000/jekyll/update/ubuntu-console-mode-jekyll/",
        "teaser": null
      },{
        "title": "How to develop android studio plugin",
        "excerpt":"#           IntelliJ에서 Create New Project를 선택한다.  그리고 Gradle-IntelliJ Platform Plugin과 Kotlin/JVM을 선택.            plugin.xml에서 Name, Company Name등을 적절히 수정한다.            src/main/kotlin에 마우스 오른쪽으로 N       Plugin의 기능 추가  src/main/kotlin에서 마우스 오른쪽 클릭 후,    New-Plugin Devkit을 선택하면,  다음과 같은 동작에 대한 정의를 추가할 수 있다.   Action, Application Service, Module Service, Project Service, Theme가 존재 한다.   Application Service  IDE의 생명주기에 대한 것.  TestApplicationService를 추가한다면,  src/kotlin/impl/TestApplicationSericeImpl   src/kotlin/TestApplicationService   가 추가되고,   src/resources/META-INF/plugin.xml에 다음의 내용이 추가된다.  &lt;extensions defaultExtensionNs=\"com.wonderland\"&gt;         &lt;!-- Add your extensions here --&gt;         &lt;applicationService serviceInterface=\"TestApplicationService\"                             serviceImplementation=\"impl.TestApplicationServiceImpl\"/&gt;     &lt;/extensions&gt;   Reference  plugin제작   plugin  findbug   sample   ","categories": ["jekyll","update"],
        "tags": [],
        "url": "http://localhost:4000/jekyll/update/android-studio-plugin-jekyll/",
        "teaser": null
      }]
