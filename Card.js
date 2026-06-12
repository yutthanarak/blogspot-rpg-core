export class Card {
    constructor(id, name, type, atk, hp, cost, imageUrl) {
        this.id = id;
        this.name = name;
        this.type = type;       // 'Mecha' หรือ 'Mutant'
        this.atk = atk;
        this.hp = hp;
        this.cost = cost;       // ค่าพลังงานที่ใช้ร่ายการ์ด
        this.imageUrl = imageUrl; // ลิงก์รูปภาพจาก Blogspot
    }

    // ฟังก์ชันเมื่อการ์ดใบนี้ถูกใช้โจมตีเป้าหมาย
    attack(target) {
        console.log(`💥 ${this.name} กำลังโจมตี ${target.name}!`);
        target.hp -= this.atk;
        if (target.hp <= 0) {
            target.hp = 0;
            return `${target.name} ถูกทำลายพังยับเยินแล้ว!`;
        }
        return `${target.name} โดนดาเมจ! เหลือ HP: ${target.hp}`;
    }
}
