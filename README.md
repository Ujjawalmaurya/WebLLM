# Local Browser AI Chat (WebLLM)

A clean web application that runs large language models directly inside your web browser. Everything runs locally on your machine—no servers, no subscriptions, and your chats never leave your device.

---

## How It Works

This project uses **WebLLM** and your computer graphics hardware (**WebGPU**) to run AI models entirely offline once downloaded:
1. When you select a model, your browser downloads the model files and saves them to your browser's local cache.
2. Once downloaded, the model runs inside a background worker so your browser stays smooth and responsive.
3. Your messages and answers stream in real time word-by-word.

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Start local server
```bash
npm run dev
```

Visit the address shown in your terminal (usually `http://localhost:3000`).

---

## Browser Requirements

To run AI models locally in the browser, your browser must support **WebGPU**:
- **Google Chrome** (version 113 or newer)
- **Microsoft Edge** (version 113 or newer)
- **Brave Browser**
- **Firefox Nightly** (with WebGPU enabled in `about:config`)

*Note: Make sure "Hardware Acceleration" is enabled in your browser settings.*

---

## Available Models

You can pick different models depending on your machine speed and available memory:

| Model | Download Size | Best For |
| :--- | :--- | :--- |
| **SmolLM2 (135M)** | ~140 MB | Fast tests, older computers, low memory |
| **Qwen 2.5 (0.5B)** | ~350 MB | Quick answers, balanced speed (default) |
| **Llama 3.2 (1B)** | ~880 MB | High quality everyday chat |
| **Qwen 2.5 Coder (1.5B)** | ~1.1 GB | Coding questions and scripts |
| **Llama 3.2 (3B)** | ~2.0 GB | Detailed reasoning and smart answers |

---

## Features

- **Private & Local**: Zero data leaves your computer.
- **Real-Time Streaming**: Watch words appear as the model writes them.
- **Stop Button**: Cancel an answer at any time.
- **Speed Counter**: See generation speed in tokens per second.
- **Code Block Formatting**: Clean code snippets with a 1-click Copy button.
- **System Instructions**: Customise how the model behaves using the Prompt Settings drawer.
- **Console Test Logs**: Open your browser developer console (`F12` or `Ctrl+Shift+I`) to watch flow logs (`[WebLLM Test]`) as each action runs.

---

## Building for Production

To create an optimised bundle for deployment:
```bash
npm run build
```

The output files will be created in the `dist/` directory.
