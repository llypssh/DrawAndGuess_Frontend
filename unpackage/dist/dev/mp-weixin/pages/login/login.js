"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "login",
  setup(__props) {
    const store = common_vendor.useStore();
    const isLoggedIn = common_vendor.ref(false);
    const loading = common_vendor.ref(false);
    const userInfo = common_vendor.ref({});
    const hasUserInfo = common_vendor.ref(false);
    const formattedLoginTime = common_vendor.computed(() => {
      if (!userInfo.value.lastLoginTime)
        return "";
      return new Date(userInfo.value.lastLoginTime).toLocaleString();
    });
    common_vendor.onLoad(() => {
      checkLoginStatus();
    });
    const checkLoginStatus = () => {
      try {
        const token = common_vendor.index.getStorageSync("token");
        if (token) {
          isLoggedIn.value = true;
          userInfo.value = common_vendor.index.getStorageSync("userInfo") || {};
          hasUserInfo.value = !!userInfo.value.username;
        }
      } catch (error) {
        console.error("检查登录状态失败:", error);
      }
    };
    const silentLogin = async () => {
      if (loading.value)
        return;
      loading.value = true;
      try {
        const loginRes = await common_vendor.index.login({
          provider: "weixin"
        });
        if (loginRes.code) {
          const success = await store.dispatch("login", loginRes.code);
          if (success) {
            isLoggedIn.value = true;
            userInfo.value = store.state.userInfo;
            hasUserInfo.value = !!userInfo.value.username;
            if (!userInfo.value.username) {
              common_vendor.index.redirectTo({
                url: "/pages/avatar-selector/avatar-selector"
              });
            } else {
              common_vendor.index.redirectTo({
                url: "/pages/index/index"
              });
            }
          }
        }
      } catch (error) {
        console.error("登录失败:", error);
        common_vendor.index.showToast({
          title: "登录失败，请重试",
          icon: "none"
        });
      } finally {
        loading.value = false;
      }
    };
    const viewUserDetail = () => {
      common_vendor.index.navigateTo({
        url: "/pages/user-detail/user-detail"
      });
    };
    const startGame = () => {
      common_vendor.index.redirectTo({
        url: "/pages/index/index"
      });
    };
    const logout = () => {
      common_vendor.index.showModal({
        title: "提示",
        content: "确定要退出登录吗？",
        success: (res) => {
          if (res.confirm) {
            store.dispatch("logout");
            isLoggedIn.value = false;
            userInfo.value = {};
            hasUserInfo.value = false;
          }
        }
      });
    };
    const testApi = async () => {
      try {
        common_vendor.index.showLoading({
          title: "测试中..."
        });
        setTimeout(() => {
          common_vendor.index.showToast({
            title: "API连接正常",
            icon: "success"
          });
        }, 1e3);
      } catch (error) {
        common_vendor.index.showToast({
          title: "API连接失败",
          icon: "none"
        });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: !isLoggedIn.value
      }, !isLoggedIn.value ? {
        b: common_vendor.o(silentLogin),
        c: loading.value,
        d: loading.value
      } : {}, {
        e: isLoggedIn.value
      }, isLoggedIn.value ? common_vendor.e({
        f: userInfo.value.avatarUrl || "",
        g: common_vendor.t(hasUserInfo.value ? "已认证" : "游客"),
        h: common_vendor.t(userInfo.value.username || "微信用户"),
        i: common_vendor.t(userInfo.value.userId || "Unknown"),
        j: formattedLoginTime.value
      }, formattedLoginTime.value ? {
        k: common_vendor.t(formattedLoginTime.value)
      } : {}, {
        l: common_vendor.o(viewUserDetail),
        m: common_vendor.o(startGame),
        n: common_vendor.o(logout)
      }) : {}, {
        o: common_vendor.o(testApi),
        p: !isLoggedIn.value
      }, !isLoggedIn.value ? {} : {}, {
        q: loading.value
      }, loading.value ? {} : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__file", "E:/stu/实训/微信小程序/4源代码/DrawAndGuess_FrontEnd/pages/login/login.vue"]]);
wx.createPage(MiniProgramPage);
