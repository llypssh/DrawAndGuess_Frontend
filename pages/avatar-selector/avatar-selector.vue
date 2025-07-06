<template>
  <view class="container">
    <view class="header">
      <text class="title">完善个人信息</text>
      <text class="subtitle">请设置你的用户名并选择一个喜欢的头像</text>
    </view>
    
    <!-- 用户名设置 -->
    <view class="username-section" v-if="!loading">
      <view class="input-group">
        <text class="section-title">用户名</text>
        <input 
          class="username-input" 
          type="text" 
          placeholder="请设置您的用户名并选择一个喜欢的头像" 
          v-model="username"
          @input="onUsernameInput"
          maxlength="10"
          confirm-type="done"
        />
      </view>
      <view class="username-tips">
        <text class="tips-text">{{usernameLength}}/10</text>
      </view>
    </view>
    
    <!-- 加载中 -->
    <view class="loading" v-if="loading">
      <view class="loading-spinner"></view>
      <text>正在加载头像...</text>
    </view>
    
    <!-- 头像选择标题 -->
    <view class="avatar-header" v-if="!loading">
      <text class="section-title">选择头像</text>
    </view>
    
    <!-- 头像列表 -->
    <view class="avatar-grid" v-if="!loading">
      <view 
        :class="['avatar-item', selectedAvatar === avatar ? 'selected' : '']" 
        v-for="(avatar, index) in avatars" 
        :key="index"
        @tap="selectAvatar(avatar)"
      >
        <image class="avatar-image" :src="avatar" mode="aspectFill"></image>
        <text class="avatar-name">头像{{index + 1}}</text>
      </view>
    </view>
    
    <!-- 按钮区域 -->
    <view class="buttons" v-if="!loading">
      <button class="btn btn-default" @tap="useDefaultAvatar" :disabled="!isUsernameValid">使用默认头像</button>
      <button class="btn btn-primary" @tap="confirmSelection" :disabled="!selectedAvatar || !isUsernameValid">确认选择</button>
    </view>
    
    <!-- 提示信息 -->
    <view class="tips-section" v-if="!loading">
      <text class="tips-info" v-if="!isUsernameValid">⚠️ 请输入2-10个字符的用户名</text>
      <text class="tips-info" v-else-if="!selectedAvatar">💡 请选择一个头像</text>
      <text class="tips-success" v-else>✅ 信息完善，可以开始游戏了！</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'

const store = useStore()

// 响应式状态
const loading = ref(true)
const username = ref('')
const selectedAvatar = ref('')

// 头像列表
const avatars = ref([
  '/static/avatars/avatar1.png',
  '/static/avatars/avatar2.png',
  '/static/avatars/avatar3.png',
  '/static/avatars/avatar4.png',
  '/static/avatars/avatar5.png',
  '/static/avatars/avatar6.png'
])

// 方法
const selectAvatar = (avatar) => {
  selectedAvatar.value = avatar
}

const useDefaultAvatar = () => {
  if (!isUsernameValid.value) return
  selectedAvatar.value = '/static/avatars/avatar1.png'
  confirmSelection()
}

const confirmSelection = () => {
  if (!selectedAvatar.value || !isUsernameValid.value) return
  
  store.dispatch('updateUserInfo', {
    username: username.value,
    avatarUrl: selectedAvatar.value
  })

  uni.showToast({
    title: '保存成功',
    icon: 'success'
  })

  setTimeout(() => {
    uni.reLaunch({
      url: '/pages/index/index'
    })
  }, 1500)
}

const cancel = () => {
  uni.navigateBack()
}

// 计算属性
const usernameLength = computed(() => username.value.length)
const isUsernameValid = computed(() => username.value.length >= 2 && username.value.length <= 10)

// 生命周期
onMounted(() => {
  loading.value = false
})
</script>

<style>
.container {
  min-height: 100vh;
  padding: 40rpx;
  background-color: #fff;
}

.header {
  text-align: center;
  margin-bottom: 60rpx;
}

.title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 10rpx;
}

.subtitle {
  font-size: 28rpx;
  color: #666;
  display: block;
}

.username-section {
  margin-bottom: 40rpx;
}

.input-group {
  margin-bottom: 10rpx;
}

.section-title {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 20rpx;
  display: block;
}

.username-input {
  width: 100%;
  height: 88rpx;
  background-color: #f5f5f5;
  border-radius: 44rpx;
  padding: 0 30rpx;
  font-size: 28rpx;
}

.username-tips {
  text-align: right;
}

.tips-text {
  font-size: 24rpx;
  color: #999;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx 0;
}

.loading-spinner {
  width: 60rpx;
  height: 60rpx;
  border: 6rpx solid #f3f3f3;
  border-top: 6rpx solid #4CAF50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20rpx;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.avatar-header {
  margin-bottom: 30rpx;
}

.avatar-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30rpx;
  margin-bottom: 60rpx;
}

.avatar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx;
  border-radius: 16rpx;
  background-color: #f5f5f5;
  transition: all 0.3s ease;
}

.avatar-item.selected {
  background-color: #E8F5E9;
  border: 2rpx solid #4CAF50;
}

.avatar-image {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  margin-bottom: 10rpx;
}

.avatar-name {
  font-size: 24rpx;
  color: #666;
}

.buttons {
  display: flex;
  width: 485rpx;
  gap: 20rpx;
  margin-bottom: 40rpx;
}

.btn {
  flex: 1;
  height: 88rpx;
  border-radius: 44rpx;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}

.btn::after {
  display: none;
}

.btn-default {
  background-color: #f5f5f5;
  color: #333;
}

.btn-primary {
  background-color: #4CAF50;
  color: #fff;
}

.btn[disabled] {
  background-color: #BDBDBD;
  color: #fff;
}

.tips-section {
  text-align: center;
}

.tips-info {
  font-size: 26rpx;
  color: #FF9800;
}

.tips-success {
  font-size: 26rpx;
  color: #4CAF50;
}
</style>