<template>
	<view>
		<view class="container">
			<slot></slot>
		</view>
	</view>
</template>

<script setup>
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'

onLaunch(() => {
	console.log('App Launch')
})

onShow(() => {
	console.log('App Show')
})

onHide(() => {
	console.log('App Hide')
})
</script>

<style>
/* 从app.wxss迁移的全局样式 */
.container {
	height: 100%;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: space-between;
	padding: 200rpx 0;
	box-sizing: border-box;
}

/* 其他全局样式 */
page {
	background: #f6f6f6;
	display: flex;
	flex-direction: column;
	justify-content: flex-start;
}

/* 通用按钮样式 */
.btn {
	height: 88rpx;
	border-radius: 44rpx;
	font-size: 28rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border: none;
}

.btn::after {
	display: none;
}

.btn-primary {
	background-color: #4CAF50;
	color: #fff;
}

.btn-default {
	background-color: #f5f5f5;
	color: #333;
}

/* 通用加载动画 */
.loading-spinner {
	width: 60rpx;
	height: 60rpx;
	border: 6rpx solid #f3f3f3;
	border-top: 6rpx solid #4CAF50;
	border-radius: 50%;
	animation: spin 1s linear infinite;
}

@keyframes spin {
	0% { transform: rotate(0deg); }
	100% { transform: rotate(360deg); }
}
</style> 