/**
 * Mecha vs Mutant - Mercenary Recruitment & Barracks System
 * File: game-mercenary.js
 * Author: Yutthana Rakarayatham
 * Description: คลาสจัดการซุ้มทหารรับจ้าง สุ่มชื่อ ออโต้ ID กระจายสเตตัส 60 แต้ม และจำกัดทีมสูงสุด 10 นาย
 */

// ==========================================
// 1. คลาสข้อมูลทหารรับจ้างรายบุคคล (Mercenary Class)
// ==========================================
class Mercenary {
    constructor(playerLevel) {
        this.id = "merc_" + Math.random().toString(36).substr(2, 9).toUpperCase();
        this.name = this.generateRandomName();
        
        // สร้างเลเวลทหารให้พอเหมาะกับผู้เล่น (สุ่มเบี่ยงเบนจากเลเวลผู้เล่น -1 ถึง +2 แต่ขั้นต่ำคือเลเวล 1)
        const levelOffset = Math.floor(Math.random() * 4) - 1; 
        this.level = Math.max(1, playerLevel + levelOffset);

        // 📊 ระบบกระจายแต้ม Stat Point จำนวน 60 แต้มลงใน 4 ค่าหลัก
        this.stats = {
            attack: 0,
            defense: 0,
            speed: 0,
            vitality: 0
        };
        this.distributeStatPoints(60);

        // คำนวณราคาจ้างตามเลเวลและค่าพลังเฉลี่ย
        this.hireCost = this.level * 150 + Math.floor(Math.random() * 100);
    }

    /**
     * 🎲 ระบบสุ่มชื่อทหารสไตล์ไซไฟ-ทหารรับจ้าง
     */
    generateRandomName() {
        const prefixes = ["จ่า", "หมวด", "ผู้กอง", "ไซเฟอร์", "กันเนอร์", "เบลด", "สปาร์ตัน", "อาเรส", "โอดิน", "เคออส"];
        const suffixes = ["สายฟ้า", "เหล็กกล้า", "เงาทมิฬ", "หมาป่า", "โลกันตร์", "เดสทรอยเยอร์", "สไนเปอร์", "โอเมก้า", "วอร์คราย"];
        
        const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const randomSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        
        return `${randomPrefix} ${randomSuffix}`;
    }

    /**
     * 📊 อัลกอริทึมกระจายสเตตัสพอยท์ 60 แต้ม แบบสุ่มสลับฟันปลา
     */
    distributeStatPoints(totalPoints) {
        const statKeys = Object.keys(this.stats);
        
        // ให้ค่าตั้งต้นขั้นต่ำอย่างละ 5 แต้มก่อน เพื่อไม่ให้มีค่าใดค่าหนึ่งเป็น 0
        statKeys.forEach(key => {
            this.stats[key] = 5;
            totalPoints -= 5;
        });

        // ลูปสุ่มแจกแต้มที่เหลือจนกว่าจะหมด 60 แต้มพอดี
        while (totalPoints > 0) {
            const randomStat = statKeys[Math.floor(Math.random() * statKeys.length)];
            this.stats[randomStat]++;
            totalPoints--;
        }
    }
}

// ==========================================
// 2. คลาสซุ้มทหารรับจ้าง (Mercenary Camp Class)
// ==========================================
class MercenaryCamp {
    constructor() {
        this.maxSquadSize = 10;          // 🪖 จำกัดจำนวนทหารสูงสุดในทีม 10 นาย
        this.availableMercsInCamp = [];  // รายชื่อทหารที่แวะมานั่งรอในซุ้ม ณ ปัจจุบัน
    }

    /**
     * 🎪 รีเฟรชรายชื่อทหารที่เปิดให้จ้างในซุ้ม (เช่น มีทหารมาให้เลือก 3-4 นาย)
     * @param {number} playerLevel - เลเวลปัจจุบันของผู้เล่น เพื่อเอาไปคำนวณสเกลพลังทหาร
     */
    refreshCampMercenaries(playerLevel, count = 3) {
        this.availableMercsInCamp = [];
        for (let i = 0; i < count; i++) {
            this.availableMercsInCamp.push(new Mercenary(playerLevel));
        }
        return this.availableMercsInCamp;
    }

    /**
     * 🤝 ฟังก์ชันการจ้างทหารรับจ้างเข้าสังกัด
     * @param {string} mercId - ID ของทหารที่ต้องการจ้าง
     * @param {Object} playerInstance - อ็อบเจกต์ผู้เล่น (ต้องมีคุณสมบัติ gold และ mercenaries ย่อยภายใน)
     */
    hireMercenary(mercId, playerInstance) {
        // ตรวจสอบโครงสร้างข้อมูลผู้เล่นก่อน
        if (!playerInstance.mercenaries) playerInstance.mercenaries = [];

        // 1. ตรวจสอบว่าโควตาทีมเต็ม 10 นายแล้วหรือยัง
        if (playerInstance.mercenaries.length >= this.maxSquadSize) {
            return { 
                success: false, 
                msg: `🚷 ทีมทหารเต็มแล้ว (${this.maxSquadSize}/10 นาย)! โปรดปลดทหารคนเก่าออกก่อนจ้างคนใหม่` 
            };
        }

        // 2. ค้นหาตัวทหารในซุ้ม
        const mercIndex = this.availableMercsInCamp.findIndex(m => m.id === mercId);
        if (mercIndex === -1) {
            return { success: false, msg: "❌ ไม่พบทหารรับจ้างคนนี้ในซุ้มแล้ว (อาจจะย้ายไปเมืองอื่นแล้ว)" };
        }

        const mercenary = this.availableMercsInCamp[mercIndex];

        // 3. ตรวจสอบเงินทองของผู้เล่น
        if (playerInstance.gold < mercenary.hireCost) {
            return { success: false, msg: `💸 ทองไม่พอ! การจ้างนายทหารคนนี้ต้องใช้ ${mercenary.hireCost} ทอง` };
        }

        // 4. กระบวนการย้ายตัว: หักเงิน -> ดึงออกจากซุ้ม -> บรรจุเข้าทีมผู้เล่น
        playerInstance.gold -= mercenary.hireCost;
        this.availableMercsInCamp.splice(mercIndex, 1); // ลบออกจากกระดานซุ้ม
        playerInstance.mercenaries.push(mercenary);     // บรรจุเข้ากองทัพผู้เล่น

        return {
            success: true,
            msg: `🎖️ จ้าง [${mercenary.name}] (Lv.${mercenary.level}) เข้าสู่กองทัพสำเร็จ! หักเงิน ${mercenary.hireCost} ทอง`,
            playerGold: playerInstance.gold,
            squadCount: playerInstance.mercenaries.length
        };
    }

    /**
     * ❌ ฟังก์ชันปลดประจำการทหาร (Dismiss / Fire) เพื่อเคลียร์พื้นที่ว่าง
     * @param {string} mercId - ID ของทหารในทีมที่จะถูกไล่ออก
     * @param {Object} playerInstance - อ็อบเจกต์ผู้เล่น
     */
    dismissMercenary(mercId, playerInstance) {
        if (!playerInstance.mercenaries) return { success: false, msg: "❌ คุณยังไม่มีทหารในกองทัพเลย" };

        const index = playerInstance.mercenaries.findIndex(m => m.id === mercId);
        if (index === -1) {
            return { success: false, msg: "❌ ไม่พบทหารไอดีนี้ในกองทัพของคุณ" };
        }

        const firedMerc = playerInstance.mercenaries[index];
        playerInstance.mercenaries.splice(index, 1); // ลบออกจากอาร์เรย์ทีมผู้เล่น

        return {
            success: true,
            msg: `🚪 ปลดประจำการ [${firedMerc.name}] ออกจากกองทัพเรียบร้อย! คืนโควตาว่างในทีมให้แล้ว`,
            squadCount: playerInstance.mercenaries.length
        };
    }
}

// ==========================================
// 3. ระบบ Export รองรับ Node.js และเว็บเบราว์เซอร์หน้า Blogspot
// ==========================================
if (typeof exports !== 'undefined') {
    module.exports = { MercenaryCamp, Mercenary };
} else if (typeof window !== 'undefined') {
    window.MercenaryCamp = MercenaryCamp;
    window.Mercenary = Mercenary;
    console.log("🪖 [Mecha MercenaryCamp] ระบบซุ้มจ้างทหารและบริหารทีมสูงสุด 10 นาย พร้อมรบแล้ว!");
}
