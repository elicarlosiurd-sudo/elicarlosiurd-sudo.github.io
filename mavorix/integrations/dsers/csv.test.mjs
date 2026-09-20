import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { productsCsv, ordersCsv, isValidCpf, PRODUCT_HEADERS, ORDER_HEADERS } from './csv.mjs';

// Dados sintéticos usados somente nos testes locais. Não importar no DSers.
const products = [
  { productId: '0001234567890123456789', sku: 'VAR-A' },
  { productId: '0001234567890123456789', sku: 'VAR-B' },
];
function order() {
  return {
    orderNumber: 'TESTE-0001', date: '2026-09-20', paymentStatus: 'paid',
    shipping: { country: 'Brazil', name: 'Teste automatizado', phone: '+5500000000000',
      email: 'teste@example.invalid', address: 'Rua de Teste 0', address2: 'Bairro de Teste',
      province: 'São Paulo', city: 'São Paulo', zip: '01000000', cpf: '52998224725' },
    items: [{ productId: products[0].productId, sku: 'VAR-A', quantity: 2 }],
  };
}

test('modelos vazios têm somente cabeçalhos oficiais, BOM e CRLF', () => {
  assert.equal(productsCsv([]), '\uFEFF"' + PRODUCT_HEADERS.join('","') + '"\r\n');
  assert.equal(ordersCsv([], []), '\uFEFF"' + ORDER_HEADERS.join('","') + '"\r\n');
  assert.equal(ORDER_HEADERS.length, 23);
});

test('preserva IDs longos, zeros e escapa aspas/vírgulas sem alterar o SKU', () => {
  const csv = productsCsv([{ ...products[0], sku: 'VAR,"A"' }]);
  assert.ok(csv.includes('"0001234567890123456789","VAR,""A"""'));
  assert.throws(() => productsCsv([{ productId: 123, sku: 'A' }]), /texto entre aspas/);
});

test('rejeita fórmulas, códigos duplicados e links fora do AliExpress', () => {
  for (const sku of ['=1+1', ' \t@SUM(1)', '+1', '-1', 'A\nB']) {
    assert.throws(() => productsCsv([{ ...products[0], sku }]));
  }
  assert.throws(() => productsCsv([products[0], products[0]]), /repetidos/);
  assert.throws(() => productsCsv([{ ...products[0], supplierUrl: 'https://aliexpress.com.example.invalid/item/1' }]), /AliExpress/);
  assert.throws(() => productsCsv([{ ...products[0], supplierUrl: 'http://aliexpress.com/item/1' }]), /HTTPS/);
  assert.ok(productsCsv([{ ...products[0], supplierUrl: 'https://pt.aliexpress.com/item/123.html' }]).includes('https://pt.aliexpress.com/item/123.html'));
});

test('pedido com duas variantes mantém o mesmo número e dados de envio em ambas as linhas', () => {
  const sample = order();
  sample.items.push({ productId: products[1].productId, sku: 'VAR-B', quantity: 1 });
  const lines = ordersCsv([sample], products).trimEnd().split('\r\n');
  assert.equal(lines.length, 3);
  for (const line of lines.slice(1)) {
    assert.equal(line.split('","').length, 23);
    assert.ok(line.startsWith('"TESTE-0001","2026-09-20","Brazil"'));
    assert.ok(line.includes('"+5500000000000"'));
    assert.ok(line.includes('"01000000"'));
    assert.ok(line.endsWith('"52998224725","","","",""'));
  }
});

test('rejeita lote inteiro com pedido não pago ou sem dados de entrega válidos', () => {
  const changes = [
    sample => { sample.paymentStatus = 'pending'; },
    sample => { sample.date = '2026-02-30'; },
    sample => { sample.shipping.country = 'BR'; },
    sample => { sample.shipping.cpf = '11111111111'; },
    sample => { sample.shipping.zip = 1000000; },
    sample => { sample.shipping.address2 = ''; },
    sample => { sample.shipping.phone = '+55 (00) 00000-0000'; },
    sample => { sample.items[0].quantity = 1.5; },
    sample => { sample.items[0].sku = 'DESCONHECIDO'; },
    sample => { sample.memo = '=HYPERLINK("https://example.invalid")'; },
  ];
  for (const change of changes) {
    const invalid = order(); invalid.orderNumber = 'TESTE-0002'; change(invalid);
    assert.throws(() => ordersCsv([order(), invalid], products));
  }
});

test('bloqueia repetição no lote e no histórico informado', () => {
  assert.throws(() => ordersCsv([order(), order()], products), /já exportado/);
  assert.throws(() => ordersCsv([order()], products, { exportedOrderNumbers: ['TESTE-0001'] }), /já exportado/);
  const duplicate = order(); duplicate.items.push({ ...duplicate.items[0] });
  assert.throws(() => ordersCsv([duplicate], products), /SKU repetido/);
});

test('valida os dois dígitos verificadores do CPF', () => {
  assert.equal(isValidCpf('52998224725'), true);
  for (const cpf of ['52998224726', '52998224735', '00000000000', '529.982.247-25', 52998224725]) {
    assert.equal(isValidCpf(cpf), false);
  }
});

test('mantém vírgulas, aspas e quebras de linha em observações dentro da mesma célula', () => {
  const sample = order(); sample.memo = 'Embrulhar, com cuidado\nEtiqueta "presente"';
  assert.ok(ordersCsv([sample], products).includes('"Embrulhar, com cuidado\nEtiqueta ""presente"""'));
});

test('impede arquivos acima do limite de upload', () => {
  assert.throws(() => productsCsv([{ productId: 'A', sku: 'a'.repeat(8_000_000) }]), /8 MB/);
});

test('CLI gera arquivo completo e recusa sobrescrita ou exportação parcial', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'mavorix-dsers-'));
  try {
    const input = join(dir, 'input.json'); const output = join(dir, 'output.csv');
    const cli = new URL('./export.mjs', import.meta.url);
    await writeFile(input, JSON.stringify({ products, orders: [order()] }));
    const run = () => spawnSync(process.execPath, [cli.pathname, 'orders', input, output], { encoding: 'utf8' });
    assert.equal(run().status, 0);
    const original = await readFile(output, 'utf8');
    assert.equal(original, ordersCsv([order()], products));
    assert.equal(run().status, 1);
    assert.equal(await readFile(output, 'utf8'), original);
    await rm(output);
    const invalid = order(); invalid.paymentStatus = 'pending';
    await writeFile(input, JSON.stringify({ products, orders: [invalid] }));
    assert.equal(run().status, 1);
    await assert.rejects(readFile(output), { code: 'ENOENT' });
  } finally { await rm(dir, { recursive: true, force: true }); }
});
