export class SoundManager {
    constructor() {
        this.bgm = null;
    }

    // 🎵 ฟังก์ชันเปิดเพลงเบื้องหลังด่านแบบวนลูป
    playBGM(url) {
        if (this.bgm) this.bgm.pause(); // ปิดเพลงเก่าก่อนถ้ามี
        this.bgm = new Audio(url);
        this.bgm.loop = true;
        this.bgm.volume = 0.3; // เปิดคลอเบา ๆ ที่ความดัง 30%
        this.bgm.play().catch(e => console.log("เบราว์เซอร์บล็อกเสียง: ต้องรอผู้เล่นคลิกหน้าจอก่อน 1 ครั้ง"));
    }

    // 💥 ฟังก์ชันเล่นเสียงเอฟเฟกต์สั้น ๆ (เช่น เสียงยิงมิสไซล์, เสียงปุ่มกด)
    playSFX(url) {
        const sfx = new Audio(url);
        sfx.volume = 0.5; // ความดังเสียงเอฟเฟกต์ 50%
        sfx.play();
    }
}
