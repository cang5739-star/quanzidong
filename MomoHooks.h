/*
 * MomoHooks.h
 * 陌陌Hook调度中心
 */

#import <Foundation/Foundation.h>

@interface MomoHooks : NSObject

+ (instancetype)sharedHooks;

// 处理收到的消息
- (void)handleIncomingMessage:(id)rawMessage fromController:(id)controller;

// 处理新招呼
- (void)handleNewGreeting:(id)greeting;

// 从陌陌对象中提取信息
- (NSString *)extractMessageContent:(id)message;
- (NSString *)extractSenderId:(id)message;
- (NSString *)extractSenderName:(id)message;
- (NSString *)extractConversationId:(id)message senderId:(NSString *)senderId;

// 发送回复
- (void)sendReply:(NSString *)reply toConversation:(NSString *)conversationId senderId:(NSString *)senderId controller:(id)controller;

@end
