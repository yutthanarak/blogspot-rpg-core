// garage.js (เวอร์ชันล็อกอินด้วย ID + Password ในตัว)
import { ref, get, update, set } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

export class GarageManager {
    constructor(db) {
        this.db = db;
        this.resellRate = 0.7;
        this.playerRef = null;
        this.cachedData = null;
        
        this.vehicleDatabase = {
            none: { name: "เดินเท้าเปล่า 🏃", slots: 10, price: 0, range: 1 },
            motorcycle: { name: "รถมอเตอร์ไซด์ 🏍️", slots: 40, price: 200, range: 2 },
            pickup: { name: "รถกระบะ 🛻", slots: 80, price: 1000, range: 5 },
            truck: { name: "รถบรรทุก 🚛", slots: 120, price: 3000, range: 8 },
            container: { name: "รถหัวลากตู้คอนเทนเนอร์ 🫵", slots: 160, price: 5000, range: 10 },
            trailer: { name: "รถหัวลากพ่วง 🚛➕🛒", slots: 320, price: 10000, range: 15 }
        };
    }

    // 1. ฟังก์ชันโหลดเซฟอัตโนมัติ (ถ้าเคยล็อกอินค้างไว้)
    async loadPlayer(userId, onLoadCallback) {
        try {
            this.playerRef = ref(this.db, `players/${userId}`);
            const snapshot = await get(this.playerRef);
            if (snapshot.exists()) {
                this.cachedData = snapshot.val();
                if (onLoadCallback) onLoadCallback(this.cachedData);
                return this.cachedData;
            }
            if (onLoadCallback) onLoadCallback(null);
            return null;
        } catch (error) {
            console.error("Load Error:", error);
        }
    }

    // 2. ฟังก์ชันสมัครสมาชิก (ตรวจสอบ ID ซ้ำในเซิร์ฟเวอร์)
    async registerCompany(userId, password, selectedClass) {
        this.playerRef = ref(this.db, `players/${userId}`);
        const snapshot = await get(this.playerRef);
        
        if (snapshot.exists()) {
            return { success: false, msg: "❌ ชื่อ ID นี้มีคนใช้ไปแล้ว! โปรดใช้ชื่ออื่น" };
        }

        const initialData = {
            password: password, // บันทึกรหัสผ่านลงดาต้าเบสตรงๆ
            class: selectedClass, level: 1, exp: 0, gold: 2500, statPoints: 0, cargo_count: 0,
            stats: { str: 10, agi: 10, int: 10 }, current_vehicle: "none", max_slots: 10, move_range: 1
        };

        await set(this.playerRef, initialData);
        this.cachedData = initialData;
        return { success: true, data: initialData };
    }

    // 3. ฟังก์ชันเข้าสู่ระบบ (ตรวจ ID และ รหัสผ่าน)
    async loginCompany(userId, password) {
        this.playerRef = ref(this.db, `players/${userId}`);
        const snapshot = await get(this.playerRef);

        if (!snapshot.exists()) {
            return { success: false, msg: "❌ ไม่พบชื่อ ID นี้ในระบบ กรุณาสมัครสมาชิกก่อน" };
        }

        const data = snapshot.val();
        if (data.password !== password) {
            return { success: false, msg: "❌ รหัสผ่านไม่ถูกต้อง! ลองใหม่อีกครั้ง" };
        }

        this.cachedData = data;
        return { success: true, data: data };
    }

    // ฟังก์ชันซื้อรถ (เรียกใช้คลาสเดิม)
    async buyVehicle(vehicleKey) {
        const targetCar = this.vehicleDatabase[vehicleKey];
        let refund = 0;
        const oldVehicleKey = this.cachedData.current_vehicle;
        if (oldVehicleKey && oldVehicleKey !== 'none') {
            refund = Math.floor(this.vehicleDatabase[oldVehicleKey].price * this.resellRate);
        }
        this.cachedData.gold = this.cachedData.gold - targetCar.price + refund;
        this.cachedData.current_vehicle = vehicleKey;
        this.cachedData.max_slots = targetCar.slots;
        this.cachedData.move_range = targetCar.range;

        await update(this.playerRef, this.cachedData);
        return { success: true, refund: refund, carName: targetCar.name };
    }

    // ฟังก์ชันขายรถ (เรียกใช้คลาสเดิม)
    async sellVehicle(vehicleKey) {
        const targetCar = this.vehicleDatabase[vehicleKey];
        const refundValue = Math.floor(targetCar.price * this.resellRate);
        const fallbackCar = this.vehicleDatabase['none'];

        if (this.cachedData.cargo_count > fallbackCar.slots) {
            return { success: false, msg: `สินค้าล้นโกดัง! ขายรถไม่ได้` };
        }

        this.cachedData.gold += refundValue;
        this.cachedData.current_vehicle = 'none';
        this.cachedData.max_slots = fallbackCar.slots;
        this.cachedData.move_range = fallbackCar.range;

        await update(this.playerRef, this.cachedData);
        return { success: true, refund: refundValue };
    }

    async deleteCompany() {
        await set(this.playerRef, null);
        this.cachedData = null;
    }
}
