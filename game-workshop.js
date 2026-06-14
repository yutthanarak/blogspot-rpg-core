/**
 * Mecha vs Mutant - Robot Assembly & Upgrade Workshop System (Hardcore Update)
 * File: game-workshop.js
 * Author: Yutthana Rakarayatham
 * Description: คลาสจัดการอู่ประกอบหุ่นยนต์ (เวอร์ชันเพิ่มระบบไอเท็มเสียหาย, ระบบซ่อมแซม และระบบอัปเกรดชิ้นส่วนสูงสุด +15)
 */

class RobotWorkshop {
    constructor() {
        // 🛠️ ช่างกลที่กำลังประจำการในอู่ (ต้องเป็นทหารอาชีพ Mechanic เท่านั้น)
        this.assignedMechanic = null;

        // 🤖 ช่องวาง Item ทั้ง 6 ช่องหลัก
        this.slots = {
            head: null,        // หัว
            upperBody: null,   // Bodyส่วนบน
            lowerBody: null,   // Bodyส่วนล่าง
            leftArm: null,     // แขนซ้าย
            rightArm: null,    // แขนขวา
            legs: null         // ขา
        };

        // 📈 อัตราความสำเร็จพื้นฐานในการ "ประกอบหุ่น" (S, M, L)
        this.classAssembleRates = { "S": 95, "M": 80, "L": 65 };

        // 🔺 อัตราความสำเร็จพื้นฐานในการ "อัปเกรดชิ้นส่วน (+0 ไป +1)"
        this.classUpgradeRates = { "S": 90, "M": 75, "L": 60 };
    }

    /**
     * 👨‍🔧 ระบบส่งช่างกลมาประจำการที่อู่
     */
    assignMechanic(mercenaryInstance) {
        if (!mercenaryInstance.profession || !mercenaryInstance.profession.includes("Mechanic")) {
            return { success: false, msg: `❌ ไม่สามารถเปิดอู่ได้: [${mercenaryInstance.name}] ไม่ใช่ช่างกล!` };
        }
        this.assignedMechanic = mercenaryInstance;
        return { success: true, msg: `👨‍🔧 ช่างกล [${this.assignedMechanic.name}] เข้าประจำการพร้อมเครื่องมือครบมือ!` };
    }

    /**
     * 🚪 ปลดช่างกลออกจากอู่
     */
    removeMechanic() {
        const name = this.assignedMechanic ? this.assignedMechanic.name : "ไม่มี";
        this.assignedMechanic = null;
        return { success: true, msg: `🚪 ช่างกล [${name}] ออกจากอู่แล้ว` };
    }

    /**
     * 📥 ฟังก์ชันวางไอเท็มลงในช่องประกอบ
     */
    placeItem(slotName, item) {
        if (!this.slots.hasOwnProperty(slotName)) {
            return { success: false, msg: `❌ ไม่มีช่องแต่งหุ่นชื่อ [${slotName}]` };
        }
        // กำหนดค่าเริ่มต้นโครงสร้างไอเท็มเผื่อผู้เล่นส่งอ็อบเจกต์ดิบมา
        if (item.upgradeLevel === undefined) item.upgradeLevel = 0;
        if (item.isDamaged === undefined) item.isDamaged = false;
        if (!item.itemClass) item.itemClass = "M";

        this.slots[slotName] = item;
        return { success: true, msg: `📥 วาง [${item.name} ${item.upgradeLevel > 0 ? '+' + item.upgradeLevel : ''}] ลงในช่อง [${slotName}]` };
    }

    /**
     * 🔍 ฟังก์ชันตรวจสอบดูของในช่อง
     */
    viewSlot(slotName) {
        const item = this.slots[slotName];
        if (!item) return { status: "EMPTY", msg: "ช่องนี้ยังว่างอยู่" };

        if (!this.assignedMechanic) {
            return {
                status: "READY",
                name: item.name,
                upgradeLevel: item.upgradeLevel,
                isDamaged: item.isDamaged,
                itemClass: item.itemClass,
                attributes: "❓ [ต้องใช้ช่างกลประจำการเพื่อวิเคราะห์ค่าพลัง]"
            };
        }

        return {
            status: "READY",
            name: item.name,
            upgradeLevel: item.upgradeLevel,
            isDamaged: item.isDamaged,
            itemClass: item.itemClass,
            attributes: item.attributes
        };
    }

    /**
     * 🏗️ 1. ฟังก์ชันกดปุ่ม "เริ่มประกอบหุ่นยนต์" (มีบทลงโทษชิ้นส่วนพังหากล้มเหลว)
     */
    assembleRobot() {
        if (!this.assignedMechanic) return { success: false, msg: "🛑 อู่ต้องการ 'ช่างกล' มาควบคุมเครื่องจักรประกอบหุ่น!" };

        let totalRate = 0;
        let activePartsCount = 0;
        let hasDamagedItem = false;

        // ตรวจสอบชิ้นส่วนทั้งหมดในช่องวาง
        for (let slot in this.slots) {
            if (this.slots[slot] !== null) {
                const item = this.slots[slot];
                
                // 🚨 กฎเหล็ก: ถ้ามีชิ้นส่วนใดชิ้นส่วนหนึ่งพังอยู่ จะกดประกอบไม่ได้
                if (item.isDamaged) {
                    hasDamagedItem = true;
                }
                
                const rate = this.classAssembleRates[item.itemClass.toUpperCase()] || 80;
                totalRate += rate;
                activePartsCount++;
            }
        }

        if (hasDamagedItem) {
            return { success: false, msg: "🛑 ไม่สามารถประกอบได้! มีชิ้นส่วนที่ 'เสียหาย' อยู่ในช่องวาง โปรดซ่อมแซมก่อน" };
        }
        if (activePartsCount === 0) {
            return { success: false, msg: "❌ กรุณาใส่ชิ้นส่วนหุ่นยนต์อย่างน้อย 1 ชิ้น" };
        }

        // คำนวณความสำเร็จ: ฐานไอเท็ม + โบนัสช่างกล (INT, DEX, LUX)
        const averageBaseChance = Math.floor(totalRate / activePartsCount);
        const mechanicBonus = this.calculateMechanicBonus();
        let finalChance = Math.min(100, averageBaseChance + mechanicBonus);

        const diceRoll = Math.floor(Math.random() * 100) + 1;
        const isSuccess = diceRoll <= finalChance;

        if (isSuccess) {
            this.clearAllSlots(); // ประกอบสำเร็จ ไอเท็มหลอมรวมเป็นหุ่นยนต์สำเร็จรูป
            return {
                success: true,
                msg: `🎉 [สำเร็จ!] ประกอบหุ่นยนต์เสร็จสิ้นอย่างไร้รอยต่อ! (โอกาส: ${finalChance}%, ทอยได้: ${diceRoll})`
            };
        } else {
            // 💥 บทลงโทษ: ประกอบพลาด ชิ้นส่วนทั้งหมดที่ใส่ไว้จะได้รับความเสียหายทันที!
            for (let slot in this.slots) {
                if (this.slots[slot] !== null) {
                    this.slots[slot].isDamaged = true;
                }
            }
            return {
                success: false,
                msg: `💥 [ประกอบล้มเหลว!] ระบบไฟลัดวงจรระเบิดกลางอู่! ชิ้นส่วนทั้งหมดในช่องประกอบเกิดความ "เสียหาย" และต้องส่งซ่อม!`
            };
        }
    }

    /**
     * 🔺 2. ⭐ ระบบอัปเกรด (ตีบวก) ไอเท็มส่วนประกอบ (สูงสุด +15)
     * @param {string} slotName - ช่องไอเท็มที่ต้องการตีบวก
     * @param {Object} playerInstance - อ็อบเจกต์ผู้เล่นเพื่อใช้หักเงินทอง
     */
    upgradeItem(slotName, playerInstance) {
        if (!this.assignedMechanic) return { success: false, msg: "🛑 อู่ต้องการ 'ช่างกล' มาทำการอัปเกรดปรับแต่งโครงสร้าง!" };
        
        const item = this.slots[slotName];
        if (!item) return { success: false, msg: "❌ ไม่พบไอเท็มในช่องที่เลือก" };
        
        // 🚨 เงื่อนไขตรวจสอบก่อนตีบวก
        if (item.isDamaged) return { success: false, msg: "❌ ไอเท็มนี้เสียหายอยู่! ต้องส่งซ่อมก่อนจึงจะนำมาอัปเกรดได้" };
        if (item.upgradeLevel >= 15) return { success: false, msg: "⚡ ไอเท็มชิ้นนี้ถึงระดับสูงสุด (+15) แล้ว ไม่สามารถเพิ่มได้อีก!" };

        // 💰 คำนวณค่าใช้จ่ายในการตีบวก (แพงขึ้นเรื่อย ๆ ตามจำนวนบวกปัจจุบัน)
        // สูตรจำลอง: ค่าฐานตาม Class * (1 + ระดับบวกปัจจุบัน)
        const baseUpgradeCost = item.itemClass === "L" ? 200 : (item.itemClass === "M" ? 120 : 70);
        const finalUpgradeCost = baseUpgradeCost * (1 + item.upgradeLevel);

        if (playerInstance.gold < finalUpgradeCost) {
            return { success: false, msg: `💸 ทองไม่พอ! การตีบวกระดับถัดไปต้องใช้ ${finalUpgradeCost} ทอง (คุณมี ${playerInstance.gold})` };
        }

        // หักเงินผู้เล่นทันที
        playerInstance.gold -= finalUpgradeCost;

        // 📈 คำนวณโอกาสสำเร็จในการตีบวก: ยิ่งบวกสูง โอกาสสำเร็จยิ่งลดลงเรื่อย ๆ (ติดลบเลเวลละ 4%)
        const baseClassChance = this.classUpgradeRates[item.itemClass.toUpperCase()] || 70;
        const levelPenalty = item.upgradeLevel * 4; 
        const averageBaseChance = Math.max(10, baseClassChance - levelPenalty); // โอกาสฐานขั้นต่ำไม่ต่ำกว่า 10%
        
        const mechanicBonus = this.calculateMechanicBonus();
        let finalChance = Math.min(100, averageBaseChance + mechanicBonus);

        const diceRoll = Math.floor(Math.random() * 100) + 1;
        const isSuccess = diceRoll <= finalChance;

        if (isSuccess) {
            item.upgradeLevel++;
            
            // 📊 โบนัสแถม: อัปเกรดแล้วเพิ่มสเตตัสไอเท็มขึ้นชิ้นละ 10% เพื่อความเทพ!
            if (item.attributes) {
                for (let stat in item.attributes) {
                    if (typeof item.attributes[stat] === 'number') {
                        item.attributes[stat] = Math.floor(item.attributes[stat] * 1.1) + 1;
                    }
                }
            }

            return {
                success: true,
                msg: `🔺 [ตีบวกสำเร็จ!] อัปเกรดชิ้นส่วนเป็น [${item.name} +${item.upgradeLevel}] สำเร็จ! (จ่ายไป ${finalUpgradeCost} ทอง, โอกาสติด: ${finalChance}%)`,
                playerGold: playerInstance.gold
            };
        } else {
            // 💥 ตีบวกพลาด: ไอเท็มไม่หาย แต่อุปกรณ์จะ "พัง/เสียหาย" ทันที
            item.isDamaged = true;
            return {
                success: false,
                msg: `💥 [ตีบวกพัง!] พลาดท่าทำแกนพลังงานร้าว! ไอเท็มกลายเป็นสถานะ "เสียหาย" (เสียเงินฟรี ${finalUpgradeCost} ทอง)`,
                playerGold: playerInstance.gold
            };
        }
    }

    /**
     * 🔧 3. ⭐ ระบบส่งซ่อมแซมไอเท็ม (Repair System)
     * ค่าซ่อมจะแพงขึ้นตามระดับการตีบวก (+) ของไอเท็มชิ้นนั้น
     */
    repairItem(slotName, playerInstance) {
        const item = this.slots[slotName];
        if (!item) return { success: false, msg: "❌ ไม่พบไอเท็มในช่องที่จะซ่อม" };
        if (!item.isDamaged) return { success: false, msg: "✅ ไอเท็มนี้ปกติดี ไม่จำเป็นต้องซ่อมแซม" };

        // 💰 คำนวณค่าซ่อม: ค่าซ่อมฐานตามคลาส + (เพิ่มขึ้นตามจำนวนระดับบวก)
        const baseRepairCost = item.itemClass === "L" ? 150 : (item.itemClass === "M" ? 90 : 50);
        // ยิ่งบวกเยอะ ยิ่งใช้อะไหล่แพง: ค่าซ่อมเพิ่มขึ้น 50% ต่อทุก ๆ 1 ขั้นตีบวก
        const finalRepairCost = Math.floor(baseRepairCost * (1 + (item.upgradeLevel * 0.5)));

        if (playerInstance.gold < finalRepairCost) {
            return { success: false, msg: `💸 ทองไม่พอซ่อม! อะไหล่ชิ้นนี้ต้องใช้เงิน ${finalRepairCost} ทองในการบูรณะ` };
        }

        // หักเงินผู้เล่นและคืนสภาพไอเท็ม
        playerInstance.gold -= finalRepairCost;
        item.isDamaged = false;

        return {
            success: true,
            msg: `🔧 [ซ่อมแซมสำเร็จ] บูรณะ [${item.name} +${item.upgradeLevel}] กลับมาใช้งานได้ตามปกติแล้ว! (จ่ายค่าซ่อมไป ${finalRepairCost} ทอง)`,
            playerGold: playerInstance.gold
        };
    }

    /**
     * ฟังก์ชันภายใน: คำนวณพลังช่วยเหลือจากสเตตัสนายช่าง (INT, DEX, LUX)
     */
    calculateMechanicBonus() {
        if (!this.assignedMechanic) return 0;
        const stats = this.assignedMechanic.stats;
        
        const intBonus = Math.floor((stats.int || 5) * 0.5); // INT +0.5%
        const dexBonus = Math.floor((stats.dex || 5) * 0.5); // DEX +0.5%
        const luxBonus = Math.floor((stats.lux || 5) * 0.3); // LUX +0.3%
        
        return intBonus + dexBonus + luxBonus;
    }

    clearAllSlots() {
        for (let slot in this.slots) this.slots[slot] = null;
    }
}

// ==========================================
// 4. ระบบ Export รองรับ Node.js และเบราว์เซอร์
// ==========================================
if (typeof exports !== 'undefined') {
    module.exports = { RobotWorkshop };
} else if (typeof window !== 'undefined') {
    window.RobotWorkshop = RobotWorkshop;
    console.log("🛠️ [Mecha RobotWorkshop v3] เปิดใช้งานระบบพัง, ระบบส่งซ่อม และระบบตีบวกสูงสุด +15 สมบูรณ์แบบ!");
}
