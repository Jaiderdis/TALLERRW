import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInputProps,
  Keyboard,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { actualizarCliente, buscarPorCedula, crearCliente } from '../api/clientes';
import { obtenerEmpresas } from '../api/empresas';
import { crearVehiculo } from '../api/vehiculos';
import { Empresa } from '../types';
import {
  COMMON_COLORS,
  getSuggestedYears,
  HEAVY_BRANDS,
  MODELS_BY_BRAND,
} from '../constants/vehicleCatalog';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'NuevoVehiculo'>;
  route: RouteProp<RootStackParamList, 'NuevoVehiculo'>;
};

type FieldConfig = {
  label: string;
  value: string;
  setValue: (value: string) => void;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
};

type TipoIngreso = 'particular' | 'empresa';
type EstadoCedula = 'idle' | 'buscando' | 'encontrado' | 'nuevo' | 'error';

const PLACEHOLDER_COLOR = '#7f9bb4';

export default function NuevoVehiculoScreen({ navigation, route }: Props) {
  const { placa } = route.params;
  const [loading, setLoading] = useState(false);
  const [tipoIngreso, setTipoIngreso] = useState<TipoIngreso>('particular');
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [cargandoEmpresas, setCargandoEmpresas] = useState(true);
  const [empresaId, setEmpresaId] = useState<number | null>(null);

  const [nombre, setNombre] = useState('');
  const [cedula, setCedula] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [clienteId, setClienteId] = useState<number | null>(null);
  const [estadoCedula, setEstadoCedula] = useState<EstadoCedula>('idle');
  const [mensajeCedula, setMensajeCedula] = useState('');

  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [anio, setAnio] = useState('');
  const [color, setColor] = useState('');

  useEffect(() => {
    const cargarEmpresas = async () => {
      setCargandoEmpresas(true);

      try {
        const response = await obtenerEmpresas();
        if (response.success) {
          setEmpresas(response.data);
        }
      } catch (error) {
        setEmpresas([]);
      } finally {
        setCargandoEmpresas(false);
      }
    };

    void cargarEmpresas();
  }, []);

  const empresaSeleccionada = useMemo(
    () => empresas.find(item => item.id === empresaId) ?? null,
    [empresaId, empresas]
  );

  const brandSuggestions = useMemo(() => {
    const term = marca.trim().toLowerCase();
    const filtered = term
      ? HEAVY_BRANDS.filter(item => item.toLowerCase().includes(term))
      : HEAVY_BRANDS;
    return filtered.slice(0, 12);
  }, [marca]);

  const modelSuggestions = useMemo(() => {
    const matchedBrand = HEAVY_BRANDS.find(item => item.toLowerCase() === marca.trim().toLowerCase());
    const baseModels = matchedBrand ? MODELS_BY_BRAND[matchedBrand] ?? [] : [];
    const term = modelo.trim().toLowerCase();
    const filtered = term
      ? baseModels.filter(item => item.toLowerCase().includes(term))
      : baseModels;
    return filtered.slice(0, 10);
  }, [marca, modelo]);

  const yearSuggestions = useMemo(() => getSuggestedYears(), []);

  const clientFields = useMemo<FieldConfig[]>(
    () => [
      { label: 'Nombre completo *', value: nombre, setValue: setNombre, autoCapitalize: 'words' },
      { label: 'Telefono', value: telefono, setValue: setTelefono, keyboardType: 'phone-pad', autoCapitalize: 'none' },
      { label: 'Email', value: email, setValue: setEmail, keyboardType: 'email-address', autoCapitalize: 'none' },
    ],
    [email, nombre, telefono]
  );

  const limpiarClienteEncontrado = () => {
    setClienteId(null);
    setEstadoCedula('idle');
    setMensajeCedula('');
  };

  const onChangeCedula = (texto: string) => {
    const cedulaLimpia = texto.replace(/\D/g, '');

    if (clienteId) {
      setNombre('');
      setTelefono('');
      setEmail('');
    }

    setCedula(cedulaLimpia);
    limpiarClienteEncontrado();
  };

  const buscarClienteExistente = async () => {
    const cedulaLimpia = cedula.trim();

    if (cedulaLimpia.length < 5) {
      Alert.alert('Error', 'Ingresa una cedula valida para buscar');
      return;
    }

    setEstadoCedula('buscando');
    setMensajeCedula('Buscando cliente...');

    try {
      const response = await buscarPorCedula(cedulaLimpia);
      const cliente = response.data;

      setClienteId(cliente.id);
      setNombre(cliente.nombre ?? '');
      setTelefono(cliente.telefono ?? '');
      setEmail(cliente.email ?? '');

      if (cliente.empresa && tipoIngreso === 'empresa' && !empresaId) {
        setEmpresaId(cliente.empresa.id);
      }

      setEstadoCedula('encontrado');
      setMensajeCedula('Cliente encontrado. Revisa los datos y continua.');
    } catch (error: any) {
      if (error?.response?.status === 404) {
        setEstadoCedula('nuevo');
        setMensajeCedula('Cedula no registrada. Completa el nombre del cliente o conductor.');
        return;
      }

      setEstadoCedula('error');
      setMensajeCedula('No se pudo consultar la cedula en este momento.');
    }
  };

  const seleccionarTipoIngreso = (tipo: TipoIngreso) => {
    setTipoIngreso(tipo);

    if (tipo === 'particular') {
      setEmpresaId(null);
    }
  };

  const registrar = async () => {
    Keyboard.dismiss();

    const nombreLimpio = nombre.trim();
    const cedulaLimpia = cedula.trim();
    const telefonoLimpio = telefono.trim();
    const emailLimpio = email.trim();
    const marcaLimpia = marca.trim();
    const modeloLimpio = modelo.trim();
    const colorLimpio = color.trim();
    const empresaSeleccionadaId = tipoIngreso === 'empresa' ? empresaId : null;

    if (!cedulaLimpia || !nombreLimpio || !marcaLimpia || !modeloLimpio || !anio.trim()) {
      Alert.alert('Error', 'Completa los campos obligatorios');
      return;
    }

    if (tipoIngreso === 'empresa' && !empresaSeleccionadaId) {
      Alert.alert('Error', 'Selecciona la empresa que trae el vehiculo');
      return;
    }

    setLoading(true);

    try {
      let clienteFinalId = clienteId;

      if (clienteFinalId) {
        const clienteRes = await actualizarCliente(clienteFinalId, {
          nombre: nombreLimpio,
          cedula: cedulaLimpia,
          telefono: telefonoLimpio,
          email: emailLimpio,
          empresaId: empresaSeleccionadaId,
        });

        if (!clienteRes.success) {
          Alert.alert('Error', clienteRes.message);
          return;
        }

        clienteFinalId = clienteRes.data.id;
      } else {
        const clienteRes = await crearCliente({
          nombre: nombreLimpio,
          cedula: cedulaLimpia,
          telefono: telefonoLimpio,
          email: emailLimpio,
          empresaId: empresaSeleccionadaId,
        });

        if (!clienteRes.success) {
          Alert.alert('Error', clienteRes.message);
          return;
        }

        clienteFinalId = clienteRes.data.id;
      }

      const vehiculoRes = await crearVehiculo({
        placa,
        marca: marcaLimpia,
        modelo: modeloLimpio,
        anio: parseInt(anio, 10),
        color: colorLimpio,
        clienteId: clienteFinalId,
        empresaId: empresaSeleccionadaId,
      });

      if (!vehiculoRes.success) {
        Alert.alert('Error', vehiculoRes.message);
        return;
      }

      Alert.alert('Exito', 'Vehiculo registrado correctamente', [
        {
          text: 'Continuar',
          onPress: () => navigation.navigate('Vehiculo', { vehiculo: vehiculoRes.data }),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field: FieldConfig) => (
    <View key={field.label} style={styles.formGroup}>
      <Text style={styles.label}>{field.label}</Text>
      <TextInput
        style={styles.input}
        value={field.value}
        onChangeText={field.setValue}
        keyboardType={field.keyboardType}
        autoCapitalize={field.autoCapitalize ?? 'none'}
        autoCorrect={false}
        placeholder={`Ingresa ${field.label.toLowerCase().replace(' *', '')}`}
        placeholderTextColor={PLACEHOLDER_COLOR}
        selectionColor="#00c8ff"
      />
    </View>
  );

  const renderChipRow = (
    items: string[],
    onPress: (value: string) => void,
    selectedValue?: string
  ) => (
    <View style={styles.chipRow}>
      {items.map(item => {
        const isSelected = selectedValue?.toLowerCase() === item.toLowerCase();
        return (
          <TouchableOpacity
            key={item}
            style={[styles.chip, isSelected && styles.chipActive]}
            onPress={() => onPress(item)}
          >
            <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{item}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="always"
    >
      <View style={styles.header}>
        <Text style={styles.placaBadge}>{placa}</Text>
        <Text style={styles.subtitle}>Placa no registrada. Completa los datos.</Text>
      </View>

      <Text style={styles.sectionTitle}>TIPO DE INGRESO</Text>
      <View style={styles.card}>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              tipoIngreso === 'particular' && styles.toggleButtonActive,
            ]}
            onPress={() => seleccionarTipoIngreso('particular')}
          >
            <Text
              style={[
                styles.toggleText,
                tipoIngreso === 'particular' && styles.toggleTextActive,
              ]}
            >
              Particular
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleButton,
              tipoIngreso === 'empresa' && styles.toggleButtonActive,
            ]}
            onPress={() => seleccionarTipoIngreso('empresa')}
          >
            <Text
              style={[
                styles.toggleText,
                tipoIngreso === 'empresa' && styles.toggleTextActive,
              ]}
            >
              Empresa
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {tipoIngreso === 'empresa' && (
        <>
          <Text style={styles.sectionTitle}>EMPRESA</Text>
          <View style={styles.card}>
            {cargandoEmpresas ? (
              <Text style={styles.helperText}>Cargando empresas...</Text>
            ) : empresas.length ? (
              <View style={styles.companyList}>
                {empresas.map(item => {
                  const selected = item.id === empresaId;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.companyButton,
                        selected && styles.companyButtonActive,
                      ]}
                      onPress={() => setEmpresaId(item.id)}
                    >
                      <Text
                        style={[
                          styles.companyButtonText,
                          selected && styles.companyButtonTextActive,
                        ]}
                      >
                        {item.nombre}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.helperText}>No hay empresas registradas en la base de datos.</Text>
            )}

            {empresaSeleccionada && (
              <Text style={styles.selectionText}>
                Facturar a: {empresaSeleccionada.nombre}
              </Text>
            )}
          </View>
        </>
      )}

      <Text style={styles.sectionTitle}>
        {tipoIngreso === 'empresa' ? 'DATOS DEL CONDUCTOR' : 'DATOS DEL CLIENTE'}
      </Text>
      <View style={styles.card}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Cedula *</Text>
          <View style={styles.searchRow}>
            <TextInput
              style={[styles.input, styles.searchInput]}
              value={cedula}
              onChangeText={onChangeCedula}
              keyboardType="numeric"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Ingresa cedula"
              placeholderTextColor={PLACEHOLDER_COLOR}
              selectionColor="#00c8ff"
            />
            <TouchableOpacity
              style={[
                styles.searchButton,
                (!cedula.trim() || estadoCedula === 'buscando') && styles.searchButtonDisabled,
              ]}
              onPress={buscarClienteExistente}
              disabled={!cedula.trim() || estadoCedula === 'buscando'}
            >
              {estadoCedula === 'buscando' ? (
                <ActivityIndicator color="#03131b" />
              ) : (
                <Text style={styles.searchButtonText}>Buscar</Text>
              )}
            </TouchableOpacity>
          </View>

          {mensajeCedula ? (
            <Text
              style={[
                styles.lookupMessage,
                estadoCedula === 'encontrado' && styles.lookupMessageSuccess,
                estadoCedula === 'nuevo' && styles.lookupMessageInfo,
                estadoCedula === 'error' && styles.lookupMessageError,
              ]}
            >
              {mensajeCedula}
            </Text>
          ) : null}
        </View>

        {clientFields.map(renderField)}
      </View>

      <Text style={styles.sectionTitle}>DATOS DEL VEHICULO</Text>
      <View style={styles.card}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Marca *</Text>
          <TextInput
            style={styles.input}
            value={marca}
            onChangeText={setMarca}
            autoCapitalize="words"
            autoCorrect={false}
            placeholder="Escribe o toca una marca"
            placeholderTextColor={PLACEHOLDER_COLOR}
            selectionColor="#00c8ff"
          />
          {renderChipRow(brandSuggestions, setMarca, marca)}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Modelo *</Text>
          <TextInput
            style={styles.input}
            value={modelo}
            onChangeText={setModelo}
            autoCapitalize="words"
            autoCorrect={false}
            placeholder="Escribe o toca un modelo"
            placeholderTextColor={PLACEHOLDER_COLOR}
            selectionColor="#00c8ff"
          />
          {modelSuggestions.length ? (
            renderChipRow(modelSuggestions, setModelo, modelo)
          ) : (
            <Text style={styles.helperText}>Escribe el modelo si no aparece en la lista.</Text>
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Ano *</Text>
          <TextInput
            style={styles.input}
            value={anio}
            onChangeText={texto => setAnio(texto.replace(/\D/g, '').slice(0, 4))}
            keyboardType="numeric"
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Ingresa el ano"
            placeholderTextColor={PLACEHOLDER_COLOR}
            selectionColor="#00c8ff"
          />
          {renderChipRow(yearSuggestions, setAnio, anio)}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Color</Text>
          <TextInput
            style={styles.input}
            value={color}
            onChangeText={setColor}
            autoCapitalize="words"
            autoCorrect={false}
            placeholder="Escribe o toca un color"
            placeholderTextColor={PLACEHOLDER_COLOR}
            selectionColor="#00c8ff"
          />
          {renderChipRow(COMMON_COLORS, setColor, color)}
        </View>
      </View>

      <TouchableOpacity style={styles.btnPrimary} onPress={registrar} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.btnPrimaryText}>REGISTRAR VEHICULO</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f14',
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 20,
  },
  placaBadge: {
    fontSize: 36,
    fontWeight: '900',
    color: '#ff6b2b',
    letterSpacing: 6,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#7f9bb4',
  },
  sectionTitle: {
    fontSize: 10,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: '#5a7a99',
    marginBottom: 10,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#0d1826',
    borderWidth: 1,
    borderColor: '#274055',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  toggleRow: {
    flexDirection: 'row',
  },
  toggleButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#274055',
    backgroundColor: '#182635',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  toggleButtonActive: {
    backgroundColor: '#00c8ff',
    borderColor: '#00c8ff',
  },
  toggleText: {
    color: '#d8e7f4',
    fontSize: 15,
    fontWeight: '700',
  },
  toggleTextActive: {
    color: '#03131b',
  },
  companyList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  companyButton: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#274055',
    backgroundColor: '#182635',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginBottom: 10,
  },
  companyButtonActive: {
    backgroundColor: '#00c8ff',
    borderColor: '#00c8ff',
  },
  companyButtonText: {
    color: '#d8e7f4',
    fontSize: 14,
    fontWeight: '700',
  },
  companyButtonTextActive: {
    color: '#03131b',
  },
  helperText: {
    color: '#7f9bb4',
    fontSize: 13,
    marginTop: 8,
  },
  selectionText: {
    color: '#8edcff',
    fontSize: 13,
    marginTop: 6,
  },
  formGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#7f9bb4',
    marginBottom: 6,
    fontWeight: '600',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    marginRight: 10,
  },
  input: {
    backgroundColor: '#182635',
    borderWidth: 1,
    borderColor: '#274055',
    borderRadius: 10,
    padding: 12,
    color: '#e8f0f8',
    fontSize: 15,
    justifyContent: 'center',
  },
  searchButton: {
    minHeight: 48,
    minWidth: 92,
    borderRadius: 10,
    backgroundColor: '#00c8ff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  searchButtonDisabled: {
    opacity: 0.45,
  },
  searchButtonText: {
    color: '#03131b',
    fontSize: 14,
    fontWeight: '800',
  },
  lookupMessage: {
    fontSize: 13,
    marginTop: 8,
  },
  lookupMessageSuccess: {
    color: '#59d98e',
  },
  lookupMessageInfo: {
    color: '#8edcff',
  },
  lookupMessageError: {
    color: '#ff8b7a',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  chip: {
    minHeight: 36,
    borderRadius: 18,
    paddingHorizontal: 12,
    backgroundColor: '#111c27',
    borderWidth: 1,
    borderColor: '#274055',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: {
    backgroundColor: '#00c8ff',
    borderColor: '#00c8ff',
  },
  chipText: {
    color: '#d8e7f4',
    fontSize: 13,
    fontWeight: '700',
  },
  chipTextActive: {
    color: '#03131b',
  },
  btnPrimary: {
    backgroundColor: '#00c8ff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  btnPrimaryText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 1,
  },
});
