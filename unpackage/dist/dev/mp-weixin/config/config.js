"use strict";
const config = {
  // 开发环境配置
  development: {
    // HTTP API 基础地址
    baseURL: "http://192.168.1.100:8080/api",
    // WebSocket 地址
    wsBaseURL: "ws://192.168.1.100:8080/ws",
    // 环境名称
    env: "development"
  },
  // 生产环境配置
  production: {
    // HTTP API 基础地址（替换为实际服务器地址）
    baseURL: "https://your-server.com/api",
    // WebSocket 地址（替换为实际服务器地址）
    wsBaseURL: "wss://your-server.com/ws",
    // 环境名称
    env: "production"
  }
};
const currentEnv = "development";
const config$1 = config[currentEnv];
exports.config = config$1;
