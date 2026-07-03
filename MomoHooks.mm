/*
 * MomoHooks.mm
 * 陌陌Hook调度中心
 *
 * 处理从Tweak.xm接收到的陌陌原始消息对象，
 * 提取内容、调用AI、发送回复。
 */

#import "MomoHooks.h"
#import "MomoAI.h"

@implementation MomoHooks

+ (instancetype)sharedHooks {
    static MomoHooks *instance = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        instance = [[self alloc] init];
    });
    return instance;
}

#pragma mark - 处理收到的消息

- (void)handleIncomingMessage:(id)rawMessage fromController:(id)controller {
    NSDictionary *prefs = [[MomoAI sharedInstance] loadPrefs];
    if (![prefs[PREFS_KEY_AUTO_REPLY] boolValue]) return;

    // 从陌陌消息对象提取内容
    NSString *content = [self extractMessageContent:rawMessage];
    NSString *senderId = [self extractSenderId:rawMessage];
    NSString *senderName = [self extractSenderName:rawMessage];
    NSString *conversationId = [self extractConversationId:rawMessage senderId:senderId];

    // 过滤非文本消息（图片、视频、位置等）
    if (!content || content.length == 0) return;

    // 过滤系统消息/通知
    if ([self isSystemMessage:content]) return;

    // 过滤自己的消息
    if ([self isSelfMessage:rawMessage]) return;

    HBLogInfo(@"[马桶Ai] 处理消息: %@ -> %@", senderName, content);

    // 获取聊天历史
    NSArray *history = [[MomoAI sharedInstance] chatHistoryForConversation:conversationId];

    // 获取人设
    NSString *personaPrompt = [[MomoAI sharedInstance] currentPersonaPrompt];

    // 构建消息列表
    NSArray *messages = [[MomoAI sharedInstance] buildMessagesWithUserText:content
                                                                    persona:personaPrompt
                                                                chatHistory:history];

    // 调用AI
    [[MomoAI sharedInstance] sendAIChatWithMessages:messages
                                            persona:personaPrompt
                                         completion:^(NSString *reply, NSError *error) {

        if (error) {
            HBLogInfo(@"[马桶Ai] AI回复失败: %@", error.localizedDescription);
            return;
        }

        if (!reply || reply.length == 0) return;

        HBLogInfo(@"[马桶Ai] 准备发送AI回复: %@", reply);

        // 保存聊天历史
        NSArray *updatedHistory = history ? [history arrayByAddingObjectsFromArray:@[
            @{@"is_user": @YES, @"content": content},
            @{@"is_user": @NO, @"content": reply}
        ]] : @[
            @{@"is_user": @YES, @"content": content},
            @{@"is_user": @NO, @"content": reply}
        ];
        [[MomoAI sharedInstance] saveChatHistory:updatedHistory forConversation:conversationId];

        // 通过陌陌的API发送回复
        [self sendReply:reply toConversation:conversationId senderId:senderId controller:controller];

        // 延迟后发送图片（如果开启）
        if ([prefs[PREFS_KEY_SEND_IMAGE] boolValue]) {
            dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(3.0 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
                [self sendRandomImageToConversation:conversationId senderId:senderId];
            });
        }
    }];
}

#pragma mark - 处理新招呼

- (void)handleNewGreeting:(id)greeting {
    NSDictionary *prefs = [[MomoAI sharedInstance] loadPrefs];
    if (![prefs[PREFS_KEY_AUTO_GREET] boolValue]) return;

    HBLogInfo(@"[马桶Ai] 收到新招呼，准备自动回复");

    NSString *userId = [self extractGreetingUserId:greeting];
    if (!userId) return;

    // 生成招呼语
    NSString *personaPrompt = [[MomoAI sharedInstance] currentPersonaPrompt];
    NSString *greetPrompt = [personaPrompt stringByAppendingString:
        @"\n你收到一个新的打招呼，请用一句自然、友好的话开场。"
        @"不要太长，10-30个字就好。不要暴露你是一个程序。"];

    NSArray *messages = @[
        @{@"role": @"system", @"content": greetPrompt},
        @{@"role": @"user", @"content": @"你好，认识一下吧~"}
    ];

    [[MomoAI sharedInstance] sendAIChatWithMessages:messages
                                            persona:personaPrompt
                                         completion:^(NSString *reply, NSError *error) {
        if (reply) {
            [self sendReply:reply toConversation:userId senderId:userId controller:nil];
        }
    }];
}

#pragma mark - 从陌陌对象中提取信息

/*
 * ⚠️ 下面的提取方法需要根据实际陌陌版本的消息对象结构调整
 * 常见的消息对象属性:
 *   - content / text / messageContent
 *   - sender / fromUser / from
 *   - targetId / conversationId / sessionId
 *
 * 建议用Frida查看实际对象结构:
 *   frida -U com.momo.im -e "ObjC.choose(ObjC.classes['MCMessage'], function(m){console.log(m);})"
 */

- (NSString *)extractMessageContent:(id)message {
    // 尝试常见属性名
    NSArray *contentKeys = @[@"content", @"text", @"messageContent", @"body", @"msgContent"];

    for (NSString *key in contentKeys) {
        id value = [message valueForKey:key];
        if ([value isKindOfClass:[NSString class]] && [value length] > 0) {
            return value;
        }
    }

    // 尝试通过私有API获取
    SEL contentSel = NSSelectorFromString(@"content");
    if ([message respondsToSelector:contentSel]) {
        id value = [message performSelector:contentSel];
        if ([value isKindOfClass:[NSString class]]) return value;
    }

    // 通过description获取
    NSString *desc = [message description];
    if (desc && desc.length > 0 && ![desc hasPrefix:@"<"]) {
        return desc;
    }

    return nil;
}

- (NSString *)extractSenderId:(id)message {
    NSArray *idKeys = @[@"senderId", @"sender", @"fromUserId", @"fromUser", @"from", @"uid"];

    for (NSString *key in idKeys) {
        id value = [message valueForKey:key];
        if ([value isKindOfClass:[NSString class]] && [value length] > 0) {
            return value;
        }
    }

    return @"unknown";
}

- (NSString *)extractSenderName:(id)message {
    NSArray *nameKeys = @[@"senderName", @"senderNick", @"nickName", @"nick", @"fromUserName"];

    for (NSString *key in nameKeys) {
        id value = [message valueForKey:key];
        if ([value isKindOfClass:[NSString class]] && [value length] > 0) {
            return value;
        }
    }

    return @"陌生人";
}

- (NSString *)extractConversationId:(id)message senderId:(NSString *)senderId {
    NSArray *convKeys = @[@"conversationId", @"sessionId", @"targetId", @"chatWith"];

    for (NSString *key in convKeys) {
        id value = [message valueForKey:key];
        if ([value isKindOfClass:[NSString class]] && [value length] > 0) {
            return value;
        }
    }

    return senderId ?: @"default";
}

- (NSString *)extractGreetingUserId:(id)greeting {
    NSArray *idKeys = @[@"userId", @"uid", @"fromUserId", @"senderId", @"id"];

    for (NSString *key in idKeys) {
        id value = [greeting valueForKey:key];
        if ([value isKindOfClass:[NSString class]] && [value length] > 0) {
            return value;
        }
    }

    return nil;
}

#pragma mark - 消息类型判断

- (BOOL)isSystemMessage:(NSString *)content {
    NSArray *systemPatterns = @[
        @"系统消息", @"系统通知", @"[系统]", @"【系统】",
        @"你已添加", @"你们已经是好友", @"打招呼",
        @"收到的招呼", @"SYSTEM_HELLO",
    ];

    for (NSString *pattern in systemPatterns) {
        if ([content containsString:pattern]) return YES;
    }
    return NO;
}

- (BOOL)isSelfMessage:(id)message {
    // 尝试判断是否自己发的消息
    // 陌陌通常有一个 isSelf / isOutgoing / isSend 属性
    NSArray *selfKeys = @[@"isSelf", @"isOutgoing", @"isSend", @"isMyMessage"];

    for (NSString *key in selfKeys) {
        id value = [message valueForKey:key];
        if ([value respondsToSelector:@selector(boolValue)]) {
            return [value boolValue];
        }
    }

    return NO;
}

#pragma mark - 发送回复

- (void)sendReply:(NSString *)reply
   toConversation:(NSString *)conversationId
         senderId:(NSString *)senderId
       controller:(id)controller {

    // 方法1: 通过视图控制器发送 (如果有controller实例)
    if (controller) {
        // 尝试几个常见的发送消息方法
        SEL sendSels[] = {
            @selector(sendTextMessage:),
            @selector(sendMessage:),
            @selector(onSendText:),
            NSSelectorFromString(@"sendText:toUser:"),
            NSSelectorFromString(@"sendContent:"),
        };

        for (int i = 0; i < 5; i++) {
            SEL sel = sendSels[i];
            if ([controller respondsToSelector:sel]) {
                HBLogInfo(@"[马桶Ai] 通过控制器发送: %@", NSStringFromSelector(sel));
                // 需要根据实际方法签名调整
                // [controller performSelector:sel withObject:reply];
                return;
            }
        }
    }

    // 方法2: 通过消息管理器发送 (需要找到消息管理器实例)
    Class managerClass = NSClassFromString(MOMO_MESSAGE_MANAGER_CLASS);
    if (managerClass) {
        id manager = [managerClass sharedInstance]; // 或defaultManager
        if (manager) {
            SEL sendSel = NSSelectorFromString(@"sendTextMessage:to:complete:");
            if ([manager respondsToSelector:sendSel]) {
                HBLogInfo(@"[马桶Ai] 通过管理器发送消息");
                // 这里需要用NSInvocation处理多参数
                // 因为performSelector只支持最多2个参数
            }
        }
    }

    // 方法3: 直接通过陌陌内部API发送 (最可靠)
    // 需要逆向得到实际的网络请求类
    HBLogInfo(@"[马桶Ai] 发送回复: %@ -> %@", reply, conversationId);
}

- (void)sendRandomImageToConversation:(NSString *)conversationId senderId:(NSString *)senderId {
    HBLogInfo(@"[马桶Ai] 尝试发送图片: %@", conversationId);

    // 从相册选择或使用默认图片
    // 需要hook UIImagePickerController 或使用陌陌内部图片发送API
}

@end
