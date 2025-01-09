<template>
  <div>
    <div style="color: red">Tips:每日浇水农作物才会生长</div>
    <div style="display: flex">
      <div
        v-for="(item, index) in seedList"
        :key="index"
        style="cursor: pointer"
        :style="selectedSeed == index ? 'color:blue' : ''"
        @click="selectSeed(index)"
      >
        |{{ itemList[item.id].name[item.rare] }}({{
          rareList[itemList[item.id].rare[item.rare]]
        }})x{{ item.num }}|
      </div>
    </div>
    <div v-for="(item, index) in farmTable" :key="index" style="display: flex">
      <div
        v-for="(it, idx) in item"
        :key="idx"
        class="farm-block"
        :class="it != 0 && it.hasWater ? 'blue' : ''"
        @click="doFarming(index, idx)"
        :title="`${it == 0 ? '空地' : itemList[it.seed].name[it.rare]}(${
          it == 0 ? '' : rareList[itemList[it.seed].rare[it.rare]]
        }|剩余${it != 0 ? it.time : ''}小时)`"
      >
        {{ it == 0 ? "" : itemList[it.seed].name[it.rare].slice(0, 1) }}
      </div>
    </div>
  </div>
</template>
<script>
module.exports = {
  name: "farmPage",
  props: {
    user: Object,
  },
  data() {
    return {
      seedList: [],
      selectedSeed: null,
      farmTable: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ],
    };
  },
  methods: {
    // 种地/收获
    doFarming(fIdx, cIdx) {
      if (this.selectedSeed == null && this.farmTable[fIdx][cIdx] == 0) {
        return;
      }
      if (this.farmTable[fIdx][cIdx] != 0) {
        let index = this.user.farm.findIndex((e) => {
          return e.position[0] == fIdx && e.position[1] == cIdx;
        });
        let field = this.user.farm[index];
        if (index > -1) {
          if (field.time <= 0) {
            let item = itemList[field.seed];
            let rare = field.rare;
            let num = item.num; // 作物生产的数量
            addItem(item.res, num, rare, this);
            this.user.farm.splice(index, 1);
            this.$set(this.farmTable[fIdx], cIdx, 0);
            if (judgeHp(1, this.user.hp)) {
              addHp(-1, this);
            }
          } else {
            field.hasWater = true;
            if (judgeHp(1, this.user.hp)) {
              addHp(-1, this);
            }
          }
        }
      } else {
        let id = this.seedList[this.selectedSeed].id;
        let detail = {
          seed: id,
          rare: this.seedList[this.selectedSeed].rare,
          position: [fIdx, cIdx],
          hasWater: false,
          time: itemList[id].time,
        };
        addItem(id, -1, this.seedList[this.selectedSeed].rare, this);
        this.$set(this.farmTable[fIdx], cIdx, detail);
        this.user.farm.push(detail);
        if (judgeHp(2, this.user.hp)) {
          addHp(-2, this);
        }
        let seedIndex = this.seedList.findIndex((e) => {
          return e.id == id;
        });
        if (seedIndex > -1) {
          if (this.seedList[seedIndex].num <= 0) {
            this.seedList.splice(seedIndex, 1);
            this.selectedSeed = null;
          }
        }
      }
    },
    // 选择种子
    selectSeed(index) {
      this.selectedSeed = index;
    },
  },
  mounted() {
    let items = this.user.items;
    let seedList = [];
    items.forEach((e) => {
      let item = itemList[e.id];
      if (item.type == 2) {
        seedList.push(e);
      }
    });
    this.seedList = seedList;
    if (this.user.farm.length > 0) {
      this.user.farm.forEach((e) => {
        this.$set(this.farmTable[e.position[0]], e.position[1], e);
      });
    }
  },
};
</script>
<style scoped>
.farm-block {
  height: 30px;
  width: 30px;
  border-radius: 5px;
  background: #dddddd;
  margin: 2px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.blue {
  background: #cde5fb;
}
</style>
