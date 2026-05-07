/*
 * ReelShort VIP Unlocker v1.0
 * MITM Response Modifier for Surge / Shadowrocket / Loon / QX
 * 
 * Intercepts ReelShort API responses and modifies them to:
 * - Unlock all episodes/chapters (video, comic, novel, interactive)
 * - Spoof VIP subscription status
 * - Boost coin balance
 * - Remove ad requirements for unlock
 * 
 * Works with ReelShort v3.7.50+ (com.newleaf.app.ios.vic)
 */

const url = $request.url;
let body = $response.body;

try {
    let obj = JSON.parse(body);

    // === /book/getChapterList — Unlock all episodes ===
    if (url.includes("/book/getChapterList")) {
        obj = unlockChapterList(obj);
    }

    // === /book/getBookDetail or /book/getBookDetailV2 — Force free book ===
    else if (url.includes("/book/getBookDetail")) {
        obj = unlockBookDetail(obj);
    }

    // === /book/getPayMode or /book/getPayModeV2 — Force free pay mode ===
    else if (url.includes("/book/getPayMode")) {
        obj = forceFreePay(obj);
    }

    // === /store/getMyVip or /store/getMyVipV2 — Spoof VIP ===
    else if (url.includes("/store/getMyVip")) {
        obj = spoofVip(obj);
    }

    // === /store/getVipGoods — Modify VIP goods display ===
    else if (url.includes("/store/getVipGoods")) {
        obj = modifyVipGoods(obj);
    }

    // === /user/getUserInfo — Boost coins + VIP ===
    else if (url.includes("/user/getUserInfo")) {
        obj = spoofUserInfo(obj);
    }

    // === /book/requestAdvUnlock — Force ad unlock success ===
    else if (url.includes("/book/requestAdvUnlock")) {
        obj = forceAdvUnlock(obj);
    }

    // === /book/startPlay or /book/startRead — Allow playback ===
    else if (url.includes("/book/startPlay") || url.includes("/book/startRead")) {
        obj = forceStartPlay(obj);
    }

    // === /book/getChapterContent — Ensure content delivery ===
    else if (url.includes("/book/getChapterContent")) {
        obj = ensureChapterContent(obj);
    }

    // === /comic/reading/chapter_list — Unlock comic chapters ===
    else if (url.includes("/comic/reading/chapter_list")) {
        obj = unlockChapterList(obj);
    }

    // === /comic/reading/chapter_detail — Unlock comic chapter ===
    else if (url.includes("/comic/reading/chapter_detail")) {
        obj = unlockSingleChapter(obj);
    }

    // === /comic/reading/detail — Unlock comic book ===
    else if (url.includes("/comic/reading/detail")) {
        obj = unlockBookDetail(obj);
    }

    // === /novel/reading/chapter_list — Unlock novel chapters ===
    else if (url.includes("/novel/reading/chapter_list")) {
        obj = unlockChapterList(obj);
    }

    // === /novel/reading/chapter_detail — Unlock novel chapter ===
    else if (url.includes("/novel/reading/chapter_detail")) {
        obj = unlockSingleChapter(obj);
    }

    // === /novel/reading/detail — Unlock novel ===
    else if (url.includes("/novel/reading/detail")) {
        obj = unlockBookDetail(obj);
    }

    // === /interactiveBook/* — Unlock interactive books ===
    else if (url.includes("/interactiveBook/getChapterList")) {
        obj = unlockChapterList(obj);
    }
    else if (url.includes("/interactiveBook/getBookDetail")) {
        obj = unlockBookDetail(obj);
    }
    else if (url.includes("/interactiveBook/getChapterContent")) {
        obj = ensureChapterContent(obj);
    }

    // === /hall/* — Mark content as free on home pages ===
    else if (url.includes("/hall/")) {
        obj = unlockHallContent(obj);
    }

    // === /store/getStoreListV4 — Modify store display ===
    else if (url.includes("/store/getStoreList")) {
        // pass through, no critical modifications needed
    }

    // === /book/getExitRetain — Disable retention popups ===
    else if (url.includes("/book/getExitRetain")) {
        obj = disableRetainPopup(obj);
    }

    body = JSON.stringify(obj);
} catch (e) {
    // If JSON parse fails, pass through unchanged
    console.log("ReelShort Unlocker: Parse error on " + url + " — " + e.message);
}

$done({body});

// ==================== CORE FUNCTIONS ====================

function unlockChapterList(obj) {
    // Recursively find and unlock chapter arrays
    traverseAndUnlock(obj, [
        "chapterList", "chapter_list", "chapters", "list", 
        "data", "episodeList", "episode_list", "items"
    ]);
    return obj;
}

function unlockBookDetail(obj) {
    // Unlock the book itself
    let data = obj.data || obj;
    
    setNestedValue(data, "payMode", 0);
    setNestedValue(data, "pay_mode", 0);
    setNestedValue(data, "isPaid", false);
    setNestedValue(data, "is_paid", false);
    setNestedValue(data, "isFree", true);
    setNestedValue(data, "is_free", true);
    setNestedValue(data, "vipFree", true);
    setNestedValue(data, "vip_free", true);
    setNestedValue(data, "needPay", false);
    setNestedValue(data, "need_pay", false);
    setNestedValue(data, "freeNum", 99999);
    setNestedValue(data, "free_num", 99999);
    setNestedValue(data, "lockNum", 0);
    setNestedValue(data, "lock_num", 0);
    
    // Also unlock embedded chapter lists
    unlockChapterList(data);
    
    return obj;
}

function forceFreePay(obj) {
    let data = obj.data || obj;
    
    setNestedValue(data, "payMode", 0);
    setNestedValue(data, "pay_mode", 0);
    setNestedValue(data, "unlockType", 0);
    setNestedValue(data, "unlock_type", 0);
    setNestedValue(data, "needCoin", 0);
    setNestedValue(data, "need_coin", 0);
    setNestedValue(data, "coinCost", 0);
    setNestedValue(data, "coin_cost", 0);
    setNestedValue(data, "isFree", true);
    setNestedValue(data, "is_free", true);
    
    return obj;
}

function spoofVip(obj) {
    let data = obj.data || obj;
    
    // Set VIP as active with far-future expiry
    const futureExpiry = Math.floor(Date.now() / 1000) + (365 * 24 * 3600); // +1 year
    const futureExpiryMs = Date.now() + (365 * 24 * 3600 * 1000);
    
    setNestedValue(data, "isVip", true);
    setNestedValue(data, "is_vip", true);
    setNestedValue(data, "vipStatus", 1);
    setNestedValue(data, "vip_status", 1);
    setNestedValue(data, "vipType", 1);
    setNestedValue(data, "vip_type", 1);
    setNestedValue(data, "vipExpire", futureExpiry);
    setNestedValue(data, "vip_expire", futureExpiry);
    setNestedValue(data, "vipExpireTime", futureExpiryMs);
    setNestedValue(data, "vip_expire_time", futureExpiryMs);
    setNestedValue(data, "isSubscribed", true);
    setNestedValue(data, "is_subscribed", true);
    setNestedValue(data, "subscriptionStatus", 1);
    setNestedValue(data, "adFree", true);
    setNestedValue(data, "ad_free", true);
    setNestedValue(data, "isAdFree", true);
    setNestedValue(data, "noAd", true);
    setNestedValue(data, "isNoAd", true);
    
    // Handle VIP list/array structure
    if (data.vipList || data.vip_list || data.list) {
        let vipList = data.vipList || data.vip_list || data.list;
        if (Array.isArray(vipList)) {
            vipList.forEach(item => {
                if (item && typeof item === 'object') {
                    item.isVip = true;
                    item.is_vip = true;
                    item.status = 1;
                    item.vipStatus = 1;
                    item.expireTime = futureExpiryMs;
                    item.expire_time = futureExpiryMs;
                }
            });
        }
    }
    
    return obj;
}

function modifyVipGoods(obj) {
    // No critical changes, just pass through
    return obj;
}

function spoofUserInfo(obj) {
    let data = obj.data || obj;
    
    // Boost coin balance
    setNestedValue(data, "coinBalance", 999999);
    setNestedValue(data, "coin_balance", 999999);
    setNestedValue(data, "coins", 999999);
    setNestedValue(data, "totalCoin", 999999);
    setNestedValue(data, "total_coin", 999999);
    setNestedValue(data, "goldCoin", 999999);
    setNestedValue(data, "gold_coin", 999999);
    setNestedValue(data, "bonusCoin", 999999);
    setNestedValue(data, "bonus_coin", 999999);
    
    // VIP status
    const futureExpiry = Math.floor(Date.now() / 1000) + (365 * 24 * 3600);
    setNestedValue(data, "isVip", true);
    setNestedValue(data, "is_vip", true);
    setNestedValue(data, "vipStatus", 1);
    setNestedValue(data, "vip_status", 1);
    setNestedValue(data, "vipExpire", futureExpiry);
    setNestedValue(data, "vip_expire", futureExpiry);
    setNestedValue(data, "isSubscribed", true);
    setNestedValue(data, "adFree", true);
    setNestedValue(data, "isAdFree", true);
    
    return obj;
}

function forceAdvUnlock(obj) {
    let data = obj.data || obj;
    
    // Force the ad unlock to succeed
    if (obj.code !== undefined) obj.code = 0;
    if (obj.status !== undefined) obj.status = 0;
    setNestedValue(data, "success", true);
    setNestedValue(data, "isUnlocked", true);
    setNestedValue(data, "is_unlocked", true);
    setNestedValue(data, "unlocked", true);
    setNestedValue(data, "result", 1);
    
    return obj;
}

function forceStartPlay(obj) {
    let data = obj.data || obj;
    
    // Ensure play URL is delivered
    setNestedValue(data, "isLocked", false);
    setNestedValue(data, "is_locked", false);
    setNestedValue(data, "locked", false);
    setNestedValue(data, "isFree", true);
    setNestedValue(data, "is_free", true);
    setNestedValue(data, "needPay", false);
    setNestedValue(data, "need_pay", false);
    
    return obj;
}

function ensureChapterContent(obj) {
    let data = obj.data || obj;
    
    setNestedValue(data, "isLocked", false);
    setNestedValue(data, "is_locked", false);
    setNestedValue(data, "isFree", true);
    setNestedValue(data, "is_free", true);
    setNestedValue(data, "unlocked", true);
    setNestedValue(data, "isUnlocked", true);
    
    return obj;
}

function unlockSingleChapter(obj) {
    let data = obj.data || obj;
    unlockChapterObject(data);
    return obj;
}

function unlockHallContent(obj) {
    // Recursively traverse hall response to unlock any embedded book/chapter data
    deepTraverse(obj, function(key, value, parent) {
        if (key === "payMode" || key === "pay_mode") parent[key] = 0;
        if (key === "isPaid" || key === "is_paid") parent[key] = false;
        if (key === "isFree" || key === "is_free") parent[key] = true;
        if (key === "isLocked" || key === "is_locked") parent[key] = false;
        if (key === "locked") parent[key] = false;
        if (key === "vipFree" || key === "vip_free") parent[key] = true;
        if (key === "freeNum" || key === "free_num") parent[key] = 99999;
        if (key === "lockNum" || key === "lock_num") parent[key] = 0;
    });
    return obj;
}

function disableRetainPopup(obj) {
    let data = obj.data || obj;
    setNestedValue(data, "show", false);
    setNestedValue(data, "isShow", false);
    setNestedValue(data, "shouldShow", false);
    return obj;
}

// ==================== UTILITY FUNCTIONS ====================

function unlockChapterObject(chapter) {
    if (!chapter || typeof chapter !== 'object') return;
    
    // Core unlock flags
    if (chapter.isFree !== undefined) chapter.isFree = true;
    if (chapter.is_free !== undefined) chapter.is_free = true;
    chapter.isFree = true;
    chapter.is_free = true;
    
    if (chapter.isLocked !== undefined) chapter.isLocked = false;
    if (chapter.is_locked !== undefined) chapter.is_locked = false;
    chapter.isLocked = false;
    chapter.is_locked = false;
    
    if (chapter.locked !== undefined) chapter.locked = false;
    
    if (chapter.isPaid !== undefined) chapter.isPaid = false;
    if (chapter.is_paid !== undefined) chapter.is_paid = false;
    
    if (chapter.isUnlocked !== undefined) chapter.isUnlocked = true;
    if (chapter.is_unlocked !== undefined) chapter.is_unlocked = true;
    chapter.isUnlocked = true;
    
    if (chapter.unlocked !== undefined) chapter.unlocked = true;
    
    if (chapter.vipFree !== undefined) chapter.vipFree = true;
    if (chapter.vip_free !== undefined) chapter.vip_free = true;
    chapter.vipFree = true;
    chapter.vip_free = true;
    
    // Pay/cost related
    if (chapter.payMode !== undefined) chapter.payMode = 0;
    if (chapter.pay_mode !== undefined) chapter.pay_mode = 0;
    chapter.payMode = 0;
    
    if (chapter.needPay !== undefined) chapter.needPay = false;
    if (chapter.need_pay !== undefined) chapter.need_pay = false;
    
    if (chapter.needCoin !== undefined) chapter.needCoin = 0;
    if (chapter.need_coin !== undefined) chapter.need_coin = 0;
    
    if (chapter.coinCost !== undefined) chapter.coinCost = 0;
    if (chapter.coin_cost !== undefined) chapter.coin_cost = 0;
    
    if (chapter.unlockCost !== undefined) chapter.unlockCost = 0;
    if (chapter.unlock_cost !== undefined) chapter.unlock_cost = 0;
    
    // Unlock method — 0 = free
    if (chapter.unlockMethod !== undefined) chapter.unlockMethod = 0;
    if (chapter.unlock_method !== undefined) chapter.unlock_method = 0;
    
    if (chapter.unlockType !== undefined) chapter.unlockType = 0;
    if (chapter.unlock_type !== undefined) chapter.unlock_type = 0;
    
    // Ad-free
    if (chapter.adFree !== undefined) chapter.adFree = true;
    if (chapter.ad_free !== undefined) chapter.ad_free = true;
    
    if (chapter.needAd !== undefined) chapter.needAd = false;
    if (chapter.need_ad !== undefined) chapter.need_ad = false;
    
    // Wait-free
    if (chapter.isWaitFree !== undefined) chapter.isWaitFree = false;
    if (chapter.is_wait_free !== undefined) chapter.is_wait_free = false;
    if (chapter.waitFree !== undefined) chapter.waitFree = false;
    
    // Sneak peek
    if (chapter.isSneakPeek !== undefined) chapter.isSneakPeek = false;
    if (chapter.is_sneak_peek !== undefined) chapter.is_sneak_peek = false;
}

function traverseAndUnlock(obj, listKeys) {
    if (!obj || typeof obj !== 'object') return;
    
    // Check if current object has any of the list keys
    for (let key of listKeys) {
        if (obj[key] && Array.isArray(obj[key])) {
            obj[key].forEach(chapter => unlockChapterObject(chapter));
        }
    }
    
    // Check if obj itself is an array
    if (Array.isArray(obj)) {
        obj.forEach(item => {
            if (item && typeof item === 'object') {
                // Could be a chapter object
                if (item.chapterId || item.chapter_id || item.id || item.episodeId || item.episode_id) {
                    unlockChapterObject(item);
                }
                // Recurse into sub-objects
                traverseAndUnlock(item, listKeys);
            }
        });
    }
    
    // Recurse into data wrapper
    if (obj.data && typeof obj.data === 'object') {
        traverseAndUnlock(obj.data, listKeys);
    }
}

function setNestedValue(obj, key, value) {
    if (!obj || typeof obj !== 'object') return;
    if (obj[key] !== undefined) {
        obj[key] = value;
    }
    // Also set it even if it doesn't exist for critical fields
    obj[key] = value;
}

function deepTraverse(obj, callback, depth = 0) {
    if (!obj || typeof obj !== 'object' || depth > 10) return;
    
    if (Array.isArray(obj)) {
        obj.forEach(item => deepTraverse(item, callback, depth + 1));
    } else {
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                callback(key, obj[key], obj);
                if (typeof obj[key] === 'object') {
                    deepTraverse(obj[key], callback, depth + 1);
                }
            }
        }
    }
}
