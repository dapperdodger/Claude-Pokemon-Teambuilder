// Verbatim extract of the `Side` function from
// https://github.com/nerd-of-now/NCP-VGC-Damage-Calculator/blob/1369b359b85f0a6343df006acde92cc4a7d07805/script_res/ap_calc.js
// (source lines 2164-2198 at that commit). Extracted (not rewritten) because
// the rest of ap_calc.js has top-level DOM/jQuery side effects that throw
// outside a browser; this one function has none.
module.exports.Side = function Side(format, terrain, weather, isGravity, isSR, spikes, isReflect, isLightScreen, isForesight, isHelpingHand, isFriendGuard, isBattery, isProtect, isPowerSpot, isSteelySpirit, isNeutralizingGas, isGmaxField, isFlowerGiftSpD, isFlowerGiftAtk, isTailwind, isSaltCure, isAuroraVeil, isSwamp, isSeaFire, isRedItem, isBlueItem, isCharge, isLeechSeed, isIngrain, isCurse, isBinding, isAquaRing, isNightmare) {
    this.format = format;
    this.terrain = terrain;
    this.weather = weather;
    this.isGravity = isGravity;
    this.isSR = isSR;
    this.spikes = spikes;
    this.isReflect = isReflect;
    this.isLightScreen = isLightScreen;
    this.isForesight = isForesight;
    this.isHelpingHand = isHelpingHand;
    this.isFriendGuard = isFriendGuard;
    this.isBattery = isBattery;
    this.isProtect = isProtect;
    this.isPowerSpot = isPowerSpot;
    this.isSteelySpirit = isSteelySpirit;
    this.isNeutralizingGas = isNeutralizingGas;
    this.isGMaxField = isGmaxField;
    this.isFlowerGiftSpD = isFlowerGiftSpD;
    this.isFlowerGiftAtk = isFlowerGiftAtk;
    this.isTailwind = isTailwind;
    this.isSaltCure = isSaltCure;
    this.isAuroraVeil = isAuroraVeil;
    this.isSwamp = isSwamp;
    this.isSeaFire = isSeaFire;
    this.isRedItem = isRedItem;
    this.isBlueItem = isBlueItem;
    this.isCharge = isCharge;
    this.isLeechSeed = isLeechSeed;
    this.isIngrain = isIngrain;
    this.isCurse = isCurse;
    this.isBinding = isBinding;
    this.isAquaRing = isAquaRing;
    this.isNightmare = isNightmare;
};
