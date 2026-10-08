import bcrypt from 'bcryptjs';
export async function initializeAdmin(prisma, env = process.env) {
  const email = env.ADMIN_BOOTSTRAP_EMAIL;
  const password = env.ADMIN_BOOTSTRAP_PASSWORD;
  if (!email || !password) return;
  if (password.length < 16) throw new Error('Admin bootstrap password must have at least 16 characters');
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return;
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({ data: { email, name: 'Any Needs Admin', role: 'ADMIN', passwordHash } });
  console.log('Created initial administrator account');
}
