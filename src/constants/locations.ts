// src/lib/locations.ts

export const ORIGENS = ['Estacionamento UCSAL', 'Portão UCSAL'] as const;

export const DESTINOS = [
  'Metrô Pituaçu Paralela',
  'Metrô Pituaçu Terminal',
  'Metrô Flamboyant',
] as const;

export type Origem = (typeof ORIGENS)[number];
export type Destino = (typeof DESTINOS)[number];
