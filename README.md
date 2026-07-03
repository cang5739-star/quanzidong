# 马桶Ai - 陌陌AI助手 (iOS越狱插件)

## 概述

基于Android版"马桶Ai"逆向工程的iOS越狱插件。自动回复陌陌消息、打招呼，内置AI聊天引擎。

## 前置条件

- iOS 14.0+ 越狱设备
- Theos 编译环境 (Mac)
- 已安装陌陌App

## 编译安装

### 1. 安装Theos

```bash
# Mac上安装Theos
bash -c "$(curl -fsSL https://raw.githubusercontent.com/theos/theos/master/bin/install-theos)"
```

### 2. 克隆项目

```bash
git clone <本项目地址>
cd momo-ai-tweak
```

### 3. 获取陌陌实际头文件 (关键步骤!)

**方法A - class-dump:**
```bash
# 在越狱手机上
ssh root@你的手机IP
class-dump -H /var/containers/Bundle/Application/xxxx/Momo.app -o /tmp/momo_headers
# 把头文件复制到Mac
```

**方法B - Frida:**
```bash
# 在Mac上
frida -U com.momo.im -e "ObjC.classes"
frida -U com.momo.im -e "ObjC.choose(ObjC.classes['MCMessage'], function(m){console.log(m);})"
```

### 4. 修改Hook点

查看陌陌头文件，然后在 `Tweak.xm` 和 `MomoHooks.mm` 中：
- 替换 `MOMO_CHAT_VC_CLASS` 等宏定义
- 替换消息提取的属性名（content, sender等）
- 替换发送消息的方法名

### 5. 编译

```bash
make package
# 或直接安装到手机
make package install
```

## 功能

- [x] AI自动回复消息 (DeepSeek API)
- [x] 6种人设：温柔/热情/高冷/幽默/甜美/知性
- [x] 自定义人设
- [x] 联系方式自动过滤
- [x] 聊天历史管理
- [x] 设置面板 (Settings → 马桶Ai)
- [ ] 自动打招呼 (需要找到正确的Hook点)
- [ ] 自动发送图片 (部分实现)
- [ ] 远程配置更新 (部分实现)

## 文件结构

```
momo-ai-tweak/
├── Makefile                          # 主编译文件
├── control                           # 包控制文件
├── Tweak.xm                          # Logos Hook定义 (需要修改!)
├── MomoAI.h                          # 核心头文件
├── MomoAI.mm                         # 核心实现
├── AIChatManager.mm                  # AI聊天 (DeepSeek API)
├── PersonaManager.mm                 # 人设系统
├── KeywordFilter.mm                  # 关键词过滤
├── ConfigManager.mm                  # 配置管理
├── MomoHooks.h / MomoHooks.mm        # Hook调度 (需要修改!)
├── MomoAIPrefs/                      # 设置面板
│   ├── Makefile
│   ├── MomoAIPrefs.plist
│   └── MOMOPrefsController.mm
└── layout/                           # 文件布局
    └── Library/
        ├── PreferenceLoader/Preferences/MomoAIPrefs.plist
        └── MobileSubstrate/DynamicLibraries/MomoAITweak.plist
```

## 获取DeepSeek API Key

1. 访问 https://platform.deepseek.com/
2. 注册账号 → API Keys → 创建API Key
3. 在iPhone设置 → 马桶Ai → 填入API Key

## QQ群

1094151670 (马桶通知群)

## 免责声明

仅供学习和研究使用。
