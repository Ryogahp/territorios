export interface Territorio {
  numero: number;
  letras: string[];
}

export interface Visita {
  id?: number;
  fecha: string;
  persona: string;
  territorio_id: number;
  cuadras: string[];
  created_at?: string;
}

export const TERRITORIOS: Territorio[] = [
  { numero: 1, letras: ['A','B','C','D','E','F','G','H','I'] },
  { numero: 2, letras: ['A','B','C','D','E','F','G','H','I','J','K'] },
  { numero: 3, letras: ['A','B','C','D','E','F','G','H','I'] },
  { numero: 4, letras: ['A','B','C','D','E','F','G','H','I'] },
  { numero: 5, letras: ['A','B','C','D','E','F','G','H','I','J'] },
  { numero: 6, letras: ['A','B','C','D','E','F','G','H','I','J','K','L'] },
  { numero: 7, letras: ['A','B','C','D','E','F','G','H','I'] },
  { numero: 8, letras: ['A','B','C','D','E','F'] },
  { numero: 9, letras: ['A','B','C','D','E','F','G'] },
  { numero: 10, letras: ['A','B','C','D','E','F','G','H'] },
  { numero: 11, letras: ['A','B','C','D','E','F'] },
  { numero: 12, letras: ['A','B','C','D','E','F','G','H','I','J'] },
  { numero: 13, letras: ['A','B','C','D','E','F','G','H','I','J','K'] },
  { numero: 14, letras: ['A','B','C','D','E'] },
  { numero: 15, letras: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N'] },
  { numero: 16, letras: ['A','B','C','D','E','F','G'] },
  { numero: 17, letras: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W'] },
  { numero: 18, letras: ['A','B','C','D','E','F','G','H'] },
  { numero: 19, letras: ['A','B','C','D','E','F','G'] },
  { numero: 20, letras: ['A','B','C','D','E','F','G','H','I','J','K','L','M'] },
  { numero: 21, letras: ['A','B','C','D','E','F','G','H','I'] },
  { numero: 22, letras: ['A','B','C','D','E','F'] },
  { numero: 23, letras: ['A','B','C','D','E','F','G','H'] },
  { numero: 24, letras: ['A','B','C','D','E','F'] },
  { numero: 25, letras: ['A','B','C','D','E'] },
  { numero: 26, letras: ['A','B','C','D','E','F','G','H'] },
  { numero: 27, letras: ['A','B'] },
  { numero: 28, letras: ['A','B','C','D'] },
  { numero: 29, letras: ['A','B','C','D','E','F','G'] },
  { numero: 30, letras: ['A','B','C','D','E','F','G','H'] },
  { numero: 31, letras: ['A','B','C','D'] },
  { numero: 32, letras: ['A','B','C','D','E','F','G','H'] },
  { numero: 33, letras: ['A','B','C','D','E'] },
  { numero: 34, letras: ['A','B','C','D','E'] },
  { numero: 35, letras: ['A','B','C','D','E','F','G'] },
  { numero: 36, letras: ['A','B','C','D','E','F','G','H'] },
  { numero: 37, letras: ['A','B','C'] },
  { numero: 38, letras: ['A','B','C','D','E'] },
  { numero: 39, letras: ['A','B','C','D','E'] },
  { numero: 40, letras: ['A','B','C'] },
  { numero: 41, letras: ['A','B','C','D','E'] },
  { numero: 42, letras: ['A','B','C','D','E','F'] },
  { numero: 43, letras: ['A','B','C','D','E'] },
  { numero: 44, letras: ['A','B','C','D'] },
  { numero: 45, letras: ['A','B','C','D','E','F','G','H','I','J'] },
  { numero: 46, letras: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N'] },
  { numero: 47, letras: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N'] },
  { numero: 48, letras: ['A','B','C','D','E','F','G','H','I','J'] },
  { numero: 49, letras: ['A','B','C','D','E','F','G','H','I','J','K','L','M'] },
  { numero: 50, letras: ['A','B','C','D','E','F','G','H','I'] },
  { numero: 51, letras: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N'] },
  { numero: 52, letras: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O'] },
  { numero: 53, letras: ['A','B','C','D','E','F','G','H'] },
  { numero: 54, letras: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W'] },
  { numero: 55, letras: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U'] },
  { numero: 56, letras: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q'] },
  { numero: 57, letras: ['A','B','C','D','E','F','G','H','I','J'] },
  { numero: 58, letras: ['A','B','C','D','E','F','G','H','I','J','K'] },
];
