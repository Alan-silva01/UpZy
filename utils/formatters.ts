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
