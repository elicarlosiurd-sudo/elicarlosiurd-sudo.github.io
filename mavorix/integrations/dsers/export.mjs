import { readFile, writeFile } from 'node:fs/promises';
import { productsCsv, ordersCsv } from './csv.mjs';

const [mode, inputPath, outputPath, ...extra] = process.argv.slice(2);
try {
  if (!['products', 'orders'].includes(mode) || !inputPath || !outputPath || extra.length) {
    throw new Error('Uso: node export.mjs products|orders entrada.json saida.csv');
  }
  let input;
  try { input = JSON.parse(await readFile(inputPath, 'utf8')); }
  catch { throw new Error('Não foi possível ler o arquivo de entrada como JSON.'); }
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('A entrada deve ser um objeto JSON.');
  const result = mode === 'products' ? productsCsv(input.products) :
    ordersCsv(input.orders, input.products, { exportedOrderNumbers: input.exportedOrderNumbers });
  // Não sobrescrever lotes anteriores nem imprimir dados pessoais no terminal.
  await writeFile(outputPath, result, { encoding: 'utf8', flag: 'wx', mode: 0o600 });
  console.log('CSV gerado. Revise o arquivo antes de carregar no DSers. Nenhum dado foi enviado.');
} catch (error) {
  console.error(error.code === 'EEXIST' ? 'O arquivo de saída já existe; escolha outro nome.' :
    error.code ? 'Não foi possível gravar o arquivo de saída.' : error.message);
  process.exitCode = 1;
}
