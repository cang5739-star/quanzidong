/*
 * AIChatManager.mm
 * AI聊天管理器 - DeepSeek API集成
 *
 * 从Android版马桶Ai源码逆向得到的AI交互逻辑
 */

#import "MomoAI.h"

@implementation MomoAI (AIChat)

#pragma mark - 构建消息历史

- (NSArray *)buildMessagesWithUserText:(NSString *)userText
                                persona:(NSString *)personaPrompt
                              chatHistory:(NSArray *)history {

    NSMutableArray *messages = [NSMutableArray array];

    // 系统人设提示
    [messages addObject:@{
        @"role": @"system",
        @"content": personaPrompt
    }];

    // 聊天历史（最多10条）
    NSInteger maxHistory = 10;
    NSArray *recentHistory = history;
    if (history.count > maxHistory) {
        recentHistory = [history subarrayWithRange:NSMakeRange(history.count - maxHistory, maxHistory)];
    }

    for (NSDictionary *msg in recentHistory) {
        NSString *role = msg[@"is_user"] ? @"user" : @"assistant";
        [messages addObject:@{
            @"role": role,
            @"content": msg[@"content"] ?: @""
        }];
    }

    // 当前用户消息
    if (userText) {
        [messages addObject:@{
            @"role": @"user",
            @"content": userText
        }];
    }

    return messages;
}

#pragma mark - 调用DeepSeek API

- (void)sendAIChatWithMessages:(NSArray *)messages
                       persona:(NSString *)persona
                    completion:(void(^)(NSString *reply, NSError *error))completion {

    NSDictionary *prefs = [self loadPrefs];
    NSString *apiKey = prefs[PREFS_KEY_API_KEY] ?: @"";
    NSString *apiUrl = prefs[PREFS_KEY_API_URL] ?: DEFAULT_API_URL;
    NSString *model = prefs[PREFS_KEY_DEEPSEEK_MODEL] ?: DEFAULT_MODEL;
    CGFloat temperature = [prefs[PREFS_KEY_TEMPERATURE] floatValue] ?: DEFAULT_TEMPERATURE;
    NSInteger maxTokens = [prefs[PREFS_KEY_MAX_TOKENS] integerValue] ?: DEFAULT_MAX_TOKENS;

    if (apiKey.length == 0) {
        if (completion) {
            completion(nil, [NSError errorWithDomain:@"MomoAI"
                                               code:1001
                                           userInfo:@{NSLocalizedDescriptionKey: @"请在设置中配置API密钥"}]);
        }
        return;
    }

    // 构建请求体
    NSDictionary *requestBody = @{
        @"model": model,
        @"messages": messages,
        @"temperature": @(temperature),
        @"max_tokens": @(maxTokens),
        @"stream": @NO
    };

    // 发送请求
    NSURL *url = [NSURL URLWithString:apiUrl];
    NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:url];
    request.HTTPMethod = @"POST";
    [request setValue:@"application/json" forHTTPHeaderField:@"Content-Type"];
    [request setValue:[NSString stringWithFormat:@"Bearer %@", apiKey] forHTTPHeaderField:@"Authorization"];
    request.timeoutInterval = 30;

    NSError *serialError;
    request.HTTPBody = [NSJSONSerialization dataWithJSONObject:requestBody options:0 error:&serialError];
    if (serialError) {
        if (completion) completion(nil, serialError);
        return;
    }

    HBLogInfo(@"[马桶Ai] 请求AI: model=%@, msgCount=%lu", model, (unsigned long)[messages count]);

    NSURLSessionDataTask *task = [[NSURLSession sharedSession]
        dataTaskWithRequest:request
        completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {

            if (error) {
                HBLogInfo(@"[马桶Ai] AI请求失败: %@", error.localizedDescription);
                if (completion) completion(nil, error);
                return;
            }

            NSError *jsonError;
            NSDictionary *json = [NSJSONSerialization JSONObjectWithData:data options:0 error:&jsonError];

            if (jsonError) {
                NSString *raw = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
                HBLogInfo(@"[马桶Ai] JSON解析失败: %@", raw);
                if (completion) {
                    completion(nil, [NSError errorWithDomain:@"MomoAI"
                                                       code:1002
                                                   userInfo:@{NSLocalizedDescriptionKey: @"AI返回数据异常"}]);
                }
                return;
            }

            // 解析DeepSeek/OpenAI格式响应
            NSString *content = nil;
            NSArray *choices = json[@"choices"];
            if (choices.count > 0) {
                NSDictionary *firstChoice = choices[0];
                content = firstChoice[@"message"][@"content"];
                // 处理finish_reason
                NSString *finishReason = firstChoice[@"finish_reason"];
                if (![finishReason isEqualToString:@"stop"] && ![finishReason isEqualToString:@"length"]) {
                    HBLogInfo(@"[马桶Ai] AI回复异常结束: %@", finishReason);
                }
            }

            if (!content) {
                // 尝试兼容格式
                content = json[@"response"];
                if (!content) content = json[@"text"];
                if (!content) content = json[@"content"];
            }

            if (content) {
                content = [content stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
                HBLogInfo(@"[马桶Ai] AI回复: %@...", [content substringToIndex:MIN(50, content.length)]);

                // 关键词过滤
                if ([prefs[PREFS_KEY_FILTER_CONTACT] boolValue]) {
                    content = [self filterContactInfo:content];
                }

                if (completion) completion(content, nil);
            } else {
                NSString *raw = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
                HBLogInfo(@"[马桶Ai] 无法解析AI回复: %@", raw);
                if (completion) {
                    completion(nil, [NSError errorWithDomain:@"MomoAI"
                                                       code:1003
                                                   userInfo:@{NSLocalizedDescriptionKey: @"AI回复格式异常"}]);
                }
            }
        }];

    [task resume];
}

#pragma mark - 获取聊天历史

- (NSArray *)chatHistoryForConversation:(NSString *)conversationId {
    NSDictionary *prefs = [self loadPrefs];
    NSDictionary *history = prefs[PREFS_KEY_CHAT_HISTORY] ?: @{};
    return history[conversationId] ?: @[];
}

- (void)saveChatHistory:(NSArray *)history forConversation:(NSString *)conversationId {
    NSMutableDictionary *prefs = [self loadPrefs];
    NSMutableDictionary *chatHistory = [NSMutableDictionary dictionaryWithDictionary:prefs[PREFS_KEY_CHAT_HISTORY] ?: @{}];

    // 只保存最近50条
    NSArray *trimmed = history;
    if (history.count > 50) {
        trimmed = [history subarrayWithRange:NSMakeRange(history.count - 50, 50)];
    }

    chatHistory[conversationId] = trimmed;
    prefs[PREFS_KEY_CHAT_HISTORY] = chatHistory;
    [self savePrefs:prefs];
}

@end
