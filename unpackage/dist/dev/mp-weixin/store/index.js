"use strict";
const common_vendor = require("../common/vendor.js");
const BASE_URL = "http://localhost:8080/api";
const store = common_vendor.createStore({
  state: {
    userInfo: common_vendor.index.getStorageSync("userInfo") || {},
    token: common_vendor.index.getStorageSync("token") || "",
    isLoggedIn: false,
    currentRoom: null,
    roomMembers: []
  },
  mutations: {
    SET_USER_INFO(state, userInfo) {
      state.userInfo = userInfo;
      common_vendor.index.setStorageSync("userInfo", userInfo);
    },
    SET_TOKEN(state, token) {
      state.token = token;
      common_vendor.index.setStorageSync("token", token);
    },
    SET_LOGIN_STATUS(state, status) {
      state.isLoggedIn = status;
    },
    SET_CURRENT_ROOM(state, room) {
      state.currentRoom = room;
    },
    SET_ROOM_MEMBERS(state, members) {
      state.roomMembers = members;
    },
    CLEAR_USER_DATA(state) {
      state.userInfo = {};
      state.token = "";
      state.isLoggedIn = false;
      state.currentRoom = null;
      state.roomMembers = [];
      common_vendor.index.clearStorageSync();
    }
  },
  actions: {
    // 登录
    async login({ commit }, jsCode) {
      try {
        const res = await common_vendor.index.request({
          url: `${BASE_URL}/auth/wechat/login`,
          method: "POST",
          data: { jsCode }
        });
        if (res.data.code === 200 && res.data.data && res.data.data.success) {
          const { token, user } = res.data.data;
          commit("SET_USER_INFO", user);
          commit("SET_TOKEN", token);
          commit("SET_LOGIN_STATUS", true);
          return true;
        }
        return false;
      } catch (error) {
        console.error("登录失败:", error);
        return false;
      }
    },
    // 更新用户信息
    async updateUserInfo({ commit, state }, { username, avatarUrl }) {
      try {
        const res = await common_vendor.index.request({
          url: `${BASE_URL}/auth/user/update`,
          method: "POST",
          data: {
            openid: state.userInfo.openid,
            username,
            avatarUrl
          }
        });
        if (res.data.code === 200) {
          commit("SET_USER_INFO", {
            ...state.userInfo,
            username,
            avatarUrl
          });
          return true;
        }
        return false;
      } catch (error) {
        console.error("更新用户信息失败:", error);
        return false;
      }
    },
    // 创建房间
    async createRoom({ commit, state }, roomName) {
      try {
        const res = await common_vendor.index.request({
          url: `${BASE_URL}/room/create`,
          method: "POST",
          data: {
            roomName,
            creatorId: state.userInfo.openid
          }
        });
        if (res.data.code === 200 && res.data.data && res.data.data.success) {
          commit("SET_CURRENT_ROOM", res.data.room);
          return res.data.room;
        }
        return null;
      } catch (error) {
        console.error("创建房间失败:", error);
        return null;
      }
    },
    // 加入房间
    async joinRoom({ commit, state }, roomId) {
      try {
        const res = await common_vendor.index.request({
          url: `${BASE_URL}/room/join`,
          method: "POST",
          data: {
            roomId,
            userId: state.userInfo.openid
          }
        });
        if (res.data.code === 200 && res.data.data && res.data.data.success) {
          commit("SET_CURRENT_ROOM", res.data.room);
          return true;
        }
        return false;
      } catch (error) {
        console.error("加入房间失败:", error);
        return false;
      }
    },
    // 获取房间列表
    async getRoomList() {
      try {
        const res = await common_vendor.index.request({
          url: `${BASE_URL}/room/list`,
          method: "GET"
        });
        if (res.data.code === 200) {
          return res.data.rooms;
        }
        return [];
      } catch (error) {
        console.error("获取房间列表失败:", error);
        return [];
      }
    },
    // 获取房间详情
    async getRoomDetail({ commit }, roomId) {
      try {
        const res = await common_vendor.index.request({
          url: `${BASE_URL}/room/detail/${roomId}`,
          method: "GET"
        });
        if (res.data.code === 200 && res.data.data && res.data.data.success) {
          commit("SET_CURRENT_ROOM", res.data.room);
          commit("SET_ROOM_MEMBERS", res.data.members);
          return res.data;
        }
        return null;
      } catch (error) {
        console.error("获取房间详情失败:", error);
        return null;
      }
    },
    // 设置准备状态
    async setReady({ state }, roomId) {
      try {
        const res = await common_vendor.index.request({
          url: `${BASE_URL}/room/ready`,
          method: "POST",
          data: {
            roomId,
            userId: state.userInfo.openid
          }
        });
        return res.data.code === 200 && res.data.success;
      } catch (error) {
        console.error("设置准备状态失败:", error);
        return false;
      }
    },
    // 离开房间
    async leaveRoom({ commit, state }, roomId) {
      try {
        const res = await common_vendor.index.request({
          url: `${BASE_URL}/room/leave`,
          method: "POST",
          data: {
            roomId,
            userId: state.userInfo.openid
          }
        });
        if (res.data.code === 200 && res.data.success) {
          commit("SET_CURRENT_ROOM", null);
          commit("SET_ROOM_MEMBERS", []);
          return true;
        }
        return false;
      } catch (error) {
        console.error("离开房间失败:", error);
        return false;
      }
    },
    // 登出
    logout({ commit }) {
      commit("CLEAR_USER_DATA");
    }
  },
  getters: {
    isLoggedIn: (state) => state.isLoggedIn,
    userInfo: (state) => state.userInfo,
    token: (state) => state.token,
    currentRoom: (state) => state.currentRoom,
    roomMembers: (state) => state.roomMembers
  }
});
exports.store = store;
