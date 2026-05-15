# 部署指南

## 服务器环境配置（一次性）

### 1. 创建站点目录

```bash
ssh ubuntu@49.232.11.117
sudo mkdir -p /var/www/frontend/coins
sudo chown -R ubuntu:ubuntu /var/www/frontend/coins
```

### 2. 上传 SSL 证书

将 `coins.family-chen.com` 的 SSL 证书上传到服务器：

```bash
# 在本地执行
ssh ubuntu@49.232.11.117 "sudo mkdir -p /etc/nginx/ssl/coins.family-chen.com"
scp coins.family-chen.com_bundle.crt ubuntu@49.232.11.117:~/
scp coins.family-chen.com.key ubuntu@49.232.11.117:~/
ssh ubuntu@49.232.11.117 "sudo mv ~/coins.family-chen.com_bundle.crt /etc/nginx/ssl/coins.family-chen.com/ && sudo mv ~/coins.family-chen.com.key /etc/nginx/ssl/coins.family-chen.com/"
```

### 3. 修改 Nginx 配置

编辑 `/etc/nginx/nginx.conf`，做两处修改：

**3.1** 在 HTTP 重定向的 server_name 中加入 `coins.family-chen.com`：

```
server_name family-chen.com www.family-chen.com admin.family-chen.com api.family-chen.com static-img.family-chen.com coins.family-chen.com;
```nginx

**3.2** 在 http 块末尾（`}` 之前）加入 coins 站点的 server 块（内容见 deploy/nginx.conf）

然后重载 Nginx：

```bash
sudo nginx -t && sudo systemctl reload nginx
```

## GitHub Secrets 配置（一次性）

在本地生成专用部署密钥：

```bash
ssh-keygen -t ed25519 -C "github-deploy" -f ~/.ssh/github-deploy -N ""
ssh-copy-id -i ~/.ssh/github-deploy.pub ubuntu@49.232.11.117
```

将以下 Secret 添加到 GitHub 仓库（Settings → Secrets and variables → Actions）：

| Secret 名称 | 值 |
|---|---|
| `DEPLOY_HOST` | `49.232.11.117` |
| `DEPLOY_USER` | `ubuntu` |
| `DEPLOY_KEY` | `cat ~/.ssh/github-deploy` 的完整内容 |

## 自动部署

每次 push 到 master 分支，GitHub Actions 自动构建并部署到 `/var/www/frontend/coins/`。

## 手动部署

```bash
pnpm run parse-data && pnpm run build
rsync -avz --delete dist/ ubuntu@49.232.11.117:/var/www/frontend/coins/
```
