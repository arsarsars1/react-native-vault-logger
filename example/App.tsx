import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, Button, View, ScrollView } from 'react-native';
import { CrashLogService, CrashLogModel } from 'react-native-vault-logger';

const ENCRYPTION_KEY = 'my-secret-key-123'; // Must be 16, 24, or 32 bytes for AES
const ENCRYPTION_IV = 'my-secret-iv-456';  // Must be 16 bytes for AES

export default function App() {
  const [logs, setLogs] = useState<CrashLogModel[]>([]);
  const [exportedLogs, setExportedLogs] = useState<string>('');

  useEffect(() => {
    // 1. Initialize the logger when your app starts
    const initLogger = async () => {
      await CrashLogService.init({
        encryptionKey: ENCRYPTION_KEY,
        encryptionIV: ENCRYPTION_IV,
        maxLogCount: 500, // Optional: defaults to 1000
      });
      refreshLogs();
    };
    
    initLogger();
  }, []);

  const refreshLogs = () => {
    // 2. Retrieve all stored logs
    const currentLogs = CrashLogService.getLogs();
    setLogs(currentLogs);
  };

  const simulateError = async () => {
    try {
      // Intentionally throwing an error
      throw new Error("Simulated network request failed!");
    } catch (error) {
      // 3. Manually logging caught errors
      await CrashLogService.logError(error, { 
        context: 'SIMULATED_ERROR_CONTEXT',
      });
      refreshLogs();
    }
  };

  const simulateCrash = () => {
    // Uncaught errors will be handled by the global error handler automatically (setup during init)
    throw new Error("This is a fatal crash!");
  };

  const exportLogs = async () => {
    // 4. Export logs as an encrypted string to safely send to your backend
    const encryptedString = await CrashLogService.exportEncryptedLogs();
    setExportedLogs(encryptedString);
  };

  const clearAllLogs = async () => {
    // 5. Clear all stored logs
    await CrashLogService.clearLogs();
    refreshLogs();
    setExportedLogs('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Vault Logger Example</Text>
      
      <View style={styles.buttonContainer}>
        <Button title="Simulate Caught Error" onPress={simulateError} />
        <Button title="Simulate Fatal Crash" onPress={simulateCrash} color="red" />
        <Button title="Export Encrypted Logs" onPress={exportLogs} color="green" />
        <Button title="Clear Logs" onPress={clearAllLogs} color="gray" />
      </View>

      {exportedLogs ? (
        <View style={styles.exportContainer}>
          <Text style={styles.subtitle}>Exported (Encrypted) Logs:</Text>
          <Text style={styles.exportedText} numberOfLines={4}>{exportedLogs}</Text>
        </View>
      ) : null}

      <Text style={styles.subtitle}>Recent Logs ({logs.length}):</Text>
      <ScrollView style={styles.logsContainer}>
        {logs.map((log, index) => (
          <View key={index} style={styles.logCard}>
            <Text style={styles.logTime}>{new Date(log.timestamp).toLocaleString()}</Text>
            <Text style={styles.logContext}>Context: {log.context}</Text>
            <Text style={styles.logError}>{log.error}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 10,
    marginBottom: 20,
  },
  exportContainer: {
    padding: 10,
    backgroundColor: '#e0ffe0',
    borderRadius: 8,
    marginBottom: 16,
  },
  exportedText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  logsContainer: {
    flex: 1,
  },
  logCard: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#ff4444',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logTime: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  logContext: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 4,
  },
  logError: {
    fontSize: 14,
    color: '#333',
  },
});
