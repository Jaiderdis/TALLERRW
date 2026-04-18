import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Alert,
  TextInputProps,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { actualizarCliente, buscarPorCedula, crearCliente } from '../api/clientes';
import { buscarPorPlaca, crearVehiculo } from '../api/vehiculos';
import {
  COMMON_COLORS,
  getSuggestedYears,
  HEAVY_BRANDS,
  MODELS_BY_BRAND,
} from '../constants/vehicleCatalog';
import { llamarApi } from '../api/apiHelper';
import { useEmpresas } from '../hooks/useEmpresas';
import { nuevoVehiculoSchema } from '../schemas/nuevoVehiculo';
import { COLORS } from '../theme';
import ScreenHeader from '../components/ScreenHeader';
import Section from '../components/Section';
import ChipRow from '../components/ChipRow';
import StickyCTA from '../components/StickyCTA';
import PlateBlock from '../components/PlateBlock';

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
  placeholder?: string;
  mono?: boolean;
};

type TipoIngreso = 'particular' | 'empresa';
type EstadoCedula = 'idle' | 'buscando' | 'encontrado' | 'nuevo' | 'error';

type FieldErrorKey = 'cedula' | 'nombre' | 'marca' | 'modelo' | 'anio';
type FieldErrors = Record<FieldErrorKey, boolean>;

const PLACEHOLDER_COLOR = COLORS.textDim;

// Constantes estáticas definidas fuera del componente para evitar recreación en cada render
const EMAIL_DOMAINS = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com'];
const YEAR_SUGGESTIONS = getSuggestedYears();

export default function NuevoVehiculoScreen({ navigation, route }: Props) {
  const { placa } = route.params;
  const [loading, setLoading] = useState(false);

  // El header nativo se reemplaza por el ScreenHeader del diseño.
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({
    cedula: false,
    nombre: false,
    marca: false,
    modelo: false,
    anio: false,
  });
  const cedulaRef = useRef<TextInput>(null);
  const nombreRef = useRef<TextInput>(null);
  const marcaRef = useRef<TextInput>(null);
  const modeloRef = useRef<TextInput>(null);
  const anioRef = useRef<TextInput>(null);
  const [tipoIngreso, setTipoIngreso] = useState<TipoIngreso>('particular');
  const { empresas, cargando: cargandoEmpresas } = useEmpresas();
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

  const empresaSeleccionada = useMemo(
    () => empresas.find((item) => item.id === empresaId) ?? null,
    [empresaId, empresas]
  );

  const brandSuggestions = useMemo(() => {
    const term = marca.trim().toLowerCase();
    const filtered = term
      ? HEAVY_BRANDS.filter((item) => item.toLowerCase().includes(term))
      : HEAVY_BRANDS;
    return filtered.slice(0, 12);
  }, [marca]);

  const modelSuggestions = useMemo(() => {
    const matchedBrand = HEAVY_BRANDS.find(
      (item) => item.toLowerCase() === marca.trim().toLowerCase()
    );
    const baseModels = matchedBrand ? MODELS_BY_BRAND[matchedBrand] ?? [] : [];
    const term = modelo.trim().toLowerCase();
    const filtered = term
      ? baseModels.filter((item) => item.toLowerCase().includes(term))
      : baseModels;
    return filtered.slice(0, 10);
  }, [marca, modelo]);

  const emailSuggestions = useMemo(() => {
    if (!email.trim() || email.includes('@')) return [];
    return EMAIL_DOMAINS.map((domain) => `${email.trim()}@${domain}`);
  }, [email]);

  // Meta del header: campos completados
  const filledCount = useMemo(() => {
    return [
      Boolean(cedula && nombre),
      Boolean(telefono || email),
      Boolean(marca),
      Boolean(modelo),
      Boolean(anio),
      Boolean(color),
    ].filter(Boolean).length;
  }, [cedula, nombre, telefono, email, marca, modelo, anio, color]);

  const headerMeta = useMemo(() => {
    const fecha = new Date()
      .toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
      .replace('.', '')
      .toUpperCase();
    return `${filledCount}/6 CAMPOS · ${fecha}`;
  }, [filledCount]);

  const clientOk = cedula.trim().length >= 5 && nombre.trim().length > 1;
  const vehOk =
    marca.trim().length > 0 && modelo.trim().length > 0 && /^\d{4}$/.test(anio.trim());
  const canSave = clientOk && vehOk && !loading;

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

    setFieldErrors((prev) => ({ ...prev, cedula: false }));
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

    const response = await llamarApi(() => buscarPorCedula(cedulaLimpia));

    if (!response.success) {
      setEstadoCedula('nuevo');
      setMensajeCedula('Cédula no registrada. Completa el nombre del cliente o conductor.');
      return;
    }

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

    // Validación con Zod
    const parsed = nuevoVehiculoSchema.safeParse({
      cedula: cedulaLimpia,
      nombre: nombreLimpio,
      marca: marcaLimpia,
      modelo: modeloLimpio,
      anio: anio.trim(),
      color: colorLimpio,
      email: emailLimpio || undefined,
    });

    if (!parsed.success) {
      const issues = parsed.error.issues;
      const newErrors: FieldErrors = {
        cedula: false,
        nombre: false,
        marca: false,
        modelo: false,
        anio: false,
      };
      const fieldRefMap: Record<FieldErrorKey, TextInput | null> = {
        cedula: cedulaRef.current,
        nombre: nombreRef.current,
        marca: marcaRef.current,
        modelo: modeloRef.current,
        anio: anioRef.current,
      };
      let firstRef: TextInput | null = null;

      for (const issue of issues) {
        const key = issue.path[0] as FieldErrorKey;
        if (key in newErrors) {
          newErrors[key] = true;
          if (!firstRef) firstRef = fieldRefMap[key];
        }
      }

      setFieldErrors(newErrors);
      firstRef?.focus();
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
        const clienteRes = await llamarApi(() =>
          actualizarCliente(clienteFinalId!, {
            nombre: nombreLimpio,
            cedula: cedulaLimpia,
            telefono: telefonoLimpio,
            email: emailLimpio,
            empresaId: empresaSeleccionadaId,
          })
        );

        if (!clienteRes.success) {
          Alert.alert('Error', clienteRes.message);
          return;
        }

        clienteFinalId = clienteRes.data.id;
      } else {
        const clienteRes = await llamarApi(() =>
          crearCliente({
            nombre: nombreLimpio,
            cedula: cedulaLimpia,
            telefono: telefonoLimpio,
            email: emailLimpio,
            empresaId: empresaSeleccionadaId,
          })
        );

        if (!clienteRes.success) {
          Alert.alert('No se pudo registrar', clienteRes.message);
          return;
        }

        clienteFinalId = clienteRes.data.id;
      }

      const vehiculoRes = await llamarApi(() =>
        crearVehiculo({
          placa,
          marca: marcaLimpia,
          modelo: modeloLimpio,
          anio: parseInt(anio, 10),
          color: colorLimpio,
          clienteId: clienteFinalId,
          empresaId: empresaSeleccionadaId,
        })
      );

      if (!vehiculoRes.success) {
        const busqueda = await llamarApi(() => buscarPorPlaca(placa));
        if (busqueda.success) {
          Alert.alert(
            'Vehículo ya registrado',
            'Esta placa ya existe en el sistema. Te llevamos al vehículo.',
            [
              {
                text: 'OK',
                onPress: () => navigation.navigate('Vehiculo', { vehiculo: busqueda.data }),
              },
            ]
          );
          return;
        } else {
          Alert.alert('No se pudo registrar', vehiculoRes.message);
        }
        return;
      }

      Alert.alert('Exito', 'Vehiculo registrado correctamente', [
        {
          text: 'Continuar',
          onPress: () => navigation.navigate('Vehiculo', { vehiculo: vehiculoRes.data }),
        },
      ]);
    } catch (error: unknown) {
      const mensajeError =
        error instanceof Error ? error.message : 'Error inesperado, intenta de nuevo';
      Alert.alert('No se pudo registrar', mensajeError);
    } finally {
      setLoading(false);
    }
  };

  // ---------- Renders helpers ----------

  const renderField = ({
    label,
    value,
    setValue,
    keyboardType,
    autoCapitalize,
    placeholder,
    mono,
  }: FieldConfig) => (
    <View key={label} style={styles.formGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, mono && styles.inputMono]}
        value={value}
        onChangeText={setValue}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? 'none'}
        autoCorrect={false}
        placeholder={placeholder ?? `Ingresa ${label.toLowerCase()}`}
        placeholderTextColor={PLACEHOLDER_COLOR}
        selectionColor={COLORS.blue}
      />
    </View>
  );

  const extraClientFields: FieldConfig[] = [
    {
      label: 'Telefono',
      value: telefono,
      setValue: setTelefono,
      keyboardType: 'phone-pad',
      autoCapitalize: 'none',
      placeholder: '(300) 000-0000',
      mono: true,
    },
  ];

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
          {/* ---------- Header ---------- */}
          <ScreenHeader
            onBack={() => navigation.goBack()}
            title="Nuevo vehículo"
            meta={headerMeta}
            accent={COLORS.blue}
          />

          {/* ---------- Hero plate card ---------- */}
          <View style={styles.heroCard}>
            <View style={styles.heroBorder} />
            <View style={styles.heroContent}>
              <PlateBlock plate={placa} color={COLORS.orange} size="md" />
              <View style={styles.heroMeta}>
                <View style={styles.pillWarn}>
                  <Ionicons name="warning" size={12} color={COLORS.orange} />
                  <Text style={styles.pillWarnText}>PLACA NO REGISTRADA</Text>
                </View>
                <Text style={styles.heroSubtitle}>
                  Completa los datos para crear la ficha del vehículo.
                </Text>
              </View>
            </View>
          </View>

          {/* ---------- Tipo de ingreso ---------- */}
          <Section title="Tipo de ingreso" icon="person-outline">
            <View style={styles.segment}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.segmentBtn,
                  tipoIngreso === 'particular' && styles.segmentBtnActive,
                ]}
                onPress={() => seleccionarTipoIngreso('particular')}
              >
                <Ionicons
                  name="person"
                  size={16}
                  color={tipoIngreso === 'particular' ? COLORS.textDark : COLORS.textDim}
                />
                <Text
                  style={[
                    styles.segmentText,
                    tipoIngreso === 'particular' && styles.segmentTextActive,
                  ]}
                >
                  Particular
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.segmentBtn,
                  tipoIngreso === 'empresa' && styles.segmentBtnActive,
                ]}
                onPress={() => seleccionarTipoIngreso('empresa')}
              >
                <Ionicons
                  name="business"
                  size={16}
                  color={tipoIngreso === 'empresa' ? COLORS.textDark : COLORS.textDim}
                />
                <Text
                  style={[
                    styles.segmentText,
                    tipoIngreso === 'empresa' && styles.segmentTextActive,
                  ]}
                >
                  Empresa
                </Text>
              </TouchableOpacity>
            </View>
          </Section>

          {/* ---------- Empresa (solo si empresa) ---------- */}
          {tipoIngreso === 'empresa' && (
            <Section title="Empresa" icon="business-outline">
              {cargandoEmpresas ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color={COLORS.blue} />
                  <Text style={styles.helperText}>Cargando empresas...</Text>
                </View>
              ) : empresas.length ? (
                <View style={styles.companyList}>
                  {empresas.map((item) => {
                    const selected = item.id === empresaId;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        activeOpacity={0.8}
                        style={[
                          styles.companyChip,
                          selected && styles.companyChipActive,
                        ]}
                        onPress={() => setEmpresaId(item.id)}
                      >
                        <Text
                          style={[
                            styles.companyChipText,
                            selected && styles.companyChipTextActive,
                          ]}
                        >
                          {item.nombre}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.helperText}>
                  No hay empresas registradas en la base de datos.
                </Text>
              )}

              {empresaSeleccionada && (
                <Text style={styles.selectionText}>
                  Facturar a: {empresaSeleccionada.nombre}
                </Text>
              )}
            </Section>
          )}

          {/* ---------- Datos del cliente ---------- */}
          <Section
            title={tipoIngreso === 'empresa' ? 'Datos del conductor' : 'Datos del cliente'}
            icon="person-outline"
          >
            {/* Cédula + Buscar */}
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>
                {tipoIngreso === 'empresa' ? 'NIT / Cédula' : 'Cédula'}
                <Text style={styles.required}> *</Text>
              </Text>
              <View style={styles.searchRow}>
                <TextInput
                  ref={cedulaRef}
                  style={[
                    styles.input,
                    styles.inputMono,
                    styles.searchInput,
                    fieldErrors.cedula && styles.inputError,
                  ]}
                  value={cedula}
                  onChangeText={onChangeCedula}
                  keyboardType="numeric"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="Ingresa documento"
                  placeholderTextColor={PLACEHOLDER_COLOR}
                  selectionColor={COLORS.blue}
                />
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[
                    styles.searchButton,
                    (!cedula.trim() || estadoCedula === 'buscando') &&
                      styles.searchButtonDisabled,
                  ]}
                  onPress={buscarClienteExistente}
                  disabled={!cedula.trim() || estadoCedula === 'buscando'}
                >
                  {estadoCedula === 'buscando' ? (
                    <ActivityIndicator color={COLORS.text} size="small" />
                  ) : (
                    <>
                      <Ionicons name="search" size={14} color={COLORS.text} />
                      <Text style={styles.searchButtonText}>Buscar</Text>
                    </>
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

            {/* Nombre */}
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>
                {tipoIngreso === 'empresa' ? 'Razón social / Nombre' : 'Nombre completo'}
                <Text style={styles.required}> *</Text>
              </Text>
              <TextInput
                ref={nombreRef}
                style={[styles.input, fieldErrors.nombre && styles.inputError]}
                value={nombre}
                onChangeText={(text) => {
                  setNombre(text);
                  setFieldErrors((prev) => ({ ...prev, nombre: false }));
                }}
                autoCapitalize="words"
                autoCorrect={false}
                placeholder={
                  tipoIngreso === 'empresa' ? 'Empresa S.A.S.' : 'Nombres y apellidos'
                }
                placeholderTextColor={PLACEHOLDER_COLOR}
                selectionColor={COLORS.blue}
              />
            </View>

            {/* Teléfono */}
            {extraClientFields.map(renderField)}

            {/* Email con sugerencias */}
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="correo@dominio.com"
                placeholderTextColor={PLACEHOLDER_COLOR}
                selectionColor={COLORS.blue}
              />
              {emailSuggestions.length > 0 && (
                <View style={styles.emailSuggestions}>
                  {emailSuggestions.map((suggestion) => (
                    <TouchableOpacity
                      key={suggestion}
                      style={styles.emailSuggestionItem}
                      onPress={() => setEmail(suggestion)}
                    >
                      <Ionicons name="mail-outline" size={14} color={COLORS.blue} />
                      <Text style={styles.emailSuggestionText}>{suggestion}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </Section>

          {/* ---------- Datos del vehículo ---------- */}
          <Section title="Datos del vehículo" icon="car-outline">
            {/* Marca */}
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>
                Marca<Text style={styles.required}> *</Text>
              </Text>
              <TextInput
                ref={marcaRef}
                style={[styles.input, fieldErrors.marca && styles.inputError]}
                value={marca}
                onChangeText={(text) => {
                  setMarca(text);
                  setFieldErrors((prev) => ({ ...prev, marca: false }));
                }}
                autoCapitalize="words"
                autoCorrect={false}
                placeholder="Escribe o toca una marca"
                placeholderTextColor={PLACEHOLDER_COLOR}
                selectionColor={COLORS.blue}
              />
              {brandSuggestions.length > 0 && (
                <ChipRow
                  items={brandSuggestions}
                  value={marca}
                  onPick={(v) => {
                    setMarca(v);
                    setFieldErrors((prev) => ({ ...prev, marca: false }));
                  }}
                  style={styles.chipRowSpacing}
                />
              )}
            </View>

            {/* Modelo */}
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>
                Modelo<Text style={styles.required}> *</Text>
              </Text>
              <TextInput
                ref={modeloRef}
                style={[styles.input, fieldErrors.modelo && styles.inputError]}
                value={modelo}
                onChangeText={(text) => {
                  setModelo(text);
                  setFieldErrors((prev) => ({ ...prev, modelo: false }));
                }}
                autoCapitalize="words"
                autoCorrect={false}
                placeholder="Ej: WorkStar, 4400, FH…"
                placeholderTextColor={PLACEHOLDER_COLOR}
                selectionColor={COLORS.blue}
              />
              {modelSuggestions.length ? (
                <ChipRow
                  items={modelSuggestions}
                  value={modelo}
                  onPick={(v) => {
                    setModelo(v);
                    setFieldErrors((prev) => ({ ...prev, modelo: false }));
                  }}
                  style={styles.chipRowSpacing}
                />
              ) : (
                <Text style={styles.helperText}>
                  Escribe el modelo si no aparece en la lista.
                </Text>
              )}
            </View>

            {/* Año */}
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>
                Año<Text style={styles.required}> *</Text>
              </Text>
              <TextInput
                ref={anioRef}
                style={[
                  styles.input,
                  styles.inputMono,
                  fieldErrors.anio && styles.inputError,
                ]}
                value={anio}
                onChangeText={(text) => {
                  setAnio(text.replace(/\D/g, '').slice(0, 4));
                  setFieldErrors((prev) => ({ ...prev, anio: false }));
                }}
                keyboardType="numeric"
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="Ingresa el año"
                placeholderTextColor={PLACEHOLDER_COLOR}
                selectionColor={COLORS.blue}
              />
              {YEAR_SUGGESTIONS.length > 0 && (
                <ChipRow
                  items={YEAR_SUGGESTIONS}
                  value={anio}
                  onPick={(v) => {
                    setAnio(v);
                    setFieldErrors((prev) => ({ ...prev, anio: false }));
                  }}
                  mono
                  style={styles.chipRowSpacing}
                />
              )}
            </View>

            {/* Color */}
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Color</Text>
              <TextInput
                style={styles.input}
                value={color}
                onChangeText={setColor}
                autoCapitalize="words"
                autoCorrect={false}
                placeholder="Escribe o toca un color"
                placeholderTextColor={PLACEHOLDER_COLOR}
                selectionColor={COLORS.blue}
              />
              <ChipRow
                items={COMMON_COLORS}
                value={color}
                onPick={setColor}
                withSwatch
                style={styles.chipRowSpacing}
              />
            </View>
          </Section>

          {/* ---------- StickyCTA ---------- */}
          <StickyCTA>
            <View style={styles.ctaBar}>
              <View style={styles.ctaPlate}>
                <Text style={styles.ctaPlateLabel}>PLACA</Text>
                <Text style={styles.ctaPlateValue}>{placa}</Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.cancelBtn}
                onPress={() => navigation.goBack()}
                disabled={loading}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
                onPress={registrar}
                disabled={!canSave}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.black} size="small" />
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name="check"
                      size={16}
                      color={canSave ? COLORS.black : COLORS.textMuted}
                    />
                    <Text
                      style={[
                        styles.saveBtnText,
                        !canSave && styles.saveBtnTextDisabled,
                      ]}
                    >
                      Registrar vehículo
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </StickyCTA>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 40,
  },

  // Hero plate card
  heroCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.bg2,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
  },
  heroBorder: {
    width: 4,
    backgroundColor: COLORS.orange,
  },
  heroContent: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 20,
    padding: 22,
  },
  heroMeta: {
    flex: 1,
    minWidth: 160,
  },
  pillWarn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.orangeSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillWarnText: {
    color: COLORS.orange,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  heroSubtitle: {
    fontSize: 13,
    color: COLORS.textDim,
    marginTop: 8,
    lineHeight: 18,
  },

  // Segment (Particular / Empresa)
  segment: {
    flexDirection: 'row',
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: COLORS.blue,
  },
  segmentText: {
    fontSize: 14,
    color: COLORS.textDim,
    fontWeight: '500',
  },
  segmentTextActive: {
    color: COLORS.textDark,
    fontWeight: '700',
  },

  // Empresa list
  companyList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  companyChip: {
    minHeight: 40,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.bg3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyChipActive: {
    backgroundColor: COLORS.blueSoft,
    borderColor: COLORS.blue,
  },
  companyChipText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
  companyChipTextActive: {
    color: COLORS.blue,
    fontWeight: '700',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  helperText: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 6,
  },
  selectionText: {
    color: COLORS.blue,
    fontSize: 12,
    marginTop: 10,
    fontWeight: '600',
  },

  // Form
  formGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: COLORS.textDim,
    marginBottom: 6,
  },
  required: {
    color: COLORS.orange,
  },
  input: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: COLORS.text,
    minHeight: 48,
  },
  inputMono: {
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  inputError: {
    borderColor: COLORS.danger,
    borderWidth: 1.5,
  },

  // Buscar row
  searchRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
  },
  searchInput: {
    flex: 1,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 48,
    minWidth: 96,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: COLORS.bg3,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  searchButtonDisabled: {
    opacity: 0.5,
  },
  searchButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  lookupMessage: {
    fontSize: 12,
    marginTop: 8,
    color: COLORS.textDim,
  },
  lookupMessageSuccess: {
    color: COLORS.success,
  },
  lookupMessageInfo: {
    color: COLORS.blue,
  },
  lookupMessageError: {
    color: COLORS.danger,
  },

  // Chip row spacing within a field
  chipRowSpacing: {
    marginTop: 10,
  },

  // Email suggestions
  emailSuggestions: {
    backgroundColor: COLORS.bg3,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 10,
    marginTop: 6,
    overflow: 'hidden',
  },
  emailSuggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lineSoft,
  },
  emailSuggestionText: {
    color: COLORS.blue,
    fontSize: 14,
    fontWeight: '500',
  },

  // StickyCTA bar
  ctaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.bg2,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 12,
    padding: 10,
  },
  ctaPlate: {
    flex: 1,
    paddingHorizontal: 10,
    minWidth: 80,
  },
  ctaPlateLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  ctaPlateValue: {
    fontFamily: 'monospace',
    fontSize: 16,
    color: COLORS.orange,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 2,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: 'transparent',
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: COLORS.orange,
    minHeight: 48,
  },
  saveBtnDisabled: {
    backgroundColor: COLORS.bg3,
    opacity: 0.6,
  },
  saveBtnText: {
    color: COLORS.black,
    fontSize: 14,
    fontWeight: '700',
  },
  saveBtnTextDisabled: {
    color: COLORS.textMuted,
  },
});
