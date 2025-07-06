<template>
  <view class="draw-container">
    <!-- 自定义导航栏 -->
    <view class="custom-navbar">
      <view class="navbar-left">
        <button class="menu-btn" @tap="toggleGameMenu">
          <image class="menu-icon" src="/static/icons/菜单.png" mode="aspectFit"></image>
        </button>
      </view>
      <view class="navbar-center">
        <text class="navbar-title">绘画游戏</text>
      </view> 
      <view class="navbar-right"></view>
    </view>
    
    <!-- 游戏状态栏 -->
    <view class="game-status">
      <view class="status-item">
        <text class="status-label">角色：</text>
        <text class="status-value role">{{playerRole === 'drawer' ? '绘画者' : '猜测者'}}</text>
      </view>
      <view class="status-item">
        <text class="status-label">时间：</text>
        <text class="status-value time">{{timeLeft}}s</text>
      </view>
      <view class="status-item">
        <text class="status-label">得分：</text>
        <text class="status-value score">{{score}}</text>
      </view>
    </view>

    <!-- 画布区域 - 只有绘画者可见 -->
    <view v-if="gameStatus !== 'finished' && playerRole === 'drawer'">
      <canvas 
        id="gameCanvas"
        type="2d"
        class="game-canvas"
        @touchstart="startDrawing"
        @touchmove="draw"
        @touchend="endDrawing"
        style="width: 677rpx; display: block; box-sizing: border-box; left: 0rpx; top: 0rpx">
      </canvas>

      <!-- 绘画工具栏 -->
      <view class="toolbar">
        <view class="tool-group" style="height: 169rpx; display: block; box-sizing: border-box; left: 0rpx; top: 0rpx">
          <view class="word-display" style="width: 408rpx; display: flex; box-sizing: border-box; height: 124rpx;margin-top: 30rpx;margin-left: 50rpx;">
            <text class="word-text">{{currentWord || '点击选词'}}</text>
            <button class="word-btn" @tap="getRandomWord" v-if="!wordSelected">选词</button>
          </view>
          <button class="tool-btn" @tap="clearCanvas" style="position: relative; left: 227rpx; top: -77rpx; width: 211rpx; display: flex; box-sizing: border-box">清空</button>
        </view>
      </view>
    </view>

    <!-- 猜测者提示区域 -->
    <view v-if="gameStatus !== 'finished' && playerRole === 'guesser'" class="guesser-hint">
      <view class="hint-container">
        <text class="hint-label">题目提示：</text>
        <text class="hint-text">{{wordCategory || '等待绘画者选词...'}}</text>
      </view>
    </view>

    <!-- 聊天区域 -->
    <view class="chat-container">
      <view class="chat-messages" style="height: 261rpx; display: block; box-sizing: border-box">
        <view 
          :class="['message-item', item.type]"
          v-for="(item, index) in messages"
          :key="index">
          
          <view class="message-content" v-if="item.type === 'system'">
            <text class="system-text">{{item.content}}</text>
            <text class="message-time">{{item.time}}</text>
          </view>
          
          <view class="message-content" v-else>
            <text class="user-text">{{item.content}}</text>
            <text class="message-time">{{item.time}}</text>
          </view>
        </view>
        
        <!-- 空状态 -->
        <view class="chat-empty" v-if="messages.length === 0" style="height: 202rpx; display: block; box-sizing: border-box">
          <text class="empty-text">开始聊天吧！</text>
        </view>
      </view>
      
      <!-- 输入框 - 只有猜测者可以发送消息 -->
      <view class="chat-input" v-if="gameStatus === 'drawing' && playerRole === 'guesser'">
        <input 
          class="input-field"
          placeholder="输入你的猜测..."
          v-model="inputText"
          @input="onInputChange"
          confirm-type="send"
          @confirm="sendMessage" />
        
        <button class="send-btn" @tap="sendMessage">
          <text class="send-icon">📤</text>
        </button>
      </view>
      
      <!-- 绘画者提示 -->
      <view class="drawer-tip" v-if="gameStatus === 'drawing' && playerRole === 'drawer'">
        <text class="tip-text">你是绘画者，请根据词语进行绘画，其他玩家会根据你的画作进行猜测</text>
      </view>
    </view>

    <!-- 游戏菜单 -->
    <view class="game-menu" v-if="showGameMenu">
      <view class="menu-overlay" @tap="toggleGameMenu"></view>
      <view class="menu-content">
        <view class="menu-title">游戏菜单</view>
        <button class="menu-btn" @tap="restartGame">重新开始</button>
        <button class="menu-btn" @tap="exitGame">退出游戏</button>
      </view>
    </view>

    <!-- 游戏结果弹窗 -->
    <view class="result-modal" v-if="showResult">
      <view class="modal-content">
        <view class="result-header">
          <text class="result-title">🎉 游戏结束</text>
        </view>
        
        <view class="result-stats">
          <view class="stat-item">
            <text class="stat-label">总分数</text>
            <text class="stat-value">{{gameResult.totalScore}}</text>
          </view>
          
          <view class="stat-item">
            <text class="stat-label">表现评价</text>
            <text class="stat-value">{{gameResult.performance}}</text>
          </view>
        </view>
        
        <view class="result-actions">
          <button class="result-btn secondary" @tap="exitGame">
            返回房间
          </button>
          
          <button class="result-btn primary" @tap="restartGame">
            再来一局
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useStore } from 'vuex'
import config from '@/config/config.js'
import networkDiagnostic from '@/utils/networkDiagnostic.js'

const store = useStore()

// 响应式状态
const canvasContext = ref(null)
const isDrawing = ref(false)
const lastX = ref(0)
const lastY = ref(0)
const lineWidth = ref(5)
const lineColor = ref('#000000')
const canvasWidth = ref(0)
const canvasHeight = ref(0)
const currentWord = ref('')
const timeLeft = ref(60)
const timer = ref(null)

// 角色相关状态
const playerRole = ref('guesser') // 'drawer' 绘画者, 'guesser' 猜测者
const wordSelected = ref(false) // 是否已选词
const wordCategory = ref('') // 词语类别（提示词）
const currentUserId = ref(null) // 当前用户ID

// WebSocket相关状态
const websocket = ref(null)
const isConnected = ref(false)
const roomId = ref(null)
const token = ref(null)

// 生命周期钩子
onMounted(() => {
  initCanvas()
  startTimer()
  initWebSocket()
})

onUnmounted(() => {
  clearInterval(timer.value)
  closeWebSocket()
})

// 方法
const initCanvas = () => {
  const query = uni.createSelectorQuery()
  query.select('#gameCanvas')
    .fields({ node: true, size: true })
    .exec((res) => {
      if (!res || !res[0]) {
        console.error('Canvas node not found')
        return
      }
      
      const canvas = res[0].node
      const ctx = canvas.getContext('2d')
      
      // 获取设备像素比
      const dpr = uni.getSystemInfoSync().pixelRatio || 1
      
      // 设置画布实际尺寸
      canvas.width = res[0].width * dpr
      canvas.height = res[0].height * dpr
      
      // 缩放画布以适应设备像素比
      ctx.scale(dpr, dpr)
      
      canvasContext.value = ctx
      canvasWidth.value = res[0].width
      canvasHeight.value = res[0].height
      
      // 设置画布样式
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.lineWidth = lineWidth.value
      ctx.strokeStyle = lineColor.value
      
      console.log('Canvas initialized:', {
        width: canvasWidth.value,
        height: canvasHeight.value,
        dpr: dpr
      })
    })
}

const startDrawing = (e) => {
  // 只有绘画者才能绘画
  if (playerRole.value !== 'drawer') {
    return
  }
  
  if (!canvasContext.value) return
  
  isDrawing.value = true
  const touch = e.touches[0]
  
  // 在微信小程序中直接使用触摸点相对于画布的坐标
  lastX.value = touch.x
  lastY.value = touch.y
  
  console.log('Start drawing at:', lastX.value, lastY.value)
}

const draw = (e) => {
  // 只有绘画者才能绘画
  if (playerRole.value !== 'drawer') {
    return
  }
  
  if (!isDrawing.value || !canvasContext.value) return
  
  const touch = e.touches[0]
  const ctx = canvasContext.value
  
  // 在微信小程序中直接使用触摸点相对于画布的坐标
  const currentX = touch.x
  const currentY = touch.y
  
  ctx.beginPath()
  ctx.moveTo(lastX.value, lastY.value)
  ctx.lineTo(currentX, currentY)
  ctx.stroke()
  
  lastX.value = currentX
  lastY.value = currentY
}

const endDrawing = () => {
  isDrawing.value = false
}

const clearCanvas = () => {
  // 只有绘画者才能清空画布
  if (playerRole.value !== 'drawer') {
    uni.showToast({
      title: '只有绘画者才能清空画布',
      icon: 'none'
    })
    return
  }
  
  const ctx = canvasContext.value
  if (!ctx) {
    console.warn('Canvas context not available')
    return
  }
  ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value)
  console.log('Canvas cleared')
}

const changeColor = (color) => {
  lineColor.value = color
  if (canvasContext.value) {
    canvasContext.value.strokeStyle = color
  }
}

const changeWidth = (width) => {
  lineWidth.value = width
  if (canvasContext.value) {
    canvasContext.value.lineWidth = width
  }
}

const startTimer = () => {
  timer.value = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--
    } else {
      clearInterval(timer.value)
      handleTimeUp()
    }
  }, 1000)
}

const handleTimeUp = () => {
  uni.showModal({
    title: '时间到',
    content: '本轮绘画时间已结束',
    showCancel: false,
    success: () => {
      // 处理时间结束逻辑
    }
  })
}

const saveDrawing = () => {
  uni.canvasToTempFilePath({
    canvasId: 'gameCanvas',
    success: (res) => {
      // 处理保存逻辑
      uni.saveImageToPhotosAlbum({
        filePath: res.tempFilePath,
        success: () => {
          uni.showToast({
            title: '保存成功',
            icon: 'success'
          })
        },
        fail: () => {
          uni.showToast({
            title: '保存失败',
            icon: 'none'
          })
        }
      })
    }
  })
}

const submitDrawing = () => {
  // 提交绘画结果到服务器
}

const quitDrawing = () => {
  uni.showModal({
    title: '提示',
    content: '确定要退出绘画吗？',
    success: (res) => {
      if (res.confirm) {
        clearInterval(timer.value)
        uni.navigateBack()
      }
    }
  })
}

const getRandomWord = () => {
  // 只有绘画者才能选词
  if (playerRole.value !== 'drawer') {
    uni.showToast({
      title: '只有绘画者才能选词',
      icon: 'none'
    })
    return
  }
  
  // 从后端获取随机词语
  console.log('选词按钮被点击，当前连接状态:', {
    isConnected: isConnected.value,
    websocket: websocket.value,
    roomId: roomId.value,
    token: token.value
  })
  
  if (!isConnected.value) {
    console.warn('WebSocket未连接，尝试重新连接')
    uni.showToast({
      title: '网络连接异常，正在重连...',
      icon: 'none'
    })
    // 尝试重新连接
    initWebSocket()
    return
  }
  
  const message = {
    action: 'getRandomWord',
    roomId: roomId.value
  }
  
  console.log('发送选词请求:', message)
  sendWebSocketMessage(message)
}

const onInputChange = (e) => {
  inputText.value = e.detail.value
}

const sendMessage = () => {
  if (!inputText.value.trim()) return
  
  // 只有猜测者才能发送猜测消息
  if (playerRole.value !== 'guesser') {
    uni.showToast({
      title: '只有猜测者才能发送消息',
      icon: 'none'
    })
    return
  }
  
  const message = {
    content: inputText.value,
    type: 'user',
    time: new Date().toLocaleTimeString()
  }
  
  messages.value.push(message)
  
  // 发送猜测消息到服务器
  if (isConnected.value) {
    const guessMessage = {
      action: 'guess',
      roomId: roomId.value,
      userId: currentUserId.value,
      guess: inputText.value.trim(),
      currentWord: currentWord.value
    }
    sendWebSocketMessage(guessMessage)
  }
  
  inputText.value = ''
}

const toggleGameMenu = () => {
  showGameMenu.value = !showGameMenu.value
}

const restartGame = () => {
  // 重置所有游戏状态
  currentWord.value = ''
  wordSelected.value = false
  wordCategory.value = ''
  playerRole.value = 'guesser' // 默认角色
  messages.value = []
  score.value = 0
  gameStatus.value = 'waiting'
  timeLeft.value = 60
  
  // 清空画布
  clearCanvas()
  
  // 重新开始计时器
  clearInterval(timer.value)
  startTimer()
  
  // 发送重新开始请求到服务器
  if (isConnected.value) {
    const restartMessage = {
      action: 'restart',
      roomId: roomId.value,
      userId: currentUserId.value
    }
    sendWebSocketMessage(restartMessage)
  }
  
  showGameMenu.value = false
  showResult.value = false
  uni.showToast({
    title: '重新开始游戏',
    icon: 'success'
  })
}

const exitGame = () => {
  uni.showModal({
    title: '提示',
    content: '确定要退出游戏吗？',
    success: (res) => {
      if (res.confirm) {
        clearInterval(timer.value)
        uni.navigateBack()
      }
    }
  })
}

const endGame = () => {
  gameStatus.value = 'finished'
  showResult.value = true
  gameResult.value = {
    totalScore: score.value,
    performance: getPerformanceEvaluation()
  }
}

const getPerformanceEvaluation = () => {
  if (score.value >= 90) return '神级画手'
  if (score.value >= 70) return '画技高超'
  if (score.value >= 50) return '表现不错'
  return '继续加油'
}

const messages = ref([])
const inputText = ref('')
const showGameMenu = ref(false)
const showResult = ref(false)
const gameResult = ref({
  totalScore: 0,
  performance: ''
})
const gameStatus = ref('drawing') // waiting, drawing, finished
const score = ref(0)

// WebSocket相关函数
const initWebSocket = () => {
  try {
    // 从页面参数或存储中获取roomId和token
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]
    roomId.value = currentPage.options.roomId || uni.getStorageSync('roomId')
    token.value = uni.getStorageSync('token')
    currentUserId.value = uni.getStorageSync('userId') || uni.getStorageSync('user_id')
    
    if (!roomId.value) {
      console.error('initWebSocket: roomId未设置')
      return
    }
    
    if (!token.value) {
      console.error('initWebSocket: token未找到')
      return
    }
    
    console.log('初始化WebSocket连接:', { roomId: roomId.value, token: token.value })
    
    // 使用配置文件中的WebSocket地址
    const wsUrl = `${config.wsBaseURL}/room/${roomId.value}?token=${token.value}`
    console.log('WebSocket连接地址:', wsUrl)
    console.log('当前环境配置:', config)
    
    websocket.value = uni.connectSocket({
      url: wsUrl,
      success: (res) => {
        console.log('connectSocket success:', res)
      },
      fail: (err) => {
        console.error('connectSocket fail:', err)
        isConnected.value = false
        uni.showToast({
          title: '连接失败，请检查网络',
          icon: 'none'
        })
      }
    })
    
    // 设置连接超时检测
     setTimeout(async () => {
       if (!isConnected.value) {
         console.warn('WebSocket连接超时，当前状态:', isConnected.value)
         
         // 显示诊断提示
         uni.showModal({
           title: '连接超时',
           content: '网络连接异常，是否运行网络诊断？',
           confirmText: '诊断',
           cancelText: '取消',
           success: async (res) => {
             if (res.confirm) {
               uni.showLoading({ title: '诊断中...' })
               try {
                 await networkDiagnostic.runFullDiagnostic()
                 uni.hideLoading()
                 uni.showToast({
                   title: '诊断完成，请查看控制台',
                   icon: 'success'
                 })
               } catch (error) {
                 uni.hideLoading()
                 console.error('网络诊断失败:', error)
               }
             }
           }
         })
       }
     }, 5000) // 5秒超时
    
    console.log('WebSocket连接成功')
    
    // 清除之前的事件监听器（避免重复绑定）
    uni.offSocketOpen()
    uni.offSocketClose()
    uni.offSocketError()
    uni.offSocketMessage()
    
    // WebSocket事件监听
    uni.onSocketOpen(() => {
      isConnected.value = true
      console.log('WebSocket连接已建立，状态更新为:', isConnected.value)
    })
    
    uni.onSocketClose(() => {
      isConnected.value = false
      console.log('WebSocket连接已关闭，状态更新为:', isConnected.value)
    })
    
    uni.onSocketError((error) => {
      console.error('WebSocket错误:', error)
      isConnected.value = false
      console.log('WebSocket错误，状态更新为:', isConnected.value)
    })
    
    uni.onSocketMessage((res) => {
      console.log('收到WebSocket原始消息:', res)
      handleWebSocketMessage(res.data)
    })
    
  } catch (error) {
    console.error('初始化WebSocket失败:', error)
  }
}

const closeWebSocket = () => {
  if (websocket.value) {
    uni.closeSocket()
    isConnected.value = false
  }
}

const sendWebSocketMessage = (message) => {
  console.log('sendWebSocketMessage调用:', { message, isConnected: isConnected.value })
  
  if (!isConnected.value) {
    console.warn('WebSocket未连接，跳过发送消息')
    return
  }
  
  if (!message) {
    console.error('sendWebSocketMessage: 消息参数为undefined或null', message)
    return
  }
  
  if (typeof message !== 'object') {
    console.error('sendWebSocketMessage: 消息参数不是对象类型', typeof message, message)
    return
  }
  
  if (!message.action) {
    console.error('sendWebSocketMessage: 消息缺少action字段', message)
    return
  }
  
  try {
    const messageStr = JSON.stringify(message)
    
    if (!messageStr || messageStr === 'null' || messageStr === 'undefined') {
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

const handleWebSocketMessage = (data) => {
  try {
    const message = JSON.parse(data)
    console.log('收到WebSocket消息:', message)
    
    // 处理不同类型的消息
    const messageType = message.action || message.type
    
    switch (messageType) {
      case 'gameStart':
      case 'game_start':
        // 处理游戏开始，自动分配角色
        gameStatus.value = 'playing'
        uni.showToast({
          title: '游戏开始！',
          icon: 'success'
        })
        
        // 请求角色分配
        if (isConnected.value) {
          const assignRolesMessage = {
            action: 'assign_roles',
            roomId: roomId.value
          }
          sendWebSocketMessage(assignRolesMessage)
        }
        break
      
      case 'gameRestart':
      case 'game_restart':
        // 处理游戏重新开始
        uni.showToast({
          title: `${message.initiator} 重新开始了游戏`,
          icon: 'success'
        })
        break
      
      case 'randomWord':
      case 'random_word':
        if (message.success && message.word) {
          currentWord.value = message.word
          wordSelected.value = true
          
          // 如果有类别信息，设置给猜测者作为提示
          if (message.category) {
            wordCategory.value = message.category
          }
          
          // 只有绘画者能看到完整的词语
          if (playerRole.value === 'drawer') {
            uni.showToast({
              title: `选词成功: ${message.word}`,
              icon: 'success'
            })
          } else {
            // 猜测者只能看到类别提示
            uni.showToast({
              title: `题目类别: ${message.category || '未知'}`,
              icon: 'success'
            })
          }
        } else {
          uni.showToast({
            title: message.message || '获取词语失败',
            icon: 'none'
          })
        }
        break
      
      case 'roleAssignment':
      case 'role_assignment':
        // 处理角色分配
        if (message.role) {
          playerRole.value = message.role
          console.log('角色分配:', message.role)
          uni.showToast({
            title: `你的角色: ${message.role === 'drawer' ? '绘画者' : '猜测者'}`,
            icon: 'success'
          })
          
          // 如果是绘画者，初始化画布
          if (message.role === 'drawer') {
            setTimeout(() => {
              initCanvas()
            }, 500)
          }
        }
        break
      
      case 'guessResult':
      case 'guess_result':
        // 处理猜测结果
        if (message.correct) {
          // 猜测正确
          const systemMessage = {
            content: `${message.guesser || '玩家'} 猜对了！答案是：${message.word}`,
            type: 'system',
            time: new Date().toLocaleTimeString()
          }
          messages.value.push(systemMessage)
          
          uni.showToast({
            title: '猜对了！',
            icon: 'success'
          })
          
          // 可以在这里处理得分逻辑
          if (message.score) {
            score.value += message.score
          }
        } else {
          // 猜测错误，显示其他玩家的猜测
          if (message.guesser && message.guess) {
            const guessMessage = {
              content: `${message.guesser}: ${message.guess}`,
              type: 'user',
              time: new Date().toLocaleTimeString()
            }
            messages.value.push(guessMessage)
          }
        }
        break
      
      case 'roundEnd':
      case 'round_end':
        // 处理回合结束
        uni.showModal({
          title: '回合结束',
          content: `本轮结束！答案是：${message.word || currentWord.value}`,
          showCancel: false,
          success: () => {
            // 重置状态准备下一轮
            currentWord.value = ''
            wordSelected.value = false
            wordCategory.value = ''
            clearCanvas()
          }
        })
        break
      
      default:
        console.log('未处理的消息类型:', messageType)
        break
    }
  } catch (error) {
    console.error('处理WebSocket消息失败:', error)
  }
}
</script>

<style>
.draw-container {
  min-height: 100vh;
  background-color: #f6f6f6;
}

.custom-navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx;
  background-color: #fff;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.menu-btn {
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  line-height: 1;
}

.menu-btn::after {
  display: none;
}

.menu-icon {
  width: 40rpx;
  height: 40rpx;
}

.navbar-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.game-status {
  display: flex;
  justify-content: space-around;
  padding: 20rpx;
  background-color: #fff;
  margin-bottom: 20rpx;
}

.status-item {
  display: flex;
  align-items: center;
}

.status-label {
  font-size: 28rpx;
  color: #666;
}

.status-value {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
}

.status-value.time {
  color: #f44336;
}

.status-value.score {
  color: #4CAF50;
}

.status-value.role {
  color: #2196F3;
  font-weight: bold;
}

.game-canvas {
  width: 100%;
  height: 600rpx;
  background-color: #fff;
  margin-bottom: 20rpx;
}

.toolbar {
  background-color: #fff;
  padding: 20rpx;
  margin-bottom: 20rpx;
}

.word-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.word-text {
  font-size: 32rpx;
  color: #333;
  font-weight: bold;
}

.word-btn {
  background-color: #4CAF50;
  color: #fff;
  font-size: 28rpx;
  padding: 10rpx 30rpx;
  border-radius: 30rpx;
  border: none;
}

.word-btn::after {
  display: none;
}

.tool-btn {
  background-color: #f5f5f5;
  color: #666;
  font-size: 28rpx;
  padding: 10rpx 30rpx;
  border-radius: 30rpx;
  border: none;
}

.tool-btn::after {
  display: none;
}

.guesser-hint {
  background-color: #fff;
  padding: 30rpx;
  margin-bottom: 20rpx;
  border-radius: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.hint-container {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  text-align: center;
}

.hint-label {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 10rpx;
}

.hint-text {
  font-size: 36rpx;
  color: #2196F3;
  font-weight: bold;
  padding: 20rpx;
  background-color: #f0f8ff;
  border-radius: 15rpx;
  border: 2rpx dashed #2196F3;
}

.drawer-tip {
  background-color: #fff3cd;
  padding: 20rpx;
  margin-top: 20rpx;
  border-radius: 10rpx;
  border-left: 4rpx solid #ffc107;
}

.tip-text {
  font-size: 26rpx;
  color: #856404;
  line-height: 1.5;
}

.chat-container {
  background-color: #fff;
  padding: 20rpx;
}

.chat-messages {
  height: 300rpx;
  overflow-y: auto;
}

.message-item {
  margin-bottom: 16rpx;
}

.message-content {
  display: flex;
  flex-direction: column;
}

.system-text {
  font-size: 24rpx;
  color: #666;
  font-style: italic;
}

.user-text {
  font-size: 28rpx;
  color: #333;
}

.message-time {
  font-size: 22rpx;
  color: #999;
  margin-top: 4rpx;
}

.chat-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

.chat-input {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-top: 20rpx;
}

.input-field {
  flex: 1;
  height: 80rpx;
  background-color: #f5f5f5;
  border-radius: 40rpx;
  padding: 0 30rpx;
  font-size: 28rpx;
}

.send-btn {
  width: 80rpx;
  height: 80rpx;
  border-radius: 40rpx;
  background-color: #4CAF50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin: 0;
  border: none;
}

.send-btn::after {
  display: none;
}

.send-icon {
  font-size: 40rpx;
  color: #fff;
}

.game-menu {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
}

.menu-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
}

.menu-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: #fff;
  border-radius: 20rpx;
  padding: 40rpx;
  width: 80%;
  max-width: 600rpx;
}

.menu-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  text-align: center;
  margin-bottom: 40rpx;
}

.menu-btn {
  width: 100%;
  height: 88rpx;
  border-radius: 44rpx;
  margin-bottom: 20rpx;
  font-size: 32rpx;
  background-color: #f5f5f5;
  color: #333;
  border: none;
}

.menu-btn::after {
  display: none;
}

.menu-btn:last-child {
  margin-bottom: 0;
  background-color: #f44336;
  color: #fff;
}

.result-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.modal-content {
  background-color: #fff;
  border-radius: 20rpx;
  padding: 40rpx;
  width: 80%;
  max-width: 600rpx;
}

.result-header {
  text-align: center;
  margin-bottom: 40rpx;
}

.result-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.result-stats {
  margin-bottom: 40rpx;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.stat-item:last-child {
  margin-bottom: 0;
}

.stat-label {
  font-size: 28rpx;
  color: #666;
}

.stat-value {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.result-actions {
  display: flex;
  gap: 20rpx;
}

.result-btn {
  flex: 1;
  height: 88rpx;
  border-radius: 44rpx;
  font-size: 32rpx;
  border: none;
}

.result-btn::after {
  display: none;
}

.result-btn.primary {
  background-color: #4CAF50;
  color: #fff;
}

.result-btn.secondary {
  background-color: #f5f5f5;
  color: #333;
}
</style>