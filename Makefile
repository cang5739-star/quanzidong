TARGET := iphone:clang:latest:14.0
INSTALL_TARGET_PROCESSES := Momo

include $(THEOS)/makefiles/common.mk

TWEAK_NAME = MomoAITweak

MomoAITweak_FILES = Tweak.xm MomoAI.mm AIChatManager.mm PersonaManager.mm \
                    KeywordFilter.mm ConfigManager.mm MomoHooks.mm
MomoAITweak_CFLAGS = -fobjc-arc -O2 -Wno-error=incomplete-implementation -Wno-error=objc-protocol-method-implementation -Wno-error=arc-performSelector-leaks
MomoAITweak_LIBRARIES =
MomoAITweak_FRAMEWORKS = UIKit Foundation CoreGraphics Security
MomoAITweak_PRIVATE_FRAMEWORKS =

include $(THEOS_MAKE_PATH)/tweak.mk

# PreferenceBundle需要在真机上编译，CI会跳过
# SUBPROJECTS += MomoAIPrefs
# include $(THEOS_MAKE_PATH)/aggregate.mk
