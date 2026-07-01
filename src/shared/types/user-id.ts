import { z } from "zod";
import { schemaParse } from "@/shared/lib/validation";

const UserIdBrand = Symbol();
const UserIdSchema = z.string().min(1).brand<typeof UserIdBrand>();

export type UserId = z.infer<typeof UserIdSchema>;

export const UserId = {
  schema: UserIdSchema,
  parse: schemaParse(UserIdSchema),
} as const;
