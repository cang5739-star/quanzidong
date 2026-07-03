/*
 * MomoAI.h
 * 马桶Ai - 陌陌AI助手 核心头文件
 *
 * 这个tweak注入到陌陌App进程，通过Method Swizzling
 * hook陌陌的聊天/消息相关类，实现AI自动回复。
 *
 * ⚠️ 使用前需要用 class-dump 或 Frida 获取实际陌陌版本的头文件
 *    然后替换下面 MOMO_HOOK_CLASS_* 宏定义中的类名
 */

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

// ============================================================
// ⚠️ 重要：下面这些类名需要根据实际陌陌版本来修改
// 使用 class-dump -H Momo.app/Momo 获取实际头文件
// 然后搜索 ChatViewController / MessageManager 等关键词
// ============================================================

// 聊天视图控制器 - 需要从陌陌头文件中找到实际类名
#define MOMO_CHAT_VC_CLASS          @"TTChatViewController"
// 消息模型类
#define MOMO_MESSAGE_CLASS          @"TTMessage"
// 消息管理器
#define MOMO_MESSAGE_MANAGER_CLASS  @"TTNewMessageManager"
// 会话列表控制器
#define MOMO_CONVERSATION_VC_CLASS  @"TTConversationListController"
// 联系人/好友管理器
#define MOMO_CONTACT_MANAGER_CLASS  @"TTContactManager"
// 用户资料类
#define MOMO_USER_PROFILE_CLASS     @"TTMomentsUserProfile"
// 打招呼/赞管理器
#define MOMO_GREETING_MANAGER_CLASS @"TTGreetingManager"
// 网络请求管理器
#define MOMO_NETWORK_MANAGER_CLASS  @"TTNetworkManager"

// ============================================================
// 配置键名
// ============================================================
#define PREFS_KEY_ENABLED           @"momo_ai_enabled"
#define PREFS_KEY_API_KEY           @"momo_ai_api_key"
#define PREFS_KEY_API_URL           @"momo_ai_api_url"
#define PREFS_KEY_PERSONA           @"momo_ai_persona"
#define PREFS_KEY_CUSTOM_PERSONA    @"momo_ai_custom_persona"
#define PREFS_KEY_AUTO_GREET        @"momo_auto_greet_enabled"
#define PREFS_KEY_AUTO_REPLY        @"momo_auto_reply_enabled"
#define PREFS_KEY_GREET_INTERVAL    @"momo_greet_interval"
#define PREFS_KEY_FILTER_CONTACT    @"momo_filter_contact_enabled"
#define PREFS_KEY_SEND_IMAGE        @"momo_send_image_enabled"
#define PREFS_KEY_DEEPSEEK_MODEL    @"momo_deepseek_model"
#define PREFS_KEY_TEMPERATURE       @"momo_temperature"
#define PREFS_KEY_MAX_TOKENS        @"momo_max_tokens"
#define PREFS_KEY_CHAT_HISTORY      @"momo_chat_history"
#define PREFS_KEY_LAST_VERSION      @"momo_last_version"
#define PREFS_KEY_DEVICE_ID         @"momo_device_id"

// Preferences路径 (越狱插件标准路径)
#define PREFS_PATH  @"/var/mobile/Library/Preferences/com.matong.momoaitweak.plist"

// 默认API地址
#define DEFAULT_API_URL     @"https://api.deepseek.com/v1/chat/completions"
#define DEFAULT_MODEL       @"deepseek-chat"
#define DEFAULT_TEMPERATURE 0.85
#define DEFAULT_MAX_TOKENS  2048

// ============================================================
// AI人设定义
// ============================================================
typedef NS_ENUM(NSInteger, PersonaType) {
    PersonaTypeGentle = 0,      // 温柔型
    PersonaTypePassionate = 1,  // 热情型
    PersonaTypeCold = 2,        // 高冷型
    PersonaTypeHumorous = 3,    // 幽默型
    PersonaTypeSweet = 4,       // 甜美型
    PersonaTypeMature = 5,      // 知性型
    PersonaTypeCustom = 99      // 自定义
};

// ============================================================
// AI回复结果
// ============================================================
@interface MomoAIResponse : NSObject
@property (nonatomic, strong) NSString *text;
@property (nonatomic, assign) BOOL wasFiltered;
@property (nonatomic, strong) NSString *originalText;
@end

// ============================================================
// 核心管理器
// ============================================================
@interface MomoAI : NSObject

// 单例
+ (instancetype)sharedInstance;

// 配置
- (BOOL)isEnabled;
- (void)setEnabled:(BOOL)enabled;
- (NSMutableDictionary *)loadPrefs;
- (void)savePrefs:(NSDictionary *)prefs;

// AI聊天
- (void)sendAIChatWithMessages:(NSArray *)messages
                       persona:(NSString *)persona
                    completion:(void(^)(NSString *reply, NSError *error))completion;

// 关键词过滤
- (NSString *)filterContactInfo:(NSString *)text;
- (BOOL)containsContactInfo:(NSString *)text;

// 人设
- (NSString *)personaPromptForType:(PersonaType)type;
- (NSArray<NSString *> *)personaNames;
- (NSString *)personaNameForType:(PersonaType)type;

// 设备
- (NSString *)deviceId;

// 版本检查
- (void)checkForUpdates;

// 聊天历史
- (NSArray *)chatHistoryForConversation:(NSString *)conversationId;
- (void)saveChatHistory:(NSArray *)history forConversation:(NSString *)conversationId;

// 人设(当前)
- (NSString *)currentPersonaPrompt;

// AI聊天辅助
- (NSArray *)buildMessagesWithUserText:(NSString *)userText
                               persona:(NSString *)personaPrompt
                           chatHistory:(NSArray *)history;

@end

// ============================================================
// 消息模型 (模拟陌陌消息对象)
// ============================================================
@interface MomoMessageModel : NSObject
@property (nonatomic, strong) NSString *messageId;
@property (nonatomic, strong) NSString *senderId;
@property (nonatomic, strong) NSString *senderName;
@property (nonatomic, strong) NSString *content;
@property (nonatomic, strong) NSDate *timestamp;
@property (nonatomic, assign) BOOL isIncoming;
@property (nonatomic, strong) NSString *conversationId;
@end
