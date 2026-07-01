import { z } from "zod";
import { schemaParse } from "@/shared/lib/validation";

const SpotifyTrackUriBrand = Symbol();
const SpotifyTrackUriSchema = z.string().min(1).brand<typeof SpotifyTrackUriBrand>();

export type SpotifyTrackUri = z.infer<typeof SpotifyTrackUriSchema>;

export const SpotifyTrackUri = {
  schema: SpotifyTrackUriSchema,
  parse: schemaParse(SpotifyTrackUriSchema),
} as const;
