/** Bind a development bundle's resources and identity to an ad-hoc signature. */
export async function signMacOSBundle(bundle: string, nestedExecutables: string[] = []): Promise<void> {
  if (process.platform !== 'darwin') return
  for (const target of [...nestedExecutables, bundle]) {
    const proc = Bun.spawn(['/usr/bin/codesign', '--force', '--sign', '-', '--timestamp=none', target], { stdout: 'pipe', stderr: 'pipe' })
    const [stderr, code] = await Promise.all([new Response(proc.stderr).text(), proc.exited])
    if (code !== 0) throw new Error(`Could not sign native bundle ${target}: ${stderr.trim()}`)
  }
  const verification = Bun.spawn(['/usr/bin/codesign', '--verify', '--strict', bundle], { stdout: 'pipe', stderr: 'pipe' })
  const [stderr, code] = await Promise.all([new Response(verification.stderr).text(), verification.exited])
  if (code !== 0) throw new Error(`Invalid native bundle signature: ${stderr.trim()}`)
}
