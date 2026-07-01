import { Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Sesion } from '../types';

const CANAL_ID = 'sesiones';

export async function configurarCanal(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CANAL_ID, {
    name: 'Sesiones de entrenamiento',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#2E4057',
  });
}

export async function solicitarPermisos(): Promise<boolean> {
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
}

export async function programarNotificacionSesion(sesion: Sesion): Promise<string | null> {
  try {
    const [y, m, d]   = sesion.fecha.split('-').map(Number);
    const [h, min]    = sesion.horaInicio.split(':').map(Number);
    const triggerDate = new Date(y, m - 1, d, h, min, 0);

    // No programar si la fecha ya pasó
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
  } catch {
    return null;
  }
}

export async function cancelarNotificacionSesion(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // Si ya fue disparada o no existe, ignorar
  }
}
