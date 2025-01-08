let menuList = ["行动", "出行", "农场", "牧场", "商店", "道具"];

let actList = ["休息", "打工", "探索", "钓鱼", "挖矿"];

// 保存
let saveGame = (user, flag) => {
  let data = encodeURIComponent(JSON.stringify(user))
  let str64 = window.btoa(data)
  localStorage.setItem("kumokoData", str64)
  alert(flag == 1 ? "数据已更新" : "保存成功")
};

let log = [];
// 更新日志
let saveLog = (str, vm) => {
  log.push(str)
  if (vm.showLog) {
    vm.$nextTick(() => {
      const box = vm.$refs.logBox
      box.scrollTop = box.scrollHeight
    })
  }
}

// 恢复/扣除 体力
let addHp = (hp, vm) => {
  let user = vm.user
  if (hp > 0) {
    user.hp = user.hp + hp > user.maxHp ? user.maxHp : user.hp + hp
  } else {
    user.hp = user.hp + hp < 0 ? 0 : user.hp + hp
  }
  if (user.hp <= 0) {
    saveLog("负荷工作了，必须得休息了", vm)
    goToTomorrow(vm)
  }
}

// 判断钱是否足够
let judgeMoney = (money, vm) => {
  let user = vm.user
  if (user.money - money < 0) {
    alert("钱不够了！")
    return false
  }
  return true
}

// 判断体力是否足够
let judgeHp = (hp, nowHp) => {
  if (nowHp < hp) {
    alert("体力不够了！")
    return false
  }
  return true
}

// 跳过今天
let goToTomorrow = (vm) => {
  let user = vm.user
  user.time = 0
  user.date = user.date + 1
  addHp(50, vm)
  if (user.autoSave) {
    saveGame(vm.user)
  }
  clearInterval(vm.dateInterval)
  vm.$nextTick(() => {
    if (!user.isStop) {
      vm.setIntervalDate()
    }
  })
  saveLog("睡觉睡觉(体力+50)", vm)
  saveLog(`第${user.date}天`, vm)
};

// 添加时间
let addTime = (time, vm) => {
  let user = vm.user
  user.time = user.time + time
  if (user.time >= 24) {
    user.time = user.time - 24
    user.date = user.date + 1
    saveLog(`第${user.date}天`, vm)
  }
}

// 添加云币
let addMoney = (money, vm) => {
  let user = vm.user
  user.money = user.money + money
}

// 添加道具
let addItem = (id, num, rare, vm) => {
  let user = vm.user
  let userItem = user.items
  let itemIndex = userItem.findIndex((e) => {
    return e.id == id
  })
  if (itemIndex == -1 && num > 0) {
    userItem.push({
      id: id,
      rare: rare,
      num: num
    })
  } else {
    userItem[itemIndex].num = userItem[itemIndex].num + num
    if (userItem[itemIndex].num <= 0) {
      userItem.splice(itemIndex, 1)
    }
  }
}

let typeList = ["垃圾", "材料", "种子"];
let rareList = ["垃圾", "普通", "稀有"]
let itemList = {
  1: { name: ["树枝", "枯树枝", "光树枝"], sell: [3, 8, 30], rare: [1, 2, 3], type: 1 },
  2: { name: ["木头", "魔木", "神木"], sell: [5, 20, 40], rare: [1, 2, 3], type: 1 },
  3: { name: ["杂草", "毒草", "天草"], sell: [2, 15, 45], rare: [1, 2, 3], type: 1 },
  4: { name: ["易拉罐"], sell: [1], rare: [0], type: 0 },
  5: { name: ["BT种子"], buy: [10], sell: [9], rare: [1], type: 2 }
};

let areaList = [];

let placeList = [{
  name: "人界",
  lock: 0,
  children:
    [[{
      name: "无人温泉",
      content: "自然生成的温泉，似乎还没有人发现这个地方。",
      fun: function (vm) {
        addHp(30, vm)
        addTime(2, vm)
        saveLog(`泡温泉休息一下(体力+30)`, vm)
      }
    }], [{
      name: "小酒馆",
      content: "村庄里的小酒馆，偶尔会有人来这边吃饭。",
      fun: function (vm) {
        if (judgeHp(10, vm.user.hp)) {
          addHp(-10, vm)
          addMoney(20, vm)
          addTime(1, vm)
          saveLog(`打了会儿工(云币+20)`, vm)
        }
      }
    }], [{
      name: "无人森林",
      content: "距离村庄较远的树林，有时候会遇到探险中的小孩。",
      hp: 5,
      time: 1,
      drop: [{ id: 2, rare: 1, per: 0.325 },
      { id: 1, rare: 1, per: 0.05 },
      { id: 3, rare: 1, per: 0.325 },
      { id: 4, rare: 0, per: 0.25 }],
    }]]
}, {
  name: "魔界",
  lock: 0,
  children:
    [[{
      name: "地狱澡堂",
      content: "魔界的大澡堂，人气很高，但是费用比较贵。",
      fun: function (vm) {
        addHp(45, vm)
        addMoney(-30, vm)
        addTime(2, vm)
        saveLog(`泡澡休息一下(体力+45，云币-30)`, vm)
      }
    }], [{
      name: "女仆咖啡厅",
      content: "魔界似乎流行这种东西，虽然很累但是时薪挺高的。",
      fun: function (vm) {
        if (judgeHp(20, vm.user.hp)) {
          addHp(-20, vm)
          addMoney(50, vm)
          addTime(1, vm)
          saveLog(`打了会儿工(云币+50)`, vm)
        }
      }
    }]]
}, { name: "天界", lock: 10 }];

let shopList = ["商店", "柏青哥店"]

let mallList = [{ id: 5, rare: 1 }]

// 查找概率最接近
let maxPerFn = (num, arr) => {
  let list = []
  arr.forEach((e) => {
    if (num <= e.per) {
      list.push(e)
    }
  })
  list.sort(function (a, b) { return a.per - b.per })
  let result = list[0]
  if (result) {
    let filterList = list.filter((e) => {
      return e.per === result.per
    })
    if (filterList.length > 1) {
      result = randomSelect(filterList)
    }
    return result
  } else {
    return null
  }
}

let randomSelect = (arr) => {
  let idx = Math.floor(Math.random() * arr.length)
  return arr[idx]
}
