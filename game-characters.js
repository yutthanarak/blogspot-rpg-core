/**
 * Mecha vs Mutant - Core Character Mechanics Data & Classes (Updated: Level Up Bonus Points)
 * File: game-characters.js
 * Author: Yutthana Rakarayatham
 * Description: รวมระบบกำหนดสเตตัสอาชีพ คลาสโครงสร้าง Player / Monster พร้อมระบบโบนัสแต้มอัปสเตตัสอิสระ 5 แต้มเมื่อเวลอัป
 */

// ==========================================
// 1. ตารางข้อกำหนดสเตตัสและการเติบโตของแต่ละอาชีพ
// ==========================================
const JOB_CONFIGS = {
    swordsman: {
        jobName: "นักดาบ",
        base:   { str: 10, agi: 5,  int: 1,  vit: 5,  dex: 1,  lux: 1 },
        growth: { str: 5,  agi: 2,  int: 0,  vit: 2,  dex: 1,  lux: 0 },
        range: 1, aoe: 1
    },
    shieldman: {
        jobName: "นักโล่",
        base:   { str: 5,  agi: 1,  int: 5,  vit: 10, dex: 1,  lux: 1 },
        growth: { str: 2,  agi: 1,  int: 2,  vit: 5,  dex: 1,  lux: 0 },
        range: 1, aoe: 1
    },
    gunner: {
        jobName: "มือปืน",
        base:   { str: 1,  agi: 5,  int: 1,  vit: 5,  dex: 10, lux: 1 },
        growth: { str: 1,  agi: 2,  int: 0,  vit: 2,  dex: 5,  lux: 0 },
        range: 12, aoe: 1
    },
    cannoneer: {
        jobName: "ทหารปืนใหญ่",
        base:   { str: 5,  agi: 1,  int: 10, vit: 1,  dex: 5,  lux: 1 },
        growth: { str: 2,  agi: 0,  int: 5,  vit: 2,  dex: 2,  lux: 0 },
        range: 15, aoe: 4
    },
    flamethrower: {
        jobName: "มือปืนพ่นไฟ",
        base:   { str: 10, agi: 1,  int: 1,  vit: 5,  dex: 1,  lux: 1 },
        growth: { str: 5,  agi: 2,  int: 0,  vit: 2,  dex: 1,  lux: 0 },
        range: 3, aoe: 4
    },
    mechanic: {
        jobName: "นายช่าง",
        base:   { str: 1,  agi: 1,  int: 10, vit: 5,  dex: 5,  lux: 5 },
        growth: { str: 0,  agi: 0,  int: 5,  vit: 2,  dex: 2,  lux: 2 },
        range: 5, aoe: 1
    }
};

// ==========================================
// 2. คลาสแม่ร่วมกัน (Base Class: Character)
// ==========================================
class Character {
    constructor(id, name, characterType, jobKey) {
        this.id = id;                       
        this.name = name;                   
        this.characterType = characterType; 
        this.jobKey = jobKey;               
        
        const jobConfig = JOB_CONFIGS[jobKey];
        this.jobName = jobConfig ? jobConfig.jobName : "สิ่งมีชีวิตกลายพันธุ์"; 
        this.range = jobConfig ? jobConfig.range : 1;                         
        this.aoe = jobConfig ? jobConfig.aoe : 1;                             

        this.level = 1;                     
        this.stats = { str: 1, agi: 1, int: 1, vit: 1, dex: 1, lux: 1 };
        
        this.maxHp = 100;
        this.currentHp = 100;
        this.maxMp = 10;
        this.currentMp = 10;
        this.attackPower = 10;
        this.defense = 5;
    }

    /**
     * คำนวณค่าพลังต่อสู้จากสเตตัสหลักอัตโนมัติ
     */
    updateDerivedStats() {
        this.maxHp = this.stats.vit * 20 + this.stats.str * 5;
        this.maxMp = this.stats.int * 15;
        
        // คำนวณ ATK: ระยะเกิน 3 ช่อง (ยิงไกล) ใช้ DEX | ระยะประชิดใช้ STR
        this.attackPower = (this.range > 3) ? (this.stats.dex * 2.5) : (this.stats.str * 2.5);
        this.defense = this.stats.vit * 1.5 + this.stats.str * 0.5;
    }

    isDead() {
        return this.currentHp <= 0;
    }
}

// ==========================================
// 3. คลาสลูกฝั่งผู้เล่น (Subclass: Player)
// ==========================================
class Player extends Character {
    constructor(id, name, jobKey) {
        super(id, name, 'player', jobKey);

        const jobConfig = JOB_CONFIGS[jobKey];
        if (!jobConfig) {
            console.error(`❌ ไม่พบอาชีพคีย์ [${jobKey}]`);
            return;
        }

        this.stats = { ...jobConfig.base };
        
        this.exp = 0;             
        this.statusPoints = 0;    // แต้มสะสมสำหรับจัดสรรเอง
        this.gold = 2500;         
        this.vehicleId = "none";  
        
        this.updateDerivedStats();
        this.currentHp = this.maxHp;
        this.currentMp = this.maxMp;
    }

    /**
     * ระบบเพิ่ม EXP และตรวจสอบเลเวลอัป
     */
    gainExp(amount) {
        this.exp += amount;
        let expRequired = this.level * 100; 
        let isLeveledUp = false;

        while (this.exp >= expRequired) {
            this.exp -= expRequired;
            this.levelUp();
            expRequired = this.level * 100;
            isLeveledUp = true;
        }
        return isLeveledUp;
    }

    /**
     * ฟังก์ชันจัดการเมื่อเลเวลเพิ่มขึ้น 1 เลเวล
     */
    levelUp() {
        this.level += 1;
        
        // ⭐ เพิ่มเติมตามสั่ง: รับโบนัส Status Point เพิ่มอีก 5 แต้มต่อเลเวลเอาไว้กดอัปเอง
        this.statusPoints += 5; 
        
        // บดสเตตัสเพิ่มอัตโนมัติตามสเปกการเติบโตของสายอาชีพนั้น ๆ
        const growth = JOB_CONFIGS[this.jobKey].growth;
        if (growth) {
            this.stats.str += growth.str;
            this.stats.agi += growth.agi;
            this.stats.int += growth.int;
            this.stats.vit += growth.vit;
            this.stats.dex += growth.dex;
            this.stats.lux += growth.lux;
        }

        // รีเฟรชพลังชีวิตและคำนวณพลังต่อสู้ใหม่จากสเตตัสที่อัปขึ้นมา
        this.updateDerivedStats();
        this.currentHp = this.maxHp; 
        this.currentMp = this.maxMp;
        console.log(`🎉 เลเวลอัปเป็น Lv.${this.level}! สเตตัสอาชีพเพิ่มขึ้นอัตโนมัติ และได้รับโบนัสสำหรับจัดสรรเอง 5 แต้ม (แต้มสะสมทั้งหมด: ${this.statusPoints} แต้ม)`);
    }

    /**
     * 🛠️ เพิ่มเติม: ฟังก์ชันสำหรับให้ผู้เล่นกดคลิกอัปสเตตัสเองที่หน้าจอ UI บล็อก
     * @param {string} statName - ชื่อสเตตัสที่ต้องการอัป เช่น 'str', 'agi', 'vit'
     * @param {number} pointsToAllocate - จำนวนแต้มที่ต้องการอัป (ปกติกดทีละ 1 แต้ม)
     */
    allocateStatusPoint(statName, pointsToAllocate = 1) {
        if (this.statusPoints < pointsToAllocate) {
            return { success: false, msg: "❌ แต้มโบนัสคงเหลือไม่เพียงพอครับ!" };
        }
        if (!this.stats.hasOwnProperty(statName)) {
            return { success: false, msg: "❌ ไม่พบคุณสมบัติสเตตัสนี้ในระบบ!" };
        }

        // หักแต้มโบนัส และเพิ่มเข้าคุณสมบัติที่เลือก
        this.statusPoints -= pointsToAllocate;
        this.stats[statName] += pointsToAllocate;

        // คำนวณพลังโจมตี/เลือดใหม่หลังจากอัปแต้มเองมือ
        this.updateDerivedStats();
        
        return { 
            success: true, 
            msg: `💪 อัปค่า ${statName.toUpperCase()} สำเร็จ เพิ่มขึ้น +${pointsToAllocate} แต้ม!`,
            currentStatValue: this.stats[statName],
            remainingPoints: this.statusPoints
        };
    }
}

// ==========================================
// 4. คลาสลูกฝั่งมอนสเตอร์ (Subclass: Monster)
// ==========================================
class Monster extends Character {
    constructor(id, name, isBoss, customStats, rewardGold, rewardExp, dropItems = []) {
        super(id, name, 'monster', null);
        
        this.isBoss = isBoss; 
        this.level = customStats.level || 1;
        
        this.stats = {
            str: customStats.str || 5,
            agi: customStats.agi || 5,
            int: customStats.int || 1,
            vit: customStats.vit || 5,
            dex: customStats.dex || 1,
            lux: customStats.lux || 1
        };

        this.dropGold = rewardGold; 
        this.dropExp = rewardExp;   
        
        this.dropItems = dropItems.slice(0, 5);
        while (this.dropItems.length < 5) {
            this.dropItems.push(null); 
        }

        this.updateDerivedStats();
        this.currentHp = this.maxHp;
        this.currentMp = this.maxMp;
    }

    rollLoots() {
        const availableLoots = this.dropItems.filter(item => item !== null);
        if (availableLoots.length === 0) return null;
        
        const randomIndex = Math.floor(Math.random() * availableLoots.length);
        return availableLoots[randomIndex];
    }
}

// ==========================================
// 5. ระบบ Export รองรับทั้ง ESM และ Global Script
// ==========================================
if (typeof exports !== 'undefined') {
    module.exports = { JOB_CONFIGS, Player, Monster };
} else if (typeof window !== 'undefined') {
    window.JOB_CONFIGS = JOB_CONFIGS;
    window.Player = Player;
    window.Monster = Monster;
    console.log("🎮 [Mecha vs Mutant] อัปเดตระบบโบนัสสเตตัสเวลอัปเข้าสู่เบราว์เซอร์แล้ว!");
}
