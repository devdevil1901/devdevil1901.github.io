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
      },{
        "title": "Mystery.jekyll",
        "excerpt":"  layout: post title:  “Mystery” date:   2020-08-22 07:10:33 +0900 published : false categories: jekyll update —   고대외계인 시리즈  사카라의 새.  죠서왕의 피라미드에서 발견됨.   같이 발견된 파피루스에는     나는 날고 싶다.    활강 글라이더라는 주장.    꼬리가 없다는 의견이 있는데 자세히 보면 분명 꼬리에 뭔가 떨어져나간 흔적이 있다.   VIMANA  인도의 6000년전 기록의 날으는 수레.     몸체는 단단하고 내구력이 있어야 한다.  그 속에는 밑 부분에 쇠로 만들어진 열을 만들어내는 기계가 받치고 있고 그 위로 수은엔진이 장착된다.    수은에 숨겨진 잠재적인 힘을 사용하여 비행동작을 힘차게 만드는데 그 안에 앉아있는 사람은 하늘에서 멀리까지 여행할 수 있다.    비마나는 수직상승을 할 수 있으며 수직하강과 기울인 자세에서 앞 뒤로도 움직일 수 있다.  이 기계의 덕택으로 사람은 하늘을 날 수 있으며 하늘에 있는 존재들은 땅으로 내려올 수가 있다.    실제 기록을 보면 생각 보다 더욱 상세한 것을 확인할 수 있다.    또 비마나 에서 나오는 압력으로 풀들이 다 쓰러졌고 코끼리가 놀라서 도망갔다는 묘사.   또 실제로 수은을 자이로스코프에 돌리면 전기가 발생한다는 점들..   에티오피아의 성서 케브라 나가스트에는 솔로몬의 아이를 낳은 시바여왕은 솔로몬 왕에게 날으는 양탄자를 선물로 받았다고 함.   또 솔로몬은 이를 타고 세계지도를 만들었다고.   고대문명의 유사성  멕시코 시티   몬티알바인의 고대 거대도시.  ","categories": [],
        "tags": [],
        "url": "http://localhost:4000/mystery.jekyll/",
        "teaser": null
      }]
