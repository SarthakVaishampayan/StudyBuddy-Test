const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export const apiJson = async (
  path,
  { token, method = 'GET', body, extraHeaders } = {}
) => {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(extraHeaders || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  return { res, data };
};
