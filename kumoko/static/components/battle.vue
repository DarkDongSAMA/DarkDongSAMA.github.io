<template>
  <div>
    <div>
      <div>LV.{{ user.battle.lv }}</div>
      <div>EXP:{{ user.battle.exp }}</div>
      <div>HP:{{ user.battle.hp }}/{{ user.battle.maxHp }}</div>
      <div>MP:{{ user.battle.mp }}/{{ user.battle.maxMp }}</div>
      <div>ATK:{{ user.battle.atk }}</div>
      <div>DEF:{{ user.battle.def }}</div>
      <div>幸运:{{ user.battle.lucky }}</div>
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
        <span>|Lv.{{ item.lv }}</span>
        <span>|HP:{{ item.hp }}/{{ monster[item.id].hp }}</span>
        <button :disabled="inBattle" @click="doBattle(index)">战斗</button>
      </div>
    </div>
    <div v-if="inBattle">
      <div>战斗中</div>
      <div>
        {{ monsterList[selectBattle].name }} Lv.{{ monsterList[selectBattle].lv }} ({{
          monsterList[selectBattle].hp < 0 ? 0 : monsterList[selectBattle].hp
        }}/{{
          monster[monsterList[selectBattle].id].hp +
          monster[monsterList[selectBattle].id].grow * (monsterList[selectBattle].lv - 1)
        }})
      </div>
      <div style="width: 200px; display: flex; justify-content: space-between">
        <div>{{ monsterList[selectBattle].name }}</div>
        <div>{{ user.name }}</div>
      </div>
      <div>
        <button @click="playerAttack">攻击</button
        ><button
          v-for="(item, index) in user.battle.skill"
          :key="index"
          @click="playerSkill(item)"
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
      let randomNum = Math.random() * 1;
      if (randomNum <= rate) {
        let effect = skillDetail.effect;
        if (effect.atk) {
          let enemy = this.monsterList[this.selectBattle];
          let user = this.user.battle;
          let randomRate =
            Math.random() *
            (battleAtkMax + battleAtkMax - (battleAtkMin + battleAtkMax) + 1);
          randomRate = randomRate - battleAtkMax;
          let damage = user.atk + randomRate;
          enemy.hp = enemy.hp - damage;
          this.battleLog.push(
            `${this.user.name}使用了${skillDetail.name}，${enemy.name}受到${damage}点伤害`
          );
          this.judgeWin(enemy);
        }
      } else {
        this.battleLog.push(`${this.user.name}使用了${skillDetail.name}，但是没有命中`);
      }
    },
    judgeWin(enemy) {
      if (enemy.hp <= 0) {
        this.battleLog.push(`战斗胜利！`);
        let self = this;
        setTimeout(() => {
          self.monsterList.splice(self.selectBattle, 1);
          self.selectBattle = null;
          self.inBattle = false;
        }, 1000);
      } else {
        this.enemyAttack();
      }
    },
    playerAttack() {
      let enemy = this.monsterList[this.selectBattle];
      let user = this.user.battle;
      let randomRate =
        Math.random() * (battleAtkMax + battleAtkMax - (battleAtkMin + battleAtkMax) + 1);
      randomRate = randomRate - battleAtkMax;
      let damage = user.atk + randomRate;
      enemy.hp = enemy.hp - damage;
      this.battleLog.push(
        `${this.user.name}发起了攻击，${enemy.name}受到${damage}点伤害`
      );
      this.judgeWin(enemy);
    },
    enemyAttack() {
      let enemy = this.monsterList[this.selectBattle];
      let user = this.user.battle;
      user.hp = user.hp - enemy.atk;
      this.battleLog.push(
        `${enemy.name}发起了攻击，${this.user.name}受到${enemy.atk}点伤害`
      );
    },
    doBattle(index) {
      this.battleLog = [];
      this.inBattle = !this.inBattle;
      this.selectBattle = index;
      let randomNum = Math.random() * 1;
      if (randomNum <= 0.5) {
        this.enemyAttack();
      }
    },
  },
  mounted() {
    let list = [];
    for (let i = 0; i < 5; i++) {
      let randomNum = Math.random() * 1;
      if (randomNum <= 0.7) {
        let m = JSON.parse(JSON.stringify(monster[1]));
        let lv = Math.floor(Math.random() * 3) + 1;
        m.lv = lv;
        m.id = 1;
        m.hp = m.grow * (lv - 1) + m.hp;
        m.atk = m.grow * (lv - 1) + m.atk;
        m.def = m.grow * (lv - 1) + m.def;
        list.push(m);
      }
    }
    this.monsterList = list;
  },
};
</script>
<style scoped></style>
