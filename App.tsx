import React, { useEffect } from 'react';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import AppNavigator from './src/navigation/AppNavigator';
import { configurarCanal, solicitarPermisos } from './src/services/NotificacionService';

export default function App() {
  useEffect(() => {
    (async () => {
      try {
        await configurarCanal();
        await solicitarPermisos();
      } catch (e) {
        // Notificaciones no disponibles en Expo Go SDK 53+ — la app sigue funcionando
        console.log('[App] init notificaciones error (ignorado en Expo Go):', e);
      }
    })();
  }, []);

  return (
    <ActionSheetProvider>
      <AppNavigator />
    </ActionSheetProvider>
  );
}
