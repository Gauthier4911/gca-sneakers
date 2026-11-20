import { z } from 'zod';

// Les messages sont des CLÉS i18n, traduites à l'affichage (FormField).
export const WHATSAPP_RE = /^\+?[0-9 ]{8,20}$/;

const email = z.string().trim().min(1, 'auth.errors.required').email('auth.errors.email').max(254, 'auth.errors.tooLong');
const password = z.string().min(8, 'auth.errors.passwordShort').max(72, 'auth.errors.tooLong')
  .regex(/[A-Za-zÀ-ÿ]/, 'auth.errors.passwordWeak').regex(/[0-9]/, 'auth.errors.passwordWeak');

export const profileSchema = z.object({
  full_name: z.string().trim().min(2, 'auth.errors.nameShort').max(120, 'auth.errors.tooLong'),
  whatsapp: z.string().trim().regex(WHATSAPP_RE, 'auth.errors.whatsapp'),
  address: z.string().trim().min(5, 'auth.errors.addressShort').max(500, 'auth.errors.tooLong'),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'auth.errors.required').max(72, 'auth.errors.tooLong'),
});

export const forgotSchema = z.object({ email });

export const resetSchema = z.object({ password, passwordConfirm: z.string() })
  .refine((d) => d.password === d.passwordConfirm, { path: ['passwordConfirm'], message: 'auth.errors.passwordMatch' });

export const registerSchema = profileSchema.extend({
  email,
  password,
  passwordConfirm: z.string(),
  website: z.string().max(0).optional(), // champ piège anti-robots (invisible)
}).refine((d) => d.password === d.passwordConfirm, { path: ['passwordConfirm'], message: 'auth.errors.passwordMatch' });

/** Message d'erreur Supabase → clé i18n NON révélatrice (on ne dit jamais si l'email existe). */
export function authErrorKey(error, mode) {
  const msg = `${error?.code ?? ''} ${error?.message ?? ''}`.toLowerCase();
  if (error?.status === 429 || msg.includes('rate limit') || msg.includes('too many')) return 'auth.errors.rateLimit';
  if (msg.includes('banned')) return 'auth.errors.banned';
  if (msg.includes('same_password') || msg.includes('should be different')) return 'auth.errors.samePassword';
  if (mode === 'login') return 'auth.errors.invalidCredentials';
  if (mode === 'register') return 'auth.errors.signupFailed';
  return 'auth.errors.generic';
}

/** Redirection après connexion : uniquement un chemin interne (pas de //site-externe). */
export function safeNext(next, fallback) {
  return typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') && !next.includes('\\') ? next : fallback;
}
