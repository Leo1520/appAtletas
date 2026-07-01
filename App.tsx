import React from 'react';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <ActionSheetProvider>
      <AppNavigator />
    </ActionSheetProvider>
  );
}
