import React from 'react';
import { View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import PerfilEntrenadorScreen from '../screens/PerfilEntrenadorScreen';

const Tab = createBottomTabNavigator();

function Placeholder({ titulo }: { titulo: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F2F5' }}>
      <Feather name="clock" size={44} color="#D1D5DB" />
      <Text style={{ color: '#9CA3AF', fontSize: 15, marginTop: 14, fontWeight: '600' }}>{titulo}</Text>
      <Text style={{ color: '#D1D5DB', fontSize: 13, marginTop: 4 }}>Próximamente</Text>
    </View>
  );
}

const ICONOS: Record<string, React.ComponentProps<typeof Feather>['name']> = {
  Home:            'home',
  Notificaciones:  'bell',
  Estadisticas:    'bar-chart-2',
  Perfil:          'user',
};

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#2E4057',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFF',
          borderTopColor: '#E5E7EB',
          height: 62,
          paddingBottom: 10,
          paddingTop: 4,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        tabBarIcon: ({ color, size }) => (
          <Feather name={ICONOS[route.name] ?? 'circle'} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name="Notificaciones"
        options={{ title: 'Notificaciones' }}
      >
        {() => <Placeholder titulo="Notificaciones" />}
      </Tab.Screen>
      <Tab.Screen
        name="Estadisticas"
        options={{ title: 'Estadísticas' }}
      >
        {() => <Placeholder titulo="Estadísticas" />}
      </Tab.Screen>
      <Tab.Screen
        name="Perfil"
        component={PerfilEntrenadorScreen}
        options={{ title: 'Perfil' }}
      />
    </Tab.Navigator>
  );
}
