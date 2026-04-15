import axios from 'axios';

export interface AppErrorDetails {
  title: string;
  message: string;
  statusCode?: number;
  validationErrors?: string[];
}

const DEFAULT_ERROR_TITLE = 'Erreur';
const DEFAULT_ERROR_MESSAGE = 'Une erreur est survenue. Veuillez reessayer.';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const toText = (value: unknown): string | null => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return null;
};

const extractValidationErrors = (errors: unknown): string[] => {
  if (!isRecord(errors)) {
    return [];
  }

  return Object.entries(errors).flatMap(([field, messages]) => {
    if (!Array.isArray(messages)) {
      const message = toText(messages);
      return message ? [`${field}: ${message}`] : [];
    }

    return messages
      .map((message) => toText(message))
      .filter((message): message is string => Boolean(message))
      .map((message) => `${field}: ${message}`);
  });
};

export const getErrorDetails = (
  error: unknown,
  fallbackTitle = DEFAULT_ERROR_TITLE,
  fallbackMessage = DEFAULT_ERROR_MESSAGE
): AppErrorDetails => {
  if (axios.isAxiosError(error)) {
    const statusCode = error.response?.status;
    const data = error.response?.data;
    const validationErrors = extractValidationErrors(isRecord(data) ? data.errors : undefined);

    if (validationErrors.length > 0) {
      return {
        title: fallbackTitle,
        message: validationErrors.join('\n'),
        statusCode,
        validationErrors,
      };
    }

    const directMessage =
      (isRecord(data) && (
        toText(data.message) ??
        toText(data.error) ??
        toText(data.details)
      )) ??
      toText(error.message);

    if (statusCode === 401) {
      return {
        title: 'Acces refuse',
        message: 'Votre session a expire ou vos identifiants sont invalides.',
        statusCode,
      };
    }

    if (statusCode === 403) {
      return {
        title: 'Acces refuse',
        message: directMessage ?? "Vous n'avez pas les droits necessaires pour cette action.",
        statusCode,
      };
    }

    if (statusCode === 404) {
      return {
        title: fallbackTitle,
        message: directMessage ?? "La ressource demandee est introuvable.",
        statusCode,
      };
    }

    if (statusCode === 422) {
      return {
        title: 'Donnees invalides',
        message: directMessage ?? fallbackMessage,
        statusCode,
      };
    }

    if (error.code === 'ECONNABORTED') {
      return {
        title: 'Delai depasse',
        message: 'Le serveur met trop de temps a repondre. Verifiez votre connexion et reessayez.',
      };
    }

    if (!error.response) {
      return {
        title: 'Connexion impossible',
        message: 'Impossible de joindre le serveur. Verifiez votre connexion internet.',
      };
    }

    return {
      title: fallbackTitle,
      message: directMessage ?? fallbackMessage,
      statusCode,
    };
  }

  if (error instanceof Error) {
    return {
      title: fallbackTitle,
      message: error.message || fallbackMessage,
    };
  }

  return {
    title: fallbackTitle,
    message: fallbackMessage,
  };
};

export const getErrorMessage = (
  error: unknown,
  fallbackMessage = DEFAULT_ERROR_MESSAGE
): string => getErrorDetails(error, DEFAULT_ERROR_TITLE, fallbackMessage).message;
