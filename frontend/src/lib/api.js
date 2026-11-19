export async function api(path, { method = 'GET', body, token, signal } = {}) {
  const res = await fetch(path, {
    method,
    signal,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.error || `Erreur ${res.status}`)
    err.status = res.status
    throw err
  }
  return data
}
