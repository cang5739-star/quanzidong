/*
 * Tweak.xm
 * 马桶Ai - 主注入文件
 *
 * Logos语法：注入陌陌进程，hook聊天相关方法
 *
 * ⚠️ 使用方法：
 * 1. 用 class-dump 或 Frida 获取陌陌的头文件
 * 2. 搜索实际类名替换下面的 MOMO_HOOK_CLASS_* 宏
 * 3. 在越狱手机上的Theos环境编译
 *
 * 编译: make package install
 */

#import "MomoAI.h"
#import "MomoHooks.h"
#import <notify.h>

#pragma mark - 设置监听

static void SettingsChangedCallback(CFNotificationCenterRef center, void *observer, CFStringRef name, const void *object, CFDictionaryRef userInfo) {
    [[MomoAI sharedInstance] loadPrefs];
    NSLog(@"[马桶Ai] 配置已更新");
}

#pragma mark - 构造函数 (加载时自动执行)

%ctor {
    NSLog(@"[马桶Ai] 插件已加载，等待陌陌启动...");

    // 监听设置变化
    CFNotificationCenterAddObserver(
        CFNotificationCenterGetDarwinNotifyCenter(),
        NULL,
        SettingsChangedCallback,
        CFSTR("com.matong.momoaitweak/settingsChanged"),
        NULL,
        kCFNotificationSchedulingDefault
    );

    // 延迟初始化，等待陌陌App完全启动
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(3.0 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
        [[MomoAI sharedInstance] loadPrefs];
        NSLog(@"[马桶Ai] 初始化完成");
    });
}

#pragma mark ==================== 陌陌Hook (需要根据实际类名修改) ====================

/*
 * ⚠️ 以下hook点需要你用自己的class-dump结果替换类名
 *
 * 获取实际类名的方法：
 * 1. 越狱手机ssh进去: class-dump -H /var/containers/Bundle/Application/xxxx/Momo.app
 * 2. 或用Frida: frida -U com.momo.im -e "ObjC.classes"
 *
 * 常见陌陌iOS类名模式:
 *   MCxxx, MCMessageManager, MCSessionController
 *   MomoImxxx, IMMessage, IMChatManager
 *   TBxxx (可能经过混淆)
 */

// ============================================================
// Hook 1: 收到新消息
// 陌陌收到消息时调用这个方法
// ============================================================
%hook MCChatViewController

- (void)didReceiveMessage:(id)message {
    %orig;

    if (![[MomoAI sharedInstance] isEnabled]) return;

    NSLog(@"[马桶Ai] 收到新消息: %@", message);

    // 将消息交给AI处理
    [[MomoHooks sharedHooks] handleIncomingMessage:message
                                     fromController:self];
}

// 消息发送成功回调
- (void)didSendMessage:(id)message {
    %orig;
    NSLog(@"[马桶Ai] 消息发送成功: %@", message);
}

%end

// ============================================================
// Hook 2: 消息管理器 - 拦截消息发送
// 用于自动发送AI生成的回复
// ============================================================
%hook MCNewMessageManager

// 发送文本消息
- (void)sendTextMessage:(NSString *)text
                     to:(NSString *)targetId
               complete:(void(^)(BOOL, NSError *))complete {

    // 如果是马桶AI生成的回复，记录日志
    if ([text hasPrefix:@"[AI]"] || [text hasPrefix:@"[马桶AI]"]) {
        NSLog(@"[马桶Ai] AI消息发送: %@ -> %@", text, targetId);
    }

    %orig;
}

// 发送图片消息
- (void)sendImageMessage:(UIImage *)image
                      to:(NSString *)targetId
                complete:(void(^)(BOOL, NSError *))complete {

    NSLog(@"[马桶Ai] 发送图片: %@", targetId);
    %orig;
}

%end

// ============================================================
// Hook 3: 会话列表 - 有新会话时触发
// ============================================================
%hook MCConversationListController

- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath {
    %orig;
    NSLog(@"[马桶Ai] 进入会话: %@", indexPath);
}

- (void)onNewConversation:(id)conversation {
    %orig;
    NSLog(@"[马桶Ai] 新会话: %@", conversation);
}

%end

// ============================================================
// Hook 4: 打招呼/喜欢管理
// ============================================================
%hook MCGreetingManager

// 收到新的招呼/喜欢
- (void)onNewGreeting:(id)greeting {
    %orig;

    if (![[MomoAI sharedInstance] isEnabled]) return;

    NSLog(@"[马桶Ai] 收到新招呼: %@", greeting);
    [[MomoHooks sharedHooks] handleNewGreeting:greeting];
}

%end

// ============================================================
// Hook 5: App状态变化
// ============================================================
%hook UIApplication

- (void)applicationDidBecomeActive:(id)application {
    %orig;
    NSLog(@"[马桶Ai] 陌陌进入前台");
}

- (void)applicationDidEnterBackground:(id)application {
    %orig;
    NSLog(@"[马桶Ai] 陌陌进入后台");
}

%end

#pragma mark - 构造函数结束

%ctor {
    NSLog(@"[马桶Ai] Hook注册完成");
}
