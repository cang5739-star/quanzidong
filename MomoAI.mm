/*
 * MomoAI.mm
 * 马桶Ai 主实现
 */

#import "MomoAI.h"

@implementation MomoAI

+ (instancetype)sharedInstance {
    static MomoAI *instance = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        instance = [[self alloc] init];
    });
    return instance;
}

@end
