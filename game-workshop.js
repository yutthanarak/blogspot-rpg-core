/**
 * Mecha vs Mutant - Robot Assembly Workshop System (Mechanic Stats Update)
 * File: game-workshop.js
 * Author: Yutthana Rakarayatham
 * Description: คลาสจัดการอู่ประกอบหุ่นยนต์ (เวอร์ชันอัปเดต: นำ INT, DEX, LUX ของช่างกลมาคำนวณโอกาสสำเร็จ)
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

        // 📈 อัตราความสำเร็จพื้นฐานของชิ้นส่วนประกอบ (S, M, L)
        this.classSuccessRates = {
            "S": 95, // คลาส S ประกอบง่าย โอกาสสำเร็จ 95%
            "M": 80, // คลาส M โอกาสปานกลาง โอกาสสำเร็จ 80%
            "L": 65  // คลาส L ขนาดใหญ่ซับซ้อน โอกาสสำเร็จ 65%
        };
    }

    /**
     * 👨‍🔧 ระบบส่งช่างกลมาประจำการที่อู่
     */
    assignMechanic(mercenaryInstance) {
        if (!mercenaryInstance.profession || !mercenaryInstance.profession.includes("Mechanic")) {
            return { 
                success: false, 
                msg: `❌ ไม่สามารถเปิดอู่ได้: [${mercenaryInstance.name}] ไม่ใช่สายอาชีพช่างกล (Mechanic)!` 
            };
        }

        this.assignedMechanic = mercenaryInstance;
        return { 
            success: true, 
            msg: `👨‍🔧 ช่างกล [${this.assignedMechanic.name}] เข้าประจำการแล้ว! (INT:${this.assignedMechanic.stats.int} | DEX:${this.assignedMechanic.stats.dex} | LUX:${this.assignedMechanic.stats.lux})` 
        };
    }

    /**
     * 🚪 ปลดช่างกลออกจากอู่
     */
    removeMechanic() {
        const name = this.assignedMechanic ? this.assignedMechanic.name : "ไม่มี";
        this.assignedMechanic = null;
        return { success: true, msg: `🚪 ช่างกล [${name}] ออกจากอู่แล้ว ระบบอู่หยุดทำงานบางส่วน` };
    }

    /**
     * 📥 ฟังก์ชันวางไอเท็มลงในช่องประกอบ
     */
    placeItem(slotName, item) {
        if (!this.slots.hasOwnProperty(slotName)) {
            return { success: false, msg: `❌ 没有ช่องแต่งหุ่นชื่อ [${slotName}]` };
        }

        if (!item.itemClass || !["S", "M", "L"].includes(item.itemClass.toUpperCase())) {
            item.itemClass = "M";
        }

        this.slots[slotName] = item;
        
        let warning = "";
        if (!this.assignedMechanic) {
            warning = " (⚠️ คำเตือน: ไม่มีช่างกลประจำการ คุณจะไม่เห็นค่าสเตตัสของไอเท็มชิ้นนี้)";
        }

        return { success: true, msg: `📥 วาง [${item.name}] ลงในช่อง [${slotName}] เรียบร้อยแล้ว${warning}` };
    }

    /**
     * 🔍 ฟังก์ชันตรวจสอบดูของในช่อง (ซ่อน Attribute ตามเงื่อนไขช่างกล)
     */
    viewSlot(slotName) {
        const item = this.slots[slotName];
        if (!item) return { status: "EMPTY", msg: "ช่องนี้ยังว่างอยู่" };

        if (!this.assignedMechanic) {
            return {
                status: "READY",
                name: item.name,
                itemClass: item.itemClass,
                attributes: "❓ [ERROR: ต้องใช้ช่างกลประจำการเพื่อวิเคราะห์ค่าพลัง]"
            };
        }

        return {
            status: "READY",
            name: item.name,
            itemClass: item.itemClass,
            attributes: item.attributes
        };
    }

    /**
     * 🏗️ ⭐ ฟังก์ชันกดปุ่ม "เริ่มประกอบหุ่นยนต์" (เวอร์ชันคำนวณสเตตัสช่างกลแบบละเอียด)
     */
    assembleRobot() {
        // 1. ตรวจสอบช่างกลประจำการ
        if (!this.assignedMechanic) {
            return { 
                success: false, 
                msg: "🛑 ไม่สามารถประกอบหุ่นได้! อู่ต้องการ 'ช่างกล' มาควบคุมเครื่องจักรและคำนวณโครงสร้าง" 
            };
        }

        let totalRate = 0;
        let activePartsCount = 0;
        let partsList = [];

        // 2. คำนวณอัตราความสำเร็จฐานจากชิ้นส่วนหุ่นยนต์ทั้งหมดที่สวมใส่
        for (let slot in this.slots) {
            if (this.slots[slot] !== null) {
                const item = this.slots[slot];
                const rate = this.classSuccessRates[item.itemClass.toUpperCase()] || 80;
                
                totalRate += rate;
                activePartsCount++;
                partsList.push(`${item.name} (${item.itemClass})`);
            }
        }

        if (activePartsCount === 0) {
            return { success: false, msg: "❌ ไม่สามารถประกอบได้: กรุณาใส่ชิ้นส่วนหุ่นยนต์อย่างน้อย 1 ชิ้น" };
        }

        const averageBaseChance = Math.floor(totalRate / activePartsCount);

        // 3. 📊 ดึงค่าสเตตัส [int, dex, lux] ของนายช่างมาคำนวณโบนัสพิเศษ
        const chefStats = this.assignedMechanic.stats;
        const intValue = chefStats.int || 5;
        const dexValue = chefStats.dex || 5;
        const luxValue = chefStats.lux || 5;

        const intBonus = Math.floor(intValue * 0.5); // INT ตัวละ +0.5%
        const dexBonus = Math.floor(dexValue * 0.5); // DEX ตัวละ +0.5%
        const luxBonus = Math.floor(luxValue * 0.3); // LUX ตัวละ +0.3%
        const totalMechanicBonus = intBonus + dexBonus + luxBonus;

        // โอกาสสำเร็จสุทธิ = ฐานชิ้นส่วน + โบนัสสเตตัสนายช่าง
        let finalSuccessChance = averageBaseChance + totalMechanicBonus;
        finalSuccessChance = Math.min(100, finalSuccessChance); // ล็อกเพดานสูงสุดไว้ที่ 100%

        // 🎲 ลูกเต๋าระบบสุ่ม (Roll 1 - 100)
        const diceRoll = Math.floor(Math.random() * 100) + 1;
        const isSuccess = diceRoll <= finalSuccessChance;

        if (isSuccess) {
            this.clearAllSlots();
            return {
                success: true,
                baseChance: averageBaseChance,
                mechanicBonus: totalMechanicBonus,
                finalChance: finalSuccessChance,
                roll: diceRoll,
                msg: `🎉 [สำเร็จมหาศาล!] ช่างกล ${this.assignedMechanic.name} ประกอบหุ่นสำเร็จ! โอกาสรวม: ${finalSuccessChance}% (ฐาน:${averageBaseChance}% + โบนัสช่าง:${totalMechanicBonus}%), ทอยได้: ${diceRoll}`
            };
        } else {
            return {
                success: false,
                baseChance: averageBaseChance,
                mechanicBonus: totalMechanicBonus,
                finalChance: finalSuccessChance,
                roll: diceRoll,
                msg: `💥 [ประกอบล้มเหลว!] ชิ้นส่วนหลุดประกายไฟลัดวงจร โอกาสรวม: ${finalSuccessChance}%, ทอยได้: ${diceRoll} (ชิ้นส่วนปลอดภัยดี ลองใหม่อีกครั้ง)`
            };
        }
    }

    /**
     * ฟังก์ชันภายใน: ล้างบอร์ดประกอบเมื่อทำเสร็จ
     */
    clearAllSlots() {
        for (let slot in this.slots) {
            this.slots[slot] = null;
        }
    }
}

// ==========================================
// 4. ระบบ Export รองรับ Node.js และเบราว์เซอร์
// ==========================================
if (typeof exports !== 'undefined') {
    module.exports = { RobotWorkshop };
} else if (typeof window !== 'undefined') {
    window.RobotWorkshop = RobotWorkshop;
    console.log("🛠️ [Mecha RobotWorkshop v2] อัปเดตระบบคำนวณความสำเร็จด้วย INT, DEX, LUX ของช่างกลเรียบร้อย!");
}
