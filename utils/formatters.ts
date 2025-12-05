/**
 * Formata nomes próprios com a primeira letra de cada palavra em maiúscula
 * Exceto artigos e preposições (de, do, dos, da, das, e, a, o, os, as)
 */
export function formatarNomeProprio(nome: string): string {
  if (!nome) return '';

  // Palavras que não devem ser capitalizadas (exceto se forem a primeira palavra)
  const excecoes = ['de', 'do', 'dos', 'da', 'das', 'e', 'a', 'o', 'os', 'as'];

  const palavras = nome.trim().toLowerCase().split(/\s+/);

  const formatadas = palavras.map((palavra, index) => {
    // Se for a primeira palavra, sempre capitaliza
    if (index === 0) {
      return palavra.charAt(0).toUpperCase() + palavra.slice(1);
    }

    // Se for uma exceção, mantém minúscula
    if (excecoes.includes(palavra)) {
      return palavra;
    }

    // Caso contrário, capitaliza
    return palavra.charAt(0).toUpperCase() + palavra.slice(1);
  });

  return formatadas.join(' ');
}

// Alias para compatibilidade
export const capitalizeName = formatarNomeProprio;

/**
 * Formata um número para moeda brasileira (R$)
 * @param value - Valor numérico a ser formatado
 * @param compact - Se true, usa notação compacta (ex: R$ 45,9 mil)
 * @returns String formatada em moeda brasileira
 */
export function formatCurrency(value: number, compact: boolean = false): string {
  if (compact) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      compactDisplay: 'short',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1
    }).format(value);
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

/**
 * Formata entrada de texto para moeda enquanto o usuário digita
 * @param value - String com o valor digitado
 * @returns String formatada em moeda
 */
export function formatCurrencyInput(value: string): string {
  // Remove tudo exceto números
  const numericValue = value.replace(/\D/g, '');

  if (!numericValue) return '';

  // Converte para número (centavos)
  const numberValue = parseInt(numericValue, 10) / 100;

  // Formata como moeda
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numberValue);
}

/**
 * Converte string de moeda formatada para número
 * @param value - String formatada (ex: "R$ 1.234,56")
 * @returns Número decimal
 */
export function parseCurrencyInput(value: string): number {
  // Remove tudo exceto números
  const numericValue = value.replace(/\D/g, '');

  if (!numericValue) return 0;

  // Converte de centavos para reais
  return parseInt(numericValue, 10) / 100;
}

/**
 * Retorna apenas os dígitos de uma string formatada de moeda
 * @param value - String formatada (ex: "R$ 1.234,56")
 * @returns String com apenas números (ex: "123456")
 */
export function getNumericValue(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Formata uma data ISO sem conversão de timezone
 * Evita o problema de datas mudarem devido ao fuso horário
 * @param dataISO - String da data em formato ISO (ex: "2025-12-01T00:00:00.000Z")
 * @param formato - Formato desejado: 'curto' (01 dez, 2025) ou 'completo' (01 de dezembro de 2025)
 * @returns String formatada em português brasileiro
 */
export function formatarDataSemTimezone(dataISO: string, formato: 'curto' | 'completo' = 'curto'): string {
  // Extrair ano, mês e dia diretamente da string sem conversão de timezone
  // Suporta tanto formato "2025-12-01T00:00:00" quanto "2025-12-01 00:00:00"
  const dataParte = dataISO.includes('T') ? dataISO.split('T')[0] : dataISO.split(' ')[0];

  // Extrair componentes da data e subtrair 1 dia para compensar UTC
  const [ano, mes, dia] = dataParte.split('-');
  const dataObj = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
  dataObj.setDate(dataObj.getDate() - 1);

  const anoFinal = dataObj.getFullYear().toString();
  const mesFinal = dataObj.getMonth();
  const diaFinal = dataObj.getDate().toString().padStart(2, '0');

  const meses = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];

  const mesesCurtos = [
    'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
    'jul', 'ago', 'set', 'out', 'nov', 'dez'
  ];

  const mesNome = formato === 'curto' ? mesesCurtos[mesFinal] : meses[mesFinal];

  if (formato === 'curto') {
    return `${diaFinal} de ${mesNome}, ${anoFinal}`;
  } else {
    return `${diaFinal} de ${mesNome} de ${anoFinal}`;
  }
}
