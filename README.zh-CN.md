# LiteAgent

LiteAgent 是一个面向本地开发工作流的轻量级 CLI AI 编码助手。英文主文档见 [README.md](./README.md)。

## 概览

- 在终端中与 OpenAI 兼容模型对话
- 查看当前工作区内的文件
- 搜索工作区文本
- 在审批后执行命令
- 在审批后预览并写入补丁
- 本地保存会话并在后续恢复

## 快速开始

前置要求：

- Node.js `>= 20`
- npm

安装依赖：

```bash
npm install
```

在项目根目录手动创建本地 `.env` 文件，然后填写必需配置：

```env
OPENAI_API_KEY="your-api-key"
OPENAI_MODEL="gpt-4.1-mini"
OPENAI_BASE_URL=""
```

启动 CLI：

```bash
npm run dev
```

启动后可输入 `/help` 查看可用命令。

## 配置

当前版本会在启动时自动读取项目根目录下的 `.env`。如果同名变量已经存在于 `process.env`，则仍以现有环境变量为准。

| 变量名 | 是否必填 | 默认值 | 作用 |
| --- | --- | --- | --- |
| `OPENAI_API_KEY` | 是 | 无 | OpenAI 或兼容中转站的 API Key |
| `OPENAI_MODEL` | 否 | `gpt-4.1-mini` | 启动时使用的模型名 |
| `OPENAI_BASE_URL` | 否 | 空 | OpenAI 兼容接口地址 |
| `COMMAND_TIMEOUT_MS` | 否 | `15000` | `run_command` 的超时时间，单位毫秒 |
| `MAX_COMMAND_OUTPUT` | 否 | `12000` | `run_command` 保留的最大输出长度 |

如果你更想临时在当前终端里设置变量，继续手动导出这些环境变量也可以。

## 中转站兼容性

你可以通过 `OPENAI_BASE_URL` 把 LiteAgent 指向 OpenAI 兼容中转站。

中转站至少需要支持：

- Chat Completions
- 工具调用或函数调用风格的请求
- `OPENAI_MODEL` 中传入的模型名称

如果中转站只支持 Responses API、不支持 Chat Completions，当前版本还不能直接接入。

## Slash 命令

| 命令 | 作用 |
| --- | --- |
| `/help` | 查看帮助 |
| `/status` | 查看当前工作目录和模型 |
| `/model` | 查看当前模型名 |
| `/sessions` | 查看本地已保存会话 |
| `/resume [sessionId|序号]` | 恢复最近会话、指定会话 ID 或按列表序号恢复 |
| `/new` | 开始新会话 |
| `/exit` | 退出 CLI |

## 内置工具

| 工具名 | 作用 |
| --- | --- |
| `list_files` | 列出工作区文件 |
| `grep_files` | 搜索工作区文本 |
| `read_file` | 读取工作区文件 |
| `run_command` | 在工作区执行命令 |
| `patch_file` | 预览 diff 并在批准后写入 |
| `ask_user` | 向用户继续补充确认问题 |

## 安全与审批

当前版本默认偏保守：

- 文件访问限制在当前工作区内
- `run_command` 默认需要审批，只有极少数命令可免审批
- `patch_file` 会先展示 unified diff
- 只有明确输入 `y` 才会真正写入文件

## 会话

会话默认保存到：

```text
.data/sessions/
```

你可以：

- 用 `/resume` 恢复最近会话
- 用 `/resume <sessionId>` 恢复指定会话
- 用 `/new` 开始一个新会话

## 当前限制

当前仓库仍然是 MVP：

- 目前只实现了 `openai` 提供方接入
- 当前使用 Chat Completions，而不是 Responses API
- `skills` 和 `MCP` 还只是扩展占位
- 搜索能力较基础，更适合小到中型仓库
- 还没有打包成独立可执行文件

## 适用场景

LiteAgent 更适合：

- 学习本地编码助手 CLI 的实现方式
- 研究工具调用与审批闭环
- 在一个紧凑的 TypeScript 运行时上继续扩展更多工具或提供方
