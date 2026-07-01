import { z } from "zod";
import { schemaParse } from "@/shared/lib/validation";

const PlaylistIdBrand = Symbol();
const PlaylistIdSchema = z.string().min(1).brand<typeof PlaylistIdBrand>();

export type PlaylistId = z.infer<typeof PlaylistIdSchema>;

export const PlaylistId = {
  schema: PlaylistIdSchema,
  parse: schemaParse(PlaylistIdSchema),
} as const;
