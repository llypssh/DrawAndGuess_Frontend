# 网络配置说明

## 问题描述
当在微信小程序中点击"选词"按钮时出现"网络连接异常"的问题，这是因为微信小程序无法访问 `localhost` 地址。

## 解决方案

### 1. 获取本机IP地址

**Windows系统：**
```bash
ipconfig
```
查找 "以太网适配器" 或 "无线局域网适配器" 下的 "IPv4 地址"

**Mac/Linux系统：**
```bash
ifconfig
```
查找网络接口的 inet 地址

### 2. 修改配置文件

编辑 `config/config.js` 文件：

```javascript
const config = {
  development: {
    baseURL: 'http://你的IP地址:8080/api',
    wsBaseURL: 'ws://你的IP地址:8080/ws',
    env: 'development'
  }
}
```

**示例：**
如果你的IP地址是 `192.168.1.105`，则配置为：
```javascript
baseURL: 'http://192.168.1.105:8080/api',
wsBaseURL: 'ws://192.168.1.105:8080/ws',
```

### 3. 确保后端服务器运行

确保Spring Boot后端服务器正在运行：
```bash
cd DrawAndGuess_BackEnd
mvn spring-boot:run
```

### 4. 网络要求

- 手机和电脑必须在同一个WiFi网络下
- 确保防火墙没有阻止8080端口
- 如果使用模拟器，确保模拟器网络设置正确

### 5. 调试步骤

1. 在浏览器中访问 `http://你的IP地址:8080` 确认后端可访问
2. 查看微信开发者工具的控制台输出
3. 检查WebSocket连接状态

### 6. 常见问题

**问题1：** 仍然显示"网络连接异常"
- 检查IP地址是否正确
- 确认后端服务器是否运行
- 检查防火墙设置

**问题2：** WebSocket连接失败
- 确认WebSocket地址格式正确（ws://而不是http://）
- 检查后端WebSocket配置

**问题3：** 真机调试时无法连接
- 确保手机和电脑在同一WiFi下
- 检查路由器是否允许设备间通信

### 7. 生产环境部署

部署到服务器时，修改配置文件中的生产环境配置：
```javascript
production: {
  baseURL: 'https://your-domain.com/api',
  wsBaseURL: 'wss://your-domain.com/ws',
  env: 'production'
}
```

然后将 `currentEnv` 改为 `'production'`。