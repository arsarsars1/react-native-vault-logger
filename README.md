# react-native-vault-logger

A secure, encrypted local vault logger for React Native.

`react-native-vault-logger` captures uncaught JavaScript errors and lets you log handled exceptions manually. Logs are encrypted with AES-CBC before they are stored in AsyncStorage.

## Features

- Global handler for uncaught errors and fatal crashes
- Manual error logging with optional context
- Encrypted storage at rest (AES-CBC via `crypto-js`)
- In-memory read API with newest logs first
- Export encrypted payload for backend upload
- Configurable log retention limit

## Requirements

- React Native >= 0.70
- `@react-native-async-storage/async-storage` (peer dependency, installed automatically with this package)

## Installation

```bash
npm install react-native-vault-logger
# or
yarn add react-native-vault-logger
```

Install and link AsyncStorage if it is not already in your app:

```bash
npm install @react-native-async-storage/async-storage
cd ios && pod install
```

## Usage

### Initialization

Call `init` once at app startup (for example in `App.tsx` or your root entry file). Use a **32-character** key and **16-character** IV for AES-CBC.

```tsx
import { CrashLogService } from 'react-native-vault-logger';

await CrashLogService.init({
  encryptionKey: 'your-32-byte-secure-secret-key-12', // 32 characters
  encryptionIV: 'your-16-byte-iv1',                  // 16 characters
  maxLogCount: 1000,                                 // optional, default: 1000
});
```

After `init`, uncaught errors are routed through the global handler and stored with context `UNCAUGHT_ERROR` or `FATAL_CRASH`.

### Manual logging

```tsx
try {
  // your code
} catch (error) {
  await CrashLogService.logError(error, {
    context: 'PAYMENT_FLOW',
  });
}
```

### Reading logs

Returns decrypted logs, newest first:

```tsx
const logs = CrashLogService.getLogs();
```

Each entry matches `CrashLogModel`:

| Field        | Type   | Description                          |
| ------------ | ------ | ------------------------------------ |
| `timestamp`  | string | ISO-8601 time                        |
| `error`      | string | Error message                        |
| `stackTrace` | string | Stack trace when available           |
| `context`    | string | Source label (for example `FATAL_CRASH`) |
| `deviceInfo` | string | Device label (default placeholder)   |
| `appVersion` | string | App version (default placeholder)  |

### Export encrypted logs

```tsx
const encryptedData = await CrashLogService.exportEncryptedLogs();
// Send encryptedData to your backend over HTTPS
```

### Clear logs

```tsx
await CrashLogService.clearLogs();
```

## Example app

A bare React Native example lives in [`example/`](./example/). From that folder:

```bash
npm install
cd ios && pod install && cd ..
npm run ios
# or
npm run android
```

## Security

Do not hardcode production encryption keys in source. Prefer a secure keystore, environment configuration, or runtime secret delivery.

Logs are encrypted locally before being written to AsyncStorage. Decrypted logs are only available in memory through `getLogs()`.

## Publishing (maintainers)

```bash
npm run build
npm publish --access public
```

## License

MIT
