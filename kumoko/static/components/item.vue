<template>
  <div>
    <div v-for="(item, index) in user.items" :key="index">
      <span
        >{{ itemList[item.id].name[item.rare == 0 ? 0 : item.rare] }}({{
          rareList[itemList[item.id].rare[item.rare]]
        }})</span
      >
      <span>x{{ item.num }}</span>
      <span>|出售价：{{ itemList[item.id].sell[item.rare == 0 ? 0 : item.rare] }}</span>
      <button @click="sellItem(item)">出售</button>
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
    sellItem(item) {
      let sell = itemList[item.id].sell[item.rare == 0 ? 0 : item.rare];
      addMoney(sell, this);
      addItem(item.id, -1, item.rare, this);
    },
  },
};
</script>
