<template>
  <view class="login-container">
    <!-- 页面头部 -->
    <view class="header">
      <view class="logo-container">
        <image class="logo" src="/static/icons/art.png" mode="aspectFit"></image>
      </view>
      <text class="title">你画我猜</text>
      <text class="subtitle">欢迎来到创意绘画世界</text>
    </view>

    <!-- 未登录状态 -->
    <view v-if="!isLoggedIn" class="login-section">
      <view class="login-tips">
        <text class="tips-text">🎨 准备好展示你的绘画天赋了吗？</text>
        <text class="tips-subtitle">请先登录以获得完整的游戏体验</text>
      </view>
      
      <view class="login-buttons">
        <!-- 快速登录按钮 -->
        <button 
          class="login-btn silent-login" 
          @tap="silentLogin"
          :loading="loading"
          :disabled="loading">
          <view class="btn-content">
            <text class="btn-icon">⚡</text>
            <text class="btn-text">快速登录</text>
          </view>
        </button>
      </view>
      
      <view class="login-desc">
        <view class="desc-item">
          <text class="desc-icon">⚡</text>
          <text class="desc-text">快速登录：仅获取基本登录凭证，快速进入游戏</text>
        </view>
      </view>
    </view>

    <!-- 已登录状态 -->
    <view v-if="isLoggedIn" class="user-section">
      <view class="welcome-text">
        <text class="welcome-title">欢迎回来！</text>
        <text class="welcome-subtitle">准备好开始新的创作之旅了吗？</text>
      </view>
      
      <view class="user-info" @tap="viewUserDetail">
        <view class="avatar-container">
          <image 
            class="avatar" 
            :src="userInfo.avatarUrl || ''" 
            mode="aspectFill">
          </image>
          <view class="avatar-badge">{{hasUserInfo ? '已认证' : '游客'}}</view>
        </view>
        
        <view class="user-details">
          <text class="username">{{userInfo.username || '微信用户'}}</text>
          <text class="user-id">ID: {{userInfo.userId || 'Unknown'}}</text>
          <text class="login-time" v-if="formattedLoginTime">
            最后登录: {{formattedLoginTime}}
          </text>
        </view>
        
        <view class="detail-arrow">›</view>
      </view>
      
      <view class="user-actions">
        <button class="action-btn primary" @tap="startGame">
          <text class="action-icon">🎮</text>
          <text class="action-text">开始游戏</text>
        </button>
        
        <button class="action-btn secondary" @tap="logout">
          <text class="action-icon">🚪</text>
          <text class="action-text">退出登录</text>
        </button>
      </view>
    </view>

    <!-- 功能按钮区域 -->
    <view class="function-section">
      <button class="function-btn" @tap="testApi">
        <text class="function-icon">🔗</text>
        <text class="function-text">测试API连接</text>
      </button>
    </view>

    <!-- 游戏特色介绍 -->
    <view class="features-section" v-if="!isLoggedIn">
      <view class="features-title">
        <text>🌟 游戏特色</text>
      </view>
      <view class="features-list">
        <view class="feature-item">
          <text class="feature-icon">🎨</text>
          <text class="feature-text">自由绘画创作</text>
        </view>
        <view class="feature-item">
          <text class="feature-icon">🤔</text>
          <text class="feature-text">趣味猜词挑战</text>
        </view>
        <view class="feature-item">
          <text class="feature-icon">👥</text>
          <text class="feature-text">多人在线互动</text>
        </view>
        <view class="feature-item">
          <text class="feature-icon">🏆</text>
          <text class="feature-text">排行榜竞技</text>
        </view>
      </view>
    </view>

    <!-- 底部信息 -->
    <view class="footer">
      <text class="footer-text">登录即表示同意</text>
      <text class="footer-link">《用户协议》</text>
      <text class="footer-text">和</text>
      <text class="footer-link">《隐私政策》</text>
    </view>
    
    <!-- 版本信息 -->
    <view class="version-info">
      <text class="version-text">Version 1.0.0</text>
    </view>

    <!-- 加载遮罩 -->
    <view class="loading-mask" v-if="loading">
      <view class="loading-content">
        <view class="loading-spinner"></view>
        <text class="loading-text">登录中...</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { onLoad } from '@dcloudio/uni-app'

const store = useStore()

// 响应式状态
const isLoggedIn = ref(false)
const loading = ref(false)
const userInfo = ref({})
const hasUserInfo = ref(false)

// 计算属性
const formattedLoginTime = computed(() => {
  if (!userInfo.value.lastLoginTime) return ''
  return new Date(userInfo.value.lastLoginTime).toLocaleString()
})

// 生命周期
onLoad(() => {
  checkLoginStatus()
})

// 方法
const checkLoginStatus = () => {
  try {
    const token = uni.getStorageSync('token')
    if (token) {
      isLoggedIn.value = true
      userInfo.value = uni.getStorageSync('userInfo') || {}
      hasUserInfo.value = !!userInfo.value.username
    }
  } catch (error) {
    console.error('检查登录状态失败:', error)
  }
}

const silentLogin = async () => {
  if (loading.value) return
  loading.value = true
  
  try {
    const loginRes = await uni.login({
      provider: 'weixin'
    })
    
    if (loginRes.code) {
      const success = await store.dispatch('login', loginRes.code)
      if (success) {
        isLoggedIn.value = true
        userInfo.value = store.state.userInfo
        hasUserInfo.value = !!userInfo.value.username
        if (!userInfo.value.username) {
          uni.redirectTo({
            url: '/pages/avatar-selector/avatar-selector'
          })
        } else {
          uni.redirectTo({
            url: '/pages/index/index'
          })
        }
      }
    }
  } catch (error) {
    console.error('登录失败:', error)
    uni.showToast({
      title: '登录失败，请重试',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

const viewUserDetail = () => {
  uni.navigateTo({
    url: '/pages/user-detail/user-detail'
  })
}

const startGame = () => {
  uni.redirectTo({
    url: '/pages/index/index'
  })
}

const logout = () => {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        store.dispatch('logout')
        isLoggedIn.value = false
        userInfo.value = {}
        hasUserInfo.value = false
      }
    }
  })
}

const testApi = async () => {
  try {
    uni.showLoading({
      title: '测试中...'
    })
    // TODO: 实现API测试逻辑
    setTimeout(() => {
      uni.showToast({
        title: 'API连接正常',
        icon: 'success'
      })
    }, 1000)
  } catch (error) {
    uni.showToast({
      title: 'API连接失败',
      icon: 'none'
    })
  } finally {
    uni.hideLoading()
  }
}
</script>

<style>
.login-container {
  min-height: 100vh;
  padding: 40rpx;
  background-color: #fff;
}

.header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 60rpx;
}

.logo-container {
  width: 160rpx;
  height: 160rpx;
  margin-bottom: 20rpx;
}

.logo {
  width: 100%;
  height: 100%;
}

.title {
  font-size: 48rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 10rpx;
}

.subtitle {
  font-size: 28rpx;
  color: #666;
}

.login-section {
  margin-bottom: 60rpx;
}

.login-tips {
  text-align: center;
  margin-bottom: 40rpx;
}

.tips-text {
  font-size: 32rpx;
  color: #333;
  display: block;
  margin-bottom: 10rpx;
}

.tips-subtitle {
  font-size: 26rpx;
  color: #666;
  display: block;
}

.login-buttons {
  margin-bottom: 30rpx;
}

.login-btn {
  width: 100%;
  height: 88rpx;
  border-radius: 44rpx;
  margin-bottom: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}

.login-btn::after {
  display: none;
}

.silent-login {
  background-color: #4CAF50;
  color: #fff;
}

.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon {
  margin-right: 10rpx;
  font-size: 32rpx;
}

.btn-text {
  font-size: 28rpx;
}

.login-desc {
  padding: 0 20rpx;
}

.desc-item {
  display: flex;
  align-items: center;
  margin-bottom: 10rpx;
}

.desc-icon {
  margin-right: 10rpx;
  font-size: 24rpx;
}

.desc-text {
  font-size: 24rpx;
  color: #666;
}

.user-section {
  margin-bottom: 60rpx;
}

.welcome-text {
  text-align: center;
  margin-bottom: 40rpx;
}

.welcome-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 10rpx;
}

.welcome-subtitle {
  font-size: 28rpx;
  color: #666;
  display: block;
}

.user-info {
  background-color: #f8f8f8;
  border-radius: 20rpx;
  padding: 30rpx;
  display: flex;
  align-items: center;
  margin-bottom: 30rpx;
}

.avatar-container {
  position: relative;
  margin-right: 20rpx;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  background-color: #eee;
}

.avatar-badge {
  position: absolute;
  bottom: -10rpx;
  left: 50%;
  transform: translateX(-50%);
  background-color: #4CAF50;
  color: #fff;
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 10rpx;
}

.user-details {
  flex: 1;
}

.username {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 6rpx;
}

.user-id {
  font-size: 24rpx;
  color: #999;
  display: block;
  margin-bottom: 6rpx;
}

.login-time {
  font-size: 22rpx;
  color: #999;
  display: block;
}

.detail-arrow {
  font-size: 40rpx;
  color: #999;
}

.user-actions {
  display: flex;
  gap: 20rpx;
}

.action-btn {
  flex: 1;
  height: 88rpx;
  border-radius: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}

.action-btn::after {
  display: none;
}

.action-btn.primary {
  background-color: #4CAF50;
  color: #fff;
}

.action-btn.secondary {
  background-color: #f5f5f5;
  color: #333;
}

.action-icon {
  margin-right: 10rpx;
}

.function-section {
  margin-bottom: 60rpx;
}

.function-btn {
  width: 100%;
  height: 88rpx;
  border-radius: 44rpx;
  background-color: #f5f5f5;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}

.function-btn::after {
  display: none;
}

.function-icon {
  margin-right: 10rpx;
}

.features-section {
  margin-bottom: 60rpx;
}

.features-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
  text-align: center;
}

.features-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

.feature-item {
  background-color: #f8f8f8;
  border-radius: 16rpx;
  padding: 30rpx;
  text-align: center;
}

.feature-icon {
  font-size: 48rpx;
  margin-bottom: 10rpx;
  display: block;
}

.feature-text {
  font-size: 26rpx;
  color: #333;
}

.footer {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 20rpx;
}

.footer-text {
  font-size: 24rpx;
  color: #999;
}

.footer-link {
  font-size: 24rpx;
  color: #4CAF50;
  margin: 0 6rpx;
}

.version-info {
  text-align: center;
}

.version-text {
  font-size: 22rpx;
  color: #999;
}

.loading-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-content {
  background-color: rgba(0, 0, 0, 0.7);
  border-radius: 16rpx;
  padding: 30rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.loading-spinner {
  width: 60rpx;
  height: 60rpx;
  border: 6rpx solid #f3f3f3;
  border-top: 6rpx solid #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20rpx;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  font-size: 28rpx;
  color: #fff;
}
</style>