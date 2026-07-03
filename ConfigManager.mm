/*
 * ConfigManager.mm
 * 配置管理 - 读写plist文件
 */

#import "MomoAI.h"

@implementation MomoAI (Config)

#pragma mark - 配置读写

- (NSMutableDictionary *)loadPrefs {
    NSMutableDictionary *prefs = [NSMutableDictionary dictionary];

    // 标准越狱插件路径
    NSString *plistPath = PREFS_PATH;
    if ([[NSFileManager defaultManager] fileExistsAtPath:plistPath]) {
        NSDictionary *dict = [NSDictionary dictionaryWithContentsOfFile:plistPath];
        if (dict) {
            [prefs addEntriesFromDictionary:dict];
        }
    }

    // 设置默认值
    if (!prefs[PREFS_KEY_ENABLED]) prefs[PREFS_KEY_ENABLED] = @NO;
    if (!prefs[PREFS_KEY_AUTO_REPLY]) prefs[PREFS_KEY_AUTO_REPLY] = @YES;
    if (!prefs[PREFS_KEY_AUTO_GREET]) prefs[PREFS_KEY_AUTO_GREET] = @NO;
    if (!prefs[PREFS_KEY_FILTER_CONTACT]) prefs[PREFS_KEY_FILTER_CONTACT] = @YES;
    if (!prefs[PREFS_KEY_SEND_IMAGE]) prefs[PREFS_KEY_SEND_IMAGE] = @NO;
    if (!prefs[PREFS_KEY_PERSONA]) prefs[PREFS_KEY_PERSONA] = @(PersonaTypeGentle);
    if (!prefs[PREFS_KEY_API_KEY]) prefs[PREFS_KEY_API_KEY] = @"";
    if (!prefs[PREFS_KEY_API_URL]) prefs[PREFS_KEY_API_URL] = DEFAULT_API_URL;
    if (!prefs[PREFS_KEY_DEEPSEEK_MODEL]) prefs[PREFS_KEY_DEEPSEEK_MODEL] = DEFAULT_MODEL;
    if (!prefs[PREFS_KEY_TEMPERATURE]) prefs[PREFS_KEY_TEMPERATURE] = @(DEFAULT_TEMPERATURE);
    if (!prefs[PREFS_KEY_MAX_TOKENS]) prefs[PREFS_KEY_MAX_TOKENS] = @(DEFAULT_MAX_TOKENS);
    if (!prefs[PREFS_KEY_CUSTOM_PERSONA]) prefs[PREFS_KEY_CUSTOM_PERSONA] = @"";
    if (!prefs[PREFS_KEY_GREET_INTERVAL]) prefs[PREFS_KEY_GREET_INTERVAL] = @60;
    if (!prefs[PREFS_KEY_DEVICE_ID]) {
        prefs[PREFS_KEY_DEVICE_ID] = [self generateDeviceId];
    }

    return prefs;
}

- (void)savePrefs:(NSDictionary *)prefs {
    NSString *plistPath = PREFS_PATH;
    [prefs writeToFile:plistPath atomically:YES];

    // 通知设置App更新
    CFNotificationCenterPostNotification(
        CFNotificationCenterGetDarwinNotifyCenter(),
        CFSTR("com.matong.momoaitweak/settingsChanged"),
        NULL,
        NULL,
        true
    );
}

- (BOOL)isEnabled {
    NSDictionary *prefs = [self loadPrefs];
    return [prefs[PREFS_KEY_ENABLED] boolValue];
}

- (void)setEnabled:(BOOL)enabled {
    NSMutableDictionary *prefs = [self loadPrefs];
    prefs[PREFS_KEY_ENABLED] = @(enabled);
    [self savePrefs:prefs];
}

#pragma mark - 设备ID

- (NSString *)generateDeviceId {
    // 生成唯一设备标识
    NSString *uuid = [[NSUUID UUID] UUIDString];
    NSString *hwId = @"momo_ai_";
#if TARGET_OS_SIMULATOR
    hwId = [hwId stringByAppendingString:@"sim_"];
#else
    hwId = [hwId stringByAppendingString:@"ios_"];
#endif
    hwId = [hwId stringByAppendingString:[[uuid substringToIndex:8] lowercaseString]];
    return hwId;
}

- (NSString *)deviceId {
    NSDictionary *prefs = [self loadPrefs];
    return prefs[PREFS_KEY_DEVICE_ID] ?: [self generateDeviceId];
}

#pragma mark - 版本检查

- (void)checkForUpdates {
    // 马桶服务器版本检查
    NSString *urlStr = @"https://matong.w8tp.cn/momo/update_manifest.php";
    NSURL *url = [NSURL URLWithString:urlStr];

    NSURLSessionDataTask *task = [[NSURLSession sharedSession] dataTaskWithURL:url
        completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
            if (error) {
                NSLog(@"[马桶Ai] 版本检查失败: %@", error.localizedDescription);
                return;
            }
            NSError *jsonError;
            NSDictionary *json = [NSJSONSerialization JSONObjectWithData:data options:0 error:&jsonError];
            if (jsonError || !json[@"data"]) {
                return;
            }
            NSDictionary *manifest = json[@"data"];
            NSInteger remoteVersion = [manifest[@"version_code"] integerValue];

            NSDictionary *prefs = [self loadPrefs];
            NSInteger localVersion = [prefs[PREFS_KEY_LAST_VERSION] integerValue];

            if (remoteVersion > localVersion) {
                NSLog(@"[马桶Ai] 发现新版本: %@", manifest[@"version_name"]);
                // 版本更新逻辑
                NSMutableDictionary *newPrefs = [self loadPrefs];
                newPrefs[PREFS_KEY_LAST_VERSION] = @(remoteVersion);
                [self savePrefs:newPrefs];
            }
        }];
    [task resume];
}

@end
