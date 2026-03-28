# 阶段 1: 构建阶段
FROM node:22-slim AS builder

# 设置工作目录
WORKDIR /app

# 安装构建工具
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY package*.json ./

# 安装所有依赖
RUN npm install

# 复制源代码
COPY . .

# 构建前端
RUN npm run build

# 阶段 2: 运行阶段
FROM node:22-slim

WORKDIR /app

# 从构建阶段复制必要文件
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/src/db.ts ./src/
COPY --from=builder /app/src/firebase.ts ./src/

# 只安装生产环境依赖
RUN npm install --omit=dev

# 创建数据目录
RUN mkdir -p /app/data

# 暴露端口
EXPOSE 3000

# 环境变量
ENV NODE_ENV=production

# 启动应用
CMD ["npm", "start"]
