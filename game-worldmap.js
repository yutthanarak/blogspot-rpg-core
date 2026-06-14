/**
 * Mecha vs Mutant - Advanced World Map & Vehicle Navigation System
 * File: game-worldmap.js
 * Author: Yutthana Rakarayatham
 * Description: ระบบแผนที่ใยแมงมุมแบบอสมมาตร, ระบบควบคุมระยะวิ่งของรถ, ล็อกการเดินด่านใหม่ และสถานีพักแรม
 */

// ==========================================
// 1. คลาสห้องต่อสู้และสถานีพัก (Battlefield & Station Room)
// ==========================================
class BattlefieldRoom {
    constructor(roomData = {}) {
        this.roomId = roomData.roomId || "room_unknown";
        this.roomName = roomData.roomName || "พื้นที่รกร้าง";
        this.roomType = roomData.roomType || "normal"; // 'normal', 'boss', 'rest_station' (สถานีพัก)
        this.zone = roomData.zone || "center"; 

        // เส้นทางเชื่อมโยง (ถ้าทิศไหนไปไม่ได้ให้ปล่อยเป็น null)
        this.nextRoomTop = roomData.nextRoomTop || null;
        this.nextRoomBottom = roomData.nextRoomBottom || null;
        this.nextRoomLeft = roomData.nextRoomLeft || null;
        this.nextRoomRight = roomData.nextRoomRight || null;

        this.monsterIds = roomData.monsterIds || []; 
        this.treasureBox = roomData.treasureBox || { isOpened: false, rewardItemIds: [] };
        
        // ถ้าเป็นสถานีพัก (rest_station) จะถือว่าผ่านด่านอัตโนมัติ (true) เพื่อให้รถวิ่งผ่านได้เลย
        this.isCleared = roomData.roomType === "rest_station" ? true : (roomData.isCleared || false);
    }

    /**
     * 🧭 ⭐ ฟังก์ชันเช็คทิศทางที่สามารถไปได้จากห้องนี้
     * @returns {Array<string>} คืนค่าอาเรย์ทิศทางที่เปิดอยู่ เช่น ['top', 'left']
     */
    getValidDirections() {
        const validPaths = [];
        if (this.nextRoomTop) validPaths.push('top');
        if (this.nextRoomBottom) validPaths.push('bottom');
        if (this.nextRoomLeft) validPaths.push('left');
        if (this.nextRoomRight) validPaths.push('right');
        return validPaths;
    }
}

// ==========================================
// 2. คลาสจัดการแผนที่โลกและการนำทาง (World Map & Navigation Manager)
// ==========================================
class WorldMapManager {
    constructor() {
        this.rooms = {};
        this.currentRoomId = "center_start";
        
        this.mapVisualTheme = {
            center: "ใจกลางโลกพังทลาย: บ้านเรือนถูกทำลาย ปกคลุมด้วยเขม่าควันไฟปะทุ",
            ice: "โซนเหนือ: ธารน้ำแข็งขั้วโลกปนเปื้อนกัมมันตภาพรังสี",
            jungle: "โซนใต้: ป่าดงดิบกลายพันธุ์และไอพิษ",
            desert: "โซนซ้าย: ทะเลทรายแห่งความตายและหลุมอุกกาบาต",
            ocean: "โซนขวา: มหาสมุทรสีเลือดและซากเรือรบ"
        };
    }

    registerRoom(roomInstance) {
        this.rooms[roomInstance.roomId] = roomInstance;
    }

    /**
     * 🚚 ⭐ ฟังก์ชันขับเคลื่อนรถย้ายห้อง (รองรับกฎการเดินหน้า/ถอยหลัง และพลังงานรถ)
     * @param {string} direction - ทิศทางที่จะไป ('top', 'bottom', 'left', 'right')
     * @param {Object} vehicleInstance - วัตถุรถของผู้เล่น (ต้องมีคุณสมบัติ remainingRange และ maxRange)
     */
    moveVehicle(direction, vehicleInstance) {
        const currentRoom = this.rooms[this.currentRoomId];
        if (!currentRoom) return { success: false, msg: "❌ ไม่พบข้อมูลห้องปัจจุบัน" };

        // 1. ตรวจสอบว่าทิศทางนั้นมีเส้นทางใยแมงมุมเชื่อมต่อหรือไม่
        const validDirections = currentRoom.getValidDirections();
        if (!validDirections.includes(direction.toLowerCase())) {
            return { success: false, msg: `🚫 ทิศ [${direction}] เป็นทางตันซากปรักหักพัง ไม่สามารถขับรถไปได้ครับ!` };
        }

        // ดึงข้อมูลห้องเป้าหมาย
        let nextRoomId = null;
        if (direction === 'top') nextRoomId = currentRoom.nextRoomTop;
        if (direction === 'bottom') nextRoomId = currentRoom.nextRoomBottom;
        if (direction === 'left') nextRoomId = currentRoom.nextRoomLeft;
        if (direction === 'right') nextRoomId = currentRoom.nextRoomRight;
        
        const targetRoom = this.rooms[nextRoomId];

        // 2. ตรวจสอบระยะวิ่งที่เหลือของรถ (Deduct Range Check)
        if (vehicleInstance.remainingRange <= 0) {
            return { success: false, msg: `⛽ [น้ำมันหมด/ระยะวิ่งเต็ม] รถของคุณวิ่งต่อไม่ไหวแล้ว ต้องเข้าสถานีพักเพื่อรีเซ็ตครับ!` };
        }

        // 3. ตรวจสอบกฎการเดินหน้าเข้าห้องใหม่ (Forward Match Locking)
        // กฎ: ถ้าห้องปัจจุบันยังไม่ผ่านด่าน (isCleared == false) จะไม่สามารถเดินหน้าไปห้องที่ยังไม่ผ่านด่านตัวอื่นต่อได้
        if (!currentRoom.isCleared && !targetRoom.isCleared) {
            return { 
                success: false, 
                msg: `⚔️ ต้องเคลียร์มอนสเตอร์ในห้อง [${currentRoom.roomName}] ให้ผ่านก่อน ถึงจะเดินหน้าลุยด่านถัดไปได้ครับ!` 
            };
        }

        // 4. ผ่านเงื่อนไขทั้งหมด -> ทำการย้ายห้องและหักระยะวิ่งของรถ 1 หน่วยต่อ 1 ด่าน
        this.currentRoomId = nextRoomId;
        vehicleInstance.remainingRange -= 1;

        let statusLog = `🚚 ขับรถเข้าสู่: [${targetRoom.roomName}] (ใช้พลังงานรถไป 1 หน่วย, เหลือระยะวิ่ง: ${vehicleInstance.remainingRange})`;

        // 5. ตรวจสอบหากเข้าสู่ "สถานีพักแรม (Rest Station)"
        if (targetRoom.roomType === "rest_station") {
            statusLog += `\n🏠 [เข้าสู่สถานีพักแรม] ปลอดภัยจากมอนสเตอร์! คุณสามารถ พักผ่อน, ซื้อขายไอเท็ม หรือทำกิจกรรมได้ที่นี่`;
        }

        return {
            success: true,
            msg: statusLog,
            roomType: targetRoom.roomType,
            roomInfo: targetRoom
        };
    }

    // ==========================================
    // 3. ระบบกิจกรรมประจำสถานีพัก (Station Activities)
    // ==========================================

    /**
     * 💤 กิจกรรมพักผ่อน: เติมพลังหุ่นยนต์ และรีเซ็ตเติมน้ำมันรถให้เต็มถังกลับสู่ Max Range
     */
    executeRestInStation(vehicleInstance, mechaInstance) {
        const currentRoom = this.rooms[this.currentRoomId];
        if (currentRoom.roomType !== "rest_station") {
            return { success: false, msg: "❌ คุณต้องอยู่ในห้องที่เป็นสถานีพักแรมเท่านั้นถึงจะทำกิจกรรมนี้ได้" };
        }

        // เติมพลังรถและหุ่นยนต์
        vehicleInstance.remainingRange = vehicleInstance.maxRange; 
        if (mechaInstance && mechaInstance.totalStats) {
            // สมมติว่าเติม HP หุ่นจนเต็ม (ฟังก์ชันเสริมผูกกับระบบคุณยุทธนา)
            mechaInstance.currentHp = mechaInstance.maxHp || 100;
        }

        return { 
            success: true, 
            msg: `🔋 พักผ่อนเติมพลังงานเสร็จสิ้น! ระยะวิ่งของรถ [${vehicleInstance.type}] เติมเต็มถังที่ ${vehicleInstance.maxRange} ช่อง พร้อมลุยต่อครับ!` 
        };
    }

    /**
     * 💰 กิจกรรมซื้อขายการ์ด/อะไหล่กับ NPC ประจำสถานี
     */
    executeTradeInStation(playerInstance, shopItem, actionType = 'buy') {
        const currentRoom = this.rooms[this.currentRoomId];
        if (currentRoom.roomType !== "rest_station") {
            return { success: false, msg: "❌ ซื้อขายได้เฉพาะที่สถานีพักแรมเท่านั้น" };
        }

        // ระบบหักเงินจำลอง (ผูกสเตตัสทองของผู้เล่น)
        if (actionType === 'buy') {
            if (playerInstance.gold < shopItem.price) {
                return { success: false, msg: "💸 เงินทองของคุณยุทธนาไม่พอซื้อไอเท็มชิ้นนี้ครับ!" };
            }
            playerInstance.gold -= shopItem.price;
            return { success: true, msg: `🛒 ซื้อ [${shopItem.name}] สำเร็จ! หักเงินไป ${shopItem.price} ทอง` };
        } else {
            // ขายของคืนร้าน
            playerInstance.gold += Math.floor(shopItem.price * 0.5);
            return { success: true, msg: `💰 ขาย [${shopItem.name}] คืนร้านสำเร็จ! ได้รับทองกลับมา` };
        }
    }
}

// ==========================================
// 4. ระบบ Export รองรับทั้ง Node.js และเบราว์เซอร์ Blogspot
// ==========================================
if (typeof exports !== 'undefined') {
    module.exports = { BattlefieldRoom, WorldMapManager };
} else if (typeof window !== 'undefined') {
    window.BattlefieldRoom = window.BattlefieldRoom || BattlefieldRoom;
    window.WorldMapManager = window.WorldMapManager || WorldMapManager;
    console.log("🗺️ [Mecha ADV-WorldMap] อัปเดตระบบเส้นทางอสมมาตร, ข้อจำกัดของรถ และสถานีพักแรมเสร็จสิ้น!");
}
