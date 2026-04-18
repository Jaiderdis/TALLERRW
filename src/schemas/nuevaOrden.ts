/**
 * Schemas Zod para el formulario de NuevaOrden.
 *
 * REQUISITO: ejecutar `npm install zod` antes de usar este archivo.
 */
import { z } from 'zod';

export const nuevaOrdenSchema = z.object({
  serviciosIds: z
    .array(z.number())
    .min(1, 'Selecciona al menos un servicio'),

  tecnicoId: z
    .number({ required_error: 'Asigna un técnico' })
    .positive('Asigna un técnico'),

  prioridad: z.enum(['Normal', 'Urgente', 'Inmediato']),

  km: z
    .string()
    .min(1, 'Ingresa el kilometraje')
    .refine((v) => !isNaN(parseInt(v, 10)) && parseInt(v, 10) >= 0, {
      message: 'Ingresa un kilometraje válido',
    }),

  observaciones: z.string().optional(),
});

export type NuevaOrdenFormValues = z.infer<typeof nuevaOrdenSchema>;
