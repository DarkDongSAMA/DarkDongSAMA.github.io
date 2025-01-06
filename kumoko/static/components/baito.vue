<template>
  <div>
    <div>行动安排</div>
    <div style="display: flex">
      <div
        v-for="(item, index) in user.act"
        :key="index"
        style="cursor: pointer"
        :style="active == index ? 'color:blue' : ''"
        @click="changeIndex(index)"
      >
        |{{ actList[item.value] }}|
      </div>
    </div>
    <div style="display: flex">
      <div v-for="(item, index) in actList" :key="index" @click="updateAct(index)">
        <button>{{ item }}</button>
      </div>
      <button style="margin-left: 20px" @click="goToTomorrow">睡觉</button>
    </div>
    <div v-if="user.isStop">
      <div v-if="menu == 0">
        <div>休息菜单</div>
        <div><button>泡温泉</button><button>餐厅</button></div>
      </div>
      <div v-if="menu == 1">
        <div>打工菜单</div>
        <div></div>
      </div>
      <div v-if="menu == 2">
        <div>探索菜单</div>
        <div><button>附近的草地</button><button>附近的山洞</button></div>
      </div>
      <div v-if="menu == 3">钓鱼菜单</div>
      <div v-if="menu == 4">挖矿菜单</div>
    </div>
    <div style="margin-top: 20px">
      说明：<br />
      休息：Lv.{{ user.actLv[0] }} (恢复 {{ 15 + user.actLv[0] * 5 }} 体力)<br />
      打工：Lv.{{ user.actLv[1] }} (消耗 {{ 20 + user.actLv[1] - 1 }} 体力，获得
      {{ 20 + (user.actLv[1] + 1) * 10 }} 云币)<br />
      探索：Lv.{{ user.actLv[2] }} (消耗
      {{ 20 + user.actLv[2] - 1 }} 体力，暂时还没做完)<br />
      钓鱼：Lv.{{ user.actLv[3] }} (消耗
      {{ 20 + user.actLv[3] - 1 }} 体力，暂时还没做完)<br />
      挖矿：Lv.{{ user.actLv[4] }} (消耗
      {{ 20 + user.actLv[4] - 1 }} 体力，暂时还没做完)<br />
    </div>
  </div>
</template>
<script>
module.exports = {
  name: "baitoPage",
  props: {
    user: Object,
  },
  data() {
    return {
      active: 0,
      menu: 0,
    };
  },
  methods: {
    // 跳过今天
    goToTomorrow() {
      this.$emit("on-jump-today");
    },
    // 选择行动
    changeIndex(index) {
      this.active = index;
    },
    // 更新行动
    updateAct(index) {
      let user = this.user;
      this.menu = index;
      user.act[this.active].value = index;
      if (user.autoSave) {
        saveGame(user);
      }
    },
  },
};
</script>
<style scoped></style>
