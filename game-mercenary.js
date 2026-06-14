/**
 * Mecha vs Mutant - Mercenary Recruitment & Barracks System (RPG Stats Update)
 * File: game-mercenary.js
 * Author: Yutthana Rakarayatham
 * Description: คลาสจัดการซุ้มทหารรับจ้าง (เวอร์ชัน 6 สเตตัสหลัก: str, agi, int, vit, dex, lux)
 */

// ==========================================
// 1. คลาสข้อมูลทหารรับจ้างรายบุคคล (Mercenary Class)
// ==========================================
class Mercenary {
    constructor(playerLevel) {
        this.id = "merc_" + Math.random().toString(36).substr(2, 9).toUpperCase();
        
        // กำหนดอาชีพให้ทหารแบบสุ่ม
        this.profession = this.getRandomProfession();
        
        // สุ่มชื่อให้เข้ากับอาชีพ
        this.name = this.generateRandomName(this.profession);
        
        // สร้างเลเวลทหารให้พอเหมาะกับผู้เล่น (-1 ถึง +2 จากเลเวลผู้เล่น)
        const levelOffset = Math.floor(Math.random() * 4) - 1; 
        this.level = Math.max(1, playerLevel + levelOffset);

        // 📊 สเตตัส 6 ค่าหลักตามที่คุณยุทธนากำหนด [str, agi, int, vit, dex, lux]
        this.stats = {
            str: 0,
            agi: 0,
            int: 0,
            vit: 0,
            dex: 0,
            lux: 0
        };
        this.distributeClassicStatPoints(60);

        // คำนวณราคาจ้างตามเลเวล
        this.hireCost = this.level * 150 + Math.floor(Math.random() * 100);
    }

    /**
     * 🎲 สุ่มอาชีพที่มีในโลก Mecha
     */
    getRandomProfession() {
        const professions = [
            "Striker (หน่วยจู่โจม)", 
            "Defender (กองหลังโล่เหล็ก)", 
            "Sniper (พลซุ่มยิง)", 
            "Mechanic (ช่างกลซ่อมบำรุง)"
        ];
        return professions[Math.floor(Math.random() * professions.length)];
    }

    /**
     * 🎲 ระบบสุ่มชื่อทหารสไตล์ไซไฟ แบ่งตามความเหมาะสมของอาชีพ
     */
    generateRandomName(profession) {
        let prefixes = ["จ่า", "หมวด", "ผู้กอง"];
        let suffixes = [];

        if (profession.includes("Striker")) {
            suffixes = ["ดาบโลกันตร์", "เบลดสตรอม", "ชาโดว์", "ทะลวงฟัน"];
        } else if (profession.includes("Defender")) {
            suffixes = ["เหล็กกล้า", "กำแพงเมือง", "ไทแทน", "ป้อมปราการ"];
        } else if (profession.includes("Sniper")) {
            suffixes = ["ตาเหยี่ยว", "ไรเฟิลข้ามมิติ", "กระสุนสังหาร", "เงียบกริบ"];
        } else { // Mechanic
            suffixes = ["ประแจเหล็ก", "ไซเบอร์", "ฟิกเซอร์", "โอเวอร์คล็อก"];
        }
        
        const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const randomSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        
        return `${randomPrefix} ${randomSuffix}`;
    }

    /**
     * 📊 อัลกอริทึมกระจายสเตตัสคลาสสิก 60 แต้ม โดยอิงตามจุดเด่นของอาชีพ
     */
    distributeClassicStatPoints(totalPoints) {
        const statKeys = Object.keys(this.stats); // ['str', 'agi', 'int', 'vit', 'dex', 'lux']
        
        // ขั้นแรก: แจกขั้นต่ำให้ทุกค่า ค่าละ 5 แต้ม (6 สเตตัส x 5 = ใช้ไป 30 แต้ม เหลือ 30 แต้ม)
        statKeys.forEach(key => {
            this.stats[key] = 5;
            totalPoints -= 5;
        });

        // ขั้นที่สอง: เพิ่มโบนัสล็อกเฉพาะสายอาชีพเพื่อความเก่งที่แตกต่าง (ใช้เพิ่ม 14 แต้ม เหลือ 16 แต้มไปสุ่ม)
        if (this.profession.includes("Striker")) {
            this.stats.str += 9; // พลังโจมตีกายภาพหนักหน่วง
            this.stats.agi += 5; // ความเร็วในการออกตัว
        } else if (this.profession.includes("Defender")) {
            this.stats.vit += 10; // พลังชีวิตหนาแน่น
            this.stats.str += 4;  // ถือโล่และชุดเกราะหนักได้
        } else if (this.profession.includes("Sniper")) {
            this.stats.dex += 9; // ความแม่นยำสูงลิ่ว
            this.stats.lux += 5; // อัตราติดคริติคอล
        } else if (this.profession.includes("Mechanic")) {
            this.stats.int += 9; // ความฉลาดในการซ่อมและบัฟจักรกล
            this.stats.lux += 5; // โอกาสคราฟต์ของติดผลลัพธ์พิเศษ
        }
        totalPoints -= 14;

        // ขั้นสุดท้าย: แต้มที่เหลืออีก 16 แต้ม จับสุ่มกระจายสลับฟันปลาจนหมด 60 แต้มพอดี
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
        this.maxSquadSize = 10;          // จำกัดจำนวนทหารสูงสุดในทีม 10 นาย
        this.availableMercsInCamp = [];  // รายชื่อทหารที่นั่งรออยู่ในซุ้มขณะนั้น
        this.refreshCost = 50;           // ค่าใช้จ่ายในการกดปุ่มรีเฟรชสุ่มทหารใหม่ (50 ทอง)
    }

    /**
     * 🎪 รีเฟรชรายชื่อทหารในซุ้มฟรี (ใช้ตอนเข้าเมืองครั้งแรก หรือระบบรีเซ็ตวัน)
     */
    refreshCampMercenaries(playerLevel, count = 3) {
        this.availableMercsInCamp = [];
        for (let i = 0; i < count; i++) {
            this.availableMercsInCamp.push(new Mercenary(playerLevel));
        }
        return this.availableMercsInCamp;
    }

    /**
     * 🎲 ฟังก์ชันปุ่มกดรีเฟรชแบบเสียเงินทองของผู้เล่น
     */
    paidRefreshCamp(playerLevel, playerInstance, count = 3) {
        if (playerInstance.gold < this.refreshCost) {
            return { 
                success: false, 
                msg: `💸 ทองไม่พอ! การกดสุ่มรายชื่อทหารใหม่ต้องใช้ ${this.refreshCost} ทอง` 
            };
        }

        playerInstance.gold -= this.refreshCost;
        this.refreshCampMercenaries(playerLevel, count);

        return {
            success: true,
            msg: `🎲 จ่าย ${this.refreshCost} ทองเพื่อสุ่มหาทหารรับจ้างชุดใหม่เรียบร้อย!`,
            playerGold: playerInstance.gold,
            newMercs: this.availableMercsInCamp
        };
    }

    /**
     * 🤝 ฟังก์ชันการจ้างทหารรับจ้างเข้าสังกัด
     */
    hireMercenary(mercId, playerInstance) {
        if (!playerInstance.mercenaries) playerInstance.mercenaries = [];

        if (playerInstance.mercenaries.length >= this.maxSquadSize) {
            return { 
                success: false, 
                msg: `🚷 ทีมทหารเต็มแล้ว (${this.maxSquadSize}/10 นาย)! โปรดปลดทหารคนเก่าออกก่อน` 
            };
        }

        const mercIndex = this.availableMercsInCamp.findIndex(m => m.id === mercId);
        if (mercIndex === -1) {
            return { success: false, msg: "❌ ไม่พบทหารรับจ้างคนนี้ในซุ้มแล้ว" };
        }

        const mercenary = this.availableMercsInCamp[mercIndex];

        if (playerInstance.gold < mercenary.hireCost) {
            return { success: false, msg: `💸 ทองไม่พอ! ต้องใช้ ${mercenary.hireCost} ทอง` };
        }

        playerInstance.gold -= mercenary.hireCost;
        this.availableMercsInCamp.splice(mercIndex, 1);
        playerInstance.mercenaries.push(mercenary);

        return {
            success: true,
            msg: `🎖️ จ้าง [${mercenary.name}] สาย [${mercenary.profession}] เข้ากรมเรียบร้อย! หักเงิน ${mercenary.hireCost} ทอง`,
            playerGold: playerInstance.gold,
            squadCount: playerInstance.mercenaries.length
        };
    }

    /**
     * ❌ ฟังก์ชันปลดประจำการทหารออกเพื่อให้โควตากลับมาว่าง
     */
    dismissMercenary(mercId, playerInstance) {
        if (!playerInstance.mercenaries) return { success: false, msg: "❌ คุณยังไม่มีทหารเลย" };

        const index = playerInstance.mercenaries.findIndex(m => m.id === mercId);
        if (index === -1) {
            return { success: false, msg: "❌ ไม่พบทหารคนนี้ในกองทัพของคุณ" };
        }

        const firedMerc = playerInstance.mercenaries[index];
        playerInstance.mercenaries.splice(index, 1);

        return {
            success: true,
            msg: `🚪 ปลดประจำการ [${firedMerc.name}] แล้ว! คืนโควตาว่างให้ทีม`,
            squadCount: playerInstance.mercenaries.length
        };
    }
}

// ==========================================
// 3. ระบบ Export รองรับ Node.js และเว็บเบราว์เซอร์
// ==========================================
if (typeof exports !== 'undefined') {
    module.exports = { MercenaryCamp, Mercenary };
} else if (typeof window !== 'undefined') {
    window.MercenaryCamp = MercenaryCamp;
    window.Mercenary = Mercenary;
    console.log("🪖 [Mecha MercenaryCamp v3] อัปเดตโครงสร้าง 6 สเตตัสคลาสสิก [str, agi, int, vit, dex, lux] เรียบร้อย!");
}
