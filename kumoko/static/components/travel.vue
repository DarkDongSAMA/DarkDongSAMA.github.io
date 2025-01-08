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
          <div v-for="(item, index) in placeList[place].children[tMenu]" :key="index">
            <button @click="doAction(item)">{{ item.name }}</button>
            <span>{{ item.content }}</span>
          </div>
        </div>
      </div>
      <div v-if="tMenu == 1">
        <div>打工菜单</div>
        <div>
          <div v-for="(item, index) in placeList[place].children[tMenu]" :key="index">
            <button @click="doAction(item)">{{ item.name }}</button>
            <span>{{ item.content }}</span>
          </div>
        </div>
      </div>
      <div v-if="tMenu == 2">
        <div>探索菜单</div>
        <div>
          <div v-for="(item, index) in placeList[place].children[tMenu]" :key="index">
            <button @click="doSearch(item)">{{ item.name }}</button>
            <span>{{ item.content }}(消耗体力:{{ item.hp }})</span>
            <div>
              掉落物：<span v-for="(itemD, indexD) in item.drop" :key="indexD"
                >|{{ itemList[itemD.id].name[itemD.rare == 0 ? 0 : itemD.rare - 1] }}({{
                  rareList[itemD.rare]
                }})|</span
              >
            </div>
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
    // 探索
    doSearch(item) {
      if (!judgeHp(item.hp, this.user.hp)) {
        return;
      }
      let randomList = [];
      for (let i = 0; i < 4; i++) {
        let randomNum = Math.random() * 1;
        let prize = maxPerFn(randomNum, item.drop);
        if (prize) {
          randomList.push(prize);
        }
      }
      let result = [];
      randomList.forEach((e) => {
        let idx = result.findIndex((el) => {
          return e.id == el.id;
        });
        if (idx > -1) {
          result[idx].num = result[idx].num + 1;
        } else {
          e.num = 1;
          result.push(e);
        }
      });
      let logStr = `探索了 ${item.name}`;
      if (result.length > 0) {
        logStr += "，获得了";
        result.forEach((e) => {
          addItem(e.id, e.num, e.rare, this);
          logStr += `|${itemList[e.id].name[e.rare == 0 ? 0 : e.rare - 1]}(${
            rareList[e.rare]
          })x${e.num}|`;
        });
      }
      addTime(item.time, this);
      addHp(-item.hp, this);
      saveLog(logStr, this);
    },
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
