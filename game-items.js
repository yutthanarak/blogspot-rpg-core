/**
 * Mecha vs Mutant - Core Item Mechanics Class
 * File: game-items.js
 * Author: Yutthana Rakarayatham
 * Description: คลาสควบคุมโครงสร้างไอเท็ม ระบบ Stack ช่องเก็บของ และระบบคำนวณสเตตัสการตีบวกอุปกรณ์
 */

// ==========================================
// 1. คลาสหลักระบบไอเท็ม (Item Class)
// ==========================================
class Item {
    /**
     * @param {Object} itemData - ข้อมูลตั้งต้นของไอเท็มชิ้นนั้น ๆ
     */
    constructor(itemData = {}) {
        this.idItem = itemData.idItem || "item_unknown";                     // IDItem
        this.name = itemData.name || "ไอเท็มปริศนา";                         // ชื่อไอเท็ม
        this.type = itemData.type || "etc";                                  // ชนิด (เช่น 'weapon', 'armor', 'material', 'potion')
        this.maxStack = itemData.maxStack || 99;                             // จำนวนต่อ1ช่องเก็บของคลัง (เช่น ขยะดรอปได้ 99 ชิ้น/ช่อง, อาวุธได้ 1 ชิ้น/ช่อง)
        
        // ID คุณสมบัติ/ออฟชั่นเสริม (รองรับได้สูงสุด 3 ออฟชั่น)
        this.idAttribute1 = itemData.idAttribute1 || null;                   // ID_Attribute1
        this.idAttribute2 = itemData.idAttribute2 || null;                   // ID_Attribute2
        this.idAttribute3 = itemData.idAttribute3 || null;                   // ID_Attribute3
        
        this.upgradeLevel = itemData.upgradeLevel || 0;                     // Upgrade Level (ระดับการตีบวก เช่น +0, +1, +5)
        this.npcPrice = itemData.npcPrice || 0;                              // ราคาNPC (ราคาขายคืนให้ร้านค้า)
        this.imageUrl = itemData.imageUrl || "https://placehold.co/64x64.png"; // URLรูป
        this.sourceId = itemData.sourceId || "unknown";                      // IDแหล่งที่มา (เช่น IDมอนสเตอร์ที่ดรอป หรือ IDเควสต์ที่แจก)

        // จำนวนปัจจุบันของไอเท็มชิ้นนี้ในช่องเก็บของนั้น ๆ
        this.quantity = itemData.quantity || 1;
    }

    /**
     * ⚔️ ฟังก์ชันคำนวณราคาขายหรือค่าพลังเพิ่มขึ้นตามระดับการตีบวก (Upgrade Level)
     * ยิ่งตีบวกสูง ราคาของจะยิ่งแพงขึ้นตามสูตร
     */
    getDynamicPrice() {
        if (this.upgradeLevel === 0) return this.npcPrice;
        // สูตรเพิ่มราคาไอเท็มตามระดับการตีบวก: ราคาพื้นฐาน + (ระดับบวก * 25% ของราคาพื้นฐาน)
        return Math.floor(this.npcPrice * (1 + (this.upgradeLevel * 0.25)));
    }

    /**
     * 🔨 ฟังก์ชันสั่งอัปเกรดตีบวกไอเท็มชิ้นนี้
     * @param {number} levels - จำนวนระดับที่ต้องการเพิ่ม (ปกติเพิ่มทีละ 1)
     */
    upgrade(levels = 1) {
        // จำกัดให้ตีบวกได้เฉพาะไอเท็มประเภทอุปกรณ์สวมใส่เท่านั้น (พวกขยะหรือยาห้ามตีบวก)
        if (this.type !== 'weapon' && this.type !== 'armor' && this.type !== 'part') {
            return { success: false, msg: "❌ ไอเท็มชนิดนี้ไม่สามารถนำมาตีบวกได้ครับ!" };
        }
        
        this.upgradeLevel += levels;
        return { 
            success: true, 
            msg: `✨ ตีบวกสำเร็จ! [${this.name}] อัปเกรดเป็นระดับ +${this.upgradeLevel} แล้วครับ`,
            newLevel: this.upgradeLevel 
        };
    }

    /**
     * 📦 เช็คว่าช่องเก็บของสำหรับไอเท็มนี้เต็มความจุ Stack หรือยัง
     */
    isStackFull() {
        return this.quantity >= this.maxStack;
    }

    /**
     * ➕ เพิ่มจำนวนไอเท็มเข้าสู่ Stack ช่องนี้
     * @param {number} amount - จำนวนที่ได้เพิ่มมา
     */
    addQuantity(amount) {
        const spaceLeft = this.maxStack - this.quantity;
        if (amount <= spaceLeft) {
            this.quantity += amount;
            return { remaining: 0, added: amount }; // เก็บหมดเกลี้ยงในช่องเดียว
        } else {
            this.quantity = this.maxStack;
            return { remaining: amount - spaceLeft, added: spaceLeft }; // ช่องเต็ม ต้องเอาส่วนที่เหลือไปเปิดช่องใหม่
        }
    }
}

// ==========================================
// 2. ระบบ Export รองรับทั้ง Node.js และหน้าเว็บ Blogspot
// ==========================================
if (typeof exports !== 'undefined') {
    module.exports = { Item };
} else if (typeof window !== 'undefined') {
    window.Item = window.Item || Item;
    console.log("📦 [Mecha vs Mutant Item System] โหลดเข้าสู่ระบบคลาสไอเท็มบน Blogspot สำเร็จ!");
}
