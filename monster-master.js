// monster-master.js
const PROFESSION_BONUSES = {
    swordsman:     { str: 6, agi: 4, int: 0, vit: 4, dex: 2, lux: 0 },
    shieldman:     { str: 3, agi: 1, int: 0, vit: 8, dex: 2, lux: 2 },
    gunner:        { str: 2, agi: 5, int: 1, vit: 1, dex: 6, lux: 1 },
    artillerist:   { str: 5, agi: 0, int: 6, vit: 2, dex: 3, lux: 0 },
    flamethrower:  { str: 4, agi: 2, int: 1, vit: 5, dex: 3, lux: 1 },
    mechanic:      { str: 1, agi: 2, int: 5, vit: 1, dex: 4, lux: 3 },
    villager:      { str: 0, agi: 0, int: 0, vit: 0, dex: 0, lux: 0 }
};

const TIER_BONUSES = {
    Normal:   { str: 0,  agi: 0,  int: 0,  vit: 0,  dex: 0,  lux: 0 },
    Elite:    { str: 10, agi: 10, int: 10, vit: 10, dex: 10, lux: 10 },
    Boss:     { str: 30, agi: 30, int: 30, vit: 30, dex: 30, lux: 30 },
    LastBoss: { str: 80, agi: 80, int: 80, vit: 80, dex: 80, lux: 80 }
};

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById('monsterForm');
    const previewElement = document.getElementById('statPreview');

    function calculateStats() {
        const profession = document.getElementById('monsterProfession').value;
        const tier = document.getElementById('monsterTier').value;

        const base = {
            str: parseInt(document.getElementById('baseStr').value) || 1,
            agi: parseInt(document.getElementById('baseAgi').value) || 1,
            int: parseInt(document.getElementById('baseInt').value) || 1,
            vit: parseInt(document.getElementById('baseVit').value) || 1,
            dex: parseInt(document.getElementById('baseDex').value) || 1,
            lux: parseInt(document.getElementById('baseLux').value) || 1
        };

        const pBonus = PROFESSION_BONUSES[profession] || PROFESSION_BONUSES.villager;
        const tBonus = TIER_BONUSES[tier] || TIER_BONUSES.Normal;

        return {
            str: base.str + pBonus.str + tBonus.str,
            agi: base.agi + pBonus.agi + tBonus.agi,
            int: base.int + pBonus.int + tBonus.int,
            vit: base.vit + pBonus.vit + tBonus.vit,
            dex: base.dex + pBonus.dex + tBonus.dex,
            lux: base.lux + pBonus.lux + tBonus.lux
        };
    }

    const inputsToWatch = ['monsterProfession', 'monsterTier', 'baseStr', 'baseAgi', 'baseInt', 'baseVit', 'baseDex', 'baseLux'];
    inputsToWatch.forEach(id => {
        const el = document.getElementById(id);
        if(el) {
            el.addEventListener('input', () => {
                const final = calculateStats();
                previewElement.innerText = `STR: ${final.str} | AGI: ${final.agi} | INT: ${final.int} | VIT: ${final.vit} | DEX: ${final.dex} | LUX: ${final.lux}`;
            });
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!window.appDB) {
            alert("❌ บันทึกไม่ได้: ยังเชื่อมต่อ Firebase ไม่สำเร็จ");
            return;
        }

        const dbRef = window.appDB.ref('master_monster_database');
        const name = document.getElementById('monsterName').value.trim();
        const thaiName = document.getElementById('monsterThaiName').value.trim();
        const profession = document.getElementById('monsterProfession').value;
        const tier = document.getElementById('monsterTier').value;
        const finalStats = calculateStats();

        const newMonsterRef = dbRef.push();
        const autoID = newMonsterRef.key;

        newMonsterRef.set({
            autoID: autoID,
            name: name,
            thaiName: thaiName,
            tier: tier,
            profession: profession,
            baseStats: finalStats
        })
        .then(() => {
            alert(`🎉 บันทึกสำเร็จ!\nAutoID: ${autoID}`);
            form.reset();
            ['baseStr', 'baseAgi', 'baseInt', 'baseVit', 'baseDex', 'baseLux'].forEach(id => document.getElementById(id).value = 1);
            previewElement.innerText = `STR: 1 | AGI: 1 | INT: 1 | VIT: 1 | DEX: 1 | LUX: 1`;
        })
        .catch(err => alert("เกิดปัญหาจากฝั่ง Firebase: " + err.message));
    });
});

window.addEventListener("load", () => {
    const listBody = document.getElementById('monsterListBody');
    if (!listBody || !window.appDB) return;

    window.appDB.ref('master_monster_database').on('value', (snapshot) => {
        listBody.innerHTML = '';
        if (!snapshot.exists()) {
            listBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">📭 ยังไม่มีข้อมูลมอนสเตอร์ในฐานข้อมูลหลัก</td></tr>`;
            return;
        }

        snapshot.forEach((childSnapshot) => {
            const monster = childSnapshot.val();
            const st = monster.baseStats || { str:1, agi:1, int:1, vit:1, dex:1, lux:1 };
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><code>${monster.autoID}</code></td>
                <td><strong>${monster.name}</strong><br><small style="color:#7f8c8d;">(${monster.thaiName})</small></td>
                <td><mark>${monster.profession}</mark></td>
                <td><span class="badge tier-${monster.tier}">${monster.tier}</span></td>
                <td>
                    <small style="background:#2c3e50; color:#fff; padding:2px 5px; border-radius:3px;">
                        S:${st.str} A:${st.agi} I:${st.int} V:${st.vit} D:${st.dex} L:${st.lux}
                    </small>
                </td>
                <td>
                    <button class="btn-delete" onclick="deleteMasterMonster('${monster.autoID}')">🗑️</button>
                </td>
            `;
            listBody.appendChild(tr);
        });
    });

    window.deleteMasterMonster = function(autoID) {
        if (confirm(`🚨 ยืนยันที่จะลบพิมพ์เขียวรหัส [${autoID}] หรือไม่?`)) {
            window.appDB.ref('master_monster_database').child(autoID).remove()
            .then(() => alert("ลบข้อมูลสำเร็จ"))
            .catch(err => alert("ผิดพลาด: " + err.message));
        }
    };
});
