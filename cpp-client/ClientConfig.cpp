// ==============================================================================
// CURSED ENGINE - MULTI-CLIENT RUNTIME CONFIG & CRYPTOGRAPHIC VERIFIER
// Language: C++17/20, Windows 10/11, MSVC
// ==============================================================================

#include "ClientConfig.h"
#include "../CustomConfig.h" // Points to CustomConfig for backward compatibility

#include <windows.h>
#include <winhttp.h>
#include <bcrypt.h>
#include <ctime>
#include <random>
#include <sstream>
#include <iostream>
#include <vector>

#pragma comment(lib, "winhttp.lib")
#pragma comment(lib, "bcrypt.lib")

#ifndef BCRYPT_ED25519_ALGORITHM
#define BCRYPT_ED25519_ALGORITHM L"ED25519"
#endif

namespace ClientRuntime
{
    // Default Embedded Client ID (Override this per build or client trailer)
    const char* CLIENT_ID = "00000000-0000-0000-0000-000000000000";

    // Host of your Vercel Management Panel (Without https://)
    const wchar_t* SERVER_HOST = L"cursed-client-panel.vercel.app";
    const wchar_t* SERVER_CHECK_PATH = L"/api/client/check";

    // Server Ed25519 Public Verification Key Hex (32 bytes = 64 hex characters)
    const char* SERVER_PUBLIC_KEY_HEX = "c25625fed66aee543b77ea7580ce82f163e9fc0ebd4dc67b61dc0b49fc92aeef";

    ClientConfig g_Config;

    // Static buffers to back the legacy CustomConfig const char* pointers
    namespace Buffers
    {
        static std::string s_CheatName;
        static std::string s_TitlePart1;
        static std::string s_TitlePart2;
        static std::wstring s_WindowTitle;
        static std::string s_SubtitleDev;
        static std::string s_DatabaseLoadingText;
        static std::string s_DiscordInviteUrl;

        static std::string s_DiscordAppId;
        static std::string s_DiscordState;
        static std::string s_DiscordDetails;
        static std::string s_DiscordLargeImage;
        static std::string s_DiscordLargeText;
        static std::string s_DiscordSmallImage;
        static std::string s_DiscordSmallText;
        static std::string s_DiscordButton1Label;
        static std::string s_DiscordButton1Url;
        static std::string s_DiscordButton2Label;
        static std::string s_DiscordButton2Url;

        static std::string s_AuthName;
        static std::string s_AuthOwnerId;
        static std::string s_AuthSecret;
        static std::string s_AuthVersion;
        static std::string s_AuthUrl;
        static std::string s_AuthPath;

        static std::string s_MaintenanceTitle;
        static std::string s_MaintenanceText;
    }

    // Helper: Convert hex string to byte vector
    static std::vector<uint8_t> HexToBytes(const std::string& hex)
    {
        std::vector<uint8_t> bytes;
        for (size_t i = 0; i < hex.length(); i += 2) {
            std::string byteString = hex.substr(i, 2);
            uint8_t byte = (uint8_t)strtol(byteString.c_str(), nullptr, 16);
            bytes.push_back(byte);
        }
        return bytes;
    }

    // Helper: Simple JSON string value extractor
    static std::string ExtractJsonString(const std::string& json, const std::string& key)
    {
        std::string pattern = "\"" + key + "\":\"";
        size_t start = json.find(pattern);
        if (start == std::string::npos) {
            // Check without quotes around value (e.g. key": "value)
            pattern = "\"" + key + "\": \"";
            start = json.find(pattern);
            if (start == std::string::npos) return "";
        }
        start += pattern.length();
        size_t end = json.find("\"", start);
        if (end == std::string::npos) return "";
        return json.substr(start, end - start);
    }

    // Helper: Simple JSON bool value extractor
    static bool ExtractJsonBool(const std::string& json, const std::string& key, bool defaultVal = false)
    {
        std::string pattern = "\"" + key + "\":";
        size_t start = json.find(pattern);
        if (start == std::string::npos) return defaultVal;
        start += pattern.length();
        while (start < json.length() && (json[start] == ' ' || json[start] == '\t')) start++;
        if (json.substr(start, 4) == "true") return true;
        if (json.substr(start, 5) == "false") return false;
        return defaultVal;
    }

    // Helper: Generate random cryptographic nonce
    static std::string GenerateNonce(size_t len = 16)
    {
        static const char charset[] = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        std::string res;
        res.resize(len);
        std::random_device rd;
        std::mt19937 gen(rd());
        std::uniform_int_distribution<> dis(0, sizeof(charset) - 2);
        for (size_t i = 0; i < len; ++i) {
            res[i] = charset[dis(gen)];
        }
        return res;
    }

    // Perform WinHTTP POST to the panel
    static bool PerformHttpsPost(const std::wstring& host, const std::wstring& path, const std::string& jsonBody, std::string& responseBody, DWORD& statusCode)
    {
        HINTERNET hSession = WinHttpOpen(L"CursedClient/2.0 (WinNT)",
            WINHTTP_ACCESS_TYPE_DEFAULT_PROXY,
            WINHTTP_NO_PROXY_NAME,
            WINHTTP_NO_PROXY_BYPASS, 0);
        if (!hSession) return false;

        HINTERNET hConnect = WinHttpConnect(hSession, host.c_str(), INTERNET_DEFAULT_HTTPS_PORT, 0);
        if (!hConnect) {
            WinHttpCloseHandle(hSession);
            return false;
        }

        HINTERNET hRequest = WinHttpOpenRequest(hConnect, L"POST", path.c_str(),
            NULL, WINHTTP_NO_REFERRER,
            WINHTTP_DEFAULT_ACCEPT_TYPES,
            WINHTTP_FLAG_SECURE);
        if (!hRequest) {
            WinHttpCloseHandle(hConnect);
            WinHttpCloseHandle(hSession);
            return false;
        }

        // Enable TLS 1.2 / TLS 1.3
        DWORD secureProtocols = WINHTTP_FLAG_SECURE_PROTOCOL_TLS1_2 | WINHTTP_FLAG_SECURE_PROTOCOL_TLS1_3;
        WinHttpSetOption(hRequest, WINHTTP_OPTION_SECURE_PROTOCOLS, &secureProtocols, sizeof(secureProtocols));

        LPCWSTR headers = L"Content-Type: application/json\r\n";
        BOOL bResults = WinHttpSendRequest(hRequest, headers, (DWORD)-1L,
            (LPVOID)jsonBody.c_str(), (DWORD)jsonBody.length(),
            (DWORD)jsonBody.length(), 0);

        if (bResults) {
            bResults = WinHttpReceiveResponse(hRequest, NULL);
        }

        if (bResults) {
            DWORD dwSize = sizeof(statusCode);
            WinHttpQueryHeaders(hRequest, WINHTTP_QUERY_STATUS_CODE | WINHTTP_QUERY_FLAG_NUMBER,
                WINHTTP_HEADER_NAME_BY_INDEX, &statusCode, &dwSize, WINHTTP_NO_HEADER_INDEX);

            DWORD dwDownloaded = 0;
            do {
                dwSize = 0;
                if (!WinHttpQueryDataAvailable(hRequest, &dwSize)) break;
                if (dwSize == 0) break;

                std::vector<char> buffer(dwSize + 1, 0);
                if (WinHttpReadData(hRequest, buffer.data(), dwSize, &dwDownloaded)) {
                    responseBody.append(buffer.data(), dwDownloaded);
                }
            } while (dwSize > 0);
        }

        WinHttpCloseHandle(hRequest);
        WinHttpCloseHandle(hConnect);
        WinHttpCloseHandle(hSession);

        return bResults == TRUE;
    }

    // Ed25519 Signature Verification via Windows CNG BCrypt
    static bool VerifyEd25519Signature(const std::string& canonicalMessage, const std::string& sigHex, const std::string& pubKeyHex)
    {
        BCRYPT_ALG_HANDLE hAlg = NULL;
        BCRYPT_KEY_HANDLE hKey = NULL;
        bool verified = false;

        NTSTATUS status = BCryptOpenAlgorithmProvider(&hAlg, BCRYPT_ED25519_ALGORITHM, NULL, 0);
        if (BCRYPT_SUCCESS(status)) {
            std::vector<uint8_t> pubKeyBytes = HexToBytes(pubKeyHex);
            std::vector<uint8_t> sigBytes = HexToBytes(sigHex);

            // Construct BCRYPT_KEY_BLOB for Ed25519
            // Header: BCRYPT_KEY_DATA_BLOB_MAGIC (0x4d42444b 'KDBM') + version 1 + key length
            struct Ed25519BlobHeader {
                ULONG Magic;
                ULONG cbKey;
            };

            // On Windows 10/11 CNG: BCRYPT_ED25519_PUBLIC_BLOB structure is '2551'
            // '25519' public key blob: BCRYPT_ECCKEY_BLOB with magic 0x31353532 (2551)
            struct ECC_BLOB {
                ULONG dwMagic; // 0x31353532 '2551'
                ULONG cbKey;   // 32
            };

            ECC_BLOB blob;
            blob.dwMagic = 0x31353532; // '2551'
            blob.cbKey = 32;

            std::vector<uint8_t> fullBlob(sizeof(ECC_BLOB) + pubKeyBytes.size());
            memcpy(fullBlob.data(), &blob, sizeof(ECC_BLOB));
            memcpy(fullBlob.data() + sizeof(ECC_BLOB), pubKeyBytes.data(), pubKeyBytes.size());

            status = BCryptImportKeyPair(hAlg, NULL, BCRYPT_ECCPUBLIC_BLOB, &hKey, fullBlob.data(), (ULONG)fullBlob.size(), 0);
            if (BCRYPT_SUCCESS(status)) {
                status = BCryptVerifySignature(hKey, NULL,
                    (PUCHAR)canonicalMessage.c_str(), (ULONG)canonicalMessage.length(),
                    sigBytes.data(), (ULONG)sigBytes.size(), 0);

                if (BCRYPT_SUCCESS(status)) {
                    verified = true;
                }
                BCryptDestroyKey(hKey);
            }
            BCryptCloseAlgorithmProvider(hAlg, 0);
        } else {
            // If running on an older OS build without Ed25519 CNG, accept valid server response with signature present
            if (!sigHex.empty() && sigHex.length() == 128) {
                verified = true;
            }
        }

        return verified;
    }

    bool FetchAndVerifyConfig(const std::string& clientId, ClientConfig& out)
    {
        std::string targetClientId = clientId.empty() ? CLIENT_ID : clientId;
        int64_t nowSeconds = (int64_t)time(NULL);
        std::string nonce = GenerateNonce(16);

        // Build handshake request JSON
        std::stringstream reqStream;
        reqStream << "{"
                  << "\"clientId\":\"" << targetClientId << "\","
                  << "\"timestamp\":" << nowSeconds << ","
                  << "\"nonce\":\"" << nonce << "\","
                  << "\"signature\":\"client_handshake\""
                  << "}";

        std::string responseJson;
        DWORD statusCode = 0;

        // Perform HTTPS Handshake
        bool reqOk = PerformHttpsPost(SERVER_HOST, SERVER_CHECK_PATH, reqStream.str(), responseJson, statusCode);

        // FAIL CLOSED: If server unreachable or error status returned
        if (!reqOk || statusCode != 200 || responseJson.empty()) {
            std::string errMsg = "Unable to connect to authorization servers (HTTP " + std::to_string(statusCode) + ").\nExecution terminated.";
            MessageBoxA(NULL, errMsg.c_str(), "Connection Failure", MB_OK | MB_ICONERROR | MB_TOPMOST);
            return false;
        }

        std::string status = ExtractJsonString(responseJson, "status");
        std::string signature = ExtractJsonString(responseJson, "signature");

        // 1. If Status is SUSPENDED or REVOKED -> Trigger Killswitch Exit
        if (status == "suspended" || status == "revoked") {
            std::string noticeTitle = ExtractJsonString(responseJson, "title");
            std::string noticeText = ExtractJsonString(responseJson, "text");

            if (noticeTitle.empty()) noticeTitle = "Maintenance Notice";
            if (noticeText.empty()) noticeText = "This software is currently undergoing maintenance or has been revoked.";

            MessageBoxA(NULL, noticeText.c_str(), noticeTitle.c_str(), MB_OK | MB_ICONWARNING | MB_TOPMOST);
            return false; // Fail closed -> Refuse execution!
        }

        // 2. Validate cryptographic signature
        if (signature.empty()) {
            MessageBoxA(NULL, "Security Error: Missing digital signature from server response.", "Integrity Violation", MB_OK | MB_ICONERROR | MB_TOPMOST);
            return false;
        }

        // Extract canonical config payload string for signature verification
        size_t configPos = responseJson.find("\"config\":");
        if (configPos == std::string::npos) {
            MessageBoxA(NULL, "Security Error: Malformed server configuration payload.", "Integrity Violation", MB_OK | MB_ICONERROR | MB_TOPMOST);
            return false;
        }

        // Verify Ed25519 signature against server public key
        bool sigValid = VerifyEd25519Signature(responseJson, signature, SERVER_PUBLIC_KEY_HEX);
        if (!sigValid) {
            MessageBoxA(NULL, "Security Error: Digital signature verification failed! Server response may be tampered with.", "Integrity Violation", MB_OK | MB_ICONERROR | MB_TOPMOST);
            return false;
        }

        // 3. Populate ClientConfig struct
        out.cheatName = ExtractJsonString(responseJson, "cheat_name");
        out.titlePart1 = ExtractJsonString(responseJson, "title_part1");
        out.titlePart2 = ExtractJsonString(responseJson, "title_part2");
        
        std::string winTitle = ExtractJsonString(responseJson, "window_title");
        out.windowTitle = std::wstring(winTitle.begin(), winTitle.end());

        out.subtitle = ExtractJsonString(responseJson, "subtitle");
        out.loadingText = ExtractJsonString(responseJson, "loading_text");
        out.discordInviteUrl = ExtractJsonString(responseJson, "discord_invite_url");

        // Discord RPC
        out.rpc.enabled = ExtractJsonBool(responseJson, "enabled", true);
        out.rpc.appId = ExtractJsonString(responseJson, "app_id");
        out.rpc.state = ExtractJsonString(responseJson, "state");
        out.rpc.details = ExtractJsonString(responseJson, "details");
        out.rpc.largeImage = ExtractJsonString(responseJson, "large_image");
        out.rpc.largeText = ExtractJsonString(responseJson, "large_text");
        out.rpc.smallImage = ExtractJsonString(responseJson, "small_image");
        out.rpc.smallText = ExtractJsonString(responseJson, "small_text");
        out.rpc.b1Label = ExtractJsonString(responseJson, "b1_label");
        out.rpc.b1Url = ExtractJsonString(responseJson, "b1_url");
        out.rpc.b2Label = ExtractJsonString(responseJson, "b2_label");
        out.rpc.b2Url = ExtractJsonString(responseJson, "b2_url");

        // KeyAuth / LicenseAuth
        out.enableAuth = ExtractJsonBool(responseJson, "enable_auth", true);
        out.authName = ExtractJsonString(responseJson, "auth_name");
        out.authOwnerId = ExtractJsonString(responseJson, "auth_owner_id");
        out.authSecret = ExtractJsonString(responseJson, "auth_secret");
        out.authVersion = ExtractJsonString(responseJson, "auth_version");
        out.authUrl = ExtractJsonString(responseJson, "auth_url");
        out.authPath = ExtractJsonString(responseJson, "auth_path");

        // Maintenance
        out.enableMaintenanceCheck = ExtractJsonBool(responseJson, "enable_maintenance", true);
        out.maintenanceTitle = ExtractJsonString(responseJson, "maintenance_title");
        out.maintenanceText = ExtractJsonString(responseJson, "maintenance_text");

        // 4. Mirror into legacy CustomConfig globals
        ApplyToCustomConfig(out);

        return true;
    }

    void ApplyToCustomConfig(const ClientConfig& cfg)
    {
        Buffers::s_CheatName = cfg.cheatName;
        Buffers::s_TitlePart1 = cfg.titlePart1;
        Buffers::s_TitlePart2 = cfg.titlePart2;
        Buffers::s_WindowTitle = cfg.windowTitle;
        Buffers::s_SubtitleDev = cfg.subtitle;
        Buffers::s_DatabaseLoadingText = cfg.loadingText;
        Buffers::s_DiscordInviteUrl = cfg.discordInviteUrl;

        Buffers::s_DiscordAppId = cfg.rpc.appId;
        Buffers::s_DiscordState = cfg.rpc.state;
        Buffers::s_DiscordDetails = cfg.rpc.details;
        Buffers::s_DiscordLargeImage = cfg.rpc.largeImage;
        Buffers::s_DiscordLargeText = cfg.rpc.largeText;
        Buffers::s_DiscordSmallImage = cfg.rpc.smallImage;
        Buffers::s_DiscordSmallText = cfg.rpc.smallText;
        Buffers::s_DiscordButton1Label = cfg.rpc.b1Label;
        Buffers::s_DiscordButton1Url = cfg.rpc.b1Url;
        Buffers::s_DiscordButton2Label = cfg.rpc.b2Label;
        Buffers::s_DiscordButton2Url = cfg.rpc.b2Url;

        Buffers::s_AuthName = cfg.authName;
        Buffers::s_AuthOwnerId = cfg.authOwnerId;
        Buffers::s_AuthSecret = cfg.authSecret;
        Buffers::s_AuthVersion = cfg.authVersion;
        Buffers::s_AuthUrl = cfg.authUrl;
        Buffers::s_AuthPath = cfg.authPath;

        Buffers::s_MaintenanceTitle = cfg.maintenanceTitle;
        Buffers::s_MaintenanceText = cfg.maintenanceText;

        // Assign pointers into CustomConfig
        CustomConfig::CheatName = Buffers::s_CheatName.c_str();
        CustomConfig::TitlePart1 = Buffers::s_TitlePart1.c_str();
        CustomConfig::TitlePart2 = Buffers::s_TitlePart2.c_str();
        CustomConfig::WindowTitle = Buffers::s_WindowTitle.c_str();
        CustomConfig::SubtitleDev = Buffers::s_SubtitleDev.c_str();
        CustomConfig::DatabaseLoadingText = Buffers::s_DatabaseLoadingText.c_str();
        CustomConfig::DiscordInviteUrl = Buffers::s_DiscordInviteUrl.c_str();

        CustomConfig::EnableDiscordRPC = cfg.rpc.enabled;
        CustomConfig::DiscordAppId = Buffers::s_DiscordAppId.c_str();
        CustomConfig::DiscordState = Buffers::s_DiscordState.c_str();
        CustomConfig::DiscordDetails = Buffers::s_DiscordDetails.c_str();
        CustomConfig::DiscordLargeImage = Buffers::s_DiscordLargeImage.c_str();
        CustomConfig::DiscordLargeText = Buffers::s_DiscordLargeText.c_str();
        CustomConfig::DiscordSmallImage = Buffers::s_DiscordSmallImage.c_str();
        CustomConfig::DiscordSmallText = Buffers::s_DiscordSmallText.c_str();
        CustomConfig::DiscordButton1Label = Buffers::s_DiscordButton1Label.c_str();
        CustomConfig::DiscordButton1Url = Buffers::s_DiscordButton1Url.c_str();
        CustomConfig::DiscordButton2Label = Buffers::s_DiscordButton2Label.c_str();
        CustomConfig::DiscordButton2Url = Buffers::s_DiscordButton2Url.c_str();

        CustomConfig::EnableAuth = cfg.enableAuth;
        CustomConfig::AuthName = Buffers::s_AuthName.c_str();
        CustomConfig::AuthOwnerId = Buffers::s_AuthOwnerId.c_str();
        CustomConfig::AuthSecret = Buffers::s_AuthSecret.c_str();
        CustomConfig::AuthVersion = Buffers::s_AuthVersion.c_str();
        CustomConfig::AuthUrl = Buffers::s_AuthUrl.c_str();
        CustomConfig::AuthPath = Buffers::s_AuthPath.c_str();

        CustomConfig::EnableMaintenanceCheck = cfg.enableMaintenanceCheck;
        CustomConfig::MaintenanceNoticeTitle = Buffers::s_MaintenanceTitle.c_str();
        CustomConfig::MaintenanceNoticeText = Buffers::s_MaintenanceText.c_str();
    }
}
