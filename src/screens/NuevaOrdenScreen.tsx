import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, TextInput
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Vehiculo, Tecnico, CatalogoServicio } from '../types';
import { obtenerTecnicos } from '../api/tecnicos';
import { obtenerCatalogo } from '../api/catalogo';
import { crearOrden } from '../api/ordenes';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'NuevaOrden'>;
  route: RouteProp<RootStackParamList, 'NuevaOrden'>;
};

const PRIORIDADES = ['Normal', 'Urgente', 'Inmediato'];
const PRIORIDAD_COLORS: Record<string, string> = {
  Normal: '#00e096', Urgente: '#ffb800', Inmediato: '#ff6b2b'
};

interface Errores {
  servicios?: string;
  tecnico?: string;
  km?: string;
}

export default function NuevaOrdenScreen({ navigation, route }: Props) {
  const { vehiculo }: { vehiculo: Vehiculo } = route.params;
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [catalogo, setCatalogo] = useState<CatalogoServicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState<Errores>({});

  const [tecnicoId, setTecnicoId] = useState<number | null>(null);
  const [serviciosIds, setServiciosIds] = useState<number[]>([]);
  const [prioridad, setPrioridad] = useState('Normal');
  const [km, setKm] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const scrollRef = React.useRef<ScrollView>(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        const [t, c] = await Promise.all([obtenerTecnicos(), obtenerCatalogo()]);
        setTecnicos(t.data);
        setCatalogo(c.data);
      } catch {
        // error de conexión
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  const toggleServicio = (id: number) => {
    setServiciosIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
    if (errores.servicios) setErrores(e => ({ ...e, servicios: undefined }));
  };

  const validar = (): boolean => {
    const nuevosErrores: Errores = {};

    if (serviciosIds.length === 0)
      nuevosErrores.servicios = 'Selecciona al menos un servicio';

    if (!tecnicoId)
      nuevosErrores.tecnico = 'Asigna un técnico';

    if (!km || isNaN(parseInt(km)))
      nuevosErrores.km = 'Ingresa un kilometraje válido';

    setErrores(nuevosErrores);

    // Si hay errores hacer scroll al primero
    if (Object.keys(nuevosErrores).length > 0) {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return false;
    }
    return true;
  };

  const guardar = async () => {
    if (!validar()) return;

    const body = {
      vehiculoId: Number(vehiculo.id),
      tecnicoId: Number(tecnicoId),
      clienteId: Number(vehiculo.cliente.id),
      empresaId: vehiculo.empresa?.id ?? null,
      prioridad,
      kmIngreso: parseInt(km.trim(), 10),
      observaciones: observaciones ?? '',
      serviciosIds: serviciosIds.map(Number),
    };

    setGuardando(true);
    try {
      const result = await crearOrden(body);
      if (result.success) {
        navigation.reset({
          index: 1,
          routes: [
            { name: 'BuscarPlaca' },
            { name: 'OrdenesHoy' }
          ],
        });
      } else {
        setErrores({ servicios: result.message });
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      }
    } catch {
      setErrores({ servicios: 'No se pudo conectar con el servidor' });
    } finally {
      setGuardando(false);
    }
  };

  if (loading) return (
    <View style={styles.centered}>
      <ActivityIndicator color="#00c8ff" size="large" />
    </View>
  );

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      {/* Info vehículo */}
      <View style={styles.vehiculoCard}>
        <Text style={styles.placa}>{vehiculo.placa}</Text>
        <Text style={styles.vehiculoNombre}>{vehiculo.marca} {vehiculo.modelo} {vehiculo.anio}</Text>
        <Text style={styles.vehiculoOwner}>{vehiculo.cliente.nombre}</Text>
      </View>

      {/* Servicios */}
      <Text style={[styles.sectionTitle, errores.servicios && styles.sectionTitleError]}>
        🔧 TIPO DE SERVICIO {errores.servicios ? `— ${errores.servicios}` : ''}
      </Text>
      <View style={[styles.card, errores.servicios && styles.cardError]}>
        <View style={styles.serviciosGrid}>
          {catalogo.map(sv => (
            <TouchableOpacity
              key={sv.id}
              style={[styles.servicioBtn, serviciosIds.includes(sv.id) && styles.servicioBtnSel]}
              onPress={() => toggleServicio(sv.id)}
            >
              <Text style={styles.servicioNombre}>{sv.nombre}</Text>
              <Text style={styles.servicioPrecio}>${sv.precioBase.toLocaleString('es-CO')}</Text>
              {sv.generaPlanRevision && (
                <Text style={styles.planBadge}>📋 Genera plan</Text>
              )}
              {serviciosIds.includes(sv.id) && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Prioridad */}
      <Text style={styles.sectionTitle}>⚡ PRIORIDAD</Text>
      <View style={styles.card}>
        <View style={styles.prioridadRow}>
          {PRIORIDADES.map(p => (
            <TouchableOpacity
              key={p}
              style={[
                styles.prioridadBtn,
                prioridad === p && {
                  borderColor: PRIORIDAD_COLORS[p],
                  backgroundColor: `${PRIORIDAD_COLORS[p]}18`
                }
              ]}
              onPress={() => setPrioridad(p)}
            >
              <Text style={[
                styles.prioridadText,
                prioridad === p && { color: PRIORIDAD_COLORS[p] }
              ]}>
                {p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Técnico */}
      <Text style={[styles.sectionTitle, errores.tecnico && styles.sectionTitleError]}>
        👨‍🔧 TÉCNICO ASIGNADO {errores.tecnico ? `— ${errores.tecnico}` : ''}
      </Text>
      <View style={[styles.card, errores.tecnico && styles.cardError]}>
        <View style={styles.tecnicosRow}>
          {tecnicos.map(t => (
            <TouchableOpacity
              key={t.id}
              style={[
                styles.tecnicoChip,
                tecnicoId === t.id && styles.tecnicoChipSel
              ]}
              onPress={() => {
                setTecnicoId(t.id);
                setErrores(e => ({ ...e, tecnico: undefined }));
              }}
            >
              <Text style={[
                styles.tecnicoText,
                tecnicoId === t.id && { color: '#ff6b2b', fontWeight: '700' }
              ]}>
                {t.nombre}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* KM y observaciones */}
      <Text style={styles.sectionTitle}>📋 DETALLES</Text>
      <View style={styles.card}>
        <View style={styles.formGroup}>
          <Text style={[styles.label, errores.km && styles.labelError]}>
            Kilometraje actual {errores.km ? `— ${errores.km}` : '*'}
          </Text>
          <TextInput
            style={[styles.input, errores.km && styles.inputError]}
            value={km}
            onChangeText={text => {
              setKm(text.replace(/[^0-9]/g, ''));
              setErrores(e => ({ ...e, km: undefined }));
            }}
            keyboardType="numeric"
            placeholder="ej. 87500"
            placeholderTextColor="#1e2d40"
            maxLength={10}
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Observaciones</Text>
          <TextInput
            style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
            value={observaciones}
            onChangeText={setObservaciones}
            multiline
            placeholder="Descripción del problema, solicitudes especiales..."
            placeholderTextColor="#1e2d40"
          />
        </View>
      </View>

      <TouchableOpacity style={styles.btnPrimary} onPress={guardar} disabled={guardando}>
        {guardando
          ? <ActivityIndicator color="#000" />
          : <Text style={styles.btnPrimaryText}>✅ REGISTRAR INGRESO</Text>
        }
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f14', padding: 16 },
  centered: { flex: 1, backgroundColor: '#0a0f14', alignItems: 'center', justifyContent: 'center' },
  vehiculoCard: { backgroundColor: '#0d1826', borderWidth: 1, borderColor: '#00c8ff', borderRadius: 14, padding: 16, marginBottom: 16 },
  placa: { fontSize: 32, fontWeight: '900', color: '#00c8ff', letterSpacing: 6 },
  vehiculoNombre: { fontSize: 16, fontWeight: '700', color: '#e8f0f8', marginTop: 4 },
  vehiculoOwner: { fontSize: 13, color: '#5a7a99', marginTop: 2 },
  sectionTitle: { fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: '#5a7a99', marginBottom: 10, fontWeight: '700' },
  sectionTitleError: { color: '#ff6b2b' },
  card: { backgroundColor: '#0d1826', borderWidth: 1, borderColor: '#1e2d40', borderRadius: 14, padding: 16, marginBottom: 16 },
  cardError: { borderColor: '#ff6b2b', borderWidth: 2 },
  serviciosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  servicioBtn: { width: '47%', backgroundColor: '#182030', borderWidth: 2, borderColor: '#1e2d40', borderRadius: 10, padding: 12 },
  servicioBtnSel: { borderColor: '#00c8ff', backgroundColor: 'rgba(0,200,255,0.1)' },
  servicioNombre: { fontSize: 12, fontWeight: '600', color: '#e8f0f8', marginBottom: 2 },
  servicioPrecio: { fontSize: 11, color: '#00c8ff', fontFamily: 'monospace' },
  planBadge: { fontSize: 10, color: '#00e096', marginTop: 4 },
  checkmark: { position: 'absolute', top: 8, right: 8, color: '#00c8ff', fontSize: 14, fontWeight: '700' },
  prioridadRow: { flexDirection: 'row', gap: 8 },
  prioridadBtn: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 2, borderColor: '#1e2d40', backgroundColor: '#182030', alignItems: 'center' },
  prioridadText: { fontSize: 12, fontWeight: '700', color: '#5a7a99' },
  tecnicosRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tecnicoChip: { backgroundColor: '#182030', borderWidth: 2, borderColor: '#1e2d40', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16 },
  tecnicoChipSel: { borderColor: '#ff6b2b', backgroundColor: 'rgba(255,107,43,0.1)' },
  tecnicoText: { fontSize: 13, color: '#e8f0f8' },
  formGroup: { marginBottom: 14 },
  label: { fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#5a7a99', marginBottom: 6, fontWeight: '600' },
  labelError: { color: '#ff6b2b' },
  input: { backgroundColor: '#182030', borderWidth: 1, borderColor: '#1e2d40', borderRadius: 10, padding: 12, color: '#e8f0f8', fontSize: 15 },
  inputError: { borderColor: '#ff6b2b', borderWidth: 2 },
  btnPrimary: { backgroundColor: '#00c8ff', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12 },
  btnPrimaryText: { color: '#000', fontWeight: '700', fontSize: 15, letterSpacing: 1 },
});