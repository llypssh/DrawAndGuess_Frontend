# 真机调试连接问题诊断与解决方案

## 🔍 问题分析

根据错误信息分析：
```
VM75:407 error occurs:no such file or directory, access 'wxfile://usr/miniprogramLog/log2'
index.js:57 登录失败: {errno: 600001, errMsg: "request:fail -102:net::ERR_CONNECTION_REFUSED"}
```

### 主要问题
1. **连接被拒绝错误 (ERR_CONNECTION_REFUSED)**：手机无法连接到电脑的后端服务
2. **网络配置问题**：可能是防火墙、IP地址或端口配置问题

## 🔧 诊断结果

### ✅ 已确认正常的部分
1. **后端服务状态**：8080端口正在监听
   ```
   TCP    0.0.0.0:8080           0.0.0.0:0              LISTENING
   TCP    [::]:8080              [::]:0                 LISTENING
   ```

2. **API端点存在**：登录接口返回405错误（方法不允许），说明端点存在但需要POST请求

3. **前端配置**：`config.js` 中的IP地址配置正确
   ```javascript
   baseURL: 'http://192.168.31.195:8080/api'
   ```

### ❌ 可能的问题原因

## 🛠️ 解决方案

### 方案1：检查并配置Windows防火墙

**步骤1：检查防火墙状态**
```powershell
# 检查防火墙是否阻止8080端口
netsh advfirewall firewall show rule name=all | findstr 8080
```

**步骤2：添加防火墙规则（如果需要）**
```powershell
# 允许8080端口入站连接
netsh advfirewall firewall add rule name="Allow Port 8080" dir=in action=allow protocol=TCP localport=8080
```

**步骤3：或者临时关闭防火墙测试**
- 打开Windows设置 → 更新和安全 → Windows安全中心 → 防火墙和网络保护
- 临时关闭专用网络防火墙进行测试

### 方案2：验证网络连接

**步骤1：确认设备在同一网络**
```powershell
# 查看电脑IP地址
ipconfig
```

**步骤2：手机端测试连接**
- 在手机浏览器访问：`http://192.168.31.195:8080/api/auth/wechat/login`
- 应该看到405错误（正常，因为需要POST请求）
- 如果无法访问，说明网络连接有问题

### 方案3：检查后端服务绑定

**确认后端服务绑定到所有网络接口**

查看 `application.yml` 配置：
```yaml
server:
  port: 8080
  # 确保没有限制只绑定到localhost
  # address: 0.0.0.0  # 如果有这行，确保是0.0.0.0而不是127.0.0.1
```

### 方案4：使用不同的测试方法

**电脑端测试API**
```powershell
# 使用PowerShell测试POST请求
$body = @{ jsCode = "test" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://192.168.31.195:8080/api/auth/wechat/login" -Method POST -Body $body -ContentType "application/json"
```

## 🔍 进一步诊断步骤

### 1. 网络连通性测试
```powershell
# 测试端口连通性
Test-NetConnection -ComputerName 192.168.31.195 -Port 8080
```

### 2. 查看详细的防火墙规则
```powershell
# 查看所有入站规则
Get-NetFirewallRule -Direction Inbound | Where-Object {$_.LocalPort -eq 8080}
```

### 3. 检查网络适配器
```powershell
# 查看网络适配器状态
Get-NetAdapter | Where-Object {$_.Status -eq "Up"}
```

## 📱 手机端调试技巧

### 1. 微信开发者工具调试
- 打开微信开发者工具的调试面板
- 查看Network标签页，观察请求详情
- 检查请求是否发出以及具体的错误信息

### 2. 真机调试日志
- 在微信开发者工具中开启真机调试
- 查看控制台的详细错误信息
- 注意网络请求的状态码和响应

## 🎯 推荐解决顺序

1. **首先**：添加防火墙规则允许8080端口
2. **然后**：在手机浏览器测试API连接
3. **接着**：检查后端服务配置
4. **最后**：如果仍有问题，考虑使用热点连接

## 📞 常见问题FAQ

**Q: 为什么电脑可以访问但手机不行？**
A: 通常是防火墙阻止了外部设备访问，需要配置防火墙规则。

**Q: 如何确认防火墙是否是问题原因？**
A: 临时关闭防火墙测试，如果可以连接则确认是防火墙问题。

**Q: IP地址会变化吗？**
A: 路由器重启或网络重连后IP可能变化，需要重新查看并更新配置。

## 🔄 配置验证清单

- [ ] 后端服务在8080端口运行
- [ ] 防火墙允许8080端口入站连接
- [ ] 电脑和手机在同一WiFi网络
- [ ] 前端配置的IP地址正确
- [ ] 手机可以ping通电脑IP
- [ ] 手机浏览器可以访问API端点

---

**注意**：如果按照以上步骤仍无法解决，建议使用手机热点连接方式进行调试。