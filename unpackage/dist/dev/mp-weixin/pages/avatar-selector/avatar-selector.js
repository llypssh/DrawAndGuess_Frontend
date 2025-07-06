"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "avatar-selector",
  setup(__props) {
    const store = common_vendor.useStore();
    const loading = common_vendor.ref(true);
    const username = common_vendor.ref("");
    const selectedAvatar = common_vendor.ref("");
    const avatars = common_vendor.ref([
      "/static/avatars/avatar1.png",
      "/static/avatars/avatar2.png",
      "/static/avatars/avatar3.png",
      "/static/avatars/avatar4.png",
      "/static/avatars/avatar5.png",
      "/static/avatars/avatar6.png"
    ]);
    const selectAvatar = (avatar) => {
      selectedAvatar.value = avatar;
    };
    const useDefaultAvatar = () => {
      if (!isUsernameValid.value)
        return;
      selectedAvatar.value = "/static/avatars/avatar1.png";
      confirmSelection();
    };
    const confirmSelection = () => {
      if (!selectedAvatar.value || !isUsernameValid.value)
        return;
      store.dispatch("updateUserInfo", {
        username: username.value,
        avatarUrl: selectedAvatar.value
      });
      common_vendor.index.showToast({
        title: "保存成功",
        icon: "success"
      });
      setTimeout(() => {
        common_vendor.index.reLaunch({
          url: "/pages/index/index"
        });
      }, 1500);
    };
    const usernameLength = common_vendor.computed(() => username.value.length);
    const isUsernameValid = common_vendor.computed(() => username.value.length >= 2 && username.value.length <= 10);
    common_vendor.onMounted(() => {
      loading.value = false;
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: !loading.value
      }, !loading.value ? {
        b: common_vendor.o([($event) => username.value = $event.detail.value, (...args) => _ctx.onUsernameInput && _ctx.onUsernameInput(...args)]),
        c: username.value,
        d: common_vendor.t(usernameLength.value)
      } : {}, {
        e: loading.value
      }, loading.value ? {} : {}, {
        f: !loading.value
      }, !loading.value ? {} : {}, {
        g: !loading.value
      }, !loading.value ? {
        h: common_vendor.f(avatars.value, (avatar, index, i0) => {
          return {
            a: avatar,
            b: common_vendor.t(index + 1),
            c: common_vendor.n(selectedAvatar.value === avatar ? "selected" : ""),
            d: index,
            e: common_vendor.o(($event) => selectAvatar(avatar), index)
          };
        })
      } : {}, {
        i: !loading.value
      }, !loading.value ? {
        j: common_vendor.o(useDefaultAvatar),
        k: !isUsernameValid.value,
        l: common_vendor.o(confirmSelection),
        m: !selectedAvatar.value || !isUsernameValid.value
      } : {}, {
        n: !loading.value
      }, !loading.value ? common_vendor.e({
        o: !isUsernameValid.value
      }, !isUsernameValid.value ? {} : !selectedAvatar.value ? {} : {}, {
        p: !selectedAvatar.value
      }) : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__file", "E:/stu/实训/微信小程序/4源代码/DrawAndGuess_FrontEnd/pages/avatar-selector/avatar-selector.vue"]]);
wx.createPage(MiniProgramPage);
