<template>
  <div>
    <div>外出</div>
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
      <div>{{ placeList[place].name }}</div>
      <button @click="changePlace(-1)">返回</button>
      <div>选择行动</div>
      <div style="display: flex">
        <div v-for="(item, index) in actList" :key="index" @click="changeMenu(index)">
          <button>{{ item }}</button>
        </div>
      </div>
      <div v-if="tMenu == 0">
        <div>休息菜单</div>
        <div>
          <div
            v-for="(item, index) in placeList[place].children[tMenu]"
            :key="index"
            @click="changeMenu(index)"
          >
            <button @click="doAction(item)">{{ item.name }}</button>
            <span>{{ item.content }}</span>
          </div>
        </div>
      </div>
      <div v-if="tMenu == 1">
        <div>打工菜单</div>
        <div>
          <div
            v-for="(item, index) in placeList[place].children[tMenu]"
            :key="index"
            @click="changeMenu(index)"
          >
            <button @click="doAction(item)">{{ item.name }}</button>
            <span>{{ item.content }}</span>
          </div>
        </div>
      </div>
      <div v-if="tMenu == 2">
        <div>探索菜单</div>
        <div>
          <div
            v-for="(item, index) in placeList[place].children[tMenu]"
            :key="index"
            @click="changeMenu(index)"
          >
            <button @click="doAction(item)">{{ item.name }}</button>
            <span>{{ item.content }}</span>
          </div>
        </div>
      </div>
      <div v-if="tMenu == 3">钓鱼菜单</div>
      <div v-if="tMenu == 4">挖矿菜单</div>
    </div>
  </div>
</template>
<script>
module.exports = {
  name: "travelPage",
  props: {
    user: Object,
  },
  data() {
    return {
      tMenu: 0,
      place: -1,
    };
  },
  methods: {
    // 操作
    doAction(item) {
      item.fun(this);
    },
    // 切换菜单
    changeMenu(index) {
      this.tMenu = index;
    },
    // 选择出行地点
    changePlace(index) {
      this.place = index;
    },
  },
};
</script>
