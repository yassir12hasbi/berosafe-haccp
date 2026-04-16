const trimSlashes = (value: string) => value.replace(/^\/+|\/+$/g, '');

const API_ORIGIN = 'http://192.168.100.44:8000';//'https://www.testing-tracabilite.berocert.ma'
const API_PREFIX = 'api';
const API_VERSION = 'v1';
const API_TIMEOUT_MS = 20000;

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
  timeout: API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
} as const;