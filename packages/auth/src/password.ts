export async function hashPassword(plain: string): Promise<string> {
  return Bun.password.hash(plain)
}

export async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  return Bun.password.verify(plain, hashed)
}
