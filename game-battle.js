/**
 * Mecha vs Mutant - Card-Based Tactical Battle System (Updated: Consumable Cards)
 * File: game-battle.js
 * Author: Yutthana Rakarayatham
 * Description: ระบบต่อสู้ จัดคิวการ์ด 10 ใบ จัดการกระสุน และระบบหักลบการ์ดแบบใช้แล้วทิ้ง (Burn)
 */

// ==========================================
// 1. คลาสการ์ดคำสั่ง (Battle Card)
// ==========================================
class Card {
    /**
     * @param {string} id - ID การ์ด
     * @param {string} name - ชื่อการ์ด
     * @param {string} type - ประเภท ('flat_damage', 'multiplier', 'skill')
     * @param {number} value - ค่าพลัง (เช่น +50, หรือ x1.5)
     * @param {Object} extraEffect - สกิลพิเศษ (เช่น { aoe: 3, defUp: 20 })
     * @param {boolean} isConsumable - เช็คว่าการ์ดนี้ใช้แล้วทิ้งหรือไม่ (True = ใช้แล้วพัง / False = การ์ดพื้นฐานใช้ซ้ำได้)
     */
    constructor(id, name, type, value, extraEffect = {}, isConsumable = true) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.value = value;
        this.extraEffect = extraEffect;
        this.isConsumable = isConsumable; 
    }
}

// ==========================================
// 2. คลาสควบคุมกระบวนการต่อสู้ (Battle Manager)
// ==========================================
class BattleManager {
    constructor(player, mecha, enemy) {
        this.player = player;
        this.mecha = mecha;
        this.enemy = enemy;

        this.cardQueue = [];
        this.currentCardIndex = 0;

        this.ammoStats = {
            main_weapon: { current: 0, max: 0 },
            head_weapon: { current: 0, max: 0 },
            shoulder_weapon: { current: 0, max: 0 }
        };
        
        this.heatLevel = 0; 
        
        // 🗑️ เพิ่มเติม: อาร์เรย์เก็บรายชื่อ ID การ์ดที่ถูกเผาทำลายในแมตช์นี้ 
        // เพื่อส่งกลับไปให้หน้าเว็บหลักทำการลบออกจาก Database ของผู้เล่นตอนจบด่าน
        this.burnedCardsThisMatch = []; 
    }

    // ==========================================
    // เฟสที่ 1: การเตรียมตัว (Preparation Phase)
    // ==========================================

    setupCards(cards) {
        if (cards.length !== 10) {
            return { success: false, msg: "❌ ต้องเลือกการ์ดจัดคิวให้ครบ 10 ใบเป๊ะๆ ครับ!" };
        }
        this.cardQueue = cards;
        this.currentCardIndex = 0;
        this.burnedCardsThisMatch = []; // รีเซ็ตประวัติการเผาการ์ด
        return { success: true, msg: "✅ จัดเรียงคิวการ์ดคำสั่งทั้ง 10 ใบพร้อมรบ!" };
    }

    reloadWeapons() {
        const parts = this.mecha.parts;
        
        if (parts.right_arm && parts.right_arm.bonusStats?.maxAmmo) {
            this.ammoStats.main_weapon.max = parts.right_arm.bonusStats.maxAmmo;
            this.ammoStats.main_weapon.current = this.ammoStats.main_weapon.max;
        }
        
        if (parts.head_gear && parts.head_gear.bonusStats?.maxAmmo) {
            this.ammoStats.head_weapon.max = parts.head_gear.bonusStats.maxAmmo;
            this.ammoStats.head_weapon.current = this.ammoStats.head_weapon.max;
        }
        if (parts.shoulder_gear && parts.shoulder_gear.bonusStats?.maxAmmo) {
            this.ammoStats.shoulder_weapon.max = parts.shoulder_gear.bonusStats.maxAmmo;
            this.ammoStats.shoulder_weapon.current = this.ammoStats.shoulder_weapon.max;
        }

        return { success: true, msg: "🔄 เติมกระสุนอาวุธทุกชนิดเต็มแม็กกาซีนแล้ว!" };
    }

    // ==========================================
    // เฟสที่ 2: การคำนวณสถานะก่อนต่อสู้
    // ==========================================

    calculateMovement() {
        let baseMovement = 1; 
        const legs = this.mecha.parts.legs;
        const backGear = this.mecha.parts.back_gear; 

        if (legs && legs.bonusStats?.moveRange) baseMovement += legs.bonusStats.moveRange;
        if (backGear && backGear.bonusStats?.moveRange) baseMovement += backGear.bonusStats.moveRange;

        return baseMovement;
    }

    // ==========================================
    // เฟสที่ 3: กระบวนการต่อสู้ (Combat Execution)
    // ==========================================

    playNextCard() {
        if (this.currentCardIndex >= this.cardQueue.length) {
            return { success: false, endOfTurn: true, msg: "🃏 จบรอบ! การ์ดคำสั่งถูกใช้จนหมดคิวแล้ว" };
        }

        const activeCard = this.cardQueue[this.currentCardIndex];
        this.currentCardIndex++;

        // จัดการกระสุน
        let hasAmmo = this.ammoStats.main_weapon.current > 0;
        if (hasAmmo) {
            this.ammoStats.main_weapon.current--; 
        }

        // คำนวณ Base ATK
        const playerAtk = this.player.attackPower || 0;
        const mechaAtk = this.mecha.totalStats.str * 2 || 0; 
        let basePower = playerAtk + mechaAtk;
        if (!hasAmmo) basePower = Math.floor(basePower * 0.5); 

        let finalDamage = 0;
        let attackArea = 1; 
        let cardEffectMsg = "";

        // ประมวลผลผลลัพธ์ของการ์ด
        if (activeCard.type === "flat_damage") {
            finalDamage = (basePower + activeCard.value);
            cardEffectMsg = `โจมตีตรง +${activeCard.value}`;
        } 
        else if (activeCard.type === "multiplier") {
            finalDamage = Math.floor(basePower * activeCard.value);
            cardEffectMsg = `ชาร์จพลัง x${activeCard.value}`;
            this.heatLevel += 15; 
        } 
        else if (activeCard.type === "skill") {
            finalDamage = basePower; 
            if (activeCard.extraEffect.aoe) {
                attackArea = activeCard.extraEffect.aoe;
                cardEffectMsg += `[สาดกระสุน ${attackArea} ช่อง] `;
            }
            if (activeCard.extraEffect.defUp) {
                this.player.defense += activeCard.extraEffect.defUp; 
                cardEffectMsg += `[เกราะ +${activeCard.extraEffect.defUp}] `;
            }
        }

        // โจมตีศัตรู
        let actualDamage = Math.floor(finalDamage - (this.enemy.defense || 0));
        if (actualDamage < 1) actualDamage = 1; 
        this.enemy.currentHp -= actualDamage;

        // 🔥 ระบบทำลายการ์ด (Burn System)
        let isBurned = false;
        if (activeCard.isConsumable) {
            this.burnedCardsThisMatch.push(activeCard.id);
            isBurned = true;
        }

        return {
            success: true,
            cardPlayed: activeCard.name,
            damageDealt: actualDamage,
            attackArea: attackArea,
            enemyHp: this.enemy.currentHp,
            cardBurned: isBurned,
            msg: `🃏 ใช้การ์ด [${activeCard.name}] -> ${cardEffectMsg} | ศัตรูโดน ${actualDamage} ดาเมจ ${isBurned ? '(🔥 การ์ดถูกเผาทำลาย)' : '(♻️ การ์ดถาวร)'}`
        };
    }

    /**
     * 📋 สรุปผลหลังจบการต่อสู้ เพื่อให้ระบบหลักดึงไปลบการ์ดออกจาก Database ของผู้เล่น
     */
    getPostBattleReport() {
        return {
            enemyDefeated: this.enemy.currentHp <= 0,
            consumedCards: this.burnedCardsThisMatch, // แจ้งคืนระบบว่ามีไอดีการ์ดไหนบ้างที่ใช้ไปแล้วหายไป
            finalHeatLevel: this.heatLevel
        };
    }
}

if (typeof exports !== 'undefined') {
    module.exports = { Card, BattleManager };
} else if (typeof window !== 'undefined') {
    window.Card = Card;
    window.BattleManager = BattleManager;
    console.log("⚔️ [Mecha vs Mutant Battle System] อัปเดตระบบเผาการ์ดเสร็จสมบูรณ์!");
}
