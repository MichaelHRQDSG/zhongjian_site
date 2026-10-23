# zhongjian_site 多环境说明（子域方案）

同一套前端代码，用环境变量文件区分 local / dev / test / prod。  
**不修改 `releases/`。**

## 环境对照

| CORP_ENV | 公网 Host（新链接） | 默认端口 | 后台 API（VITE_API_BASE_URL） | Admin 结果库 |
|----------|---------------------|----------|-------------------------------|--------------|
| local | `local.corp.eap.ji-psy.com` | 3110 | mini-dev `:19000` | mini-dev |
| dev | `dev.corp.eap.ji-psy.com` | 3111 | mini-dev `:19000` | mini-dev |
| test | `test.corp.eap.ji-psy.com` | 3112 | mini-test `:18000` | mini-test |
| prod | `corp.eap.ji-psy.com`（无环境前缀） | 3100 | mini-production `:28000` | production |

## 历史链接迁移（已完成）

原先发出的定制链接全部是 `https://corp.eap.ji-psy.com/onboarding/{slug}`，当时 corp 进程打的是 mini-dev。  
现已一次性改为：

1. **数据**：`shared/dev/assessment-data/enterprises.json` 中企业 `url` → `https://dev.corp.eap.ji-psy.com/onboarding/{slug}`
2. **nginx**：旧 `corp.eap…/onboarding/{slug}`（及裸 slug）**301** → 对应 `dev.corp…`
3. **corp 主域**：切到 **prod → mini-production `:28000`**，仅服务新的生产链接

## 配置文件

| 文件 | 是否进 Git |
|------|------------|
| `.env.example` | 是（模板） |
| `.env.local` / `.env.dev` / `.env.test` / `.env.prod` | **否**（gitignore） |
| `config/corp-env/.env.*` | **否**（服务器推荐放置处） |

```bash
cd /data/mini_program/EAP_project_site/zhongjian_site
cp .env.example config/corp-env/.env.dev   # 按表修改
```

**警告（Next.js）：** 仓库根目录的 `.env.local` 会在任意 `next build` 时被自动加载。  
请把各环境文件放在 `config/corp-env/`，由 `corp-with-env.sh` / `corp-start.sh` 显式加载。

关键变量：

- `CORP_ENV` / `NEXT_PUBLIC_CORP_ENV`：环境标识（现用子域区分环境，页面不再显示红色角标）  
- `VITE_API_BASE_URL`：测评 API（映射为 `ASSESSMENT_API_BASE_URL`）  
- `CORP_PUBLIC_ORIGIN`：本环境对外站点根  
- `NEXT_DIST_DIR`：默认 `.next-<env>`，同机并行隔离产物

## 构建 / 启动 / systemd

```bash
./scripts/corp-build.sh all          # 或单个 local|dev|test|prod
./scripts/corp-start.sh dev          # 前台调试

# 多实例（模板单元）
sudo cp deploy/systemd/zhongjian-eap-site@.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now zhongjian-eap-site@{local,dev,test,prod}
```

旧的单实例 `zhongjian-eap-site.service` 在切换到 `@prod` 后应停用，避免抢占 `:3100`。

## Admin 新链接前缀（environments/*，不改 releases）

| 环境 | `NEXT_PUBLIC_ZHONGJIAN_SITE_BASE_URL` |
|------|----------------------------------------|
| mini-dev | `https://dev.corp.eap.ji-psy.com/onboarding` |
| mini-test | `https://test.corp.eap.ji-psy.com/onboarding` |
| mini-production | `https://corp.eap.ji-psy.com/onboarding` |

完整链接 = 前缀 + `/{slug}`。改前缀后需 **重建该环境 admin 镜像** 才生效。

## 环境区分

用子域区分环境（`local.` / `dev.` / `test.` / 无前缀 prod），页面上不再显示红色环境角标。
