<template>
  <div>
    <div>
      <div>LV.{{ user.battle.lv }}</div>
      <div>EXP:{{ user.battle.exp }} / {{ levelInfo[user.battle.lv + 1] }}</div>
      <div style="display: flex; align-items: center">
        HP: {{ Math.round(user.battle.hp) }} / {{ user.battle.maxHp }}
        <div class="hpBorder">
          <div
            style="height: 100%; transition: width 0.1s, background 0.1s"
            :style="{
              width: (user.battle.hp / user.battle.maxHp) * 100 + '%',
              background:
                user.battle.hp / user.battle.maxHp >= 0.5
                  ? 'green'
                  : user.battle.hp / user.battle.maxHp >= 0.2
                  ? 'orange'
                  : 'red',
            }"
          ></div>
        </div>
      </div>
      <div>MP:{{ user.battle.mp }}/{{ user.battle.maxMp }}</div>
      <!-- <div>ATK:{{ user.battle.atk }}</div>
      <div>DEF:{{ user.battle.def }}</div>
      <div>幸运:{{ user.battle.lucky }}</div> -->
      <div>
        技能:<span v-for="(item, index) in user.battle.skill" :key="index"
          >|{{ skillList[item].name }}({{
            battleTypeList[skillList[item].type].name
          }})|</span
        >
      </div>
      <div>装备:{{ user.battle.wear }}</div>
    </div>
    <div v-if="!inBattle">
      <div v-for="(item, index) in monsterList" :key="index">
        <span>{{ item.name }}</span>
        <span>|Lv.{{ item.lv }}|</span>
        <button :disabled="inBattle" @click="doBattle(index)">战斗</button>
      </div>
    </div>
    <div v-if="inBattle">
      <div>战斗中</div>
      <div style="width: 200px; display: flex; justify-content: space-between">
        <div>
          Lv.{{ monsterList[selectBattle].lv }} {{ monsterList[selectBattle].name }}
          <div class="hpBorder">
            <div
              style="height: 100%; transition: width 0.1s, background 0.1s"
              :style="{
                width:
                  ((monsterList[selectBattle].hp < 0 ? 0 : monsterList[selectBattle].hp) /
                    monsterList[selectBattle].maxHp) *
                    100 +
                  '%',
                background:
                  (monsterList[selectBattle].hp < 0 ? 0 : monsterList[selectBattle].hp) /
                    monsterList[selectBattle].maxHp >=
                  0.5
                    ? 'green'
                    : (monsterList[selectBattle].hp < 0
                        ? 0
                        : monsterList[selectBattle].hp) /
                        monsterList[selectBattle].maxHp >=
                      0.2
                    ? 'orange'
                    : 'red',
              }"
            ></div>
          </div>
        </div>
        <div>{{ user.name }}</div>
      </div>
      <div>
        <button @click="playerAttack">攻击</button
        ><button
          v-for="(item, index) in user.battle.skill"
          :key="index"
          @click="playerSkill(item)"
          :disabled="user.battle.mp < skillList[item].mp"
        >
          {{ skillList[item].name }}
        </button>
      </div>
      <div>
        <div v-for="(item, index) in battleLog" :key="index">{{ item }}</div>
      </div>
    </div>
  </div>
</template>
<script>
module.exports = {
  name: "battlePage",
  props: {
    user: Object,
  },
  data() {
    return {
      monsterList: [],
      selectBattle: null,
      inBattle: false,
      battleLog: [],
    };
  },
  methods: {
    playerSkill(item) {
      let skillDetail = skillList[item];
      let rate = skillDetail.rate;
      let user = this.user.battle;
      user.mp = user.mp - skillDetail.mp;
      let randomNum = Math.random() * 1;
      if (randomNum <= rate) {
        let effect = skillDetail.effect;
        this.battleLog.push(` ${this.user.name} 使用了 ${skillDetail.name} `);
        if (effect.atk) {
          let enemy = this.monsterList[this.selectBattle];
          if (!this.luckyCalculate(enemy.lucky, user.lucky)) {
            let atk = this.attackCalculate(
              user.lv,
              user.atk + user.atk * effect.atk,
              user.def
            );
            let typeDamage = this.attackTypeJudge(skillDetail.type, enemy.type);
            let cs = !this.luckyCalculate(enemy.lucky, user.lucky) ? 1 : scDamage;
            if (cs != 1) {
              this.battleLog.push(`会心一击！`);
            }
            enemy.hp = enemy.hp - atk * typeDamage * cs;
          } else {
            this.battleLog.push(`但是 ${enemy.name} 躲开了`);
          }
          this.judgeWin(enemy);
        }
      } else {
        this.battleLog.push(
          ` ${this.user.name} 使用了 ${skillDetail.name} ，但是没有命中`
        );
      }
    },
    judgeLose(user) {
      if (user.hp <= 0) {
        user.hp = 0;
        this.battleLog.push(`${this.user.name}倒下了`);
        this.battleLog.push(`${this.user.name}的眼前一黑`);
        let self = this;
        setTimeout(() => {
          self.selectBattle = null;
          self.inBattle = false;
          addTime(3, self);
          user.hp = user.maxHp;
          user.mp = user.maxMp;
          this.initMonster();
        }, 1000);
      }
    },
    judgeWin(enemy) {
      if (enemy.hp <= 0) {
        this.battleLog.push(`战斗胜利！`);
        let exp = expCaculate(enemy.exp, this.user.battle.lv, enemy.lv);
        this.battleLog.push(`获得 ${exp} 点经验`);
        let isLevelUp = levelCaculate(exp, this.user.battle);
        if (isLevelUp) {
          let user = this.user.battle;
          this.battleLog.push(`升级了！`);
          this.battleLog.push(`hp => ${user.maxHp}`);
          this.battleLog.push(`mp => ${user.maxMp}`);
          this.battleLog.push(`攻击 => ${user.atk}`);
          this.battleLog.push(`防御 => ${user.def}`);
          this.battleLog.push(`幸运 => ${user.lucky}`);
        }
        if (enemy.drop.length > 0) {
          let randomNum = Math.random() * 1;
          let prize = maxPerFn(randomNum, enemy.drop);
          if (prize) {
            let str = `${itemList[prize.id].name[prize.rare == 0 ? 0 : prize.rare]}(${
              rareList[itemList[prize.id].rare[prize.rare]]
            })x1`;
            this.battleLog.push(`获得 ${str}`);
            addItem(prize.id, 1, prize.rare, this);
          }
        }
        let self = this;
        setTimeout(() => {
          self.monsterList.splice(self.selectBattle, 1);
          self.selectBattle = null;
          self.inBattle = false;
        }, 2000);
      } else {
        this.enemyAttack();
      }
    },
    // 判断属性克制
    attackTypeJudge(attackType, defendType) {
      let atkInfo = battleTypeList[attackType];
      let damage = 1;
      // 判断有效
      if (atkInfo.effective.indexOf(defendType) > -1) {
        damage = 2;
        this.battleLog.push(`效果拔群！`);
      }
      // 判断抵抗
      else if (atkInfo.resist.indexOf(defendType) > -1) {
        damage = 0.5;
        this.battleLog.push(`好像效果不是很好`);
      }
      // 判断无效
      else if (atkInfo.invalid.indexOf(defendType) > -1) {
        damage = 0;
        this.battleLog.push(`没有效果……`);
      }
      return damage;
    },
    // 伤害计算
    attackCalculate(lv, atk, def) {
      let randomRate = Math.random() * battleAtkPer;
      let damage = (lv / 10) * (atk / def) * randomRate;
      return atk + damage;
    },
    // 闪避/暴击判断
    luckyCalculate(lc1, lc2) {
      let newLuck = (2 / Math.PI) * Math.atan(Math.log10(lc1 - lc2 + 1)) * 0.5;
      let randomNum = Math.random() * 1;
      if (randomNum < newLuck && newLuck != 0) {
        return true;
      } else if (newLuck == 0) {
        let randomLuck = Math.random() * 1;
        let newRandomLuck = (2 / Math.PI) * Math.atan(randomLuck) * 0.5;
        let newRandomNum = Math.random() * 1;
        if (newRandomNum < newRandomLuck) {
          return true;
        }
      }
      return false;
    },
    playerAttack() {
      let enemy = this.monsterList[this.selectBattle];
      let user = this.user.battle;
      this.battleLog.push(`${this.user.name} 发起了攻击`);
      if (!this.luckyCalculate(user.lucky, enemy.lucky)) {
        let atk = this.attackCalculate(user.lv, user.atk, user.def);
        let typeDamage = this.attackTypeJudge(
          !user.wear ? 6 : user.wear.type,
          enemy.type
        );
        let cs = !this.luckyCalculate(user.lucky, enemy.lucky) ? 1 : scDamage;
        if (cs != 1) {
          this.battleLog.push(`会心一击！`);
        }
        enemy.hp = enemy.hp - atk * typeDamage * cs;
      } else {
        this.battleLog.push(`但是 ${enemy.name} 躲开了`);
      }
      this.judgeWin(enemy);
    },
    enemyAttack() {
      let enemy = this.monsterList[this.selectBattle];
      let user = this.user.battle;
      this.battleLog.push(`${enemy.name} 发起了攻击`);
      if (!this.luckyCalculate(enemy.lucky, user.lucky)) {
        let atk = this.attackCalculate(enemy.lv, enemy.atk, enemy.def);
        let typeDamage = this.attackTypeJudge(
          enemy.type,
          !user.wear ? 6 : user.wear.type
        );
        let cs = !this.luckyCalculate(enemy.lucky, user.lucky) ? 1 : scDamage;
        if (cs != 1) {
          this.battleLog.push(`会心一击！`);
        }
        user.hp = user.hp - atk * typeDamage * cs;
      } else {
        this.battleLog.push(`但是 ${this.user.name} 躲开了`);
      }
      this.judgeLose(user);
    },
    doBattle(index) {
      this.battleLog = [];
      this.inBattle = !this.inBattle;
      this.selectBattle = index;

      let enemy = this.monsterList[this.selectBattle];
      let user = this.user.battle;
      if (user.lucky < enemy.lucky) {
        this.enemyAttack();
      } else if (user.lucky == enemy.lucky) {
        let randomNum = Math.random() * 1;
        if (randomNum <= 0.5) {
          this.enemyAttack();
        }
      }
    },
    initMonster() {
      let list = [];
      for (let i = 0; i < 5; i++) {
        let randomNum = Math.random() * 1;
        if (randomNum <= 0.7) {
          let m = JSON.parse(JSON.stringify(monster[1]));
          let lv = Math.floor(Math.random() * 3) + 1;
          m.lv = lv;
          m.id = 1;
          m.hp = m.grow * (lv - 1) + m.hp;
          m.maxHp = m.hp;
          m.atk = m.grow * (lv - 1) + m.atk;
          m.def = m.grow * (lv - 1) + m.def;
          m.exp = m.exp;
          m.lucky = m.grow * (lv - 1) + m.lucky;
          list.push(m);
        }
      }
      this.monsterList = list;
    },
  },
  mounted() {
    this.initMonster();
  },
};
</script>
<style scoped>
.hpBorder {
  height: 5px;
  width: 100px;
  border: 1px solid #dddddd;
  border-radius: 10px;
  overflow: hidden;
}
</style>
