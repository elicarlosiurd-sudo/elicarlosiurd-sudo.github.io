// Cabeçalhos copiados dos modelos oficiais baixados em 20/09/2026.
export const PRODUCT_HEADERS = Object.freeze([
  'product_id', 'SKU（your product SKU）', 'Supplier_url（Optional）',
  'SKU（Supplier SKU）（Optional）',
]);
export const ORDER_HEADERS = Object.freeze([
  'Order_number', 'Date', 'Country(Short Name of Country)', 'Product_id', 'Sku',
  'Product_count', 'Order_memo', 'Contact_person', 'Mobile_no', 'Email(Optional)',
  'Address', 'Address2', 'Province', 'City', 'ZIP', 'RUT(Chile; Optional)',
  'Personal Clearance ID(Korea, Oman; Optional)',
  'Passport/Alien registration Card Number(Korea, Oman; Optional)',
  'CPF(Brazil; Optional)', 'Turkish ID Number(Turkey; Optional)',
  'Passport Number(Turkey; Optional)', 'RUC(Peru; Optional)', 'RFC/CURP(Mexico; Optional)',
]);

function fail(path, message) { throw new Error(`${path}: ${message}`); }
function object(value, path) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(path, 'deve ser um objeto.');
  return value;
}
function list(value, path) {
  if (!Array.isArray(value)) fail(path, 'deve ser uma lista.');
  return value;
}
function text(value, path, { optional = false, phone = false } = {}) {
  if (value === undefined || value === null || value === '') {
    if (optional) return '';
    fail(path, 'obrigatório.');
  }
  if (typeof value !== 'string') fail(path, 'use texto entre aspas para preservar zeros e códigos longos.');
  const result = value.trim();
  if (!result && !optional) fail(path, 'obrigatório.');
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(result)) fail(path, 'contém caracteres de controle.');
  // Não acrescentar apóstrofos: isso alteraria os identificadores usados no mapeamento.
  if (/^[=+@-]/u.test(result) && !(phone && /^\+?\d{10,15}$/u.test(result))) {
    fail(path, 'começa com um caractere que planilhas podem interpretar como fórmula.');
  }
  return result;
}
function code(value, path, options) {
  const result = text(value, path, options);
  if (/[\r\n\t]/u.test(result)) fail(path, 'códigos não podem conter tabulações ou quebras de linha.');
  return result;
}
function csv(headers, rows) {
  const quote = value => `"${String(value).replaceAll('"', '""')}"`;
  const result = '\uFEFF' + [headers, ...rows].map(row => row.map(quote).join(',')).join('\r\n') + '\r\n';
  if (new TextEncoder().encode(result).byteLength >= 8_000_000) {
    fail('CSV', 'deve ser menor que 8 MB; divida o lote sem separar os itens de um pedido.');
  }
  return result;
}
const key = (id, sku) => JSON.stringify([id, sku]);

function productRows(products) {
  const seen = new Set();
  return list(products, 'products').map((entry, index) => {
    const path = `products[${index}]`;
    const product = object(entry, path);
    const id = code(product.productId, `${path}.productId`);
    const sku = code(product.sku, `${path}.sku`);
    const pair = key(id, sku);
    if (seen.has(pair)) fail(path, 'produto e SKU repetidos no lote.');
    seen.add(pair);
    const url = text(product.supplierUrl, `${path}.supplierUrl`, { optional: true });
    if (url) {
      let parsed;
      try { parsed = new URL(url); } catch { fail(`${path}.supplierUrl`, 'URL inválida.'); }
      if (parsed.protocol !== 'https:' || parsed.username || parsed.password ||
          !(parsed.hostname === 'aliexpress.com' || parsed.hostname.endsWith('.aliexpress.com'))) {
        fail(`${path}.supplierUrl`, 'use o link HTTPS direto do produto no AliExpress.');
      }
    }
    return [id, sku, url, code(product.supplierSku, `${path}.supplierSku`, { optional: true })];
  });
}

export function productsCsv(products) { return csv(PRODUCT_HEADERS, productRows(products)); }

export function isValidCpf(value) {
  if (typeof value !== 'string' || !/^\d{11}$/u.test(value) || /^(\d)\1{10}$/u.test(value)) return false;
  const digits = [...value].map(Number);
  for (const length of [9, 10]) {
    const sum = digits.slice(0, length).reduce((total, digit, i) => total + digit * (length + 1 - i), 0);
    const check = (sum * 10) % 11 % 10;
    if (digits[length] !== check) return false;
  }
  return true;
}

/** Exportação local para entregas no Brasil; não consulta nem envia dados ao DSers. */
export function ordersCsv(orders, products, { exportedOrderNumbers = [] } = {}) {
  const knownProducts = new Set(productRows(products).map(([id, sku]) => key(id, sku)));
  const seenOrders = new Set(list(exportedOrderNumbers, 'exportedOrderNumbers').map((id, i) =>
    code(id, `exportedOrderNumbers[${i}]`)));
  const rows = [];
  list(orders, 'orders').forEach((entry, index) => {
    const path = `orders[${index}]`;
    const order = object(entry, path);
    const number = code(order.orderNumber, `${path}.orderNumber`);
    if (seenOrders.has(number)) fail(path, 'número de pedido repetido ou já exportado.');
    seenOrders.add(number);
    // Esta declaração precisa vir do sistema de pedidos após confirmação do pagamento.
    if (order.paymentStatus !== 'paid') fail(`${path}.paymentStatus`, 'somente pedidos pagos podem ser exportados.');
    const date = code(order.date, `${path}.date`);
    const parsedDate = new Date(`${date}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/u.test(date) || Number.isNaN(parsedDate.getTime()) ||
        parsedDate.toISOString().slice(0, 10) !== date) fail(`${path}.date`, 'use uma data válida no formato AAAA-MM-DD.');
    const shipping = object(order.shipping, `${path}.shipping`);
    const country = code(shipping.country, `${path}.shipping.country`);
    if (country !== 'Brazil') fail(`${path}.shipping.country`, 'esta versão atende Brazil; use o nome completo em inglês.');
    const contact = text(shipping.name, `${path}.shipping.name`);
    const phone = text(shipping.phone, `${path}.shipping.phone`, { phone: true });
    if (!/^\+?\d{10,15}$/u.test(phone)) fail(`${path}.shipping.phone`, 'use 10 a 15 dígitos, com + opcional, sem espaços.');
    const email = text(shipping.email, `${path}.shipping.email`, { optional: true });
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)) fail(`${path}.shipping.email`, 'formato inválido.');
    const address = text(shipping.address, `${path}.shipping.address`);
    const address2 = text(shipping.address2, `${path}.shipping.address2`);
    const province = text(shipping.province, `${path}.shipping.province`);
    const city = text(shipping.city, `${path}.shipping.city`);
    const zip = code(shipping.zip, `${path}.shipping.zip`);
    if (!/^\d{8}$/u.test(zip)) fail(`${path}.shipping.zip`, 'use os 8 dígitos do CEP, sem hífen.');
    const cpf = code(shipping.cpf, `${path}.shipping.cpf`);
    if (!isValidCpf(cpf)) fail(`${path}.shipping.cpf`, 'CPF inválido; use 11 dígitos, sem pontuação.');
    const memo = text(order.memo, `${path}.memo`, { optional: true });
    const items = list(order.items, `${path}.items`);
    if (!items.length) fail(`${path}.items`, 'inclua ao menos um item.');
    const seenItems = new Set();
    items.forEach((entry, itemIndex) => {
      const itemPath = `${path}.items[${itemIndex}]`;
      const item = object(entry, itemPath);
      const id = code(item.productId, `${itemPath}.productId`);
      const sku = code(item.sku, `${itemPath}.sku`);
      const pair = key(id, sku);
      if (!knownProducts.has(pair)) fail(itemPath, 'produto e SKU não encontrados no cadastro informado.');
      if (seenItems.has(pair)) fail(itemPath, 'SKU repetido; consolide a quantidade em um único item.');
      seenItems.add(pair);
      if (!Number.isSafeInteger(item.quantity) || item.quantity < 1) fail(`${itemPath}.quantity`, 'use um inteiro positivo.');
      rows.push([number, date, country, id, sku, item.quantity, memo, contact, phone,
        email, address, address2, province, city, zip, '', '', '', cpf, '', '', '', '']);
    });
  });
  return csv(ORDER_HEADERS, rows);
}
