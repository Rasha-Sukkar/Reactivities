import { z } from "zod";
import { requiredString } from "../util/util";

export const loginSchema = z.object({
    email: z.string().email({ message: 'Invalid email address' }),
    password: requiredString('Password').min(6, { message: 'Password must be at least 6 characters' })
});

export type LoginSchema = z.infer<typeof loginSchema>;
