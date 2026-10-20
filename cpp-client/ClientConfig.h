#pragma once
#include <windows.h>
#include <string>

// ==============================================================================
// CURSED ENGINE - MULTI-CLIENT RUNTIME CONFIG & CRYPTOGRAPHIC VERIFIER
// ==============================================================================

struct ClientRpcConfig {
    bool enabled;
    std::string appId;
    std::string state;
    std::string details;
    std::string largeImage;
    std::string largeText;
    std::string smallImage;
    std::string smallText;
    std::string b1Label;
    std::string b1Url;
    std::string b2Label;
    std::string b2Url;
};

struct ClientConfig {
    std::string cheatName;
    std::string titlePart1;
    std::string titlePart2;
    std::wstring windowTitle;
    std::string subtitle;
    std::string loadingText;
    std::string discordInviteUrl;

    ClientRpcConfig rpc;

    // LicenseAuth / KeyAuth
    bool enableAuth;
    std::string authName;
    std::string authOwnerId;
    std::string authSecret;
    std::string authVersion;
    std::string authUrl;
    std::string authPath;

    // Remote Killswitch
    bool enableMaintenanceCheck;
    std::string maintenanceTitle;
    std::string maintenanceText;
};

namespace ClientRuntime
{
    // Global active runtime config instance
    extern ClientConfig g_Config;

    // Embedded Unique Client UUID (Injected by builder or assigned per customer build)
    extern const char* CLIENT_ID;

    // Server API Base URL (e.g. "https://your-cursed-panel.vercel.app")
    extern const wchar_t* SERVER_HOST;
    extern const wchar_t* SERVER_CHECK_PATH;

    // Server Ed25519 Public Verification Key (32 bytes hex encoded)
    // Matches ED25519_PUBLIC_KEY in Vercel .env
    extern const char* SERVER_PUBLIC_KEY_HEX;

    /**
     * Connects over HTTPS via WinHTTP to the Vercel panel /api/client/check endpoint.
     * Transmits timestamp + random cryptographic nonce.
     * Verifies server's Ed25519 digital signature.
     * If suspended or revoked, displays maintenance popup and returns false (terminating the EXE).
     * If active and signature valid, populates ClientConfig & CustomConfig and returns true.
     */
    bool FetchAndVerifyConfig(const std::string& clientId, ClientConfig& out);

    /**
     * Synchronizes and applies the fetched ClientConfig into the legacy CustomConfig namespace.
     */
    void ApplyToCustomConfig(const ClientConfig& cfg);
}
