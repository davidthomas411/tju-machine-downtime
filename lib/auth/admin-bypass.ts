export function isAdminBypassEnabled() {
  return process.env.ALLOW_VIEWER_ADMIN === 'true'
}
