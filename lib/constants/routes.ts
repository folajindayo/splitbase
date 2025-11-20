/**
 * Route Constants
 */

export const ROUTES = {
  HOME: '/',
  CREATE: '/create',
  SPLITS: '/splits',
  SPLIT_DETAIL: (address: string) => `/splits/${address}`,
};

export const API_ROUTES = {
  CREATE_SPLIT: '/api/splits/create',
  GET_SPLITS: '/api/splits',
  DISTRIBUTE: '/api/splits/distribute',
};

