/**
 * Mecha vs Mutant - Dynamic Item Shop & Consignment System
 * File: game-itemshop.js
 * Author: Yutthana Rakarayatham
 * Description: คลาสบริหารจัดการร้านค้า NPC และระบบประเมินราคาฝากขายอัตโนมัติ (Rate 1-100) รองรับ 7 หมวดหมู่
 */

class ItemShop {
    constructor() {
        // 📦 หมวดหมู่สินค้าในร้านตามที่คุณยุทธนากำหนด
        this.categories = [
            "อาวุธ", 
            "ส่วนประกอบหุ่นยนต์", 
            "หุ่นยนต์สำเร็จรูป", 
            "energy core", 
            "card", 
            "รถ", 
            "อื่นๆ"
        ];

        // คลังสินค้าเกรด NPC สำหรับให้ผู้เล่นมาเลือกซื้อ
        this.npcProducts = [];

        // รายการสินค้าที่ผู้เล่นนำมาฝากขาย (สำหรับไอเท็ม Rate 4 ระดับ 76-100)
        this.consignmentList = [];
        
        // อัตราภาษีหัก ณ ที่จ่ายเมื่อขายสินค้าฝากขายได้
        this.taxRate = 0.07; // 7%
    }

    /**
     * ➕ เพิ่มสินค้าเกรด NPC เข้าชั้นวางของร้าน
     */
    addNPCProduct(item) {
        if (!this.categories.includes(item.category)) {
            item.category = "อื่นๆ";
        }
        this.npcProducts.push(item);
    }

    // ==========================================
    // 🛒 1. ฟังก์ชันฝั่งผู้เล่นซื้อสินค้าเกรด NPC
    // ==========================================
    buyNPCItem(productId, playerInstance) {
        const product = this.npcProducts.find(p => p.id === productId);
        if (!product) return { success: false, msg: "❌ ไม่พบสินค้าชิ้นนี้ในร้านค้า" };
        
        if (playerInstance.gold < product.npcPrice) {
            return { success: false, msg: "💸 ทองของคุณมีไม่พอสำหรับซื้อไอเท็มชิ้นนี้" };
        }

        // หักเงินผู้เล่นและส่งมอบไอเท็ม
        playerInstance.gold -= product.npcPrice;
        if (!playerInstance.inventory) playerInstance.inventory = [];
        playerInstance.inventory.push({ ...product });

        return { 
            success: true, 
            msg: `🛒 ซื้อ [${product.name}] เกรด NPC สำเร็จ! หักเงิน ${product.npcPrice} ทอง`,
            playerGold: playerInstance.gold
        };
    }

    // ==========================================
    // 💰 2. ฟังก์ชันระบบรับซื้อและการประเมินราคา (Rating 1-100)
    // ==========================================
    /**
     * @param {Object} item - อ็อบเจกต์ไอเท็มที่ผู้เล่นจะเอามาขาย
     * @param {number} rating - คะแนนประเมินของไอเท็ม (1 - 100)
     * @param {number} specialAttrValue - จำนวนเงินบวกเพิ่มจาก Attribute พิเศษ (ใช้กับ Rate 4)
     * @param {Object} playerInstance - ข้อมูลตัวละครผู้เล่น (ต้องมีคุณสมบัติ gold และ inventory)
     * @param {number} currentDay - วันปัจจุบันในเกม (เช่น วันที่ 1, วันที่ 2)
     */
    evaluateAndSellItem(item, rating, specialAttrValue = 0, playerInstance, currentDay = 1) {
        if (rating < 1 || rating > 100) {
            return { success: false, msg: "❌ ค่า Rating ต้องอยู่ระหว่าง 1 ถึง 100 เท่านั้น" };
        }

        const basePrice = item.npcPrice || 100;

        // ------ [Rate 1: คะแนน 1-25] รับซื้อราคา NPC ปกติ ------
        if (rating >= 1 && rating <= 25) {
            const finalPrice = basePrice;
            playerInstance.gold += finalPrice;
            this.removeItemFromInventory(item.id, playerInstance);
            return { success: true, type: "INSTANT_BUY", msg: `💰 [Rate 1] ร้านซื้อทันที: ได้รับ ${finalPrice} ทอง (ราคา NPC)` };
        }

        // ------ [Rate 2: คะแนน 26-50] ราคา NPC * 2 ------
        if (rating >= 26 && rating <= 50) {
            const finalPrice = basePrice * 2;
            playerInstance.gold += finalPrice;
            this.removeItemFromInventory(item.id, playerInstance);
            return { success: true, type: "INSTANT_BUY", msg: `💰 [Rate 2] ร้านซื้อทันที: ได้รับ ${finalPrice} ทอง (ราคา NPC x2)` };
        }

        // ------ [Rate 3: คะแนน 51-75] ราคา NPC * 5 ------
        if (rating >= 51 && rating <= 75) {
            const finalPrice = basePrice * 5;
            playerInstance.gold += finalPrice;
            this.removeItemFromInventory(item.id, playerInstance);
            return { success: true, type: "INSTANT_BUY", msg: `💰 [Rate 3] ร้านซื้อทันที: ได้รับ ${finalPrice} ทอง (ราคา NPC x5)` };
        }

        // ------ [Rate 4: คะแนน 76-100] ระบบฝากขายหน้าร้านอัจฉริยะ ------
        if (rating >= 76 && rating <= 100) {
            const initialPrice = (basePrice * 20) + specialAttrValue;
            
            // สร้างข้อมูลตั๋วฝากขายลงทะเบียนในร้านค้ารวมหมวดหมู่
            const consignmentTicket = {
                ticketId: "_" + Math.random().toString(36).substr(2, 9),
                item: item,
                rating: rating,
                specialAttrValue: specialAttrValue,
                listedDay: currentDay,
                originalPrice: initialPrice,
                currentPrice: initialPrice,
                status: "ON_SALE", // 'ON_SALE' (วัน 1-3), 'DISCOUNT_20' (วัน 4), 'NPC_BUYOUT' (วัน 5+)
                isSold: false
            };

            this.consignmentList.push(consignmentTicket);
            this.removeItemFromInventory(item.id, playerInstance);

            return { 
                success: true, 
                type: "CONSIGNMENT_LISTED", 
                msg: `🏬 [Rate 4] สินค้าเกรดเทพ! ตั้งการฝากขายหน้าร้านเรียบร้อย ราคาเริ่มต้น: ${initialPrice} ทอง (รอผู้ซื้อภายใน 3 วัน)`,
                ticket: consignmentTicket
            };
        }
    }

    // ==========================================
    // 🕒 3. ระบบจำลองเวลาและอัปเดตสถานะการขาย (Tick Days)
    // ==========================================
    /**
     * ฟังก์ชันนี้ควรเรียกใช้ทุกครั้งที่ผู้เล่น "เปลี่ยนวัน" หรือ "ผ่านไป 1 วัน" ในเกม
     * เพื่อคำนวณว่าของที่ฝากขายไว้ ขายออกหรือไม่ หรือต้องลดราคาตามเงื่อนไข
     */
    updateConsignmentStatus(currentDay, playerInstance) {
        let reports = [];

        this.consignmentList.forEach(ticket => {
            if (ticket.isSold) return; // ข้ามตัวที่ขายไปแล้ว

            const daysElapsed = currentDay - ticket.listedDay + 1; // นับวันรวมวันแรกที่ลงขาย

            // สุ่มโอกาสขายได้ต่อวัน (เช่น มีโอกาส 35% ที่ NPC หรือผู้เล่นอื่นในเนื้อเรื่องจะมาดึงของไป)
            const isSoldToday = Math.random() < 0.35; 

            // 🟢 เงื่อนไขภายใน 3 วันแรก
            if (daysElapsed <= 3) {
                if (isSoldToday) {
                    const tax = Math.floor(ticket.currentPrice * this.taxRate);
                    const finalProfit = ticket.currentPrice - tax;
                    
                    playerInstance.gold += finalProfit;
                    ticket.isSold = true;
                    ticket.status = "SOLD_NORMAL";
                    reports.push(`🎉 [ข่าวดี] ไอเท็ม [${ticket.item.name}] ขายได้ภายใน 3 วัน! ราคา ${ticket.currentPrice} ทอง (หักภาษี 7%: -${tax} ทอง) โอนเข้ากระเป๋าสำเร็จ: +${finalProfit} ทอง`);
                }
            } 
            // 🟡 เงื่อนไขวันที่ 4 (เกิน 3 วันมาแล้ว): SALE ลดราคา 20%
            else if (daysElapsed === 4) {
                if (ticket.status !== "DISCOUNT_20") {
                    ticket.status = "DISCOUNT_20";
                    ticket.currentPrice = Math.floor(ticket.originalPrice * 0.80); // ลดเหลือ 80%
                }

                if (isSoldToday) {
                    const tax = Math.floor(ticket.currentPrice * this.taxRate);
                    const finalProfit = ticket.currentPrice - tax;

                    playerInstance.gold += finalProfit;
                    ticket.isSold = true;
                    ticket.status = "SOLD_SALE";
                    reports.push(`🏷️ [ข่าวดี] ไอเท็ม ลดราคา [${ticket.item.name}] ขายได้แล้วในวันที่ 4! ราคาหักเซลส์: ${ticket.currentPrice} ทอง (หักภาษี 7%: -${tax} ทอง) เข้ากระเป๋า: +${finalProfit} ทอง`);
                }
            } 
            // 🔴 เงื่อนไขวันที่ 5 เป็นต้นไป (เกิน 4 วัน): ร้าน NPC บังคับซื้อปิดจ๊อบทันที ราคา NPC * 10
            else if (daysElapsed > 4) {
                const buyoutPrice = ticket.item.npcPrice * 10;
                playerInstance.gold += buyoutPrice;
                ticket.isSold = true;
                ticket.status = "NPC_BUYOUT";
                reports.push(`🏪 [หมดสัญญาฝากขาย] ไอเท็ม [${ticket.item.name}] ฝากขายเกิน 4 วัน ร้านค้า NPC จึงขอปิดดีลรับซื้อขาดในราคาพิเศษ (ราคา NPC x10) ได้รับเงินทันที: +${buyoutPrice} ทอง (ไม่มีหักภาษี)`);
            }
        });

        // ล้างตั๋วที่ขายได้แล้วออกจากลิสต์ที่ต้องคำนวณ เพื่อประหยัดแรมระบบ
        this.consignmentList = this.consignmentList.filter(t => !t.isSold);

        return reports;
    }

    /**
     * ฟังก์ชันภายใน: ลบไอเท็มออกจากกระเป๋าผู้เล่นเมื่อขายสำเร็จ
     */
    removeItemFromInventory(itemId, playerInstance) {
        if (playerInstance.inventory) {
            const index = playerInstance.inventory.findIndex(i => i.id === itemId);
            if (index !== -1) {
                playerInstance.inventory.splice(index, 1);
            }
        }
    }
}

// ==========================================
// 4. ระบบ Export รองรับ Node.js และเว็บเบราว์เซอร์
// ==========================================
if (typeof exports !== 'undefined') {
    module.exports = { ItemShop };
} else if (typeof window !== 'undefined') {
    window.ItemShop = ItemShop;
    console.log("🛒 [Mecha ItemShop] ระบบซื้อขายและสัญญารับฝากขายแยก 7 หมวดหมู่ ติดตั้งบนเว็บบล็อกสำเร็จ!");
}
