# 你画我猜小程序

基于uni-app框架开发的你画我猜小程序，支持多平台发布。

## 项目说明

这是一个多人在线你画我猜游戏，玩家可以创建房间或加入已有房间进行游戏。游戏过程中，玩家轮流担任绘画者和猜词者的角色。

## 功能特点

- 用户登录和身份验证
- 创建/加入游戏房间
- 实时绘画和猜词
- 排行榜系统
- 游戏统计
- 个性化设置

## 开发环境

- HBuilderX
- Node.js
- uni-app框架
- Vue.js 2.x

## 运行说明

1. 安装依赖：
```bash
npm install
```

2. 开发模式运行：
```bash
# 运行到H5
npm run dev:h5

# 运行到微信小程序
npm run dev:mp-weixin
```

3. 发布构建：
```bash
# 构建H5版本
npm run build:h5

# 构建微信小程序版本
npm run build:mp-weixin
```

## 目录结构

```
├── pages                 # 页面文件目录
│   ├── index            # 首页
│   ├── login            # 登录页
│   ├── game             # 游戏房间
│   ├── draw             # 绘画页面
│   └── avatar-selector  # 头像选择
├── static               # 静态资源
├── components           # 组件目录
├── store               # Vuex状态管理
├── utils               # 工具函数
└── App.vue             # 应用配置
```

## 注意事项

1. 首次运行需要在manifest.json中配置小程序的AppID
2. 开发时请确保后端服务已启动
3. 小程序开发工具需要设置不校验合法域名 