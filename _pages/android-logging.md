---
title: "Logging"
permalink: /kdb/android/logging/
toc_sticky: true
toc_ads : true
layout: single
---

# Table of content

# Outline

# AOSP
runtime등에서는 VLOG macro로 logging을 수행한다.   

![log](../../../assets/images/android-log.png)  
AOSP에서의 로그들은,  /dev/event-log-tags에 써진다.   
이 character device는 logd가 관리하고, 우리가 adb로 확인하는 그 로그.   

