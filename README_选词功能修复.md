# 选词功能修复说明

## 问题描述
用户点击选词按钮后，后端返回错误：`"未知的动作类型: getRandomWord"`

## 问题根因分析

### 前后端消息格式不匹配
- **前端发送**：`{"action": "getRandomWord", "roomId": "169835"}`
- **后端期望**：`{"action": "get_random_word", "roomId": "169835"}`

### 后端支持的动作类型
根据 `RoomWebSocketHandler.java` 中的 switch 语句，后端支持的动作类型包括：
- `create_room` - 创建房间
- `join_room` - 加入房间
- `toggle_ready` - 切换准备状态
- `start_game` - 开始游戏
- `leave_room` - 离开房间
- `get_room_info` - 获取房间信息
- `draw_stroke` - 绘画笔画
- `clear_canvas` - 清空画布
- `chat_message` - 聊天消息
- **`get_random_word`** - 获取随机词语 ✅

## 修复内容

### 1. 修正前端消息格式
**文件**：`pages/draw/draw.vue`
**位置**：`getRandomWord` 函数
**修改**：
```javascript
// 修改前
const message = {
  action: 'getRandomWord',  // ❌ 驼峰命名
  roomId: roomId.value
}

// 修改后
const message = {
  action: 'get_random_word',  // ✅ 下划线分隔
  roomId: roomId.value
}
```

### 2. 前端消息处理已完善
前端的 `handleWebSocketMessage` 函数已经能够正确处理后端返回的消息：
```javascript
switch (messageType) {
  case 'randomWord':      // 兼容旧格式
  case 'random_word':     // 匹配后端格式 ✅
    if (message.success && message.word) {
      currentWord.value = message.word
      uni.showToast({
        title: `选词成功: ${message.word}`,
        icon: 'success'
      })
    }
    break
}
```

### 3. 后端返回消息格式
后端 `handleGetRandomWord` 方法返回的消息格式：
```json
{
  "type": "random_word",
  "success": true,
  "word": "苹果",
  "category": "水果",
  "difficulty": "简单"
}
```

## 测试步骤

1. **确保后端服务运行**
   ```bash
   cd DrawAndGuess_BackEnd
   mvn spring-boot:run
   ```

2. **确保网络配置正确**
   - IP地址已更新为：`192.168.31.195`
   - WebSocket地址：`ws://192.168.31.195:8080/ws`

3. **测试选词功能**
   - 进入绘画页面
   - 点击"选词"按钮
   - 观察控制台输出和界面反馈

## 预期结果

### 成功情况
```
发送选词请求: {action: "get_random_word", roomId: "169835"}
sendWebSocketMessage调用: {message: {…}, isConnected: true}
发送WebSocket消息: {action: "get_random_word", roomId: "169835"}
收到WebSocket原始消息: {data: "{\"type\":\"random_word\",\"success\":true,\"word\":\"苹果\"}"}
收到WebSocket消息: {type: "random_word", success: true, word: "苹果"}
```

### 界面反馈
- 显示Toast提示："选词成功: 苹果"
- 当前词语显示更新为："苹果"

## 相关文件

### 前端文件
- `pages/draw/draw.vue` - 绘画页面主文件
- `config/config.js` - 网络配置文件

### 后端文件
- `RoomWebSocketHandler.java` - WebSocket消息处理器
- `WordService.java` - 词语服务类
- `Word.java` - 词语实体类

## 注意事项

1. **命名规范**：前后端消息字段命名需要保持一致
2. **错误处理**：前端已包含完善的错误处理和用户提示
3. **兼容性**：前端同时支持 `randomWord` 和 `random_word` 两种格式
4. **调试信息**：控制台会输出详细的调试信息，便于问题排查

现在选词功能应该能够正常工作了！🎉