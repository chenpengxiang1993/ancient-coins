#!/bin/bash
# 一键配置服务器环境脚本
# 在服务器上以 root 或 sudo 权限运行: sudo bash setup-server.sh

set -e

DEPLOY_USER="ubuntu"
SITE_DIR="/var/www/frontend/coins"
SSL_DIR="/etc/nginx/ssl/coins.family-chen.com"
DOMAIN="coins.family-chen.com"
NGINX_CONF="/etc/nginx/nginx.conf"

echo "=== 1. 创建站点目录 ==="
mkdir -p "$SITE_DIR"
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$SITE_DIR"
echo "已创建 $SITE_DIR 并设置归属为 $DEPLOY_USER"

echo "=== 2. 创建 SSL 证书目录 ==="
mkdir -p "$SSL_DIR"
echo "已创建 $SSL_DIR"
echo "请将 SSL 证书文件放入该目录："
echo "  - $SSL_DIR/coins.family-chen.com_bundle.crt"
echo "  - $SSL_DIR/coins.family-chen.com.key"

echo "=== 3. 添加 Nginx 配置 ==="
echo "需要手动操作，请参见部署指南"

echo ""
echo "=== 基础配置完成! ==="
echo "接下来请按部署指南完成：SSL 证书上传 → Nginx 配置修改 → GitHub Secrets 配置"
