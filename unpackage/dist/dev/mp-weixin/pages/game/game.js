"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "game",
  setup(__props) {
    const store = common_vendor.useStore();
    const connectionStatus = common_vendor.ref("未连接");
    const isConnected = common_vendor.ref(false);
    const roomName = common_vendor.ref("");
    const roomId = common_vendor.ref("");
    const memberCount = common_vendor.ref(0);
    const maxMembers = common_vendor.ref(8);
    const readyCount = common_vendor.ref(0);
    const gameStarted = common_vendor.ref(false);
    const isReady = common_vendor.ref(false);
    const isCreator = common_vendor.ref(false);
    const userId = common_vendor.ref("");
    const playerList = common_vendor.ref([]);
    const messages = common_vendor.ref([]);
    const scrollTop = common_vendor.ref(0);
    const websocket = common_vendor.ref(null);
    common_vendor.onLoad((options) => {
      const userInfo = store.state.userInfo || {};
      userId.value = userInfo.openid || userInfo.userId || "default_user";
      console.log("onLoad初始化:", { userInfo, userId: userId.value, options });
      if (options.create === "true") {
        createNewRoom();
      } else if (options.roomId) {
        roomId.value = options.roomId;
        initGame();
      } else {
        common_vendor.index.showToast({
          title: "参数错误",
          icon: "none"
        });
        setTimeout(() => {
          common_vendor.index.reLaunch({
            url: "/pages/index/index"
          });
        }, 1500);
      }
    });
    common_vendor.onUnmounted(() => {
      closeWebSocket();
    });
    const initGame = () => {
      initWebSocket();
      loadRoomInfo();
    };
    const initWebSocket = () => {
      try {
        if (!roomId.value) {
          console.error("initWebSocket: roomId未设置");
          return;
        }
        const token = common_vendor.index.getStorageSync("token");
        if (!token) {
          console.error("initWebSocket: token未找到");
          return;
        }
        const wsUrl = `ws://localhost:8080/ws/room/${roomId.value}?token=${token}`;
        websocket.value = common_vendor.index.connectSocket({
          url: wsUrl,
          success: () => {
            console.log("WebSocket连接成功");
          }
        });
        common_vendor.index.onSocketOpen(() => {
          isConnected.value = true;
          connectionStatus.value = "已连接";
          console.log("WebSocket连接已建立");
          const userInfo = store.state.userInfo || {};
          const parsedRoomId = parseInt(roomId.value);
          const currentUserId = userInfo.openid || userInfo.userId || userId.value;
          if (!parsedRoomId || isNaN(parsedRoomId)) {
            console.error("无效的房间ID:", roomId.value);
            return;
          }
          if (!currentUserId) {
            console.error("无效的用户ID:", currentUserId);
            return;
          }
          console.log("用户信息验证:", { userInfo, currentUserId, parsedRoomId });
          const joinMessage = {
            action: "join_room",
            roomId: parsedRoomId,
            userId: currentUserId
          };
          console.log("发送加入房间消息:", joinMessage);
          setTimeout(() => {
            if (isConnected.value) {
              sendWebSocketMessage(joinMessage);
            } else {
              console.error("WebSocket连接状态异常，无法发送消息");
            }
          }, 100);
        });
        common_vendor.index.onSocketClose(() => {
          isConnected.value = false;
          connectionStatus.value = "已断开";
        });
        common_vendor.index.onSocketError((error) => {
          console.error("WebSocket错误:", error);
          isConnected.value = false;
          connectionStatus.value = "连接错误";
        });
        common_vendor.index.onSocketMessage((res) => {
          handleWebSocketMessage(res.data);
        });
      } catch (error) {
        console.error("初始化WebSocket失败:", error);
      }
    };
    const closeWebSocket = () => {
      if (isConnected.value) {
        common_vendor.index.closeSocket();
        isConnected.value = false;
      }
    };
    const loadRoomInfo = async () => {
    };
    const createNewRoom = async () => {
      try {
        const token = common_vendor.index.getStorageSync("token");
        const userInfo = store.state.userInfo || {};
        const response = await common_vendor.index.request({
          url: "http://localhost:8080/api/room/create",
          method: "POST",
          header: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          data: {
            roomName: "新房间",
            creatorId: userInfo.openid || userInfo.userId || "default_user"
          }
        });
        console.log("创建房间响应:", response.data);
        if (response.data.success) {
          roomId.value = response.data.roomId;
          roomName.value = response.data.roomName;
          isCreator.value = true;
          initGame();
        } else {
          common_vendor.index.showToast({
            title: response.data.message || "创建房间失败",
            icon: "none"
          });
          setTimeout(() => {
            common_vendor.index.reLaunch({
              url: "/pages/index/index"
            });
          }, 1500);
        }
      } catch (error) {
        console.error("创建房间失败:", error);
        common_vendor.index.showToast({
          title: "创建房间失败",
          icon: "none"
        });
        setTimeout(() => {
          common_vendor.index.reLaunch({
            url: "/pages/index/index"
          });
        }, 1500);
      }
    };
    const refreshRoomInfo = () => {
      loadRoomInfo();
    };
    const copyRoomId = () => {
      common_vendor.index.setClipboardData({
        data: roomId.value,
        success: () => {
          common_vendor.index.showToast({
            title: "房间号已复制",
            icon: "success"
          });
        }
      });
    };
    const toggleReady = () => {
      if (!isConnected.value)
        return;
      const userInfo = store.state.userInfo || {};
      const parsedRoomId = parseInt(roomId.value);
      const currentUserId = userInfo.openid || userInfo.userId || userId.value;
      if (!parsedRoomId || isNaN(parsedRoomId)) {
        console.error("toggleReady: 无效的房间ID:", roomId.value);
        return;
      }
      if (!currentUserId) {
        console.error("toggleReady: 无效的用户ID:", currentUserId);
        return;
      }
      isReady.value = !isReady.value;
      sendWebSocketMessage({
        action: "toggle_ready",
        roomId: parsedRoomId,
        userId: currentUserId,
        isReady: isReady.value
      });
    };
    const startGame = () => {
      if (!isConnected.value || !isCreator.value || readyCount.value < memberCount.value)
        return;
      const parsedRoomId = parseInt(roomId.value);
      if (!parsedRoomId || isNaN(parsedRoomId)) {
        console.error("startGame: 无效的房间ID:", roomId.value);
        return;
      }
      sendWebSocketMessage({
        action: "start_game",
        roomId: parsedRoomId
      });
    };
    const leaveRoom = () => {
      common_vendor.index.showModal({
        title: "提示",
        content: "确定要离开房间吗？",
        success: (res) => {
          if (res.confirm) {
            if (websocket.value && websocket.value.readyState === 1) {
              const parsedRoomId = parseInt(roomId.value);
              const currentUserId = userId.value;
              if (parsedRoomId && !isNaN(parsedRoomId) && currentUserId) {
                const leaveMessage = {
                  action: "leave_room",
                  roomId: parsedRoomId,
                  userId: currentUserId
                };
                console.log("发送离开房间消息:", leaveMessage);
                sendWebSocketMessage(leaveMessage);
              } else {
                console.error("leaveRoom: 无效的参数", { roomId: roomId.value, userId: userId.value });
              }
              setTimeout(() => {
                closeWebSocket();
                common_vendor.index.reLaunch({
                  url: "/pages/index/index"
                });
              }, 100);
            } else {
              closeWebSocket();
              common_vendor.index.reLaunch({
                url: "/pages/index/index"
              });
            }
          }
        }
      });
    };
    const handleWebSocketMessage = (data) => {
      try {
        const message = JSON.parse(data);
        console.log("收到WebSocket消息:", message);
        if (message.action) {
          switch (message.action) {
            case "room_status_update":
              handleRoomStatusUpdate(message);
              break;
            case "user_joined":
              handleUserJoined(message);
              break;
            case "user_ready":
              handleUserReady(message);
              break;
            case "room_created":
              handleRoomCreated(message);
              break;
            case "room_joined":
              handleRoomJoined(message);
              break;
            case "room_left":
              handleRoomLeft(message);
              break;
            case "user_left":
              handleUserLeft(message);
              break;
            case "game_started":
              handleGameStarted(message);
              break;
            case "error":
              handleErrorMessage(message);
              break;
            default:
              console.log("未处理的action类型:", message.action);
          }
          return;
        }
        switch (message.type) {
          case "roomInfo":
            updateRoomInfo(message.data);
            break;
          case "playerList":
            updatePlayerList(message.data);
            break;
          case "gameStart":
            handleGameStart(message.data);
            break;
          case "gameOver":
            handleGameOver(message.data);
            break;
          case "roundStart":
            handleRoundStart(message.data);
            break;
          case "roundEnd":
            handleRoundEnd(message.data);
            break;
          case "draw":
            handleDrawData(message.data);
            break;
          case "guess":
            handleGuessMessage(message.data);
            break;
          case "chat":
            handleChatMessage(message.data);
            break;
          case "error":
            handleErrorMessage(message.data);
            break;
          default:
            console.log("未处理的消息类型:", message.type || message.action);
        }
      } catch (error) {
        console.error("处理WebSocket消息失败:", error);
      }
    };
    const sendWebSocketMessage = (message) => {
      console.log("sendWebSocketMessage调用:", { message, isConnected: isConnected.value });
      if (!isConnected.value) {
        console.warn("WebSocket未连接，跳过发送消息");
        return;
      }
      if (message === void 0 || message === null) {
        console.error("sendWebSocketMessage: 消息参数为undefined或null", message);
        return;
      }
      if (typeof message !== "object") {
        console.error("sendWebSocketMessage: 消息参数不是对象类型", typeof message, message);
        return;
      }
      if (!message.action) {
        console.error("sendWebSocketMessage: 消息缺少action字段", message);
        return;
      }
      try {
        const messageStr = JSON.stringify(message);
        if (!messageStr || messageStr === "undefined" || messageStr === "null") {
          console.error("sendWebSocketMessage: JSON序列化结果无效", messageStr);
          return;
        }
        console.log("发送WebSocket消息:", message, "序列化后:", messageStr);
        common_vendor.index.sendSocketMessage({
          data: messageStr
        });
      } catch (error) {
        console.error("发送WebSocket消息失败:", error, "消息:", message);
      }
    };
    const updateRoomInfo = (data) => {
      roomName.value = data.name;
      memberCount.value = data.memberCount;
      maxMembers.value = data.maxMembers;
      readyCount.value = data.readyCount;
      gameStarted.value = data.gameStarted;
    };
    const updatePlayerList = (data) => {
      playerList.value = data;
      isCreator.value = data.some((player) => player.userId === userId.value && player.isCreator);
    };
    const handleRoomStatusUpdate = (message) => {
      console.log("房间状态更新:", message);
      roomName.value = message.roomName || roomName.value;
      memberCount.value = message.memberCount || 0;
      maxMembers.value = message.maxMembers || 8;
      readyCount.value = message.readyCount || 0;
      if (message.memberDetails && Array.isArray(message.memberDetails)) {
        const userInfo = store.state.userInfo;
        const currentUserId = userInfo.openid || userInfo.userId || userId.value;
        playerList.value = message.memberDetails.map((member) => {
          const isUserReady = message.readyUsers && message.readyUsers.includes(member.openid);
          const isCurrentUser = member.openid === currentUserId;
          const isRoomCreator = member.openid === message.creatorId;
          if (isCurrentUser) {
            isReady.value = isUserReady;
            isCreator.value = isRoomCreator;
          }
          return {
            userId: member.openid,
            displayName: member.username || "未知用户",
            avatarUrl: member.avatarUrl || "",
            isReady: isUserReady,
            isCreator: isRoomCreator
          };
        });
      }
      addMessage(`房间状态更新: ${memberCount.value}/${maxMembers.value} 人在线，${readyCount.value} 人已准备`, "system");
    };
    const handleUserJoined = (message) => {
      console.log("用户加入:", message);
      memberCount.value = message.memberCount || memberCount.value;
      addMessage(message.message || `${message.userId} 加入了房间`, "system");
    };
    const handleUserReady = (message) => {
      console.log("用户准备状态:", message);
      readyCount.value = message.readyCount || readyCount.value;
      memberCount.value = message.memberCount || memberCount.value;
      const userInfo = store.state.userInfo;
      const currentUserId = userInfo.openid || userInfo.userId || userId.value;
      if (message.userId === currentUserId) {
        isReady.value = message.isReady;
      }
      addMessage(message.message || `${message.userId} ${message.isReady ? "已准备" : "取消准备"}`, "system");
    };
    const handleRoomCreated = (message) => {
      console.log("房间创建成功:", message);
      roomId.value = message.roomId;
      roomName.value = message.roomName;
      memberCount.value = message.memberCount || 1;
      maxMembers.value = message.maxMembers || 8;
      isCreator.value = true;
      addMessage("房间创建成功", "system");
    };
    const handleRoomJoined = (message) => {
      console.log("加入房间成功:", message);
      roomId.value = message.roomId;
      roomName.value = message.roomName;
      memberCount.value = message.memberCount || 1;
      maxMembers.value = message.maxMembers || 8;
      addMessage("成功加入房间", "system");
    };
    const addMessage = (content, type = "normal") => {
      const now = /* @__PURE__ */ new Date();
      const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
      messages.value.push({
        id: Date.now() + Math.random(),
        content,
        time: timeStr,
        type
      });
      if (messages.value.length > 100) {
        messages.value.splice(0, 10);
      }
      setTimeout(() => {
        scrollTop.value = 99999;
      }, 100);
    };
    const handleGameStart = (data) => {
      gameStarted.value = true;
    };
    const handleGameStarted = (message) => {
      console.log("游戏开始:", message);
      gameStarted.value = true;
      common_vendor.index.showToast({
        title: message.message || "游戏开始！",
        icon: "success",
        duration: 2e3
      });
      addMessage(message.message || "游戏开始！", "system");
      setTimeout(() => {
        common_vendor.index.navigateTo({
          url: `/pages/draw/draw?roomId=${roomId.value}&userId=${userId.value}`
        });
      }, 2e3);
    };
    const handleGameOver = (data) => {
      gameStarted.value = false;
      common_vendor.index.showModal({
        title: "游戏结束",
        content: "查看详细排名？",
        success: (res) => {
          if (res.confirm) {
            common_vendor.index.navigateTo({
              url: "/pages/ranking/ranking"
            });
          }
        }
      });
    };
    const handleRoundStart = (data) => {
      currentWord.value = data.word;
      timeLeft.value = data.timeLimit;
      startTimer();
    };
    const handleRoundEnd = (data) => {
      clearInterval(timer.value);
      const { word, drawer, correctGuessers } = data;
      common_vendor.index.showModal({
        title: "本轮结束",
        content: `正确答案是：${word}
绘画者：${drawer}
猜对人数：${correctGuessers.length}`,
        showCancel: false
      });
    };
    const handleDrawData = (data) => {
      if (!canvasContext.value)
        return;
      const { x, y, type } = data;
      switch (type) {
        case "start":
          startDrawing({ touches: [{ x, y }] });
          break;
        case "move":
          draw({ touches: [{ x, y }] });
          break;
        case "end":
          endDrawing();
          break;
      }
    };
    const handleGuessMessage = (data) => {
      const { userId: userId2, username, content, correct } = data;
      messages.value.push({
        type: "guess",
        userId: userId2,
        username,
        content,
        correct,
        time: (/* @__PURE__ */ new Date()).toLocaleTimeString()
      });
    };
    const handleChatMessage = (data) => {
      const { userId: userId2, username, content } = data;
      messages.value.push({
        type: "chat",
        userId: userId2,
        username,
        content,
        time: (/* @__PURE__ */ new Date()).toLocaleTimeString()
      });
    };
    const handleRoomLeft = (data) => {
      console.log("离开房间成功:", data);
      const message = data.message || "已离开房间";
      common_vendor.index.showToast({
        title: message,
        icon: "success",
        duration: 2e3
      });
      closeWebSocket();
      common_vendor.index.reLaunch({
        url: "/pages/index/index"
      });
    };
    const handleUserLeft = (data) => {
      console.log("用户离开房间:", data);
      const { userId: userId2, memberCount: memberCount2, message } = data;
      if (memberCount2 !== void 0) {
        memberCount2.value = memberCount2;
      }
      if (userId2 && playerList.value) {
        playerList.value = playerList.value.filter((player) => player.openid !== userId2);
      }
      if (message) {
        addMessage(message, "system");
      }
    };
    const handleErrorMessage = (data) => {
      const errorMessage = data.message || data.error || "发生未知错误";
      console.error("收到错误消息:", data);
      common_vendor.index.showToast({
        title: errorMessage,
        icon: "none",
        duration: 3e3
      });
      addMessage(`错误: ${errorMessage}`, "system");
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(connectionStatus.value),
        b: common_vendor.n(isConnected.value ? "connected" : "disconnected"),
        c: common_vendor.o(refreshRoomInfo),
        d: common_vendor.t(roomName.value || "游戏房间"),
        e: common_vendor.t(roomId.value || "未知"),
        f: common_vendor.o(copyRoomId),
        g: common_vendor.t(memberCount.value),
        h: common_vendor.t(maxMembers.value),
        i: common_vendor.t(readyCount.value),
        j: common_vendor.t(memberCount.value),
        k: common_vendor.t(gameStarted.value ? "进行中" : "等待中"),
        l: common_vendor.n(gameStarted.value ? "started" : "waiting"),
        m: !gameStarted.value
      }, !gameStarted.value ? {
        n: common_vendor.t(isReady.value ? "已准备" : "未准备"),
        o: common_vendor.n(isReady.value ? "ready" : "not-ready")
      } : {}, {
        p: !gameStarted.value
      }, !gameStarted.value ? common_vendor.e({
        q: common_vendor.t(memberCount.value),
        r: common_vendor.t(maxMembers.value),
        s: common_vendor.f(playerList.value, (item, k0, i0) => {
          return common_vendor.e({
            a: item.avatarUrl
          }, item.avatarUrl ? {
            b: item.avatarUrl
          } : {
            c: common_vendor.t(item.displayName.charAt(0))
          }, {
            d: common_vendor.t(item.displayName),
            e: item.isCreator
          }, item.isCreator ? {} : {}, {
            f: common_vendor.t(item.isReady ? "已准备" : "未准备"),
            g: common_vendor.n(item.isReady ? "ready" : "not-ready"),
            h: item.userId === userId.value
          }, item.userId === userId.value ? {} : {}, {
            i: common_vendor.n(item.isReady ? "ready" : "not-ready"),
            j: item.userId
          });
        }),
        t: playerList.value.length === 0
      }, playerList.value.length === 0 ? {} : {}) : {}, {
        v: !gameStarted.value
      }, !gameStarted.value ? common_vendor.e({
        w: common_vendor.t(isReady.value ? "取消准备" : "准备"),
        x: common_vendor.n(isReady.value ? "ready" : "not-ready"),
        y: common_vendor.o(toggleReady),
        z: !isConnected.value,
        A: isCreator.value
      }, isCreator.value ? {
        B: common_vendor.o(startGame),
        C: !isConnected.value || !isCreator.value || readyCount.value < memberCount.value
      } : {}, {
        D: common_vendor.o(leaveRoom)
      }) : {}, {
        E: gameStarted.value
      }, gameStarted.value ? {
        F: common_vendor.o(leaveRoom)
      } : {}, {
        G: common_vendor.f(messages.value, (item, k0, i0) => {
          return {
            a: common_vendor.t(item.time),
            b: common_vendor.t(item.content),
            c: common_vendor.n(item.type),
            d: item.id
          };
        }),
        H: messages.value.length === 0
      }, messages.value.length === 0 ? {} : {}, {
        I: scrollTop.value,
        J: !isConnected.value
      }, !isConnected.value ? {} : memberCount.value < 2 ? {} : readyCount.value < memberCount.value && !gameStarted.value ? {} : isCreator.value && readyCount.value === memberCount.value && memberCount.value >= 2 && !gameStarted.value ? {} : {}, {
        K: memberCount.value < 2,
        L: readyCount.value < memberCount.value && !gameStarted.value,
        M: isCreator.value && readyCount.value === memberCount.value && memberCount.value >= 2 && !gameStarted.value
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__file", "E:/stu/实训/微信小程序/4源代码/DrawAndGuess_FrontEnd/pages/game/game.vue"]]);
wx.createPage(MiniProgramPage);
