import React, { useEffect } from 'react';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import AppNavigator from './src/navigation/AppNavigator';
import { configurarCanal, solicitarPermisos } from './src/services/NotificacionService';

export default function App() {
  useEffect(() => {
    configurarCanal();
    solicitarPermisos();
  }, []);

  return (
    <ActionSheetProvider>
      <AppNavigator />
    </ActionSheetProvider>
  );
}
