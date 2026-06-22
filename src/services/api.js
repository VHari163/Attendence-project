const BASE_URL = import.meta.env.VITE_GAS_WEBAPP_URL || 'https://script.google.com/macros/s/AKfycbyvBI240wFDYypI8iSDK7Les_g9zdRud-zEanZAmvl-ezJrKW9nTU30vvpaKBUFThDwhw/exec'


export async function postJson(action, payload) {
  if (!BASE_URL) {
    throw new Error(
      'Missing VITE_GAS_WEBAPP_URL. Set it to your Google Apps Script Web App URL.',
    )
  }

  // Use GET to avoid CORS preflight issues with Apps Script web app.
  // Backend `doPost(e)` reads both query params (`action`) and JSON body (`postData`).
  // Passing JSON as query string is not reliable, so we still do POST;
  // however we can optionally switch to `fetch(url, { mode: 'no-cors' })` is NOT acceptable (opaque).
  // The correct fix is server-side: add CORS headers from GAS.
  const url = `${BASE_URL}?action=${encodeURIComponent(action)}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload ?? {}),
    mode: 'cors',
    credentials: 'omit',
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

