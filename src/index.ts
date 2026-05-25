import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';

export interface VaultLoggerConfig {
  encryptionKey: string;
  encryptionIV: string;
  maxLogCount?: number;
  fileExtension?: string; // Kept for compatibility, though we use AsyncStorage
}

export interface CrashLogModel {
  timestamp: string;
  error: string;
  stackTrace: string;
  context: string;
  deviceInfo: string;
  appVersion: string;
}

export class CrashLogService {
  private static STORAGE_KEY = '@vault_logger_logs';
  private static config: VaultLoggerConfig | null = null;
  private static logs: CrashLogModel[] = [];

  static async init(config: VaultLoggerConfig) {
    this.config = {
      maxLogCount: 1000,
      ...config,
    };
    await this.loadLogs();
    this.setupGlobalErrorHandler();
  }

  private static setupGlobalErrorHandler() {
    // @ts-ignore
    const defaultErrorHandler = ErrorUtils.getGlobalHandler();
    // @ts-ignore
    ErrorUtils.setGlobalHandler((error: any, isFatal: boolean) => {
      this.logError(error, { stackTrace: error?.stack || 'N/A', context: isFatal ? 'FATAL_CRASH' : 'UNCAUGHT_ERROR' });
      if (defaultErrorHandler) {
        defaultErrorHandler(error, isFatal);
      }
    });
  }

  private static encrypt(data: string): string {
    if (!this.config) return data;
    const key = CryptoJS.enc.Utf8.parse(this.config.encryptionKey);
    const iv = CryptoJS.enc.Utf8.parse(this.config.encryptionIV);
    return CryptoJS.AES.encrypt(data, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    }).toString();
  }

  private static decrypt(cipherText: string): string {
    if (!this.config) return cipherText;
    const key = CryptoJS.enc.Utf8.parse(this.config.encryptionKey);
    const iv = CryptoJS.enc.Utf8.parse(this.config.encryptionIV);
    const bytes = CryptoJS.AES.decrypt(cipherText, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  private static async loadLogs() {
    try {
      const encryptedData = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (encryptedData) {
        const decrypted = this.decrypt(encryptedData);
        if (decrypted) {
          this.logs = JSON.parse(decrypted);
        }
      }
    } catch (e) {
      console.warn('CrashLogService: Failed to load logs', e);
      this.logs = [];
    }
  }

  private static async saveLogs() {
    try {
      const max = this.config?.maxLogCount || 1000;
      if (this.logs.length > max) {
        this.logs = this.logs.slice(this.logs.length - max);
      }
      const data = JSON.stringify(this.logs);
      const encrypted = this.encrypt(data);
      await AsyncStorage.setItem(this.STORAGE_KEY, encrypted);
    } catch (e) {
      console.warn('CrashLogService: Failed to save logs', e);
    }
  }

  static async logError(error: any, options?: { stackTrace?: string; context?: string }) {
    if (!this.config) return;

    const newLog: CrashLogModel = {
      timestamp: new Date().toISOString(),
      error: error?.message || String(error),
      stackTrace: options?.stackTrace || error?.stack || 'N/A',
      context: options?.context || 'ERROR',
      deviceInfo: 'React Native Device', // Usually enriched by consumer app
      appVersion: 'Unknown',
    };

    this.logs.push(newLog);
    await this.saveLogs();
  }

  static getLogs(): CrashLogModel[] {
    // Return a reversed copy so newest is first
    return [...this.logs].reverse();
  }

  static async clearLogs() {
    this.logs = [];
    await AsyncStorage.removeItem(this.STORAGE_KEY);
  }

  static async exportEncryptedLogs(): Promise<string> {
    const data = JSON.stringify(this.logs);
    return this.encrypt(data);
  }
}
