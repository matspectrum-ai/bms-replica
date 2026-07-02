let _initialized = false;
export function initAjuda() {
  if (_initialized) return;
  _initialized = true;
  const R = window.VIEWS;
  if (!R) return;

  R.ajuda = () => `
  <div class="grad-card rounded-3xl p-6 sm:p-8 mb-6">
    <div class="flex items-start gap-4 flex-wrap">
      <div class="icon-cube amber floaty">❓</div>
      <div class="flex-1">
        <h2 class="font-display text-2xl font-extrabold">Como o Laboratório funciona</h2>
        <p class="text-slate-300">Fluxo João Victor — sequencial, do começo ao fim.</p>
      </div>
    </div>
  </div>

  <div class="grid gap-4">
    ${ajuda('🧬', 'Etapa 1 — Criar Site', `
      <ol class="list-decimal list-inside space-y-1 text-slate-300">
        <li>Busca o CNPJ na BrasilAPI (gratuito)</li>
        <li>Gera 6 sugestões de domínio com letras misturadas — você escolhe uma</li>
        <li>Cola a meta-tag do Facebook (vai injetar na linha 1 do head)</li>
        <li>Gera o HTML completo com todos os dados</li>
        <li>Publica direto no Cloudflare Pages via API (sem cliques manuais)</li>
      </ol>`)}
    ${ajuda('📱', 'Etapa 2 — Comprar Número', `
      <ol class="list-decimal list-inside space-y-1 text-slate-300">
        <li>Escolhe serviço (Facebook) e país (Brasil)</li>
        <li>Compra o número via SMS24h API</li>
        <li>Mostra o número formatado com botão copiar</li>
        <li>Faz polling automático aguardando o SMS</li>
        <li>Mostra o código quando chega, com botão copiar</li>
        <li>Botão "Atualizar Site" adiciona o número e re-deploya</li>
      </ol>`)}
    ${ajuda('📄', 'Etapa 3 — Editor PDF', `
      <ul class="list-disc list-inside space-y-1 text-slate-300">
        <li>Arrasta o PDF → renderiza no app</li>
        <li>Clica em qualquer ponto → adiciona campo de texto editável e movível</li>
        <li>"Mapear Campos" extrai LOGRADOURO, NÚMERO, COMPLEMENTO, CEP, MUNICÍPIO, UF, BAIRRO</li>
        <li>Cada campo tem botão de copiar</li>
        <li>Baixa PDF editado com pdf-lib</li>
      </ul>`)}
  </div>
  `;
}

function ajuda(ico, title, body) {
  return `<div class="glass rounded-2xl p-5 flex gap-4">
    <div class="icon-cube">${ico}</div>
    <div><div class="font-display font-bold text-lg">${title}</div><div class="text-slate-300 mt-1">${body}</div></div>
  </div>`;
}
