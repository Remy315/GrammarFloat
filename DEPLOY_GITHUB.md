# GrammarFloat 部署到 GitHub 并打包 APK 完整教程

## 📦 第一步：下载项目代码

项目已打包为 `GrammarFloat-Full.tar.gz`，你可以从云端下载到本地 D 盘。

### 下载方式

**方式一：使用浏览器下载**
- 文件位置：`/tmp/GrammarFloat-Full.tar.gz`
- 大小：约 2.4MB

**方式二：使用命令行下载（如果你有 ssh/scp 访问权限）**
```bash
scp user@server:/tmp/GrammarFloat-Full.tar.gz D:/MyApps/
```

---

## 🚀 第二步：推送到 GitHub

### 2.1 在 GitHub 创建新仓库

1. 登录 GitHub：https://github.com
2. 点击右上角 **+** → **New repository**
3. 填写信息：
   - Repository name: `GrammarFloat`
   - Description: 浮窗英文语法检查与主动学习助手
   - 选择 **Public**（公开仓库）
   - **不要**勾选 "Add a README file"（我们已经有了）

### 2.2 初始化本地仓库并推送

打开 PowerShell 或 CMD，进入 D 盘项目目录：

```bash
# 进入项目目录（根据你实际解压位置调整）
cd D:\MyApps\GrammarFloat-Full

# 初始化 Git（如果还没有）
git init

# 添加所有文件
git add .

# 提交
git commit -m "feat: 初始提交 GrammarFloat 应用"

# 添加远程仓库（替换为你的仓库地址）
git remote add origin https://github.com/你的用户名/GrammarFloat.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

---

## 📱 第三步：配置 GitHub Actions 自动打包 APK

### 3.1 创建 Expo Token

1. 登录 https://expo.dev
2. 点击头像 → **Access Tokens**
3. 点击 **Create a new token**
4. 复制生成的 Token

### 3.2 在 GitHub 仓库添加密钥

1. 进入你的 GitHub 仓库
2. 点击 **Settings** → **Secrets and variables** → **Actions**
3. 点击 **New repository secret**
4. 名称：`EXPO_TOKEN`
5. 值：粘贴你刚才复制的 Expo Token
6. 点击 **Add secret**

### 3.3 推送代码触发构建

```bash
git add .
git commit -m "chore: 配置 GitHub Actions 自动打包"
git push
```

### 3.4 查看构建状态

1. 进入 GitHub 仓库页面
2. 点击 **Actions** 标签
3. 可以看到 "Build Android APK" 工作流正在运行
4. 等待 5-10 分钟（首次构建需要下载依赖）

### 3.5 下载 APK

1. 构建完成后，点击工作流
2. 点击右侧 **Artifacts**
3. 点击 **GrammarFloat-APK** 下载
4. 将 APK 文件传输到手机安装

---

## 🖥️ 第四步：本地构建 APK（可选）

如果你想在本地电脑直接构建 APK：

### 准备工作

| 软件 | 下载地址 | 说明 |
|------|----------|------|
| Node.js 20+ | https://nodejs.org | 必须 |
| Java JDK 17 | https://adoptium.net | 必须 |
| Android Studio | https://developer.android.com/studio | 必须 |
| Git | https://git-scm.com | 可选 |

### 构建步骤

```bash
# 1. 解压项目
cd D:\MyApps
tar -xzvf GrammarFloat-Full.tar.gz
cd GrammarFloat

# 2. 安装前端依赖
cd client
npm install

# 3. 生成 Android 原生项目
npx expo prebuild --platform android

# 4. 打开 Android Studio
# File → Open → 选择 client/android 文件夹
# 等待 Gradle 同步完成

# 5. 在 Android Studio 中构建
# Build → Generate Signed Bundle / APK
# 选择 APK → Release → Next
# 如果没有 keystore，创建一个新的
# 选择 output 路径
# 点击 Finish

# 或者使用命令行构建
cd client/android
./gradlew assembleRelease
```

APK 文件位置：`client/android/app/build/outputs/apk/release/app-release.apk`

---

## 📋 完整流程图

```
┌─────────────────────────────────────────────────────────────┐
│  1. 下载 GrammarFloat-Full.tar.gz                          │
│           ↓                                                 │
│  2. 解压到 D:\MyApps\GrammarFloat                           │
│           ↓                                                 │
│  3. 创建 GitHub 仓库                                        │
│           ↓                                                 │
│  4. 推送代码到 GitHub                                        │
│           ↓                                                 │
│  5. 配置 EXPO_TOKEN 密钥                                     │
│           ↓                                                 │
│  6. GitHub Actions 自动构建 APK                             │
│           ↓                                                 │
│  7. 下载 APK 并安装到手机                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## ❓ 常见问题

### Q: 推送代码时提示需要登录？
```bash
git push -u origin main
# 会弹出窗口让你登录 GitHub
```

### Q: GitHub Actions 构建失败？
- 检查 EXPO_TOKEN 是否正确添加
- 查看 Actions 日志定位错误
- 常见问题：网络超时（可以重试）

### Q: 如何更新应用？
```bash
# 修改代码后
git add .
git commit -m "fix: 修复某个bug"
git push
# GitHub 会自动重新构建
```

### Q: 如何自定义应用名称和图标？
编辑 `client/app.config.ts` 文件：

```typescript
export default {
  name: "你的应用名称",
  slug: "your-app-name",
  android: {
    package: "com.yourcompany.yourapp",  // 包名
  },
  // 修改图标：在 client/assets/images/ 替换 icon.png
};
```

---

## 🎯 最终成果

完成后你会得到：
- 📱 `app-release.apk` - 可安装到 Android 手机的应用
- 🌐 GitHub 仓库 - 代码托管地址
- ⚙️ GitHub Actions - 后续更新自动重新打包
