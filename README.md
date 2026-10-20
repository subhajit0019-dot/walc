# Cursed Engine — Multi-Client EXE Management Panel

Enterprise-grade Vercel-hosted web admin panel and C++ client verification engine. Deploy customized executable configurations from a **single base binary**, complete with per-client branding, Discord Rich Presence, KeyAuth license integration, and an instant Ed25519 cryptographic remote killswitch.

---

## ⚡ Architecture Overview

```
                      +---------------------------------------+
                      |       Vercel Serverless / Edge        |
                      |  - Next.js 15 (App Router, React 19)  |
                      |  - Ed25519 Private Key Signer         |
                      |  - Neon Serverless Postgres (Drizzle) |
                      |  - Upstash Redis (Sliding Rate Limit) |
                      |  - Vercel Blob (Base EXE Storage)     |
                      +-------------------+-------------------+
                                          |
                        HTTPS POST /api/client/check
                   (Timestamp + Nonce Replay Protected)
                                          |
                                          v
                      +---------------------------------------+
                      |         C++ Client Executable         |
                      |  - DirectX 11 / ImGui Overlay         |
                      |  - WinHTTP TLS 1.3 Handshake          |
                      |  - Windows CNG Ed25519 Verify         |
                      |  - Fail-Closed Remote Killswitch      |
                      +---------------------------------------+
```

---

## 🚀 Quick Start & Setup

### 1. Install Dependencies
```bash
cd client-panel
npm install
```

### 2. Generate Cryptographic Ed25519 Keypair
Run the included key generator to generate your 64-character hex private and public keys:
```bash
npm run generate-keys
```
This prints:
- `ED25519_PRIVATE_KEY` (Paste into `.env.local` and Vercel Environment Variables)
- `ED25519_PUBLIC_KEY` (Paste into `.env.local` and in `ClientConfig.cpp` as `SERVER_PUBLIC_KEY_HEX`)

### 3. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in the following values:
| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon Serverless Postgres connection string with `sslmode=require` |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL (or leave blank for in-memory fallback during local testing) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST Token |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token (from Vercel Storage tab) |
| `AUTH_SECRET` | 32+ byte random hex string for signing JWT admin session tokens |
| `ADMIN_EMAIL` | Email used to log into the web admin panel |
| `ADMIN_PASSWORD_HASH` | Bcrypt hash of your admin password (generate via `node -e "console.log(require('bcryptjs').hashSync('YourPassword', 12))"`) |
| `ED25519_PRIVATE_KEY` | Hex private key from step 2 |
| `ED25519_PUBLIC_KEY` | Hex public key from step 2 |
| `DOWNLOAD_TOKEN_SECRET` | Secret key used to sign temporary 5-minute download links |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile Secret Key (optional for bot defense) |

### 4. Push Database Schema to Neon Postgres
```bash
npm run db:push
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) and log in with your admin credentials.

---

## ☁️ Vercel Deployment

1. Push your repository to GitHub / GitLab.
2. In Vercel, click **Add New Project** and select the repository.
3. In the project settings, set **Root Directory** to `client-panel` (if located in a subfolder).
4. Add all environment variables from your `.env.local` into **Settings → Environment Variables**.
5. Enable **Vercel Blob** in the Storage tab to generate `BLOB_READ_WRITE_TOKEN`.
6. Click **Deploy**.

---

## 🔒 Security & Bot Defense Standard

- **Zero Hardcoded Secrets in Client:** The C++ binary contains only its `client_id` and the server's public verification key. The Ed25519 private key never leaves Vercel server environment variables.
- **Fail-Closed Execution:** If the server is unreachable, the response timestamp is older than 60 seconds, the nonce was already consumed, or the signature fails verification, the C++ client immediately displays an alert and terminates.
- **Replay Protection:** Nonces are cached with a 120-second TTL in Redis (`SETNX`). Duplicate nonces are logged and rejected with HTTP 409.
- **Rate Limiting:**
  - `/api/auth/login`: 5 attempts / 15 min per IP.
  - `/api/client/check`: 30 requests / min per `client_id` + IP.
  - `/api/download/*`: 10 requests / min per IP.
- **Direct Stream Download:** Base EXE binaries are served with `Content-Disposition: attachment; filename="<client.exeName>"`, giving each customer their unique branded filename from a single uploaded master binary.

---

## 💻 C++ Client Integration

The C++ module is located in `cpp-client/ClientConfig.h` and `cpp-client/ClientConfig.cpp` (and also integrated into `CURSED ENGINE KERNAL INTERNAL/examples/example_win32_directx11/`).

### How to use in `main.cpp`:
Include the header:
```cpp
#include "ClientConfig.h"
```

In `WinMain`, execute the handshake right before initializing DirectX / ImGui:
```cpp
int APIENTRY WinMain(HINSTANCE, HINSTANCE, LPSTR, int)
{
    // Fetch and cryptographically verify runtime client configuration from Vercel panel
    ClientConfig clientConfig;
    if (!ClientRuntime::FetchAndVerifyConfig(ClientRuntime::CLIENT_ID, clientConfig))
    {
        return 0; // Terminate: killswitch is active or response is tampered
    }

    // All branding, KeyAuth keys, and Discord RPC are now live in CustomConfig::*
    ...
}
```

---

## 🧪 Verification & Test Plan

1. **Deploy New Client:**
   - Go to `/clients/new`.
   - Name: `VIP Client Alpha`, EXE Name: `Alpha_Loader.exe`.
   - Shiny Title: `ALPHA` + `.GG`.
   - Click **Deploy Client**. Copy the generated client UUID.
2. **Download Branded Binary:**
   - In the clients list or editor, click **Download Alpha_Loader.exe**.
   - Verify the browser downloads the file as `Alpha_Loader.exe`.
3. **Run C++ Client:**
   - Set `ClientRuntime::CLIENT_ID` in `ClientConfig.cpp` to the generated UUID.
   - Run the EXE.
   - Confirm the window title, header text, and Discord RPC match the panel settings.
4. **Trigger Remote Killswitch:**
   - In the web panel, toggle client status from **Active** to **Suspended**.
   - Relaunch the EXE.
   - Confirm the client immediately displays the custom maintenance popup dialog and exits without opening the cheat window.
5. **Re-activate Client:**
   - Toggle status back to **Active** in the panel.
   - Relaunch the EXE — verify it opens normally.
