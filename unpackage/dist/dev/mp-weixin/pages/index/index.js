"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      navBarHeight: 0,
      statusBarHeight: 0,
      menuHeight: 0,
      isLoggedIn: false,
      userInfo: {},
      roomNumber: "",
      loading: false,
      gameRooms: []
    };
  },
  onLoad() {
    this.initNavBarHeight();
    this.checkLoginStatus();
    this.loadGameRooms();
  },
  methods: {
    initNavBarHeight() {
      const systemInfo = common_vendor.index.getSystemInfoSync();
      this.statusBarHeight = systemInfo.statusBarHeight;
      this.menuHeight = 44;
      this.navBarHeight = this.statusBarHeight + this.menuHeight;
    },
    async checkLoginStatus() {
      try {
        const token = common_vendor.index.getStorageSync("token");
        if (token) {
          this.isLoggedIn = true;
          this.userInfo = common_vendor.index.getStorageSync("userInfo") || {};
          if (!this.userInfo.username) {
            common_vendor.index.redirectTo({
              url: "/pages/avatar-selector/avatar-selector"
            });
            return;
          }
        } else {
          common_vendor.index.redirectTo({
            url: "/pages/login/login"
          });
        }
      } catch (error) {
        console.error("检查登录状态失败:", error);
      }
    },
    logout() {
      common_vendor.index.showModal({
        title: "提示",
        content: "确定要退出登录吗？",
        success: (res) => {
          if (res.confirm) {
            common_vendor.index.clearStorageSync();
            this.isLoggedIn = false;
            this.userInfo = {};
            common_vendor.index.redirectTo({
              url: "/pages/login/login"
            });
          }
        }
      });
    },
    onRoomNumberInput(e) {
      this.roomNumber = e.detail.value;
    },
    async joinRoomByNumber() {
      if (!this.roomNumber) {
        common_vendor.index.showToast({
          title: "请输入房间号",
          icon: "none"
        });
        return;
      }
      if (!this.isLoggedIn) {
        common_vendor.index.showToast({
          title: "请先登录",
          icon: "none"
        });
        return;
      }
      const roomId = parseInt(this.roomNumber);
      if (isNaN(roomId) || roomId < 1e5 || roomId > 999999) {
        common_vendor.index.showToast({
          title: "请输入正确的6位房间号",
          icon: "none"
        });
        return;
      }
      common_vendor.index.navigateTo({
        url: `/pages/game/game?roomId=${roomId}`
      });
    },
    createRoom() {
      if (!this.isLoggedIn) {
        common_vendor.index.showToast({
          title: "请先登录",
          icon: "none"
        });
        return;
      }
      common_vendor.index.navigateTo({
        url: "/pages/game/game?create=true"
      });
    },
    async loadGameRooms() {
      var _a;
      this.loading = true;
      try {
        const response = await common_vendor.index.request({
          url: "http://localhost:8080/api/room/list",
          method: "GET",
          header: {
            "Content-Type": "application/json"
          }
        });
        console.log("房间列表响应:", response);
        if (response.statusCode === 200 && response.data.success) {
          const rooms = response.data.rooms || [];
          this.gameRooms = rooms.map((room) => ({
            id: room.roomId,
            name: room.roomName || `房间${room.roomId}`,
            status: room.status,
            players: room.currentPlayers || 0,
            maxPlayers: room.maxPlayers || 6
          }));
          console.log("处理后的房间数据:", this.gameRooms);
        } else {
          console.error("获取房间列表失败:", ((_a = response.data) == null ? void 0 : _a.message) || "未知错误");
          this.gameRooms = [];
        }
      } catch (error) {
        console.error("加载房间列表失败:", error);
        this.gameRooms = [];
        common_vendor.index.showToast({
          title: "加载房间列表失败",
          icon: "none"
        });
      } finally {
        this.loading = false;
      }
    },
    onRoomTap(roomId) {
      if (!this.isLoggedIn) {
        common_vendor.index.showToast({
          title: "请先登录",
          icon: "none"
        });
        return;
      }
      common_vendor.index.navigateTo({
        url: `/pages/game/game?roomId=${roomId}`
      });
    },
    refreshRooms() {
      this.loadGameRooms();
    },
    viewRanking() {
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.t($data.userInfo.username || "画家"),
    b: $data.isLoggedIn
  }, $data.isLoggedIn ? {
    c: common_vendor.o((...args) => $options.logout && $options.logout(...args))
  } : {}, {
    d: "30px",
    e: "46px",
    f: "10px",
    g: common_vendor.o([($event) => $data.roomNumber = $event.detail.value, (...args) => $options.onRoomNumberInput && $options.onRoomNumberInput(...args)]),
    h: $data.roomNumber,
    i: common_vendor.o((...args) => $options.joinRoomByNumber && $options.joinRoomByNumber(...args)),
    j: common_vendor.o((...args) => $options.createRoom && $options.createRoom(...args)),
    k: common_vendor.o((...args) => $options.refreshRooms && $options.refreshRooms(...args)),
    l: $data.loading,
    m: $data.loading
  }, $data.loading ? {} : common_vendor.e({
    n: common_vendor.f($data.gameRooms, (item, k0, i0) => {
      return common_vendor.e({
        a: common_vendor.t(item.name),
        b: item.status === "waiting"
      }, item.status === "waiting" ? {} : item.status === "playing" ? {} : {}, {
        c: item.status === "playing",
        d: common_vendor.n(item.status),
        e: common_vendor.t(item.players),
        f: common_vendor.t(item.maxPlayers),
        g: item.status === "waiting"
      }, item.status === "waiting" ? {} : {}, {
        h: item.id,
        i: common_vendor.o(($event) => $options.onRoomTap(item.id), item.id)
      });
    }),
    o: $data.gameRooms.length === 0 && !$data.loading
  }, $data.gameRooms.length === 0 && !$data.loading ? {} : {}), {
    p: common_vendor.o((...args) => $options.viewRanking && $options.viewRanking(...args)),
    q: $data.isLoggedIn
  }, $data.isLoggedIn ? {} : {}, {
    r: !$data.isLoggedIn
  }, !$data.isLoggedIn ? {
    s: common_vendor.o((...args) => $options.checkLoginStatus && $options.checkLoginStatus(...args))
  } : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__file", "E:/stu/实训/微信小程序/4源代码/DrawAndGuess_FrontEnd/pages/index/index.vue"]]);
wx.createPage(MiniProgramPage);
