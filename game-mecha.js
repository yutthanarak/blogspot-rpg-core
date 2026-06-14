/**
 * Mecha vs Mutant - Mecha Assembly & Customization System
 * File: game-mecha.js
 * Author: Yutthana Rakarayatham
 * Description: คลาสควบคุมการประกอบชิ้นส่วนหุ่นยนต์ทั้ง 9 ช่อง ตรวจสอบขนาดคลาส (S/M/L) และผูกมัดกับผู้เล่น/ทหารรับจ้าง
 */

// ==========================================
// 1. คลาสควบคุมโครงสร้างหุ่นยนต์ (Mecha Class)
// ==========================================
class Mecha {
    /**
     * @param {string} id - ID เฉพาะของหุ่นยนต์ตัวนี้ (เช่น 'mecha_001')
     * @param {string} name - ชื่อที่ผู้เล่นตั้งให้หุ่นยนต์
     * @param {string} mechaSize - คลาสขนาดของหุ่นยนต์ ('S' = เล็ก, 'M' = กลาง, 'L' = ใหญ่)
     */
    constructor(id, name, mechaSize = 'M') {
        this.id = id;
        this.name = name;
        this.mechaSize = mechaSize.toUpperCase(); // 'S', 'M', 'L'
        
        this.assignedTo = null; // ID ของ Player หรือ ทหารรับจ้างที่จับคู่ใช้งานหุ่นตัวนี้อยู่ (null = ว่างอยู่)

        // 📦 คลังสวมใส่ชิ้นส่วนหุ่นยนต์ทั้ง 9 ช่องตามข้อกำหนดที่คุณยุทธนาตั้งไว้
        this.parts = {
            head: null,          // ส่วนหัว
            torso: null,         // bodyท่อนบน
            left_arm: null,      // แขนซ้าย
            right_arm: null,     // แขนขวา
            legs: null,          // Bodyท่อนล่าง
            feet: null,          // ขา
            head_gear: null,     // อุปกรณ์ส่วนหัว
            shoulder_gear: null, // อุปกรณ์ส่วนบ่า
            back_gear: null      // อุปกรณ์ส่วนหลัง
        };

        // ค่าพลังรวมของหุ่นยนต์ (คำนวณจากชิ้นส่วนทั้งหมดที่สวมใส่)
        this.totalStats = { str: 0, agi: 0, int: 0, vit: 0, dex: 0 };
    }

    /**
     * 🛠️ ฟังก์ชันประกอบชิ้นส่วนเข้ากับหุ่นยนต์
     * @param {string} slotName - ชื่อช่องที่จะใส่ (เช่น 'left_arm', 'torso')
     * @param {Object} itemPart - วัตถุไอเท็มชิ้นส่วนที่มาจากคลาส Item (game-items.js)
     */
    assemblePart(slotName, itemPart) {
        // 1. ตรวจสอบว่าช่องสวมใส่ถูกต้องไหม
        if (!this.parts.hasOwnProperty(slotName)) {
            return { success: false, msg: `❌ ไม่พบช่องติดตั้งชื่อ [${slotName}] บนหุ่นยนต์!` };
        }

        // 2. ตรวจสอบขนาดคลาสหุ่นยนต์ (idAttribute1) ว่าตรงกับขนาดตัวหุ่นไหม
        const partSize = itemPart.idAttribute1 ? itemPart.idAttribute1.toUpperCase() : 'M';
        if (partSize !== this.mechaSize) {
            return { 
                success: false, 
                msg: `⚠️ ขนาดไม่รองรับ! หุ่นยนต์นี้เป็นคลาส [ไซส์ ${this.mechaSize}] แต่ชิ้นส่วน ${itemPart.name} เป็นของ [ไซส์ ${partSize}]` 
            };
        }

        // 3. ตรวจสอบประเภทชิ้นส่วน (idAttribute2) ว่าตรงกับช่องที่จะใส่ไหม
        const partSlotType = itemPart.idAttribute2;
        if (partSlotType !== slotName) {
            return { success: false, msg: `❌ ชิ้นส่วน [${itemPart.name}] ไม่สามารถติดตั้งในช่อง [${slotName}] ได้!` };
        }

        // 4. ผ่านเงื่อนไขทั้งหมด -> ดำเนินการติดตั้งชิ้นส่วน
        this.parts[slotName] = itemPart;
        this.calculateMechaStats(); // คำนวณพลังรวมใหม่ทันที

        return { success: true, msg: `⚙️ ประกอบ [${itemPart.name}] เข้ากับช่อง [${slotName}] เรียบร้อย!` };
    }

    /**
     * 📤 ฟังก์ชันถอดชิ้นส่วนหุ่นยนต์ออก
     */
    disassemblePart(slotName) {
        if (!this.parts[slotName]) {
            return { success: false, msg: "❌ ช่องนี้ไม่มีชิ้นส่วนติดตั้งอยู่แล้วครับ" };
        }
        const removedPart = this.parts[slotName];
        this.parts[slotName] = null;
        this.calculateMechaStats();
        return { success: true, msg: `📤 ถอดชิ้นส่วน [${removedPart.name}] ออกแล้ว`, part: removedPart };
    }

    /**
     * 📊 ฟังก์ชันคำนวณสเตตัสรวมของหุ่นยนต์จากชิ้นส่วนทั้งหมดที่ใส่ไว้
     */
    calculateMechaStats() {
        // รีเซตค่าพลังเป็น 0 ก่อนคำนวณใหม่
        this.totalStats = { str: 0, agi: 0, int: 0, vit: 0, dex: 0 };

        // วนลูปเช็คชิ้นส่วนทั้ง 9 ช่อง
        for (const [slot, part] of Object.entries(this.parts)) {
            if (part) {
                // สมมติว่าในระบบไอเท็ม มีการเก็บพลังโบนัสไว้ เช่น part.bonusStats = { str: 5, vit: 10 }
                // และคำนวณรวมผลของการตีบวก (Upgrade Level) เข้าไปด้วย
                const upgradeBonus = 1 + (part.upgradeLevel * 0.1); // ตีบวก 1 เลเวล พลังชิ้นส่วนเพิ่ม 10%
                
                if (part.bonusStats) {
                    this.totalStats.str += Math.floor((part.bonusStats.str || 0) * upgradeBonus);
                    this.totalStats.agi += Math.floor((part.bonusStats.agi || 0) * upgradeBonus);
                    this.totalStats.int += Math.floor((part.bonusStats.int || 0) * upgradeBonus);
                    this.totalStats.vit += Math.floor((part.bonusStats.vit || 0) * upgradeBonus);
                    this.totalStats.dex += Math.floor((part.bonusStats.dex || 0) * upgradeBonus);
                }
            }
        }
    }

    /**
     * 🤝 ฟังก์ชันจับคู่หุ่นยนต์ตัวนี้เข้ากับตัวละคร (Player หรือ ทหารรับจ้าง)
     * @param {string} characterId - ID ของผู้เล่นหรือทหารรับจ้าง
     */
    linkToCharacter(characterId) {
        this.assignedTo = characterId;
        return { success: true, msg: `🔗 หุ่นยนต์ ${this.name} ถูกผูกมัดเข้ากับนักบิน ID: ${characterId} พร้อมออกศึก!` };
    }

    /**
     * 🔓 ยกเลิกการจับคู่หุ่นยนต์
     */
    unlinkCharacter() {
        this.assignedTo = null;
        return { success: true, msg: `🔓 แยกตัวหุ่นยนต์ออกจากนักบินเรียบร้อย กลับเข้าสู่สถานะว่างงาน` };
    }
}

// ==========================================
// 2. ระบบ Export รองรับทั้ง Node.js และ Blogspot HTML
// ==========================================
if (typeof exports !== 'undefined') {
    module.exports = { Mecha };
} else if (typeof window !== 'undefined') {
    window.Mecha = Mecha;
    console.log("🤖 [Mecha vs Mutant System] โหลดระบบประกอบหุ่นยนต์ทั้ง 9 ช่องเข้าสู่บล็อกสำเร็จ!");
}
