let menuList = ["行动", "种田", "牧场", "商店", "道具"]

let actList = ["休息", "打工", "探索", "钓鱼", "挖矿"]

// 保存
let saveGame = (user, flag) => {
  let data = encodeURIComponent(JSON.stringify(user))
  let str64 = window.btoa(data)
  localStorage.setItem("kumokoData", str64)
  alert(flag == 1 ? "数据已更新" : "保存成功")
}
