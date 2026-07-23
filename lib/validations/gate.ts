import { z } from "zod";

export const gateLoginBodySchema = z.object({
  password: z.string(),
});

export type GateLoginBody = z.infer<typeof gateLoginBodySchema>;
