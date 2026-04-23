# GrammarFloat - 浮窗英文语法检查与主动学习助手

一款可安装于 Android/iOS 手机的系统级悬浮窗应用，提供英语语法即时检查、自我纠错练习与轻量翻译能力。

## 功能特性

- **浮窗悬浮球** - 半透明悬浮点常驻屏幕边缘，点击展开快捷面板
- **语法检查双模式**
  - 自动修正模式：实时修正英文语法错误
  - 学习模式：原位修改 + 句子练习
- **翻译功能** - 中英双向互译，支持语音输入
- **历史记录** - 保存最近20条检查记录
- **双语交互** - 所有结果支持中英文翻转查看

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/你的用户名/GrammarFloat.git
cd GrammarFloat
```

### 2. 安装依赖

```bash
cd client
npm install
```

### 3. 本地预览

```bash
npx expo start --web
```

### 4. 构建 APK

#### 方式一：本地构建（需要 Android Studio）

```bash
# 生成原生 Android 项目
npx expo prebuild --platform android

# 进入 Android 目录
cd android

# 构建 Release APK
./gradlew assembleRelease
```

APK 文件位置: `android/app/build/outputs/apk/release/app-release.apk`

#### 方式二：GitHub Actions 自动构建（推荐）

1. Fork 本仓库
2. 在 GitHub 仓库 Settings -> Secrets 添加 `EXPO_TOKEN`
3. 推送代码到 main 分支
4. 在 Actions 页面查看构建进度
5. 构建完成后在 Artifacts 下载 APK

### 5. 安装 APK

将 APK 文件传输到手机，安装后即可使用。

## 技术栈

- **前端**: Expo 54 + React Native
- **后端**: Express.js + LanguageTool API
- **UI**: TailwindCSS (Uniwind) + 柔和卡片风格
- **状态管理**: React Context

## 目录结构

```
GrammarFloat/
├── client/                 # React Native 前端
│   ├── app/               # Expo Router 路由
│   ├── screens/           # 页面组件
│   ├── components/        # 可复用组件
│   ├── contexts/          # 状态管理
│   └── utils/             # 工具函数
├── server/                 # Express.js 后端
│   └── src/
│       └── routes/        # API 路由
└── .github/workflows/     # CI/CD 配置
```

## API 接口

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/v1/health` | GET | 健康检查 |
| `/api/v1/grammar/check` | POST | 语法检查 |
| `/api/v1/translate` | POST | 翻译 |
| `/api/v1/history` | GET | 获取历史 |
| `/api/v1/history` | POST | 保存历史 |

## 许可证

MIT License
