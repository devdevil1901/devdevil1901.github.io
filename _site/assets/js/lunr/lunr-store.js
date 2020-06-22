<!doctype html>
<!--
  Minimal Mistakes Jekyll Theme 4.19.1 by Michael Rose
  Copyright 2013-2019 Michael Rose - mademistakes.com | @mmistakes
  Free for personal and commercial use under the MIT license
  https://github.com/mmistakes/minimal-mistakes/blob/master/LICENSE
-->
<html lang="en" class="no-js">
  <head>
    <meta charset="utf-8">

<!-- begin _includes/seo.html --><title>Devdevil's blog</title>
<meta name="description" content="var store = [{         “title”: “Useful Markdown grammer tip”,         “excerpt”:”앞으로 유용한 tip들은 여기다 정리하도록 하자.   table에서 줄 바꿈하기  &lt;br\/&gt; tag를 사용한다.   예    |f1 | f2 |    |— | — |    |첫 줄 &lt;br\/&gt; 두 번째 줄 | |                  f1       f2                       첫 줄   두 번째 줄                   “,”categories”: [“jekyll”,”update”],         “tags”: [],         “url”: “http://devdevil1901.github.io/jekyll/update/useful-markdown-tip-jekyll/”,         “teaser”: null       },{         “title”: “Useful Markdown grammer tip”,         “excerpt”:”대학교 1학년때, 학교에서 LUG(Linux User Group)을 만들어서 Linux를 공부하고,       전국러그에서 1대 서울러그 리더가 되서 언더그라운드 해커들과 서울러그를 결성해서 헛 소리하던 때가 엇그제 같은데.     어드덧 이렇게 나이를 먹게 되었다.       그 당시 내가 좋아하던 리눅스는 console로만 쓰는 linux 였다.      리눅스를 설치하면 init 3로 부팅되게 수정해서, x-windows 없이 부팅하도록 해놓는게 가장 먼저하는 일이었다.   하지만 RHCE도 데비안 계열의 ubuntu를 쓰게 만드는 날이 오고, x windows도 많이 발전해서, MAC 짭 정도는 될 수준에 이르렀다.    이쯤되면 console모드에서 리눅스를 쓰는 것은 너무나도 비효율적인 일일 것이다.     그래서 나도 x windows에서 작업을 하고 있다.      내 비디오 카드는 GeForce-GTX1650인데, nvidia에서 제공하는  아직도 graphic card가 windows 만큼 linux에서는 원활하게 동작하지 않는 것으로 보인다.    그래서 드라이버 재 설정을 위해서 x windows 없이 부팅해야 할 일들이 생긴다.    그때 유용한 command를 정리 해 둔다.   x windows 없이 부팅.  $ sudo systemctl set-default multi_user target $ sudo reboot 0   x windows로 다시 복구.  $ sudo systemctl set-default graphical target $ sudo reboot 0   “,”categories”: [“jekyll”,”update”],         “tags”: [],         “url”: “http://devdevil1901.github.io/jekyll/update/ubuntu-console-mode-jekyll/”,         “teaser”: null       }] ">


  <meta name="author" content="Tyrese Ahn">


<meta property="og:type" content="website">
<meta property="og:locale" content="en_US">
<meta property="og:site_name" content="Devdevil's blog">
<meta property="og:title" content="Devdevil’s blog">
<meta property="og:url" content="http://devdevil1901.github.io/assets/js/lunr/lunr-store.js">


  <meta property="og:description" content="var store = [{         “title”: “Useful Markdown grammer tip”,         “excerpt”:”앞으로 유용한 tip들은 여기다 정리하도록 하자.   table에서 줄 바꿈하기  &lt;br\/&gt; tag를 사용한다.   예    |f1 | f2 |    |— | — |    |첫 줄 &lt;br\/&gt; 두 번째 줄 | |                  f1       f2                       첫 줄   두 번째 줄                   “,”categories”: [“jekyll”,”update”],         “tags”: [],         “url”: “http://devdevil1901.github.io/jekyll/update/useful-markdown-tip-jekyll/”,         “teaser”: null       },{         “title”: “Useful Markdown grammer tip”,         “excerpt”:”대학교 1학년때, 학교에서 LUG(Linux User Group)을 만들어서 Linux를 공부하고,       전국러그에서 1대 서울러그 리더가 되서 언더그라운드 해커들과 서울러그를 결성해서 헛 소리하던 때가 엇그제 같은데.     어드덧 이렇게 나이를 먹게 되었다.       그 당시 내가 좋아하던 리눅스는 console로만 쓰는 linux 였다.      리눅스를 설치하면 init 3로 부팅되게 수정해서, x-windows 없이 부팅하도록 해놓는게 가장 먼저하는 일이었다.   하지만 RHCE도 데비안 계열의 ubuntu를 쓰게 만드는 날이 오고, x windows도 많이 발전해서, MAC 짭 정도는 될 수준에 이르렀다.    이쯤되면 console모드에서 리눅스를 쓰는 것은 너무나도 비효율적인 일일 것이다.     그래서 나도 x windows에서 작업을 하고 있다.      내 비디오 카드는 GeForce-GTX1650인데, nvidia에서 제공하는  아직도 graphic card가 windows 만큼 linux에서는 원활하게 동작하지 않는 것으로 보인다.    그래서 드라이버 재 설정을 위해서 x windows 없이 부팅해야 할 일들이 생긴다.    그때 유용한 command를 정리 해 둔다.   x windows 없이 부팅.  $ sudo systemctl set-default multi_user target $ sudo reboot 0   x windows로 다시 복구.  $ sudo systemctl set-default graphical target $ sudo reboot 0   “,”categories”: [“jekyll”,”update”],         “tags”: [],         “url”: “http://devdevil1901.github.io/jekyll/update/ubuntu-console-mode-jekyll/”,         “teaser”: null       }] ">











  

  


<link rel="canonical" href="http://devdevil1901.github.io/assets/js/lunr/lunr-store.js">




<script type="application/ld+json">
  {
    "@context": "https://schema.org",
    
      "@type": "Person",
      "name": "Tyrese",
      "url": "http://devdevil1901.github.io/"
    
  }
</script>






<!-- end _includes/seo.html -->


<link href="/feed.xml" type="application/atom+xml" rel="alternate" title="Devdevil's blog Feed">

<!-- https://t.co/dKP3o1e -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<script>
  document.documentElement.className = document.documentElement.className.replace(/\bno-js\b/g, '') + ' js ';
</script>

<!-- For all browsers -->
<link rel="stylesheet" href="/assets/css/main.css">

<!--[if IE]>
  <style>
    /* old IE unsupported flexbox fixes */
    .greedy-nav .site-title {
      padding-right: 3em;
    }
    .greedy-nav button {
      position: absolute;
      top: 0;
      right: 0;
      height: 100%;
    }
  </style>
<![endif]-->



    <!-- start custom head snippets -->

<!-- insert favicons. use https://realfavicongenerator.net/ -->

<!-- end custom head snippets -->

  </head>

  <body class="layout--single">
    <nav class="skip-links">
  <h2 class="screen-reader-text">Skip links</h2>
  <ul>
    <li><a href="#site-nav" class="screen-reader-shortcut">Skip to primary navigation</a></li>
    <li><a href="#main" class="screen-reader-shortcut">Skip to content</a></li>
    <li><a href="#footer" class="screen-reader-shortcut">Skip to footer</a></li>
  </ul>
</nav>

    <!--[if lt IE 9]>
<div class="notice--danger align-center" style="margin: 0;">You are using an <strong>outdated</strong> browser. Please <a href="https://browsehappy.com/">upgrade your browser</a> to improve your experience.</div>
<![endif]-->

    

<div class="masthead">
  <div class="masthead__inner-wrap">
    <div class="masthead__menu">
      <nav id="site-nav" class="greedy-nav">
        
          <a class="site-logo" href="/"><img src="/assets/images/logo.png" alt=""></a>
        
        <a class="site-title" href="/">
          Devdevil's blog
          <span class="site-subtitle">sky and dragon is blue</span>
        </a>
        <ul class="visible-links"><li class="masthead__menu-item">
              <a href="/kdb/">KDB(Knowledge Database)</a>
            </li><li class="masthead__menu-item">
              <a href="/about/">Me</a>
            </li></ul>
        
        <button class="search__toggle" type="button">
          <span class="visually-hidden">Toggle search</span>
          <svg class="icon" width="16" height="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15.99 16">
            <path d="M15.5,13.12L13.19,10.8a1.69,1.69,0,0,0-1.28-.55l-0.06-.06A6.5,6.5,0,0,0,5.77,0,6.5,6.5,0,0,0,2.46,11.59a6.47,6.47,0,0,0,7.74.26l0.05,0.05a1.65,1.65,0,0,0,.5,1.24l2.38,2.38A1.68,1.68,0,0,0,15.5,13.12ZM6.4,2A4.41,4.41,0,1,1,2,6.4,4.43,4.43,0,0,1,6.4,2Z" transform="translate(-.01)"></path>
          </svg>
        </button>
        
        <button class="greedy-nav__toggle hidden" type="button">
          <span class="visually-hidden">Toggle menu</span>
          <div class="navicon"></div>
        </button>
        <ul class="hidden-links hidden"></ul>
      </nav>
    </div>
  </div>
</div>


    <div class="initial-content">
      



<div id="main" role="main">
  
  <div class="sidebar sticky">
  


<div itemscope itemtype="https://schema.org/Person">

  
    <div class="author__avatar">
      
        <img src="/assets/images/me.png" alt="Tyrese Ahn" itemprop="image">
      
    </div>
  

  <div class="author__content">
    
      <h3 class="author__name" itemprop="name">Tyrese Ahn</h3>
    
    
      <div class="author__bio" itemprop="description">
        <p>Android Developer and Security Engineer</p>

      </div>
    
  </div>

  <div class="author__urls-wrapper">
    <button class="btn btn--inverse">Follow</button>
    <ul class="author__urls social-icons">
      
        <li itemprop="homeLocation" itemscope itemtype="https://schema.org/Place">
          <i class="fas fa-fw fa-map-marker-alt" aria-hidden="true"></i> <span itemprop="name">Yongin, South Korea</span>
        </li>
      

      
        
          
            <li><a href="https://kr.linkedin.com/in/%EC%84%B1%EB%B2%94-%EC%95%88-86744a56" rel="nofollow noopener noreferrer"><i class="fas fa-fw fa-envelope-square" aria-hidden="true"></i> Linkedin</a></li>
          
        
          
        
          
        
          
        
          
        
          
        
      

      

      
        <li>
          <a href="mailto:thevampir2lestat@gmail.com">
            <meta itemprop="email" content="thevampir2lestat@gmail.com" />
            <i class="fas fa-fw fa-envelope-square" aria-hidden="true"></i> Email
          </a>
        </li>
      

      

      

      

      

      

      

      

      

      

      

      

      

      

      

      

      

      

      

      

      

      

      

      <!--
  <li>
    <a href="http://link-to-whatever-social-network.com/user/" itemprop="sameAs" rel="nofollow noopener noreferrer">
      <i class="fas fa-fw" aria-hidden="true"></i> Custom Social Profile Link
    </a>
  </li>
-->
    </ul>
  </div>
</div>

  
  </div>



  <article class="page" itemscope itemtype="https://schema.org/CreativeWork">
    
    <meta itemprop="description" content="var store = [{        “title”: “Useful Markdown grammer tip”,        “excerpt”:”앞으로 유용한 tip들은 여기다 정리하도록 하자.   table에서 줄 바꿈하기  &lt;br\/&gt; tag를 사용한다.   예    |f1 | f2 |    |— | — |    |첫 줄 &lt;br\/&gt; 두 번째 줄 | |                  f1       f2                       첫 줄   두 번째 줄                   “,”categories”: [“jekyll”,”update”],        “tags”: [],        “url”: “http://devdevil1901.github.io/jekyll/update/useful-markdown-tip-jekyll/”,        “teaser”: null      },{        “title”: “Useful Markdown grammer tip”,        “excerpt”:”대학교 1학년때, 학교에서 LUG(Linux User Group)을 만들어서 Linux를 공부하고,       전국러그에서 1대 서울러그 리더가 되서 언더그라운드 해커들과 서울러그를 결성해서 헛 소리하던 때가 엇그제 같은데.     어드덧 이렇게 나이를 먹게 되었다.       그 당시 내가 좋아하던 리눅스는 console로만 쓰는 linux 였다.      리눅스를 설치하면 init 3로 부팅되게 수정해서, x-windows 없이 부팅하도록 해놓는게 가장 먼저하는 일이었다.   하지만 RHCE도 데비안 계열의 ubuntu를 쓰게 만드는 날이 오고, x windows도 많이 발전해서, MAC 짭 정도는 될 수준에 이르렀다.    이쯤되면 console모드에서 리눅스를 쓰는 것은 너무나도 비효율적인 일일 것이다.     그래서 나도 x windows에서 작업을 하고 있다.      내 비디오 카드는 GeForce-GTX1650인데, nvidia에서 제공하는  아직도 graphic card가 windows 만큼 linux에서는 원활하게 동작하지 않는 것으로 보인다.    그래서 드라이버 재 설정을 위해서 x windows 없이 부팅해야 할 일들이 생긴다.    그때 유용한 command를 정리 해 둔다.   x windows 없이 부팅.  $ sudo systemctl set-default multi_user target $ sudo reboot 0   x windows로 다시 복구.  $ sudo systemctl set-default graphical target $ sudo reboot 0   “,”categories”: [“jekyll”,”update”],        “tags”: [],        “url”: “http://devdevil1901.github.io/jekyll/update/ubuntu-console-mode-jekyll/”,        “teaser”: null      }]">
    
    

    <div class="page__inner-wrap">
      
        <header>
          
          
        </header>
      

      <section class="page__content" itemprop="text">
        
        var store = [{
        "title": "Useful Markdown grammer tip",
        "excerpt":"앞으로 유용한 tip들은 여기다 정리하도록 하자.   table에서 줄 바꿈하기  &lt;br\\/&gt; tag를 사용한다.   예    |f1 | f2 |    |— | — |    |첫 줄 &lt;br\\/&gt; 두 번째 줄 | |                  f1       f2                       첫 줄   두 번째 줄                   ","categories": ["jekyll","update"],
        "tags": [],
        "url": "http://devdevil1901.github.io/jekyll/update/useful-markdown-tip-jekyll/",
        "teaser": null
      },{
        "title": "Useful Markdown grammer tip",
        "excerpt":"대학교 1학년때, 학교에서 LUG(Linux User Group)을 만들어서 Linux를 공부하고,       전국러그에서 1대 서울러그 리더가 되서 언더그라운드 해커들과 서울러그를 결성해서 헛 소리하던 때가 엇그제 같은데.     어드덧 이렇게 나이를 먹게 되었다.       그 당시 내가 좋아하던 리눅스는 console로만 쓰는 linux 였다.      리눅스를 설치하면 init 3로 부팅되게 수정해서, x-windows 없이 부팅하도록 해놓는게 가장 먼저하는 일이었다.   하지만 RHCE도 데비안 계열의 ubuntu를 쓰게 만드는 날이 오고, x windows도 많이 발전해서, MAC 짭 정도는 될 수준에 이르렀다.    이쯤되면 console모드에서 리눅스를 쓰는 것은 너무나도 비효율적인 일일 것이다.     그래서 나도 x windows에서 작업을 하고 있다.      내 비디오 카드는 GeForce-GTX1650인데, nvidia에서 제공하는  아직도 graphic card가 windows 만큼 linux에서는 원활하게 동작하지 않는 것으로 보인다.    그래서 드라이버 재 설정을 위해서 x windows 없이 부팅해야 할 일들이 생긴다.    그때 유용한 command를 정리 해 둔다.   x windows 없이 부팅.  $ sudo systemctl set-default multi_user target $ sudo reboot 0   x windows로 다시 복구.  $ sudo systemctl set-default graphical target $ sudo reboot 0   ","categories": ["jekyll","update"],
        "tags": [],
        "url": "http://devdevil1901.github.io/jekyll/update/ubuntu-console-mode-jekyll/",
        "teaser": null
      }]

        
      </section>

      <footer class="page__meta">
        
        


        
      </footer>

      <section class="page__share">
  
    <h4 class="page__share-title">Share on</h4>
  

  <a href="https://twitter.com/intent/tweet?text=%20http%3A%2F%2Fdevdevil1901.github.io%2Fassets%2Fjs%2Flunr%2Flunr-store.js" class="btn btn--twitter" onclick="window.open(this.href, 'window', 'left=20,top=20,width=500,height=500,toolbar=1,resizable=0'); return false;" title="Share on Twitter"><i class="fab fa-fw fa-twitter" aria-hidden="true"></i><span> Twitter</span></a>

  <a href="https://www.facebook.com/sharer/sharer.php?u=http%3A%2F%2Fdevdevil1901.github.io%2Fassets%2Fjs%2Flunr%2Flunr-store.js" class="btn btn--facebook" onclick="window.open(this.href, 'window', 'left=20,top=20,width=500,height=500,toolbar=1,resizable=0'); return false;" title="Share on Facebook"><i class="fab fa-fw fa-facebook" aria-hidden="true"></i><span> Facebook</span></a>

  <a href="https://www.linkedin.com/shareArticle?mini=true&url=http%3A%2F%2Fdevdevil1901.github.io%2Fassets%2Fjs%2Flunr%2Flunr-store.js" class="btn btn--linkedin" onclick="window.open(this.href, 'window', 'left=20,top=20,width=500,height=500,toolbar=1,resizable=0'); return false;" title="Share on LinkedIn"><i class="fab fa-fw fa-linkedin" aria-hidden="true"></i><span> LinkedIn</span></a>
</section>


      
    </div>

    
  </article>

  
  
</div>

    </div>

    
      <div class="search-content">
        <div class="search-content__inner-wrap"><form class="search-content__form" onkeydown="return event.key != 'Enter';">
    <label class="sr-only" for="search">
      Enter your search term...
    </label>
    <input type="search" id="search" class="search-input" tabindex="-1" placeholder="Enter your search term..." />
  </form>
  <div id="results" class="results"></div></div>

      </div>
    

    <div id="footer" class="page__footer">
      <footer>
        <!-- start custom footer snippets -->

<!-- end custom footer snippets -->
        <div class="page__footer-follow">
  <ul class="social-icons">
    
      <li><strong>Follow:</strong></li>
    

    
      
        
      
        
      
        
      
        
      
        
      
        
      
    

    <li><a href="/feed.xml"><i class="fas fa-fw fa-rss-square" aria-hidden="true"></i> Feed</a></li>
  </ul>
</div>

<div class="page__footer-copyright">&copy; 2020 Tyrese. Powered by <a href="https://jekyllrb.com" rel="nofollow">Jekyll</a> &amp; <a href="https://mademistakes.com/work/minimal-mistakes-jekyll-theme/" rel="nofollow">Minimal Mistakes</a>.</div>

      </footer>
    </div>

    
  <script src="/assets/js/main.min.js"></script>
  <script src="https://kit.fontawesome.com/4eee35f757.js"></script>




<script src="/assets/js/lunr/lunr.min.js"></script>
<script src="/assets/js/lunr/lunr-store.js"></script>
<script src="/assets/js/lunr/lunr-en.js"></script>







  </body>
</html>
