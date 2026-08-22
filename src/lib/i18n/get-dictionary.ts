import { ptBR } from "./dictionaries/pt-br";

const dictionaries = {
  "pt-BR": ptBR
} as const;

export type Locale = keyof typeof dictionaries;

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}
