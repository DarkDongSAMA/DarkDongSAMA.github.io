<template>
  <div>
    <div v-for="(item, index) in user.items" :key="index">
      <span>{{ itemList[item.id].name[item.rare] }}</span>
      <span>x{{ item.num }}</span>
      <span>|出售价：{{ itemList[item.id].sell[item.rare] }}</span>
      <button @click="sellItem(index)">出售</button>
    </div>
  </div>
</template>
<script>
module.exports = {
  name: "itemPage",
  props: {
    user: Object,
  },
  data() {
    return {};
  },
  methods: {
    // 出售
    sellItem(index) {
      let item = mallList[index];
      let sell = itemList[item.id].sell[item.rare];
      addMoney(sell, this);
      addItem(item.id, -1, item.rare, this);
    },
  },
};
</script>