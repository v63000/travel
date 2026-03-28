# 旅游报价与合同管理系统 (Travel Quotation & Contract Management System)

这是一个基于 React + Vite 前端和 Express + SQLite 后端的全栈旅游报价与合同管理系统。

## 程序说明

本系统旨在帮助旅游从业人员快速生成报价单、管理客户信息以及生成和签署合同。

### 主要功能

- **报价管理**：创建、编辑、复制和导出报价单（支持 PDF, Excel, Word, PPT）。
- **合同管理**：基于报价单生成合同，支持合同模板管理和预览。
- **客户管理**：管理客户基本信息，支持在报价时快速选择或新增客户。
- **产品库**：分级管理旅游产品（大类/小类），支持价格、单位和最低折扣设置。
- **系统设置**：配置公司名称、Logo 和联系信息。
- **权限控制**：支持超级管理员、管理员、报价员和查看者四种角色。

## 架构说明

### 技术栈

- **前端**：React 19, Vite, Tailwind CSS, Lucide React (图标), Motion (动画)。
- **后端**：Node.js, Express, SQLite3 (数据库), JWT (身份验证)。
- **部署**：支持 Docker 和 Docker Compose。

### 目录结构

- `/src`：前端源代码。
  - `/views`：页面组件。
  - `/components`：通用组件。
  - `/lib`：工具函数。
- `server.ts`：后端 Express 服务器入口。
- `src/db.ts`：数据库初始化与操作逻辑。
- `Dockerfile` & `docker-compose.yml`：Docker 部署配置。

## 部署说明 (Docker)

### 环境要求

- 已安装 Docker 和 Docker Compose。

### 快速启动

1.  **确保所有文件已准备就绪**：
    *   `Dockerfile`
    *   `docker-compose.yml`
    *   `package.json`
    *   `server.ts`
    *   `src/` 目录等
2.  **启动容器**：
    ```bash
    docker-compose up -d
    ```
3.  **访问系统**：
    打开浏览器访问 `http://localhost:3000`。

### 默认凭据

- **初始管理员账号**：`admin@system.local` (或输入 `admin`)
- **初始管理员密码**：`admin888`

## 1Panel 部署说明

1Panel 是一个现代化的开源 Linux 面板，可以非常方便地管理 Docker 容器。

### 部署步骤 (关键：必须上传 Dockerfile)

1.  **准备代码目录**：在 1Panel 的“文件”管理中，创建一个目录（例如 `/opt/travel-app`）。
2.  **上传所有必要文件**：将本项目的所有文件上传到该目录。**特别注意：必须包含 `Dockerfile` 和 `docker-compose.yml`**。
3.  **创建编排**：
    *   进入 1Panel 面板，点击左侧菜单的 **[容器] -> [编排]**。
    *   点击 **[创建编排]**。
    *   **名称**：`travel`
    *   **路径**：选择您刚才上传代码的目录（如 `/opt/travel-app`）。
    *   **内容**：点击 **[从本地获取]**。此时 1Panel 会读取该目录下的 `docker-compose.yml`。
4.  **确认并启动**：点击 **[确认]**。1Panel 会自动根据 `Dockerfile` 构建镜像并启动容器。

**常见错误：**
如果报错 `open Dockerfile: no such file or directory`，说明您在 1Panel 指定的路径下缺少 `Dockerfile` 文件。请务必检查该目录下是否存在此文件。

## 注意事项

- **数据持久化**：数据库文件存储在容器内的 `/app/data` 目录，已通过 Docker 卷映射到宿主机的 `./data` 目录。请务必备份此目录。
- **Firebase 兼容性**：本系统目前正在从 Firebase 架构迁移到本地 API 架构。前端部分功能可能仍依赖 Firebase SDK，建议在部署前确保 `src/firebase.ts` 中的配置正确，或联系开发人员完成完全脱离 Firebase 的迁移。
