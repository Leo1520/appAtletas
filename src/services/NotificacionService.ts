import { Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Sesion } from '../types';

const CANAL_ID = 'sesiones';

export async function configurarCanal(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync(CANAL_ID, {
      name: 'Sesiones de entrenamiento',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2E4057',
    });
  } catch (e) {
    console.log('[NotificacionService] configurarCanal error (ignorado en Expo Go):', e);
  }
}

export async function solicitarPermisos(): Promise<boolean> {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;

    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permisos de notificaciones',
        'Para recibir recordatorios de sesiones, habilita las notificaciones en Configuración → Aplicaciones → Linces.',
      );
      return false;
    }
    return true;
  } catch (e) {
    // En Expo Go SDK 53+ los permisos de push lanzan error — se ignora.
    // Las notificaciones locales siguen funcionando en el APK final.
    console.log('[NotificacionService] solicitarPermisos error (ignorado en Expo Go):', e);
    return false;
  }
}

export async function programarNotificacionSesion(sesion: Sesion): Promise<string | null> {
  try {
    const [y, m, d]   = sesion.fecha.split('-').map(Number);
    const [h, min]    = sesion.horaInicio.split(':').map(Number);
    const triggerDate = new Date(y, m - 1, d, h, min, 0);

    if (triggerDate.getTime() <= Date.now()) return null;

    const cuerpo = sesion.lugar
      ? `${sesion.descripcion} · ${sesion.lugar}`
      : sesion.descripcion;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🏃 Club Linces - Entrenamiento',
        body: cuerpo,
        sound: true,
        channelId: CANAL_ID,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });

    return id;
  } catch (e) {
    console.log('[NotificacionService] programarNotificacionSesion error (ignorado en Expo Go):', e);
    return null;
  }
}

export async function cancelarNotificacionSesion(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (e) {
    console.log('[NotificacionService] cancelarNotificacionSesion error:', e);
  }
}
