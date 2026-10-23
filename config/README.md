# 广厦心安（zhongjian_site）环境变量使用说明

本文说明 **corp 站点**（`local/dev/test/prod` 子域）的环境变量放在哪、怎么改、改完要跑什么命令。  
更完整的架构对照见仓库根目录 `ENVIRONMENTS.md`。

> **范围**：只改本项目 `zhongjian_site`。  
> 小程序栈（backend / eap / admin）的环境变量在 `/data/mini_program/environments/{dev,test,production}/`，不在本目录。

---

## 0. 先看清：四个环境分别是什么

| 环境名 | 公网访问 | 本机端口 | 测评 API（默认） |
|--------|----------|----------|------------------|
| `local` | `https://local.corp.eap.ji-psy.com` | `3110` | mini-dev `:19000` |
| `dev` | `https://dev.corp.eap.ji-psy.com` | `3111` | mini-dev `:19000` |
| `test` | `https://test.corp.eap.ji-psy.com` | `3112` | mini-test `:18000` |
| `prod` | `https://corp.eap.ji-psy.com` | `3100` | mini-production `:28000` |

环境靠子域区分，页面上**不再**显示红色环境角标。

同一套代码，靠不同 `.env.*` + 独立构建产物目录 `.next-<env>` 同机并行。

---

## 1. 确认配置文件放哪里

**目的**：让脚本加载正确的变量，并避免 Next.js 自动误读根目录 `.env.local`。

**服务器推荐路径（当前现网用法）：**

```text
config/corp-env/.env.local
config/corp-env/.env.dev
config/corp-env/.env.test
config/corp-env/.env.prod
```

**加载顺序**（`scripts/corp-load-env.sh`）：

1. 仓库根目录 `.env.<name>`（若存在则优先）
2. 否则 `config/corp-env/.env.<name>`

**注意事项：**

- 真实 `.env.*` **不进 Git**（已 gitignore）；可提交的只有仓库根目录 `.env.example`。
- **不要**把 `.env.local` 放在仓库根目录。Next 在任意 `next build` 时都会自动加载它，容易把其它环境串脏。
- `HOSTNAME=127.0.0.1` 表示只监听本机；公网由 nginx 按 Host 反代，不要改成 `0.0.0.0`，除非你明确知道后果。

---

## 2. 新建或修改某一环境的变量

**目的**：调整该环境的端口、对外 Origin、对接的后台 API 等。

**命令（以 dev 为例）：**

```bash
cd /data/mini_program/EAP_project_site/zhongjian_site

# 若文件尚不存在：从模板复制
cp .env.example config/corp-env/.env.dev

# 编辑
vim config/corp-env/.env.dev   # 或 nano / code 等
```

其它环境把文件名改成 `.env.local` / `.env.test` / `.env.prod` 即可。

**常见字段与用途：**

| 变量 | 用途 |
|------|------|
| `CORP_ENV` / `NEXT_PUBLIC_CORP_ENV` | 环境标识（构建/脚本用；页面不再显示角标） |
| `CORP_PUBLIC_ORIGIN` / `NEXT_PUBLIC_CORP_PUBLIC_ORIGIN` | 本环境对外站点根 URL |
| `PORT` | Next 监听端口（须与 nginx upstream 一致） |
| `HOSTNAME` | 绑定地址（现网用 `127.0.0.1`） |
| `VITE_API_BASE_URL` | 测评/企业定制 API 根地址（团队约定名；运行时映射为 `ASSESSMENT_API_BASE_URL`） |
| `ASSESSMENT_API_BASE_URL` / `MINI_API_BASE_URL` | 与上面保持一致即可 |
| `MINI_PUBLIC_BASE_URL` | 对应小程序/EAP 公网页根（资源、上传等） |
| `BACKEND_ENV` | 后台环境代称（`eap` / `test` / `production`） |

**注意事项：**

- 改 `PORT` 后必须同步改 nginx 反代目标，否则公网打不开。
- 改 `VITE_API_BASE_URL` 等于换答卷写入的后台库；**切勿把 prod 指到 dev API**，反之亦然。
- `NEXT_PUBLIC_*` 会进入前端打包产物，**仅重启进程不够**，必须重新 build（见第 4 步）。

---

## 3. 核对脚本实际加载到的值

**目的**：改完后先确认没有拿错文件、没有被根目录其它 `.env` 覆盖。

**命令：**

```bash
cd /data/mini_program/EAP_project_site/zhongjian_site

./scripts/corp-with-env.sh dev printenv | grep -E 'CORP_|VITE_|ASSESSMENT_|MINI_|PORT|HOSTNAME|BACKEND_|NEXT_PUBLIC_'
```

把 `dev` 换成 `local` / `test` / `prod`。

**注意事项：**

- 输出里会打印 `[corp-env] file=...`，确认 `file=` 指向你刚改的那份。
- 若根目录误放了同名 `.env.dev`，会**优先于** `config/corp-env/.env.dev`；不需要时请移走根目录那份。

---

## 4. 构建该环境产物

**目的**：生成/更新 `.next-<env>`，并把 `NEXT_PUBLIC_*` 打进前端。

**命令：**

```bash
cd /data/mini_program/EAP_project_site/zhongjian_site

# 只构建一个环境
./scripts/corp-build.sh dev

# 或四个全部构建
./scripts/corp-build.sh all
```

**注意事项：**

- 构建前根目录**不能**存在 `.env.local`（脚本会直接拒绝）。
- 构建时会临时隔离根目录 `.env.production`，避免串环境；不要手动打断后不管，异常退出时检查该文件是否还在。
- 产物目录：`.next-local` / `.next-dev` / `.next-test` / `.next-prod`，互不影响。
- 仅改了**服务端**变量（如只改 `VITE_API_BASE_URL`、`PORT` 且不涉及 `NEXT_PUBLIC_*`）时，多数情况重启即可；但改了任何 `NEXT_PUBLIC_*` 或不确定时，**一律重新 build**。

---

## 5. 启动 / 使配置生效

按场景二选一。

### 5A. 前台调试（临时）

**目的**：本机前台跑起来看日志，不经 systemd。

**命令：**

```bash
cd /data/mini_program/EAP_project_site/zhongjian_site
./scripts/corp-start.sh dev
```

**注意事项：**

- 必须先有对应 `.next-dev`（先跑第 4 步）。
- 若该端口已被 systemd 占用，先停对应单元，再前台启动。

### 5B. 现网 systemd（推荐）

**目的**：后台常驻，与 nginx 现网一致。

**命令：**

```bash
# 仅重启某一环境（改完 env 且已按需 build 之后）
sudo systemctl restart zhongjian-eap-site@dev

# 查看状态 / 日志
systemctl status zhongjian-eap-site@dev --no-pager
tail -n 80 /data/mini_program/logs/zhongjian-eap/dev.out.log
tail -n 80 /data/mini_program/logs/zhongjian-eap/dev.err.log
```

四个实例名：`@local` / `@dev` / `@test` / `@prod`。

**首次安装模板单元（一般已装好，仅新机器需要）：**

```bash
cd /data/mini_program/EAP_project_site/zhongjian_site
sudo cp deploy/systemd/zhongjian-eap-site@.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now zhongjian-eap-site@{local,dev,test,prod}
```

**注意事项：**

- 单元通过 `corp-start.sh %i` 加载 `config/corp-env/.env.%i`，**不要**再往 unit 里写死旧的 `PORT`/`API`。
- 旧的单实例 `zhongjian-eap-site.service` 会与 `@prod` 抢 `:3100`，切换后应保持 **disable + stop**。
- 改 nginx / 证书属于运维风险操作，与改本目录 env 分开评估。

---

## 6. 改完后的验收

**目的**：确认公网 Host、角标、对接后台是否符合预期。

**命令示例：**

```bash
# 进程是否在听端口
ss -lntp | grep -E '3100|3110|3111|3112'

# 页面是否通（按环境换 Host）
curl -sI 'https://dev.corp.eap.ji-psy.com/' | head

# 各环境均不应再出现红色环境角标文案
curl -s 'https://test.corp.eap.ji-psy.com/' | grep -E 'DEV ENVIRONMENT|TEST ENVIRONMENT|LOCAL ENVIRONMENT' || echo 'no badge ok'
```

**注意事项：**

- 历史企业链接已迁到 `dev.corp…`；旧 `corp.eap…/onboarding/{旧 slug}` 由 nginx **301** 跳转，不要为了“兼容”再把 prod 指回 mini-dev。

---

## 7.（相关）Admin 生成企业链接的前缀

**目的**：后台「新建企业」复制出来的 URL 前缀与上表一致。

这一项 **不在** `config/corp-env/`，而在小程序环境文件：

| 小程序环境 | 配置文件 | 变量 |
|------------|----------|------|
| mini-dev | `/data/mini_program/environments/dev/dev.env` | `NEXT_PUBLIC_ZHONGJIAN_SITE_BASE_URL=https://dev.corp.eap.ji-psy.com/onboarding` |
| mini-test | `.../test/test.env` | `...=https://test.corp.eap.ji-psy.com/onboarding` |
| mini-production | `.../production/production.env` | `...=https://corp.eap.ji-psy.com/onboarding` |

改前缀后必须 **重建该环境 admin 镜像** 再拉起，例如：

```bash
cd /data/mini_program/environments/dev
./dev-compose.sh build admin
./dev-compose.sh up -d --no-deps --force-recreate --wait admin
```

（test / production 分别用 `test-compose.sh` / `production-compose.sh`。）

**注意事项：** `recreate-*-apps.sh` 带 `--no-build`，**吃不进**新的 `NEXT_PUBLIC_*`。

---

## 速查：我改了什么 → 下一步做什么

| 你改了什么 | 最少要做什么 |
|------------|----------------|
| 仅 `PORT` / `HOSTNAME` / `VITE_API_BASE_URL` 等服务端变量 | `systemctl restart zhongjian-eap-site@<env>`（若改端口还要改 nginx） |
| 任意 `NEXT_PUBLIC_*` | `./scripts/corp-build.sh <env>` → `systemctl restart zhongjian-eap-site@<env>` |
| 新建一套 env 文件 | 复制模板 → 填值 → build → enable/start 对应 `@` 单元 |
| Admin 企业链接前缀 | 改 `environments/*/…env` → `build admin` → recreate admin |

---

## 目录结构（本 config 下）

```text
config/
├── README.md          ← 本说明
└── corp-env/
    ├── .gitkeep
    ├── .env.local     ← 不入库
    ├── .env.dev       ← 不入库
    ├── .env.test      ← 不入库
    └── .env.prod      ← 不入库
```
