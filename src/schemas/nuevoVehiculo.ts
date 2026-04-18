/**
 * Schemas Zod para el formulario de NuevoVehiculo.
 *
 * REQUISITO: ejecutar `npm install zod` antes de usar este archivo.
 */
import { z } from 'zod';

export const clienteSchema = z.object({
  cedula: z
    .string()
    .min(5, 'La cédula debe tener al menos 5 caracteres')
    .regex(/^\d+$/, 'La cédula solo debe contener números'),

  nombre: z
    .string()
    .min(2, 'Ingresa el nombre completo del cliente'),

  telefono: z.string().optional(),

  email: z
    .string()
    .email('Ingresa un email válido')
    .optional()
    .or(z.literal('')),
});

export const vehiculoSchema = z.object({
  marca: z.string().min(1, 'Selecciona o escribe la marca'),
  modelo: z.string().min(1, 'Selecciona o escribe el modelo'),
  anio: z
    .string()
    .regex(/^\d{4}$/, 'El año debe tener 4 dígitos')
    .refine(
      (v) => {
        const n = parseInt(v, 10);
        return n >= 1950 && n <= new Date().getFullYear() + 1;
      },
      { message: 'Ingresa un año válido' }
    ),
  color: z.string().optional(),
});

export const nuevoVehiculoSchema = clienteSchema.merge(vehiculoSchema);

export type NuevoVehiculoFormValues = z.infer<typeof nuevoVehiculoSchema>;
