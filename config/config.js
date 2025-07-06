// 配置文件 - 管理不同环境的服务器地址

// 获取本机IP地址的方法（需要手动配置）
// 在命令行中运行 ipconfig（Windows）或 ifconfig（Mac/Linux）查看本机IP

const config = {
  // 开发环境配置
  development: {
    // HTTP API 基础地址
    baseURL: 'http://192.168.1.100:8080/api',
    // WebSocket 地址
    wsBaseURL: 'ws://192.168.1.100:8080/ws',
    // 环境名称
    env: 'development'
  },
  
  // 生产环境配置
  production: {
    // HTTP API 基础地址（替换为实际服务器地址）
    baseURL: 'https://your-server.com/api',
    // WebSocket 地址（替换为实际服务器地址）
    wsBaseURL: 'wss://your-server.com/ws',
    // 环境名称
    env: 'production'
  }
}

// 当前环境（可以根据需要切换）
const currentEnv = 'development' // 'development' 或 'production'

// 导出当前环境的配置
export default config[currentEnv]

// 导出所有配置（用于调试）
export { config }

// 使用说明：
// 1. 将 192.168.1.100 替换为你的实际本机IP地址
// 2. 在生产环境中，将 your-server.com 替换为实际的服务器域名
// 3. 如果使用HTTPS，WebSocket也需要使用WSS协议