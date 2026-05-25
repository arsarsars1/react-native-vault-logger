# react-native-vault-logger

A secure, encrypted local vault logger for React Native.

`react-native-vault-logger` automatically intercepts and logs crashes and uncaught errors, encrypting the logs before storing them locally using AsyncStorage. It ensures sensitive log data remains protected at rest, using AES-CBC encryption.

## Installation

```bash
npm install react-native-vault-logger
# or
yarn add react-native-vault-logger
```

### Dependencies

Make sure you have `@react-native-async-storage/async-storage` installed in your project, as it is used for local storage.

```bash
npm install @react-native-async-storage/async-storage
# For iOS, remember to install pods
cd ios && pod install
```

## Usage

### Initialization

Initialize the `CrashLogService` early in your app lifecycle (e.g., in `App.tsx` or `index.js`).

```tsx
import { CrashLogService } from 'react-native-vault-logger';

// Initialize with a secure 32-byte key and 16-byte IV for AES-CBC
CrashLogService.init({
  encryptionKey: 'your-32-byte-secure-secret-key-12', // 32 characters
  encryptionIV: 'your-16-byte-iv1',                  // 16 characters
  maxLogCount: 1000,                                 // Optional: max number of logs to retain (default: 1000)
});
```

### Manual Logging

You can manually log custom errors or exceptions using `logError`:

```tsx
try {
  // Your code here
} catch (error) {
  CrashLogService.logError(error, {
    context: 'PAYMENT_FLOW',
  });
}
```

### Retrieving Logs

Get the list of decrypted logs (latest first). Returns an array of `CrashLogModel`:

```tsx
const logs = CrashLogService.getLogs();
console.log(logs);
```

### Exporting Encrypted Logs

Export the logs in their raw encrypted format (string) for secure transmission to your backend:

```tsx
const encryptedData = await CrashLogService.exportEncryptedLogs();
// Send `encryptedData` to your server securely
```

### Clearing Logs

Clear all saved logs from local storage:

```tsx
await CrashLogService.clearLogs();
```

## Security

Logs are encrypted locally using AES-CBC from the `crypto-js` library before being written to `AsyncStorage`. Ensure you do not hardcode your encryption keys directly into your source code in production apps; instead, consider using a native secure keystore, environment variables, or retrieve them securely at runtime.

## License

MIT
