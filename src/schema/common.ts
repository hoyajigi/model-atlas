import { z } from 'zod'

export const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD')

export const slug = z
  .string()
  .regex(/^[a-z0-9][a-z0-9._-]*$/, 'lowercase slug expected')

export const SourceMeta = z.object({
  url: z.string().url(),
  as_of: isoDate,
  note: z.string().optional()
})

export const Modality = z.enum([
  'text',
  'text-to-image',
  'image-edit',
  'text-to-video',
  'audio',
  'embedding',
  'multimodal'
])

export type SourceMetaT = z.infer<typeof SourceMeta>
export type ModalityT = z.infer<typeof Modality>
