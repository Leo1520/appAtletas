import React from 'react';
import { View, Image, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

interface Props {
  valor?: string;
  onFotoSeleccionada: (uri: string) => void;
  size?: number;
}

async function pedirPermisoCamara(): Promise<boolean> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Permiso de cámara requerido',
      'Para tomar la foto de perfil necesitamos acceso a la cámara. Habilítalo en Configuración → Aplicaciones → Linces.',
    );
    return false;
  }
  return true;
}

async function pedirPermisoGaleria(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Permiso de galería requerido',
      'Para elegir una foto necesitamos acceso a tus imágenes. Habilítalo en Configuración → Aplicaciones → Linces.',
    );
    return false;
  }
  return true;
}

export default function SelectorFoto({ valor, onFotoSeleccionada, size = 100 }: Props) {
  const radio = size / 2;

  async function tomarFoto() {
    if (!(await pedirPermisoCamara())) return;
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      onFotoSeleccionada(result.assets[0].uri);
    }
  }

  async function elegirDeGaleria() {
    if (!(await pedirPermisoGaleria())) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      mediaTypes: ['images'],
    });
    if (!result.canceled && result.assets[0]) {
      onFotoSeleccionada(result.assets[0].uri);
    }
  }

  function handleTocar() {
    const botones: React.ComponentProps<typeof Alert>['buttons'] = [
      { text: 'Tomar foto',        onPress: tomarFoto },
      { text: 'Elegir de galería', onPress: elegirDeGaleria },
    ];

    if (valor) {
      botones.push({
        text: 'Eliminar foto',
        style: 'destructive',
        onPress: () => onFotoSeleccionada(''),
      });
    }

    botones.push({ text: 'Cancelar', style: 'cancel' });

    Alert.alert(
      'Foto de perfil',
      'Podrás recortar la imagen antes de guardar.',
      botones,
    );
  }

  return (
    <TouchableOpacity
      onPress={handleTocar}
      activeOpacity={0.8}
      style={{ alignSelf: 'center' }}
    >
      <View style={[styles.circulo, { width: size, height: size, borderRadius: radio }]}>
        {valor ? (
          <Image
            source={{ uri: valor }}
            style={{ width: size, height: size, borderRadius: radio }}
            resizeMode="cover"
          />
        ) : (
          <Feather name="user" size={size * 0.44} color="#9CA3AF" />
        )}
      </View>

      {/* Badge cámara */}
      <View style={[
        styles.badge,
        {
          width: size * 0.32, height: size * 0.32,
          borderRadius: size * 0.16,
          bottom: 0, right: 0,
        },
      ]}>
        <Feather name="camera" size={size * 0.16} color="#FFF" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  circulo: {
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  badge: {
    position: 'absolute',
    backgroundColor: '#2E4057',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
});
