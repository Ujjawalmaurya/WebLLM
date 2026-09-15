# Local Browser AI Chat (WebLLM)

A clean web application that runs Large Language Models locally inside your web browser. Everything runs on your machine using your graphics hardware (WebGPU)—no remote servers, no API keys, and your data never leaves your device.

---

## How It Works

1. **Pick a Model**: Choose from top-tier open models by Meta, Google, Microsoft, Alibaba, Mistral, Hugging Face, or AllenAI.
2. **Download & Cache**: The browser downloads the model files on first run and saves them to local storage. Subsequent chats load without re-downloading.
3. **Background Worker**: Model calculations run inside a separate thread (`worker.js`), so your browser stays smooth and responsive while text is generated.
4. **Real-Time Streaming**: Tokens stream word-by-word into the chat bubble.

---

## Available Frontier Models (Low Parameter & Fast)

All models are low-parameter variants optimized for smooth in-browser execution:

| Provider | Model | Approx. VRAM / Download | Best For |
| :--- | :--- | :--- | :--- |
| **Meta** | Llama 3.2 (1B) | ~880 MB | Balanced everyday conversation (default) |
| **Meta** | Llama 3.2 (3B) | ~2.2 GB | In-depth answers and higher quality |
| **Google** | Gemma 3 (1B) | ~710 MB | Lightweight general instruction following |
| **Google** | Gemma 2 (2B) | ~1.9 GB | High quality reasoning from Google DeepMind |
| **Alibaba** | Qwen 2.5 (0.5B) | ~350 MB | Ultra-fast responses on any device |
| **Alibaba** | Qwen 2.5 (1.5B) | ~1.6 GB | Versatile multilingual chat |
| **Alibaba** | Qwen 2.5 Coder (1.5B) | ~1.6 GB | Coding, debugging, and scripts |
| **Microsoft** | Phi 3.5 Mini (3.8B) | ~3.6 GB | Advanced logic and analytical tasks |
| **Mistral AI** | Ministral 3 (3B) | ~2.8 GB | Strong reasoning in a compact size |
| **Hugging Face** | SmolLM2 (360M) | ~370 MB | Minimal memory footprint |
| **Hugging Face** | SmolLM2 (1.7B) | ~1.7 GB | Solid small-footprint assistant |
| **AllenAI** | OLMo 2 (1B) | ~1.7 GB | Fully open data and weights |

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Start local development server
```bash
npm run dev
```

Open `http://localhost:3000` in a WebGPU-enabled browser.

---

## Browser Requirements

WebLLM requires **WebGPU** with hardware acceleration:
- **Google Chrome** (v113+)
- **Microsoft Edge** (v113+)
- **Brave Browser**
- **Firefox Nightly** (WebGPU enabled in `about:config`)

---

## Features

- **Top Open Providers**: Meta, Google, Microsoft, Alibaba, Mistral, Hugging Face, AllenAI.
- **Background Worker**: Heavy computations run off the main UI thread.
- **Stop Generation**: Cancel an in-flight reply at any time.
- **Live Speed Indicator**: Monitor tokens per second in real time.
- **Markdown Code Formatting**: Syntax-styled blocks with 1-click copy.
- **Custom Instructions**: Change the system prompt easily via Prompt Settings.
- **Console Test Logs**: All key lifecycle events are logged to the browser console (`[WebLLM]`) for flow inspection.

---

## Troubleshooting

### `Unable to find a compatible GPU`

**Full error:**
```
Unable to find a compatible GPU. This issue might be because your computer doesn't have a GPU,
or your system settings are not configured properly.
```

This means the browser can see the WebGPU API but can't get a usable GPU adapter. Common fixes:

#### 1. Enable WebGPU in Chrome flags
Go to `chrome://flags`, search for **WebGPU**, set it to **Enabled** (not "Default" — on some systems "Default" means disabled). Restart Chrome.

#### 2. Turn on hardware acceleration
Go to `chrome://settings/system` → enable **"Use hardware acceleration when available"**. Restart Chrome.

#### 3. Check GPU status
Go to `chrome://gpu` and look for the **WebGPU** row. If it says "Disabled" or "Software only", your GPU driver or browser config is the problem.

#### 4. Linux with NVIDIA
Launch Chrome with Vulkan and unsafe WebGPU flags:
```bash
google-chrome --enable-features=Vulkan --enable-unsafe-webgpu
```

For AMD/Intel on Linux, make sure Mesa drivers are up to date (`mesa 23.1+` recommended).

#### 5. Firefox
WebGPU is only available in **Firefox Nightly**. Go to `about:config`, search for `dom.webgpu.enabled`, and set it to `true`.

#### 6. Verify WebGPU works
Open [webgpureport.org](https://webgpureport.org/) in the same browser. If that page can't detect a GPU adapter, the issue is your browser/driver setup, not this app.

