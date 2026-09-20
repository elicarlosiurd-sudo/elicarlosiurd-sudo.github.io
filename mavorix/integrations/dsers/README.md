# MAVORIX → DSers por CSV

Preparação para o canal CSV no plano Basic, sem dependência da Shopify e sem assinatura adicional. Este diretório contém um exportador local; executar o código **não cadastra produtos, não envia pedidos e não realiza pagamentos**.

## Situação verificada em 20/09/2026

- Nova conta com Basic e CSV conectado; catálogo vazio.
- AliExpress ainda precisa ser autorizado. A página de autorização foi bloqueada pela política de segurança do navegador remoto; o titular precisa concluir no próprio navegador.
- O checkout de `mavorix/index.html` é demonstrativo. Ainda faltam pagamento real e armazenamento de pedidos para alimentar este exportador.
- API do DSers não ativada. Requisitos e limites estão em [API.md](API.md).

O Basic não cobra mensalidade. Mercadorias, frete e eventuais taxas da operação não estão incluídos. O limite de três lojas não implica três canais de venda: confira a combinação de canais permitida antes de adicionar outro. [Planos oficiais](https://www.dsers.com/pricing).

## Como usar o canal

1. Entre no [painel DSers](https://www.dsers.com/application/home). Vincule o fornecedor em **Configurar → Gestão do aplicativo → AliExpress → Adicionar contas**.
2. Por enquanto, mantenha produtos e pedidos vazios, conforme a orientação do titular.
3. Quando houver autorização para cadastrar produtos, defina IDs e SKUs estáveis por variante, exporte o arquivo de produtos e carregue em **Carregar CSV → Produto**. Confira o mapeamento real do fornecedor em **Meus Produtos**.
4. Após existir checkout real, gere o arquivo apenas com pedidos cujo pagamento foi confirmado pelo sistema de pedidos. Carregue em **Carregar CSV → Pedidos**, confira destinatário, variante, quantidade e frete antes de comprar do fornecedor.
5. Registre quais números de pedido foram enviados. Não reenvie um lote sem conferir o resultado da importação anterior.

O CSV exige operação manual no painel. A aceitação de um arquivo preenchido ainda não foi testada no DSers, pois não foi autorizado cadastrar produtos na nova conta. [Guia de produtos](https://help.dsers.com/import-products-via-csv/), [guia de pedidos](https://help.dsers.com/place-csv-orders/).

## Exportação local

Requer Node.js 22 ou superior, sem instalar pacotes. Abra o terminal nesta pasta. Use arquivos de entrada e saída em uma pasta privada **fora do repositório e da pasta publicada do site**.

```sh
# Gera apenas cabeçalhos a partir da entrada vazia incluída.
node export.mjs products input.empty.json /caminho/privado/produtos.csv
node export.mjs orders input.empty.json /caminho/privado/pedidos.csv

# Com dados reais vindos do futuro sistema de pedidos:
node export.mjs orders /caminho/privado/lote.json /caminho/privado/lote.csv

# Verificação local com dados sintéticos; não envia nada.
node --test csv.test.mjs
```

O arquivo JSON contém `products`, `orders` e `exportedOrderNumbers` (listas). `input.empty.json` não contém produtos, fornecedores ou clientes. Não foi criado mapeamento para os produtos demonstrativos da vitrine.

### Cadastro informado em `products`

Cada elemento corresponde a uma variante. Use **strings** para os códigos, mesmo que sejam numéricos.

| Campo | Conteúdo |
| --- | --- |
| `productId` | ID permanente do produto na loja |
| `sku` | SKU permanente da variante na loja |
| `supplierUrl` | Opcional: URL HTTPS direta do produto no AliExpress |
| `supplierSku` | Opcional: SKU da variante do fornecedor, obtido no DSers |

O exportador verifica a estrutura desses dados; ele não confirma se o produto existe no fornecedor, sua procedência, preço, estoque ou prazo. O mapeamento e a escolha de fornecedor precisam ser conferidos no DSers antes de encaminhar pedidos.

### Pedidos em `orders`

| Campo | Conteúdo |
| --- | --- |
| `orderNumber` | Número único e estável; obrigatório nesta implementação |
| `date` | Data válida em `AAAA-MM-DD` |
| `paymentStatus` | `paid`, informado por uma fonte de pedidos confiável |
| `memo` | Mensagem opcional ao fornecedor |
| `items` | Lista de itens com `productId`, `sku` e `quantity` (inteiro positivo) |
| `shipping` | Objeto com os campos de entrega abaixo |

| Campo de `shipping` | Conteúdo |
| --- | --- |
| `country` | `Brazil`; esta versão contempla somente entregas no Brasil |
| `name` | Nome do destinatário |
| `phone` | De 10 a 15 dígitos, com `+` opcional; inclua o código do país |
| `email` | Opcional |
| `address` | Rua e número |
| `address2` | Bairro/complemento; obrigatório no guia oficial |
| `province`, `city` | Nomes conforme as opções do fornecedor |
| `zip` | CEP como string de oito dígitos |
| `cpf` | CPF como string de onze dígitos, validado por dígitos verificadores |

O guia pede o nome completo do país, apesar do cabeçalho `Country(Short Name of Country)`. O exportador utiliza `Brazil`. Se a cidade não estiver na lista do fornecedor, o guia orienta `other` em `city` e o nome da cidade em `address2`. Confira isso no painel. A validação de CPF verifica apenas o formato e os dígitos, não titularidade ou situação cadastral.

`exportedOrderNumbers` lista os números já exportados em lotes anteriores. O programa rejeita repetições nessa lista e no lote atual. Não há banco de dados nem atualização automática do histórico; a futura API deverá persistir esse controle. O valor `paid` não consulta um banco ou gateway de pagamentos: ele só é confiável quando produzido por um sistema de pedidos que confirme a transação.

### Formato e limites

Os cabeçalhos reproduzem, na mesma ordem, os modelos oficiais `import_products.xlsx` e `import_orders.xlsx` baixados no painel. A saída é CSV UTF-8 com BOM, vírgulas, aspas e finais de linha CRLF. O limite local é inferior a 8.000.000 bytes, de acordo com o aviso de upload inferior a 8 MB.

O programa preserva IDs longos e zeros à esquerda, escapa vírgulas/aspas/quebras de linha e rejeita entradas que poderiam virar fórmulas. Isso não impede o Excel de converter códigos ao abrir um CSV: importe as colunas de códigos como **Texto** ou use o arquivo gerado diretamente, sem regravá-lo no Excel. Um erro em qualquer item bloqueia o lote inteiro. A saída nunca sobrescreve um arquivo existente.

Os modelos oficiais podem ser baixados novamente no próprio painel. Nenhum dado de cliente ou credencial deve ser incluído neste repositório público.
