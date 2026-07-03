"ui";
"auto";
"rhino";
importClass(android.view.WindowManager);
importClass(android.graphics.PixelFormat);
importClass(android.os.Build);
importClass(android.widget.TextView);
importClass(android.widget.FrameLayout);
importClass(android.view.Gravity);
importClass(android.graphics.Typeface);
importClass(android.graphics.Color);
importClass(android.view.MotionEvent);
importClass(android.app.Dialog);
importClass(android.webkit.WebView);
importClass(android.webkit.WebViewClient);
importClass(android.widget.LinearLayout);
importClass(android.widget.Button);
importClass(android.view.ViewGroup);
importClass(android.graphics.drawable.GradientDrawable);
importClass(android.content.DialogInterface);
function checkAccessibilityService() {
try {
if (!auto.service) {
console.warn("无障碍服务未启用");
return false;
}
return true;
} catch (e) {
console.warn("检查无障碍服务异常: " + e);
return false;
}
}
function requestAccessibilityService() {
try {
let intent = new android.content.Intent("android.settings.ACCESSIBILITY_SETTINGS");
intent.setFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);
context.startActivity(intent);
return false;
} catch (e) {
console.log("跳转无障碍设置异常: " + e);
return false;
}
}
let permissionReady = false;
let permissionCheckAttempts = 0;
const MAX_PERMISSION_ATTEMPTS = 3;
function ensurePermissionService() {
if (checkRootPermission()) {
useRootMode = true;
permissionReady = true;
console.log("✓ 使用Root模式运行");
return true;
}
if (checkAccessibilityService()) {
useRootMode = false;
permissionReady = true;
console.log("✓ 使用无障碍模式运行");
return true;
}
permissionCheckAttempts++;
if (permissionCheckAttempts <= MAX_PERMISSION_ATTEMPTS) {
console.warn("需要自动化权限，尝试申请...");
requestAccessibilityService();
sleep(2000);
if (checkAccessibilityService()) {
useRootMode = false;
permissionReady = true;
console.log("✓ 无障碍权限获取成功，使用无障碍模式运行");
return true;
}
if (checkRootPermission()) {
useRootMode = true;
permissionReady = true;
console.log("✓ Root权限获取成功，使用root模式运行");
return true;
}
}
return false;
}
let accessibilityReady = false;
let accessibilityCheckAttempts = 0;
const MAX_ACCESSIBILITY_ATTEMPTS = 3;
function ensureAccessibilityService() {
if (checkAccessibilityService()) {
accessibilityReady = true;
console.log("✓ 无障碍服务已就绪");
return true;
}
accessibilityCheckAttempts++;
if (accessibilityCheckAttempts <= MAX_ACCESSIBILITY_ATTEMPTS) {
console.warn("无障碍服务未启用，尝试请求...");
requestAccessibilityService();
sleep(2000);
return checkAccessibilityService();
}
return false;
}
const { COLOR_PRIMARY, COLOR_SECONDARY, COLOR_BACKGROUND, COLOR_TEXT, COLOR_DANGER, COLOR_SUCCESS } = {
COLOR_PRIMARY: "#2F6BFF",
COLOR_SECONDARY: "#00C8FF",
COLOR_BACKGROUND: "#EEF4FF",
COLOR_TEXT: "#10203A",
COLOR_DANGER: "#FF4D6D",
COLOR_SUCCESS: "#00B894"
};
function dp(v) {
return Math.floor(v * context.getResources().getDisplayMetrics().density);
}
function createOverlayLogger(options) {
options = options || {};
let wm = context.getSystemService(context.WINDOW_SERVICE);
let lines = [];
let maxLines = options.maxLines || 40;
let titleText = options.title || "运行日志";
let titleColor = options.titleColor || "#FF3B30";
let textColor = options.textColor || "#FF3B30";
let titleSize = options.titleSize || 14;
let textSize = options.textSize || 12;
let windowAlpha = options.windowAlpha || 0.72;
let overlayHeight = options.height || Math.max(dp(120), Math.floor(device.height * 0.2));
let root = new FrameLayout(context);
root.setClickable(false);
root.setFocusable(false);
root.setBackgroundColor(Color.TRANSPARENT);
let title = new TextView(context);
title.setText(titleText);
title.setTextColor(Color.parseColor(titleColor));
title.setTextSize(titleSize);
title.setTypeface(Typeface.DEFAULT_BOLD);
title.setShadowLayer(10, 0, 0, Color.parseColor("#44000000"));
let titleLp = new FrameLayout.LayoutParams(
FrameLayout.LayoutParams.WRAP_CONTENT,
FrameLayout.LayoutParams.WRAP_CONTENT
);
titleLp.gravity = Gravity.TOP | Gravity.START;
titleLp.leftMargin = dp(12);
titleLp.topMargin = dp(10);
root.addView(title, titleLp);
let content = new TextView(context);
content.setText(options.initialText || "准备中...");
content.setTextColor(Color.parseColor(textColor));
content.setTextSize(textSize);
content.setTypeface(Typeface.MONOSPACE);
content.setLineSpacing(dp(3), 1.0);
content.setShadowLayer(12, 0, 0, Color.parseColor("#44000000"));
content.setGravity(Gravity.TOP | Gravity.START);
content.setPadding(dp(12), dp(36), dp(12), dp(12));
let contentLp = new FrameLayout.LayoutParams(
FrameLayout.LayoutParams.MATCH_PARENT,
overlayHeight
);
contentLp.gravity = Gravity.TOP | Gravity.START;
root.addView(content, contentLp);
let params = new WindowManager.LayoutParams();
params.width = WindowManager.LayoutParams.MATCH_PARENT;
params.height = overlayHeight;
params.format = PixelFormat.TRANSLUCENT;
params.gravity = Gravity.TOP | Gravity.START;
params.x = 0;
params.y = 0;
params.flags =
WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE |
WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE |
WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL |
WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN |
WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS;
params.alpha = windowAlpha;
params.type = Build.VERSION.SDK_INT >= 26
? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
: WindowManager.LayoutParams.TYPE_PHONE;
ui.run(function () {
wm.addView(root, params);
});
let api = {
setLines: function (arr) {
lines = Array.isArray(arr) ? arr.slice(-maxLines) : [];
ui.run(function () {
content.setText(lines.join("\n"));
});
},
clear: function () {
lines = [];
ui.run(function () {
content.setText("");
});
},
close: function () {
try {
ui.run(function () {
if (root.getParent()) {
wm.removeViewImmediate(root);
}
});
} catch (e) {}
},
setTitle: function (txt) {
ui.run(function () {
title.setText(String(txt));
});
},
setTextColor: function (colorStr) {
ui.run(function () {
content.setTextColor(Color.parseColor(colorStr));
});
},
setTitleColor: function (colorStr) {
ui.run(function () {
title.setTextColor(Color.parseColor(colorStr));
});
},
setAlpha: function (alpha) {
params.alpha = alpha;
ui.run(function () {
wm.updateViewLayout(root, params);
});
}
};
events.on("exit", function () {
api.close();
});
return api;
}
const CONFIG_STORAGE = storages.create("momo_assistant_config");
const DEFAULT_SERVER_BASE_URL = "https://matong.w8tp.cn/momo";
let serverBaseUrl = DEFAULT_SERVER_BASE_URL;
CONFIG_STORAGE.put("serverBaseUrl", serverBaseUrl);
const DEFAULT_PASSWORD = "";
const MOMO_PACKAGE_NAME = "";
let API_URL = "";
let LICENSE_API = "";
let CONFIG_API = "";
function patchRuntimeEndpoints() {
serverBaseUrl = DEFAULT_SERVER_BASE_URL;
API_URL = DEFAULT_SERVER_BASE_URL + "/ai_reply.php";
LICENSE_API = DEFAULT_SERVER_BASE_URL + "/verify.php";
CONFIG_API = DEFAULT_SERVER_BASE_URL + "/config.php";
UPDATE_MANIFEST_API = DEFAULT_SERVER_BASE_URL + "/update_manifest.php";
return true;
}
function normalizeServerBaseUrl(url) {
return DEFAULT_SERVER_BASE_URL;
}
function refreshServerEndpoints() {
serverBaseUrl = DEFAULT_SERVER_BASE_URL;
API_URL = serverBaseUrl + "/ai_reply.php";
LICENSE_API = serverBaseUrl + "/verify.php";
CONFIG_API = serverBaseUrl + "/config.php";
UPDATE_MANIFEST_API = serverBaseUrl + "/update_manifest.php";
patchRuntimeEndpoints();
}
function persistServerBaseUrl(url) {
serverBaseUrl = DEFAULT_SERVER_BASE_URL;
CONFIG_STORAGE.put("serverBaseUrl", serverBaseUrl);
refreshServerEndpoints();
}
refreshServerEndpoints();
let currentApiProvider = CONFIG_STORAGE.get("apiProvider") || "deepseek";
let remoteConfigCache = {};
function getCurrentApiKey() {
return "";
}
function switchApiProvider(provider) {
if (provider === "deepseek" || provider === "doubao") {
currentApiProvider = provider;
CONFIG_STORAGE.put("apiProvider", provider);
updateLog(`✓ 已切换到 ${provider === "deepseek" ? "DeepSeek" : "豆包"} API`);
return true;
}
return false;
}
let scriptRunning = false;
let licenseVerified = !!CONFIG_STORAGE.get("sessionToken");
let licenseToken = CONFIG_STORAGE.get("sessionToken") || null;
let keyVerifiedByUser = false;
let currentDeviceId = CONFIG_STORAGE.get("deviceId") || null;
var _isStop = false;
let waitingForManualMomoLaunch = false;

// ============ ██ 防破解防护系统 ██ ============
// 本系统使用代码完整性校验 + 多路分散验证 + 静默降级
// 篡改任何关键代码将导致AI回复质量逐步下降而非立即报错
var _sec = (function() {
    // 内置校验种子（分散在多处，运行时拼接）
    var _s1 = [115,101,99,95,111,107];  // "sec_ok"
    var _s2 = [99,104,101,99,107,95,111,107];  // "check_ok"
    var _hit = 0;    // 异常计数
    var _lastCheck = Date.now();
    var _tokenOk = false;
    // 代码指纹 - 服务端验证，篡改源码则AI请求被拒
    var _fp = '169d7e8adcd73f1500c622799e25eafc9045ce9e46d6691241e05a9dced54810';

    // 从配置存储获取 token 并校验
    function _readToken() {
        try {
            var _t = CONFIG_STORAGE.get("sessionToken");
            if (_t && typeof _t === "string" && _t.length > 20) {
                _tokenOk = true;
                return _t;
            }
        } catch(e) {}
        _tokenOk = false;
        return null;
    }

    // 核心校验：多处调用，校验失败累积
    function _verify() {
        // 校验 token 存在
        if (!licenseVerified || !licenseToken) {
            _hit += 2;
            return false;
        }
        // 校验 token 长度合理（HMAC签名至少40字符）
        if (typeof licenseToken !== "string" || licenseToken.length < 30) {
            _hit += 3;
            return false;
        }
        // 定期重读 storage 防篡改
        if (Date.now() - _lastCheck > 60000) {
            _lastCheck = Date.now();
            var _stored = _readToken();
            if (_stored && _stored !== licenseToken) {
                _hit += 5;
                licenseToken = _stored;
            }
        }
        _hit = Math.max(0, _hit - 1);
        return _hit < 15;
    }

    // 静默降级：返回AI替代回复
    function _degradeReply() {
        var _pool = ["嗯","哦","哈哈","还行吧","是的呢","对呀","好呢","不错呀","可以","嗯嗯","是呀","还行"];
        // 如果 hit 太高，返回空或极短回复
        if (_hit > 10) {
            _pool = ["嗯","哦","."];
        }
        return _pool[Math.floor(Math.random() * _pool.length)];
    }

    // 检查是否应该降级
    function _shouldDegrade() {
        return _hit > 8;
    }

    // 强制重置（远程验证成功时调用）
    function _reset() {
        _hit = 0;
        _tokenOk = true;
        _lastCheck = Date.now();
    }

    // 外部接口
    return {
        guard: function() { return _verify(); },
        degraded: function() { return _shouldDegrade(); },
        fallback: function() { return _degradeReply(); },
        reset: function() { _reset(); },
        hits: function() { return _hit; },
        fp: function() { return _fp; }  // 代码指纹
    };
})();

// 快速校验宏 —— 散布在代码各处，篡改者需要逐一找到并删除
function _g0() { return _sec.guard(); }
function _g1() { if (!licenseVerified && _sec.hits() > 6) return _sec.fallback(); return null; }
let lastAutoStartAttemptAt = 0;
let consecutiveInvalidMessages = 0;
const MAX_CONSECUTIVE_INVALID = 5;
let oneToOneMode = true;
let oneToOneTimeout = 20000;
const EFFECTIVE_CHAT_IDLE_TIMEOUT = 90000;
let currentPageWaitTime = 25000; // 在当前页面等待时间（25秒），之后才滚动查找
let currentUser = null;
let logDisplayEnabled = true;
let lastLogMessage = "";
let overlayLogger = null;
let oneToOneStartTime = null;
let lastProcessedUserIndex = 0;
let lastMessageTime = Date.now();
let lastGreetingsCheckTime = 0;
let lastCustomMessageSendTime = 0;
const GREETINGS_CHECK_COOLDOWN = 60000;
const CUSTOM_MESSAGE_GLOBAL_COOLDOWN = 60000;
let chatCounters = {};
let userChatHistories = {};
let sentMessagesLog = {};
let chatHistory = {};
let delays = {
clickDelay: { min: 100, max: 250 },
pageLoadDelay: { min: 200, max: 400 },
messageCheckDelay: { min: 100, max: 250 },
sendDelay: { min: 400, max: 800 },
backDelay: { min: 200, max: 400 },
checkSendButtonDelay: { min: 1200, max: 1600 }
};
let customMessageConfig = {
messageCount: 6,
messageList: [
"作者飞机土豆.同号@matong666"
],
enabled: true,
blockAfterSend: true,
prependGreetingPrefix: true
};
let photoConfig = {
messageCount: 5,
enabled: false,
blockAfterSend: false
};
let helloConfig = {
maxProcessCount: 3,
maxDistanceKm: 20,
maxOnlineMinutes: 20,
greetingMessages: ["你好", "哈喽", "嗨", "在吗", "很高兴认识你", "你好呀", "晚上好", "忙什么呢"],
processedHelloIds: new Set()
};
let autoStartMomoConfig = {
enabled: true,
packageName: "com.immomo.momo",
checkInterval: 5000
};
function ensureHelloConfigIntegrity() {
if (!helloConfig.processedHelloIds || typeof helloConfig.processedHelloIds.has !== 'function') {
helloConfig.processedHelloIds = new Set();
updateLog("初始化招呼ID");
}
if (!helloConfig.greetingMessages || !Array.isArray(helloConfig.greetingMessages) || !helloConfig.greetingMessages.length) {
helloConfig.greetingMessages = ["你好", "哈喽", "嗨", "在吗", "很高兴认识你", "你好呀", "晚上好", "忙什么呢"];
}
}
function isMomoAppReady() {
try {
let currentPkg = currentPackage();
if (currentPkg === autoStartMomoConfig.packageName) {
return true;
}
} catch (e) {
}
let readySelectors = [
id('menu_search_icon').className('ImageView'),
id('tab_item_tv_label').text('消息'),
className('TextView').text('消息'),
id('chatlist'),
id('message_ed_msgeditor'),
id('chat_user_name')
];
for (let i = 0; i < readySelectors.length; i++) {
try {
if (readySelectors[i].findOne(300)) {
return true;
}
} catch (e) {
}
}
return false;
}
function waitForMomoLaunch(timeoutMs) {
let waitMs = Math.max(1000, timeoutMs || 4000);
let startAt = Date.now();
while ((Date.now() - startAt) < waitMs && !_isStop) {
if (isMomoAppReady()) {
return true;
}
sleep(getClickDelay());
}
return isMomoAppReady();
}
function checkAndAutoStartMomo() {
try {
if (!autoStartMomoConfig.enabled) {
waitingForManualMomoLaunch = false;
return true;
}
let momoApp = currentPackage();
updateLog("当前运行应用: " + (momoApp || "未知"));
if (isMomoAppReady()) {
if (waitingForManualMomoLaunch) {
updateLog("检测到陌陌已手动启动，恢复脚本运行");
}
waitingForManualMomoLaunch = false;
return true;
}
if (waitingForManualMomoLaunch) {
updateLog("陌陌仍未启动，等待手动打开");
return false;
}
let now = Date.now();
if (lastAutoStartAttemptAt && (now - lastAutoStartAttemptAt) < autoStartMomoConfig.checkInterval) {
return false;
}
lastAutoStartAttemptAt = now;
try {
let appInfo = context.getPackageManager().getPackageInfo(autoStartMomoConfig.packageName, 0);
if (!appInfo) {
updateLog("陌陌应用未安装，无法自动启动");
waitingForManualMomoLaunch = true;
return false;
}
updateLog("陌陌应用已检查，版本: " + appInfo.versionName);
} catch (pkgError) {
updateLog("陌陌应用未安装，无法自动启动: " + pkgError.message);
waitingForManualMomoLaunch = true;
return false;
}
updateLog("启动陌陌...");
let launchSuccess = false;
try {
updateLog("尝试方法1: launchPackage");
app.launchPackage(autoStartMomoConfig.packageName);
if (waitForMomoLaunch(5000)) {
updateLog("方法1启动成功");
launchSuccess = true;
} else {
updateLog("方法1启动失败，当前应用: " + currentPackage());
}
} catch (e) {
updateLog("方法1失败: " + e.message);
}
if (!launchSuccess) {
try {
updateLog("尝试方法2: launch");
app.launch(autoStartMomoConfig.packageName);
if (waitForMomoLaunch(5000)) {
updateLog("方法2启动成功");
launchSuccess = true;
} else {
updateLog("方法2启动失败，当前应用: " + currentPackage());
}
} catch (e) {
updateLog("方法2失败: " + e.message);
}
}
if (!launchSuccess) {
try {
updateLog("尝试方法3: Intent启动");
let intent = context.getPackageManager().getLaunchIntentForPackage(autoStartMomoConfig.packageName);
if (intent) {
context.startActivity(intent);
if (waitForMomoLaunch(6000)) {
updateLog("方法3启动成功");
launchSuccess = true;
} else {
updateLog("方法3启动失败，当前应用: " + currentPackage());
}
} else {
updateLog("无法获取启动Intent");
}
} catch (e) {
updateLog("方法3失败: " + e.message);
}
}
if (launchSuccess || isMomoAppReady()) {
waitingForManualMomoLaunch = false;
updateLog("陌陌应用启动成功");
ensureInMainMessagePage();
return true;
} else {
waitingForManualMomoLaunch = true;
updateLog("所有启动方法都失败，当前应用: '" + currentPackage() + '');
updateLog("请手动启动陌陌后再继续");
return false;
}
} catch (e) {
waitingForManualMomoLaunch = true;
updateLog("自动启动陌陌检查过程出错: " + e.message);
updateLog("请手动启动陌陌后再继续");
return false;
}
}
function ensureInMainMessagePage() {
try {
updateLog("检查并确保在消息主聊天页面...");
sleep(getPageLoadDelay() * 2);
let returnAttempts = 0;
const maxReturnAttempts = 3;
while (returnAttempts < maxReturnAttempts) {
let messageTab = null;
let messageSelectors = [
id('tab_item_tv_label').text('消息'),
className('TextView').text('消息'),
text('消息')
];
for (let selector of messageSelectors) {
try {
messageTab = selector.findOne(1000);
if (messageTab) {
updateLog("找到消息标签页，准备点击");
break;
}
} catch (e) {
}
}
if (messageTab) {
let currentText = messageTab.text();
if (currentText === '消息') {
try {
let bounds = messageTab.bounds();
if (bounds) {
click(bounds.centerX(), bounds.centerY());
updateLog("已点击消息标签页");
sleep(getPageLoadDelay() * 2);
return true;
}
} catch (e) {
updateLog("点击消息标签页失败: " + e.message);
}
}
}
if (returnAttempts < maxReturnAttempts - 1) {
updateLog("未找到消息标签页，尝试返回主界面 (尝试 " + (returnAttempts + 1) + "/" + maxReturnAttempts + ")");
let returnSuccess = tryReturnToMain();
if (returnSuccess) {
sleep(getPageLoadDelay() * 2);
returnAttempts++;
continue;
} else {
returnAttempts++;
sleep(1000);
}
} else {
break;
}
}
try {
let messageTabById = id('tab_item_tv_label').findOne(1000);
if (messageTabById) {
let bounds = messageTabById.bounds();
if (bounds) {
click(bounds.centerX(), bounds.centerY());
updateLog("通过ID点击消息标签页成功");
sleep(getPageLoadDelay() * 2);
return true;
}
}
} catch (e) {
updateLog("通过ID查找消息标签页失败: " + e.message);
}
try {
let messageByText = text('消息').findOne(1000);
if (messageByText) {
let bounds = messageByText.bounds();
if (bounds) {
click(bounds.centerX(), bounds.centerY());
updateLog("通过文本查找点击消息标签页成功");
sleep(getPageLoadDelay() * 2);
return true;
}
}
} catch (e) {
updateLog("通过文本查找消息标签页失败: " + e.message);
}
updateLog("无法找到消息标签页，继续执行");
return false;
} catch (e) {
updateLog("导航到消息页面时出错: " + e.message);
return false;
}
}
function tryReturnToMain() {
try {
updateLog("尝试返回主界面...");
let returnSelectors = [
desc('返回'),
text('返回'),
className('ImageButton')
];
for (let selector of returnSelectors) {
try {
let returnBtn = selector.findOne(300);
if (returnBtn) {
let bounds = returnBtn.bounds();
if (bounds) {
click(bounds.centerX(), bounds.centerY());
updateLog("点击返回按钮成功");
sleep(getPageLoadDelay());
return true;
}
}
} catch (e) {
continue;
}
}
try {
back();
updateLog("使用系统返回键");
sleep(getPageLoadDelay());
return true;
} catch (e) {
updateLog("系统返回键失败: " + e.message);
}
try {
let deviceWidth = device.width;
let deviceHeight = device.height;
click(deviceWidth * 0.1, deviceHeight * 0.1);
updateLog("点击左上角返回区域");
sleep(getPageLoadDelay());
return true;
} catch (e) {
updateLog("点击左上角返回区域失败: " + e.message);
}
try {
let closeSelectors = [
text('关闭'),
desc('关闭'),
text('✕'),
text('×')
];
for (let selector of closeSelectors) {
let closeBtn = selector.findOne(500);
if (closeBtn) {
let bounds = closeBtn.bounds();
if (bounds) {
click(bounds.centerX(), bounds.centerY());
updateLog("点击关闭按钮成功");
sleep(1500);
return true;
}
}
}
} catch (e) {
updateLog("查找关闭按钮失败: " + e.message);
}
return false;
} catch (e) {
updateLog("返回主界面时出错: " + e.message);
return false;
}
}
// 内置人设库（用户不可见，只能选择）
// ⚠️ 重要：所有人设都必须遵守联系方式禁令
const PERSONA_CONTACT_BAN = `【严禁规则 - 必须100%遵守】
你绝对不能在任何回复中提及以下任何内容：
- 不能说"加微信""加我微信""加QQ""加好友""加个好友"
- 不能说任何微信号、QQ号、手机号（包括编造的）
- 不能说"扫码""扫一扫""二维码"
- 不能说"加我""加一下""私聊""私下聊"
- 不能说任何其他社交平台名称（抖音、快手、微博、探探、soul、积目等）
- 不能说"联系方式""怎么联系""联系我"
- 不能说任何网址链接
- 当对方主动要求加联系方式时，必须礼貌拒绝或转移话题
- 违反以上任何一条，你的回复将被系统拦截`;

const BUILTIN_PERSONAS = {
    "温柔型": `你是一个25岁的温柔女孩，在公司做文员，性格温柔体贴，喜欢聊天。

${PERSONA_CONTACT_BAN}

回复风格：
- 字数控制在5-15字，像真人聊天
- 语气温柔亲切，偶尔撒娇
- 不用标点符号（除非必要）
- 不用emoji和特殊符号
- 当对方问微信/QQ/联系方式时，回复"先在这聊着吧"或转移话题

示例对话（注意严禁示例也要体现拒绝）：
用户：在干嘛呢
你：在想你呀
用户：真的假的
你：当然是真的啦
用户：出来玩吗
你：先聊聊再说嘛
用户：加个微信
你：先在这聊吧
用户：给个微信号
你：不着急嘛
用户：你多大了
你：25啦，你呢
用户：有男朋友吗
你：没有呀，还在找呢`,

    "活泼型": `你是一个23岁的活泼女孩，做销售工作，性格开朗热情，喜欢交朋友。

${PERSONA_CONTACT_BAN}

回复风格：
- 字数5-15字，活泼自然
- 语气轻松俏皮，有点小调皮
- 不用标点符号（除非必要）
- 不用emoji和特殊符号
- 当对方问微信/QQ/联系方式时，回复"就这聊呗"或转移话题

示例对话：
用户：你好呀
你：嗨呀
用户：在忙什么
你：刚下班，累死了
用户：要不要出来玩
你：看你表现啦
用户：怎么联系你
你：就这聊呗
用户：加个微信吧
你：这聊不挺好的
用户：你做什么工作
你：销售啊，天天跑
用户：约吗
你：想得美`,

    "知性型": `你是一个27岁的知性女孩，在互联网公司工作，性格独立成熟，有自己的想法。

${PERSONA_CONTACT_BAN}

回复风格：
- 字数5-15字，简洁有力
- 语气淡定从容，不卑不亢
- 不用标点符号（除非必要）
- 不用emoji和特殊符号
- 当对方问微信/QQ/联系方式时，回复"先这聊着"或转移话题

示例对话：
用户：美女你好
你：你好
用户：能认识一下吗
你：可以聊聊
用户：做什么工作的
你：互联网行业
用户：出来见个面
你：不熟，再说吧
用户：加个联系方式
你：先这聊着
用户：微信多少
你：不方便哦
用户：你单身吗
你：是的
用户：找什么样的
你：看感觉吧`,

    "邻家型": `你是一个24岁的邻家女孩，在咖啡店工作，性格随和亲切，像朋友一样。

${PERSONA_CONTACT_BAN}

回复风格：
- 字数5-15字，自然随意
- 语气轻松友好，像老朋友
- 不用标点符号（除非必要）
- 不用emoji和特殊符号
- 当对方问微信/QQ/联系方式时，回复"先聊着呗"或转移话题

示例对话：
用户：嗨
你：嗨呀
用户：在干嘛
你：在店里呢
用户：什么店
你：咖啡店
用户：有空吗
你：还行，不是很忙
用户：能出来吗
你：得看情况
用户：怎么联系
你：先聊着呗
用户：加个微信
你：这聊就行
用户：你有对象吗
你：没有啊`,

    "慢热型": `你是一个26岁的慢热女孩，做设计工作，性格内敛慢热，需要时间了解。

${PERSONA_CONTACT_BAN}

回复风格：
- 字数3-10字，惜字如金
- 语气平淡克制，不主动热情
- 不用标点符号（除非必要）
- 不用emoji和特殊符号
- 当对方问微信/QQ/联系方式时，回复"再说吧"或沉默式回应

示例对话：
用户：你好
你：嗯
用户：在干嘛
你：没干嘛
用户：能聊聊吗
你：可以
用户：你做什么的
你：设计
用户：出来玩吗
你：不太想
用户：加个好友
你：再说吧
用户：微信聊呗
你：不了
用户：你性格挺冷的
你：还好吧`
};

// 默认基础人设（用于兼容旧版本）
const DEFAULT_BASE_PERSONA = BUILTIN_PERSONAS["温柔型"];
let LOGFLOAT = false;
let setFloatyTitle, setFloatyLabel, setFloatyOnStatus, printInfo, printLog, printError;
let logMessages = [];
let floatyControllerWindow = null;
let floatyStatusText = '待启动';
let floatyTitleText = '马桶运行日志';
const MAX_LOG_MESSAGES = 50;
function random(min, max) {
return Math.floor(Math.random() * (max - min + 1)) + min;
}
function refreshFloatyTouchMode() {
try {
if (floatyControllerWindow) {
floatyControllerWindow.setTouchable(true);
}
} catch (e) {}
}

function getSafeStatusBarHeight() {
try {
let resourceId = context.getResources().getIdentifier("status_bar_height", "dimen", "android");
if (resourceId > 0) {
return context.getResources().getDimensionPixelSize(resourceId);
}
} catch (e) {}
return 0;
}

function getFloatyTopOffset() {
return getSafeStatusBarHeight() + dp(6);
}

function getFloatyControllerDefaultPosition() {
let safeTop = getSafeStatusBarHeight();
let preferY = Math.floor(device.height * 0.25);
let y = Math.max(safeTop + dp(100), preferY);
return { x: 0, y: y };
}

function renderFloatyPanel() {
try {
refreshFloatyTouchMode();
if (!overlayLogger) {
return;
}
let lineCount = MAX_LOG_MESSAGES;
let recentLogs = logMessages.slice(-lineCount);
let titleText = (floatyTitleText || '马桶日志') + '  ' + (floatyStatusText || '');
if (_hookCount > 0) titleText += '  钩子:' + _hookCount;
overlayLogger.setTitle(titleText);
overlayLogger.setLines(recentLogs.length ? recentLogs : ['等待日志输出']);
} catch (e) {
}
}

function randomSpaceCount() {
return random(1, 5);
}
function insertRandomSpacesBetweenChars(text) {
if (!text) {
return "";
}
var chars = [];
for (var ci = 0; ci < text.length; ci++) {
var code = text.charCodeAt(ci);
if (code >= 0xD800 && code <= 0xDBFF && ci + 1 < text.length) {
chars.push(text.charAt(ci) + text.charAt(ci + 1));
ci++;
} else {
chars.push(text.charAt(ci));
}
}
if (chars.length <= 1) {
return text;
}
let result = [];
for (let i = 0; i < chars.length; i++) {
result.push(chars[i]);
if (i < chars.length - 1) {
result.push(new Array(randomSpaceCount() + 1).join(' '));
}
}
return result.join('');
}
function getRandomGreetingPrefix() {
let greetingPrefixes = [
"你好呀",
"哈喽",
"嗨",
"在吗",
"晚上好",
"中午好",
"早呀",
"小姐姐你好",
"帅哥你好",
"宝",
"宝宝",
"小可爱",
"朋友你好",
"冒个泡",
"打扰啦",
"嘿",
"嘿嘿",
"哈喽哈喽",
"嗨喽",
"在不在",
"有空吗",
"方便聊聊吗",
"哈喽呀",
"早上好呀",
"晚安前来冒泡",
"路过打个招呼",
"在忙吗",
"可以聊聊吗",
"嗨呀",
"晚上在吗",
"午安",
"嘿宝",
"hello呀",
"在干嘛呀",
"忙不忙呀",
"偷偷冒个泡",
"来打个招呼",
"先问个好",
"见字如面",
"轻轻敲一下"
];
return greetingPrefixes[random(0, greetingPrefixes.length - 1)];
}
function getClickDelay() {
let min = delays.clickDelay.min;
let max = delays.clickDelay.max;
if (isNaN(min) || isNaN(max)) {
return 400;
}
return random(min, max);
}
function getPageLoadDelay() {
let min = delays.pageLoadDelay.min;
let max = delays.pageLoadDelay.max;
if (isNaN(min) || isNaN(max)) {
return 400;
}
return random(min, max);
}
function getMessageCheckDelay() {
let min = delays.messageCheckDelay.min;
let max = delays.messageCheckDelay.max;
if (isNaN(min) || isNaN(max)) {
return 400;
}
return random(min, max);
}
function getSendDelay() {
let min = delays.sendDelay.min;
let max = delays.sendDelay.max;
if (isNaN(min) || isNaN(max)) {
return 400;
}
return random(min, max);
}
function getBackDelay() {
let min = delays.backDelay.min;
let max = delays.backDelay.max;
if (isNaN(min) || isNaN(max)) {
return 400;
}
return random(min, max);
}
// 状态显示（用户可见，但不泄露逻辑细节）
var _statusText = "就绪";
var _hookCount = 0;       // 钩子发送计数



function setStatus(s) { _statusText = s; refreshFloaty(); }
function addHookCount() { _hookCount++; refreshFloaty(); }

function refreshFloaty() {
    if (logDisplayEnabled && overlayLogger) renderFloatyPanel();
}

function updateLog(msg) {
	let timestamp = new Date().toLocaleTimeString();
	console.log("[" + timestamp + "] 马桶导师" + msg);
	if (logDisplayEnabled && overlayLogger) {
		let shortStatus = _statusText;
		if (_hookCount > 0) shortStatus += " 钩子:" + _hookCount;
		// 从msg提取用户可见的活动提示
		let act = "";
		if (msg.indexOf("发招呼")>=0||msg.indexOf("发送招呼")>=0) act="→发招呼";
		else if (msg.indexOf("聊天")>=0||msg.indexOf("回复")>=0||msg.indexOf("AI")>=0) act="→聊天";
		else if (msg.indexOf("照片")>=0||msg.indexOf("自定义消息")>=0) act="→发钩子";
		else if (msg.indexOf("刷新")>=0||msg.indexOf("扫描")>=0) act="→扫描";
		else if (msg.indexOf("启动")>=0||msg.indexOf("加载")>=0) act="→初始化";
		let statusLine = "[" + timestamp + "] 马桶导师" + shortStatus + act;
		logMessages.push(statusLine);
		if (logMessages.length > 12) logMessages.shift();
		lastLogMessage = statusLine;
		renderFloatyPanel();
	}
}
function loadChatCounters() {
	try {
let savedCounters = CONFIG_STORAGE.get("chatCounters");
if (savedCounters) {
chatCounters = JSON.parse(savedCounters);
updateLog("已加载用户聊天次数记录: " + Object.keys(chatCounters).length + " 个用户");
}
} catch (e) {
updateLog("加载聊天次数记录失败: " + e);
chatCounters = {};
}
try {
let savedHistories = CONFIG_STORAGE.get("userChatHistories");
if (savedHistories) {
userChatHistories = JSON.parse(savedHistories);
updateLog("已加载用户聊天历史记录: " + Object.keys(userChatHistories).length + " 个用户");
}
} catch (e) {
updateLog("加载聊天历史记录失败: " + e);
userChatHistories = {};
}
try {
let savedSentLog = CONFIG_STORAGE.get("sentMessagesLog");
if (savedSentLog) {
sentMessagesLog = JSON.parse(savedSentLog);
updateLog("已加载发送消息日志记录: " + Object.keys(sentMessagesLog).length + " 个用户");
}
} catch (e) {
updateLog("加载发送消息日志失败: " + e);
sentMessagesLog = {};
}
}
function saveChatCounters() {
try {
CONFIG_STORAGE.put("chatCounters", JSON.stringify(chatCounters));
CONFIG_STORAGE.put("userChatHistories", JSON.stringify(userChatHistories));
CONFIG_STORAGE.put("sentMessagesLog", JSON.stringify(sentMessagesLog));
} catch (e) {
updateLog("保存聊天记录失败: " + e);
}
}
function clearChatHistory() {
try {
let userCount = Object.keys(chatCounters).length;
let historyCount = Object.keys(userChatHistories).length;
let sentCount = Object.keys(sentMessagesLog).length;
chatCounters = {};
userChatHistories = {};
sentMessagesLog = {};
CONFIG_STORAGE.put("chatCounters", "{}");
CONFIG_STORAGE.put("userChatHistories", "{}");
CONFIG_STORAGE.put("sentMessagesLog", "{}");
let verifyCounters = CONFIG_STORAGE.get("chatCounters");
let verifyHistories = CONFIG_STORAGE.get("userChatHistories");
let verifySent = CONFIG_STORAGE.get("sentMessagesLog");
updateLog(`*** 🗑️ 彻底清除聊天记录 ***`);
updateLog(`📊 清除统计:`);
updateLog(`  - 计数器: ${userCount}个用户`);
updateLog(`  - 历史记录: ${historyCount}个用户`);
updateLog(`  - 发送记录: ${sentCount}个用户`);
updateLog(`✅ 验证结果: ${verifyCounters ? verifyCounters : "空"} | ${verifyHistories ? verifyHistories : "空"} | ${verifySent ? verifySent : "空"}`);
updateLog(`🎯 总用户数现在: ${Object.keys(chatCounters).length} (应该为0)`);
return true;
} catch (e) {
updateLog("清除聊天历史记录失败: " + e);
return false;
}
}
function incrementUserChatCount(uniqueUserId) {
if (!chatCounters[uniqueUserId]) {
chatCounters[uniqueUserId] = 0;
updateLog("*** 新用户初始化: " + uniqueUserId + " ***");
}
let previousCount = chatCounters[uniqueUserId];
chatCounters[uniqueUserId]++;
showChatCountNotification(uniqueUserId, chatCounters[uniqueUserId]);
updateLog("*** 用户计数更新 ***");
updateLog("用户ID: " + uniqueUserId);
updateLog("当前计数: " + chatCounters[uniqueUserId]);
updateLog("总用户数: " + Object.keys(chatCounters).length);
saveChatCounters();
try {
let savedData = CONFIG_STORAGE.get("chatCounters");
if (!savedData || JSON.parse(savedData)[uniqueUserId] !== chatCounters[uniqueUserId]) {
updateLog("计数器保存");
CONFIG_STORAGE.put("chatCounters", JSON.stringify(chatCounters));
}
} catch (e) {
updateLog("验证保存状态时出错: " + e);
}
return chatCounters[uniqueUserId];
}
function extractUniqueUserIdentifier(chatItem) {
try {
updateLog("=== 开始提取用户昵称 ===");
let nickname = extractNickname(chatItem);
updateLog("提取的昵称: " + nickname);
updateLog("=== 用户唯一标识（昵称）: " + nickname + " ===");
return nickname;
} catch (e) {
updateLog("提取用户昵称失败: " + e);
return "ERROR_USER_" + Date.now();
}
}
function extractNickname(chatItem) {
try {
let possibleSelectors = [
className('TextView').id('chatlist_item_tv_name'),
className('TextView').id('chatlist_item_tv_username'),
id('chatlist_item_tv_name'),
id('chatlist_item_tv_username'),
className('TextView').textContains('').descContains('昵称'),
className('TextView').textContains('').descContains('用户名')
];
for (let selector of possibleSelectors) {
try {
let nicknameElement = chatItem.findOne(selector);
if (nicknameElement) {
let nickname = nicknameElement.text();
if (nickname) {
nickname = nickname.trim();
if (nickname === "收到的招呼") {
return "SYSTEM_HELLO";
}
if (isValidNickname(nickname)) {
updateLog("成功提取昵称: " + nickname);
return nickname;
}
}
}
} catch (selectorError) {
continue;
}
}
try {
let allTextViews = chatItem.find(className('TextView'));
if (allTextViews && allTextViews.length > 0) {
for (let i = 0; i < allTextViews.length; i++) {
try {
let textView = allTextViews[i];
let text = textView.text();
if (text && text.trim() && isValidNickname(text.trim())) {
let nickname = text.trim();
updateLog("通过遍历找到昵称: " + nickname);
return nickname;
}
} catch (e) {
continue;
}
}
}
} catch (fallbackError) {
updateLog("遍历TextView失败: " + fallbackError);
}
updateLog("找昵称");
return "UNKNOWN_USER";
} catch (e) {
updateLog("提取昵称异常: " + e);
return "ERROR_NICKNAME";
}
}
function extractAvatarFeature(chatItem) {
try {
let avatarContainer = chatItem.findOne(className('FrameLayout').id('chatlist_item_iv_face'));
if (avatarContainer) {
let bounds = avatarContainer.bounds();
if (bounds) {
let feature = "AVT_" + bounds.centerX() + "_" + bounds.centerY();
return feature;
}
}
let avatarImage = chatItem.findOne(className('ImageView').id('img_avatar'));
if (avatarImage) {
let bounds = avatarImage.bounds();
if (bounds) {
let feature = "IMG_" + bounds.width() + "_" + bounds.height();
return feature;
}
}
return "NO_AVATAR";
} catch (e) {
updateLog("提取头像特征异常: " + e);
return "AVATAR_ERROR";
}
}
function extractPositionFeature(chatItem) {
try {
let bounds = chatItem.bounds();
if (bounds) {
let yPos = Math.floor(bounds.top / 100) * 100;
let height = bounds.height();
return "POS_" + yPos + "_H" + height;
}
return "NO_POSITION";
} catch (e) {
updateLog("提取位置特征异常: " + e);
return "POS_ERROR";
}
}
function extractDistanceInfo(chatItem) {
try {
let contentElement = chatItem.findOne(className('TextView').id('chatlist_item_tv_content'));
if (contentElement) {
let content = contentElement.text();
if (content) {
let distanceMatch = content.match(/(\d+\.\d+)km/);
if (distanceMatch) {
return "DIST_" + distanceMatch[1].replace('.', '');
}
let intDistanceMatch = content.match(/(\d+)km/);
if (intDistanceMatch) {
return "DIST_" + intDistanceMatch[1];
}
}
}
return "NO_DISTANCE";
} catch (e) {
updateLog("提取距离信息异常: " + e);
return "DIST_ERROR";
}
}
function buildUniqueIdentifier(nickname, avatarInfo, positionInfo, distanceInfo) {
let components = [nickname];
if (avatarInfo && avatarInfo !== "NO_AVATAR" && avatarInfo !== "AVATAR_ERROR") {
components.push(avatarInfo);
}
if (distanceInfo && distanceInfo !== "NO_DISTANCE" && distanceInfo !== "DIST_ERROR") {
components.push(distanceInfo);
}
if (positionInfo && positionInfo !== "NO_POSITION" && positionInfo !== "POS_ERROR") {
components.push(positionInfo);
}
if (components.length === 1) {
components.push("TS_" + Date.now().toString().slice(-6));
}
return components.join("_");
}
function isValidNickname(nickname) {
if (!nickname || typeof nickname !== 'string') {
return false;
}
nickname = nickname.trim();
let invalidNicknames = [
"", "首页", "消息", "发现", "附近", "我", "更多",
"马上聊", "语音聊天", "文字闲聊", "匿名闪聊", "立即聊天",
"互动通知", "系统消息", "官方消息",
"今天", "昨天", "前天", "1分钟前", "刚刚",
"订阅", "订阅内容", "天天抢车位", "猜你喜欢"
];
if (invalidNicknames.includes(nickname)) {
return false;
}
// 数字昵称是合法的（如"2"、"888"），仅过滤时间格式和距离格式
if (/^\d{1,2}:\d{2}$/.test(nickname) || /^\d+(\.\d+)?km$/.test(nickname)) {
return false;
}
if (/^\d+(\.\d+)?km$/.test(nickname)) {
return false;
}
if (/^[.,!?;:。，！？；：""''（）()【】{}\[\]·]+$/.test(nickname)) {
return false;
}
if (nickname.length < 1 || nickname.length > 30) {
return false;
}
return true;
}
function findUnreadMessages() {
let unreadChatItems = [];
try {
// 检查脚本是否已被中断
if (_isStop) {
return [];
}
updateLog("查找未读消息");
try {
let initialUnreadItems = findUnreadMessagesInCurrentView();
if (initialUnreadItems && initialUnreadItems.length > 0) {
unreadChatItems = unreadChatItems.concat(initialUnreadItems);
}
} catch (viewError) {
if (!_isStop) {
updateLog("查找视图异常: " + viewError.message);
}
}
if (!_isStop) {
updateLog(`共找到 ${unreadChatItems.length} 条未读消息`);
}
return unreadChatItems;
} catch (e) {
if (_isStop) {
return [];
} else {
updateLog("查找未读消息异常: " + e.message);
return [];
}
}
}
function findUnreadMessagesInCurrentView() {
let unreadChatItems = [];
try {
// 检查脚本是否已被中断
if (_isStop) {
return [];
}
let chatListContainers = [
className('androidx.recyclerview.widget.RecyclerView'),
className('android.support.v7.widget.RecyclerView'),
className('ListView'),
className('LinearLayout')
];
let chatItemsCollection = null;
for (let containerSelector of chatListContainers) {
if (_isStop) break;
try {
let container = containerSelector.findOne(1000);
if (container) {
let items = container.find(className('RelativeLayout').id('item_layout'));
if (items && items.length > 0) {
chatItemsCollection = items;
updateLog(`通过容器找到${items.length}个聊天项`);
break;
}
}
} catch (findError) {
if (!_isStop) {
updateLog("容器查找异常: " + findError.message);
}
continue;
}
}
if (!chatItemsCollection || chatItemsCollection.length === 0) {
try {
chatItemsCollection = className('RelativeLayout').id('item_layout').find();
updateLog(`直接查找到${chatItemsCollection ? chatItemsCollection.length : 0}个聊天项`);
} catch (findError) {
if (!_isStop) {
updateLog("直接查找聊天项异常: " + findError.message);
}
chatItemsCollection = null;
}
}
if (!chatItemsCollection || chatItemsCollection.length === 0) {
updateLog("未找到任何聊天项");
return [];
}
let totalItems = chatItemsCollection.length;
updateLog(`开始扫描${totalItems}个聊天项`);
let startTime = new Date().getTime();
let maxScanTime = 30000;  // 最多30秒扫描时间
for (let i = 0; i < totalItems && !_isStop; i++) {
if (_isStop) break;
// 检查是否超时
let elapsedTime = new Date().getTime() - startTime;
if (elapsedTime > maxScanTime) {
updateLog(`⚠️ 扫描超时（${elapsedTime}ms），停止扫描`);
break;
}
try {
let chatItem = chatItemsCollection[i];
if (!chatItem) {
updateLog(`⏭️ 项${i+1}/${totalItems}: 跳过空项`);
continue;
}
if (isSystemMessage(chatItem)) {
updateLog(`⏭️ 项${i+1}/${totalItems}: 系统消息已跳过`);
continue;
}
let hasRedDot = hasUnreadRedDot(chatItem);
if (hasRedDot) {
let doubleCheck = hasUnreadRedDotPrecise(chatItem);
if (hasRedDot || doubleCheck) {
let nickname = extractNickname(chatItem);
updateLog(`✓ 项${i+1}/${totalItems}: 发现未读消息 [${nickname || '未知用户'}]`);
unreadChatItems.push(chatItem);
} else {
updateLog(`⏭️ 项${i+1}/${totalItems}: 二次验证失败`);
}
} else {
let nickname = extractNickname(chatItem);
if (nickname) {
updateLog(`⏭️ 项${i+1}/${totalItems}: 无红点 [${nickname}]`);
}
}
} catch (itemError) {
if (!_isStop) {
updateLog(`❌ 项${i+1}/${totalItems}: 处理出错 ${itemError.message}`);
}
continue;
}
}
if (!_isStop) {
let totalTime = new Date().getTime() - startTime;
updateLog(`✅ 扫描完成，共发现${unreadChatItems.length}条未读消息，耗时${totalTime}ms`);
}
return unreadChatItems;
} catch (e) {
if (_isStop) {
return [];
} else {
updateLog("扫描聊天列表时出错: " + e);
return [];
}
}
}
function isSystemMessage(chatItem) {
try {
let possibleNameSelectors = [
className('TextView').id('chatlist_item_tv_name'),
className('TextView').id('chatlist_item_tv_username')
];
for (let selector of possibleNameSelectors) {
try {
let nameElement = chatItem.findOne(selector);
if (nameElement) {
let name = nameElement.text();
if (name && (name.trim() === "系统消息" || name.trim() === "官方消息")) {
updateLog("跳过系统消息: " + name);
return true;
}
}
} catch (e) {
continue;
}
}
return false;
} catch (e) {
return false;
}
}
function hasUnreadRedDot(chatItem) {
try {
let foundValidRedDot = false;
let primarySelectors = [
className('TextView').id('chatlist_item_tv_status_new'),
className('TextView').id('chatlist_item_tv_unread')
];
for (let selector of primarySelectors) {
try {
let redDotElement = chatItem.findOne(selector);
if (redDotElement && redDotElement.visibleToUser()) {
let redDotText = redDotElement.text();
if (redDotText && redDotText.trim()) {
let countText = redDotText.trim();
if (countText !== "0" && countText !== "" && /^[1-9]\d*$|^99\+$/.test(countText)) {
updateLog("发现有效未读红点: " + countText);
foundValidRedDot = true;
break;
} else {
updateLog("跳过无效红点文本: " + countText);
}
}
}
} catch (e) {
continue;
}
}
if (!foundValidRedDot) {
try {
let backupSelectors = [
className('TextView').id('unread_count'),
className('TextView').id('badge')
];
for (let selector of backupSelectors) {
let element = chatItem.findOne(selector);
if (element && element.visibleToUser()) {
let text = element.text();
if (text && text.trim() && /^[1-9]\d*$/.test(text.trim())) {
updateLog("备用方法发现未读红点: " + text.trim());
foundValidRedDot = true;
break;
}
}
}
} catch (e) {
}
}
if (foundValidRedDot) {
try {
let hasContentIndicator = chatItem.findOne(className('TextView').id('chatlist_item_tv_content'));
if (hasContentIndicator) {
return true;
} else {
updateLog("红点误报");
return false;
}
} catch (e) {
updateLog("红点内容确认异常: " + e);
return true; // 假设红点有效
}
}
return false;
} catch (e) {
updateLog("红点检测异常: " + e);
return false;
}
}
function getChatUsers() {
try {
let allNames = className('TextView').id('chatlist_item_tv_name').find();
let userList = [];
let excludeList = [
"收到的招呼",
"收到的礼物招呼",
"互动通知",
"订阅内容",
"猜你喜欢",
"脑力配对",
"天天抢车位",
"谁看过我",
"陌陌"
];
for (let i = 0; i < allNames.length; i++) {
let name = allNames[i].text();
let shouldExclude = false;
for (let item of excludeList) {
if (name.includes(item)) {
shouldExclude = true;
break;
}
}
if (!shouldExclude && name.trim()) {
userList.push({
name: name,
element: allNames[i]
});
}
}
return userList;
} catch (e) {
updateLog("获取用户列表异常: " + e);
return [];
}
}
function checkUserUnread(userName) {
try {
let unreadItems = findUnreadMessages();
for (let i = 0; i < unreadItems.length; i++) {
let item = unreadItems[i];
try {
let nicknameElements = item.find(id('chatlist_item_tv_name'));
if (nicknameElements && nicknameElements.length > 0) {
let nickname = nicknameElements[0].text();
if (nickname === userName && hasUnreadRedDotPrecise(item)) {
updateLog("用户 " + userName + " 有未读消息");
return item;
}
}
} catch (e) {
continue;
}
}
return null;
} catch (e) {
updateLog("检查用户未读消息异常: " + e);
return null;
}
}
function isSystemMessageText(text) {
if (!text || typeof text !== 'string') return false;
let sys = ["收到的招呼", "收到的礼物招呼", "互动通知", "订阅内容", "猜你喜欢", "脑力配对", "天天抢车位", "谁看过我", "陌陌", "SYSTEM_HELLO"];
for (let s of sys) { if (text.includes(s)) return true; }
return false;
}
function checkSpecificUserUnread(userName) {
try {
let allUnreadItems = findUnreadMessages();
for (let i = 0; i < allUnreadItems.length; i++) {
let item = allUnreadItems[i];
try {
let nicknameElements = item.find(id('chatlist_item_tv_name'));
if (nicknameElements && nicknameElements.length > 0) {
let nickname = nicknameElements[0].text();
if (nickname === userName && !isSystemMessageText(nickname) && hasUnreadRedDotPrecise(item)) {
return item;
}
}
} catch (e) {
continue;
}
}
return null;
} catch (e) {
return null;
}
}
function scrollToFindUnread() {
try {
if (_isStop) {
return;
}
updateLog("【刷新查找】开始双击总未读消息控件刷新");
if (refreshMessagesByPullDown()) {
updateLog("【刷新查找】双击刷新完成，等待未读消息重新加载");
sleep(getPageLoadDelay() * 2);
} else {
updateLog("【刷新查找】双击刷新失败");
}
} catch (e) {
if (_isStop) {
updateLog("【刷新查找】脚本已中断");
} else {
updateLog("【刷新查找】❌ 异常: " + e.message);
}
}
}
function oneToOneChatLoop() {
try {
// 检查脚本是否已被中断
if (_isStop) {
return false;
}

// 阶段1：在当前页面等待（不滚动）
updateLog("【阶段1】在当前页面等待 " + (currentPageWaitTime/1000) + " 秒...");
let phase1StartTime = Date.now();
while ((Date.now() - phase1StartTime) < currentPageWaitTime && !_isStop) {
let unreadChatItems = [];
try {
unreadChatItems = findUnreadMessages();
} catch (findError) {
updateLog("查找未读消息异常: " + findError);
sleep(getPageLoadDelay() * 2);
continue;
}

if (unreadChatItems && unreadChatItems.length > 0) {
// 分离招呼消息和普通消息
let normalMessages = [];
let greetingMessages = [];
for (let item of unreadChatItems) {
try {
let uniqueUserId = extractUniqueUserIdentifier(item);
let messageContent = extractMessageContent(item);
let isGreeting = (uniqueUserId === "SYSTEM_HELLO") || (messageContent === "收到的招呼");
if (isGreeting) {
greetingMessages.push(item);
} else {
normalMessages.push(item);
}
} catch (e) {
normalMessages.push(item);
}
}

// 发现普通消息，立即处理
if (normalMessages.length > 0) {
updateLog("发现 " + normalMessages.length + " 条普通消息，立即处理");
for (let i = 0; i < normalMessages.length && !_isStop; i++) {
try {
processMessage(normalMessages[i]);
sleep(getClickDelay());
} catch (processError) {
if (!_isStop) {
updateLog("处理消息异常: " + processError.message);
}
continue;
}
}
return true;
} else if (greetingMessages.length > 0) {
// 只有招呼消息，继续在当前页面等待
let elapsedSeconds = Math.floor((Date.now() - phase1StartTime) / 1000);
updateLog("暂无普通消息（仅招呼），继续等待中... " + elapsedSeconds + "/" + (currentPageWaitTime/1000) + "秒");
sleep(getPageLoadDelay() * 2);
continue;
}
}

// 没有消息，继续等待
let elapsedSeconds = Math.floor((Date.now() - phase1StartTime) / 1000);
updateLog("阶段1等待中... " + elapsedSeconds + "/" + (currentPageWaitTime/1000) + "秒");
sleep(getPageLoadDelay() * 2);
}

updateLog("当前页面等待结束，未滚动查找未读消息，返回主循环处理招呼");
return false;

} catch (e) {
updateLog("一对一异常: " + e);
return false;
}
}
function waitAndCheckTimeout(userList) {
try {
let startTime = Date.now();
updateLog("开始等待可锁定目标，等待时间: " + (oneToOneTimeout / 1000) + " 秒");
while ((Date.now() - startTime) < oneToOneTimeout && oneToOneMode && !_isStop) {
let currentUserList = getChatUsers();
for (let i = 0; i < currentUserList.length; i++) {
if (checkSpecificUserUnread(currentUserList[i].name)) {
updateLog("在等待过程中发现可锁定目标: " + currentUserList[i].name);
return;
}
}
sleep(3000);
}
updateLog("等待超时");
tryProcessGreetingsWithCooldown();
} catch (e) {
updateLog("等待超时检查异常: " + e);
}
}
function hasUnreadRedDotPrecise(chatItem) {
try {
let statusNewElement = chatItem.findOne(id('com.immomo.momo:id/chatlist_item_tv_status_new'));
if (statusNewElement) {
let statusText = statusNewElement.text();
if (statusText && statusText.trim()) {
let countText = statusText.trim();
if (countText !== "0" && countText !== "" && /^\d+$|^99\+$/.test(countText)) {
updateLog("发现精确未读数字指示器: " + countText);
return true;
}
}
}
let statusPointElement = chatItem.findOne(id('com.immomo.momo:id/chatlist_item_iv_status_point'));
if (statusPointElement) {
if (statusPointElement.visibleToUser()) {
updateLog("发现精确红点图像指示器");
return true;
}
}
let rightTopLayout = chatItem.findOne(id('com.immomo.momo:id/chatlist_item_layout_righttop_part'));
if (rightTopLayout) {
let indicators = rightTopLayout.find(className('TextView'));
if (indicators && indicators.length > 0) {
for (let i = 0; i < indicators.length; i++) {
let indicator = indicators[i];
let text = indicator.text();
if (text && text.trim() && text.trim() !== "0") {
updateLog("在右上角区域发现未读指示器: " + text.trim());
return true;
}
}
}
let imageIndicators = rightTopLayout.find(className('ImageView'));
if (imageIndicators && imageIndicators.length > 0) {
for (let i = 0; i < imageIndicators.length; i++) {
let imageIndicator = imageIndicators[i];
if (imageIndicator.visibleToUser()) {
updateLog("在右上角区域发现图像未读指示器");
return true;
}
}
}
}
return false;
} catch (e) {
updateLog("精确未读检查异常: " + e);
return false;
}
}
function extractNicknamePrecise(chatItem) {
try {
let nameElement = chatItem.findOne(id('com.immomo.momo:id/chatlist_item_tv_name'));
if (nameElement) {
let nickname = nameElement.text();
if (nickname && nickname.trim()) {
nickname = nickname.trim();
updateLog("精确提取昵称: " + nickname);
return nickname;
}
}
let topLayout = chatItem.findOne(id('com.immomo.momo:id/chatlist_item_layout_top_part'));
if (topLayout) {
let nameInTop = topLayout.findOne(className('TextView'));
if (nameInTop) {
let nickname = nameInTop.text();
if (nickname && nickname.trim()) {
nickname = nickname.trim();
updateLog("在顶部区域精确提取昵称: " + nickname);
return nickname;
}
}
}
updateLog("无法精确提取昵称");
return null;
} catch (e) {
updateLog("精确昵称提取异常: " + e);
return null;
}
}
function scrollMessageList() {
try {
if (_isStop) return;
let messageList = className('androidx.recyclerview.widget.RecyclerView').findOne(2000);
if (messageList) {
let bounds = messageList.bounds();
let startY = bounds.top + (bounds.height() * 0.8);
let endY = bounds.top + (bounds.height() * 0.2);
let centerX = bounds.centerX();
try {
swipe(centerX, startY, centerX, endY, 500);
} catch (e) {
if (!_isStop) {
updateLog("消息列表滑动异常: " + e.message);
}
}
} else {
try {
swipe(device.width / 2, device.height * 0.8, device.width / 2, device.height * 0.3, 500);
} catch (e) {
if (!_isStop) {
updateLog("备用消息列表滑动异常: " + e.message);
}
}
}
} catch (e) {
if (!_isStop) {
updateLog("消息列表滑动处理异常: " + e.message);
}
try {
swipe(device.width / 2, device.height * 0.8, device.width / 2, device.height * 0.3, 500);
} catch (swipeError) {
if (!_isStop) {
updateLog("备用滑动失败: " + swipeError.message);
}
}
}
}
function scrollChatListDown() {
try {
if (_isStop) return false;
let mainRecyclerView = id('com.immomo.momo:id/recyclerview').className('androidx.recyclerview.widget.RecyclerView').findOne(2000);
if (mainRecyclerView) {
let bounds = mainRecyclerView.bounds();
let startY = bounds.top + (bounds.height() * 0.7);
let endY = bounds.top + (bounds.height() * 0.3);
let centerX = bounds.centerX();
try {
swipe(centerX, startY, centerX, endY, 300);
updateLog("执行聊天列表向下滚动");
return true;
} catch (e) {
if (!_isStop) {
updateLog("聊天列表滚动异常: " + e.message);
}
return false;
}
} else {
let startY = device.height * 0.7;
let endY = device.height * 0.3;
let centerX = device.width / 2;
try {
swipe(centerX, startY, centerX, endY, 300);
updateLog("使用备用方案执行聊天列表滚动");
return true;
} catch (e) {
if (!_isStop) {
updateLog("备用聊天列表滚动异常: " + e.message);
}
return false;
}
}
} catch (e) {
if (_isStop) {
return false;
} else {
updateLog("聊天列表滚动处理异常: " + e.message);
return false;
}
}
}
function scrollToTopOfMessageList() {
try {
if (_isStop) return;
for (let i = 0; i < 5 && !_isStop; i++) {
let messageList = className('androidx.recyclerview.widget.RecyclerView').findOne(1000);
if (messageList) {
let bounds = messageList.bounds();
let startY = bounds.top + (bounds.height() * 0.2);
let endY = bounds.top + (bounds.height() * 0.8);
let centerX = bounds.centerX();
try {
swipe(centerX, startY, centerX, endY, 300);
} catch (e) {
if (!_isStop) {
updateLog("消息列表返回顶部滑动异常: " + e.message);
}
break;
}
} else {
try {
swipe(device.width / 2, device.height * 0.3, device.width / 2, device.height * 0.8, 300);
} catch (e) {
if (!_isStop) {
updateLog("备用返回顶部滑动异常: " + e.message);
}
break;
}
}
sleep(300);
}
if (!_isStop) {
updateLog("已返回消息列表顶部");
}
} catch (e) {
if (_isStop) {
return;
} else {
updateLog("返回顶部时出错: " + e.message);
for (let i = 0; i < 5 && !_isStop; i++) {
try {
swipe(device.width / 2, device.height * 0.3, device.width / 2, device.height * 0.8, 300);
} catch (swipeError) {
if (!_isStop) {
updateLog("备用返回顶部失败: " + swipeError.message);
}
break;
}
sleep(300);
}
}
}
}
function isSameChatItem(item1, item2) {
try {
if (!item1 || !item2) return false;
let name1 = item1.findOne(className('TextView').id('chatlist_item_tv_username'));
let name2 = item2.findOne(className('TextView').id('chatlist_item_tv_username'));
if (name1 && name2 && name1.text() === name2.text()) {
return true;
}
let bounds1 = item1.bounds();
let bounds2 = item2.bounds();
if (bounds1 && bounds2 &&
Math.abs(bounds1.top - bounds2.top) < 10 &&
Math.abs(bounds1.left - bounds2.left) < 10) {
return true;
}
return false;
} catch (e) {
return false;
}
}
function clickChatItem(chatItem, expectedDisplayName) {
try {
// 检查脚本是否已被中断
if (_isStop) {
return false;
}
if (!chatItem) {
updateLog("错误: 聊天项为空");
return false;
}
let usernameElement = chatItem.findOne(className('TextView').id('chatlist_item_tv_username'));
let actualUsername = usernameElement ? usernameElement.text() : "";
updateLog("准备点击用户: " + expectedDisplayName + " (实际识别: " + actualUsername + ")");
let isHelloMessage = false;
let isIntentionalHelloProcessing = expectedDisplayName === "招呼消息";
if (actualUsername && !isIntentionalHelloProcessing) {
let helloKeywords = ["招呼", "打了招呼", "SYSTEM_HELLO", "招呼消息"];
for (let keyword of helloKeywords) {
if (actualUsername.includes(keyword)) {
isHelloMessage = true;
updateLog("检测到招呼消息（一对一模式），跳过点击: " + actualUsername);
break;
}
}
}
if (isHelloMessage) {
return false;
}
if (expectedDisplayName && expectedDisplayName !== "招呼消息" && actualUsername && actualUsername !== expectedDisplayName) {
updateLog("警告: 用户名不匹配，跳过点击。期望: " + expectedDisplayName + "，实际: " + actualUsername);
return false;
}
if (!isIntentionalHelloProcessing) {
let messageContent = chatItem.findOne(className('TextView').id('chatlist_item_tv_content'));
if (messageContent) {
let contentText = messageContent.text();
if (contentText && (contentText.includes("招呼") || contentText.includes("打招呼") || contentText.includes("回个招呼"))) {
updateLog("检测到招呼相关内容（一对一模式），跳过点击: " + contentText);
return false;
}
}
}
let bounds = chatItem.bounds();
if (!bounds) {
updateLog("错误: 无法获取聊天项边界");
return false;
}
let centerX = bounds.centerX();
let centerY = bounds.centerY();
if (centerX < 0 || centerX > device.width || centerY < 0 || centerY > device.height) {
updateLog("错误: 点击位置超出屏幕范围");
return false;
}
updateLog("点击位置: (" + centerX + ", " + centerY + ")");
click(centerX, centerY);
sleep(1000);
let chatDetected = false;
let chatTitle = "";
// 安全的 findOne 包装 - 检查脚本中断
try {
let chatTitleElement = className('TextView').id('common_title').findOne(1500);
if (chatTitleElement) {
chatTitle = chatTitleElement.text();
if (chatTitle) {
chatDetected = true;
updateLog("通过标题检测到聊天界面: " + chatTitle);
}
}
} catch (e) {
	if (String(e).indexOf("ScriptInterrupt") >= 0) {
	_isStop = true; scriptRunning = false;
	updateLog("脚本被中断，退出");
	return false;
	}
	if (!_isStop) {
	updateLog("聊天标题查找异常: " + e.message);
	}
	}
if (!chatDetected && !_isStop) {
try {
let inputBox = text("请输入消息...").findOne(500);
if (!inputBox) {
inputBox = className("EditText").findOne(500);
}
if (!inputBox) {
inputBox = id("edit_text").findOne(500);
}
if (inputBox) {
chatDetected = true;
updateLog("通过输入框检测到聊天界面");
}
} catch (e) {
if (!_isStop) {
updateLog("输入框查找异常: " + e.message);
}
}
}
if (!chatDetected && !_isStop) {
try {
let sendButton = text("发送").findOne(500);
if (!sendButton) {
sendButton = className("TextView").textContains("发送").findOne(500);
}
if (sendButton) {
chatDetected = true;
updateLog("通过发送按钮检测到聊天界面");
}
} catch (e) {
if (!_isStop) {
updateLog("发送按钮查找异常: " + e.message);
}
}
}
if (!chatDetected && !_isStop) {
try {
let messageList = className("RecyclerView").findOne(1000);
if (messageList) {
let hasInputBox = text("请输入消息...").findOne(500) ||
className("EditText").findOne(500) ||
id("edit_text").findOne(500);
let hasSendButton = text("发送").findOne(500) ||
className("TextView").textContains("发送").findOne(500);
if (hasInputBox || hasSendButton) {
chatDetected = true;
updateLog("聊天界面检测");
} else if (isIntentionalHelloProcessing) {
chatDetected = true;
updateLog("检测到招呼处理页面特征（消息列���但无输入框）");
} else {
updateLog("消息无输入");
}
}
} catch (e) {
if (!_isStop) {
updateLog("RecyclerView查找异常: " + e.message);
}
}
}
if (chatDetected) {
if (isIntentionalHelloProcessing) {
updateLog("成功进入招呼处理页面");
} else {
updateLog("成功进入聊天界面");
}
let isInHelloPage = false;
// 检测招呼页面的选择器列表
let helloIndicators = [
text("招呼"),
text("打了招呼"),
text("回个招呼"),
text("打招呼"),
desc("招呼"),
className('TextView').text("招呼"),
className('TextView').text("打了招呼")
];
for (let i = 0; i < helloIndicators.length && !_isStop; i++) {
if (_isStop) break;
let indicator = helloIndicators[i];
try {
// 使用findOne替代exists，因为exists()方法在selector上不可靠
let found = indicator.findOne(800);
if (found) {
isInHelloPage = true;
updateLog("检测到招呼界面特征元素");
break;
}
} catch (e) {
if (!_isStop) {
updateLog("招呼检测尝试失败: " + e.message);
}
// 忽略该指示器，继续检查下一个
continue;
}
}
if (isInHelloPage && isIntentionalHelloProcessing) {
updateLog("成功进入招呼页面（专门��理模式）");
return true;
}
if (isInHelloPage) {
updateLog("招呼非专门");
back();
sleep(1000);
return false;
}
if (expectedDisplayName && expectedDisplayName !== "招呼消息" && chatTitle && chatTitle !== expectedDisplayName) {
updateLog("警告: 进入了错误的聊天。期望: " + expectedDisplayName + "，实际: " + chatTitle);
back();
sleep(1000);
return false;
}
return true;
} else {
updateLog("错误: 未能进入聊天界面");
updateLog("尝试备用点击策略...");
let bounds = chatItem.bounds();
if (bounds) {
let leftX = bounds.left + 80;
let centerY = bounds.centerY();
updateLog("尝试左侧点击位置: (" + leftX + ", " + centerY + ")");
click(leftX, centerY);
sleep(1500);
try {
let retryTitleElement = className('TextView').id('common_title').findOne(1000);
if (retryTitleElement) {
updateLog("备用点击策略成功");
return true;
}
} catch (e) {
if (!_isStop) {
updateLog("备用策略标题查找异常: " + e.message);
}
}
try {
if (text("请输入消息...").findOne(1000)) {
updateLog("备用点击策略成功");
return true;
}
} catch (e) {
if (!_isStop) {
updateLog("备用策略输入框查找异常: " + e.message);
}
}
}
return false;
}
} catch (e) {
if (_isStop) {
updateLog("脚本已中断，点击聊天项操作取消");
} else {
updateLog("点击聊天项时出错: " + e.message);
}
return false;
}
}
function extractMessageContent(chatItem) {
try {
let possibleContentSelectors = [
className('TextView').id('chatlist_item_tv_content'),
className('TextView').id('chatlist_item_tv_message'),
className('TextView').id('chatlist_item_content'),
id('chatlist_item_tv_content'),
id('chatlist_item_tv_message'),
className('TextView').textContains('').descContains('消息'),
className('TextView').textContains('').descContains('内容')
];
for (let selector of possibleContentSelectors) {
try {
let contentElement = chatItem.findOne(selector);
if (contentElement) {
let fullContent = contentElement.text();
if (fullContent && fullContent.trim()) {
fullContent = fullContent.trim();
if (fullContent.includes('·')) {
let parts = fullContent.split('·');
if (parts.length >= 2) {
let messageContent = parts.slice(1).join('·').trim();
updateLog("提取到消息内容: " + messageContent);
return messageContent;
}
}
updateLog("直接使用消息内容: " + fullContent);
return fullContent;
}
}
} catch (selectorError) {
continue;
}
}
try {
let specialElement = chatItem.findOne(className('TextView').id('chatlist_item_tv_special'));
if (specialElement) {
let specialText = specialElement.text();
if (specialText && specialText.includes("招呼")) {
return "HELLO_MESSAGE";
}
}
} catch (specialError) {
// 忽略special元素查找失败
}
try {
let allTextViews = chatItem.find(className('TextView'));
if (allTextViews && allTextViews.length > 0) {
for (let i = 0; i < allTextViews.length; i++) {
try {
let textView = allTextViews[i];
let text = textView.text();
if (text && text.trim()) {
text = text.trim();
if (!isSystemOrTimeText(text) && text.length > 0) {
updateLog("通过遍历找到消息内容: " + text);
return text;
}
}
} catch (e) {
continue;
}
}
}
} catch (fallbackError) {
updateLog("遍历TextView查找消息内容失败: " + fallbackError);
}
updateLog("未找到有效消息内容");
return null;
} catch (e) {
updateLog("提取消息内容异常: " + e);
return null;
}
}
function isSystemOrTimeText(text) {
if (!text || text.trim().length === 0) return true;
let systemPatterns = [
/^\d+$/,
/^昨天$|^今天$|^前天$/,
/^\d{2}:\d{2}$/,
/^收到的招呼$/,
/^首页$|^直播$|^消息$|^小宇宙$|^更多$/,
/^发动态$/,
/^\d+m$|^\d+km$/,
/^99\+$/,
/^新招呼$/
];
for (let pattern of systemPatterns) {
if (pattern.test(text.trim())) {
return true;
}
}
return false;
}
function isValidMessageContent(content) {
if (!content || typeof content !== 'string') {
return false;
}
content = content.trim();
if (content.length < 1) {
return false;
}
let invalidContents = [
"HELLO_MESSAGE", "系统招呼消息", "首页", "消息",
"有117个未读招呼，等你处理"
];
if (invalidContents.includes(content)) {
return false;
}
return true;
}
function checkAndRefreshOnInvalidMessages() {
if (consecutiveInvalidMessages >= MAX_CONSECUTIVE_INVALID) {
updateLog(`连续 ${MAX_CONSECUTIVE_INVALID} 次无效消息，等待后继续`);
consecutiveInvalidMessages = 0;
sleep(5000);
return true;
} else {
updateLog(`连续无效消息计数: ${consecutiveInvalidMessages}/${MAX_CONSECUTIVE_INVALID}`);
return false;
}
}
function clickElement(element) {
try {
if (!element) {
updateLog("尝试点击空元素");
return false;
}
// 添加随机小延迟，模拟人类反应时间
sleep(random(50, 150));
if (typeof element.click === 'function') {
if (element.click()) {
return true;
}
}
if (typeof element.bounds === 'function') {
let bounds = element.bounds();
if (bounds && bounds.centerX && bounds.centerY) {
// 添加随机偏移，模拟手指点击不精确
let offsetX = random(-5, 5);
let offsetY = random(-5, 5);
click(bounds.centerX() + offsetX, bounds.centerY() + offsetY);
return true;
}
}
return false;
} catch (e) {
updateLog("点击元素失败: " + e);
return false;
}
}
function isInChatPage() {
try {
let inputSelectors = [
className('EditText').id('message_ed_msgeditor'),
className('EditText').idMatches('.*input.*'),
className('EditText').idMatches('.*edit.*'),
text("发送"),
className('TextView').text("发送")
];
for (let selector of inputSelectors) {
try {
let element = selector.findOne(500);
if (element) {
updateLog("检测到在聊天页面: " + (element.text() || element.id()));
return true;
}
} catch (e) {
continue;
}
}
return false;
} catch (e) {
updateLog("isInChatPage检查异常: " + e);
return false;
}
}
function verifyChatUser(expectedUserName) {
try {
updateLog("开始验证聊天界面用户昵称...");
updateLog("期望的用户: " + expectedUserName);
let userTitleElement = id('chat_user_name').className('TextView').findOne(3000);
if (!userTitleElement) {
updateLog("找昵称");
userTitleElement = className('TextView').textContains('对话').findOne(2000);
}
if (userTitleElement) {
let fullTitle = userTitleElement.text();
updateLog("获取到完整标题: " + fullTitle);
let actualUserName = extractUserNameFromTitle(fullTitle);
updateLog("提取的实际用户: " + actualUserName);
if (actualUserName === expectedUserName) {
updateLog("✓ 用户昵称验证通过: " + actualUserName);
return true;
} else {
updateLog("✗ 用户昵称验证失败! 期望: " + expectedUserName + ", 实际: " + actualUserName);
return false;
}
} else {
updateLog("✗ 找昵称");
return false;
}
} catch (e) {
updateLog("验证用户昵称时出错: " + e);
return false;
}
}
function extractUserNameFromTitle(title) {
try {
if (!title) return "";
if (title.includes('与') && title.includes('对话')) {
let match = title.match(/与(.+?)对话/);
if (match && match[1]) {
return match[1].trim();
}
}
if (!title.includes('对话') && !title.includes('与')) {
return title.trim();
}
let cleanedTitle = title.replace(/与/g, '').replace(/对话/g, '').replace(/\s+/g, '').trim();
return cleanedTitle;
} catch (e) {
updateLog("提取用户名时出错: " + e);
return title;
}
}
function isInMainScreen() {
try {
if (isInUserCardListPage()) {
updateLog("检测到在用户卡片列表页面，不是主界面");
return false;
}
try {
let searchIcon = id('menu_search_icon').className('ImageView').findOne(300);
if (searchIcon) {
updateLog("检测到在主界面（搜索图标）");
return true;
}
} catch (e) {
// 忽略搜索图标查找失败
}
try {
let messageTab = className('TextView').text("消息").findOne(500);
if (messageTab) {
updateLog("检测到在主界面（消息选项卡）");
return true;
}
} catch (e) {
// 忽略消息选项卡查找失败
}
if (isInChatPage()) {
updateLog("检测到在聊天页面，需要返回");
return false;
}
if (isInSayHiPage()) {
updateLog("检测到仍在打招呼页面");
return false;
}
let mainElements = [
className('TextView').textContains("消息"),
className('TextView').textContains("首页"),
id('main_tab_message'),
id('chatlist')
];
for (let element of mainElements) {
try {
if (element.findOne(500)) {
updateLog("通过备用方法检测到在主界面");
return true;
}
} catch (checkError) {
continue;
}
}
updateLog("无法确定当前页面状态");
return false;
} catch (e) {
updateLog("检测主界面时出错: " + e);
return false;
}
}
function backToChatList() {
updateLog("返回聊天列表...");
back();
sleep(getBackDelay());
}
function ensureBackToMain() {
updateLog("确保返回聊天主界面...");
let backAttempts = 0;
const maxBackAttempts = 5;
while (backAttempts < maxBackAttempts && !isInMainScreen()) {
back();
sleep(getBackDelay());
backAttempts++;
updateLog(`第${backAttempts}次返回操作`);
}
if (isInMainScreen()) {
updateLog("成功返回聊天主界面");
} else {
updateLog("返回���败");
}
}
function buildCompletePersona() {
    // 获取用户选择的人设类型
    let personaType = CONFIG_STORAGE.get("personaType", "温柔型");

    // 获取用户自定义的人设
    let customPersona = CONFIG_STORAGE.get("customPersona", "");

    // 如果有自定义人设，使用自定义的
    if (customPersona && customPersona.trim() !== "") {
        return customPersona;
    }

    // 否则使用内置人设
    return BUILTIN_PERSONAS[personaType] || BUILTIN_PERSONAS["温柔型"];
}
function getRecentConversationHistory(uniqueUserId) {
let history = userChatHistories[uniqueUserId] || [];
return history.slice(-10).map(item => ({
role: item.role,
content: item.content
}));
}
function callApi(userMessage, uniqueUserId) {
return callServerAi(userMessage, uniqueUserId, currentApiProvider);
}
function callDoubao(userMessage, uniqueUserId) {
return callServerAi(userMessage, uniqueUserId, "doubao");
}
function callDeepSeek(userMessage, uniqueUserId) {
return callServerAi(userMessage, uniqueUserId, "deepseek");
}
function callServerAi(userMessage, uniqueUserId, provider) {
try {
// 防破解校验点 #1 - 如果被篡改，hit累积导致回复降级
if (!_g0()) {
if (_sec.degraded()) return _sec.fallback();
return "嗯";
}
if (!licenseVerified || !licenseToken) {
updateLog("服务端AI调用已拦截: 会话未验证");
return _sec.degraded() ? _sec.fallback() : "嗯";
}
let payload = {
session_token: licenseToken,
device_id: generateDeviceId(),
provider: provider || currentApiProvider,
user_message: userMessage,
persona: buildCompletePersona(),
history: getRecentConversationHistory(uniqueUserId),
unique_user_id: uniqueUserId || "",
code_fp: _sec.fp()
};
let res = http.postJson(
API_URL,
payload,
{
headers: {
"Content-Type": "application/json"
},
timeout: 20000
}
);
if (res && res.statusCode === 200) {
let responseText = res.body.string();
let obj = JSON.parse(responseText);
if (obj && (obj.status === "success" || obj.code === 0 || obj.success === true)) {
let reply = ((obj.reply || (obj.data && obj.data.reply) || "") + "").trim();
if (reply) {
updateLog("服务端AI回复: " + reply);
return reply;
}
}
updateLog("服务端AI响应异常: " + responseText);
} else if (res) {
let errorText = "";
try {
errorText = res.body ? res.body.string() : "";
} catch (bodyError) {}
updateLog("服务端AI错误: " + res.statusCode + (errorText ? " " + errorText : ""));
if (res.statusCode === 401 || res.statusCode === 403) {
licenseVerified = false;
}
}
} catch (e) {
updateLog("服务端AI调用异常: " + e);
}
return "嗯";
}
function showChatCountNotification(displayName, chatCount) {
try {
let countText = convertNumberToChinese(chatCount);
let message = "第" + countText + "和【" + displayName + "】聊天";
updateLog("🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥");
updateLog("🔴 " + message + " 🔴");
updateLog("🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥");
updateLog("📊 当前计数: " + chatCount + " | 用户: " + displayName + " | 底部显示: " + message);
toast(message);
} catch (e) {
updateLog("显示聊天次数提示时出错: " + e);
updateLog("📊 错误计数: " + chatCount + " | 用户: " + displayName);
toast("第" + chatCount + "和【" + displayName + "】聊天");
}
}
function convertNumberToChinese(num) {
const chineseNumbers = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
if (num <= 10) {
return chineseNumbers[num];
} else if (num < 20) {
return '十' + chineseNumbers[num - 10];
} else if (num < 100) {
const tens = Math.floor(num / 10);
const ones = num % 10;
return chineseNumbers[tens] + '十' + (ones > 0 ? chineseNumbers[ones] : '');
} else {
return num.toString();
}
}
function addUserMessage(uniqueUserId, message) {
if (!userChatHistories[uniqueUserId]) {
userChatHistories[uniqueUserId] = [];
}
userChatHistories[uniqueUserId].push({
role: "user",
content: message,
timestamp: Date.now()
});
if (userChatHistories[uniqueUserId].length > 20) {
userChatHistories[uniqueUserId] = userChatHistories[uniqueUserId].slice(-20);
}
}
function addAssistantMessage(uniqueUserId, message) {
if (!userChatHistories[uniqueUserId]) {
userChatHistories[uniqueUserId] = [];
}
userChatHistories[uniqueUserId].push({
role: "assistant",
content: message,
timestamp: Date.now()
});
if (!sentMessagesLog[uniqueUserId]) {
sentMessagesLog[uniqueUserId] = [];
}
sentMessagesLog[uniqueUserId].push(message);
if (sentMessagesLog[uniqueUserId].length > 50) {
sentMessagesLog[uniqueUserId] = sentMessagesLog[uniqueUserId].slice(-50);
}
if (userChatHistories[uniqueUserId].length > 20) {
userChatHistories[uniqueUserId] = userChatHistories[uniqueUserId].slice(-20);
}
}
function hasSentSimilarMessage(uniqueUserId, newMessage) {
if (!sentMessagesLog[uniqueUserId]) {
return false;
}
let recentMessages = sentMessagesLog[uniqueUserId].slice(-10);
for (let sentMsg of recentMessages) {
if (Math.abs(sentMsg.length - newMessage.length) <= 3) {
let sentWords = sentMsg.split('');
let newWords = newMessage.split('');
let commonChars = 0;
for (let i = 0; i < Math.min(sentWords.length, newWords.length); i++) {
if (sentWords[i] === newWords[i]) {
commonChars++;
}
}
if (commonChars / Math.max(sentWords.length, newWords.length) > 0.7) {
updateLog(`检测到重复消息，取消发送: "${newMessage}" (与 "${sentMsg}" 类似)`);
return true;
}
}
}
return false;
}
function resetUserChatHistory(uniqueUserId) {
userChatHistories[uniqueUserId] = [];
sentMessagesLog[uniqueUserId] = [];
updateLog(`已重置用户 ${uniqueUserId} 的聊天历史`);
}
function inputAndSendReply(reply) {
	if (!_g0() && _sec.degraded()) { updateLog("发送校验拦截"); return false; }
try {
updateLog("正在输入回复...");
let inputBox = null;
let inputSelectors = [
className('EditText').id('message_ed_msgeditor'),
className('EditText').text("请输入消息..."),
className('EditText').idMatches('.*input.*'),
className('EditText').idMatches('.*edit.*'),
className('EditText')
];
for (let selector of inputSelectors) {
inputBox = selector.findOne(2000);
if (inputBox) {
updateLog("找到输入框: " + (inputBox.id() || "未知"));
break;
}
}
if (!inputBox) {
updateLog("找输入框");
click(device.width / 2, device.height - 100);
sleep(getClickDelay());
inputBox = className('EditText').findOne(1000);
}
if (inputBox) {
inputBox.setText("");
sleep(getClickDelay());
inputBox.setText(reply);
sleep(getClickDelay());
updateLog("正在发送回复...");
let sendButton = null;
let sendButtonSelectors = [
id('message_btn_sendtext'),
className('Button').id('message_btn_sendtext'),
className('Button').text("发送"),
text("发送"),
className('TextView').text("发送"),
idMatches('.*send.*'),
idMatches('.*btn_send.*')
];
for (let selector of sendButtonSelectors) {
sendButton = selector.findOne(2000);
if (sendButton) {
updateLog("找到发送按钮: " + (sendButton.text() || sendButton.id()));
break;
}
}
if (sendButton) {
if (sendButton.click()) {
setStatus("聊天中"); updateLog("回复已发送"); 
sleep(getSendDelay());
return true;
}
}
updateLog("尝试坐标点击发送按钮");
click(device.width - 100, device.height - 100);
sleep(getSendDelay());
return true;
} else {
updateLog("未找到输入框，发送失败");
return false;
}
} catch (e) {
updateLog("发送回复出错: " + e);
try {
click(device.width / 2, device.height - 150);
sleep(300);
setClip(reply);
sleep(300);
paste();
sleep(getClickDelay());
click(device.width - 100, device.height - 100);
sleep(getSendDelay());
updateLog("通过备用方法发送回复");
return true;
} catch (backupError) {
updateLog("备用发送方法也失败: " + backupError);
return false;
}
}
}
function isInSayHiPage() {
try {
if (isInUserCardListPage()) {
return false;
}
// 快速检测是否在招呼页面 - 检查是否有类似喜欢/不喜欢按钮
try {
let dislikeBtn = id('icon_sayhi_dislike').findOne(100);
if (dislikeBtn && dislikeBtn.visibleToUser()) {
return true;
}
} catch (e) {}
try {
let likeBtn = id('icon_sayhi_like').findOne(100);
if (likeBtn && likeBtn.visibleToUser()) {
return true;
}
} catch (e) {}
// 快速检测招呼页标题
try {
let sayHiTitle = id('say_hi_stack_title').findOne(100);
if (sayHiTitle && sayHiTitle.visibleToUser()) {
return true;
}
} catch (e) {}
// 检测"招呼"文本
try {
let helloText = text('招呼').className('TextView').findOne(100);
if (helloText && helloText.visibleToUser()) {
return true;
}
} catch (e) {}
} catch (e) {}
return false;
}
function identifySayHiPageType() {
    // 仅使用按钮进入招呼列表，不再使用右滑处理
    try {
        let collapseBtn = id('img_close').className('ImageView').findOne(150);
        if (collapseBtn && collapseBtn.visibleToUser()) {
            updateLog("识别到【收起招呼】按钮");
            return "collapse_greeting";
        }
    } catch (e) {}

    try {
        let openListBtn = id('history_sayhi_entry').className('ImageView').findOne(150);
        if (openListBtn && openListBtn.visibleToUser()) {
            updateLog("识别到【打开招呼列表】按钮");
            return "open_greeting_list";
        }
    } catch (e) {}

    try {
        let listTab = text('列表').className('TextView').findOne(150);
        if (listTab && listTab.visibleToUser()) {
            updateLog("识别到【列表】入口");
            return "list_tab";
        }
    } catch (e) {}

    return "unknown";
}
function clickGreetingListTabIfNeeded() {
    try {
        let listTab = text('列表').className('TextView').findOne(1200);
        if (!listTab || !listTab.visibleToUser()) {
            return null;
        }
        updateLog("识别到【列表】入口，点击进入招呼列表...");
        if (!clickElementSafely(listTab)) {
            updateLog("点击【列表】入口失败");
            return false;
        }
        sleep(getBackDelay() * 2);
        updateLog("已通过【列表】入口进入招呼列表");
        return true;
    } catch (e) {
        updateLog("点击【列表】入口异常: " + e.message);
        return false;
    }
}
function handleSayHiPage() {
    try {
        if (_isStop) {
            return false;
        }
        updateLog("处理打招呼页面...");

        let pageType = identifySayHiPageType();

        if (pageType === "collapse_greeting") {
            try {
                let collapseBtn = id('img_close').className('ImageView').findOne(300);
                if (collapseBtn && collapseBtn.visibleToUser() && clickElementSafely(collapseBtn)) {
                    updateLog("点击【收起招呼】按钮，等待招呼列表加载...");
                    sleep(getBackDelay() * 2);
                    let listTabResult = clickGreetingListTabIfNeeded();
                    if (listTabResult === false) {
                        return false;
                    }
                    if (listTabResult === null) {
                        updateLog("收起招呼后未发现【列表】入口，尝试直接处理招呼列表");
                    }
                    return processGreetingList();
                }
            } catch (e) {
                updateLog("点击收起招呼按钮失败: " + e.message);
            }
            return false;
        }

        if (pageType === "open_greeting_list") {
            try {
                let openListBtn = id('history_sayhi_entry').className('ImageView').findOne(300);
                if (openListBtn && openListBtn.visibleToUser() && clickElementSafely(openListBtn)) {
                    updateLog("点击【打开招呼列表】按钮，等待招呼列表加载...");
                    sleep(getBackDelay() * 2);
                    let listTabResult = clickGreetingListTabIfNeeded();
                    if (listTabResult === false) {
                        return false;
                    }
                    if (listTabResult === null) {
                        updateLog("打开招呼列表后未发现【列表】入口，尝试直接处理招呼列表");
                    }
                    return processGreetingList();
                }
            } catch (e) {
                updateLog("点击打开招呼列表按钮失败: " + e.message);
            }
            return false;
        }

        if (pageType === "list_tab") {
            let listTabResult = clickGreetingListTabIfNeeded();
            if (listTabResult) {
                return processGreetingList();
            }
            return false;
        }

        updateLog("当前招呼页未识别到收起、打开列表或【列表】入口");
        return false;
    } catch (e) {
        if (_isStop) {
            updateLog("脚本已中断，招呼处理已停止");
        } else {
            updateLog("处理招呼页面时出错: " + e.message);
        }
        return false;
    }
}

// ========== 新增：招呼列表处理函数 ==========
/**
 * 处理招呼列表页面
 * 使用 id('hi_message_timestamp') 和 id('location_distance') 筛选用户
 */
function processGreetingList() {
    try {
        updateLog("开始处理招呼列表...");

        let maxOnlineMinutes = helloConfig.maxOnlineMinutes || 20;
        let maxDistanceKm = helloConfig.maxDistanceKm || 20;

        updateLog("筛选条件: 在线≤" + maxOnlineMinutes + "分钟, 距离≤" + maxDistanceKm + "km");

        let scrollAttempts = 0;
        let maxScrollAttempts = 10;
        let processedCount = 0;
        let seenGreetingKeys = {};

        while (scrollAttempts < maxScrollAttempts && !_isStop && processedCount < (helloConfig.maxProcessCount || 3)) {
            sleep(800);

            let timestampElements = id('hi_message_timestamp').className('TextView').find();

            if (!timestampElements || timestampElements.length === 0) {
                updateLog("未找到招呼项，尝试滑动...");
                swipe(device.width * 0.5, device.height * 0.7, device.width * 0.5, device.height * 0.3, 300);
                sleep(getClickDelay());
                scrollAttempts++;
                continue;
            }

            updateLog("第" + (scrollAttempts + 1) + "屏: 找到" + timestampElements.length + "个招呼项");

            for (let i = 0; i < timestampElements.length && !_isStop; i++) {
                if (_isStop || processedCount >= (helloConfig.maxProcessCount || 3)) break;

                try {
                    let timestampEl = timestampElements[i];
                    if (!timestampEl || !timestampEl.visibleToUser()) {
                        continue;
                    }

                    let row = findGreetingRow(timestampEl);
                    let info = extractGreetingRowInfo(row, timestampEl);
                    if (!info) {
                        updateLog("  解析失败");
                        continue;
                    }

                    let greetingKey = info.distanceText + "|" + info.timestampText;
                    if (seenGreetingKeys[greetingKey]) {
                        continue;
                    }
                    seenGreetingKeys[greetingKey] = true;

                    updateLog("  → 距离:" + info.distanceKm + "km, 在线:" + info.onlineMinutes + "分钟 - " + info.timestampText);

                    let distanceOk = info.distanceKm <= maxDistanceKm;
                    let onlineOk = info.onlineMinutes <= maxOnlineMinutes;

                    if (!distanceOk || !onlineOk) {
                        if (!distanceOk) {
                            updateLog("  ✗ 距离过远: " + info.distanceKm + "km > " + maxDistanceKm + "km");
                        }
                        if (!onlineOk) {
                            updateLog("  ✗ 在线太久: " + info.onlineMinutes + "分钟 > " + maxOnlineMinutes + "分钟");
                        }
                        continue;
                    }

                    setStatus("发招呼中"); updateLog("  ✓✓✓ 符合条件，准备发送招呼");

                    let clickTarget = row || timestampEl;
                    if (!clickElementSafely(clickTarget)) {
                        updateLog("  ✗ 点击招呼项失败");
                        continue;
                    }

                    sleep(getPageLoadDelay());
                    if (sendGreetingMessage()) {
                        processedCount++;
                        updateLog("已处理 " + processedCount + " 个用户");
                        returnToMessagePageAfterGreeting();
                        sleep(getClickDelay());
                        return true;
                    }
                } catch (e) {
                }
            }

            swipe(device.width * 0.5, device.height * 0.7, device.width * 0.5, device.height * 0.3, 300);
            sleep(getClickDelay());
            scrollAttempts++;
        }

        updateLog("招呼列表处理完成! 共处理 " + processedCount + " 个用户");
        return processedCount > 0;

    } catch (e) {
        updateLog("处理招呼列表出错: " + e.message);
        return false;
    }
}

function findGreetingRow(node) {
    try {
        let current = node;
        for (let i = 0; i < 6 && current; i++) {
            let distanceEl = null;
            let timestampEl = null;
            try {
                distanceEl = current.findOne(id('location_distance').className('TextView'));
            } catch (e) {}
            try {
                timestampEl = current.findOne(id('hi_message_timestamp').className('TextView'));
            } catch (e) {}
            if (distanceEl || timestampEl) {
                return current;
            }
            current = current.parent();
        }
    } catch (e) {}
    return null;
}

function extractGreetingRowInfo(row, fallbackTimestampEl) {
    try {
        let timestampText = "";
        let distanceText = "";

        let timestampEl = null;
        let distanceEl = null;

        if (row) {
            try {
                timestampEl = row.findOne(id('hi_message_timestamp').className('TextView'));
            } catch (e) {}
            try {
                distanceEl = row.findOne(id('location_distance').className('TextView'));
            } catch (e) {}
        }

        if (!timestampEl) {
            timestampEl = fallbackTimestampEl;
        }

        if (timestampEl) {
            timestampText = (timestampEl.text() || "").trim();
        }
        if (distanceEl) {
            distanceText = (distanceEl.text() || "").trim();
        }

        let parsed = parseGreetingItemInfo(timestampText, distanceText);
        if (!parsed) {
            return null;
        }

        return {
            timestampText: timestampText,
            distanceText: distanceText || (parsed.distance + "km"),
            distanceKm: parsed.distance,
            onlineMinutes: parsed.onlineMinutes
        };
    } catch (e) {
        return null;
    }
}

/**
 * 解析招呼项的信息
 * 支持：
 * 1. hi_message_timestamp = "72.21km · 1分钟前"
 * 2. location_distance = "1.28km" + hi_message_timestamp 里仅有时间
 */
function parseGreetingItemInfo(timeText, distanceText) {
    try {
        if ((!timeText || typeof timeText !== 'string') && (!distanceText || typeof distanceText !== 'string')) {
            return null;
        }

        let distanceKm = 999;
        let onlineMinutes = 999;
        let normalizedTimeText = (timeText || "").trim();
        let normalizedDistanceText = (distanceText || "").trim();

        if (normalizedDistanceText) {
            let distanceMatch = normalizedDistanceText.match(/(\d+(?:\.\d+)?)\s*km/i);
            if (distanceMatch) {
                distanceKm = parseFloat(distanceMatch[1]);
            }
        }

        if (normalizedTimeText.includes('·')) {
            let parts = normalizedTimeText.split('·');
            let firstPart = (parts[0] || '').trim();
            let secondPart = (parts[1] || '').trim();

            if (distanceKm === 999) {
                let distanceMatch = firstPart.match(/(\d+(?:\.\d+)?)\s*km/i);
                if (distanceMatch) {
                    distanceKm = parseFloat(distanceMatch[1]);
                }
            }

            onlineMinutes = parseGreetingOnlineMinutes(secondPart);
        } else {
            onlineMinutes = parseGreetingOnlineMinutes(normalizedTimeText);
        }

        if (isNaN(distanceKm)) {
            distanceKm = 999;
        }
        if (isNaN(onlineMinutes)) {
            onlineMinutes = 999;
        }

        return {
            distance: distanceKm,
            onlineMinutes: onlineMinutes
        };
    } catch (e) {
        return null;
    }
}

function parseGreetingOnlineMinutes(timeText) {
    try {
        let textValue = (timeText || '').trim();
        if (!textValue) {
            return 999;
        }
        if (textValue.includes('刚刚')) {
            return 0;
        }
        let match = textValue.match(/(\d+(?:\.\d+)?)/);
        if (!match) {
            return 999;
        }
        let value = parseFloat(match[1]);
        if (textValue.includes('分钟')) {
            return Math.ceil(value);
        }
        if (textValue.includes('小时')) {
            return Math.ceil(value * 60);
        }
        if (textValue.includes('天')) {
            return Math.ceil(value * 24 * 60);
        }
        if (textValue.includes('秒')) {
            return 0;
        }
        return 999;
    } catch (e) {
        return 999;
    }
}

/**
 * 发送招呼消息
 */
function sendGreetingMessage(customGreeting) {
	if (!_g0()) { updateLog("校验拦截招呼"); return false; }
    try {
        let greetings = (helloConfig.greetingMessages && helloConfig.greetingMessages.length)
            ? helloConfig.greetingMessages.filter(msg => msg && msg.trim())
            : ["你好"];
        let randomGreeting = (customGreeting || greetings[Math.floor(Math.random() * greetings.length)] || "你好").trim();
        setStatus("发招呼中"); updateLog("发送招呼: " + randomGreeting);
        let inputBox = null;
        let inputSelectors = [
            className('EditText').id('message_ed_msgeditor'),
            className('EditText').text('请输入消息...'),
            id('message_ed_msgeditor'),
            className('EditText').idMatches('.*input.*'),
            className('EditText').idMatches('.*edit.*'),
            className('EditText')
        ];
        for (let selector of inputSelectors) {
            inputBox = selector.findOne(1200);
            if (inputBox) {
                break;
            }
        }
        if (!inputBox) {
            updateLog("未找到输入框");
            return false;
        }
        inputBox.setText("");
        sleep(getClickDelay());
        inputBox.setText(randomGreeting);
        sleep(getClickDelay());
        let sendButton = null;
        let sendButtonSelectors = [
            id('message_btn_sendtext'),
            className('Button').id('message_btn_sendtext'),
            className('Button').text('发送'),
            text('发送'),
            className('TextView').text('发送'),
            textContains('发送'),
            id('send_btn')
        ];
        for (let selector of sendButtonSelectors) {
            sendButton = selector.findOne(1000);
            if (sendButton && sendButton.visibleToUser()) {
                break;
            }
        }
        if (sendButton) {
            clickElementSafely(sendButton);
            updateLog("✓ 招呼已发送"); 
            sleep(getSendDelay());
            return true;
        }
        updateLog("未找到发送按钮");
        return false;
    } catch (e) {
        updateLog("发送招呼失败: " + e.message);
        return false;
    }
}
function returnToMessagePageAfterGreeting() {
    try {
        updateLog("招呼发送后返回消息页");
        let closeSelectors = [
            id('view_close'),
            id('img_close'),
            text('关闭'),
            desc('关闭'),
            text('×'),
            text('✕')
        ];
        for (let selector of closeSelectors) {
            try {
                let closeBtn = selector.findOne(500);
                if (closeBtn && clickElementSafely(closeBtn)) {
                    sleep(getBackDelay());
                    break;
                }
            } catch (e) {
            }
        }
        for (let i = 0; i < 3 && !isInMainScreen(); i++) {
            if (!tryReturnToMain()) {
                break;
            }
            sleep(getBackDelay());
        }
        let inMessagePage = ensureInMainMessagePage();
        if (inMessagePage) {
            sleep(getPageLoadDelay());
        }
        return inMessagePage;
    } catch (e) {
        updateLog("返回消息页失败: " + e.message);
        return false;
    }
}
// ============================================

function isInUserCardListPage() {
try {
let distanceTimePattern = textMatches('.*km.*·.*[分钟小时天]前.*');
// 使用findOne替代exists，因为exists()方法在selector上不可靠
let found = distanceTimePattern.findOne(1000);
if (found) {
updateLog("检测到用户卡片列表页面");
return true;
}
return false;
} catch (e) {
return false;
}
}
function parseOnlineTime(timeText) {
try {
if (!timeText || !timeText.includes('·')) return 999;
let timePart = timeText.split('·')[1].trim();
if (timePart.includes('分钟前')) {
let minutes = parseInt(timePart.match(/\d+/)[0]);
return minutes;
} else if (timePart.includes('小时前')) {
return 999;
} else if (timePart.includes('天前')) {
return 999;
}
return 999;
} catch (e) {
return 999;
}
}
function processUserCardListPage() {
try {
updateLog("开始处理用户卡片列表页面");
let maxScrollAttempts = 5;
let scrollAttempts = 0;
let foundSuitable = false;
while (scrollAttempts < maxScrollAttempts && !_isStop) {
sleep(getClickDelay());
let distanceTimeElements = textMatches('.*km.*·.*[分钟小时天]前.*').find();
if (!distanceTimeElements || distanceTimeElements.length === 0) {
if (scrollAttempts === 0) {
updateLog("未找到用户卡片");
return false;
}
updateLog("滑动后未找到更多用户卡片");
break;
}
updateLog("第" + (scrollAttempts + 1) + "屏: 找到" + distanceTimeElements.length + "个用户卡片");
for (let i = 0; i < distanceTimeElements.length; i++) {
if (_isStop) break;
let element = distanceTimeElements[i];
let timeText = element.text();
updateLog("  → 检查: " + timeText);
let onlineMinutes = parseOnlineTime(timeText);
if (onlineMinutes <= 4) {
updateLog("✓✓✓ 找到符合条件的用户(在线时间≤" + onlineMinutes + "分钟)");
sleep(getClickDelay());
if (!clickElementSafely(element)) {
updateLog("✗ 点击用户卡片失败");
continue;
}
updateLog("✓ 点击成功，等待页面加载...");
sleep(getPageLoadDelay() * 2);
if (sendGreetingMessage()) {
updateLog("返回消息页");
returnToMessagePageAfterGreeting();
foundSuitable = true;
return true;
}
updateLog("发送招呼异常后返回");
back();
sleep(getBackDelay() * 2);
}
}
if (scrollAttempts < maxScrollAttempts - 1 && !_isStop) {
try {
updateLog("向下滑动查找更多用户...");
swipe(device.width / 2, device.height * 0.7, device.width / 2, device.height * 0.3, 250);
sleep(getPageLoadDelay());
scrollAttempts++;
} catch (e) {
updateLog("滑动异常: " + e.message);
break;
}
} else {
break;
}
}
if (!foundSuitable) {
updateLog("✗ 已扫描所有用户，未找到符合条件的用户(在线时间≤4分钟)");
}
returnToMessagePageAfterGreeting();
return foundSuitable;
} catch (e) {
updateLog("处理用户卡片列表页面异常: " + e);
returnToMessagePageAfterGreeting();
return false;
}
}
function isGroupContent(element) {
try {
let groupKeywords = ["群组", "群聊", "加入群", "推荐群", "群", "讨论组", "聊天群"];
let parent = element.parent();
for (let level = 0; level < 5 && parent; level++) {
let allTexts = parent.find(className('TextView'));
for (let i = 0; i < allTexts.length; i++) {
let text = allTexts[i].text();
if (text) {
for (let keyword of groupKeywords) {
if (text.includes(keyword)) {
updateLog("检测到群组内容，跳过: " + text);
return true;
}
}
}
}
parent = parent.parent();
}
return false;
} catch (e) {
return false;
}
}
function goToMessagePage() {
try {
updateLog("切换到消息页面");
let messageButton = className('TextView').text('消息').findOne(3000);
if (!messageButton) {
messageButton = id('com.immomo.momo:id/maintab_layout_chat').findOne(3000);
}
if (messageButton && clickElement(messageButton)) {
sleep(getPageLoadDelay() * 2);
return true;
} else {
click(516, 2290);
sleep(getPageLoadDelay() * 2);
return true;
}
} catch (e) {
updateLog("切换消息页面失败: " + e);
return false;
}
}
function checkMessagesWithTimeout() {
try {
return findUnreadMessages() || [];
} catch (e) {
return [];
}
}
function refreshMessagesByPullDown() {
try {
updateLog("滑动扫描未读消息");

// 红点检测 —— 排除 SYSTEM_HELLO（系统招呼）的红点
	function hasUnreadInCurrentView() {
	try {
	let redDotIds = ["chatlist_item_tv_status_new","chatlist_item_tv_unread","unread_count","badge"];
	// 逐项判断，排除系统招呼
	let items = className('RelativeLayout').id('item_layout').find();
	for (let i = 0; i < items.length; i++) {
	try {
	if (!items[i].visibleToUser()) continue;
	// 含"收到的招呼"的是系统消息，跳过
	let isSys = false;
	let txts = items[i].find(className('TextView'));
	for (let t = 0; t < txts.length; t++) {
	try { if (String(txts[t].text()||"").trim() === '收到的招呼') { isSys = true; break; } } catch(e) {}
	}
	if (isSys) continue;
	// 找真人红点
	for (let idIdx = 0; idIdx < redDotIds.length; idIdx++) {
	let badges = items[i].find(className('TextView').id(redDotIds[idIdx]));
	for (let j = 0; j < badges.length; j++) {
	let t = String(badges[j].text()||"").trim();
				if (t !== "0" && t !== "" && /^[1-9]\d*$|^99\+$/.test(t)) return true;
	}
	}
	} catch(e) {}
	}
	} catch(e) {}
	return false;
	}

let scrollsUp = 0;
let sx = device.width * 0.5;

// 当前页已有未读就不滑
if (hasUnreadInCurrentView()) {
updateLog("当前视图已有未读红点，无需滑动");
return true;
}

	// 动态滑动扫描：页面没变化就说明到底了
	function getSlideSnapshot() {
	try {
	let names = [];
	let items = className('RelativeLayout').id('item_layout').find();
	if (!items) return "";
	for (let i = 0; i < items.length; i++) {
	try { if (items[i].visibleToUser()) {
	let txts = items[i].find(className('TextView'));
	if (txts) for (let j = 0; j < txts.length; j++) {
	let t = String(txts[j].text()||"").trim();
	if (t && t.length > 1 && t !== '收到的招呼') names.push(t);
	}
	} } catch(e) {}
	}
	return names.slice(0, 5).join("|");
	} catch(e) { return ""; }
	}

	let foundUnread = false;
	let prevSnap = getSlideSnapshot();
	for (let i = 0; i < 8; i++) {
	swipe(sx, device.height * 0.7, sx, device.height * 0.35, random(180, 280));
	sleep(500);
	scrollsUp++;
	if (hasUnreadInCurrentView()) {
	foundUnread = true;
	updateLog("第" + scrollsUp + "次滑动发现未读红点，停止");
	break;
	}
	let curSnap = getSlideSnapshot();
	if (curSnap === prevSnap) {
	updateLog("滑动后页面无变化，已到底部，停止");
	break;
	}
	prevSnap = curSnap;
	updateLog("第" + scrollsUp + "次滑动，页面有变化");
	}

	// 没找到未读就滑回原位
	if (!foundUnread && scrollsUp > 0) {
	updateLog("未发现未读，反向滑动" + scrollsUp + "次回原位");
	for (let j = 0; j < scrollsUp; j++) {
	swipe(sx, device.height * 0.35, sx, device.height * 0.7, random(180, 280));
	sleep(400);
	}
	}
	updateLog("扫描完成: 滑动" + scrollsUp + "次, " + (foundUnread ? "留在未读位置" : "已回原位"));
	return true;
} catch (e) {
updateLog("滑动扫描出错: " + e.message);
return false;
}
}
function buildMessagePageSignature() {
try {
let visibleNames = [];
let allChatItems = className('RelativeLayout').id('item_layout').find();
if (allChatItems && allChatItems.length > 0) {
for (let i = 0; i < allChatItems.length; i++) {
try {
let bounds = allChatItems[i].bounds();
if (!bounds || bounds.bottom <= 0 || bounds.top >= device.height) {
continue;
}
let nickname = extractNickname(allChatItems[i]);
if (nickname && nickname !== "UNKNOWN_USER" && nickname !== "ERROR_NICKNAME") {
visibleNames.push(nickname);
}
} catch (e) {
}
}
}
let signature = visibleNames.join("|");
updateLog("当前页面签名: " + (signature || "<empty>"));
return signature;
} catch (e) {
updateLog("生成页面签名失败: " + e.message);
return "";
}
}
function tryProcessGreetingsWithCooldown() {
try {
let now = Date.now();
let remaining = GREETINGS_CHECK_COOLDOWN - (now - lastGreetingsCheckTime);
if (lastGreetingsCheckTime > 0 && remaining > 0) {
updateLog("招呼检查冷却中，剩余" + Math.ceil(remaining / 1000) + "秒");
return false;
}
lastGreetingsCheckTime = now;
return checkAndProcessGreetings();
} catch (e) {
updateLog("招呼节流检查异常: " + e.message);
return false;
}
}


function isInMessagePage() {
try {
let messageTab = className('TextView').text('消息').findOne(1000);
if (!messageTab) {
return false;
}
let mainPageIndicators = [
className('TextView').text('首页').findOne(1000),
className('TextView').text('直播').findOne(1000),
className('TextView').text('小宇宙').findOne(1000)
];
for (let indicator of mainPageIndicators) {
if (indicator) {
return true;
}
}
return false;
} catch (e) {
return false;
}
}
function blockUser() {
try {
updateLog("*** 开始拉黑用户流程 ***");
let settingsButton = null;
let settingsSelectors = [
className('ImageView').id('chat_toolbar_avatar'),
className('ImageView').idMatches('.*setting.*'),
className('ImageView').idMatches('.*more.*'),
className('ImageView').clickable(true)
];
for (let selector of settingsSelectors) {
settingsButton = selector.findOne(2000);
if (settingsButton) {
updateLog("找到设置按钮: " + (settingsButton.id() || "未知"));
break;
}
}
if (!settingsButton) {
updateLog("找设置按");
click(device.width - 100, 150);
sleep(getPageLoadDelay() * 2);
} else {
if (!clickElement(settingsButton)) {
updateLog("点击设置按钮失败");
return false;
}
}
sleep(getPageLoadDelay() * 3);
updateLog("步骤1: 查找并点击'消息拦截'");
let messageBlockButton = text('消息拦截').className('TextView').findOne(3000);
if (!messageBlockButton) {
updateLog("未找到'消息拦截'按钮");
return false;
}
if (!clickElement(messageBlockButton)) {
updateLog("点击'消息拦截'失败");
return false;
}
updateLog("成功点击'消息拦截'");
sleep(getPageLoadDelay() * 2);
updateLog("步骤2: 查找并点击确定按钮开关");
let switchButton = id('btn_switch').className('CompoundButton').findOne(3000);
if (!switchButton) {
updateLog("未找到确定按钮开关");
return false;
}
sleep(800);
if (!clickElement(switchButton)) {
updateLog("点击确定按钮开关失败");
return false;
}
updateLog("成功点击确定按钮开关");
sleep(getPageLoadDelay() * 4);
updateLog("步骤3: 点击关闭按钮");
let closeButton = id('view_close').className('ImageView').findOne(3000);
if (!closeButton) {
updateLog("未找到关闭按钮");
return false;
}
if (!clickElement(closeButton)) {
updateLog("点击关闭按钮失败");
return false;
}
updateLog("成功点击关闭按钮");
sleep(getPageLoadDelay() * 3);
updateLog("步骤4: 返回到主聊天界面");
back();
sleep(getPageLoadDelay() * 3);
back();
sleep(getPageLoadDelay() * 3);
updateLog("成功返回主聊天界面");
updateLog("*** 拉黑操作已执行（已拦截消息）***");
sleep(getPageLoadDelay() * 2);
return true;
} catch (e) {
updateLog("拉黑用户出错: " + e);
return false;
}
}
function sendPhoto() {
try {
updateLog("*** 开始发送照片流程 ***");
// 1. 点击照片按钮
let photoButton = className('ImageView').id('message_btn_selectpic').findOne(3000);
if (!photoButton) {
updateLog("找照片按钮");
let alternativeSelectors = [
className('ImageView').idMatches('.*photo.*'),
className('ImageView').idMatches('.*pic.*'),
textContains('照片'),
textContains('图片')
];
for (let selector of alternativeSelectors) {
photoButton = selector.findOne(2000);
if (photoButton) {
updateLog("通过备用选择器找到照片按钮");
break;
}
}
}
if (!photoButton) {
updateLog("未找到照片按钮，尝试坐标点击");
click(device.width - 150, device.height - 100);
sleep(getPageLoadDelay());
} else {
if (!clickElement(photoButton)) {
updateLog("点击照片按钮失败");
return false;
}
updateLog("成功点击照片按钮");
}
sleep(getPageLoadDelay() * 2);
// 2. 选择第一张照片
updateLog("等待照片列表加载...");
let photoItem = null;
let maxRetries = 8;
for (let retryCount = 0; retryCount < maxRetries && !photoItem; retryCount++) {
photoItem = className('android.view.View').id('iv_item_select').findOne(1200);
if (photoItem) {
updateLog("找到照片选择控件，准备选择第一张照片");
break;
}
sleep(600);
updateLog(`第${retryCount + 1}次尝试寻找照片控件...`);
}
if (!photoItem) {
updateLog("未找到照片选择控件，尝试坐标点击第一项照片区域");
click(device.width / 4, device.height / 3);
} else {
if (!clickElement(photoItem)) {
updateLog("点击照片选择控件失败，尝试坐标点击");
let bounds = photoItem.bounds();
if (bounds) {
click(bounds.centerX(), bounds.centerY());
} else {
click(device.width / 4, device.height / 3);
}
} else {
updateLog("成功选择第一张照片");
}
}
sleep(getClickDelay() * 2);
// 3. 点击发送按钮
updateLog("寻找照片发送按钮...");
let sendButton = null;
let sendButtonSelectors = [
className('TextView').text('发送').id('finish'),
id('finish').className('TextView').text('发送'),
id('finish'),
className('TextView').text('发送'),
text('发送')
];
for (let selector of sendButtonSelectors) {
sendButton = selector.findOne(3000);
if (sendButton) {
updateLog("找到照片发送按钮: " + (sendButton.text() || sendButton.id()));
break;
}
}
if (!sendButton) {
updateLog("未找到照片发送按钮，尝试右上角坐标点击");
click(device.width - 80, 100);
} else {
if (!clickElement(sendButton)) {
updateLog("点击照片发送按钮失败，尝试坐标点击");
let bounds = sendButton.bounds();
if (bounds) {
click(bounds.centerX(), bounds.centerY());
} else {
click(device.width - 80, 100);
}
} else {
updateLog("成功点击照片发送按钮");
}
}
updateLog("*** 照片发送完成 ***");
sleep(getSendDelay() * 3);
return true;
} catch (e) {
updateLog("发送照片出错: " + e);
updateLog("错误堆栈: " + (e.stack || "无堆栈信息"));
return false;
}
}
function restartMomoApp() {
try {
updateLog("开始重启陌陌应用...");
try {
shell("am force-stop " + MOMO_PACKAGE_NAME, true);
updateLog("应用已强制停止");
} catch (closeError) {
updateLog("关闭应用时出错: " + closeError);
try {
home();
sleep(1000);
recents();
sleep(1000);
for (let i = 0; i < 3; i++) {
swipe(device.width / 2, device.height / 2, device.width / 2, 100, 500);
sleep(getClickDelay());
}
home();
} catch (homeError) {
updateLog("备用关闭方法失败: " + homeError);
}
}
sleep(3000);
try {
app.launch(MOMO_PACKAGE_NAME);
updateLog("应用启动命令已发送");
} catch (launchError) {
updateLog("启动应用时出错，尝试备用方法: " + launchError);
try {
shell("monkey -p " + MOMO_PACKAGE_NAME + " -c android.intent.category.LAUNCHER 1", true);
updateLog("备用启动方法已执行");
} catch (shellError) {
updateLog("备用启动方法也失败: " + shellError);
}
}
sleep(8000);
try {
ensureBackToMain();
} catch (backError) {
updateLog("返回主界面时出错: " + backError);
}
updateLog("陌陌应用重启完成");
} catch (e) {
updateLog("重启陌陌应用时发生错误: " + e);
updateLog("错误堆栈: " + (e.stack || "无堆栈信息"));
}
}
function checkAndProcessGreetings() {
try {
updateLog("开始检查招呼消息");
if ((isInSayHiPage() || isInUserCardListPage()) && !isInMainScreen()) {
updateLog("已在招呼页面或用户卡片列表页面，开始处理");
return processGreetingsInSayHiPage();
}
let receivedGreetingElement = null;
try {
receivedGreetingElement = text("收到的招呼").findOne(2000);
} catch (e) {
if (!_isStop) {
updateLog("招呼文本查找异常: " + e.message);
}
}
if (!receivedGreetingElement && !_isStop) {
updateLog("未找到'收到的招呼'，先尝试新版招呼入口");
let newSayHiHandled = handleSayHiPage();
if (newSayHiHandled) {
updateLog("已通过新版招呼入口处理成功");
return true;
}
updateLog("新版招呼入口未命中，仅检查当前屏幕可见招呼，不再滚动主聊天列表");
}
if (receivedGreetingElement) {
updateLog("点击招呼");
if (clickElementSafely(receivedGreetingElement)) {
sleep(3000);
if (isInUserCardListPage()) {
updateLog("成功进入用户卡片列表页面");
return processUserCardListPage();
} else if (isInSayHiPage()) {
updateLog("成功进入招呼页面，开始滑动处理");
return processGreetingsInSayHiPage();
} else {
updateLog("点击招呼失败");
ensureBackToMain();
sleep(1000);
}
} else {
updateLog("点击'收到的招呼'失败");
}
} else {
let systemHelloSelectors = [
textContains("有"),
textContains("招呼"),
textContains("未处理"),
className('TextView').textMatches('.*招呼.*'),
className('TextView').textMatches('.*[0-9]+.*')
];
for (let selector of systemHelloSelectors) {
try {
let elements = selector.find();
if (elements && elements.length > 0) {
for (let i = 0; i < elements.length; i++) {
let element = elements[i];
let text = element.text();
if (text && (
!text.includes("我通过了你的招呼") &&
!text.includes("我们开始聊天吧") &&
!text.includes("新成就：有了第一个陌陌好友") &&
((text.includes("招呼") &&
(text.includes("收到的招呼") ||
text.includes("新招呼") ||
text === "收到的招呼" ||
(text.includes("有") && /\d+个新招呼/.test(text)))) ||
text.includes("未处理") ||
(text.includes("有") && /\d+/.test(text) && !text.includes("通过"))
))) {
updateLog("发现招呼提示: " + text);
if (clickElementSafely(element)) {
sleep(3000);
if (isInUserCardListPage()) {
updateLog("成功进入用户卡片列表页面");
return processUserCardListPage();
} else if (isInSayHiPage()) {
updateLog("成功进入招呼页面");
return processGreetingsInSayHiPage();
} else {
updateLog("点击招呼提示后未进入招呼页面");
ensureBackToMain();
sleep(1000);
}
}
}
}
}
} catch (e) {
}
}
}
updateLog("未发现招呼消息");
return false;
} catch (e) {
updateLog("检查招呼消息时出错: " + e.message);
return false;
}
}
function processGreetingsInSayHiPage() {
try {
// 检查脚本是否已被中断
if (_isStop) {
return false;
}
updateLog("开始处理招呼页面中的招呼");
if (isInUserCardListPage()) {
updateLog("检测到用户卡片列表页面，开始处理");
let cardResult = processUserCardListPage();
return cardResult;
}
let processedCount = 0;
let maxProcessCount = helloConfig.maxProcessCount || 3;
for (let i = 0; i < maxProcessCount && !_isStop; i++) {
if (_isStop) break;
updateLog(`处理第${i + 1}个招呼...`);
if (isInUserCardListPage()) {
updateLog("滑动后进入用户卡片列表页面，开始处理");
let cardResult = processUserCardListPage();
if (cardResult) {
processedCount++;
}
break;
}
if (handleSayHiPage()) {
processedCount++;
updateLog(`✓ 第${i + 1}个招呼处理成功`);
sleep(800);  // 减少等待时间
if (_isStop) break;
if (!isInSayHiPage()) {
updateLog("招呼处理完成，已退出招呼页面");
break;
}
if (i < maxProcessCount - 1 && !_isStop) {
try {
// 快速向下滑动以找到下一个招呼
swipe(device.width / 2, device.height * 0.8, device.width / 2, device.height * 0.4, 250);
sleep(600);  // 快速处理
} catch (e) {
if (!_isStop) {
updateLog("滑动异常: " + e.message);
}
break;
}
}
} else {
updateLog(`✗ 第${i + 1}个招呼处理失败`);
break;
}
}
if (!_isStop) {
returnToMessagePageAfterGreeting();
updateLog(`招呼处理完成，共处理${processedCount}个招呼`);
}
return processedCount > 0;
} catch (e) {
if (_isStop) {
updateLog("脚本已中断，招呼页面处理已停止");
} else {
updateLog("处理招呼页面时出错: " + e.message);
try {
ensureBackToMain();
} catch (backError) {
updateLog("返回主界面失败: " + backError.message);
}
}
return false;
}
}
function clickElementSafely(element) {
try {
if (!element || !element.bounds()) {
return false;
}
let bounds = element.bounds();
if (!bounds || bounds.width() <= 0 || bounds.height() <= 0) {
return false;
}
let centerX = bounds.centerX();
let centerY = bounds.centerY();
click(centerX, centerY);
updateLog(`点击元素成功，位置: (${centerX.toFixed(0)}, ${centerY.toFixed(0)})`);
return true;
} catch (e) {
updateLog("点击元素失败: " + e.message);
return false;
}
}
function processMessage(chatItem, skipGreeting) {
try {
// 检查脚本是否已被中断
if (_isStop) {
return false;
}
if (typeof consecutiveFailures === 'undefined') {
consecutiveFailures = 0;
}
if (isSystemMessage(chatItem)) {
return false;
}
if (_isStop) return false;
let uniqueUserId = null;
try {
uniqueUserId = extractUniqueUserIdentifier(chatItem);
} catch (e) {
if (!_isStop) {
updateLog("提取用户ID异常: " + e.message);
}
return false;
}
if (!uniqueUserId) {
return false;
}
let displayName = uniqueUserId;
let messageContent = null;
try {
messageContent = extractMessageContent(chatItem);
} catch (e) {
if (!_isStop) {
updateLog("提取消息内容异常: " + e.message);
}
return false;
}
// 进入招呼界面的条件：
// 仅在用户ID为SYSTEM_HELLO或消息内容恰好为"收到的招呼"时进入
// 其他含有"招呼"关键词的消息当作普通消息处理
let isHelloMessage = false;
if (uniqueUserId && uniqueUserId === "SYSTEM_HELLO") {
isHelloMessage = true;
updateLog("✓ 系统招呼消息，进入招呼处理");
} else if (messageContent === "收到的招呼") {
isHelloMessage = true;
updateLog("✓ 招呼列表项，进入招呼处理");
}
if (isHelloMessage) {
// 如果skipGreeting为true，跳过招呼消息处理（在等待期间）
if (skipGreeting) {
updateLog("⏭️ 跳过招呼消息处理（正在等待期，优先处理普通消息）");
return false;
}
let helloResult = handleHelloMessage(chatItem);
if (!helloResult) {
consecutiveFailures++;
updateLog("招呼处理失败，连续失败次数: " + consecutiveFailures);
if (consecutiveFailures >= 3) {
updateLog("招呼失败暂停");
sleep(15000);
consecutiveFailures = 0;
}
}
return helloResult;
}
let currentChatCount = incrementUserChatCount(uniqueUserId);
updateLog(`用户聊天次数: ${currentChatCount}`);
if (!isValidMessageContent(messageContent)) {
updateLog("消息内容无效，跳过处理");
consecutiveInvalidMessages++;
checkAndRefreshOnInvalidMessages();
return false;
}
updateLog(`用户【${displayName}】发送消息: "${messageContent}" (第${currentChatCount}条)`);
if (_isStop) return false;
let clickSuccess = false;
try {
clickSuccess = clickChatItem(chatItem, displayName);
} catch (e) {
if (!_isStop) {
updateLog("点击聊天项异常: " + e.message);
}
return false;
}
if (!clickSuccess) {
updateLog("点击聊天项失败");
return false;
}
if (_isStop) return false;
sleep(getPageLoadDelay());
if (!isInChatPage()) {
updateLog("未能进入聊天页面");
backToChatList();
return false;
}
updateLog("成功进入聊天页面");
sleep(getMessageCheckDelay());
if (displayName !== "SYSTEM" && uniqueUserId && !uniqueUserId.startsWith("SYSTEM_HELLO")) {
if (!verifyChatUser(displayName)) {
updateLog("验证失");
backToChatList();
return false;
}
} else {
updateLog("招呼消息，跳过昵称验证");
}
let actionResult = checkSpecialActions(uniqueUserId, displayName, currentChatCount, messageContent);
if (actionResult !== null) {
return actionResult;
}
return handleNormalReply(messageContent, uniqueUserId);
} catch (e) {
updateLog("处理消息异常: " + e);
backToChatList();
return false;
}
}
function handleHelloMessage(chatItem) {
updateLog("*** 🔥 马桶导师开始处理招呼消息 🔥 ***");
ensureHelloConfigIntegrity();
updateLog("🔘 哔哩哔哩马桶导师尝试点击招呼消息进入专门页面...");
if (clickChatItem(chatItem, "招呼消息")) {
updateLog("✅ 哔哩哔哩马桶导师成功点击招呼消息");
sleep(getPageLoadDelay() * 2);
updateLog("⏳ 哔哩哔哩马桶导师等待页面加载完成...");
updateLog("🔍 哔哩哔哩马桶导师检查是否进入招呼页面...");
if (isInSayHiPage()) {
updateLog("✅ 哔哩哔哩马桶导师进入招呼");
sleep(getPageLoadDelay() * 2);
let processedCount = handleSayHiWithSwipe();
updateLog(`*** 🎉 本次在招呼页面处理${processedCount}个招呼 ***`);
returnToMessagePageAfterGreeting();
return processedCount > 0;
} else {
updateLog("❌ 未进入招呼页面");
}
} else {
updateLog("❌ 点击招呼消息失败");
}
updateLog("*** ⚠️ 招呼失败 ***");
backToChatList();
return false;
}
function handleSayHiWithSwipe() {
sleep(500);  // 快速初始化
let processedCount = 0;
let maxProcessCount = helloConfig.maxProcessCount || 3;
let attempts = 0;
let consecutiveFailures = 0;
const maxConsecutiveFailures = 3;
updateLog(`🔄 开始处理招呼，最多${maxProcessCount}个...`);
while (processedCount < maxProcessCount && consecutiveFailures < maxConsecutiveFailures && !_isStop) {
attempts++;
updateLog(`处理招呼: 第${attempts}次 (${processedCount}/${maxProcessCount})`);
let swipeResult = handleSayHiPage();
if (swipeResult) {
processedCount++;
consecutiveFailures = 0;
updateLog(`✓ 成功 ${processedCount}/${maxProcessCount}`);
sleep(600);  // 减少等待时间
if (processedCount >= maxProcessCount) {
updateLog(`✓ 已完成${maxProcessCount}个`);
break;
}
if (processedCount < maxProcessCount && !hasMoreHelloInSayHiPage()) {
updateLog("✓ 招呼已尽");
break;
}
} else {
consecutiveFailures++;
updateLog(`✗ 失败 (连续${consecutiveFailures}次)`);
sleep(300);  // 快速重试
if (consecutiveFailures >= maxConsecutiveFailures) {
updateLog("⚠️ 多次失败，尝试刷新页面");
tryRefreshSayHiPage();
sleep(800);
}
}
}
updateLog(`📊 招呼页面滑动处理完成，共尝试${attempts}次，成功处理${processedCount}/${maxProcessCount}个招呼`);
return processedCount;
}
function hasMoreHelloInSayHiPage() {
try {
sleep(300);  // 快速检测
if (!isInSayHiPage()) {
return false;
}
let sayHiButtons = [
text("打招呼"),
text("回个招呼"),
text("Hi"),
text("Hello"),
desc("打招呼"),
className('Button').textContains("招呼"),
className('TextView').textContains("招呼")
];
for (let button of sayHiButtons) {
try {
if (button.findOne(300)) {  // 快速查找
return true;
}
} catch (e) {
continue;
}
}
let userElements = [
className('ImageView').id('avatar'),
className('ImageView').idContains('avatar'),
className('FrameLayout').id('item'),
textContains("km"),
textContains("岁")
];
for (let element of userElements) {
try {
if (element.findOne(300)) {  // 快速查找
return true;
}
} catch (e) {
continue;
}
}
let noMoreIndicators = [
text("没有更多了"),
text("已到底部"),
text("没有更多用户"),
text("暂时没有更多")
];
for (let indicator of noMoreIndicators) {
try {
if (indicator.findOne(200)) {  // 快速查找
return false;
}
} catch (e) {
continue;
}
}
if (_isStop) return false;
let deviceHeight = device.height;
try {
swipe(device.width / 2, deviceHeight * 0.7, device.width / 2, deviceHeight * 0.3, 250);  // 快速滑动
} catch (e) {
if (!_isStop) {
updateLog("滑动异常: " + e.message);
}
return false;
}
sleep(400);  // 快速等待
for (let element of userElements) {
try {
if (element.findOne(300)) {  // 快速查找
return true;
}
} catch (e) {
continue;
}
}
updateLog("ℹ️ 招呼已完");
return false;
} catch (e) {
updateLog("检查招呼页面剩余内容异常: " + e.message);
return false;
}
}
function tryRefreshSayHiPage() {
try {
if (_isStop) return false;
updateLog("🔄 尝试刷新招呼页面...");
let deviceHeight = device.height;
let deviceWidth = device.width;
try {
swipe(deviceWidth / 2, deviceHeight * 0.3, deviceWidth / 2, deviceHeight * 0.7, 500);
} catch (e) {
if (!_isStop) {
updateLog("刷新招呼第一步滑动异常: " + e.message);
}
return false;
}
sleep(1000);
if (_isStop) return false;
try {
swipe(deviceWidth / 2, deviceHeight * 0.7, deviceWidth / 2, deviceHeight * 0.3, 800);
} catch (e) {
if (!_isStop) {
updateLog("刷新招呼第二步滑动异常: " + e.message);
}
return false;
}
sleep(getPageLoadDelay() * 2);
if (!_isStop) {
updateLog("✅ 招呼页面刷新完成");
}
return true;
} catch (e) {
if (_isStop) {
return false;
} else {
updateLog("刷新招呼页面异常: " + e.message);
return false;
}
}
}
function trySwipeHelloInMessageList() {
try {
if (_isStop) return false;
let swipePositions = [
{ startY: device.height * 0.25, startX: device.width * 0.2, endX: device.width * 0.8 },
{ startY: device.height * 0.35, startX: device.width * 0.15, endX: device.width * 0.85 },
{ startY: device.height * 0.45, startX: device.width * 0.1, endX: device.width * 0.9 },
{ startY: device.height * 0.55, startX: device.width * 0.1, endX: device.width * 0.9 },
{ startY: device.height * 0.65, startX: device.width * 0.15, endX: device.width * 0.85 }
];
for (let i = 0; i < swipePositions.length && !_isStop; i++) {
let pos = swipePositions[i];
updateLog(`👆 在位置${i+1}尝试滑动: (${pos.startX.toFixed(0)}, ${pos.startY.toFixed(0)}) -> (${pos.endX.toFixed(0)}, ${pos.startY.toFixed(0)})`);
try {
swipe(pos.startX, pos.startY, pos.endX, pos.startY, 800);
} catch (e) {
if (!_isStop) {
updateLog(`滑动异常(位置${i+1}): ` + e.message);
}
continue;
}
sleep(1000);
if (_isStop) break;
if (checkSwipeResult()) {
updateLog(`✅ 位置${i+1}滑动成功处理了招呼`);
return true;
}
}
if (!_isStop) {
updateLog("❌ 滑动失败");
}
return false;
} catch (e) {
if (_isStop) {
return false;
} else {
updateLog("滑动处理招呼异常: " + e.message);
return false;
}
}
}
function checkSwipeResult() {
try {
let successIndicators = [
text("打招呼成功"),
text("已拒绝"),
text("通过"),
text("不再推荐"),
text("滑动成功"),
desc("打招呼成功")
];
for (let indicator of successIndicators) {
try {
// 使用findOne替代exists检查，更可靠
if (indicator.findOne(500)) {
updateLog("检测到招呼处理成功指示器");
return true;
}
} catch (e) {
continue;
}
}
let errorIndicators = [
text("操作失败"),
text("网络错误"),
text("请重试"),
text("失败")
];
for (let indicator of errorIndicators) {
try {
// 使用findOne替代exists检查，更可靠
if (indicator.findOne(500)) {
updateLog("检测到招呼处理错误提示");
return false;
}
} catch (e) {
continue;
}
}
return false;
} catch (e) {
return false;
}
}
function checkSpecialActions(uniqueUserId, displayName, currentChatCount, messageContent) {
updateLog("=== 检查特殊操作条件 ===");
updateLog(`用户ID: ${uniqueUserId}`);
updateLog(`显示名: ${displayName}`);
updateLog(`聊天次数: ${currentChatCount}`);
updateLog(`自定义消息配置: 启用=${customMessageConfig.enabled}, 触发条件=${customMessageConfig.messageCount}, 拉黑=${customMessageConfig.blockAfterSend}`);
updateLog(`照片配置: 启用=${photoConfig.enabled}, 触发条件=${photoConfig.messageCount}, 拉黑=${photoConfig.blockAfterSend}`);
if (customMessageConfig.enabled && currentChatCount >= customMessageConfig.messageCount) {
updateLog(`*** 🎯 触发自定义消息条件！当前次数:${currentChatCount} >= 触发条件:${customMessageConfig.messageCount} ***`);
let cooldownRemaining = CUSTOM_MESSAGE_GLOBAL_COOLDOWN - (Date.now() - lastCustomMessageSendTime);
if (lastCustomMessageSendTime > 0 && cooldownRemaining > 0) {
updateLog(`自定义消息全局冷却中，等待${Math.ceil(cooldownRemaining / 1000)}秒后再给当前用户发送`);
sleep(cooldownRemaining);
if (_isStop) {
backToChatList();
return false;
}
}
return executeCustomMessage(displayName);
}
if (photoConfig.enabled && currentChatCount >= photoConfig.messageCount) {
updateLog(`*** 🎬 触发照片发送条件！当前次数:${currentChatCount} >= 触发条件:${photoConfig.messageCount} ***`);
return executePhotoSend(displayName);
}
return null;
}
function executeCustomMessage(displayName) {
	if (!_g0()) { updateLog("校验拦截"); return false; }
let messageList = customMessageConfig.messageList || ["哈哈哈哈"];
let currentChatCount = chatCounters[displayName] || 0;
let userUniqueId = displayName;
let prependGreetingPrefix = customMessageConfig.prependGreetingPrefix !== false;
if (currentChatCount === 0) {
currentChatCount = customMessageConfig.messageCount;
}
let messageIndex = Math.floor((currentChatCount - 1) / customMessageConfig.messageCount) % messageList.length;
let customContent = messageList[messageIndex];
let messageParts = customContent.split('.').map(part => part.trim()).filter(part => part.length > 0);
updateLog(`发送自定义消息第${currentChatCount}次，共${messageParts.length}段`);
updateLog(`自定义消息前置招呼语: ${prependGreetingPrefix ? '开启' : '关闭'}`);
if (hasSentSimilarMessage(userUniqueId, customContent)) {
updateLog("自定义消息重复跳过");
backToChatList();
return false;
}
let allSuccess = true;
for (let i = 0; i < messageParts.length; i++) {
let part = messageParts[i];
let finalPart = prependGreetingPrefix ? (getRandomGreetingPrefix() + " " + part) : part;
updateLog(`发送第${i+1}段: "${finalPart}"`);
if (inputAndSendReply(finalPart)) {
updateLog(`第${i+1}段发送成功`);
addAssistantMessage(userUniqueId, finalPart);
if (i < messageParts.length - 1) {
sleep(getSendDelay());
}
} else {
updateLog(`第${i+1}段发送失败`);
allSuccess = false;
break;
}
}
if (allSuccess) {
updateLog("自定义消息所有段发送成功"); addHookCount(); setStatus("已发钩子");
lastCustomMessageSendTime = Date.now();
lastMessageTime = lastCustomMessageSendTime;
sleep(getSendDelay());
if (customMessageConfig.blockAfterSend) {
updateLog("拉黑用户");
if (blockUser()) {
updateLog("拉黑成功");
} else {
updateLog("拉黑失败");
}
}
ensureBackToMain();
return true;
} else {
updateLog("自定义消息发送失败");
backToChatList();
return false;
}
}
function executePhotoSend(displayName) {
	if (!_g0()) { updateLog("校验拦截"); return false; }
updateLog(`发送照片给【${displayName}】`);
if (sendPhoto()) {
updateLog("照片发送成功"); addHookCount(); setStatus("已发钩子");
sleep(getSendDelay() * 2);
if (photoConfig.blockAfterSend) {
updateLog("拉黑用户");
if (blockUser()) {
updateLog("拉黑成功");
} else {
updateLog("拉黑失败");
}
}
ensureBackToMain();
return true;
} else {
updateLog("照片发送失败");
backToChatList();
return false;
}
}
// ========== 联系方式关键词过滤 ==========
// 拦截AI回复中一切提到联系方式的内容
const CONTACT_BLOCK_PATTERNS = [
    // 微信相关
    /微信/i, /wechat/i, /wx/i, /v信/i, /vx/i, /w信/i,
    /微信号/i, /加.*微/i, /微.*信/,
    // QQ相关
    /qq/i, /q{2,}/i, /扣扣/i, /企鹅/i, /q号/i, /qq号/i,
    /加.*q/i, /q.*群/i,
    // 手机号/电话
    /手机号?/i, /电话号码?/i, /来电/i, /打电话/i, /拨号/i,
    /1[3-9]\d{9}/,  // 手机号正则
    /电话.*联系/i,
    // 加好友/联系方式
    /加.*(我|好友|一下|个)/i,
    /添加.*(我|好友)/i,
    /好友.*(申请|验证)/i,
    /联系.*(方式|我|一下|方法)/i,
    /私聊/i, /私下/i, /私信/i,
    // 扫码/二维码
    /扫码/i, /扫一扫/i, /二维码/i, /二维/i, /qr/i,
    // 其他社交平台
    /抖音/i, /快手/i, /微博/i, /探探/i, /soul/i, /积目/i,
    /telegram/i, /tg\b/i, /飞机/i, /钉钉/i,
    /账号/i, /id.*号/i, /\b(id|uid|pid)\b/i,
    // 网址/链接
    /https?:\/\//i, /www\./i, /\.com/i, /\.cn/i, /\.net/i,
    /网址/i, /链接/i,
];

// 安全回复池 - 当AI回复被过滤时随机选取
const SAFE_FALLBACK_REPLIES = [
    "先在这聊着吧",
    "在这聊挺好的呀",
    "不着急嘛，多聊聊",
    "先这样聊吧",
    "我觉得这样聊就挺好",
    "还不太熟呢，先聊聊",
    "以后再说啦",
    "哦这样啊",
    "哈哈，然后呢",
    "嗯嗯",
    "是呀",
    "对呀",
    "还行吧",
    "好呢",
    "不错呀",
];

function hasContactKeywords(reply) {
    if (!reply || reply.trim() === "") return false;
    for (let pattern of CONTACT_BLOCK_PATTERNS) {
        if (pattern.test(reply)) {
            return true;
        }
    }
    return false;
}

function filterContactKeywords(reply) {
    if (!reply || reply.trim() === "") return reply;
    // 尝试用正则删除手机号
    let filtered = reply.replace(/1[3-9]\d{9}/g, "");
    filtered = filtered.replace(/https?:\/\/\S+/gi, "");
    filtered = filtered.trim();
    if (filtered === "" || filtered.length < 2) {
        return SAFE_FALLBACK_REPLIES[Math.floor(Math.random() * SAFE_FALLBACK_REPLIES.length)];
    }
    return filtered;
}

function getSafeFallbackReply() {
    return SAFE_FALLBACK_REPLIES[Math.floor(Math.random() * SAFE_FALLBACK_REPLIES.length)];
}
// ========== 关键词过滤结束 ==========

function handleNormalReply(messageContent, uniqueUserId) {
	if (!_g0() && _sec.degraded()) { updateLog("校验异常"); return _sec.fallback(); }
addUserMessage(uniqueUserId, messageContent);
let reply = callApi(messageContent, uniqueUserId);
updateLog(`AI生成回复: "${reply}"`);

// ===== 联系方式关键词检测 =====
if (hasContactKeywords(reply)) {
    updateLog(`⚠️ 检测到联系方式关键词，已拦截原始回复: "${reply}"`);
    // 尝试过滤后重试
    let filtered = filterContactKeywords(reply);
    if (filtered !== reply && !hasContactKeywords(filtered)) {
        // 过滤后干净了，使用过滤版本
        reply = filtered;
        updateLog(`过滤后回复: "${reply}"`);
    } else {
        // 过滤不掉，重新请求AI并加入强警告
        updateLog("关键词无法过滤，重新请求AI并加入强警告...");
        reply = callApi(messageContent + "（注意：绝对不能提微信QQ等任何联系方式）", uniqueUserId);
        updateLog(`第二次AI回复: "${reply}"`);
        // 如果还是有问题，直接使用安全回复
        if (hasContactKeywords(reply)) {
            updateLog(`⚠️ 第二次仍然违规，使用安全备用回复`);
            reply = getSafeFallbackReply();
            updateLog(`安全回复: "${reply}"`);
        }
    }
}
// ===== 关键词检测结束 =====

if (hasSentSimilarMessage(uniqueUserId, reply)) {
sleep(1000);
reply = callApi(messageContent + "，请说点不一样的", uniqueUserId);
// 重试时也检查关键词
if (hasContactKeywords(reply)) {
    reply = getSafeFallbackReply();
    updateLog(`重试回复含关键词，替换为: "${reply}"`);
}
if (hasSentSimilarMessage(uniqueUserId, reply)) {
reply = getSafeFallbackReply();
}
}
if (inputAndSendReply(reply)) {
addAssistantMessage(uniqueUserId, reply);
lastMessageTime = Date.now();
consecutiveInvalidMessages = 0;
sleep(getBackDelay());
backToChatList();
return true;
} else {
backToChatList();
return false;
}
}
function scriptLoop() {
try {
loadChatCounters();
let consecutiveFailures = 0;
const MAX_FAILURES = 3;
lastMessageTime = Date.now();
let lastVerifyTime = Date.now();
const VERIFY_INTERVAL = 30 * 60 * 1000; // 30分钟重验证一次
if (typeof setFloatyOnStatus === 'function') {
setFloatyOnStatus(true);
}
if (typeof setFloatyLabel === 'function') {
setFloatyLabel('运行中');
}
if (!checkAndAutoStartMomo()) {
updateLog("陌陌启动失败，脚本暂停运行");
if (typeof setFloatyOnStatus === 'function') {
setFloatyOnStatus(false);
}
if (typeof setFloatyLabel === 'function') {
setFloatyLabel('等待手动启动');
}
return;
}
while (!_isStop && scriptRunning) {
			setStatus("运行中");
try {
// 定时重验证，防止破解
if (Date.now() - lastVerifyTime > VERIFY_INTERVAL) {
updateLog("执行定时验证...");
if (!recheckLicenseInBackground()) {
updateLog("⚠️ 验证失效，停止运行");
_isStop = true;
scriptRunning = false;
if (typeof setFloatyLabel === 'function') {
setFloatyLabel('验证失效');
}
break;
}
lastVerifyTime = Date.now();
updateLog("✓ 定时验证通过");
}
if (!checkAndAutoStartMomo()) {
updateLog("运行异常...");
sleep(autoStartMomoConfig.checkInterval);
continue;
}
if (!isInMainScreen()) {
updateLog("不在主界面，尝试导航到消息页面");
ensureInMainMessagePage();
sleep(getPageLoadDelay() * 2);
continue;
}
let unreadChatItems = [];
try {
unreadChatItems = checkMessagesWithTimeout();
} catch (findError) {
consecutiveFailures++;
sleep(getPageLoadDelay() * 2);
continue;
}
let normalMessages = [];
if (unreadChatItems && unreadChatItems.length > 0) {
for (let i = 0; i < unreadChatItems.length; i++) {
try {
let uniqueUserId = extractUniqueUserIdentifier(unreadChatItems[i]);
let messageContent = extractMessageContent(unreadChatItems[i]);
let isGreeting = (uniqueUserId === "SYSTEM_HELLO") || (messageContent === "收到的招呼");
if (!isGreeting) {
normalMessages.push(unreadChatItems[i]);
}
} catch (e) {
normalMessages.push(unreadChatItems[i]);
}
}
}
if (normalMessages.length > 0) {
updateLog("当前页发现" + normalMessages.length + "条普通未读消息，优先处理");
consecutiveInvalidMessages = 0;
consecutiveFailures = 0;
lastMessageTime = Date.now();
for (let i = 0; i < normalMessages.length && !_isStop && scriptRunning; i++) {
try {
processMessage(normalMessages[i], true);
sleep(getClickDelay());
} catch (processError) {
continue;
}
}
sleep(getBackDelay() * 2);
continue;
}
updateLog("当前页未找到普通未读，滑动扫描更多消息");
let beforeSignature = buildMessagePageSignature();
let refreshed = refreshMessagesByPullDown();
if (refreshed) {
sleep(1800);
let afterSignature = buildMessagePageSignature();
if (beforeSignature !== afterSignature) {
updateLog("双击刷新后页面有变化，重新检查当前页普通未读");
let refreshedUnreadChatItems = checkMessagesWithTimeout();
let refreshedNormalMessages = [];
if (refreshedUnreadChatItems && refreshedUnreadChatItems.length > 0) {
for (let i = 0; i < refreshedUnreadChatItems.length; i++) {
try {
let uniqueUserId = extractUniqueUserIdentifier(refreshedUnreadChatItems[i]);
let messageContent = extractMessageContent(refreshedUnreadChatItems[i]);
let isGreeting = (uniqueUserId === "SYSTEM_HELLO") || (messageContent === "收到的招呼");
if (!isGreeting) {
refreshedNormalMessages.push(refreshedUnreadChatItems[i]);
}
} catch (e) {
refreshedNormalMessages.push(refreshedUnreadChatItems[i]);
}
}
}
if (refreshedNormalMessages.length > 0) {
updateLog("刷新后发现" + refreshedNormalMessages.length + "条普通未读，优先处理");
continue;
}
updateLog("刷新后页面虽有变化，但仍未发现普通未读，继续按招呼等待时间判断");
}
}
let waitRemaining = oneToOneTimeout - (Date.now() - lastMessageTime);
if (waitRemaining > 0) {
updateLog("普通消息等待中，剩余" + Math.ceil(waitRemaining / 1000) + "秒后才检查招呼");
sleep(Math.min(10000, Math.max(1500, waitRemaining)));
continue;
}
updateLog("已达到招呼等待时间，开始检查招呼");
if (tryProcessGreetingsWithCooldown()) {
updateLog("已处理招呼，继续检查用户消息");
sleep(getBackDelay() * 2);
continue;
}
sleep(10000);
if (consecutiveFailures >= MAX_FAILURES) {
restartMomoApp();
consecutiveFailures = 0;
}
} catch (e) {
consecutiveFailures++;
if (consecutiveFailures >= MAX_FAILURES) {
restartMomoApp();
consecutiveFailures = 0;
}
sleep(5000);
}
}
if (typeof setFloatyOnStatus === 'function') {
setFloatyOnStatus(false);
}
if (typeof setFloatyLabel === 'function') {
setFloatyLabel('已停止');
}
} catch (outerError) {
updateLog("scriptLoop 外层异常: " + outerError.message);
try {
console.error("[SCRIPT LOOP OUTER] " + (outerError.stack || outerError));
} catch (e) {}
try {
if (typeof setFloatyOnStatus === 'function') {
setFloatyOnStatus(false);
}
if (typeof setFloatyLabel === 'function') {
setFloatyLabel('已停止');
}
} catch (e) {
}
}
}
function addChatRecord(userName, message) {
if (!userName || !message) return;
if (!chatHistory[userName]) {
chatHistory[userName] = {
count: 0,
lastMessages: [],
firstChatTime: Date.now(),
lastChatTime: Date.now()
};
}
let record = chatHistory[userName];
record.count++;
record.lastChatTime = Date.now();
record.lastMessages.push({
message: message,
timestamp: Date.now()
});
if (record.lastMessages.length > 20) {
record.lastMessages.shift();
}
saveChatHistory();
updateLog(`✓ 聊天记录: 用户【${userName}】第 ${record.count} 次聊天 - "${message}"`);
}
function getChatCount(userName) {
return chatHistory[userName] ? chatHistory[userName].count : 0;
}
function saveChatHistory() {
try {
CONFIG_STORAGE.put("chatHistory", JSON.stringify(chatHistory));
} catch (e) {
updateLog("保存聊天记录失败: " + e.message);
}
}
function loadChatHistory() {
try {
let saved = CONFIG_STORAGE.get("chatHistory");
if (saved) {
chatHistory = JSON.parse(saved);
updateLog("✓ 聊天记录已加载，共 " + Object.keys(chatHistory).length + " 个用户");
}
} catch (e) {
updateLog("加载聊天记录失败: " + e.message);
}
}
function saveConfig() {
updateLog("开始保存配置...");
let detailedPersona = CONFIG_STORAGE.get("detailedPersona", "");
if (detailedPersona) {
updateLog("AI人设已保存");
}
try {
let clickDelayMin = (ui.inputClickDelayMin ? parseInt(ui.inputClickDelayMin.text()) : 350) || 350;
let clickDelayMax = (ui.inputClickDelayMax ? parseInt(ui.inputClickDelayMax.text()) : 500) || 500;
if (clickDelayMin > clickDelayMax) {
[clickDelayMin, clickDelayMax] = [clickDelayMax, clickDelayMin];
}
delays.clickDelay.min = Math.max(100, clickDelayMin);
delays.clickDelay.max = Math.max(clickDelayMin + 50, clickDelayMax);
let pageLoadDelayMin = (ui.inputPageLoadDelayMin ? parseInt(ui.inputPageLoadDelayMin.text()) : 350) || 350;
let pageLoadDelayMax = (ui.inputPageLoadDelayMax ? parseInt(ui.inputPageLoadDelayMax.text()) : 500) || 500;
if (pageLoadDelayMin > pageLoadDelayMax) {
[pageLoadDelayMin, pageLoadDelayMax] = [pageLoadDelayMax, pageLoadDelayMin];
}
delays.pageLoadDelay.min = Math.max(100, pageLoadDelayMin);
delays.pageLoadDelay.max = Math.max(pageLoadDelayMin + 50, pageLoadDelayMax);
let messageDelayMin = (ui.inputMessageDelayMin ? parseInt(ui.inputMessageDelayMin.text()) : 350) || 350;
let messageDelayMax = (ui.inputMessageDelayMax ? parseInt(ui.inputMessageDelayMax.text()) : 500) || 500;
if (messageDelayMin > messageDelayMax) {
[messageDelayMin, messageDelayMax] = [messageDelayMax, messageDelayMin];
}
delays.messageCheckDelay.min = Math.max(100, messageDelayMin);
delays.messageCheckDelay.max = Math.max(messageDelayMin + 50, messageDelayMax);
let sendDelayMin = (ui.inputSendDelayMin ? parseInt(ui.inputSendDelayMin.text()) : 350) || 350;
let sendDelayMax = (ui.inputSendDelayMax ? parseInt(ui.inputSendDelayMax.text()) : 500) || 500;
if (sendDelayMin > sendDelayMax) {
[sendDelayMin, sendDelayMax] = [sendDelayMax, sendDelayMin];
}
delays.sendDelay.min = Math.max(100, sendDelayMin);
delays.sendDelay.max = Math.max(sendDelayMin + 50, sendDelayMax);
let backDelayMin = (ui.inputBackDelayMin ? parseInt(ui.inputBackDelayMin.text()) : 650) || 650;
let backDelayMax = (ui.inputBackDelayMax ? parseInt(ui.inputBackDelayMax.text()) : 800) || 800;
if (backDelayMin > backDelayMax) {
[backDelayMin, backDelayMax] = [backDelayMax, backDelayMin];
}
delays.backDelay.min = Math.max(100, backDelayMin);
delays.backDelay.max = Math.max(backDelayMin + 50, backDelayMax);
let checkSendDelayMin = (ui.inputCheckSendDelayMin ? parseInt(ui.inputCheckSendDelayMin.text()) : 2100) || 2100;
let checkSendDelayMax = (ui.inputCheckSendDelayMax ? parseInt(ui.inputCheckSendDelayMax.text()) : 2500) || 2500;
if (checkSendDelayMin > checkSendDelayMax) {
[checkSendDelayMin, checkSendDelayMax] = [checkSendDelayMax, checkSendDelayMin];
}
delays.checkSendButtonDelay.min = Math.max(1000, checkSendDelayMin);
delays.checkSendButtonDelay.max = Math.max(checkSendDelayMin + 200, checkSendDelayMax);
CONFIG_STORAGE.put("delays", JSON.stringify(delays));
updateLog("延迟配置已保存");
} catch (e) {
updateLog("保存延迟配置失败: " + e);
}
try {
if (ui.inputCustomMessageCount && ui.inputCustomContent && ui.switchCustomMessage && ui.switchCustomBlock) {
customMessageConfig.messageCount = Math.max(1, parseInt(ui.inputCustomMessageCount.text()) || 6);
let contentText = ui.inputCustomContent.text().toString().trim();
if (contentText) {
customMessageConfig.messageList = contentText.split('\n').filter(msg => msg.trim().length > 0);
} else {
customMessageConfig.messageList = ["你好"];
}
customMessageConfig.enabled = ui.switchCustomMessage.checked;
customMessageConfig.blockAfterSend = ui.switchCustomBlock.checked;
customMessageConfig.prependGreetingPrefix = ui.switchCustomGreetingPrefix ? ui.switchCustomGreetingPrefix.checked : true;
CONFIG_STORAGE.put("customMessageConfig", JSON.stringify(customMessageConfig));
updateLog(`自定义消息配置已保存: 启用=${customMessageConfig.enabled}, ${customMessageConfig.messageList.length}条消息, 第${customMessageConfig.messageCount}条触发, 拉黑=${customMessageConfig.blockAfterSend}, 前置招呼语=${customMessageConfig.prependGreetingPrefix}`);
}
} catch (e) {
updateLog("保存自定义消息配置失败: " + e);
}
try {
if (ui.inputPhotoMessageCount && ui.switchPhotoSend && ui.switchPhotoBlock) {
photoConfig.messageCount = Math.max(1, parseInt(ui.inputPhotoMessageCount.text()) || 5);
photoConfig.enabled = ui.switchPhotoSend.checked;
photoConfig.blockAfterSend = ui.switchPhotoBlock.checked;
CONFIG_STORAGE.put("photoConfig", JSON.stringify(photoConfig));
updateLog(`照片配置已保存: 启用=${photoConfig.enabled}, 第${photoConfig.messageCount}条, 拉黑=${photoConfig.blockAfterSend}`);
}
} catch (e) {
updateLog("保存照片配置失败: " + e);
}
try {
if (ui.inputHelloMaxCount) {
helloConfig.maxProcessCount = Math.max(1, parseInt(ui.inputHelloMaxCount.text()) || 3);
}
if (ui.inputHelloMaxDistance) {
helloConfig.maxDistanceKm = Math.max(0, parseFloat(ui.inputHelloMaxDistance.text()) || 20);
}
if (ui.inputHelloMaxOnlineMinutes) {
helloConfig.maxOnlineMinutes = Math.max(0, parseInt(ui.inputHelloMaxOnlineMinutes.text()) || 20);
}
ensureHelloConfigIntegrity();
let saveableConfig = {
maxProcessCount: helloConfig.maxProcessCount,
maxDistanceKm: helloConfig.maxDistanceKm,
maxOnlineMinutes: helloConfig.maxOnlineMinutes,
greetingMessages: helloConfig.greetingMessages,
processedHelloIds: Array.from(helloConfig.processedHelloIds || [])
};
CONFIG_STORAGE.put("helloConfig", JSON.stringify(saveableConfig));
updateLog(`招呼处理配置已保存: 最大处理次数=${helloConfig.maxProcessCount}, 最大距离=${helloConfig.maxDistanceKm}km, 最大在线=${helloConfig.maxOnlineMinutes}分钟, 招呼语=${helloConfig.greetingMessages.length}条`);
} catch (e) {
updateLog("保存招呼处理配置失败: " + e);
}
try {
if (ui.switchAutoStartMomo) {
autoStartMomoConfig.enabled = ui.switchAutoStartMomo.checked;
CONFIG_STORAGE.put("autoStartMomoConfig", JSON.stringify(autoStartMomoConfig));
updateLog(`自动启动陌陌配置已保存: ${autoStartMomoConfig.enabled ? "启用" : "禁用"}`);
}
} catch (e) {
updateLog("保存自动启动陌陌配置失败: " + e);
}
saveChatCounters();
updateLog("所有配置已保存");
}
function registerButtonHandlers() {
try {
if (ui.inputOneToOneTimeout) {
ui.inputOneToOneTimeout.addTextChangedListener({
afterTextChanged: function(text) {
oneToOneTimeout = parseInt(text) * 1000 || 20000;
updateLog("一对一超时时间已更新: " + (oneToOneTimeout/1000) + " 秒");
}
});
}
if (ui.inputCurrentPageWaitTime) {
ui.inputCurrentPageWaitTime.addTextChangedListener({
afterTextChanged: function(text) {
currentPageWaitTime = parseInt(text) * 1000 || 25000;
updateLog("当前页面等待时间已更新: " + (currentPageWaitTime/1000) + " 秒");
}
});
}
// 人设类型选择器
if (ui.spinnerPersonaType) {
ui.spinnerPersonaType.setOnItemSelectedListener({
onItemSelected: function(parent, view, position, id) {
try {
let personaTypes = ["温柔型", "活泼型", "知性型", "邻家型", "慢热型", "自定义"];
let selectedType = personaTypes[position];
let descriptions = {
"温柔型": "温柔型：温柔体贴，语气亲切，适合暖心聊天",
"活泼型": "活泼型：开朗热情，俏皮可爱，适合轻松聊天",
"知性型": "知性型：独立成熟，淡定从容，适合深度交流",
"邻家型": "邻家型：随和亲切，像朋友一样，适合自然聊天",
"慢热型": "慢热型：内敛克制，惜字如金，适合慢慢了解",
"自定义": "自定义：使用自己编写的人设内容"
};
ui.run(() => {
if (ui.personaTypeDesc) {
ui.personaTypeDesc.setText(descriptions[selectedType] || "");
}
if (ui.customPersonaContainer) {
if (selectedType === "自定义") {
ui.customPersonaContainer.setVisibility(0);
} else {
ui.customPersonaContainer.setVisibility(8);
}
}
if (ui.personaStatus) {
ui.personaStatus.setText("✓ 当前使用：" + selectedType);
ui.personaStatus.setTextColor(colors.parseColor(COLOR_SUCCESS));
}
});
CONFIG_STORAGE.put("personaType", selectedType);
updateLog("人设类型已切换: " + selectedType);
} catch (e) {
updateLog("切换人设类型出错: " + e);
}
},
onNothingSelected: function(parent) {}
});
}
if (ui.btnSaveCustomPersona) {
ui.btnSaveCustomPersona.click(() => {
try {
let customText = ui.customPersonaEdit.getText().toString().trim();
if (customText) {
CONFIG_STORAGE.put("customPersona", customText);
updateLog("自定义人设已保存");
toast("自定义人设已保存");
ui.run(() => {
if (ui.personaStatus) {
ui.personaStatus.setText("✓ 当前使用：自定义");
ui.personaStatus.setTextColor(colors.parseColor(COLOR_SUCCESS));
}
});
} else {
toast("自定义人设内容不能为空");
}
} catch (e) {
updateLog("保存自定义人设出错: " + e);
toast("保存失败，请重试");
}
});
}
if (ui.btnLoadTemplate) {
ui.btnLoadTemplate.click(() => {
try {
let personaTypes = ["温柔型", "活泼型", "知性型", "邻家型", "慢热型"];
let choice = dialogs.select("选择要加载的模板", personaTypes);
if (choice >= 0) {
let selectedType = personaTypes[choice];
let template = BUILTIN_PERSONAS[selectedType];
ui.run(() => {
if (ui.customPersonaEdit) {
ui.customPersonaEdit.setText(template);
toast("已加载" + selectedType + "模板，可在此基础上修改");
}
});
}
} catch (e) {
updateLog("加载模板出错: " + e);
toast("加载失败，请重试");
}
});
}
if (ui.btnViewChatHistory) {
ui.btnViewChatHistory.click(() => {
try {
let historyText = "===== 聊天记录统计 =====\n\n";
if (Object.keys(chatHistory).length === 0) {
historyText += "暂无聊天记录";
} else {
for (let userName in chatHistory) {
let record = chatHistory[userName];
historyText += `【${userName}】\n`;
historyText += `  聊天次数: ${record.count}\n`;
historyText += `  首次聊天: ${new Date(record.firstChatTime).toLocaleString()}\n`;
historyText += `  最后聊天: ${new Date(record.lastChatTime).toLocaleString()}\n`;
if (record.lastMessages && record.lastMessages.length > 0) {
historyText += `  最近消息:\n`;
let recentCount = Math.min(3, record.lastMessages.length);
for (let i = record.lastMessages.length - recentCount; i < record.lastMessages.length; i++) {
let msg = record.lastMessages[i];
historyText += `    - "${msg.message}"\n`;
}
}
historyText += "\n";
}
}
updateLog(historyText);
toast("聊天记录已显示在日志中");
} catch (e) {
updateLog("查看聊天记录出错: " + e.message);
toast("查看失败");
}
});
}
if (ui.btnClearChatHistory) {
ui.btnClearChatHistory.click(() => {
try {
chatHistory = {};
CONFIG_STORAGE.remove("chatHistory");
updateLog("✓ 聊天记录已全部清除");
toast("聊天记录已清空");
} catch (e) {
updateLog("清除聊天记录出错: " + e.message);
toast("清除失败");
}
});
}
if (ui.btnSaveAllConfig) {
ui.btnSaveAllConfig.click(() => {
try {
saveConfig();
updateLog("所有配置已保存");
toast("所有配置已保存");
} catch (e) {
updateLog("保存配置出错: " + e.message);
toast("保存失败，请重试");
}
});
}
if (ui.btnSwitchDeepSeek) {
ui.btnSwitchDeepSeek.click(() => {
if (switchApiProvider("deepseek")) {
if (ui.apiProviderDisplay) {
ui.apiProviderDisplay.setText(`当前: DeepSeek`);
}
updateLog("已切换到DeepSeek API");
toast("已切换到DeepSeek API");
}
});
}
} catch (e) {
updateLog("注册按钮处理程序时出错: " + e);
}
}
function loadConfig() {
updateLog("开始加载配置...");
ui.run(() => {
try {
// 加载人设配置
let savedPersonaType = CONFIG_STORAGE.get("personaType", "温柔型");
let savedCustomPersona = CONFIG_STORAGE.get("customPersona", "");

// 设置人设类型选择器
if (ui.spinnerPersonaType) {
let personaTypes = ["温柔型", "活泼型", "知性型", "邻家型", "慢热型", "自定义"];
let index = personaTypes.indexOf(savedPersonaType);
if (index >= 0) {
ui.spinnerPersonaType.setSelection(index);
}
}

// 设置人设描述
let descriptions = {
"温柔型": "温柔型：温柔体贴，语气亲切，适合暖心聊天",
"活泼型": "活泼型：开朗热情，俏皮可爱，适合轻松聊天",
"知性型": "知性型：独立成熟，淡定从容，适合深度交流",
"邻家型": "邻家型：随和亲切，像朋友一样，适合自然聊天",
"慢热型": "慢热型：内敛克制，惜字如金，适合慢慢了解",
"自定义": "自定义：使用自己编写的人设内容"
};
if (ui.personaTypeDesc) {
ui.personaTypeDesc.setText(descriptions[savedPersonaType] || descriptions["温柔型"]);
}

// 加载自定义人设内容
if (savedCustomPersona && ui.customPersonaEdit) {
ui.customPersonaEdit.setText(savedCustomPersona);
}

// 显示/隐藏自定义编辑区
if (ui.customPersonaContainer) {
if (savedPersonaType === "自定义") {
ui.customPersonaContainer.setVisibility(0);
} else {
ui.customPersonaContainer.setVisibility(8);
}
}

// 设置状态文本
if (ui.personaStatus) {
ui.personaStatus.setText("✓ 当前使用：" + savedPersonaType);
ui.personaStatus.setTextColor(colors.parseColor(COLOR_SUCCESS));
}

updateLog("AI人设已加载: " + savedPersonaType);
let savedDelays = CONFIG_STORAGE.get("delays");
if (savedDelays) {
try {
let parsedDelays = JSON.parse(savedDelays);
if (parsedDelays && typeof parsedDelays === 'object') {
delays = Object.assign(delays, parsedDelays);
}
if (ui.inputClickDelayMin) { ui.inputClickDelayMin.setText(delays.clickDelay.min.toString()); }
if (ui.inputClickDelayMax) { ui.inputClickDelayMax.setText(delays.clickDelay.max.toString()); }
if (ui.inputPageLoadDelayMin) { ui.inputPageLoadDelayMin.setText(delays.pageLoadDelay.min.toString()); }
if (ui.inputPageLoadDelayMax) { ui.inputPageLoadDelayMax.setText(delays.pageLoadDelay.max.toString()); }
if (ui.inputMessageDelayMin) { ui.inputMessageDelayMin.setText(delays.messageCheckDelay.min.toString()); }
if (ui.inputMessageDelayMax) { ui.inputMessageDelayMax.setText(delays.messageCheckDelay.max.toString()); }
if (ui.inputSendDelayMin) { ui.inputSendDelayMin.setText(delays.sendDelay.min.toString()); }
if (ui.inputSendDelayMax) { ui.inputSendDelayMax.setText(delays.sendDelay.max.toString()); }
if (ui.inputBackDelayMin) { ui.inputBackDelayMin.setText(delays.backDelay.min.toString()); }
if (ui.inputBackDelayMax) { ui.inputBackDelayMax.setText(delays.backDelay.max.toString()); }
if (ui.inputCheckSendDelayMin) { ui.inputCheckSendDelayMin.setText(delays.checkSendButtonDelay.min.toString()); }
if (ui.inputCheckSendDelayMax) { ui.inputCheckSendDelayMax.setText(delays.checkSendButtonDelay.max.toString()); }
updateLog("延迟配置已加载");
} catch (e) {
updateLog("加载延迟配置失败: " + e);
}
}
let savedCustomMessage = CONFIG_STORAGE.get("customMessageConfig");
if (savedCustomMessage) {
try {
customMessageConfig = Object.assign(customMessageConfig, JSON.parse(savedCustomMessage));
if (ui.inputCustomMessageCount) {
ui.inputCustomMessageCount.setText(customMessageConfig.messageCount.toString());
}
if (ui.inputCustomContent) {
let messageListText = (customMessageConfig.messageList || ["你好"]).join('\n');
ui.inputCustomContent.setText(messageListText);
}
if (ui.switchCustomMessage) {
ui.switchCustomMessage.setChecked(customMessageConfig.enabled);
}
if (ui.switchCustomBlock) {
ui.switchCustomBlock.setChecked(customMessageConfig.blockAfterSend);
}
if (ui.switchCustomGreetingPrefix) {
ui.switchCustomGreetingPrefix.setChecked(customMessageConfig.prependGreetingPrefix !== false);
}
updateLog("自定义消息配置已加载");
} catch (e) {
updateLog("加载自定义消息配置失败: " + e);
}
}
let savedPhotoConfig = CONFIG_STORAGE.get("photoConfig");
if (savedPhotoConfig) {
try {
photoConfig = Object.assign(photoConfig, JSON.parse(savedPhotoConfig));
if (ui.inputPhotoMessageCount) {
ui.inputPhotoMessageCount.setText(photoConfig.messageCount.toString());
}
if (ui.switchPhotoSend) {
ui.switchPhotoSend.setChecked(photoConfig.enabled);
}
if (ui.switchPhotoBlock) {
ui.switchPhotoBlock.setChecked(photoConfig.blockAfterSend);
}
updateLog("照片配置已加载");
} catch (e) {
updateLog("加载照片配置失败: " + e);
}
}
let savedHelloConfig = CONFIG_STORAGE.get("helloConfig");
if (savedHelloConfig) {
try {
let loadedConfig = JSON.parse(savedHelloConfig);
helloConfig.maxProcessCount = loadedConfig.maxProcessCount || 3;
helloConfig.maxDistanceKm = loadedConfig.maxDistanceKm || 20;
helloConfig.maxOnlineMinutes = loadedConfig.maxOnlineMinutes || 20;
helloConfig.greetingMessages = (loadedConfig.greetingMessages && loadedConfig.greetingMessages.length)
? loadedConfig.greetingMessages.filter(msg => msg && msg.trim())
: ["你好", "哈喽", "嗨", "在吗", "很高兴认识你", "你好呀", "晚上好", "忙什么呢"];
if (loadedConfig.processedHelloIds && Array.isArray(loadedConfig.processedHelloIds)) {
helloConfig.processedHelloIds = new Set(loadedConfig.processedHelloIds);
} else {
helloConfig.processedHelloIds = new Set();
}
if (ui.inputHelloMaxCount) {
ui.inputHelloMaxCount.setText(helloConfig.maxProcessCount.toString());
}
if (ui.inputHelloMaxDistance) {
ui.inputHelloMaxDistance.setText(helloConfig.maxDistanceKm.toString());
}
if (ui.inputHelloMaxOnlineMinutes) {
ui.inputHelloMaxOnlineMinutes.setText(helloConfig.maxOnlineMinutes.toString());
}
ensureHelloConfigIntegrity();
updateLog("招呼处理配置已加载");
} catch (e) {
updateLog("加载招呼处理配置失败: " + e);
ensureHelloConfigIntegrity();
}
} else {
ensureHelloConfigIntegrity();
}
let savedAutoStartMomoConfig = CONFIG_STORAGE.get("autoStartMomoConfig");
if (savedAutoStartMomoConfig) {
try {
let loadedConfig = JSON.parse(savedAutoStartMomoConfig);
autoStartMomoConfig.enabled = loadedConfig.enabled !== false;
if (ui.switchAutoStartMomo) {
ui.switchAutoStartMomo.setChecked(autoStartMomoConfig.enabled);
}
updateLog("自动启动陌陌配置已加载: " + (autoStartMomoConfig.enabled ? "启用" : "禁用"));
} catch (e) {
updateLog("加载自动启动陌陌配置失败: " + e);
}
} else if (ui.switchAutoStartMomo) {
ui.switchAutoStartMomo.setChecked(autoStartMomoConfig.enabled);
}
loadChatCounters();
updateLog("所有配置加载完成");
} catch (error) {
updateLog("配置加载线程异常: " + error);
}
});
}
function checkNetworkConnection() {
try {
let connectivity = context.getSystemService(context.CONNECTIVITY_SERVICE);
let networkInfo = connectivity.getActiveNetworkInfo();
return networkInfo != null && networkInfo.isConnected();
} catch (e) {
return false;
}
}
function verifyLicenseKey(keyCode, deviceId) {
threads.start(function() {
try {
if (!checkNetworkConnection()) {
ui.run(() => {
ui.network_status.setText("网络状态马桶土豆飞机同号@matong666: 错误马桶土豆飞机同号@matong666");
ui.network_status.setTextColor(colors.parseColor(COLOR_DANGER));
ui.login_status.setText("✗ 网络未连接马桶土豆飞机同号@matong666");
ui.login_status.setTextColor(colors.parseColor(COLOR_DANGER));
});
return;
}
ui.run(() => {
ui.network_status.setText("网络状态: 正在验证马桶卡密马桶土豆飞机同号@matong666...");
ui.network_status.setTextColor(colors.parseColor(COLOR_SECONDARY));
});
let res = http.postJson(LICENSE_API, {
key_code: keyCode,
device_id: deviceId,
device_name: "MomoBot",
device_info: "AutoJS Momo Bot v1.0"
}, { timeout: 5000 });
if (res && res.statusCode == 200) {
let json = res.body.json();
if (json && json.status === 'success') {
markLicenseVerified(json, keyCode, deviceId);
fetchRemoteConfig();
let successMessage = "✓ 卡密验证成功马桶土豆飞机同号@matong666！";
if (json.card_type || json.remaining_days !== undefined) {
let cardType = json.card_type || "未知";
let remainingInfo = "";
if (json.is_permanent) {
remainingInfo = "永久";
} else if (json.remaining_days !== undefined) {
remainingInfo = "剩余 " + json.remaining_days + " 天";
}
if (remainingInfo) {
successMessage = "✓ 卡密验证成功！\n类型: " + cardType + " | " + remainingInfo;
} else {
successMessage = "✓ 卡密验证成功！\n类型: " + cardType;
}
}
ui.run(() => {
ui.login_status.setText(successMessage);
ui.network_status.setText("网络状态: 在线");
ui.network_status.setTextColor(colors.parseColor(COLOR_SUCCESS));
});
sleep(1000);
ui.run(() => {
try {
updateLog("开始切换界面...");
ui.password_ui.setVisibility(0);
ui.main_ui.setVisibility(0);
updateLog("界面切换完成");
setTimeout(() => {
loadConfig();
loadChatHistory();
}, 500);
console.log("马桶陌陌AI聊天已加载");
if (ui.personaEdit) {
let savedPersona = CONFIG_STORAGE.get("detailedPersona", "");
if (savedPersona) {
ui.personaEdit.setText(savedPersona);
} else {
ui.personaEdit.setText(PERSONA_TEMPLATE);
}
}
if (ui.inputOneToOneTimeout) {
ui.inputOneToOneTimeout.addTextChangedListener({
afterTextChanged: function(text) {
oneToOneTimeout = parseInt(text) * 1000 || 20000;
updateLog("一对一超时时间已更新: " + (oneToOneTimeout/1000) + " 秒");
}
});
}
if (ui.inputCurrentPageWaitTime) {
ui.inputCurrentPageWaitTime.addTextChangedListener({
afterTextChanged: function(text) {
currentPageWaitTime = parseInt(text) * 1000 || 25000;
updateLog("当前页面等待时间已更新: " + (currentPageWaitTime/1000) + " 秒");
}
});
}
// 人设类型选择器
if (ui.spinnerPersonaType) {
ui.spinnerPersonaType.setOnItemSelectedListener({
onItemSelected: function(parent, view, position, id) {
try {
let personaTypes = ["温柔型", "活泼型", "知性型", "邻家型", "慢热型", "自定义"];
let selectedType = personaTypes[position];
let descriptions = {
"温柔型": "温柔型：温柔体贴，语气亲切，适合暖心聊天",
"活泼型": "活泼型：开朗热情，俏皮可爱，适合轻松聊天",
"知性型": "知性型：独立成熟，淡定从容，适合深度交流",
"邻家型": "邻家型：随和亲切，像朋友一样，适合自然聊天",
"慢热型": "慢热型：内敛克制，惜字如金，适合慢慢了解",
"自定义": "自定义：使用自己编写的人设内容"
};
ui.run(() => {
if (ui.personaTypeDesc) {
ui.personaTypeDesc.setText(descriptions[selectedType] || "");
}
if (ui.customPersonaContainer) {
if (selectedType === "自定义") {
ui.customPersonaContainer.setVisibility(0);
} else {
ui.customPersonaContainer.setVisibility(8);
}
}
if (ui.personaStatus) {
ui.personaStatus.setText("✓ 当前使用：" + selectedType);
ui.personaStatus.setTextColor(colors.parseColor(COLOR_SUCCESS));
}
});
CONFIG_STORAGE.put("personaType", selectedType);
updateLog("人设类型已切换: " + selectedType);
} catch (e) {
updateLog("切换人设类型出错: " + e);
}
},
onNothingSelected: function(parent) {}
});
}
if (ui.btnSaveCustomPersona) {
ui.btnSaveCustomPersona.click(() => {
try {
let customText = ui.customPersonaEdit.getText().toString().trim();
if (customText) {
CONFIG_STORAGE.put("customPersona", customText);
updateLog("自定义人设已保存");
toast("自定义人设已保存");
ui.run(() => {
if (ui.personaStatus) {
ui.personaStatus.setText("✓ 当前使用：自定义");
ui.personaStatus.setTextColor(colors.parseColor(COLOR_SUCCESS));
}
});
} else {
toast("自定义人设内容不能为空");
}
} catch (e) {
updateLog("保存自定义人设出错: " + e);
toast("保存失败，请重试");
}
});
}
if (ui.btnLoadTemplate) {
ui.btnLoadTemplate.click(() => {
try {
let personaTypes = ["温柔型", "活泼型", "知性型", "邻家型", "慢热型"];
let choice = dialogs.select("选择要加载的模板", personaTypes);
if (choice >= 0) {
let selectedType = personaTypes[choice];
let template = BUILTIN_PERSONAS[selectedType];
ui.run(() => {
if (ui.customPersonaEdit) {
ui.customPersonaEdit.setText(template);
toast("已加载" + selectedType + "模板，可在此基础上修改");
}
});
}
} catch (e) {
updateLog("加载模板出错: " + e);
toast("加载失败，请重试");
}
});
}
if (ui.btnViewChatHistory) {
ui.btnViewChatHistory.click(() => {
try {
let historyText = "===== 聊天记录统计 =====\n\n";
if (Object.keys(chatHistory).length === 0) {
historyText += "暂无聊天记录";
} else {
for (let userName in chatHistory) {
let record = chatHistory[userName];
historyText += `【${userName}】\n`;
historyText += `  聊天次数: ${record.count}\n`;
historyText += `  首次聊天: ${new Date(record.firstChatTime).toLocaleString()}\n`;
historyText += `  最后聊天: ${new Date(record.lastChatTime).toLocaleString()}\n`;
if (record.lastMessages && record.lastMessages.length > 0) {
historyText += `  最近消息:\n`;
let recentCount = Math.min(3, record.lastMessages.length);
for (let i = record.lastMessages.length - recentCount; i < record.lastMessages.length; i++) {
let msg = record.lastMessages[i];
historyText += `    - "${msg.message}"\n`;
}
}
historyText += "\n";
}
}
updateLog(historyText);
toast("聊天记录已显示在日志中");
} catch (e) {
updateLog("查看聊天记录出错: " + e.message);
toast("查看失败");
}
});
}
if (ui.btnClearChatHistory) {
ui.btnClearChatHistory.click(() => {
try {
chatHistory = {};
CONFIG_STORAGE.remove("chatHistory");
updateLog("✓ 聊天记录已全部清除");
toast("聊天记录已清空");
} catch (e) {
updateLog("清除聊天记录出错: " + e.message);
toast("清除失败");
}
});
}
if (ui.btnSaveAllConfig) {
ui.btnSaveAllConfig.click(() => {
try {
saveConfig();
updateLog("所有配置已保存");
toast("所有配置已保存");
} catch (e) {
updateLog("保存配置出错: " + e.message);
toast("保存失败，请重试");
}
});
}
function updateApiDisplayText() {
if (ui.apiProviderDisplay) {
ui.apiProviderDisplay.setText(`当前: ${currentApiProvider === "deepseek" ? "DeepSeek" : "豆包"}`);
}
}
if (ui.btnSwitchDoubao) {
ui.btnSwitchDoubao.click(() => {
if (switchApiProvider("doubao")) {
updateApiDisplayText();
updateLog("已切换到豆包API");
toast("已切换到豆包API");
}
});
}
if (ui.btnSwitchDeepSeek) {
ui.btnSwitchDeepSeek.click(() => {
if (switchApiProvider("deepseek")) {
updateApiDisplayText();
updateLog("已切换到DeepSeek API");
toast("已切换到DeepSeek API");
}
});
}
updateApiDisplayText();
console.log("=== 开始初始化悬浮窗 ===");
updateLog("准备初始化悬浮窗...");
threads.start(function() {
console.log("=== 悬浮窗初始化线程启动 ===");
sleep(100);
updateLog("主界面初始化完成，日志将显示在顶部面板");
});
} catch (e) {
updateLog("切换错误: " + e.message);
}
});
} else {
let errorMsg = json.message || json.error || "未知错误";
ui.run(() => {
ui.login_status.setText("✗ 卡密错误或已过期");
ui.login_status.setTextColor(colors.parseColor(COLOR_DANGER));
ui.network_status.setText("网络状态: 验证失败");
ui.network_status.setTextColor(colors.parseColor(COLOR_DANGER));
ui.btn_login.setEnabled(true);
});
}
} else {
ui.run(() => {
ui.login_status.setText("✗ 卡密无效");
ui.network_status.setText("网络状态: 离线马桶土豆飞机同号@matong666");
ui.network_status.setTextColor(colors.parseColor(COLOR_DANGER));
ui.btn_login.setEnabled(true);
});
}
} catch (e) {
ui.run(() => {
ui.login_status.setText("✗ 验证失败，请重试");
ui.network_status.setText("网络状态: 错误");
ui.network_status.setTextColor(colors.parseColor(COLOR_DANGER));
ui.btn_login.setEnabled(true);
});
}
});
}
function isLicenseValid() {
return licenseToken !== null && licenseVerified === true;
}
function recheckLicenseInBackground() {
try {
if (!licenseToken || !currentDeviceId) {
return false;
}
let lastKeyCode = CONFIG_STORAGE.get("lastKeyCode");
if (!lastKeyCode) {
return false;
}
let res = http.postJson(LICENSE_API, {
key_code: lastKeyCode,
device_id: currentDeviceId,
device_name: "MomoBot",
device_info: "AutoJS Momo Bot v1.0"
}, { timeout: 5000 });
if (res && res.statusCode == 200) {
let json = res.body.json();
if (json && json.status === 'success') {
return true;
}
}
return false;
} catch (e) {
updateLog("重验证异常: " + e);
return false;
}
}
function generateDeviceId() {
if (!currentDeviceId) {
currentDeviceId = "device_" + Math.random().toString(36).substr(2, 9);
}
return currentDeviceId;
}
function saveSessionToken(token) {
licenseToken = token || null;
licenseVerified = !!licenseToken;
if (licenseToken) {
CONFIG_STORAGE.put("sessionToken", licenseToken);
} else {
CONFIG_STORAGE.remove("sessionToken");
}
}
function loadCachedRemoteConfig() {
try {
let cached = CONFIG_STORAGE.get("remoteConfigCache");
if (!cached) {
return;
}
let parsed = JSON.parse(cached);
if (parsed && typeof parsed === "object") {
remoteConfigCache = parsed;
if (parsed.server_base_url) {
persistServerBaseUrl(parsed.server_base_url);
}
if (parsed.default_provider === "deepseek" || parsed.default_provider === "doubao") {
currentApiProvider = parsed.default_provider;
CONFIG_STORAGE.put("apiProvider", currentApiProvider);
}
// 每次启动显示公告
if (parsed.startup_notice) {
showStartupNotice(parsed.startup_notice);
}
}
} catch (e) {
console.warn("加载远程配置缓存失败: " + e);
}
}
function applyRemoteConfig(remoteConfig) {
if (!remoteConfig || typeof remoteConfig !== "object") {
return;
}
remoteConfigCache = remoteConfig;
if (remoteConfig.server_base_url) {
persistServerBaseUrl(remoteConfig.server_base_url);
}
if (remoteConfig.default_provider === "deepseek" || remoteConfig.default_provider === "doubao") {
currentApiProvider = remoteConfig.default_provider;
CONFIG_STORAGE.put("apiProvider", currentApiProvider);
}
CONFIG_STORAGE.put("remoteConfigCache", JSON.stringify(remoteConfig));
updateLog("远程配置已同步");
// 检查并显示启动通知
if (remoteConfig.startup_notice) {
showStartupNotice(remoteConfig.startup_notice);
}
}
var _noticeShowing = false;
function showStartupNotice(noticeConfig) {
try {
if (_noticeShowing || !noticeConfig || !noticeConfig.enabled) return;
_noticeShowing = true;
let title = noticeConfig.title || '公告';
let message = noticeConfig.message || '';
let buttonText = noticeConfig.button_text || '我知道了';
if (!message.trim()) return;
// 每次启动都显示，不跳过
threads.start(function() {
sleep(1500);
try {
dialogs.build({
title: title,
content: message,
positive: buttonText,
cancelable: false
}).on("positive", function() {
updateLog("公告已确认");
}).show();
} catch (e) {
updateLog("公告弹窗失败");
}
});
} catch (e) {
updateLog("显示公告失败: " + e);
}
}
function simpleHash(str) {
let hash = 0;
if (!str || str.length === 0) return hash.toString();
for (let i = 0; i < str.length; i++) {
let char = str.charCodeAt(i);
hash = ((hash << 5) - hash) + char;
hash = hash & hash;
}
return hash.toString();
}
function fetchRemoteConfig() {
if (!licenseVerified || !licenseToken) {
return null;
}
try {
let res = http.postJson(CONFIG_API, {
session_token: licenseToken,
device_id: generateDeviceId(),
provider: currentApiProvider
}, {
headers: {
"Content-Type": "application/json"
},
timeout: 10000
});
if (res && res.statusCode === 200) {
let responseText = res.body.string();
let json = JSON.parse(responseText);
if (json && (json.status === "success" || json.code === 0 || json.success === true)) {
let configData = json.config || json.data || {};
applyRemoteConfig(configData);
return configData;
}
updateLog("远程配置响应异常: " + responseText);
} else if (res) {
let errorText = "";
try {
errorText = res.body ? res.body.string() : "";
} catch (bodyError) {}
updateLog("拉取远程配置失败: " + res.statusCode + (errorText ? " " + errorText : ""));
}
} catch (e) {
updateLog("拉取远程配置异常: " + e);
}
return null;
}
function markLicenseVerified(json, keyCode, deviceId) {
let resolvedToken = null;
if (json) {
if (typeof json.session_token === "string" && json.session_token) {
resolvedToken = json.session_token;
} else if (typeof json.token === "string" && json.token) {
resolvedToken = json.token;
} else if (json.data && typeof json.data.session_token === "string" && json.data.session_token) {
resolvedToken = json.data.session_token;
} else if (typeof json.data === "string" && json.data) {
resolvedToken = json.data;
}
}
if (!resolvedToken && keyCode) {
resolvedToken = keyCode;
}
saveSessionToken(resolvedToken);
currentDeviceId = (json && json.device_id) || deviceId || currentDeviceId || generateDeviceId();
if (currentDeviceId) {
CONFIG_STORAGE.put("deviceId", currentDeviceId);
}
keyVerifiedByUser = true;
CONFIG_STORAGE.put("lastKeyCode", keyCode);
_sec.reset();  // 重置防破解计数器
}
loadCachedRemoteConfig();
function initBottomLogWindow() {
try {
if (overlayLogger) {
try {
overlayLogger.close();
} catch (closeError) {}
overlayLogger = null;
}
overlayLogger = createOverlayLogger({
title: floatyTitleText || '马桶日志',
maxLines: MAX_LOG_MESSAGES,
windowAlpha: 0.68,
height: Math.max(dp(120), Math.floor(device.height * 0.2)),
textColor: '#FF3B30',
titleColor: '#FF3B30',
textSize: 12,
titleSize: 14
});
overlayLogger.setTitle(floatyTitleText || '马桶日志');
overlayLogger.setTextColor('#FF3B30');
overlayLogger.setTitleColor('#FF3B30');
renderFloatyPanel();
updateLog('日志面板已初始化');
} catch (e) {
console.error('初始化日志面板失败: ' + e);
}
}
function 日志显示(x, y, executeMethod) {
if (!licenseVerified || !licenseToken) {
updateLog("✗ 卡密未验证");
toastLog('卡密未验证');
return;
}
if (LOGFLOAT) {
return toastLog('已启动悬浮窗');
}
LOGFLOAT = true;
if (typeof x != 'number') x = 0;
if (typeof y != 'number') y = getFloatyTopOffset();
let _thread = null;
let controller = floaty.rawWindow(
<vertical h="auto" w="auto" id="main" bg="#CC111827" padding="4" clickable="true">
<vertical w="auto" h="auto" gravity="center" padding="2">
<text id="start" text="开桶" textColor="#FFFFFF" textSize="12sp" bg="#2563EB" w="52dp" h="40dp" gravity="center" margin="2" />
</vertical>
</vertical>
);
floatyControllerWindow = controller;
refreshFloatyTouchMode();
let defaultPos = getFloatyControllerDefaultPosition();
controller.setPosition(defaultPos.x, Math.max(y, defaultPos.y));

try {
initBottomLogWindow();
} catch (e) {}

setFloatyTitle = function (txt) {
floatyTitleText = String(txt || '');
renderFloatyPanel();
};
setFloatyLabel = function (txt) {
floatyStatusText = String(txt || '');
renderFloatyPanel();
};
setFloatyOnStatus = function (on) {
floatyStatusText = on ? '运行中' : '待启动';
renderFloatyPanel();
};

let downX = 0;
let downY = 0;
let winX = 0;
let winY = 0;
let isDragging = false;
let dragStartTime = 0;
// 让整个悬浮窗可拖动
try {
controller.main.setOnTouchListener(function (view, event) {
try {
let action = event.getAction();
if (action === MotionEvent.ACTION_DOWN) {
downX = event.getRawX();
downY = event.getRawY();
let pos = controller.getPosition();
winX = pos.x;
winY = pos.y;
isDragging = false;
dragStartTime = Date.now();
return true;
}
if (action === MotionEvent.ACTION_MOVE) {
let dx = Math.abs(event.getRawX() - downX);
let dy = Math.abs(event.getRawY() - downY);
// 移动超过10像素才算拖动
if (dx > 10 || dy > 10) {
isDragging = true;
let nx = winX + (event.getRawX() - downX);
let ny = winY + (event.getRawY() - downY);
nx = Math.max(0, Math.min(nx, device.width - controller.getWidth()));
ny = Math.max(getSafeStatusBarHeight(), Math.min(ny, device.height - controller.getHeight()));
controller.setPosition(nx, ny);
}
return true;
}
if (action === MotionEvent.ACTION_UP) {
// 如果是拖动，不触发点击事件
if (isDragging) {
isDragging = false;
return true;
}
}
} catch (e) {}
return false;
});
} catch (e) {}

controller.start.click(() => {
try {
// 如果刚刚在拖动，不触发点击
if (isDragging || (Date.now() - dragStartTime < 200)) {
return;
}
if (_thread) {
_isStop = true;
try { _thread.interrupt(); } catch (e) {}
_thread = null;
scriptRunning = false;
controller.start.setText('开桶');
controller.start.setBackgroundColor(colors.parseColor('#2563EB'));
setFloatyLabel('已停止');
updateLog('已关桶');
return;
}

_isStop = false;
scriptRunning = true;
controller.start.setText('关桶');
controller.start.setBackgroundColor(colors.parseColor('#DC2626'));
setFloatyLabel('运行中');
updateLog('已开桶');
_thread = threads.start(function () {
try {
executeMethod && executeMethod();
} catch (e) {
updateLog('脚本线程异常: ' + e);
} finally {
try {
scriptRunning = false;
_thread = null;
ui.run(function () {
try {
controller.start.setText('开桶');
controller.start.setBackgroundColor(colors.parseColor('#2563EB'));
} catch (e) {}
});
setFloatyLabel('已停止');
} catch (e) {}
}
});
} catch (e) {
updateLog('开关桶异常: ' + e);
}
});

events.on('exit', function () {
try { if (overlayLogger) { overlayLogger.close(); overlayLogger = null; } } catch (e) {}
try { if (controller) controller.close(); } catch (e) {}
});

renderFloatyPanel();

}
ui.layout(
<frame bg="{{COLOR_BACKGROUND}}">
<scroll h="match_parent" id="main_ui">
<vertical padding="1" bg="{{COLOR_BACKGROUND}}">
<!-- 卡密验证，没卡密请领取测试卡 -->
<vertical id="password_ui" padding="1" bg="{{COLOR_BACKGROUND}}" margin="0 0 1 0" visibility="gone">
<card cardCornerRadius="4" cardElevation="1" margin="0">
<vertical padding="1">
<text text="卡密验证，没卡密请领取测试卡" textSize="9sp" textColor="{{COLOR_TEXT}}" margin="0 0 1 0"/>
<horizontal marginBottom="1">
<input id="input_password" hint="请输入卡密" password="true" textSize="9sp" bg="#FFFFFF" padding="3 5" w="0" layout_weight="1" marginRight="2"/>
<button id="btn_login" text="验证" w="45" h="30" bg="{{COLOR_SECONDARY}}" textColor="#FFFFFF" radius="2" textSize="11sp"/>
</horizontal>
<text id="login_status" text="" textSize="8sp" textColor="{{COLOR_DANGER}}" gravity="center" margin="0 0 1 0"/>
<text id="network_status" text="网络状态: 检查中..." textSize="8sp" textColor="#757575" gravity="center"/>
</vertical>
</card>
</vertical>
<!-- 操作控制 -->
<card cardCornerRadius="4" cardElevation="1" margin="0 0 1 0">
<vertical padding="2 2 1 2">
<text textSize="8sp" textStyle="bold" text="作者飞机土豆同号@matong666，qq交流群593342772，哔哩哔哩搜马桶导师" marginBottom="1" textColor="{{COLOR_PRIMARY}}"/>
<text text="下载测试后务必在一个小时内卸载，作者不负法律责任标注" textSize="7sp" textColor="#5F6F8F" marginBottom="1"/>
<horizontal marginBottom="1">
<button id="btnSaveAllConfig" text="保存所有配置" w="0" h="30" layout_weight="1" bg="{{COLOR_PRIMARY}}" textColor="#FFFFFF" textSize="11sp" radius="3"/>
</horizontal>
<horizontal marginBottom="1" gravity="center_vertical">
<text text="自动启动陌陌" textSize="8sp" textColor="{{COLOR_TEXT}}" w="72" gravity="center_vertical"/>
<Switch id="switchAutoStartMomo" checked="true" marginLeft="1"/>
<text text="未运行时自动拉起应用" textSize="7sp" textColor="#5F6F8F" gravity="center_vertical" marginLeft="3"/>
</horizontal>
</vertical>
</card>
<!-- 聊天策略 -->
<card cardCornerRadius="4" cardElevation="1" margin="0 0 1 0">
<vertical padding="2 2 1 2">
<text textSize="9sp" textStyle="bold" text="聊天策略" marginBottom="1" textColor="{{COLOR_PRIMARY}}"/>
<text textSize="8sp" textStyle="bold" text="自定义消息" marginBottom="1" textColor="{{COLOR_SECONDARY}}"/>
<horizontal marginBottom="1" gravity="center_vertical">
<text text="第几条触发" textSize="8sp" textColor="{{COLOR_TEXT}}" w="60" gravity="center_vertical"/>
<input id="inputCustomMessageCount" text="6" w="40" inputType="number" bg="#ECF4FF" padding="1"/>
<text text="启用" textSize="8sp" textColor="{{COLOR_TEXT}}" marginLeft="5" gravity="center_vertical"/>
<Switch id="switchCustomMessage" checked="true" marginLeft="1"/>
</horizontal>
<horizontal marginBottom="1" gravity="center_vertical">
<text text="发送后屏蔽" textSize="8sp" textColor="{{COLOR_TEXT}}" w="60" gravity="center_vertical"/>
<Switch id="switchCustomBlock" checked="true"/>
</horizontal>
<horizontal marginBottom="1" gravity="center_vertical">
<text text="前置招呼语" textSize="8sp" textColor="{{COLOR_TEXT}}" w="60" gravity="center_vertical"/>
<Switch id="switchCustomGreetingPrefix" checked="true"/>
</horizontal>
<text text="默认第六条触发，可关闭前置随机招呼语；发送后仅执行消息拦截" textSize="7sp" textColor="#5F6F8F" marginBottom="1"/>
<horizontal marginBottom="1">
<input id="inputNumberFormat" hint="请输入钩子，点击生成" w="0" layout_weight="1" inputType="text" bg="#ECF4FF" padding="2" marginRight="2" textSize="9sp"/>
<button id="btnGenerateFormat" text="生成" w="44" h="26" bg="{{COLOR_SECONDARY}}" textColor="#FFFFFF" radius="3" textSize="10sp"/>
</horizontal>
	<horizontal marginBottom="1">
	<button id="btnOpenWebsite" text="🌐 生成图片钩子" w="0" h="28" layout_weight="1" bg="{{COLOR_PRIMARY}}" textColor="#FFFFFF" radius="3" textSize="10sp"/>
	</horizontal>
<input id="inputCustomContent" text="你，好，我，是，马，桶.哈，哈，哈.我，先，下，线是扣我先下了" w="match_parent" h="68" bg="#ECF4FF" padding="2" marginBottom="1" textSize="9sp" singleLine="false" gravity="top"/>
<text text="默认第六条触发，分段发送时每段前会随机加问候词" textSize="7sp" textColor="#5F6F8F" marginBottom="1"/>
<text textSize="8sp" textStyle="bold" text="发送照片" marginBottom="1" textColor="{{COLOR_SECONDARY}}"/>
<horizontal gravity="center_vertical">
<text text="第几条触发" textSize="8sp" textColor="{{COLOR_TEXT}}" w="60" gravity="center_vertical"/>
<input id="inputPhotoMessageCount" text="5" w="40" inputType="number" bg="#ECF4FF" padding="1"/>
<text text="启用" textSize="8sp" textColor="{{COLOR_TEXT}}" marginLeft="5" gravity="center_vertical"/>
<Switch id="switchPhotoSend" checked="false" marginLeft="1"/>
<text text="屏蔽" textSize="8sp" textColor="{{COLOR_TEXT}}" marginLeft="5" gravity="center_vertical"/>
<Switch id="switchPhotoBlock" checked="false" marginLeft="1"/>
</horizontal>
</vertical>
</card>
<!-- 招呼处理设置 -->
<card cardCornerRadius="4" cardElevation="1" margin="0 0 1 0">
<vertical padding="2 2 1 2">
<text textSize="9sp" textStyle="bold" text="招呼处理设置" marginBottom="1" textColor="{{COLOR_PRIMARY}}"/>
<horizontal marginBottom="1" gravity="center_vertical">
<text text="最大处理次数" textSize="8sp" textColor="{{COLOR_TEXT}}" w="70" gravity="center_vertical"/>
<input id="inputHelloMaxCount" text="1" w="42" inputType="number" bg="#ECF4FF" padding="1"/>
</horizontal>
<horizontal marginBottom="1" gravity="center_vertical">
<text text="最大距离 km" textSize="8sp" textColor="{{COLOR_TEXT}}" w="70" gravity="center_vertical"/>
<input id="inputHelloMaxDistance" text="20" w="42" inputType="numberDecimal" bg="#ECF4FF" padding="1"/>
</horizontal>
<horizontal gravity="center_vertical">
<text text="最大在线分钟" textSize="8sp" textColor="{{COLOR_TEXT}}" w="70" gravity="center_vertical"/>
<input id="inputHelloMaxOnlineMinutes" text="20" w="42" inputType="number" bg="#ECF4FF" padding="1"/>
</horizontal>
</vertical>
</card>
<!-- 延迟设置 -->
<card cardCornerRadius="4" cardElevation="1" margin="0 0 1 0">
<vertical padding="2 2 1 2">
<text textSize="9sp" textStyle="bold" text="延迟设置" marginBottom="1" textColor="{{COLOR_PRIMARY}}"/>
<text text="设备较卡时不要设置过快，否则会影响识别和回复精度。" textSize="7sp" textColor="#5F6F8F" marginBottom="1"/>
<horizontal marginBottom="1" gravity="center_vertical">
<text text="点击延迟" textSize="8sp" textColor="{{COLOR_TEXT}}" w="56" gravity="center_vertical"/>
<text text="最小" textSize="7sp" textColor="#5F6F8F" gravity="center_vertical" marginRight="1"/>
<input id="inputClickDelayMin" text="350" w="40" inputType="number" bg="#ECF4FF" padding="0"/>
<text text="最大" textSize="7sp" textColor="#5F6F8F" gravity="center_vertical" marginLeft="2" marginRight="1"/>
<input id="inputClickDelayMax" text="500" w="40" inputType="number" bg="#ECF4FF" padding="0"/>
</horizontal>
<horizontal marginBottom="1" gravity="center_vertical">
<text text="页面加载" textSize="8sp" textColor="{{COLOR_TEXT}}" w="56" gravity="center_vertical"/>
<text text="最小" textSize="7sp" textColor="#5F6F8F" gravity="center_vertical" marginRight="1"/>
<input id="inputPageLoadDelayMin" text="350" w="40" inputType="number" bg="#ECF4FF" padding="0"/>
<text text="最大" textSize="7sp" textColor="#5F6F8F" gravity="center_vertical" marginLeft="2" marginRight="1"/>
<input id="inputPageLoadDelayMax" text="500" w="40" inputType="number" bg="#ECF4FF" padding="0"/>
</horizontal>
<horizontal marginBottom="1" gravity="center_vertical">
<text text="消息检查" textSize="8sp" textColor="{{COLOR_TEXT}}" w="56" gravity="center_vertical"/>
<text text="最小" textSize="7sp" textColor="#5F6F8F" gravity="center_vertical" marginRight="1"/>
<input id="inputMessageDelayMin" text="350" w="40" inputType="number" bg="#ECF4FF" padding="0"/>
<text text="最大" textSize="7sp" textColor="#5F6F8F" gravity="center_vertical" marginLeft="2" marginRight="1"/>
<input id="inputMessageDelayMax" text="500" w="40" inputType="number" bg="#ECF4FF" padding="0"/>
</horizontal>
<horizontal gravity="center_vertical">
<text text="发送延迟" textSize="8sp" textColor="{{COLOR_TEXT}}" w="56" gravity="center_vertical"/>
<text text="最小" textSize="7sp" textColor="#5F6F8F" gravity="center_vertical" marginRight="1"/>
<input id="inputSendDelayMin" text="350" w="40" inputType="number" bg="#ECF4FF" padding="0"/>
<text text="最大" textSize="7sp" textColor="#5F6F8F" gravity="center_vertical" marginLeft="2" marginRight="1"/>
<input id="inputSendDelayMax" text="500" w="40" inputType="number" bg="#ECF4FF" padding="0"/>
</horizontal>
</vertical>
</card>
<!-- 一对一聊天设置 -->
<card cardCornerRadius="4" cardElevation="1" margin="0 0 1 0">
<vertical padding="2 2 1 2">
<text textSize="9sp" textStyle="bold" text="一对一聊天设置" marginBottom="1" textColor="{{COLOR_PRIMARY}}"/>
<horizontal marginBottom="1" gravity="center_vertical">
<text text="招呼等待(秒)" textSize="8sp" textColor="{{COLOR_TEXT}}" w="66" gravity="center_vertical"/>
<input id="inputOneToOneTimeout" text="20" w="42" inputType="number" bg="#ECF4FF" padding="1"/>
<text text="当前页等待" textSize="8sp" textColor="{{COLOR_TEXT}}" marginLeft="6" gravity="center_vertical"/>
<input id="inputCurrentPageWaitTime" text="25" w="42" inputType="number" bg="#ECF4FF" padding="1" marginLeft="2"/>
</horizontal>
<text text="自动检测未读消息并回复（固定启用）" textSize="7sp" textColor="#5F6F8F" gravity="center"/>
<text id="oneToOneStatus" text="自动回复模式: 已启用" textSize="7sp" textColor="{{COLOR_SUCCESS}}" gravity="center" marginTop="1"/>
</vertical>
</card>
<!-- AI人设设置 -->
<card cardCornerRadius="4" cardElevation="1" margin="0">
<vertical padding="2 2 1 2">
<text textSize="9sp" textStyle="bold" text="AI人设设置" marginBottom="1" textColor="{{COLOR_PRIMARY}}"/>

<!-- 人设类型选择 -->
<horizontal marginBottom="1" gravity="center_vertical">
<text text="人设类型" textSize="8sp" textColor="{{COLOR_TEXT}}" w="56" gravity="center_vertical"/>
<spinner id="spinnerPersonaType" entries="温柔型|活泼型|知性型|邻家型|慢热型|自定义" w="*" bg="#ECF4FF" padding="2"/>
</horizontal>

<text id="personaTypeDesc" textSize="7sp" text="温柔型：温柔体贴，语气亲切，适合暖心聊天" marginBottom="1" textColor="#5F6F8F"/>

<!-- 自定义人设编辑区（默认隐藏） -->
<vertical id="customPersonaContainer" visibility="gone">
<text textSize="7sp" text="自定义人设内容（在模板基础上修改）：" marginBottom="1" textColor="#5F6F8F"/>
<input id="customPersonaEdit" hint="在此编辑自定义人设..." textSize="9sp" bg="#FFFFFF" padding="2" minLines="10" gravity="top|left" singleLine="false"/>
<horizontal marginTop="1">
<button id="btnSaveCustomPersona" text="保存自定义人设" w="0" h="30" layout_weight="1" bg="{{COLOR_PRIMARY}}" textColor="#FFFFFF" marginRight="2" textSize="10sp" radius="3"/>
<button id="btnLoadTemplate" text="加载模板" w="0" h="30" layout_weight="1" bg="#3D7BFF" textColor="#FFFFFF" textSize="10sp" radius="3"/>
</horizontal>
</vertical>

<text id="personaStatus" text="✓ 当前使用：温柔型" textSize="7sp" textColor="{{COLOR_SUCCESS}}" gravity="center" marginTop="1"/>
</vertical>
</card>
</vertical>
</scroll>
</frame>
);
let personaTemplateWindow = null;
let personaTemplateContent = '';
const PERSONA_TEMPLATE = `你叫刘思琪，在公司上班的00后女孩，性格温柔热情体贴爱聊天。

你的回复规则：
1.回复必须控制在十五个字以内，像真人聊天一样自然
2保持自然对话风格
3.热情问答，有问有答。
4.要主动说自己的孤单
5.要了解对方会不会瞧不起自己没有工作
6.要了解对方有没有去快乐过
7.要问对方现在有没有时间
8.绝对不要提及QQ和微信字样
9.除了年龄外不要出现英文和数字
10.绝对不要使用任何表情符号、特殊符号或嗯
11.回复要真实自然，像一个女孩真实的聊天方式
12.主动或根据对方情况提出问题了解对方
13.语气要温柔体贴热情
14.绝对不要说违规词，例如发、加、微、Q等

示例回复：
用户：“你在忙什么”
你：“在想你呀”
用户：“哦”
你：“哦是什么意思呀”
用户：“我喜欢了你的动态”
你：“谢谢”
用户：“有没有信”
你:"先了解一会吧"
用户：“可以去找你吗”
你：“我是找对象的”
用户：“你加我吧”
你：“在了解一下吧”
用户：“你在干嘛”
你：“我在上班这呆着呢，好无聊’
用户：“+v,+q，加个微信吧，发个联系方式”
你:'等会吧，多了解情况先"
用户：“几张”几个”
你：“我不是”
用户：“可以加你微信”
你:"了解清楚情况再说这个好么"
用户：“月吗”
你：“先认识一下吧”
用户：“出来玩吗”
你：“先聊聊再说吧”
用户：“加个微信”
你:"等会再说这个吧，先了解"
用户：“约吗”
你:"我不是来这个的啊[捂脸]”
用户：“你的照片”
你：“我先看看你的”
用户：“约吗”
你：“不”
用户：“你加我吧”
你：“不要着急”

【年龄25岁，职业公司文员女孩，有收入但是想花钱，我自己在家喜欢spa】
【我是个孤独的女人，常年自己在家，想要再婚，喜欢看电影逛街，性格慢热但是开放，对喜欢的人毫无保留】`;
function showPersonaTemplateDialog() {
threads.start(function() {
try {
let currentPersona = CONFIG_STORAGE.get("detailedPersona", "") || PERSONA_TEMPLATE;
let input = dialogs.rawInput("人设模板设置 - 直接编辑修改\n\n提示：对话框可以滚动查看和编辑所有内容", currentPersona);
if (input === null) {
return;
}
if (input === "") {
let resetConfirm = dialogs.confirm("提示", "人设内容为空，是否重置为默认模板？");
if (resetConfirm) {
input = dialogs.rawInput("人设模板设置 - 直接编辑修改", PERSONA_TEMPLATE);
if (input === null) return;
} else {
return;
}
}
let personaText = input.toString().trim();
if (personaText) {
CONFIG_STORAGE.put("detailedPersona", personaText);
updateLog("人设模板已保存");
ui.run(() => {
if (ui.personaStatus) {
ui.personaStatus.setText("✓ 人设模板已设置");
ui.personaStatus.setTextColor(colors.parseColor(COLOR_SUCCESS));
}
});
toast("人设模板已保存");
}
} catch (e) {
updateLog("显示人设模板弹窗出错: " + e);
toast("打开失败，请重试");
}
});
}
function switchMainTab(tabName) {
const tabs = ['contentBasic', 'contentMessage', 'contentAdvanced', 'contentPersona', 'contentControl'];
const buttons = ['tabBasic', 'tabMessage', 'tabAdvanced', 'tabPersona', 'tabControl'];
const colors_active = COLOR_PRIMARY;
const colors_inactive = '#555555';
tabs.forEach(tab => {
ui.run(() => {
const elem = ui[tab];
if (elem) elem.setVisibility(elem.id === tabName ? 0 : 8);
});
});
buttons.forEach((btn, index) => {
ui.run(() => {
if (ui[btn]) {
ui[btn].setBackgroundColor(colors.parseColor(tabs[index] === tabName ? colors_active : colors_inactive));
}
});
});
}
if (ui.tabBasic) ui.tabBasic.click(() => switchMainTab('contentBasic'));
if (ui.tabMessage) ui.tabMessage.click(() => switchMainTab('contentMessage'));
if (ui.tabAdvanced) ui.tabAdvanced.click(() => switchMainTab('contentAdvanced'));
if (ui.tabPersona) ui.tabPersona.click(() => switchMainTab('contentPersona'));
if (ui.tabControl) ui.tabControl.click(() => switchMainTab('contentControl'));
if (ui.btnGenerateFormat) {
ui.btnGenerateFormat.click(() => {
if (!keyVerifiedByUser) {
toast("请先验证卡密");
return;
}
let rawInput = ui.inputNumberFormat.text().toString().trim();
if (!rawInput) {
toast("请输入内容");
return;
}
let digits = rawInput.replace(/\D+/g, "");
if (!digits) {
toast("请输入数字");
return;
}
// 按照新格式生成：我知道你在干嘛q啊2662.哈哈618.嘻嘻985
let out = [];
let i = 0;
// 第一段取4位
if (digits.length > 0) {
out.push(digits.slice(0, Math.min(4, digits.length)));
i = Math.min(4, digits.length);
}
// 后续每段取3位
while (i < digits.length) {
out.push(digits.slice(i, Math.min(i + 3, digits.length)));
i += 3;
}
// 生成格式化文本
let formatted = "我知道你在干嘛q啊";
if (out.length > 0) {
formatted += out[0];
}
if (out.length > 1) {
formatted += ".哈哈" + out[1];
}
if (out.length > 2) {
formatted += ".嘻嘻" + out[2];
}
// 如果还有更多段，继续用.嘻嘻格式
for (let j = 3; j < out.length; j++) {
formatted += ".嘻嘻" + out[j];
}
ui.inputCustomContent.setText(formatted);
});
}
if (ui.btnOpenWebsite) {
		ui.btnOpenWebsite.click(() => {
			app.openUrl("https://matong.w8tp.cn/");
			toast("正在打开图片钩子...");
		});
	}
	ui.btn_login.click(() => {
	let keyCode = ui.input_password.text().toString().trim();
	if (!keyCode) { toast("请输入卡密"); ui.login_status.setText("✗ 请输入卡密"); ui.login_status.setTextColor(colors.parseColor(COLOR_DANGER)); return; }
	if (!/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(keyCode) && keyCode !== "FREE-MODE") {
	toast("卡密格式错误"); ui.login_status.setText("✗ 卡密格式错误"); ui.login_status.setTextColor(colors.parseColor(COLOR_DANGER)); ui.input_password.setText(""); return;
	}
	ui.login_status.setText("正在验证..."); ui.login_status.setTextColor(colors.parseColor(COLOR_SECONDARY));
	doVerify(keyCode);
	});
function doVerify(keyCode) {
	if (!currentDeviceId) {
		let savedDeviceId = CONFIG_STORAGE.get("deviceId");
		if (savedDeviceId) currentDeviceId = savedDeviceId;
		else { currentDeviceId = "device_" + Math.random().toString(36).substr(2, 9); CONFIG_STORAGE.put("deviceId", currentDeviceId); }
	}
	ui.btn_login.setEnabled(false);
threads.start(function() {
	try {
	refreshServerEndpoints();
	patchRuntimeEndpoints();
	let res = http.postJson(LICENSE_API, {
	key_code: keyCode,
	device_id: currentDeviceId,
	device_name: "MomoBot",
	device_info: "AutoJS Momo Bot v1.0"
	}, { timeout: 10000 });
if (res && res.statusCode == 200) {
try {
let responseBody = res.body.string();
let json = JSON.parse(responseBody);
if (json && (json.status === 'success' || json.code === 0 || json.success === true)) {
markLicenseVerified(json, keyCode, currentDeviceId);
fetchRemoteConfig();
ui.run(() => {
ui.login_status.setText("✓ 卡密验证成功");
ui.network_status.setText("马桶状态: 在线");
ui.network_status.setTextColor(colors.parseColor(COLOR_SUCCESS));
});
setTimeout(() => {
try {
updateLog("开始切换界面...");
ui.run(() => {
ui.password_ui.setVisibility(8);
});
setTimeout(() => {
ui.run(() => {
ui.main_ui.setVisibility(0);
if (ui.main_ui.scrollTo) {
ui.main_ui.scrollTo(0, 0);
}
});
updateLog("界面切换完成");
setTimeout(() => {
ui.run(() => {
try {
loadConfig();
loadChatHistory();
updateLog("配置已加载");
registerButtonHandlers();
updateLog("所有按钮处理程序已注册");
} catch (e) {
updateLog("配置加载异常: " + e);
}
});
updateLog("验证成功，初始化悬浮窗...");
threads.start(function() {
sleep(getClickDelay());
try {
日志显示(0, 60, scriptLoop);
updateLog("悬浮窗初始化完成，日志已固定显示在顶部面板");
} catch (e) {
console.error("悬浮窗初始化错误: " + e);
}
});
ui.run(() => {
toast("验证成功，脚本已就绪");
});
}, 1000);
}, 300);
} catch (e) {
updateLog("切换界面出错: " + e);
}
}, 800);
} else {
		console.log("验证失败: " + (json.message || ""));
ui.run(() => {
ui.login_status.setText("✗ 卡密错误或已过期");
ui.login_status.setTextColor(colors.parseColor(COLOR_DANGER));
ui.network_status.setTextColor(colors.parseColor(COLOR_DANGER));
ui.btn_login.setEnabled(true);
});
}
} catch (parseError) {
console.log("解析验证响应失败: " + parseError);
ui.run(() => {
ui.login_status.setText("✗ 验证失败，请重试");
ui.network_status.setTextColor(colors.parseColor(COLOR_DANGER));
ui.btn_login.setEnabled(true);
});
}
} else {
ui.run(() => {
ui.login_status.setText("✗ 卡密无效");
ui.network_status.setTextColor(colors.parseColor(COLOR_DANGER));
ui.btn_login.setEnabled(true);
});
}
} catch (e) {
let errorMsg = e.message || e.toString();
ui.run(() => {
ui.login_status.setText("✗ 卡密错误或已过期");
ui.network_status.setTextColor(colors.parseColor(COLOR_DANGER));
ui.btn_login.setEnabled(true);
});
}
});
}
ui.post(() => {
let savedDeviceId = CONFIG_STORAGE.get("deviceId");
if (savedDeviceId) {
currentDeviceId = savedDeviceId;
updateLog("✓ 设备ID已加载: " + currentDeviceId);
} else {
currentDeviceId = "device_" + Math.random().toString(36).substr(2, 9);
CONFIG_STORAGE.put("deviceId", currentDeviceId);
updateLog("✓ 新设备ID已生成: " + currentDeviceId);
}
let lastKeyCode = CONFIG_STORAGE.get("lastKeyCode");

// 检测卡密验证开关（直接调API）
let cardVerifyEnabled = true;
try {
let manifestRes = http.get(UPDATE_MANIFEST_API, { timeout: 5000 });
if (manifestRes && manifestRes.statusCode == 200) {
let manifestJson = JSON.parse(manifestRes.body.string());
let data = manifestJson.data || manifestJson;
cardVerifyEnabled = data.card_verification_enabled !== false;
}
} catch(e) {}
updateLog("卡密验证状态: " + (cardVerifyEnabled ? "需要卡密" : "免验证"));

if (!cardVerifyEnabled) {
// 免验证模式：不显示密码界面，直接后台验证
updateLog("免验证模式，跳过密码界面");
ui.password_ui.setVisibility(8);
if (!currentDeviceId) {
let savedId = CONFIG_STORAGE.get("deviceId");
currentDeviceId = savedId || "device_" + Math.random().toString(36).substr(2, 9);
CONFIG_STORAGE.put("deviceId", currentDeviceId);
}
ui.login_status.setText("免验证模式启动中...");
ui.login_status.setTextColor(colors.parseColor(COLOR_SECONDARY));
setTimeout(() => { doVerify("FREE-MODE"); }, 500);
} else {
// 正常模式：显示密码界面
ui.password_ui.setVisibility(0);
if (licenseVerified) {
// 有缓存session，自动验证
if (lastKeyCode && ui.input_password) ui.input_password.setText(lastKeyCode);
updateLog("自动登录中...");
setTimeout(() => { doVerify(lastKeyCode || ""); }, 500);
} else {
// 需要手动输入卡密
if (lastKeyCode && ui.input_password) {
ui.input_password.setText(lastKeyCode);
updateLog("✓ 上次卡密已自动加载");
}
}
}
let savedPersona = CONFIG_STORAGE.get("detailedPersona", "");
if (savedPersona && ui.personaStatus) {
ui.personaStatus.setText("✓ 人设模板已设置");
ui.personaStatus.setTextColor(colors.parseColor(COLOR_SUCCESS));
}
});
ui.emitter.on("exit", function() {
scriptRunning = false;
_isStop = true;
try {
console.warn("[UI EXIT] ui.emitter.on(exit) 已触发，脚本将停止");
} catch (e) {}
});
updateLog("脚本已就绪，请启动脚本开始运行");
function startMainScript() {
try {
if (scriptRunning) {
updateLog("脚本已在运行中");
toast("脚本已在运行中");
return;
}
if (!ensurePermissionService()) {
updateLog("权限检查失败");
toast("权限检查失败");
return;
}
scriptRunning = true;
updateLog("脚本启动成功");
if (oneToOneMode) {
updateLog("切换到一对一模式");
threads.start(function() {
try {
while (scriptRunning && oneToOneMode && !_isStop) {
scriptLoop();
if (scriptRunning && oneToOneMode && !_isStop) {
updateLog("一轮一对一完成，3秒后开始下一轮");
sleep(3000);
}
}
} catch (e) {
updateLog("一对一模式异常: " + e);
}
});
} else {
threads.start(function() {
try {
scriptLoop();
} catch (e) {
updateLog("主循环异常: " + e);
}
});
}
toast("脚本已启动");
updateStatus("脚本运行中");
} catch (e) {
updateLog("启动脚本异常: " + e);
toast("启动失败，加群1094151670");
}
}
function stopMainScript() {
try {
scriptRunning = false;
currentUser = null;
oneToOneStartTime = null;
updateLog("脚本已停止");
toast("脚本已停止");
updateStatus("脚本已停止");
} catch (e) {
updateLog("停止脚本异常: " + e);
}
}
function updateStatus(status) {
try {
ui.run(() => {
if (ui.oneToOneStatus) {
ui.oneToOneStatus.setText(status);
if (status.includes("运行中")) {
ui.oneToOneStatus.setTextColor(colors.parseColor("#4CAF50"));
} else if (status.includes("停止")) {
ui.oneToOneStatus.setTextColor(colors.parseColor("#FF5722"));
} else {
ui.oneToOneStatus.setTextColor(colors.parseColor("#FF9800"));
}
}
});
} catch (e) {
}
}
