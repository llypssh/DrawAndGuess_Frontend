<template>
  <view class="game-container">
    <!-- 顶部状态栏 -->
    <view class="status-bar">
      <view class="connection-status">
        <text class="status-text">连接状态: {{connectionStatus}}</text>
        <view :class="['status-indicator', isConnected ? 'connected' : 'disconnected']"></view>
      </view>
      <button class="refresh-btn" size="mini" @tap="refreshRoomInfo">刷新</button>
    </view>

    <!-- 房间信息卡片 -->
    <view class="room-info-card">
      <view class="room-header">
        <text class="room-title">{{roomName || '游戏房间'}}</text>
        <view class="room-id-container" @tap="copyRoomId">
          <text class="room-id">房间号: {{roomId || '未知'}}</text>
          <text class="copy-hint">点击复制</text>
        </view>
      </view>
      
      <view class="room-stats">
        <view class="stat-item">
          <text class="stat-label">在线人数</text>
          <text class="stat-value">{{memberCount}}/{{maxMembers}}</text>
        </view>
        <view class="stat-item">
          <text class="stat-label">准备人数</text>
          <text class="stat-value">{{readyCount}}/{{memberCount}}</text>
        </view>
      </view>
    </view>

    <!-- 游戏状态 -->
    <view class="game-status">
      <view class="status-item">
        <text class="status-label">游戏状态:</text>
        <text :class="['status-value', gameStarted ? 'started' : 'waiting']">{{gameStarted ? '进行中' : '等待中'}}</text>
      </view>
      <view class="status-item" v-if="!gameStarted">
        <text class="status-label">我的状态:</text>
        <text :class="['status-value', isReady ? 'ready' : 'not-ready']">{{isReady ? '已准备' : '未准备'}}</text>
      </view>
    </view>

    <!-- 玩家列表 -->
    <view class="players-container" v-if="!gameStarted">
      <view class="players-header">
        <text class="players-title">房间玩家 ({{memberCount}}/{{maxMembers}})</text>
      </view>
      <view class="players-list">
        <view class="player-item" v-for="item in playerList" :key="item.userId">
          <view class="player-info">
            <view class="player-avatar">
              <image v-if="item.avatarUrl" class="avatar-image" :src="item.avatarUrl" mode="aspectFill"></image>
              <text v-else class="avatar-text">{{item.displayName.charAt(0)}}</text>
            </view>
            <view class="player-details">
              <text class="player-name">{{item.displayName}}</text>
              <view class="player-tags">
                <text class="tag creator-tag" v-if="item.isCreator">房主</text>
                <text :class="['tag', 'ready-tag', item.isReady ? 'ready' : 'not-ready']">{{item.isReady ? '已准备' : '未准备'}}</text>
                <text class="tag self-tag" v-if="item.userId === userId">我</text>
              </view>
            </view>
          </view>
          <view class="player-status">
            <view :class="['status-indicator', item.isReady ? 'ready' : 'not-ready']"></view>
          </view>
        </view>
        <view class="players-empty" v-if="playerList.length === 0">
          <text>暂无玩家信息</text>
        </view>
      </view>
    </view>

    <!-- 操作按钮区域 -->
    <view class="action-buttons" v-if="!gameStarted">
      <button 
        :class="['action-btn', 'ready-btn', isReady ? 'ready' : 'not-ready']" 
        @tap="toggleReady"
        :disabled="!isConnected"
      >
        {{isReady ? '取消准备' : '准备'}}
      </button>
      
      <button 
        class="action-btn start-btn" 
        @tap="startGame"
        :disabled="!isConnected || !isCreator || readyCount < memberCount"
        v-if="isCreator"
      >
        开始游戏
      </button>
      
      <button 
        class="action-btn leave-btn" 
        @tap="leaveRoom"
      >
        离开房间
      </button>
    </view>

    <!-- 游戏中的操作 -->
    <view class="game-actions" v-if="gameStarted">
      <text class="game-tip">游戏进行中...</text>
      <button class="action-btn leave-btn" @tap="leaveRoom">离开游戏</button>
    </view>

    <!-- 消息列表 -->
    <view class="message-container">
      <view class="message-header">
        <text class="message-title">房间消息</text>
      </view>
      <scroll-view class="message-list" scroll-y="true" :scroll-top="scrollTop">
        <view class="message-item" v-for="item in messages" :key="item.id">
          <view class="message-time">{{item.time}}</view>
          <view :class="['message-content', item.type]">
            {{item.content}}
          </view>
        </view>
        <view class="message-empty" v-if="messages.length === 0">
          <text>暂无消息</text>
        </view>
      </scroll-view>
    </view>

    <!-- 底部提示 -->
    <view class="bottom-tips">
      <text class="tip-text" v-if="!isConnected">请检查网络连接</text>
      <text class="tip-text" v-else-if="memberCount < 2">等待更多玩家加入...</text>
      <text class="tip-text" v-else-if="readyCount < memberCount && !gameStarted">等待所有玩家准备...</text>
      <text class="tip-text" v-else-if="isCreator && readyCount === memberCount && memberCount >= 2 && !gameStarted">所有玩家已准备，可以开始游戏！</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useStore } from 'vuex'

const store = useStore()

// 响应式状态
const connectionStatus = ref('未连接')
const isConnected = ref(false)
const roomName = ref('')
const roomId = ref('')
const memberCount = ref(0)
const maxMembers = ref(8)
const readyCount = ref(0)
const gameStarted = ref(false)
const isReady = ref(false)
const isCreator = ref(false)
const userId = ref('')
const playerList = ref([])
const messages = ref([])
const scrollTop = ref(0)
const websocket = ref(null)

// 生命周期
onLoad((options) => {
  // 初始化用户ID
  const userInfo = store.state.userInfo || {}
  userId.value = userInfo.openid || userInfo.userId || 'default_user'
  
  console.log('onLoad初始化:', { userInfo, userId: userId.value, options })
  
  if (options.create === 'true') {
    // 创建房间模式
    createNewRoom()
  } else if (options.roomId) {
    // 加入已有房间模式
    roomId.value = options.roomId
    initGame()
  } else {
    // 参数错误，返回首页
    uni.showToast({
      title: '参数错误',
      icon: 'none'
    })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  }
})

onUnmounted(() => {
  closeWebSocket()
})

// 方法
const initGame = () => {
  initWebSocket()
  loadRoomInfo()
}

const initWebSocket = () => {
  try {
    // 验证必要数据
    if (!roomId.value) {
      console.error('initWebSocket: roomId未设置')
      return
    }
    
    const token = uni.getStorageSync('token')
    if (!token) {
      console.error('initWebSocket: token未找到')
      return
    }
    
    const wsUrl = `ws://localhost:8080/ws/room/${roomId.value}?token=${token}`
    
    websocket.value = uni.connectSocket({
      url: wsUrl,
      success: () => {
        console.log('WebSocket连接成功')
      }
    })

    uni.onSocketOpen(() => {
      isConnected.value = true
      connectionStatus.value = '已连接'
      console.log('WebSocket连接已建立')
      
      // 发送加入房间消息
      const userInfo = store.state.userInfo || {}
      const parsedRoomId = parseInt(roomId.value)
      const currentUserId = userInfo.openid || userInfo.userId || userId.value
      
      // 验证必要参数
      if (!parsedRoomId || isNaN(parsedRoomId)) {
        console.error('无效的房间ID:', roomId.value)
        return
      }
      if (!currentUserId) {
        console.error('无效的用户ID:', currentUserId)
        return
      }
      
      console.log('用户信息验证:', { userInfo, currentUserId, parsedRoomId })
      
      const joinMessage = {
        action: 'join_room',
        roomId: parsedRoomId,
        userId: currentUserId
      }
      
      console.log('发送加入房间消息:', joinMessage)
      
      // 确保WebSocket连接状态正确
      setTimeout(() => {
        if (isConnected.value) {
          sendWebSocketMessage(joinMessage)
        } else {
          console.error('WebSocket连接状态异常，无法发送消息')
        }
      }, 100)
    })

    uni.onSocketClose(() => {
      isConnected.value = false
      connectionStatus.value = '已断开'
    })

    uni.onSocketError((error) => {
      console.error('WebSocket错误:', error)
      isConnected.value = false
      connectionStatus.value = '连接错误'
    })

    uni.onSocketMessage((res) => {
      handleWebSocketMessage(res.data)
    })
  } catch (error) {
    console.error('初始化WebSocket失败:', error)
  }
}

const closeWebSocket = () => {
  if (isConnected.value) {
    uni.closeSocket()
    isConnected.value = false
  }
}

const loadRoomInfo = async () => {
  try {
    // 加载房间信息的逻辑
  } catch (error) {
    console.error('加载房间信息失败:', error)
  }
}

const createNewRoom = async () => {
  try {
    const token = uni.getStorageSync('token')
    const userInfo = store.state.userInfo || {}
    const response = await uni.request({
      url: 'http://localhost:8080/api/room/create',
      method: 'POST',
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        roomName: '新房间',
        creatorId: userInfo.openid || userInfo.userId || 'default_user'
      }
    })
    
    console.log('创建房间响应:', response.data)
    
    if (response.data.success) {
      roomId.value = response.data.roomId
      roomName.value = response.data.roomName
      isCreator.value = true
      initGame()
    } else {
      uni.showToast({
        title: response.data.message || '创建房间失败',
        icon: 'none'
      })
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    }
  } catch (error) {
    console.error('创建房间失败:', error)
    uni.showToast({
      title: '创建房间失败',
      icon: 'none'
    })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  }
}

const refreshRoomInfo = () => {
  loadRoomInfo()
}

const copyRoomId = () => {
  uni.setClipboardData({
    data: roomId.value,
    success: () => {
      uni.showToast({
        title: '房间号已复制',
        icon: 'success'
      })
    }
  })
}

const toggleReady = () => {
  if (!isConnected.value) return
  
  const userInfo = store.state.userInfo || {}
    const parsedRoomId = parseInt(roomId.value)
    const currentUserId = userInfo.openid || userInfo.userId || userId.value
  
  // 验证必要参数
  if (!parsedRoomId || isNaN(parsedRoomId)) {
    console.error('toggleReady: 无效的房间ID:', roomId.value)
    return
  }
  if (!currentUserId) {
    console.error('toggleReady: 无效的用户ID:', currentUserId)
    return
  }
  
  isReady.value = !isReady.value
  // 发送准备状态到服务器
  sendWebSocketMessage({
    action: 'toggle_ready',
    roomId: parsedRoomId,
    userId: currentUserId,
    isReady: isReady.value
  })
}

const startGame = () => {
  if (!isConnected.value || !isCreator.value || readyCount.value < memberCount.value) return
  
  const parsedRoomId = parseInt(roomId.value)
  if (!parsedRoomId || isNaN(parsedRoomId)) {
    console.error('startGame: 无效的房间ID:', roomId.value)
    return
  }
  
  // 发送开始游戏消息到服务器
  sendWebSocketMessage({
    action: 'start_game',
    roomId: parsedRoomId
  })
}

const leaveRoom = () => {
  uni.showModal({
    title: '提示',
    content: '确定要离开房间吗？',
    success: (res) => {
      if (res.confirm) {
        // 发送离开房间消息给后端
        if (websocket.value && websocket.value.readyState === 1) {
          const parsedRoomId = parseInt(roomId.value)
          const currentUserId = userId.value
          
          // 验证必要参数
          if (parsedRoomId && !isNaN(parsedRoomId) && currentUserId) {
            const leaveMessage = {
              action: 'leave_room',
              roomId: parsedRoomId,
              userId: currentUserId
            }
            console.log('发送离开房间消息:', leaveMessage)
            sendWebSocketMessage(leaveMessage)
          } else {
            console.error('leaveRoom: 无效的参数', { roomId: roomId.value, userId: userId.value })
          }
          
          // 等待一小段时间确保消息发送完成，然后关闭连接
          setTimeout(() => {
            closeWebSocket()
            uni.navigateBack()
          }, 100)
        } else {
          closeWebSocket()
          uni.navigateBack()
        }
      }
    }
  })
}

const handleWebSocketMessage = (data) => {
  try {
    const message = JSON.parse(data)
    console.log('收到WebSocket消息:', message)
    
    // 处理后端发送的action字段消息
    if (message.action) {
      switch (message.action) {
        case 'room_status_update':
          handleRoomStatusUpdate(message)
          break
        case 'user_joined':
          handleUserJoined(message)
          break
        case 'user_ready':
          handleUserReady(message)
          break
        case 'room_created':
          handleRoomCreated(message)
          break
        case 'room_joined':
          handleRoomJoined(message)
          break
        case 'room_left':
          handleRoomLeft(message)
          break
        case 'user_left':
          handleUserLeft(message)
          break
        case 'error':
          handleErrorMessage(message)
          break
        default:
          console.log('未处理的action类型:', message.action)
      }
      return
    }
    
    // 兼容旧的type字段消息格式
    switch (message.type) {
      case 'roomInfo':
        updateRoomInfo(message.data)
        break
      case 'playerList':
        updatePlayerList(message.data)
        break
      case 'gameStart':
        handleGameStart(message.data)
        break
      case 'gameOver':
        handleGameOver(message.data)
        break
      case 'roundStart':
        handleRoundStart(message.data)
        break
      case 'roundEnd':
        handleRoundEnd(message.data)
        break
      case 'draw':
        handleDrawData(message.data)
        break
      case 'guess':
        handleGuessMessage(message.data)
        break
      case 'chat':
        handleChatMessage(message.data)
        break
      case 'error':
        handleErrorMessage(message.data)
        break
      default:
        console.log('未处理的消息类型:', message.type || message.action)
    }
  } catch (error) {
    console.error('处理WebSocket消息失败:', error)
  }
}

const sendWebSocketMessage = (message) => {
  console.log('sendWebSocketMessage调用:', { message, isConnected: isConnected.value })
  
  // 严格验证WebSocket连接状态
  if (!isConnected.value) {
    console.warn('WebSocket未连接，跳过发送消息')
    return
  }
  
  // 严格验证消息参数
  if (message === undefined || message === null) {
    console.error('sendWebSocketMessage: 消息参数为undefined或null', message)
    return
  }
  
  if (typeof message !== 'object') {
    console.error('sendWebSocketMessage: 消息参数不是对象类型', typeof message, message)
    return
  }
  
  // 验证消息必要字段
  if (!message.action) {
    console.error('sendWebSocketMessage: 消息缺少action字段', message)
    return
  }
  
  try {
    const messageStr = JSON.stringify(message)
    
    // 验证序列化结果
    if (!messageStr || messageStr === 'undefined' || messageStr === 'null') {
      console.error('sendWebSocketMessage: JSON序列化结果无效', messageStr)
      return
    }
    
    console.log('发送WebSocket消息:', message, '序列化后:', messageStr)
    uni.sendSocketMessage({
      data: messageStr
    })
  } catch (error) {
    console.error('发送WebSocket消息失败:', error, '消息:', message)
  }
}

const updateRoomInfo = (data) => {
  roomName.value = data.name
  memberCount.value = data.memberCount
  maxMembers.value = data.maxMembers
  readyCount.value = data.readyCount
  gameStarted.value = data.gameStarted
}

const updatePlayerList = (data) => {
  playerList.value = data
  isCreator.value = data.some(player => player.userId === userId.value && player.isCreator)
}

// 处理房间状态更新
const handleRoomStatusUpdate = (message) => {
  console.log('房间状态更新:', message)
  
  // 更新房间基本信息
  roomName.value = message.roomName || roomName.value
  memberCount.value = message.memberCount || 0
  maxMembers.value = message.maxMembers || 8
  readyCount.value = message.readyCount || 0
  
  // 更新玩家列表
  if (message.memberDetails && Array.isArray(message.memberDetails)) {
    const userInfo = store.state.userInfo
    const currentUserId = userInfo.openid || userInfo.userId || userId.value
    
    playerList.value = message.memberDetails.map(member => {
      const isUserReady = message.readyUsers && message.readyUsers.includes(member.openid)
      const isCurrentUser = member.openid === currentUserId
      const isRoomCreator = member.openid === message.creatorId
      
      if (isCurrentUser) {
        isReady.value = isUserReady
        isCreator.value = isRoomCreator
      }
      
      return {
        userId: member.openid,
        displayName: member.username || '未知用户',
        avatarUrl: member.avatarUrl || '',
        isReady: isUserReady,
        isCreator: isRoomCreator
      }
    })
  }
  
  // 添加系统消息
  addMessage(`房间状态更新: ${memberCount.value}/${maxMembers.value} 人在线，${readyCount.value} 人已准备`, 'system')
}

// 处理用户加入
const handleUserJoined = (message) => {
  console.log('用户加入:', message)
  memberCount.value = message.memberCount || memberCount.value
  addMessage(message.message || `${message.userId} 加入了房间`, 'system')
}

// 处理用户准备状态
const handleUserReady = (message) => {
  console.log('用户准备状态:', message)
  readyCount.value = message.readyCount || readyCount.value
  memberCount.value = message.memberCount || memberCount.value
  
  // 如果是当前用户的准备状态变化
  const userInfo = store.state.userInfo
  const currentUserId = userInfo.openid || userInfo.userId || userId.value
  if (message.userId === currentUserId) {
    isReady.value = message.isReady
  }
  
  addMessage(message.message || `${message.userId} ${message.isReady ? '已准备' : '取消准备'}`, 'system')
}

// 处理房间创建成功
const handleRoomCreated = (message) => {
  console.log('房间创建成功:', message)
  roomId.value = message.roomId
  roomName.value = message.roomName
  memberCount.value = message.memberCount || 1
  maxMembers.value = message.maxMembers || 8
  isCreator.value = true
  addMessage('房间创建成功', 'system')
}

// 处理加入房间成功
const handleRoomJoined = (message) => {
  console.log('加入房间成功:', message)
  roomId.value = message.roomId
  roomName.value = message.roomName
  memberCount.value = message.memberCount || 1
  maxMembers.value = message.maxMembers || 8
  addMessage('成功加入房间', 'system')
}

// 添加消息到消息列表
const addMessage = (content, type = 'normal') => {
  const now = new Date()
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  
  messages.value.push({
    id: Date.now() + Math.random(),
    content: content,
    time: timeStr,
    type: type
  })
  
  // 限制消息数量，避免内存占用过多
  if (messages.value.length > 100) {
    messages.value.splice(0, 10)
  }
  
  // 滚动到底部
  setTimeout(() => {
    scrollTop.value = 99999
  }, 100)
}

const handleGameStart = (data) => {
  gameStarted.value = true
  // 其他游戏开始逻辑
}

const handleGameOver = (data) => {
  gameStarted.value = false
  const { rankings } = data
  // 显示游戏结束和排名信息
  uni.showModal({
    title: '游戏结束',
    content: '查看详细排名？',
    success: (res) => {
      if (res.confirm) {
        // 跳转到排名页面
        uni.navigateTo({
          url: '/pages/ranking/ranking'
        })
      }
    }
  })
}

const handleRoundStart = (data) => {
  currentWord.value = data.word
  timeLeft.value = data.timeLimit
  startTimer()
}

const handleRoundEnd = (data) => {
  clearInterval(timer.value)
  const { word, drawer, correctGuessers } = data
  uni.showModal({
    title: '本轮结束',
    content: `正确答案是：${word}\n绘画者：${drawer}\n猜对人数：${correctGuessers.length}`,
    showCancel: false
  })
}

const handleDrawData = (data) => {
  if (!canvasContext.value) return
  const { x, y, type } = data
  
  switch (type) {
    case 'start':
      startDrawing({ touches: [{ x, y }] })
      break
    case 'move':
      draw({ touches: [{ x, y }] })
      break
    case 'end':
      endDrawing()
      break
  }
}

const handleGuessMessage = (data) => {
  const { userId, username, content, correct } = data
  messages.value.push({
    type: 'guess',
    userId,
    username,
    content,
    correct,
    time: new Date().toLocaleTimeString()
  })
}

const handleChatMessage = (data) => {
  const { userId, username, content } = data
  messages.value.push({
    type: 'chat',
    userId,
    username,
    content,
    time: new Date().toLocaleTimeString()
  })
}

// 处理离开房间成功消息
const handleRoomLeft = (data) => {
  console.log('离开房间成功:', data)
  const message = data.message || '已离开房间'
  
  uni.showToast({
    title: message,
    icon: 'success',
    duration: 2000
  })
  
  // 关闭WebSocket连接并返回上一页
  closeWebSocket()
  uni.navigateBack()
}

// 处理其他用户离开房间消息
const handleUserLeft = (data) => {
  console.log('用户离开房间:', data)
  const { userId, memberCount, message } = data
  
  // 更新在线人数
  if (memberCount !== undefined) {
    memberCount.value = memberCount
  }
  
  // 从玩家列表中移除该用户
  if (userId && playerList.value) {
    playerList.value = playerList.value.filter(player => player.openid !== userId)
  }
  
  // 显示离开消息
  if (message) {
    addMessage(message, 'system')
  }
}

const handleErrorMessage = (data) => {
  const errorMessage = data.message || data.error || '发生未知错误'
  console.error('收到错误消息:', data)
  
  uni.showToast({
    title: errorMessage,
    icon: 'none',
    duration: 3000
  })
  
  // 添加错误消息到消息列表
  addMessage(`错误: ${errorMessage}`, 'system')
}
</script>

<style>
.game-container {
  min-height: 100vh;
  background-color: #f6f6f6;
  padding: 20rpx;
}

.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  background-color: #fff;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
}

.connection-status {
  display: flex;
  align-items: center;
}

.status-text {
  font-size: 26rpx;
  color: #666;
  margin-right: 10rpx;
}

.status-indicator {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
}

.status-indicator.connected {
  background-color: #4CAF50;
}

.status-indicator.disconnected {
  background-color: #f44336;
}

.refresh-btn {
  font-size: 24rpx;
  padding: 0 20rpx;
}

.room-info-card {
  background-color: #fff;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
}

.room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.room-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.room-id-container {
  display: flex;
  align-items: center;
}

.room-id {
  font-size: 26rpx;
  color: #666;
  margin-right: 10rpx;
}

.copy-hint {
  font-size: 22rpx;
  color: #4CAF50;
}

.room-stats {
  display: flex;
  gap: 30rpx;
}

.stat-item {
  display: flex;
  align-items: center;
}

.stat-label {
  font-size: 26rpx;
  color: #666;
  margin-right: 10rpx;
}

.stat-value {
  font-size: 26rpx;
  color: #333;
  font-weight: bold;
}

.game-status {
  background-color: #fff;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
}

.status-item {
  display: flex;
  align-items: center;
  margin-bottom: 10rpx;
}

.status-item:last-child {
  margin-bottom: 0;
}

.status-label {
  font-size: 26rpx;
  color: #666;
  margin-right: 10rpx;
}

.status-value {
  font-size: 26rpx;
  font-weight: bold;
}

.status-value.started {
  color: #4CAF50;
}

.status-value.waiting {
  color: #FF9800;
}

.status-value.ready {
  color: #4CAF50;
}

.status-value.not-ready {
  color: #f44336;
}

.players-container {
  background-color: #fff;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
}

.players-header {
  margin-bottom: 20rpx;
}

.players-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
}

.player-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  background-color: #f8f8f8;
  border-radius: 12rpx;
  margin-bottom: 10rpx;
}

.player-info {
  display: flex;
  align-items: center;
}

.player-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 40rpx;
  margin-right: 20rpx;
  overflow: hidden;
  background-color: #eee;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-image {
  width: 100%;
  height: 100%;
}

.avatar-text {
  font-size: 32rpx;
  color: #666;
}

.player-details {
  display: flex;
  flex-direction: column;
}

.player-name {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 6rpx;
}

.player-tags {
  display: flex;
  gap: 10rpx;
}

.tag {
  font-size: 20rpx;
  padding: 2rpx 10rpx;
  border-radius: 6rpx;
}

.creator-tag {
  background-color: #FFF3E0;
  color: #FF9800;
}

.ready-tag {
  background-color: #E8F5E9;
  color: #4CAF50;
}

.ready-tag.not-ready {
  background-color: #FFEBEE;
  color: #f44336;
}

.self-tag {
  background-color: #E3F2FD;
  color: #2196F3;
}

.player-status {
  display: flex;
  align-items: center;
}

.players-empty {
  text-align: center;
  padding: 40rpx 0;
  color: #999;
  font-size: 26rpx;
}

.action-buttons {
  display: flex;
  gap: 20rpx;
  margin-bottom: 20rpx;
}

.action-btn {
  flex: 1;
  height: 88rpx;
  border-radius: 44rpx;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}

.action-btn::after {
  display: none;
}

.ready-btn {
  background-color: #4CAF50;
  color: #fff;
}

.ready-btn.ready {
  background-color: #f44336;
}

.start-btn {
  background-color: #2196F3;
  color: #fff;
}

.start-btn[disabled] {
  background-color: #BDBDBD;
  color: #fff;
}

.leave-btn {
  background-color: #f44336;
  color: #fff;
}

.game-actions {
  text-align: center;
  margin-bottom: 20rpx;
}

.game-tip {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 20rpx;
  display: block;
}

.message-container {
  background-color: #fff;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
}

.message-header {
  margin-bottom: 20rpx;
}

.message-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
}

.message-list {
  height: 300rpx;
}

.message-item {
  margin-bottom: 16rpx;
}

.message-time {
  font-size: 22rpx;
  color: #999;
  margin-bottom: 4rpx;
}

.message-content {
  font-size: 26rpx;
  color: #333;
  padding: 10rpx;
  border-radius: 8rpx;
  background-color: #f8f8f8;
}

.message-content.system {
  color: #666;
  font-style: italic;
}

.message-empty {
  text-align: center;
  padding: 40rpx 0;
  color: #999;
  font-size: 26rpx;
}

.bottom-tips {
  text-align: center;
  padding: 20rpx;
}

.tip-text {
  font-size: 26rpx;
  color: #666;
}
</style>