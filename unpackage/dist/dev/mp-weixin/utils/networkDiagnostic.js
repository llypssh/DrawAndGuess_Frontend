"use strict";
const common_vendor = require("../common/vendor.js");
const config_config = require("../config/config.js");
class NetworkDiagnostic {
  constructor() {
    this.results = [];
  }
  /**
   * 执行完整的网络诊断
   */
  async runFullDiagnostic() {
    this.results = [];
    console.log("开始网络诊断...");
    await this.checkNetworkStatus();
    await this.checkHttpConnection();
    await this.checkWebSocketConnection();
    this.generateReport();
    return this.results;
  }
  /**
   * 检查网络状态
   */
  async checkNetworkStatus() {
    try {
      const networkInfo = await common_vendor.index.getNetworkType();
      const result = {
        test: "网络状态检查",
        status: "success",
        message: `网络类型: ${networkInfo.networkType}`,
        details: networkInfo
      };
      this.results.push(result);
      console.log("✅ 网络状态检查通过:", networkInfo);
    } catch (error) {
      const result = {
        test: "网络状态检查",
        status: "error",
        message: "无法获取网络状态",
        details: error
      };
      this.results.push(result);
      console.error("❌ 网络状态检查失败:", error);
    }
  }
  /**
   * 检查HTTP连接
   */
  async checkHttpConnection() {
    return new Promise((resolve) => {
      const startTime = Date.now();
      common_vendor.index.request({
        url: config_config.config.baseURL.replace("/api", "/actuator/health"),
        // Spring Boot健康检查端点
        method: "GET",
        timeout: 5e3,
        success: (res) => {
          const duration = Date.now() - startTime;
          const result = {
            test: "HTTP连接检查",
            status: "success",
            message: `HTTP连接正常 (${duration}ms)`,
            details: { statusCode: res.statusCode, data: res.data, duration }
          };
          this.results.push(result);
          console.log("✅ HTTP连接检查通过:", res);
          resolve();
        },
        fail: (error) => {
          const duration = Date.now() - startTime;
          const result = {
            test: "HTTP连接检查",
            status: "error",
            message: `HTTP连接失败: ${error.errMsg || "未知错误"}`,
            details: { error, duration, url: config_config.config.baseURL }
          };
          this.results.push(result);
          console.error("❌ HTTP连接检查失败:", error);
          resolve();
        }
      });
    });
  }
  /**
   * 检查WebSocket连接
   */
  async checkWebSocketConnection() {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const testUrl = `${config_config.config.wsBaseURL}/test`;
      let isResolved = false;
      common_vendor.index.connectSocket({
        url: testUrl,
        success: () => {
          console.log("WebSocket测试连接创建成功");
        },
        fail: (error) => {
          if (!isResolved) {
            const duration = Date.now() - startTime;
            const result = {
              test: "WebSocket连接检查",
              status: "error",
              message: `WebSocket连接创建失败: ${error.errMsg || "未知错误"}`,
              details: { error, duration, url: testUrl }
            };
            this.results.push(result);
            console.error("❌ WebSocket连接检查失败:", error);
            isResolved = true;
            resolve();
          }
        }
      });
      common_vendor.index.onSocketOpen(() => {
        if (!isResolved) {
          const duration = Date.now() - startTime;
          const result = {
            test: "WebSocket连接检查",
            status: "success",
            message: `WebSocket连接正常 (${duration}ms)`,
            details: { duration, url: testUrl }
          };
          this.results.push(result);
          console.log("✅ WebSocket连接检查通过");
          common_vendor.index.closeSocket();
          isResolved = true;
          resolve();
        }
      });
      common_vendor.index.onSocketError((error) => {
        if (!isResolved) {
          const duration = Date.now() - startTime;
          const result = {
            test: "WebSocket连接检查",
            status: "error",
            message: `WebSocket连接错误: ${error.errMsg || "连接被拒绝"}`,
            details: { error, duration, url: testUrl }
          };
          this.results.push(result);
          console.error("❌ WebSocket连接检查失败:", error);
          isResolved = true;
          resolve();
        }
      });
      setTimeout(() => {
        if (!isResolved) {
          const duration = Date.now() - startTime;
          const result = {
            test: "WebSocket连接检查",
            status: "timeout",
            message: "WebSocket连接超时",
            details: { duration, url: testUrl }
          };
          this.results.push(result);
          console.warn("⚠️ WebSocket连接检查超时");
          common_vendor.index.closeSocket();
          isResolved = true;
          resolve();
        }
      }, 5e3);
    });
  }
  /**
   * 生成诊断报告
   */
  generateReport() {
    console.log("\n=== 网络诊断报告 ===");
    const summary = {
      total: this.results.length,
      success: this.results.filter((r) => r.status === "success").length,
      error: this.results.filter((r) => r.status === "error").length,
      timeout: this.results.filter((r) => r.status === "timeout").length
    };
    console.log("诊断摘要:", summary);
    this.results.forEach((result, index) => {
      const icon = result.status === "success" ? "✅" : result.status === "error" ? "❌" : "⚠️";
      console.log(`${index + 1}. ${icon} ${result.test}: ${result.message}`);
    });
    this.provideSuggestions();
    console.log("=== 诊断报告结束 ===\n");
  }
  /**
   * 提供解决建议
   */
  provideSuggestions() {
    const hasNetworkError = this.results.some((r) => r.test === "网络状态检查" && r.status === "error");
    const hasHttpError = this.results.some((r) => r.test === "HTTP连接检查" && r.status === "error");
    const hasWebSocketError = this.results.some((r) => r.test === "WebSocket连接检查" && (r.status === "error" || r.status === "timeout"));
    console.log("\n解决建议:");
    if (hasNetworkError) {
      console.log("• 检查设备网络连接是否正常");
      console.log("• 尝试切换WiFi或移动网络");
    }
    if (hasHttpError) {
      console.log("• 检查后端服务器是否启动 (mvn spring-boot:run)");
      console.log("• 确认IP地址配置是否正确");
      console.log("• 检查防火墙是否阻止8080端口");
    }
    if (hasWebSocketError) {
      console.log("• 确认WebSocket服务是否正常运行");
      console.log("• 检查WebSocket地址格式 (ws://而非http://)");
      console.log("• 确保手机和电脑在同一WiFi网络下");
    }
    if (!hasNetworkError && !hasHttpError && !hasWebSocketError) {
      console.log("• 所有网络检查都通过，问题可能在应用逻辑层面");
      console.log("• 检查token和roomId是否有效");
      console.log("• 查看详细的应用日志");
    }
  }
  /**
   * 获取诊断结果
   */
  getResults() {
    return this.results;
  }
}
const networkDiagnostic = new NetworkDiagnostic();
exports.networkDiagnostic = networkDiagnostic;
