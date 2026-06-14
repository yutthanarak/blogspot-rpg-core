/**
 * Mecha vs Mutant - Scene Sequencing, Node Drawing & Character Placement System
 * File: game-scene.js
 * Author: Yutthana Rakarayatham
 * Description: คลาสจัดการลำดับฉาก, คำนวณพิกัดสำหรับวาดจุดเชื่อมโยงใยแมงมุม (Canvas) และวางตำแหน่งตัวละคร/พาหนะ
 */

// ==========================================
// 1. คลาสจัดการข้อมูลสไปรท์ตัวละคร/รถ (Character Sprite Class)
// ==========================================
class CharacterSprite {
    /**
     * @param {string} id - ID ตัวละครหรือรถ
     * @param {string} name - ชื่อ
     * @param {string} imgUrl - ลิงก์รูปภาพตัวละคร (PNG โปร่งใส)
     */
    constructor(id, name, imgUrl) {
        this.id = id;
        this.name = name;
        this.imgUrl = imgUrl;
        
        // พิกัดปัจจุบันบนหน้าจอพิกเซล (X, Y)
        this.x = 0;
        this.y = 0;
        
        // พิกัดเป้าหมาย (สำหรับทำอนิเมชันเคลื่อนที่สไลด์แบบนุ่มนวล)
        this.targetX = 0;
        this.targetY = 0;
        this.speed = 0.1; // ความเร็วในการ Lerp (0.1 = ขยับทีละ 10% เข้าหาเป้าหมาย)

        this.imageLoaded = false;
        this.imageObj = null;
        this.initImage();
    }

    initImage() {
        if (typeof window !== 'undefined') {
            this.imageObj = new Image();
            this.imageObj.src = this.imgUrl;
            this.imageObj.onload = () => { this.imageLoaded = true; };
        }
    }

    /**
     * 🏃 อัปเดตตำแหน่งให้ค่อยๆ สไลด์ไปยังพิกัดเป้าหมาย (Linear Interpolation)
     */
    update() {
        this.x += (this.targetX - this.x) * this.speed;
        this.y += (this.targetY - this.y) * this.speed;
    }
}

// ==========================================
// 2. คลาสหลักในการควบคุมฉากและเรนเดอร์กราฟิก (Scene Manager Class)
// ==========================================
class SceneManager {
    constructor() {
        this.currentSceneState = "WORLD_MAP"; // สถานะฉากปัจจุบัน: 'WORLD_MAP', 'CUTSCENE', 'BATTLE_ROOM'
        this.sceneSequence = [];             // คิวสคริปต์ลำดับเหตุการณ์ (Cutscene Timeline)
        this.currentSequenceIndex = 0;

        // 🗺️ พิกัดคงที่ (Fix Coordinates) ของแต่ละห้องบนหน้าจอพิกเซล (Key: roomId -> Value: {x, y})
        this.roomCoordinates = {}; 
        
        // 👥 ที่เก็บอ็อบเจกต์ตัวละคร/รถที่กำลังแสดงผลบนจอ
        this.sprites = {}; 
    }

    // ==========================================
    // ลำดับฉาก & เนื้อเรื่อง (Scene Sequencing Section)
    // ==========================================

    /**
     * 🎬 ตั้งค่าคิวลำดับเหตุการณ์ภายในฉาก (เช่น ฉากบทสนทนาก่อนสู้บอส)
     * @param {Array<Object>} sequenceArray - ลิสต์ลำดับเหตุการณ์ 
     * ตัวอย่าง: [{ speaker: "ยุทธนา", text: "ข้างหน้ามีควันไฟเต็มไปหมด!" }, { action: "SPAWN_BOSS" }]
     */
    setCutsceneSequence(sequenceArray) {
        this.sceneSequence = sequenceArray;
        this.currentSequenceIndex = 0;
        this.currentSceneState = "CUTSCENE";
    }

    /**
     * ⏩ กดข้าม/ไปต่อในลำดับถัดไปของฉาก
     */
    nextSequence() {
        if (this.currentSequenceIndex >= this.sceneSequence.length - 1) {
            this.currentSceneState = "BATTLE_ROOM"; // จบบทสนทนา เข้าสู่ห้องต่อสู้จริง
            return { endOfSequence: true, msg: "สิ้นสุดฉากคัตซีน เข้าสู่โหมดต่อสู้!" };
        }
        this.currentSequenceIndex++;
        return { endOfSequence: false, currentStep: this.sceneSequence[this.currentSequenceIndex] };
    }

    // ==========================================
    // การฟิกตำแหน่งพิกัดและวาดเส้นเชื่อม (Canvas Mapping Section)
    // ==========================================

    /**
     * 📍 ฟิกพิกัด X, Y บนหน้าจอให้แต่ละห้อง (เช่น ให้ห้องกลางอยู่ที่ X:400, Y:300)
     */
    fixRoomCoordinate(roomId, screenX, screenY) {
        this.roomCoordinates[roomId] = { x: screenX, y: screenY };
    }

    /**
     * 🖌️ ⭐ ฟังก์ชันสำคัญ: วาดรูปจุดห้อง และลากเส้นเชื่อมโยงใยแมงมุมระหว่างห้อง
     * @param {CanvasRenderingContext2D} ctx - บริบทวาดรูปของ HTML5 Canvas
     * @param {Object} worldMapRooms - ข้อมูลห้องทั้งหมดจาก WorldMapManager.rooms
     */
    drawWorldMapGrid(ctx, worldMapRooms) {
        // ขั้นตอนที่ 1: ลากเส้นเชื่อมโยงระหว่างห้อง (ใยแมงมุม) ก่อน เพื่อให้อยู่เลเยอร์ด้านล่างจุดวงกลมห้อง
        ctx.strokeStyle = "rgba(255, 69, 0, 0.6)"; // เส้นเชื่อมสีส้มเพลิงธีมโลกถูกทำลาย
        ctx.lineWidth = 3;

        for (let rId in worldMapRooms) {
            const room = worldMapRooms[rId];
            const startCoords = this.roomCoordinates[rId];
            
            if (!startCoords) continue;

            // ตรวจสอบห้องเชื่อมโยงในแต่ละทิศทางเพื่อลากเส้นเชื่อมหาจากจุด (X1,Y1) ไปยัง (X2,Y2)
            const connectedDirections = [room.nextRoomTop, room.nextRoomBottom, room.nextRoomLeft, room.nextRoomRight];
            
            connectedDirections.forEach(nextId => {
                if (nextId && this.roomCoordinates[nextId]) {
                    const endCoords = this.roomCoordinates[nextId];
                    ctx.beginPath();
                    ctx.moveTo(startCoords.x, startCoords.y);
                    ctx.lineTo(endCoords.x, endCoords.y);
                    ctx.stroke();
                }
            });
        }

        // ขั้นตอนที่ 2: วาดรูปไอคอนหรือจุดวงกลมแสดงที่ตั้งห้อง
        for (let rId in worldMapRooms) {
            const room = worldMapRooms[rId];
            const coords = this.roomCoordinates[rId];
            if (!coords) continue;

            ctx.beginPath();
            ctx.arc(coords.x, coords.y, 16, 0, 2 * Math.PI); // รัศมีวงกลมห้อง 16 พิกเซล

            // เปลี่ยนสีตามชนิดของห้อง
            if (room.roomType === "rest_station") {
                ctx.fillStyle = "#32CD32"; // 🏠 สถานีพักแรม สีเขียวปลอดภัย
            } else if (room.roomType === "boss") {
                ctx.fillStyle = "#FF0000"; // 👹 ห้องบอส สีแดงอันตราย
            } else {
                ctx.fillStyle = room.isCleared ? "#A9A9A9" : "#FFD700"; // ⚔️ ห้องธรรมดา ผ่านแล้วสีเทา / ยังไม่ผ่านสีทอง
            }
            
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = "#FFFFFF";
            ctx.stroke();

            // วาดชื่อห้องกำกับไว้ด้านบนหัวจุดวงกลม
            ctx.fillStyle = "#FFFFFF";
            ctx.font = "14px Tahoma";
            ctx.textAlign = "center";
            ctx.fillText(room.roomName, coords.x, coords.y - 22);
        }
    }

    // ==========================================
    // การวางรูปตัวละคร (Character Placement Section)
    // ==========================================

    /**
     * 👥 ลงทะเบียนสไปรท์รูปตัวละคร/พาหนะ เข้ามาในระบบควบคุมฉาก
     */
    registerCharacterSprite(id, name, imgUrl) {
        this.sprites[id] = new CharacterSprite(id, name, imgUrl);
    }

    /**
     * 🚚 ⭐ ฟังก์ชันสั่งย้ายตำแหน่งตัวละครให้ไปสไลด์จอดตรงพิกัดห้องปัจจุบันของผู้เล่น
     * @param {string} spriteId - ID ตัวละครที่ต้องการขยับ
     * @param {string} roomId - ID ห้องเป้าหมายที่จะเอาตัวละครไปวาง
     * @param {number} offsetX - ค่าเบี่ยงเบนแนวนอน (เผื่อวางทหารรับจ้างเรียงต่อๆ กันไม่ให้ซ้อนกันเป๊ะ)
     * @param {number} offsetY - ค่าเบี่ยงเบนแนวตั้ง
     */
    placeCharacterAtRoom(spriteId, roomId, offsetX = 0, offsetY = 0) {
        const sprite = this.sprites[spriteId];
        const roomCoords = this.roomCoordinates[roomId];

        if (sprite && roomCoords) {
            // สั่งพิกัดเป้าหมาย (Target) ให้ระบบสไลด์ภาพทำงานขยับตามไปทีหลังแบบสมูท
            sprite.targetX = roomCoords.x + offsetX;
            sprite.targetY = roomCoords.y + offsetY;

            // หากเป็นการวางตัวครั้งแรกสุด ให้พิกัดจริงกระโดดไปเท่าพิกัดเป้าหมายทันที ไม่ต้องรอสไลด์
            if (sprite.x === 0 && sprite.y === 0) {
                sprite.x = sprite.targetX;
                sprite.y = sprite.targetY;
            }
        }
    }

    /**
     * 🎬 วาดภาพตัวละครทั้งหมดลงบนจอ Canvas และสั่งอัปเดตเฟรมอนิเมชันเคลื่อนไหว
     */
    drawAllSprites(ctx) {
        for (let id in this.sprites) {
            const sprite = this.sprites[id];
            sprite.update(); // ขยับพิกัดเข้าหาเป้าหมายทีละนิด (Lerp)

            if (sprite.imageLoaded && sprite.imageObj) {
                // วาดรูปภาพลงหน้าจอ (จัดให้อยู่ตรงกึ่งกลางพิกัดห้องพอดี โดยหักลบครึ่งหนึ่งของขนาดความกว้างภาพ เช่น รูปกว้าง 40x40)
                ctx.drawImage(sprite.imageObj, sprite.x - 20, sprite.y - 20, 40, 40);
            } else {
                // กรณีรูปภาพยังโหลดไม่เสร็จ ให้วาดสี่เหลี่ยมตัวแทนชั่วคราวขึ้นมาโชว์ก่อนเพื่อไม่ให้เกมพัง
                ctx.fillStyle = "#00FFFF";
                ctx.fillRect(sprite.x - 15, sprite.y - 15, 30, 30);
            }
        }
    }
}

// ==========================================
// 3. ระบบ Export รองรับ Node.js และเบราว์เซอร์หน้า Blogspot
// ==========================================
if (typeof exports !== 'undefined') {
    module.exports = { SceneManager, CharacterSprite };
} else if (typeof window !== 'undefined') {
    window.SceneManager = SceneManager;
    window.CharacterSprite = CharacterSprite;
    console.log("🎬 [Mecha SceneManager] ระบบฟิกพิกัด, วาดเส้นเชื่อมใยแมงมุม และวางรูปสไปรท์ตัวละคร พร้อมใช้งานบนเว็บบล็อก!");
}
