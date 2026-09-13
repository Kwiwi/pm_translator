## "Kimi Translator" is now "PM Translator"!

(copyright issues...)

*this page was polished by Kimi

<details>
<summary>中文版</summary>

一个简洁的在线翻译与表达指导工具，基于 Moonshot API + xAI Grok API + Cloudflare Pages 实现。

核心思路是：你可以直接写提示词，要求模型怎么翻译，或者把你的文本润色成什么风格。

~~虽然说和自己打开 Kimi/Grok app 问没多大区别~~

---

### 功能

- **多语翻译**：支持任意语言互译。目标语言会根据界面语言预填：中文界面默认译为英文，英文界面默认译为中文；也可以自行改为日语、法语等其他语言。
- **表达指导**：根据你描述的表达效果润色文本，同时尽量保留原意与风格；点击"只查语法"可切换为最小改动的语法检查模式。
- **语气档位**：预设有五种语气（随意 I / 随意 II / 自然 / 正式 I / 正式 II），每个档位的提示词都可以直接编辑。
- **使用场景**：补充上下文（如"发给导师的邮件""安慰朋友的消息"），让翻译更贴合情境。
- **"X vibe" 模式**：在 Casual II 档位下，点击"想要 X 味翻译？看这里！"会调用 Grok 模型，输出更地道、更有网络感的 casual 翻译。

另外还支持双语界面、夜间模式、响应式布局、流式输出、Ctrl+Enter 快捷提交、自定义 Kimi 模型名等。

---

```
09/13/2026 更新：v2.4
1. 使用了更详细的报错
2. 新增 BYOK：支持自定义 Moonshot API Key 和模型
3. 将「语法纠错」改为「表达指导」
```

</details>

---

Two main features: multilingual translation and expression guidance.

Built using Moonshot API, xAI Grok API, and Cloudflare Pages.

The key idea is that you can write prompts to specify exactly how you want things translated or how you want your text polished.

~~Though it's not that different from just opening the Kimi/Grok app and asking~~

---

### Features

- **Translation**: Supports any-language translation. The target language is prefilled based on UI language: Chinese UI defaults to English, English UI defaults to Chinese. You can also change it to Japanese, French, etc.
- **Expression Guide**: Polishes your text according to the expression effect you describe, while preserving the original meaning and style. Click "Check grammar only" to switch to a minimal grammar-checking mode.
- **Tone Presets**: Five editable tones (Casual I / Casual II / Natural / Formal I / Formal II).
- **Usage Scenario**: Add context (e.g. "email to supervisor", "comforting a friend") for more accurate translations.
- **"X vibe" Mode**: On Casual II, click "want that X vibe?" to switch to Grok for a more authentic, internet-style casual translation.

Also includes bilingual UI, dark mode, responsive design, streaming output, Ctrl+Enter quick submit, and a customizable Kimi model name in settings.

---

```
September 13th, 2026 Update: v2.4
1. More detailed error messages
2. Added BYOK: support for custom Moonshot API Key and model
3. Renamed Grammar Correction to Expression Guide
```

---

Latest UI demo (no API hooked up, just the interface): https://demo.translator-5ry.pages.dev/translator

---

### License

MIT License
MIT 协议

---

### Credits / 鸣谢

- [Moonshot AI](https://www.moonshot.cn) (Kimi K2.6) — Translation & expression engine
- [xAI](https://x.ai) (Grok) — "X vibe" casual translation engine
- GPT-5.5 / GPT-5.6 Luna — System prompts & design philosophy
- User — Design philosophy & UI design

---

<details>
<summary>Deployment Guide / 部署指南</summary>

`Kimi 写的——我懒得改了`
`A deployment guide by Kimi, written specifically for beginners`

## 技术栈 / Tech Stack

| 层级 / Layer | 技术 / Technology |
|:---:|:---:|
| 前端 / Frontend | Vanilla HTML + CSS + JS |
| 后端 / Backend | Cloudflare Pages `_worker.js` |
| AI 接口 / AI API | Moonshot Kimi API (`kimi-k2.6`) + xAI Grok API |

## 部署 / Deployment

### 1. 准备文件 / Prepare Files

```
your-project/
├── _worker.js        # 后端 API 代理 / Backend API proxy
├── translator.html   # 前端界面 / Frontend interface
├── i18n.js           # 国际化 / i18n
├── style.css         # 样式 / Styles
├── index.html        # 现有主页（可选）/ Your existing homepage (optional)
├── loading2.svg      # Grok 模式的等待动画 / Loading animation for Grok mode
└── thinking.svg      # 普通等待动画 / Normal loading animation
```

### 2. 上传到 Cloudflare Pages / Upload to Cloudflare Pages

1. 打开 [Cloudflare Dashboard](https://dash.cloudflare.com) → Pages → Create a project
2. **上传文件** / **Upload your files**（拖拽上传 / drag & drop）
3. 点击部署 / Deploy

### 3. 设置环境变量 / Set Environment Variables

Pages Project → Settings → Environment variables:

| 变量 / Variable | 值 / Value |
|:---:|:---:|
| `KIMI_API_KEY` | 你的 Moonshot API 密钥，以 `sk-` 开头 / Your Moonshot API key (starts with `sk-`) |
| `GROK_API_KEY` | 你的 xAI API 密钥 / Your xAI API key |

### 4. 设置兼容性日期 / Set Compatibility Date

Pages Project → Settings → Functions → Compatibility date:

- 生产环境 / Production: `2026-05-14`（或最新可用日期 / or latest available）

保存后重新部署 / Save and redeploy.

### 5. 访问 / Visit

```
https://your-project.pages.dev/translator.html
```

</details>
