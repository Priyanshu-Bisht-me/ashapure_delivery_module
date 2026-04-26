export const AUTH_STORAGE_KEY = 'aasapure-auth';

export const readStoredAuth = () => {
  try {
    const rawValue = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return rawValue ? JSON.parse(rawValue) : null;
  } catch {
    return null;
  }
};

export const writeStoredAuth = (value) => {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(value));
};

export const clearStoredAuth = () => {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
};
