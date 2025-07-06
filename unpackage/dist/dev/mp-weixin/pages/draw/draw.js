"use strict";
const common_vendor = require("../../common/vendor.js");
const config_config = require("../../config/config.js");
const utils_networkDiagnostic = require("../../utils/networkDiagnostic.js");
const _sfc_main = {
  __name: "draw",
  setup(__props) {
    common_vendor.useStore();
    const canvasContext = common_vendor.ref(null);
    const isDrawing = common_vendor.ref(false);
    const lastX = common_vendor.ref(0);
    const lastY = common_vendor.ref(0);
    const lineWidth = common_vendor.ref(5);
    const lineColor = common_vendor.ref("#000000");
    const canvasWidth = common_vendor.ref(0);
    const canvasHeight = common_vendor.ref(0);
    const currentWord = common_vendor.ref("");
    const timeLeft = common_vendor.ref(60);
    const timer = common_vendor.ref(null);
    const playerRole = common_vendor.ref("");
    const wordSelected = common_vendor.ref(false);
    const wordCategory = common_vendor.ref("");
    const currentUserId = common_vendor.ref(null);
    const roleAssigned = common_vendor.ref(false);
    const websocket = common_vendor.ref(null);
    const isConnected = common_vendor.ref(false);
    const roomId = common_vendor.ref(null);
    const token = common_vendor.ref(null);
    common_vendor.onMounted(() => {
      initCanvas();
      startTimer();
      initWebSocket();
    });
    common_vendor.onUnmounted(() => {
      clearInterval(timer.value);
      closeWebSocket();
    });
    const initCanvas = () => {
      const query = common_vendor.index.createSelectorQuery();
      query.select("#gameCanvas").fields({ node: true, size: true }).exec((res) => {
        if (!res || !res[0]) {
          console.error("Canvas node not found");
          return;
        }
        const canvas = res[0].node;
        const ctx = canvas.getContext("2d");
        const dpr = common_vendor.index.getSystemInfoSync().pixelRatio || 1;
        canvas.width = res[0].width * dpr;
        canvas.height = res[0].height * dpr;
        ctx.scale(dpr, dpr);
        canvasContext.value = ctx;
        canvasWidth.value = res[0].width;
        canvasHeight.value = res[0].height;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = lineWidth.value;
        ctx.strokeStyle = lineColor.value;
        console.log("Canvas initialized:", {
          width: canvasWidth.value,
          height: canvasHeight.value,
          dpr
        });
      });
    };
    const startDrawing = (e) => {
      if (playerRole.value !== "drawer") {
        return;
      }
      if (!canvasContext.value)
        return;
      isDrawing.value = true;
      const touch = e.touches[0];
      lastX.value = touch.x;
      lastY.value = touch.y;
      console.log("Start drawing at:", lastX.value, lastY.value);
    };
    const draw = (e) => {
      if (playerRole.value !== "drawer") {
        return;
      }
      if (!isDrawing.value || !canvasContext.value)
        return;
      const touch = e.touches[0];
      const ctx = canvasContext.value;
      const currentX = touch.x;
      const currentY = touch.y;
      ctx.beginPath();
      ctx.moveTo(lastX.value, lastY.value);
      ctx.lineTo(currentX, currentY);
      ctx.stroke();
      lastX.value = currentX;
      lastY.value = currentY;
    };
    const endDrawing = () => {
      isDrawing.value = false;
    };
    const clearCanvas = () => {
      if (playerRole.value !== "drawer") {
        common_vendor.index.showToast({
          title: "只有绘画者才能清空画布",
          icon: "none"
        });
        return;
      }
      const ctx = canvasContext.value;
      if (!ctx) {
        console.warn("Canvas context not available");
        return;
      }
      ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value);
      console.log("Canvas cleared");
    };
    const startTimer = () => {
      timer.value = setInterval(() => {
        if (timeLeft.value > 0) {
          timeLeft.value--;
        } else {
          clearInterval(timer.value);
          handleTimeUp();
        }
      }, 1e3);
    };
    const handleTimeUp = () => {
      common_vendor.index.showModal({
        title: "时间到",
        content: "本轮绘画时间已结束",
        showCancel: false,
        success: () => {
        }
      });
    };
    const getRandomWord = () => {
      if (playerRole.value !== "drawer") {
        common_vendor.index.showToast({
          title: "只有绘画者才能选词",
          icon: "none"
        });
        return;
      }
      console.log("选词按钮被点击，当前连接状态:", {
        isConnected: isConnected.value,
        websocket: websocket.value,
        roomId: roomId.value,
        token: token.value
      });
      if (!isConnected.value) {
        console.warn("WebSocket未连接，尝试重新连接");
        common_vendor.index.showToast({
          title: "网络连接异常，正在重连...",
          icon: "none"
        });
        initWebSocket();
        return;
      }
      const message = {
        action: "getRandomWord",
        roomId: roomId.value
      };
      console.log("发送选词请求:", message);
      sendWebSocketMessage(message);
    };
    const onInputChange = (e) => {
      inputText.value = e.detail.value;
    };
    const sendMessage = () => {
      if (!inputText.value.trim())
        return;
      if (playerRole.value !== "guesser") {
        common_vendor.index.showToast({
          title: "只有猜测者才能发送消息",
          icon: "none"
        });
        return;
      }
      const message = {
        content: inputText.value,
        type: "user",
        time: (/* @__PURE__ */ new Date()).toLocaleTimeString()
      };
      messages.value.push(message);
      if (isConnected.value) {
        const guessMessage = {
          action: "guess",
          roomId: roomId.value,
          userId: currentUserId.value,
          guess: inputText.value.trim(),
          currentWord: currentWord.value
        };
        sendWebSocketMessage(guessMessage);
      }
      inputText.value = "";
    };
    const toggleGameMenu = () => {
      showGameMenu.value = !showGameMenu.value;
    };
    const restartGame = () => {
      currentWord.value = "";
      wordSelected.value = false;
      wordCategory.value = "";
      playerRole.value = "guesser";
      messages.value = [];
      score.value = 0;
      gameStatus.value = "waiting";
      timeLeft.value = 60;
      clearCanvas();
      clearInterval(timer.value);
      startTimer();
      if (isConnected.value) {
        const restartMessage = {
          action: "restart",
          roomId: roomId.value,
          userId: currentUserId.value
        };
        sendWebSocketMessage(restartMessage);
      }
      showGameMenu.value = false;
      showResult.value = false;
      common_vendor.index.showToast({
        title: "重新开始游戏",
        icon: "success"
      });
    };
    const exitGame = () => {
      common_vendor.index.showModal({
        title: "提示",
        content: "确定要退出游戏吗？",
        success: (res) => {
          if (res.confirm) {
            clearInterval(timer.value);
            common_vendor.index.reLaunch({
              url: "/pages/index/index"
            });
          }
        }
      });
    };
    const messages = common_vendor.ref([]);
    const inputText = common_vendor.ref("");
    const showGameMenu = common_vendor.ref(false);
    const showResult = common_vendor.ref(false);
    const gameResult = common_vendor.ref({
      totalScore: 0,
      performance: ""
    });
    const gameStatus = common_vendor.ref("drawing");
    const score = common_vendor.ref(0);
    const initWebSocket = () => {
      try {
        const pages = getCurrentPages();
        const currentPage = pages[pages.length - 1];
        roomId.value = currentPage.options.roomId || common_vendor.index.getStorageSync("roomId");
        token.value = common_vendor.index.getStorageSync("token");
        currentUserId.value = common_vendor.index.getStorageSync("userId") || common_vendor.index.getStorageSync("user_id");
        if (!roomId.value) {
          console.error("initWebSocket: roomId未设置");
          return;
        }
        if (!token.value) {
          console.error("initWebSocket: token未找到");
          return;
        }
        console.log("初始化WebSocket连接:", { roomId: roomId.value, token: token.value });
        const wsUrl = `${config_config.config.wsBaseURL}/room/${roomId.value}?token=${token.value}`;
        console.log("WebSocket连接地址:", wsUrl);
        console.log("当前环境配置:", config_config.config);
        websocket.value = common_vendor.index.connectSocket({
          url: wsUrl,
          success: (res) => {
            console.log("connectSocket success:", res);
          },
          fail: (err) => {
            console.error("connectSocket fail:", err);
            isConnected.value = false;
            common_vendor.index.showToast({
              title: "连接失败，请检查网络",
              icon: "none"
            });
          }
        });
        setTimeout(async () => {
          if (!isConnected.value) {
            console.warn("WebSocket连接超时，当前状态:", isConnected.value);
            common_vendor.index.showModal({
              title: "连接超时",
              content: "网络连接异常，是否运行网络诊断？",
              confirmText: "诊断",
              cancelText: "取消",
              success: async (res) => {
                if (res.confirm) {
                  common_vendor.index.showLoading({ title: "诊断中..." });
                  try {
                    await utils_networkDiagnostic.networkDiagnostic.runFullDiagnostic();
                    common_vendor.index.hideLoading();
                    common_vendor.index.showToast({
                      title: "诊断完成，请查看控制台",
                      icon: "success"
                    });
                  } catch (error) {
                    common_vendor.index.hideLoading();
                    console.error("网络诊断失败:", error);
                  }
                }
              }
            });
          }
        }, 5e3);
        console.log("WebSocket连接成功");
        common_vendor.index.offSocketOpen();
        common_vendor.index.offSocketClose();
        common_vendor.index.offSocketError();
        common_vendor.index.offSocketMessage();
        common_vendor.index.onSocketOpen(() => {
          isConnected.value = true;
          console.log("WebSocket连接已建立，状态更新为:", isConnected.value);
        });
        common_vendor.index.onSocketClose(() => {
          isConnected.value = false;
          console.log("WebSocket连接已关闭，状态更新为:", isConnected.value);
        });
        common_vendor.index.onSocketError((error) => {
          console.error("WebSocket错误:", error);
          isConnected.value = false;
          console.log("WebSocket错误，状态更新为:", isConnected.value);
        });
        common_vendor.index.onSocketMessage((res) => {
          console.log("收到WebSocket原始消息:", res);
          handleWebSocketMessage(res.data);
        });
      } catch (error) {
        console.error("初始化WebSocket失败:", error);
      }
    };
    const closeWebSocket = () => {
      if (websocket.value) {
        common_vendor.index.closeSocket();
        isConnected.value = false;
      }
    };
    const sendWebSocketMessage = (message) => {
      console.log("sendWebSocketMessage调用:", { message, isConnected: isConnected.value });
      if (!isConnected.value) {
        console.warn("WebSocket未连接，跳过发送消息");
        return;
      }
      if (!message) {
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
        if (!messageStr || messageStr === "null" || messageStr === "undefined") {
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
    const handleWebSocketMessage = (data) => {
      try {
        const message = JSON.parse(data);
        console.log("收到WebSocket消息:", message);
        const messageType = message.action || message.type;
        switch (messageType) {
          case "gameStart":
          case "game_start":
          case "game_started":
            gameStatus.value = "playing";
            common_vendor.index.showToast({
              title: message.message || "游戏开始！",
              icon: "success"
            });
            if (isConnected.value) {
              const assignRolesMessage = {
                action: "assign_roles",
                roomId: roomId.value,
                userId: currentUserId.value
              };
              console.log("发送角色分配请求:", assignRolesMessage);
              sendWebSocketMessage(assignRolesMessage);
            }
            break;
          case "gameRestart":
          case "game_restart":
            common_vendor.index.showToast({
              title: `${message.initiator} 重新开始了游戏`,
              icon: "success"
            });
            break;
          case "randomWord":
          case "random_word":
            if (message.success && message.word) {
              currentWord.value = message.word;
              wordSelected.value = true;
              if (message.category) {
                wordCategory.value = message.category;
              }
              if (playerRole.value === "drawer") {
                common_vendor.index.showToast({
                  title: `选词成功: ${message.word}`,
                  icon: "success"
                });
              } else {
                common_vendor.index.showToast({
                  title: `题目类别: ${message.category || "未知"}`,
                  icon: "success"
                });
              }
            } else {
              common_vendor.index.showToast({
                title: message.message || "获取词语失败",
                icon: "none"
              });
            }
            break;
          case "roleAssignment":
          case "role_assignment":
            if (message.role) {
              playerRole.value = message.role;
              roleAssigned.value = true;
              console.log("角色分配成功:", message.role, "当前用户ID:", currentUserId.value);
              common_vendor.index.showToast({
                title: `你的角色: ${message.role === "drawer" ? "绘画者" : "猜测者"}`,
                icon: "success"
              });
              if (message.role === "drawer") {
                setTimeout(() => {
                  initCanvas();
                }, 500);
              }
            }
            break;
          case "roles_assigned":
            console.log("所有角色分配完成:", message);
            break;
          case "guessResult":
          case "guess_result":
            if (message.correct) {
              const systemMessage = {
                content: `${message.guesser || "玩家"} 猜对了！答案是：${message.word}`,
                type: "system",
                time: (/* @__PURE__ */ new Date()).toLocaleTimeString()
              };
              messages.value.push(systemMessage);
              common_vendor.index.showToast({
                title: "猜对了！",
                icon: "success"
              });
              if (message.score) {
                score.value += message.score;
              }
            } else {
              if (message.guesser && message.guess) {
                const guessMessage = {
                  content: `${message.guesser}: ${message.guess}`,
                  type: "user",
                  time: (/* @__PURE__ */ new Date()).toLocaleTimeString()
                };
                messages.value.push(guessMessage);
              }
            }
            break;
          case "roundEnd":
          case "round_end":
            common_vendor.index.showModal({
              title: "回合结束",
              content: `本轮结束！答案是：${message.word || currentWord.value}`,
              showCancel: false,
              success: () => {
                currentWord.value = "";
                wordSelected.value = false;
                wordCategory.value = "";
                clearCanvas();
              }
            });
            break;
          default:
            console.log("未处理的消息类型:", messageType);
            break;
        }
      } catch (error) {
        console.error("处理WebSocket消息失败:", error);
      }
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.o(toggleGameMenu),
        b: common_vendor.t(roleAssigned.value ? playerRole.value === "drawer" ? "绘画者" : "猜测者" : "等待分配..."),
        c: common_vendor.t(timeLeft.value),
        d: common_vendor.t(score.value),
        e: roleAssigned.value && gameStatus.value !== "finished" && playerRole.value === "drawer"
      }, roleAssigned.value && gameStatus.value !== "finished" && playerRole.value === "drawer" ? common_vendor.e({
        f: common_vendor.o(startDrawing),
        g: common_vendor.o(draw),
        h: common_vendor.o(endDrawing),
        i: common_vendor.t(currentWord.value || "点击选词"),
        j: !wordSelected.value
      }, !wordSelected.value ? {
        k: common_vendor.o(getRandomWord)
      } : {}, {
        l: common_vendor.o(clearCanvas)
      }) : {}, {
        m: roleAssigned.value && gameStatus.value !== "finished" && playerRole.value === "guesser"
      }, roleAssigned.value && gameStatus.value !== "finished" && playerRole.value === "guesser" ? {
        n: common_vendor.t(wordCategory.value || "等待绘画者选词...")
      } : {}, {
        o: common_vendor.f(messages.value, (item, index, i0) => {
          return common_vendor.e({
            a: item.type === "system"
          }, item.type === "system" ? {
            b: common_vendor.t(item.content),
            c: common_vendor.t(item.time)
          } : {
            d: common_vendor.t(item.content),
            e: common_vendor.t(item.time)
          }, {
            f: common_vendor.n(item.type),
            g: index
          });
        }),
        p: messages.value.length === 0
      }, messages.value.length === 0 ? {} : {}, {
        q: roleAssigned.value && gameStatus.value === "drawing" && playerRole.value === "guesser"
      }, roleAssigned.value && gameStatus.value === "drawing" && playerRole.value === "guesser" ? {
        r: common_vendor.o([($event) => inputText.value = $event.detail.value, onInputChange]),
        s: common_vendor.o(sendMessage),
        t: inputText.value,
        v: common_vendor.o(sendMessage)
      } : {}, {
        w: roleAssigned.value && gameStatus.value === "drawing" && playerRole.value === "drawer"
      }, roleAssigned.value && gameStatus.value === "drawing" && playerRole.value === "drawer" ? {} : {}, {
        x: !roleAssigned.value
      }, !roleAssigned.value ? {} : {}, {
        y: showGameMenu.value
      }, showGameMenu.value ? {
        z: common_vendor.o(toggleGameMenu),
        A: common_vendor.o(restartGame),
        B: common_vendor.o(exitGame)
      } : {}, {
        C: showResult.value
      }, showResult.value ? {
        D: common_vendor.t(gameResult.value.totalScore),
        E: common_vendor.t(gameResult.value.performance),
        F: common_vendor.o(exitGame),
        G: common_vendor.o(restartGame)
      } : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__file", "E:/stu/实训/微信小程序/4源代码/DrawAndGuess_FrontEnd/pages/draw/draw.vue"]]);
wx.createPage(MiniProgramPage);
