import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import AgendaSemanalScreen from '../screens/AgendaSemanalScreen';
import PerfilEntrenadorScreen from '../screens/PerfilEntrenadorScreen';

const Tab = createBottomTabNavigator();

const ICONOS: Record<string, React.ComponentProps<typeof Feather>['name']> = {
  Home:   'home',
  Agenda: 'calendar',
  Perfil: 'user',
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
      <Tab.Screen name="Home"   component={HomeScreen}            options={{ title: 'Home' }} />
      <Tab.Screen name="Agenda" component={AgendaSemanalScreen}   options={{ title: 'Agenda' }} />
      <Tab.Screen name="Perfil" component={PerfilEntrenadorScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}
