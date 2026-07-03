/*
 * MOMOPrefsController.mm
 * 设置界面 - PreferenceBundle控制器
 */

#import <Preferences/Preferences.h>
#import <Foundation/Foundation.h>

@interface MOMOPrefsController : PSListController
- (void)resetChatHistory;
- (void)openDeepSeekSite;
- (void)openQQGroup;
@end

@implementation MOMOPrefsController

- (NSArray *)specifiers {
    if (!_specifiers) {
        _specifiers = [self loadSpecifiersFromPlistName:@"MomoAIPrefs" target:self];
    }
    return _specifiers;
}

- (void)resetChatHistory {
    // 清除聊天历史
    NSString *prefsPath = @"/var/mobile/Library/Preferences/com.matong.momoaitweak.plist";
    NSMutableDictionary *prefs = [NSMutableDictionary dictionaryWithContentsOfFile:prefsPath];
    if (prefs) {
        [prefs removeObjectForKey:@"momo_chat_history"];
        [prefs writeToFile:prefsPath atomically:YES];
    }

    UIAlertController *alert = [UIAlertController
        alertControllerWithTitle:@"已清除"
        message:@"聊天历史已重置"
        preferredStyle:UIAlertControllerStyleAlert];
    [alert addAction:[UIAlertAction actionWithTitle:@"确定" style:UIAlertActionStyleDefault handler:nil]];
    [self presentViewController:alert animated:YES completion:nil];
}

- (void)openDeepSeekSite {
    NSURL *url = [NSURL URLWithString:@"https://platform.deepseek.com/api_keys"];
    if ([[UIApplication sharedApplication] respondsToSelector:@selector(openURL:options:completionHandler:)]) {
        [[UIApplication sharedApplication] openURL:url options:@{} completionHandler:nil];
    }
}

- (void)openQQGroup {
    // 跳转到QQ群（需要安装QQ）
    NSString *qqUrl = @"mqqapi://card/show_pslcard?src_type=internal&version=1&uin=1094151670";
    NSURL *url = [NSURL URLWithString:qqUrl];
    if ([[UIApplication sharedApplication] canOpenURL:url]) {
        [[UIApplication sharedApplication] openURL:url options:@{} completionHandler:nil];
    } else {
        UIAlertController *alert = [UIAlertController
            alertControllerWithTitle:@"无法跳转"
            message:@"请先安装QQ，或手动搜索群号：1094151670"
            preferredStyle:UIAlertControllerStyleAlert];
        [alert addAction:[UIAlertAction actionWithTitle:@"确定" style:UIAlertActionStyleDefault handler:nil]];
        [self presentViewController:alert animated:YES completion:nil];
    }
}

// 自定义单元格 - 显示状态信息
- (id)readPreferenceValue:(PSSpecifier *)specifier {
    NSString *key = [specifier propertyForKey:@"key"];
    if (!key) return nil;

    NSString *prefsPath = @"/var/mobile/Library/Preferences/com.matong.momoaitweak.plist";
    NSDictionary *prefs = [NSDictionary dictionaryWithContentsOfFile:prefsPath];

    id value = prefs[key];
    if (!value) {
        value = [specifier propertyForKey:@"default"];
    }
    return value ?: nil;
}

- (void)setPreferenceValue:(id)value specifier:(PSSpecifier *)specifier {
    NSString *key = [specifier propertyForKey:@"key"];
    if (!key) return;

    NSString *prefsPath = @"/var/mobile/Library/Preferences/com.matong.momoaitweak.plist";
    NSMutableDictionary *prefs = [NSMutableDictionary dictionaryWithContentsOfFile:prefsPath];
    if (!prefs) prefs = [NSMutableDictionary dictionary];

    if (value) {
        prefs[key] = value;
    } else {
        [prefs removeObjectForKey:key];
    }

    [prefs writeToFile:prefsPath atomically:YES];

    // 通知tweak配置已更新
    CFNotificationCenterPostNotification(
        CFNotificationCenterGetDarwinNotifyCenter(),
        CFSTR("com.matong.momoaitweak/settingsChanged"),
        NULL,
        NULL,
        true
    );
}

@end
