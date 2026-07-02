import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { hayEntrenadorRegistrado } from '../services/AuthService';
import RegistroScreen from '../screens/RegistroScreen';
import LoginScreen from '../screens/LoginScreen';
import ListaAtletasScreen from '../screens/ListaAtletasScreen';
import PerfilAtletaScreen from '../screens/PerfilAtletaScreen';
import AgendaSemanalScreen from '../screens/AgendaSemanalScreen';
import CrearSesionScreen from '../screens/CrearSesionScreen';
import RegistroAsistenciaScreen from '../screens/RegistroAsistenciaScreen';
import RegistrarMarcaScreen from '../screens/RegistrarMarcaScreen';
import HistorialMarcasScreen from '../screens/HistorialMarcasScreen';
import MainTabNavigator from './MainTabNavigator';
import ListaCompetenciasScreen from '../screens/ListaCompetenciasScreen';
import CrearCompetenciaScreen from '../screens/CrearCompetenciaScreen';
import DetalleCompetenciaScreen from '../screens/DetalleCompetenciaScreen';
import EstadisticasScreen from '../screens/EstadisticasScreen';
import NotificacionesScreen from '../screens/NotificacionesScreen';

export type RootStackParamList = {
  Registro: undefined;
  Login: undefined;
  Principal: undefined;
  ListaAtletas: undefined;
  PerfilAtleta: { atletaId?: number };
  AgendaSemanal: undefined;
  CrearSesion: { sesionId?: number };
  RegistroAsistencia: { sesionId: number };
  RegistrarMarca: undefined;
  HistorialMarcas: { atletaId?: number };
  ListaCompetencias: undefined;
  CrearCompetencia: Record<string, never>;
  DetalleCompetencia: { competenciaId: number };
  Estadisticas: undefined;
  Notificaciones: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const [cargando, setCargando] = useState(true);
  const [hayEntrenador, setHayEntrenador] = useState(false);

  useEffect(() => {
    hayEntrenadorRegistrado()
      .then(setHayEntrenador)
      .finally(() => setCargando(false));
  }, []);

  if (cargando) {
    return (
      <View style={styles.carga}>
        <ActivityIndicator size="large" color="#2E4057" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={hayEntrenador ? 'Login' : 'Registro'}
        screenOptions={{ headerStyle: { backgroundColor: '#2E4057' }, headerTintColor: '#FFFFFF' }}
      >
        <Stack.Screen name="Registro"     component={RegistroScreen}     options={{ title: 'Crear cuenta' }} />
        <Stack.Screen name="Login"        component={LoginScreen}        options={{ headerShown: false }} />
        <Stack.Screen name="Principal"    component={MainTabNavigator}   options={{ headerShown: false }} />
        <Stack.Screen name="ListaAtletas"  component={ListaAtletasScreen}  options={{ title: 'Atletas' }} />
        <Stack.Screen name="PerfilAtleta"  component={PerfilAtletaScreen}  options={{ title: 'Perfil de atleta' }} />
        <Stack.Screen name="AgendaSemanal"      component={AgendaSemanalScreen}      options={{ title: 'Agenda semanal' }} />
        <Stack.Screen name="CrearSesion"         component={CrearSesionScreen}         options={{ title: 'Nueva sesión' }} />
        <Stack.Screen name="RegistroAsistencia"  component={RegistroAsistenciaScreen}  options={{ title: 'Asistencia' }} />
        <Stack.Screen name="RegistrarMarca"      component={RegistrarMarcaScreen}      options={{ title: 'Registrar marca' }} />
        <Stack.Screen name="HistorialMarcas"      component={HistorialMarcasScreen}      options={{ title: 'Historial de marcas' }} />
        <Stack.Screen name="ListaCompetencias"   component={ListaCompetenciasScreen}    options={{ title: 'Competencias' }} />
        <Stack.Screen name="CrearCompetencia"    component={CrearCompetenciaScreen}     options={{ title: 'Nueva competencia' }} />
        <Stack.Screen name="DetalleCompetencia"  component={DetalleCompetenciaScreen}   options={{ title: 'Competencia' }} />
        <Stack.Screen name="Estadisticas"    component={EstadisticasScreen}    options={{ title: 'Estadísticas' }} />
        <Stack.Screen name="Notificaciones" component={NotificacionesScreen}  options={{ title: 'Notificaciones' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  carga: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
});
