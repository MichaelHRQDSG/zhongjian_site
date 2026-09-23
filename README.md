# 广厦心安 · 中建三局 EAP 员工心理关爱平台

Next.js 实现版本，视觉与交互对齐设计稿  
`EAP_site/design_handoff_guangsha_xinan_eap (1)`。

## 项目定位

- **品牌**：广厦心安 · 中建三局员工心理关爱平台
- **EAP 服务商**：连心心理（第三方数据托管）
- **技术栈**：Next.js 15（App Router）+ TypeScript + Tailwind CSS + React 19
- **目标**：桌面端像素级还原设计稿；手机端补齐可用布局与导航

## 页面与路由

| 路由 | 说明 |
|------|------|
| `/` | 首页（通知条、导航、Hero、数据条、核心服务、心理知识库、预约咨询、理念、页脚） |
| `/onboarding` | 企业专属链接提示页，不直接公开量表 |
| `/onboarding/[slug]` | 按企业后缀加载后台授权的私有量表 |

首页锚点：

- `#services` 核心服务
- `#library` 心理知识库
- `#consultation` 预约咨询

## 本地开发

```bash
cd D:\Code\VScode_File\Syapp\EAP_site\zhongjian_site
npm install
npm run dev
```

浏览器打开 [http://localhost:3000](http://localhost:3000)。

企业量表接口通过环境变量配置：

```bash
ASSESSMENT_API_BASE_URL=http://127.0.0.1:8000
```

管理后台创建的企业链接应使用 `/onboarding/企业后缀` 形式。

生产构建：

```bash
npm run build
npm start
```

## 目录结构

```text
zhongjian_site/
├── public/assets/          # Logo、Hero、图文封面、疗愈音频
├── src/
│   ├── app/
│   │   ├── layout.tsx      # 全局字体 / metadata / viewport
│   │   ├── globals.css     # Design Tokens + 响应式覆盖
│   │   ├── page.tsx        # 首页
│   │   └── onboarding/
│   │       ├── page.tsx    # 企业专属入口提示
│   │       └── [slug]/page.tsx # 企业私有量表
│   ├── components/
│   │   ├── shared/data.tsx # 文案数据、Icon、CitySkyline
│   │   ├── home/DesignV1.tsx
│   │   ├── onboarding/OnboardingAssessment.tsx
│   │   └── layout/MobileNav.tsx
│   └── lib/tokens.ts       # 品牌色常量
├── scripts/convert-handoff.cjs  # 设计稿 JSX → TSX 转换脚本（可选）
└── README.md
```

## 设计还原说明

- 配色、字号、间距、圆角、阴影、文案与设计稿一致（桌面端）
- 字体：`Noto Serif SC`（标题）+ `Noto Sans SC`（正文），通过 `next/font` 加载
- 不包含设计调试面板（TweaksPanel）与栏目预览（ColumnsOverview）
- 静态资源路径统一为 `/assets/...`

### Design Tokens（摘要）

| Token | 色值 |
|-------|------|
| primary | `#1E4C9A` |
| primaryDark | `#0F2E5F` |
| primaryDeep | `#0A1E42` |
| accent | `#C8161D` |
| warm | `#F5EFE6` |

## 手机端体验

设计稿本身未覆盖移动端，本项目补充：

- **`<768px`**：汉堡菜单抽屉导航；隐藏桌面 CTA 条
- **`≤1024px`**：Hero / 知识库 / 欢迎页改为单列；服务与咨询师改为 2 列或 1 列；页脚折叠
- 顶部热线使用 `tel:` 便于拨号
- 入职测评主区域缩小内边距，步骤条可横向滚动

桌面端（≥1280）保持设计稿布局不变。

## 入职测评状态

- 当前步骤按企业写入独立的 `localStorage` 键
- 量表由后台企业定制配置按链接后缀动态加载
- 报告页为前端预览示意，未接后端评分 API

## 后续可接入 API（建议）

```text
POST /api/onboarding/start
POST /api/onboarding/basic-info
POST /api/onboarding/scale-answer
POST /api/onboarding/submit
GET  /api/onboarding/report/:id
```

测评与咨询数据应由 **连心心理** 独立托管，与人事系统物理隔离。

## 从设计稿重新生成组件

若更新了 handoff 中的 JSX：

```bash
node scripts/convert-handoff.cjs
```

然后检查路由链接、`/assets` 路径，并补回本仓库中的 MobileNav / 类型调整。

## 合规提示

- 咨询与测评数据需端到端加密与权限隔离
- 页面已强调「不进入人事档案」与第三方托管承诺
- 生产环境请替换 AI 示例图片为客户真实素材

## 版本

- 对齐设计稿：v3（2026-09-15）
- Next.js 工程：`zhongjian_site` 初版
