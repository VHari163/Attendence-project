const BASE_URL = import.meta.env.VITE_GAS_WEBAPP_URL || ''

export async function postJson(action, payload) {
  if (!BASE_URL) {
    throw new Error(
      'Missing VITE_GAS_WEBAPP_URL. Set it to your Google Apps Script Web App URL.',
    )
  }

  const url = `${BASE_URL}?action=${encodeURIComponent(action)}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload ?? {}),
  })

  const text = await res.text()
  let data
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { raw: text }
  }

  if (!res.ok) {
    const msg = data?.error || data?.message || `Request failed (${res.status})`
    throw new Error(msg)
  }

  return data
}

