import { z } from "zod";
import { schemaParse } from "@/shared/lib/validation";

const SpotifyTrackIdBrand = Symbol();
const SpotifyTrackIdSchema = z.string().min(1).brand<typeof SpotifyTrackIdBrand>();

export type SpotifyTrackId = z.infer<typeof SpotifyTrackIdSchema>;

export const SpotifyTrackId = {
  schema: SpotifyTrackIdSchema,
  parse: schemaParse(SpotifyTrackIdSchema),
} as const;
