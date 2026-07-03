/*
 * MomoAI.mm
 * 马桶Ai 主实现
 */

#import "MomoAI.h"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wincomplete-implementation"

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

#pragma clang diagnostic pop
