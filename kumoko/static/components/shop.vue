<template>
  <div>
    <div>迷之商业街</div>
    <div v-if="place == -1">
      <div>选择要去的店</div>
      <button v-for="(item, index) in shopList" :key="index" @click="changePlace(index)">
        {{ item }}
      </button>
    </div>
    <div v-else>
      <div>{{ shopList[place] }}</div>
      <button @click="changePlace(-1)">返回</button>
      <div v-if="place == 0">
        <div v-for="(item, index) in mallList" :key="index">
          <span
            >{{ itemList[item.id].name[item.rare == 0 ? 0 : item.rare] }}({{
              rareList[itemList[item.id].rare[item.rare]]
            }})</span
          >
          <span>|{{ itemList[item.id].buy[item.rare == 0 ? 0 : item.rare] }} 云币</span>
          <button @click="buyItem(index)">购买</button>
        </div>
      </div>
      <div v-if="place == 1">
        <button @click="startGame" :disabled="start">挑战沼泽</button
        ><span>5000云币一次，可负债挑战，成功后能获得7亿云币</span>
        <div>
          <div v-for="(item, index) in kaiji" :key="index">
            {{ item }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
module.exports = {
  name: "shopPage",
  props: {
    user: Object,
  },
  data() {
    return {
      place: -1,
      kaiji: [],
      step: 0,
      start: false,
      kaijiTime: null,
    };
  },
  methods: {
    // 购买
    buyItem(index) {
      let item = mallList[index];
      let buy = itemList[item.id].buy[item.rare == 0 ? 0 : item.rare];
      if (judgeMoney(buy, this)) {
        addMoney(-buy, this);
        addItem(item.id, 1, item.rare, this);
      }
    },
    // 开始沼泽
    startGame() {
      this.kaiji = [];
      this.start = true;
      addMoney(-5000, this);
      let self = this;
      this.kaijiTime = setInterval(() => {
        let randomNum = Math.random() * 1;
        let event = Math.random() * 1;
        let lucky = 0;
        if (self.step == 0) {
          self.kaiji.push("首先小钢珠来到了针刺林！");
          self.step = self.step + 1;
        } else if (self.step == 1) {
          if (event <= 0.4) {
            self.kaiji.push("在店家的疏忽下今天针刺之间的距离有点略大啊");
            lucky = 0.2;
          }
          if (randomNum <= 0.4 + lucky) {
            self.kaiji.push("小钢珠成功通过了针刺林！");
            self.step = self.step + 1;
          } else {
            self.kaiji.push("小钢珠弹进了错误的轨道……");
            self.step = 0;
            self.start = false;
            clearInterval(self.kaijiTime);
          }
        } else if (self.step == 2) {
          self.kaiji.push("小钢珠即将抵达夹板，警惕无量店家背后操纵赌局！");
          self.step = self.step + 1;
        } else if (self.step == 3) {
          if (event <= 0.5) {
            self.kaiji.push(
              "因为店家上次故意用遥控器把你的小钢珠弹飞了，所以这次你把他的夹板给破坏了"
            );
            lucky = 0.5;
          }
          if (randomNum <= 0.5 + lucky) {
            self.kaiji.push("小钢珠成功通过了守门夹板！只剩下最后的多层圆盘了");
            self.step = self.step + 1;
          } else {
            self.kaiji.push("小钢珠被夹飞了……");
            self.step = 0;
            self.start = false;
            clearInterval(self.kaijiTime);
          }
        } else if (self.step == 4) {
          self.kaiji.push("小钢珠来到了第一层圆盘……");
          self.step = self.step + 1;
        } else if (self.step == 5) {
          if (event <= 0.2) {
            self.kaiji.push("大楼发生了倾斜，似乎更容易进洞了");
            lucky = 0.2;
          }
          if (randomNum <= 0.3 + lucky) {
            self.kaiji.push("小钢珠穿过了第一层圆盘");
            self.step = self.step + 1;
          } else {
            self.kaiji.push("小钢珠滚出去了……");
            self.step = 0;
            self.start = false;
            clearInterval(self.kaijiTime);
          }
        } else if (self.step == 6) {
          self.kaiji.push("小钢珠来到了第二层圆盘……！");
          self.step = self.step + 1;
        } else if (self.step == 7) {
          if (event <= 0.2) {
            self.kaiji.push("大楼发生了倾斜，似乎更容易进洞了");
            lucky = 0.2;
          }
          if (randomNum <= 0.3 + lucky) {
            self.kaiji.push("小钢珠穿过了第二层圆盘！");
            self.step = self.step + 1;
          } else {
            self.kaiji.push("小钢珠滚出去了……");
            self.step = 0;
            self.start = false;
            clearInterval(self.kaijiTime);
          }
        } else if (self.step == 8) {
          self.kaiji.push(
            "小钢珠来到了第三层圆盘！通过这里就能获得13亿了！小心店家在洞口开排风把你小钢珠吹走"
          );
          self.step = self.step + 1;
        } else if (self.step == 9) {
          if (event <= 0.1) {
            self.kaiji.push("由于大楼的倾斜，圆盘的洞口被堵住了，这下柏青哥变推币机了");
            lucky = 0.7;
          }
          if (randomNum <= 0.2 + lucky) {
            self.kaiji.push("小钢珠穿过了第三层圆盘！");
            self.kaiji.push("恭喜你获得奖金13亿……？被你的同伴顺走了一部分，只剩下了7亿");
            self.step = 0;
            self.start = false;
            clearInterval(self.kaijiTime);
            addMoney(700000000, self);
          } else {
            self.kaiji.push("小钢珠滚出去了……准备去地下劳动设施打工吧");
            self.step = 0;
            self.start = false;
            clearInterval(self.kaijiTime);
          }
        }
      }, 500);
    },
    // 选择出行地点
    changePlace(index) {
      this.place = index;
    },
  },
};
</script>
