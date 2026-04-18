import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BuscarPlacaScreen from '../screens/BuscarPlacaScreen';
import VehiculoScreen from '../screens/VehiculoScreen';
import NuevoVehiculoScreen from '../screens/NuevoVehiculoScreen';
import NuevaOrdenScreen from '../screens/NuevaOrdenScreen';
import FichaRevisionScreen from '../screens/FichaRevisionScreen';
import OrdenesHoyScreen from '../screens/OrdenesHoyScreen';
import { Vehiculo } from '../types';

export type RootStackParamList = {
    BuscarPlaca: undefined;
    Vehiculo: { vehiculo: Vehiculo };
    NuevoVehiculo: { placa: string };
    NuevaOrden: { vehiculo: Vehiculo };
    FichaRevision: { planId: number; ordenId: number; vehiculoId: number };
    OrdenesHoy: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="BuscarPlaca"
                screenOptions={{
                    headerStyle: { backgroundColor: '#0a0f14' },
                    headerTintColor: '#00c8ff',
                    headerTitleStyle: { fontWeight: 'bold' },
                    contentStyle: { backgroundColor: '#0a0f14' },
                }}
            >
                <Stack.Screen
                    name="BuscarPlaca"
                    component={BuscarPlacaScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="Vehiculo"
                    component={VehiculoScreen}
                    options={{ title: 'Vehiculo' }}
                />
                <Stack.Screen
                    name="NuevoVehiculo"
                    component={NuevoVehiculoScreen}
                    options={{ title: 'Nuevo Vehiculo' }}
                />
                <Stack.Screen
                    name="NuevaOrden"
                    component={NuevaOrdenScreen}
                    options={{ title: 'Nueva Orden' }}
                />
                <Stack.Screen
                    name="FichaRevision"
                    component={FichaRevisionScreen}
                    options={{ title: 'Ficha de Revision' }}
                />
                <Stack.Screen
                    name="OrdenesHoy"
                    component={OrdenesHoyScreen}
                    options={{ headerShown: false }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
