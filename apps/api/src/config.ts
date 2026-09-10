import "dotenv/config";
import { z } from "zod";
const schema=z.object({DATABASE_URL:z.string().min(1),PORT:z.coerce.number().default(4000),WEB_ORIGIN:z.string().default("http://localhost:3000"),JWT_SECRET:z.string().min(16),OTP_SECRET:z.string().min(16),OTP_PROVIDER:z.string().default("console"),RAZORPAY_KEY_ID:z.string().optional(),RAZORPAY_KEY_SECRET:z.string().optional()});
export const config=schema.parse(process.env);
