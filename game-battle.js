/**
 * Mecha vs Mutant - Advanced Card-Based Battle & Loot Distribution System
 * File: game-battle.js
 * Author: Yutthana Rakarayatham
 * Description: ระบบต่อสู้จัดการคิวมุ่งเป้าหมาย (Target Queue), ระบบคำนวณการดรอปไอเท็มตามเกรดเลเวล และคลังสำรองชั่วคราว 1 ชั่วโมง
 */

// ==========================================
// 1. คลาสคลังสินค้าชั่วคราว (Temporary Storage Class)
// ==========================================
class TemporaryStorage {
    constructor() {
        this.slots = [];       // เก็บไอเท็มในรูปแบบ [{ item: Item, expiresAt: timestamp }]
        this.maxSlots = 10;    // จำกัดความจุ 10 ช่อง
        this.lifespan = 3600000; // อายุระบบ: 1 ชั่วโมง (ในหน่วยมิลลิวินาที)
    }

    /**
     * 📥 เพิ่มไอเท็มเข้าคลังชั่วคราว
     */
    addItem(item) {
        this.cleanExpiredItems(); // ล้างของหมดอายุก่อนตรวจสอบพื้นที่ว่าง

        if (this.slots.length >= this.maxSlots) {
            console.log(`💥 [คลังชั่วคราวเต็ม!] ไอเท็ม [${item.name}] เกินขีดจำกัด 10 ช่อง จึงถูกทำลายทิ้งทันที`);
            return { success: false, msg: "คลังชั่วคราวเต็ม ไอเท็มถูกทำลาย" };
        }

        const expireTime = Date.now() + this.lifespan;
        this.slots.push({
            item: item,
            expiresAt: expireTime
        });

        console.log(`⚠️ คลังรถเต็ม! ส่ง [${item.name}] เข้าคลังชั่วคราว (จะหมดอายุภายใน 1 ชั่วโมง)`);
        return { success: true, expiresAt: expireTime };
    }

    /**
     * 🧹 ตรวจสอบและทำลายไอเท็มที่หมดอายุเกิน 1 ชั่วโมงทิ้งทั้งหมด
     */
    cleanExpiredItems() {
        const now = Date.now();
        const initialCount = this.slots.length;
        
        // กรองเก็บไว้เฉพาะไอเท็มที่เวลยังไม่หมดอายุ
        this.slots = this.slots.filter(slot => slot.expiresAt > now);
        
        const deletedCount = initialCount - this.slots.length;
        if (deletedCount > 0) {
            console.log(`🧹 [ระบบคลังชั่วคราว] ทำลายไอเท็มที่ปล่อยทิ้งไว้เกิน 1 ชั่วโมงไปจำนวน ${deletedCount} ชิ้น`);
        }
    }

    /**
     * 📋 ดูรายการไอเท็มที่เหลืออยู่ในคลังชั่วคราว ปัจจุบัน
     */
    getAvailableItems() {
        this.cleanExpiredItems();
        return this.slots;
    }
}

// สร้างอ็อบเจกต์คลังชั่วคราวตัวกลางเอาไว้ผูกใช้ร่วมกันทั้งเกม
const globalTempStorage = new TemporaryStorage();


// ==========================================
// 2. คลาสควบคุมกระบวนการต่อสู้ (Battle Manager Class)
// ==========================================
class BattleManager {
    /**
     * @param {Object} player - ข้อมูลผู้เล่นหลัก
     * @param {Object} mecha - ข้อมูลหุ่นยนต์ที่ผู้เล่นขับ
     * @param {Array} enemies - รายการมอนสเตอร์ศัตรูทั้งหมดในห้องนั้น [Monster1, Monster2, ...]
     */
    constructor(player, mecha, enemies = []) {
        this.player = player;
        this.mecha = mecha;
        
        // ดึงมอนสเตอร์เข้าห้องต่อสู้ และสร้างแมปค้นหาผ่าน ID
        this.enemiesMap = {};
        enemies.forEach(enemy => {
            this.enemiesMap[enemy.id] = enemy;
        });

        this.cardQueue = [];          // คิวการ์ดคำสั่ง 10 ใบ
        this.currentCardIndex = 0;
        this.targetQueue = [];        // 🎯 คิวจัดลำดับเป้าหมายโจมตี (เก็บเป็นอาเรย์ของ ID มอนสเตอร์ เช่น ['m_01', 'm_02'])

        this.ammoStats = {
            main_weapon: { current: 0, max: 0 },
            head_weapon: { current: 0, max: 0 },
            shoulder_weapon: { current: 0, max: 0 }
        };
        
        this.burnedCardsThisMatch = []; 
    }

    // ==========================================
    // เฟสเตรียมตัวก่อนการต่อสู้ (Preparation Phase)
    // ==========================================

    setupCards(cards) {
        if (cards.length !== 10) {
            return { success: false, msg: "❌ ต้องเลือกการ์ดจัดคิวให้ครบ 10 ใบครับ!" };
        }
        this.cardQueue = cards;
        this.currentCardIndex = 0;
        this.burnedCardsThisMatch = [];
        return { success: true, msg: "✅ จัดเรียงคิวการ์ดคำสั่งทั้ง 10 ใบพร้อมรบ!" };
    }

    /**
     * 🎯 เพิ่มเติม: ฟังก์ชันจัดเรียงลำดับเป้าหมายที่จะรุมโจมตีมอนสเตอร์ล่วงหน้า
     * @param {Array<string>} monsterIdsOrdered - รายชื่อ ID มอนสเตอร์เรียงลำดับจากตัวแรกที่จะตีไปตัวสุดท้าย
     */
    setTargetQueue(monsterIdsOrdered) {
        // กรองตรวจสอบให้แน่ใจว่า ID มอนสเตอร์ที่ส่งมามีตัวตนอยู่ในห้องสู้จริง
        this.targetQueue = monsterIdsOrdered.filter(id => this.enemiesMap[id]);
        return { success: true, msg: `🎯 กำหนดลำดับเป้าหมายการจู่โจมสำเร็จ! ลำดับคิว: [${this.targetQueue.join(" -> ")}]` };
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
        return { success: true, msg: "🔄 เติมกระสุนอาวุธทุกส่วนเรียบร้อย!" };
    }

    // ==========================================
    // เฟสการรันผลต่อสู้และการคำนวณดร็อปของเมื่อมอนสเตอร์ตาย
    // ==========================================

    /**
     * ⚔️ สั่งประมวลผลการ์ดใบถัดไปตามคิว
     * @param {Object} activeVehicle - รถมอเตอร์ไซค์/รถกระบะ ของผู้เล่นเพื่อเอาไว้ใส่ของดร็อปกรณีมอนตาย
     */
    playNextCard(activeVehicle) {
        if (this.currentCardIndex >= this.cardQueue.length) {
            return { success: false, endOfTurn: true, msg: "🃏 จบรอบ! การ์ดในคิวหมดแล้ว" };
        }

        // ค้นหาเป้าหมายมอนสเตอร์ที่ยังมีชีวิตอยู่ตัวแรกในคิวเป้าหมาย (Target Queue)
        let activeEnemy = null;
        while (this.targetQueue.length > 0) {
            let nextTargetId = this.targetQueue[0];
            let enemy = this.enemiesMap[nextTargetId];
            if (enemy && !enemy.isDead()) {
                activeEnemy = enemy;
                break;
            } else {
                // ถ้ามอนสเตอร์ตัวนี้ตายไปแล้ว ให้เลื่อนคิวขยับตัดออกไป
                this.targetQueue.shift();
            }
        }

        // หากไม่มีมอนสเตอร์เหลือรอดในคิวเป้าหมายแล้ว ให้ยุติการโจมตี
        if (!activeEnemy) {
            return { success: false, msg: "🏳️ ไม่พบศัตรูที่มีชีวิตเหลืออยู่ในคิวเป้าหมายแล้ว การโจมตีสิ้นสุดลง!" };
        }

        const activeCard = this.cardQueue[this.currentCardIndex];
        this.currentCardIndex++;

        // จัดการกระสุนและพลังโจมตี
        let hasAmmo = this.ammoStats.main_weapon.current > 0;
        if (hasAmmo) this.ammoStats.main_weapon.current--;

        const playerAtk = this.player.attackPower || 0;
        const mechaAtk = this.mecha.totalStats.str * 2 || 0;
        let basePower = playerAtk + mechaAtk;
        if (!hasAmmo) basePower = Math.floor(basePower * 0.5);

        let finalDamage = 0;
        let cardEffectMsg = "";

        if (activeCard.type === "flat_damage") {
            finalDamage = (basePower + activeCard.value);
            cardEffectMsg = `บวกพลังตรง +${activeCard.value}`;
        } else if (activeCard.type === "multiplier") {
            finalDamage = Math.floor(basePower * activeCard.value);
            cardEffectMsg = `ทวีคูณพลัง x${activeCard.value}`;
        } else if (activeCard.type === "skill") {
            finalDamage = basePower;
            cardEffectMsg = `ใช้สกิลพิฆาต`;
        }

        let actualDamage = Math.floor(finalDamage - (activeEnemy.defense || 0));
        if (actualDamage < 1) actualDamage = 1;
        
        // ทำการลดพลังชีวิตของมอนสเตอร์เป้าหมายหลัก
        activeEnemy.currentHp -= actualDamage;

        // เผาการ์ดทิ้งกรณีใช้แล้วหมดไป
        let isBurned = false;
        if (activeCard.isConsumable) {
            this.burnedCardsThisMatch.push(activeCard.id);
            isBurned = true;
        }

        let resultLog = `⚔️ ยิงใส่ [${activeEnemy.name}] สเปกการ์ด [${activeCard.name}]: ${cardEffectMsg} ทำดาเมจได้ ${actualDamage} หน่วย`;

        // 💀 ตรวจสอบระบบมอนสเตอร์ตายและการดรอปไอเท็ม
        if (activeEnemy.isDead()) {
            resultLog += `\n💀 มอนสเตอร์ [${activeEnemy.name}] พ่ายแพ้แล้ว! เริ่มกระบวนการสุ่มแจกจ่ายรางวัลดร็อป...`;
            const lootReport = this.executeLootDrop(activeEnemy, activeVehicle);
            resultLog += `\n${lootReport}`;
        }

        return {
            success: true,
            msg: resultLog,
            enemyHp: activeEnemy.currentHp
        };
    }

    /**
     * 🎁 ⭐ ระบบจัดการการดรอปไอเท็มชั้นสูงตามสเปกของคุณยุทธนา
     */
    executeLootDrop(monster, vehicle) {
        // สมมติมอนสเตอร์มีตารางไอเท็มทั้งหมดในตัว (เช่น มีโอกาสดรอปได้สูงสุด 5 ชิ้นรวมในอาร์เรย์)
        // เพื่อให้เห็นเลเวลชัดเจน ไอเท็มจะมีโครงสร้างตัวแปร .itemLevel ซ่อนอยู่ด้านในคลาสไอเท็มทั่วไป
        const availableLootPool = monster.dropItems.filter(item => item !== null);
        if (availableLootPool.length === 0) return " - มอนสเตอร์ตัวนี้ไม่มีไอเท็มรางวัลติดตัวมาด้วย";

        // ขั้นตอนที่ 1: สุ่มเพดานจำนวนชิ้นที่จะยอมให้ดรอปในรอบนี้ (สุ่มตั้งแต่ 1 ถึง จำนวนสูงสุดที่มีในตัวมอนสเตอร์)
        const maxPossibleItems = availableLootPool.length;
        const targetDropCount = Math.floor(Math.random() * maxPossibleItems) + 1;
        
        let rolledPassedItems = [];

        // ขั้นตอนที่ 2: วนสุ่มไอเท็มทีละชิ้นจนครบ โดยสเปกคือ "ไอเท็มเลเวลต่ำโอกาสติดสูง เลเวลสูงโอกาสติดต่ำ"
        availableLootPool.forEach(item => {
            const itemLvl = item.itemLevel || 1; // เกรดเลเวลไอเท็ม เช่น เลเวล 1, เลเวล 5
            
            // สูตรคำนวณโอกาสดรอปผกผันตามเลเวล: ยิ่งเลเวลสูง ตัวหารยิ่งเยอะ โอกาสติดยิ่งน้อย
            // เลเวล 1 = โอกาส 80%, เลเวล 2 = 40%, เลเวล 3 = 26.6%, เลเวล 5 = 16%
            const dropChancePercent = Math.max(5, Math.floor(80 / itemLvl)); 
            const roll = Math.floor(Math.random() * 100) + 1;

            if (roll <= dropChancePercent) {
                rolledPassedItems.push(item); // สุ่มผ่านเกณฑ์ความยากง่ายสำเร็จ บันทึกเข้ารายการติดรางวัล
            }
        });

        let finalDroppedItems = [];

        // ขั้นตอนที่ 3: จัดการคัดกรองจำนวนผ่านการเรียงระดับเลเวล
        if (rolledPassedItems.length > targetDropCount) {
            // ดรอปเกินโควตาขั้นแรก -> เรียงเลเวลจากสูงไปต่ำ (Descending Order)
            rolledPassedItems.sort((a, b) => (b.itemLevel || 1) - (a.itemLevel || 1));
            
            // ตัดไอเท็มเลเวลน้อย ๆ (ท้ายแถว) ออกทิ้งจนเหลือจำนวนเท่ากับโควตา targetDropCount พอดีเป๊ะ
            finalDroppedItems = rolledPassedItems.slice(0, targetDropCount);
        } else {
            // ดรอปได้น้อยกว่าหรือเท่ากับโควตาขั้นแรก -> ยกยอดนำไปใช้งานทั้งหมดเท่าที่สุ่มติด
            finalDroppedItems = rolledPassedItems;
        }

        if (finalDroppedItems.length === 0) return " - รอบนี้สุ่มไม่ติดไอเท็มรางวัลใดๆ เลย";

        // ขั้นตอนที่ 4: ตรวจเช็คพื้นที่ว่างของคลังสินค้าท้ายรถ และจัดการสิทธิ์จัดเก็บลงคลังชั่วคราว
        let summaryMsg = `คัดสรรไอเท็มผ่านเกณฑ์สำเร็จ ${finalDroppedItems.length} ชิ้น (จำกัดโควตาสูงสุดรอบนี้ที่ ${targetDropCount} ชิ้น):\n`;

        finalDroppedItems.forEach(item => {
            // ส่งคำสั่งยัดของเข้าท้ายรถ (เรียกใช้คลาส Vehicle จากไฟล์ game-vehicles.js)
            let cargoResult = vehicle.addItem(item);
            
            if (cargoResult.success) {
                summaryMsg += `   📦 [บรรทุกสำเร็จ] -> ${item.name} (Lv.${item.itemLevel || 1}) ถูกนำขึ้นท้ายรถแล้ว\n`;
            } else {
                // ท้ายรถเต็ม -> ส่งผลลัพธ์กระจายเข้าสู่ระบบ "คลังสินค้าชั่วคราว 1 ชั่วโมง" ทันที
                let tempResult = globalTempStorage.addItem(item);
                if (tempResult.success) {
                    summaryMsg += `   ⚠️ [ท้ายรถเต็ม!] -> ${item.name} (Lv.${item.itemLevel || 1}) ถูกส่งเข้าคลังสำรองชั่วคราว 1 ชม.\n`;
                } else {
                    summaryMsg += `   💥 [ถูกทำลาย!] -> ${item.name} (Lv.${item.itemLevel || 1}) คลังสำรองเต็มแล้ว จึงสูญสลายไป\n`;
                }
            }
        });

        return summaryMsg;
    }
}

// ==========================================
// 3. ระบบ Export รองรับทั้ง Node.js และเบราว์เซอร์ Blogspot
// ==========================================
if (typeof exports !== 'undefined') {
    module.exports = { Card, BattleManager, globalTempStorage };
} else if (typeof window !== 'undefined') {
    window.Card = Card;
    window.BattleManager = BattleManager;
    window.globalTempStorage = globalTempStorage;
    console.log("⚔️ [Mecha vs Mutant ADV-Battle] อัปเดประบบเลือกลำดับยิงมอนสเตอร์ และคลังดร็อปสำรอง 1 ชั่วยามแล้ว!");
}
