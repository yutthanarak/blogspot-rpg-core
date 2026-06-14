/**
 * Mecha vs Mutant - Vehicle & Cargo Logistics System
 * File: game-vehicles.js
 * Author: Yutthana Rakarayatham
 * Description: ระบบรถยนต์ คลังสินค้าผูกติดยานพาหนะ และระบบคำนวณการเดินรถตามสเปก
 */

// ==========================================
// 1. ตารางข้อกำหนดสเตตัสของรถยนต์แต่ละประเภท
// ==========================================
const VEHICLE_CONFIGS = {
    motorcycle: {
        name: "รถมอเตอร์ไซค์ 🏍️",
        cargoSlots: 40,
        price: 200,
        moveRange: 2
    },
    pickup: {
        name: "รถกระบะ 🛻",
        cargoSlots: 80,
        price: 1000,
        moveRange: 5
    },
    truck: {
        name: "รถบรรทุก 🚛",
        cargoSlots: 120,
        price: 3000,
        moveRange: 8
    },
    container_truck: {
        name: "รถหัวลากตู้คอนเทนเนอร์ 🦏",
        cargoSlots: 160,
        price: 5000,
        moveRange: 10
    },
    trailer_truck: {
        name: "รถหัวลากพ่วง 🦕",
        cargoSlots: 320,
        price: 10000,
        moveRange: 15
    }
};

// ==========================================
// 2. คลาสระบบรถและคลังสินค้า (Vehicle & Inventory Class)
// ==========================================
class Vehicle {
    /**
     * @param {string} vehicleKey - คีย์ชนิดรถ เช่น 'motorcycle', 'pickup'
     * @param {Array} existingCargo - (ตัวเลือก) ข้อมูลไอเทมเดิมในคลังจาก Firebase
     */
    constructor(vehicleKey, existingCargo = []) {
        const config = VEHICLE_CONFIGS[vehicleKey];
        if (!config) {
            throw new Error(`❌ ไม่พบประเภทรถคีย์ [${vehicleKey}] ในระบบเกม!`);
        }

        this.vehicleKey = vehicleKey;
        this.name = config.name;
        this.price = config.price;
        this.moveRange = config.moveRange; // ระยะวิ่งสูงสุดต่อเทิร์น (ช่อง)
        this.maxSlots = config.cargoSlots;  // จำนวนช่องเก็บของสูงสุดของรถคันนี้

        // คลังเก็บของ (Cargo Inventory) 
        // เก็บในรูปแบบ Array ของวัตถุไอเทม เช่น { id: 'iron_01', name: 'เศษเหล็ก', quantity: 5 }
        this.cargo = existingCargo;
    }

    /**
     * 📦 ฟังก์ชันเช็คจำนวนช่องที่ถูกใช้งานอยู่ปัจจุบัน
     */
    getUsedSlotsCount() {
        // คิดตามจำนวนรายการไอเทมที่อยู่ในคลัง (1 รายการ = 1 ช่อง)
        return this.cargo.length;
    }

    /**
     * 📥 ฟังก์ชันรับไอเทมเข้าท้ายรถ (ดรอปจากมอนสเตอร์ หรือซื้อจากร้านค้า)
     * @param {Object} item - วัตถุไอเทมที่ได้มา { id: '...', name: '...', quantity: 1 }
     */
    addItem(item) {
        // 1. ค้นหาว่าในรถมีไอเทมชิ้นนี้อยู่แล้วหรือยัง (ถ้ามีให้บวกจำนวนเพิ่มในช่องเดิม)
        const existingItem = this.cargo.find(i => i.id === item.id);
        
        if (existingItem) {
            existingItem.quantity += item.quantity;
            return { success: true, msg: `📥 เพิ่มจำนวน ${item.name} เข้าช่องเดิมเป็น ${existingItem.quantity} ชิ้น` };
        }

        // 2. ถ้าเป็นไอเทมชิ้นใหม่ ต้องเช็คก่อนว่าช่องเก็บของของรถเต็มหรือยัง
        if (this.getUsedSlotsCount() >= this.maxSlots) {
            return { 
                success: false, 
                msg: `⚠️ คลังท้ายรถเต็มแล้ว! รถ ${this.name} ของคุณบรรทุกได้สูงสุดแค่ ${this.maxSlots} ช่องเท่านั้น` 
            };
        }

        // 3. ช่องยังว่าง -> บันทึกไอเทมใหม่ลงคลังท้ายรถ
        this.cargo.push({
            id: item.id,
            name: item.name,
            quantity: item.quantity
        });

        return { 
            success: true, 
            msg: `📦 บรรทุก ${item.name} เข้าท้ายรถสำเร็จ! (ใช้ไปแล้ว ${this.getUsedSlotsCount()}/${this.maxSlots} ช่อง)` 
        };
    }

    /**
     * 📤 ฟังก์ชันนําของออกจากท้ายรถ (เช่น ตอนขายของ หรือส่งเควสต์)
     * @param {string} itemId - ID ของไอเทมที่ต้องการดึงออก
     * @param {number} amount - จำนวนที่ต้องการดึงออก
     */
    removeItem(itemId, amount = 1) {
        const itemIndex = this.cargo.findIndex(i => i.id === itemId);

        if (itemIndex === -1) {
            return { success: false, msg: "❌ ไม่พบไอเทมชิ้นนี้บนรถ!" };
        }

        const item = this.cargo[itemIndex];

        if (item.quantity < amount) {
            return { success: false, msg: `❌ ไอเทมมีไม่พอให้เอาออก! (บนรถมีอยู่ ${item.quantity} ชิ้น)` };
        }

        item.quantity -= amount;

        // ถ้าของหมดเกลี้ยงช่อง ให้ลบรายการออกจาก Array เพื่อคืนพื้นที่ช่องว่างให้รถ
        if (item.quantity === 0) {
            this.cargo.splice(itemIndex, 1);
        }

        return { 
            success: true, 
            msg: `📤 เอาของออกจากรถสำเร็จ คงเหลือในช่อง ${item.quantity || 0} ชิ้น`,
            remaining: item.quantity || 0
        };
    }

    /**
     * 🔄 ฟังก์ชันล้างคลังท้ายรถทั้งหมด (ล้างตู้คอนเทนเนอร์)
     */
    clearAllCargo() {
        this.cargo = [];
        return { success: true, msg: "🧹 ล้างสินค้าท้ายรถเกลี้ยงคลัง!" };
    }
}

// ==========================================
// 3. ระบบ Export รองรับทั้ง ESM และ Global Script บนหน้าเว็บ
// ==========================================
if (typeof exports !== 'undefined') {
    module.exports = { VEHICLE_CONFIGS, Vehicle };
} else if (typeof window !== 'undefined') {
    window.VEHICLE_CONFIGS = VEHICLE_CONFIGS;
    window.Vehicle = Vehicle;
    console.log("🚚 [Mecha vs Mutant Vehicle System] โหลดเข้าสู่คลังระบบรถและคลังสินค้าบน Blogspot สำเร็จ!");
}
