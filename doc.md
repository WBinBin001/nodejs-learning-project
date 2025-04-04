# Node.js 项目开发环境配置指南

我注意到您的文档中有一些重复的配置要求。我将为您提供一个更加结构化的技术文档，详细说明如何配置 Node.js 项目的开发环境。

````markdown:doc.md
# Node.js 项目开发环境配置指南

本项目用于学习 Node.js，以下是完整的开发环境配置步骤。

## TypeScript 环境配置

### 安装依赖
```bash
npm install typescript ts-node @types/node --save-dev
```

### 创建 tsconfig.json
```bash
npx tsc --init
```

### 配置 tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "**/*.test.ts"]
}
```

### 配置 VS Code 调试环境

在项目根目录创建 `.vscode/launch.json` 文件：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "启动程序",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/src/index.ts",
      "preLaunchTask": "tsc: build - tsconfig.json",
      "outFiles": ["${workspaceFolder}/dist/**/*.js"]
    },
    {
      "type": "node",
      "request": "launch",
      "name": "使用 ts-node 运行",
      "runtimeExecutable": "node",
      "runtimeArgs": ["--nolazy", "-r", "ts-node/register/transpile-only"],
      "program": "${workspaceFolder}/src/index.ts",
      "cwd": "${workspaceRoot}",
      "internalConsoleOptions": "openOnSessionStart"
    }
  ]
}
```

## Mocha 测试环境配置

### 安装依赖
```bash
npm install mocha chai @types/mocha @types/chai ts-node --save-dev
```

### 创建 .mocharc.json
```json
{
  "require": "ts-node/register",
  "spec": "src/**/*.test.ts",
  "extension": ["ts"],
  "node-option": [
    "experimental-specifier-resolution=node",
    "loader=ts-node/esm"
  ]
}
```

### 在 package.json 中添加测试脚本
```json
"scripts": {
  "test": "mocha",
  "test:watch": "mocha --watch"
}
```

## ESLint 代码检查配置

### 安装依赖
```bash
npm install eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin --save-dev
```

### 创建 .eslintrc.js
```js
module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  plugins: ['@typescript-eslint'],
  env: {
    node: true,
    es6: true,
    mocha: true
  },
  rules: {
    // 自定义规则
  }
};
```

## Prettier 代码格式化配置

### 安装依赖
```bash
npm install prettier eslint-config-prettier eslint-plugin-prettier --save-dev
```

### 创建 .prettierrc
```json
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

### 更新 .eslintrc.js 以集成 Prettier
```js
module.exports = {
  // ... 其他配置
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
    'plugin:prettier/recommended'
  ],
  // ... 其他配置
};
```

## Git 提交规范配置

### Commitlint 配置

#### 安装依赖
```bash
npm install @commitlint/cli @commitlint/config-conventional --save-dev
```

#### 创建 commitlint.config.js
```js
module.exports = {
  extends: ['@commitlint/config-conventional']
};
```

### Commitizen 配置

#### 安装依赖
```bash
npm install commitizen cz-conventional-changelog --save-dev
```

#### 在 package.json 中添加配置
```json
"scripts": {
  "commit": "cz"
},
"config": {
  "commitizen": {
    "path": "cz-conventional-changelog"
  }
}
```

### Husky 和 lint-staged 配置

#### 安装依赖
```bash
npm install husky lint-staged --save-dev
```

#### 初始化 Husky
```bash
npx husky install
npm set-script prepare "husky install"
```

#### 添加 Husky 钩子
```bash
npx husky add .husky/pre-commit "npx lint-staged"
npx husky add .husky/commit-msg "npx --no -- commitlint --edit $1"
```

#### 创建 .lintstagedrc.json
```json
{
  "*.{ts,js}": ["eslint --fix", "prettier --write"],
  "*.{json,md}": ["prettier --write"]
}
```

## 完整的 package.json 示例

```json
{
  "name": "nodejs-learning-project",
  "version": "1.0.0",
  "description": "Node.js 学习项目",
  "main": "dist/index.js",
  "scripts": {
    "start": "node dist/index.js",
    "dev": "ts-node src/index.ts",
    "build": "tsc",
    "test": "mocha",
    "test:watch": "mocha --watch",
    "lint": "eslint . --ext .ts",
    "format": "prettier --write \"**/*.{ts,js,json,md}\"",
    "prepare": "husky install",
    "commit": "cz"
  },
  "dependencies": {
    // 项目依赖
  },
  "devDependencies": {
    // 开发依赖
  },
  "config": {
    "commitizen": {
      "path": "cz-conventional-changelog"
    }
  }
}
```

## 项目结构建议

完成以上配置后，您的项目结构应该类似于：

```
project-root/
├── .vscode/
│   └── launch.json
├── .husky/
│   ├── pre-commit
│   └── commit-msg
├── src/
│   ├── test/
│   │   └── example.test.ts
│   └── index.ts
├── .eslintrc.js
├── .prettierrc
├── .mocharc.json
├── .lintstagedrc.json
├── commitlint.config.js
├── tsconfig.json
├── package.json
└── README.md
```
````
