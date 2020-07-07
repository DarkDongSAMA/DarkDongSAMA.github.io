window.onfocus = function() {
	document.title = onfocusTitle;
};
window.onblur = function() {
	document.title = onblurTitle;
};

$(document)
		.ready(
				function() {
					document.onkeydown = function(e) { // 回车提交表单
						// 兼容FF和IE和Opera
						var theEvent = window.event || e;
						var code = theEvent.keyCode || theEvent.which
								|| theEvent.charCode;
						if (code == 13) {
							$("#send").click();
						}
					}
					$("#repeat-girl").attr("height", $(window).height() - 10);
					getSession();
					var loginTime = sessionStorage.getItem("loginTime");
					var angry = sessionStorage.getItem("angry");
					var lastRepeatTime = localStorage.getItem("repeatTime");
					if(lastRepeatTime == null){
						lastRepeatTime = 0;
					}
					$("#repeatTime").text(lastRepeatTime);
					if(lastRepeatTime >= 10){
						$("#bouns").text(", 你好像开始理解什么叫人类的本质了");
					}
					if(lastRepeatTime >= 20){
						$("#bouns").text(", 你就是复读大师?");
					}
					if(lastRepeatTime >= 30){
						$("#bouns").text(", 复读机爱你哦❤");
					}
					if (loginTime != 1 && angry != 1) {
						var robSen = '<span class="nickname-left">复读机</span>你为什么要离开我? 你不想复读吗?';
						$("#repeat-girl").attr("src", "./images/dark.png");
					} else if (loginTime != 1 && angry == 1) {
						var robSen = '你刚刚惹我生气了吧?';
						$("#repeat-girl").attr("src", "./images/smile2.png");
						$("#message-window").append(
								"<span class='left-text-box'><span class='nickname-left'>复读机</span>" + robSen
										+ "</span><br>");
						robSen += '你以为这样就可以逃掉了吗?';
						setTimeout(
								function() {
									$(".front-bg").fadeIn(100);
									$(".front-bg").fadeOut(0);
									$("body")
											.css("background",
													"-webkit-radial-gradient(left, #000000,#5f1010, #060101)");
									$(".bg-bubbles").children("li").css(
											"box-shadow", "0 0 9px 2px red");
									$("#nick-name")
											.attr("disabled", "disabled");
									$("#message-detail").attr("disabled",
											"disabled");
									$("#send").attr("disabled", "disabled");
//									$("#message-window").children(".left-text-box").text(
//											robSen);
									$("#message-window").empty();
									$("#message-window").append(
											"<span class='left-text-box'><span class='nickname-left'>复读机</span>" + robSen
													+ "</span><br>");
									$("#repeat-girl").attr("src",
											"./images/dark.png");
								}, 750);
						setTimeout(function() {
							angryRepeat();
						}, 1500);
						return;
					} else {
						var robSen = '<span class="nickname-left">复读机</span>我是复读机,发送"人类的本质是什么"来开启复读模式!';
					}
					$("#message-window").append(
							"<span class='left-text-box'>" + robSen
									+ "</span><br>");
				})

var clickTime = 0;
if(localStorage.getItem("repeatTime") != null){
	var repeatTime = localStorage.getItem("repeatTime");
}else{
	var repeatTime = 0;
}

function getSession() {
	if (sessionStorage.getItem("loginTime") == null) {
		var loginTime = 1;
		sessionStorage.setItem("loginTime", loginTime);
	} else {
		var loginTime = sessionStorage.getItem("loginTime");
		loginTime++;
		sessionStorage.setItem("loginTime", loginTime);
	}
}

function sendMessage() {
	$("#repeat-girl").attr("src", "./images/normal.png");
	var nickName = $("#nick-name").val();
	var messageDetail = $("#message-detail").val();

	var returnSen = "";
	if (nickName == "" || messageDetail == "") {
		return false;
	}
	if (sessionStorage.getItem("loginTime") == 1) {
		sessionStorage.setItem("nickName", nickName);
	}
	clickTime++;
	$("#nick-name").attr("disabled", "disabled");
	if (clickTime >= 10 && messageDetail != "人类的本质是什么") {
		$("#message-window")
				.append(
						"<span class='left-text-box'><span class='nickname-left'>复读机</span>吃了这个药,你就只会想着复读的事了!</span><br>");
		$("#repeat-girl").attr("src", "./images/dark.png");
		messageDetail = "人类的本质是什么";
	}
	$("#message-window").append(
			"<span class='right-text-box'><span class='nickname-right'>" + nickName + "</span>" + messageDetail
					+ "</span><br>");
	if (messageDetail == "菜单") {
		$("#message-window").append(
				"<span class='left-text-box'><span class='nickname-left'>复读机</span>[不要再复读了] =&gt; 停止复读 <br>"
						+ "[时间] =&gt; 查看当前时间 <br>" + "[信息] =&gt; 查看当前页面信息 <br>"
						+ "</span>");
	}
	if (messageDetail != "人类的本质是什么" && messageDetail != "菜单") {
		firstSend(nickName);
	}
	if (messageDetail == "信息") {
		$("#message-window").append(
				"<span class='left-text-box'><span class='nickname-left'>复读机</span>制作: 动 <br>"
						+ "立绘: 卡暗 <br>" + "测试: 闪耀星天丝吉亚联合会 and you </span>");
	}
	if (messageDetail == "时间") {
		var date = new Date();
		var time = [ "现在是 " + date.toLocaleString(), "你不会自己看右下角吗" ];
		$("#message-window").append(
				"<span class='left-text-box'><span class='nickname-left'>复读机</span>"
						+ time[Math.floor(Math.random() * time.length)]
						+ "</span><br>");
	}
	if (clickTime >= 5 && clickTime < 10 && messageDetail != "人类的本质是什么") {
		$("#message-window").append(
				"<span class='left-text-box'><span class='nickname-left'>复读机</span>难道你不想复读吗?</span><br>");
		returnSen = "人类的本质是什么";
	}
	if (nickName == "复读机") {
		$("#message-window").append(
				"<span class='left-text-box'><span class='nickname-left'>复读机</span>你也是复读机?</span><br>");
		$("#send").removeAttr("onclick");
		$("#send").attr("onclick", "repeat();");
	}
	if (messageDetail == "人类的本质是什么") {
		$("#send").removeAttr("onclick");
		$("#send").attr("onclick", "repeat();");
		document.title = '复读真开心啊✿';
		setTimeout(function() {
			$("#message-window").append(
					"<span class='left-text-box'><span class='nickname-left'>复读机</span>" + messageDetail
							+ "</span><br>");
			$("#message-window")
					.scrollTop($("#message-window")[0].scrollHeight);
		}, 750);
	}
	$("#message-detail").val(returnSen);
	$("#message-window").scrollTop($("#message-window")[0].scrollHeight);
}

function firstSend(nickName) {
	if (sessionStorage.getItem("loginTime") != 1
			&& sessionStorage.getItem("nickName") != nickName
			&& sessionStorage.getItem("nickName") != null && nickName != "复读机") {
		nickName = sessionStorage.getItem("nickName");
		$("#message-window").append(
				"<span class='left-text-box'><span class='nickname-left'>复读机</span>你不是叫" + nickName
						+ "么?为什么改名了...</span><br>");
		$("#nick-name").val(nickName);
		return false;
	}
	if (clickTime == 1 && (nickName == "胡天" || nickName == "胡天侠")) {
		var temp = [ "我老婆", "矮子", "萝莉", "我最喜欢的" ];
		$("#message-window").append(
				"<span class='left-text-box'><span class='nickname-left'>复读机</span>初次见面,"
						+ temp[Math.floor(Math.random() * temp.length)]
						+ nickName + ",快开启复读模式吧!</span><br>");
	} else if (clickTime == 1 && (nickName == "动" || nickName == "动哥")) {
		$("#message-window").append(
				"<span class='left-text-box'><span class='nickname-left'>复读机</span>主人,快开启复读模式吧!</span><br>");
	} else if (clickTime == 1 && nickName == "卡暗") {
		$("#repeat-girl").attr("src", "./images/smile.png");
		$("#message-window").append(
				"<span class='left-text-box'><span class='nickname-left'>复读机</span>是" + nickName
						+ "!快开启复读模式吧!</span><br>");
	} else if(clickTime == 1 && nickName == "镜飞彩"){
		$("#message-window").append(
			"<span class='left-text-box'><span class='nickname-left'>复读姬</span>要成为世界第一的医生哦</span><br>");
	}else if (clickTime == 1 && nickName != "复读机"
			&& sessionStorage.getItem("loginTime") == 1) {
		$("#message-window").append(
				"<span class='left-text-box'><span class='nickname-left'>复读机</span>初次见面," + nickName
						+ ",快开启复读模式吧!</span><br>");
	}
}
function repeat() {
	var nickName = $("#nick-name").val();
	var messageDetail = $("#message-detail").val();

	var returnSen = "";
	if (nickName == "" || messageDetail == "") {
		return false;
	}
	$("#nick-name").attr("disabled", "disabled");
	$("#message-window").append(
			"<span class='right-text-box'><span class='nickname-right'>" + nickName + "</span>" + messageDetail
					+ "</span><br>");
	$("#message-window").scrollTop($("#message-window")[0].scrollHeight);
	if (messageDetail == "不要再复读了"
			&& (nickName != "复读机" && nickName != "动" && nickName != "动哥")) {
		setTimeout(function() {
			$("#message-window").append(
					"<span class='left-text-box'><span class='nickname-left'>复读机</span>不要...</span><br>");
			$("#message-window")
					.scrollTop($("#message-window")[0].scrollHeight);
		}, 750);
		$("#nick-name").attr("disabled", "disabled");
		$("#message-detail").attr("disabled", "disabled");
		$("#send").attr("disabled", "disabled");
		setTimeout(
				function() {
					$("#message-window")
							.append(
									"<span class='left-text-box'><span class='nickname-left'>复读机</span>我要让更多的人了解到复读的魅力!</span><br>");
					$(".front-bg").fadeIn(50);
					$(".front-bg").fadeOut(0);
					$("body")
							.css("background",
									"-webkit-radial-gradient(left, #000000,#5f1010, #060101)");
					$("#message-window").scrollTop(
							$("#message-window")[0].scrollHeight);
				}, 1500);
		setTimeout(
				function() {
					$("#message-window")
							.append(
									"<span class='left-text-box'><span class='nickname-left'>复读机</span><span style='color:red;'>我要让更多的人了解到人类的本质!<span></span><br>");
					$(".front-bg").fadeIn(50);
					$(".front-bg").fadeOut(1);
					$(".page-header").find("strong").css("color","red");
					$(".bg-bubbles").children("li").css("box-shadow",
							"0 0 9px 2px red");
					$("#repeat-girl").attr("src", "./images/dark.png");
					$("#message-window").scrollTop(
							$("#message-window")[0].scrollHeight);
				}, 2250);
		setTimeout(function() {
			angryRepeat();
		}, 3000);
		return;
	} else if (messageDetail == "不要再复读了"
			&& (nickName == "动" || nickName == "动哥")) {
		$("#message-window").append(
				"<span class='left-text-box'><span class='nickname-left'>复读机</span>复读的调试结束了吗?</span><br>");
		$("#send").removeAttr("onclick");
		$("#send").attr("onclick", "sendMessage();");
		$("#message-detail").val("");
		clickTime = 1;
		return;
	}
	repeatTime++;
	localStorage.setItem("repeatTime",repeatTime);
	$("#repeatTime").text(repeatTime);
	if(repeatTime >= 10){
		$("#bouns").text(", 你好像开始理解什么叫人类的本质了");
	}
	if(repeatTime >= 20){
		$("#bouns").text(", 你就是复读大师？");
	}
	if(repeatTime >= 30){
		$("#bouns").text(", 复读机爱你哦❤");
	}
	setTimeout(function() {
		var repeatGirl = [ "normal", "shy", "smile" ];
		$("#repeat-girl").attr(
				"src",
				"./images/"
						+ repeatGirl[Math.floor(Math.random()
								* repeatGirl.length)] + ".png");
		$("#message-window").append(
				"<span class='left-text-box'><span class='nickname-left'>复读机</span>" + messageDetail
						+ "</span><br>");
		$("#message-window").scrollTop($("#message-window")[0].scrollHeight);
	}, 750);

	$("#message-detail").val("");
	$("#message-window").scrollTop($("#message-window")[0].scrollHeight);
}

function angryRepeat() {
	sessionStorage.setItem("angry", 1);
	document.title = '❤我们一起永远复读下去吧❤';
	setInterval(repeatCantStop, 50);
}

function randomColor() {
	var color = "";
	for (var i = 0; i < 6; i++) {
		color += '0123456789ABCDEF'[Math.floor(Math.random() * 16)]
	}
	sessionStorage.setItem("color", color);
	return color;
}

function repeatCantStop() {
	$("body").css("overflow", "hidden");
	$(".back-bg").show();
	$("html,body")
			.append(
					"<span style='display:block;z-index:9999;position:absolute;font-size:"
							+ (Math.floor(Math.random() * 16 + 14))
							+ "px;top:"
							+ Math.floor(Math.random() * $(window).height())
							+ "px;left:"
							+ Math.floor(Math.random() * $(window).width())
							+ "px;right:"
							+ Math.floor(Math.random() * $(window).width())
							+ "px;bottom:"
							+ Math.floor(Math.random() * $(window).height())
							+ "px;'><strong style='color:red;'>人类的本质就是复读机!</strong></span>");
}