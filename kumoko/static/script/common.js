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

let itemList = [{ id: 1, name: "树枝" }];

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
      fun: function (vm) {
        if (judgeHp(10, vm.user.hp)) {
          addHp(-10, vm)
          addTime(1, vm)
          saveLog(`探索了一下`, vm)
        }
      }
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