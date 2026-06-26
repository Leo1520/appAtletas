import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { hayEntrenadorRegistrado } from '../services/AuthService';
import RegistroScreen from '../screens/RegistroScreen';
import LoginScreen from '../screens/LoginScreen';
import PrincipalScreen from '../screens/PrincipalScreen';
import ListaAtletasScreen from '../screens/ListaAtletasScreen';
import PerfilAtletaScreen from '../screens/PerfilAtletaScreen';

export type RootStackParamList = {
  Registro: undefined;
  Login: undefined;
  Principal: undefined;
  ListaAtletas: undefined;
  PerfilAtleta: { atletaId?: number };
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
        <Stack.Screen name="Login"        component={LoginScreen}        options={{ title: 'Ingresar' }} />
        <Stack.Screen name="Principal"    component={PrincipalScreen}    options={{ headerShown: false }} />
        <Stack.Screen name="ListaAtletas" component={ListaAtletasScreen} options={{ title: 'Atletas' }} />
        <Stack.Screen name="PerfilAtleta" component={PerfilAtletaScreen} options={{ title: 'Perfil de atleta' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  carga: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
});
