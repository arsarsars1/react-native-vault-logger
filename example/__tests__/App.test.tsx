import 'react-native';
import React from 'react';
import App from '../App';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { CrashLogService } from 'react-native-vault-logger';

describe('App Buttons', () => {
  beforeEach(async () => {
    // Clear logs before each test
    await CrashLogService.clearLogs();
    jest.clearAllMocks();
  });

  it('Simulate Caught Error button works', async () => {
    const { getByText, findByText } = render(<App />);
    const button = getByText('Simulate Caught Error');
    fireEvent.press(button);

    // Wait for the log to appear
    await findByText('Context: SIMULATED_ERROR_CONTEXT');
    await findByText('Simulated network request failed!');
  });

  it('Simulate Fatal Crash button works', () => {
    const { getByText } = render(<App />);
    const button = getByText('Simulate Fatal Crash');
    
    // The button throws an error synchronously in the onPress handler
    expect(() => {
      fireEvent.press(button);
    }).toThrow('This is a fatal crash!');
  });

  it('Export Encrypted Logs button works', async () => {
    const { getByText, findByText } = render(<App />);
    
    // First simulate an error so we have logs to export
    fireEvent.press(getByText('Simulate Caught Error'));
    await findByText('Context: SIMULATED_ERROR_CONTEXT');

    // Press export
    const button = getByText('Export Encrypted Logs');
    fireEvent.press(button);

    // Wait for the exported string to appear in the UI
    const exportTitle = await findByText('Exported (Encrypted) Logs:');
    expect(exportTitle).toBeTruthy();
  });

  it('Clear Logs button works', async () => {
    const { getByText, findByText, queryByText } = render(<App />);
    
    // First simulate an error so we have logs to clear
    fireEvent.press(getByText('Simulate Caught Error'));
    await findByText('Context: SIMULATED_ERROR_CONTEXT');

    // Press clear
    const button = getByText('Clear Logs');
    fireEvent.press(button);

    // Context should disappear
    await waitFor(() => {
      expect(queryByText('Context: SIMULATED_ERROR_CONTEXT')).toBeNull();
    });
  });
});
