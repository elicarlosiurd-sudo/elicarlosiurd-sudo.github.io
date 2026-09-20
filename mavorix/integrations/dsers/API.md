# API: preparação e condições para ativação

**Estado: não conectada e sem servidor publicado.** A conta Basic com CSV não comprova acesso à API. Não há chave de DSers no código, e nenhum pedido foi enviado por API.

## O que a documentação oficial disponibiliza

A [Channel App API](https://www.dsers.dev/api/channel_app_api) define chamadas que o DSers fará para um gateway hospedado pelo integrador. O endereço de exemplo `www.your-channel-app-gateway.com` pertence ao integrador: não é um endpoint público de envio de pedidos ao DSers.

O [programa de desenvolvedores](https://www.dsers.com/developers/channel-app/) prevê análise da aplicação. Ainda é necessário confirmar com o DSers a elegibilidade de um canal exclusivo da MAVORIX e a disponibilidade/custo desse acesso. Não presumir que um plano pago resolveria essa condição.

Operações identificadas na documentação versão `2023-07-01`:

| Operação | Responsabilidade do futuro gateway |
| --- | --- |
| `AuthService_GetStoresStatus` | Informar o estado real da loja vinculada |
| `ProductService_GetProductList`, `ProductService_GetProductDetail` | Entregar catálogo e variantes reais |
| `ProductService_SyncProductPrice`, `ProductService_SyncProductStock` | Atualizar dados com autorização e persistência |
| `OrderService_GetOrders` | Disponibilizar pedidos elegíveis, obtidos do sistema de pedidos |
| `OrderService_UpdateOrder` | Persistir alterações de estado |
| `OrderService_CreateFulfillment`, `OrderService_CancelFulfillment` | Registrar ou cancelar atendimento com controle de repetições |

Essa tabela é um recorte para planejamento. Os esquemas completos, paginação, estados e demais operações devem ser implementados a partir da especificação vigente aprovada para a aplicação.

## Contrato confirmado de consulta de estado

Na [operação oficial](https://www.dsers.dev/api/channel_app_api#/operations/AuthService_GetStoresStatus):

```http
GET /api/2023-07-01/stores/status?sellerId=<identificador-da-loja>
```

Resposta documentada: objeto com `status` entre `STORE_STATUS_UNKNOWN`, `STORE_STATUS_AVAILABLE`, `STORE_STATUS_UNAVAILABLE`, `STORE_STATUS_UNBIND` e `STORE_STATUS_UPDATE`. Não responder `AVAILABLE` antes de existir vínculo válido, autorizado e persistido. O mecanismo de autenticação deve ser confirmado no processo de aprovação; não foi presumido um cabeçalho ou segredo que a documentação consultada não forneceu.

## O que falta na MAVORIX

1. **Checkout real:** confirmação de pagamento no servidor e persistência de pedidos, itens, endereço e consentimentos aplicáveis.
2. **Hospedagem de backend:** runtime privado com HTTPS e banco de dados. O site estático no GitHub Pages não executa esse servidor. Ainda não foi identificado um backend disponível para este projeto.
3. **Acesso do DSers:** aprovação, registro da aplicação, URLs de autorização e definição do vínculo da loja.
4. **Segurança e repetição:** validar chamadas conforme o contrato oficial; separar lojas; manter credenciais no servidor; registrar eventos sem expor dados pessoais; impedir processamento repetido.
5. **Validação com o DSers:** testar em ambiente apropriado antes de liberar catálogo, pedidos ou atualizações automáticas.

## Reuso imediato no futuro backend

O módulo `csv.mjs` contém funções puras que podem ser chamadas pelo backend para gerar lotes CSV. O formato de entrada está no [README](README.md). Ele não faz chamadas externas e não constitui uma implementação da Channel App API.

```js
import { ordersCsv } from './csv.mjs';

// paidOrders deve vir do banco, após confirmação confiável do pagamento.
// mappedProducts e alreadyExportedNumbers também devem vir do banco.
const csv = ordersCsv(paidOrders, mappedProducts, {
  exportedOrderNumbers: alreadyExportedNumbers,
});
```

A API futura deve reservar os pedidos de forma atômica antes de preparar um lote, registrar seu resultado e reconciliar falhas. Um array de números no arquivo local não oferece garantia de exclusão mútua entre processos.

Até a aprovação e a existência desse backend, o procedimento disponível é a importação manual no canal CSV. Nenhuma assinatura, hospedagem paga ou aplicação foi contratada nesta preparação.
