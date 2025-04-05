# Node.js 学习项目

这是一个用于学习 Node.js 和 TypeScript 的项目，提供了完整的开发环境配置和异步编程示例。

## 项目特点

- 完整的 TypeScript 开发环境配置
- 异步迭代器的实现和示例
- 完善的测试框架集成
- 代码质量工具链（ESLint, Prettier）
- Git 提交规范配置

## 开发环境配置

本项目已配置以下开发工具：

- **TypeScript**: 静态类型检查
- **Mocha & Chai**: 测试框架
- **ESLint**: 代码检查
- **Prettier**: 代码格式化
- **Husky & lint-staged**: Git 钩子
- **Commitizen**: 规范化提交信息

## 安装

```bash
# 克隆仓库
git clone https://github.com/yourusername/nodejs-learning-project.git

# 进入项目目录
cd nodejs-learning-project

# 安装依赖
npm install
```

## 使用方法

### 开发

```bash
# 开发模式运行
npm run dev

# ESM 模式运行
npm run dev:esm
```

### 编译运行单个文件

```bash
tsx src/path
```

### debug 断点调试
在 index.ts 中 import 对应文件 , 可通过 vscode 断点调试

### 构建

```bash
# 编译 TypeScript
npm run build
```

### 测试

```bash
# 运行测试
npm test

# 监视模式运行测试
npm run test:watch
```

### 代码质量

```bash
# 代码检查
npm run lint

# 代码格式化
npm run format
```

### 提交代码

```bash
# 使用规范化提交
npm run commit
```

## 项目结构

```
project-root/
├── .vscode/            # VS Code 配置
├── .husky/             # Git 钩子
├── src/                # 源代码
│   └── async-iterator-practice.ts  # 异步迭代器示例
├── test/               # 测试文件
│   └── async-iterator.test.ts      # 异步迭代器测试
├── dist/               # 编译输出（构建后生成）
├── .eslintrc.js        # ESLint 配置
├── .prettierrc         # Prettier 配置
├── .mocharc.json       # Mocha 配置
├── tsconfig.json       # TypeScript 配置
├── package.json        # 项目配置
└── README.md           # 项目说明
```

## 学习资源

本项目包含以下学习资源：

- 异步迭代器的实现和用法示例
- 可取消的异步操作示例
- 异步流程控制模式

## 许可证

MIT
