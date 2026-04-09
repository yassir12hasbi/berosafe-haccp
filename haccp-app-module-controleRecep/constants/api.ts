const trimSlashes = (value: string) => value.replace(/^\/+|\/+$/g, '');

const API_ORIGIN =
  process.env.EXPO_PUBLIC_API_ORIGIN?.trim() ||
  'http://192.168.1.103:8000';
const API_PREFIX =
  process.env.EXPO_PUBLIC_API_PREFIX?.trim() ||
  'api';
const API_VERSION =
  process.env.EXPO_PUBLIC_API_VERSION?.trim() ||
  '';
const API_TIMEOUT_MS = Number(
  process.env.EXPO_PUBLIC_API_TIMEOUT_MS ||
  10000
);

const baseUrlFromParts = [
  trimSlashes(API_ORIGIN),
  trimSlashes(API_PREFIX),
  trimSlashes(API_VERSION),
]
  .filter(Boolean)
  .join('/');

const API_BASE_URL = baseUrlFromParts;

export const API_CONFIG = {
  origin: API_ORIGIN,
  prefix: API_PREFIX,
  version: API_VERSION,
  baseURL: API_BASE_URL,
  timeout: Number.isFinite(API_TIMEOUT_MS) ? API_TIMEOUT_MS : 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
} as const;
