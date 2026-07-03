/*
 * KeywordFilter.mm
 * 关键词过滤 - 拦截AI回复中的联系方式
 *
 * 从Android版马桶Ai源码逆向，完整复刻联系方式检测逻辑
 */

#import "MomoAI.h"

@implementation MomoAI (KeywordFilter)

#pragma mark - 安全回复池

- (NSArray<NSString *> *)safeReplies {
    return @[
        @"哈哈，刚看到消息~",
        @"今天天气不错呢~",
        @"你平时有什么爱好呀？",
        @"周末有什么计划吗？",
        @"最近在忙什么呢？",
        @"你说话挺有意思的~",
        @"我也喜欢这个！",
        @"改天有空可以多聊聊~",
        @"你平时喜欢去哪里玩？",
        @"今天心情不错呢~",
    ];
}

#pragma mark - 联系方式检测

- (BOOL)containsContactInfo:(NSString *)text {
    if (!text || text.length == 0) return NO;

    NSString *lower = text.lowercaseString;

    // 微信相关
    NSArray *wechatPatterns = @[
        @"微信", @"wechat", @"vx", @"wx", @"微❤", @"V❤",
        @"薇欣", @"威信", @"薇信", @"微星",
        @"加微", @"加v", @"➕v", @"➕V",
    ];

    // QQ相关
    NSArray *qqPatterns = @[
        @"QQ", @"qq群", @"q群", @"扣扣",
        @"Q号", @"Q Q",
    ];

    // 手机号/电话
    NSArray *phonePatterns = @[
        @"手机号", @"电话号码", @"电话号", @"联系号码",
        @"打我电话", @"call me", @"telephone",
    ];

    // 加好友/联系方式
    NSArray *contactPatterns = @[
        @"加个好友", @"加好友", @"加我", @"加一个",
        @"私聊", @"私信", @"私我",
        @"联系方式", @"联系我", @"怎么联系",
        @"交个朋友", @"认识一下", @"留个",
    ];

    // 其他社交平台
    NSArray *socialPatterns = @[
        @"抖音", @"douyin", @"dy",
        @"快手", @"kuaishou",
        @"微博", @"weibo",
        @"ins", @"instagram",
        @"小红书", @"xhs",
    ];

    // 网址/链接
    NSArray *urlPatterns = @[
        @"http", @"www.", @".com", @".cn", @".top",
        @"网址", @"链接", @"点我",
    ];

    NSArray *allPatterns = @[
        wechatPatterns, qqPatterns, phonePatterns,
        contactPatterns, socialPatterns, urlPatterns
    ];

    for (NSArray *group in allPatterns) {
        for (NSString *pattern in group) {
            if ([lower containsString:pattern.lowercaseString]) {
                NSLog(@"[马桶AI-过滤] 命中关键词: %@", pattern);
                return YES;
            }
        }
    }

    // 正则匹配手机号（1xx-xxxx-xxxx格式）
    NSError *error;
    NSRegularExpression *phoneRegex = [NSRegularExpression
        regularExpressionWithPattern:@"1[3-9]\\d{2,4}[-\\s]?\\d{4,8}"
                           options:NSRegularExpressionCaseInsensitive
                             error:&error];
    if (!error) {
        NSUInteger matches = [phoneRegex numberOfMatchesInString:text
                                                         options:0
                                                           range:NSMakeRange(0, text.length)];
        if (matches > 0) return YES;
    }

    // 正则匹配QQ号（5-11位数字）
    NSRegularExpression *qqRegex = [NSRegularExpression
        regularExpressionWithPattern:@"[^0-9a-zA-Z][1-9][0-9]{4,10}[^0-9a-zA-Z]"
                           options:NSRegularExpressionCaseInsensitive
                             error:&error];
    if (!error) {
        NSUInteger matches = [qqRegex numberOfMatchesInString:text
                                                      options:0
                                                        range:NSMakeRange(0, text.length)];
        if (matches > 0) return YES;
    }

    return NO;
}

#pragma mark - 联系方式过滤

- (NSString *)filterContactInfo:(NSString *)text {
    if (!text || text.length == 0) return text;
    if (![self containsContactInfo:text]) return text;

    NSString *filtered = text;

    // 删除URL链接
    NSError *error;
    NSRegularExpression *urlRegex = [NSRegularExpression
        regularExpressionWithPattern:@"https?://\\S+"
                           options:NSRegularExpressionCaseInsensitive
                             error:&error];
    if (!error) {
        filtered = [urlRegex stringByReplacingMatchesInString:filtered
                                                     options:0
                                                       range:NSMakeRange(0, filtered.length)
                                                withTemplate:@""];
    }

    // 删除手机号
    NSRegularExpression *phoneRegex = [NSRegularExpression
        regularExpressionWithPattern:@"1[3-9]\\d{2,4}[-\\s]?\\d{4,8}"
                           options:NSRegularExpressionCaseInsensitive
                             error:&error];
    if (!error) {
        filtered = [phoneRegex stringByReplacingMatchesInString:filtered
                                                       options:0
                                                         range:NSMakeRange(0, filtered.length)
                                                  withTemplate:@""];
    }

    // 删除连续数字（疑似QQ号）
    NSRegularExpression *numRegex = [NSRegularExpression
        regularExpressionWithPattern:@"\\b[1-9][0-9]{5,10}\\b"
                           options:NSRegularExpressionCaseInsensitive
                             error:&error];
    if (!error) {
        filtered = [numRegex stringByReplacingMatchesInString:filtered
                                                     options:0
                                                       range:NSMakeRange(0, filtered.length)
                                                withTemplate:@""];
    }

    // 清理多余空格
    filtered = [filtered stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];

    // 正则删除空的微信号/QQ号前缀
    NSArray *prefixCleanups = @[
        @"微信[:：\\s]*$", @"QQ[:：\\s]*$", @"vx[:：\\s]*$",
        @"wx[:：\\s]*$", @"手机[:：\\s]*$", @"电话[:：\\s]*$",
    ];

    for (NSString *pattern in prefixCleanups) {
        NSRegularExpression *cleanupRegex = [NSRegularExpression
            regularExpressionWithPattern:pattern
                               options:NSRegularExpressionCaseInsensitive
                                 error:nil];
        filtered = [cleanupRegex stringByReplacingMatchesInString:filtered
                                                         options:0
                                                           range:NSMakeRange(0, filtered.length)
                                                    withTemplate:@""];
    }

    filtered = [filtered stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];

    // 如果过滤后为空或太短，返回安全回复
    if (filtered.length < 4) {
        NSArray *safe = [self safeReplies];
        NSUInteger idx = arc4random_uniform((uint32_t)safe.count);
        return safe[idx];
    }

    return filtered;
}

@end
