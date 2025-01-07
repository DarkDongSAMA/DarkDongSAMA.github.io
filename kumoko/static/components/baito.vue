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
      <button style="margin-left: 20px" @click="sleep">睡觉</button>
    </div>
    <div v-if="user.isStop">
      <div v-if="place == -1">
        <div>选择出行地点</div>
        <div>
          <button
            v-for="(item, index) in placeList"
            :key="index"
            @click="changePlace(index)"
            :disabled="user.date < item.lock"
          >
            {{ item.name }}
          </button>
        </div>
      </div>
      <div v-else>
        <button @click="changePlace(-1)">返回</button>
        <div>选择行动</div>
        <div style="display: flex">
          <div v-for="(item, index) in actList" :key="index" @click="changeMenu(index)">
            <button>{{ item }}</button>
          </div>
        </div>
        <div v-if="menu == 0">
          <div>休息菜单</div>
          <div>
            <div
              v-for="(item, index) in placeList[place].children[menu]"
              :key="index"
              @click="changeMenu(index)"
            >
              <button @click="doAction(item)">{{ item.name }}</button>
              <span>{{ item.content }}</span>
            </div>
          </div>
        </div>
        <div v-if="menu == 1">
          <div>打工菜单</div>
          <div>
            <div
              v-for="(item, index) in placeList[place].children[menu]"
              :key="index"
              @click="changeMenu(index)"
            >
              <button @click="doAction(item)">{{ item.name }}</button>
              <span>{{ item.content }}</span>
            </div>
          </div>
        </div>
        <div v-if="menu == 2">
          <div>探索菜单</div>
          <div>
            <div
              v-for="(item, index) in placeList[place].children[menu]"
              :key="index"
              @click="changeMenu(index)"
            >
              <button @click="doAction(item)">{{ item.name }}</button>
              <span>{{ item.content }}</span>
            </div>
          </div>
        </div>
        <div v-if="menu == 3">钓鱼菜单</div>
        <div v-if="menu == 4">挖矿菜单</div>
      </div>
    </div>
    <div style="margin-top: 20px">
      自动行动说明：<br />
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
      place: -1,
    };
  },
  methods: {
    // 睡觉
    sleep() {
      goToTomorrow(this);
    },
    // 操作
    doAction(item) {
      item.fun(this);
    },
    // 切换菜单
    changeMenu(index) {
      this.menu = index;
    },
    // 选择行动
    changeIndex(index) {
      this.active = index;
    },
    // 选择出行地点
    changePlace(index) {
      this.place = index;
    },
    // 更新行动
    updateAct(index) {
      let user = this.user;
      user.act[this.active].value = index;
      if (user.autoSave) {
        saveGame();
      }
    },
  },
};
</script>
<style scoped></style>
