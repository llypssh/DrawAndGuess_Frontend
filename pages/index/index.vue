<template>
  <view class="index-container">
    <!-- 自定义导航栏 -->
    <view class="custom-navbar" :style="{'height':  46 + 'px', 'padding-top': 10 + 'px'}">
      <view class="navbar-content" :style="{'height': 30 + 'px'}">
		<text class="welcome-subtitle">你好，{{userInfo.username || '画家'}}</text>
        <button class="logout-btn" @tap="logout" v-if="isLoggedIn">退出登录</button>
        <view class="placeholder"></view>
      </view>
    </view>
    <!-- 页面头部 -->
    <view class="header">
      <view class="welcome-section">
        <text class="welcome-title">🎨<br>欢迎来到创意绘画世界</text>
      </view>
    </view>

    <!-- 快速操作区域 -->
    <view class="quick-actions">
      <view class="join-room-section">
        <view class="input-group">
          <input 
            class="room-input" 
            type="text" 
            placeholder="请输入房间号" 
            v-model="roomNumber"
            @input="onRoomNumberInput"
            maxlength="10"
          />
          <button class="action-btn primary" @tap="joinRoomByNumber">
            <text class="action-icon">🚪</text>
            <text class="action-text">加入房间</text>
          </button>
        </view>
      </view>
      
      <button class="action-btn secondary" @tap="createRoom">
        <text class="action-icon">➕</text>
        <text class="action-text">创建房间</text>
      </button>
    </view>

    <!-- 游戏房间列表 -->
    <view class="rooms-section">
      <view class="section-header">
        <view class="header-content">
          <view class="header-text">
            <text class="section-title">🏠 游戏房间</text>
            <text class="section-subtitle">选择一个房间开始游戏</text>
          </view>
          <button class="refresh-btn" @tap="refreshRooms" :disabled="loading">
            <text class="refresh-icon">🔄</text>
            <text class="refresh-text">刷新</text>
          </button>
        </view>
      </view>

      <!-- 加载状态 -->
      <view class="loading" v-if="loading">
        <view class="loading-spinner"></view>
        <text class="loading-text">加载中...</text>
      </view>

      <!-- 房间列表 -->
      <view class="rooms-list" v-else>
        <view 
          class="room-item" 
          v-for="item in gameRooms" 
          :key="item.id"
          @tap="onRoomTap(item.id)">
          
          <view class="room-info">
            <view class="room-header">
              <text class="room-name">{{item.name}}</text>
              <view :class="['room-status', item.status]">
                <text v-if="item.status === 'waiting'">等待中</text>
                <text v-else-if="item.status === 'playing'">游戏中</text>
                <text v-else>未知</text>
              </view>
            </view>
            
            <view class="room-details">
              <text class="player-count">👥 {{item.players}}/{{item.maxPlayers}}</text>
              <text class="room-type">休闲模式</text>
            </view>
          </view>
          
          <view class="room-action">
            <text class="join-text" v-if="item.status === 'waiting'">加入</text>
            <text class="join-text disabled" v-else>观战</text>
            <text class="arrow">›</text>
          </view>
        </view>

        <!-- 空状态 -->
        <view class="empty-state" v-if="gameRooms.length === 0 && !loading">
          <text class="empty-icon">🎮</text>
          <text class="empty-text">暂无游戏房间</text>
          <text class="empty-desc">创建一个房间开始游戏吧！</text>
        </view>
      </view>
    </view>

    <!-- 功能区域 -->
    <view class="features-section">
      <view class="section-header">
        <text class="section-title">🌟 更多功能</text>
      </view>
      
      <view class="features-grid">
        <view class="feature-item" @tap="viewRanking">
          <text class="feature-icon">🏆</text>
          <text class="feature-text">排行榜</text>
        </view>
        
        <view class="feature-item">
          <text class="feature-icon">🎨</text>
          <text class="feature-text">画廊</text>
        </view>
        
        <view class="feature-item">
          <text class="feature-icon">⚙️</text>
          <text class="feature-text">设置</text>
        </view>
        
        <view class="feature-item">
          <text class="feature-icon">❓</text>
          <text class="feature-text">帮助</text>
        </view>
      </view>
    </view>

    <!-- 游戏统计 -->
    <view class="stats-section" v-if="isLoggedIn">
      <view class="section-header">
        <text class="section-title">📊 我的统计</text>
      </view>
      
      <view class="stats-grid">
        <view class="stat-item">
          <text class="stat-number">0</text>
          <text class="stat-label">游戏场次</text>
        </view>
        
        <view class="stat-item">
          <text class="stat-number">0</text>
          <text class="stat-label">胜利次数</text>
        </view>
        
        <view class="stat-item">
          <text class="stat-number">0</text>
          <text class="stat-label">猜对次数</text>
        </view>
        
        <view class="stat-item">
          <text class="stat-number">0</text>
          <text class="stat-label">积分</text>
        </view>
      </view>
    </view>

    <!-- 未登录提示 -->
    <view class="login-prompt" v-if="!isLoggedIn">
      <view class="prompt-content">
        <text class="prompt-icon">🔐</text>
        <text class="prompt-title">登录后体验更多功能</text>
        <text class="prompt-desc">保存游戏记录、查看排行榜、个性化设置</text>
        <button class="prompt-btn" @tap="checkLoginStatus">
          立即登录
        </button>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      navBarHeight: 0,
      statusBarHeight: 0,
      menuHeight: 0,
      isLoggedIn: false,
      userInfo: {},
      roomNumber: '',
      loading: false,
      gameRooms: []
    }
  },
  onLoad() {
    this.initNavBarHeight()
    this.checkLoginStatus()
    this.loadGameRooms()
  },
  methods: {
    initNavBarHeight() {
      const systemInfo = uni.getSystemInfoSync()
      this.statusBarHeight = systemInfo.statusBarHeight
      this.menuHeight = 44
      this.navBarHeight = this.statusBarHeight + this.menuHeight
    },
    async checkLoginStatus() {
      try {
        // 检查登录状态的逻辑
        const token = uni.getStorageSync('token')
        if (token) {
          this.isLoggedIn = true
          this.userInfo = uni.getStorageSync('userInfo') || {}
          if (!this.userInfo.username) {
            uni.redirectTo({
              url: '/pages/avatar-selector/avatar-selector'
            })
            return
          }
        } else {
          uni.redirectTo({
            url: '/pages/login/login'
          })
        }
      } catch (error) {
        console.error('检查登录状态失败:', error)
      }
    },
    logout() {
      uni.showModal({
        title: '提示',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            uni.clearStorageSync()
            this.isLoggedIn = false
            this.userInfo = {}
            uni.redirectTo({
              url: '/pages/login/login'
            })
          }
        }
      })
    },
    onRoomNumberInput(e) {
      this.roomNumber = e.detail.value
    },
    async joinRoomByNumber() {
      if (!this.roomNumber) {
        uni.showToast({
          title: '请输入房间号',
          icon: 'none'
        })
        return
      }
      
      if (!this.isLoggedIn) {
        uni.showToast({
          title: '请先登录',
          icon: 'none'
        })
        return
      }
      
      // 验证房间号格式（6位数字）
      const roomId = parseInt(this.roomNumber)
      if (isNaN(roomId) || roomId < 100000 || roomId > 999999) {
        uni.showToast({
          title: '请输入正确的6位房间号',
          icon: 'none'
        })
        return
      }
      
      // 跳转到游戏页面
      uni.navigateTo({
        url: `/pages/game/game?roomId=${roomId}`
      })
    },
    createRoom() {
      if (!this.isLoggedIn) {
        uni.showToast({
          title: '请先登录',
          icon: 'none'
        })
        return
      }
      // 创建房间并跳转到游戏页面
      uni.navigateTo({
        url: '/pages/game/game?create=true'
      })
    },
    async loadGameRooms() {
      this.loading = true
      try {
        const response = await uni.request({
          url: 'http://localhost:8080/api/room/list',
          method: 'GET',
          header: {
            'Content-Type': 'application/json'
          }
        })
        
        console.log('房间列表响应:', response)
        
        if (response.statusCode === 200 && response.data.success) {
          const rooms = response.data.rooms || []
          // 转换数据格式以匹配前端显示需求
          this.gameRooms = rooms.map(room => ({
            id: room.roomId,
            name: room.roomName || `房间${room.roomId}`,
            status: room.status,
            players: room.currentPlayers || 0,
            maxPlayers: room.maxPlayers || 6
          }))
          console.log('处理后的房间数据:', this.gameRooms)
        } else {
          console.error('获取房间列表失败:', response.data?.message || '未知错误')
          this.gameRooms = []
        }
      } catch (error) {
        console.error('加载房间列表失败:', error)
        this.gameRooms = []
        uni.showToast({
          title: '加载房间列表失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },
    onRoomTap(roomId) {
      if (!this.isLoggedIn) {
        uni.showToast({
          title: '请先登录',
          icon: 'none'
        })
        return
      }
      uni.navigateTo({
        url: `/pages/game/game?roomId=${roomId}`
      })
    },
    refreshRooms() {
      this.loadGameRooms()
    },
    viewRanking() {
      // 查看排行榜的逻辑
    }
  }
}
</script>

<style>

.index-container {
  min-height: 100vh;
  background-color: #f6f6f6;
  padding-bottom: 40rpx;
}
.custom-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background-color: #ffffff;
  z-index: 100;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}
.navbar-content {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 30rpx;
}
.logout-btn {
  font-size: 28rpx;
  color: blue;
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  line-height: 1;
}
.logout-btn::after {
  display: none;
}
.header {
  margin-top: 180rpx;
  padding: 40rpx 30rpx;
}
.welcome-section {
  text-align: center;
}
.welcome-title {
  font-size: 48rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
  display: block;
}
.welcome-subtitle {
  font-size: 28rpx;
  color: #666;
  position: relative;
  left: -200px;
  top: -2px;
}
.quick-actions {
  padding: 30rpx;
  background-color: #fff;
  border-radius: 20rpx;
  margin: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}
.join-room-section {
  margin-bottom: 20rpx;
}
.input-group {
  display: flex;
  gap: 20rpx;
}
.room-input {
  flex: 1;
  height: 80rpx;
  background: #f5f5f5;
  border-radius: 40rpx;
  padding: 0 30rpx;
  font-size: 28rpx;
}
.action-btn {
  height: 80rpx;
  border-radius: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  border: none;
  padding: 0 40rpx;
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
  width: 100%;
}
.action-icon {
  margin-right: 10rpx;
  font-size: 32rpx;
}
.rooms-section {
  margin: 30rpx;
  background-color: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}
.section-header {
  margin-bottom: 30rpx;
}
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.header-text {
  flex: 1;
}
.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  display: block;
}
.section-subtitle {
  font-size: 24rpx;
  color: #999;
  margin-top: 10rpx;
  display: block;
}
.refresh-btn {
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border: none;
  border-radius: 20rpx;
  padding: 10rpx 20rpx;
  font-size: 24rpx;
  color: #666;
}
.refresh-btn::after {
  display: none;
}
.refresh-btn:disabled {
  opacity: 0.6;
}
.refresh-icon {
  margin-right: 8rpx;
  font-size: 28rpx;
}
.refresh-text {
  font-size: 24rpx;
}
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 0;
}
.loading-spinner {
  width: 60rpx;
  height: 60rpx;
  border: 6rpx solid #f3f3f3;
  border-top: 6rpx solid #4CAF50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
0% { transform: rotate(0deg);
}
100% { transform: rotate(360deg);
}
}
.loading-text {
  margin-top: 20rpx;
  font-size: 28rpx;
  color: #999;
}
.room-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  background: #f9f9f9;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
}
.room-info {
  flex: 1;
}
.room-header {
  display: flex;
  align-items: center;
  margin-bottom: 10rpx;
}
.room-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-right: 20rpx;
}
.room-status {
  font-size: 24rpx;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
}
.room-status.waiting {
  background-color: #E8F5E9;
  color: #4CAF50;
}
.room-status.playing {
  background-color: #FFF3E0;
  color: #FF9800;
}
.room-details {
  display: flex;
  gap: 20rpx;
}
.player-count, .room-type {
  font-size: 24rpx;
  color: #666;
}
.room-action {
  display: flex;
  align-items: center;
}
.join-text {
  font-size: 28rpx;
  color: #4CAF50;
  margin-right: 10rpx;
}
.join-text.disabled {
  color: #999;
}
.arrow {
  font-size: 36rpx;
  color: #999;
}
.empty-state {
  text-align: center;
  padding: 60rpx 0;
}
.empty-icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
  display: block;
}
.empty-text {
  font-size: 32rpx;
  color: #333;
  margin-bottom: 10rpx;
  display: block;
}
.empty-desc {
  font-size: 24rpx;
  color: #999;
  display: block;
}
.features-section {
  margin: 30rpx;
  background-color: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}
.features-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20rpx;
}
.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx;
}
.feature-icon {
  font-size: 48rpx;
  margin-bottom: 10rpx;
}
.feature-text {
  font-size: 24rpx;
  color: #666;
}
.stats-section {
  margin: 30rpx;
  background-color: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20rpx;
}
.stat-item {
  text-align: center;
}
.stat-number {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 10rpx;
}
.stat-label {
  font-size: 24rpx;
  color: #666;
  display: block;
}
.login-prompt {
  margin: 30rpx;
  background-color: #fff;
  border-radius: 20rpx;
  padding: 40rpx 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}
.prompt-content {
  text-align: center;
}
.prompt-icon {
  font-size: 64rpx;
  margin-bottom: 20rpx;
  display: block;
}
.prompt-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 10rpx;
  display: block;
}
.prompt-desc {
  font-size: 24rpx;
  color: #666;
  margin-bottom: 30rpx;
  display: block;
}
.prompt-btn {
  background-color: #4CAF50;
  color: #fff;
  font-size: 28rpx;
  border-radius: 40rpx;
  width: 60%;
  height: 80rpx;
  line-height: 80rpx;
}
.prompt-btn::after {
  display: none;
}

</style>