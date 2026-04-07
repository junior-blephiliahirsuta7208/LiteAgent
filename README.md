# LiteAgent

LiteAgent is a lightweight CLI AI coding assistant for local development workflows. For Chinese documentation, see [README.zh-CN.md](./README.zh-CN.md).

## Overview

- chat with an OpenAI-compatible model in the terminal
- inspect files inside the current workspace
- search text across the workspace
- run shell commands with approval
- preview diffs before writing files
- save sessions locally and resume them later

## Quick Start

Requirements:

- Node.js `>= 20`
- npm

Install dependencies:

```bash
npm install
```

Create a local `.env` file in the project root, then fill in the required values:

```env
OPENAI_API_KEY="your-api-key"
OPENAI_MODEL="gpt-4.1-mini"
OPENAI_BASE_URL=""
```

Start the CLI:

```bash
npm run dev
```

Then use `/help` to see the available commands.

## Configuration

The current runtime loads `.env` from the project root at startup. If the same variable already exists in `process.env`, the existing value wins.

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `OPENAI_API_KEY` | Yes | None | API key for OpenAI or an OpenAI-compatible relay |
| `OPENAI_MODEL` | No | `gpt-4.1-mini` | Model name used at startup |
| `OPENAI_BASE_URL` | No | Empty | Base URL for an OpenAI-compatible endpoint |
| `COMMAND_TIMEOUT_MS` | No | `15000` | Timeout for `run_command`, in milliseconds |
| `MAX_COMMAND_OUTPUT` | No | `12000` | Maximum preserved command output length |

If you prefer temporary shell-only configuration, exporting the same variables manually still works.

## Relay Compatibility

You can point LiteAgent to an OpenAI-compatible relay by setting `OPENAI_BASE_URL`.

Your relay should support:

- Chat Completions
- tool calling or function-calling style payloads
- the model name passed through `OPENAI_MODEL`

If your relay only supports the Responses API and not Chat Completions, the current version will not work with it yet.

## Slash Commands

| Command | Purpose |
| --- | --- |
| `/help` | Show command help |
| `/status` | Show current working directory and model |
| `/model` | Show the active model name |
| `/sessions` | List local saved sessions |
| `/resume [sessionId|index]` | Resume the latest session, a specific session ID, or a session by list index |
| `/new` | Start a new session |
| `/exit` | Exit the CLI |

## Built-in Tools

| Tool | Purpose |
| --- | --- |
| `list_files` | List files in the workspace |
| `grep_files` | Search text in the workspace |
| `read_file` | Read a workspace file |
| `run_command` | Execute a command in the workspace |
| `patch_file` | Preview a diff and write after approval |
| `ask_user` | Ask the user a follow-up question |

## Safety

The current version is intentionally conservative:

- file access stays inside the current workspace
- `run_command` is approval-gated except for a very small allowlist
- `patch_file` shows a unified diff before writing
- only explicit `y` approval allows a write

## Sessions

Sessions are stored locally under:

```text
.data/sessions/
```

You can:

- continue the latest session with `/resume`
- continue a specific session with `/resume <sessionId>`
- start a fresh session with `/new`

## Limitations

This repository is still an MVP:

- only the `openai` provider is implemented
- Chat Completions is used instead of the Responses API
- `skills` and `MCP` are extension stubs only
- search is simple and better suited to small or medium repositories
- the project is not packaged as a standalone binary yet

## Good Fit

LiteAgent is a good fit if you want to:

- learn how a local coding assistant CLI can be structured
- study a small tool-calling and approval loop
- extend a compact TypeScript runtime with more tools or providers
