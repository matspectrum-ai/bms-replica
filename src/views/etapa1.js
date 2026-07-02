import { getDB, saveDB, getSettings, saveSettings } from '../stores/data.js';
import { toast } from '../widgets/toast.js';
import { fmtCNPJ, fmtMoney, fmtDate, onlyDigits, slugify, escapeHTML, normalizarBrasilAPI, gerarSugestoesDominio, calcAnos } from '../utils/string.js';
import { buildSiteHTML } from './build-site-html.js';

let _initialized = false;
export function initEtapa1() {
  if (_initialized) return;
  _initialized = true;
  const R = window.VIEWS;
  if (!R) return;

  window.etapa1State = { empresa: null, dominio: '', metatag: '', htmlGerado: '', publicado: null };

  R.etapa1 = () => {
    const st = window.etapa1State;
    const stepCnpj = !!st.empresa;
    const stepDom = !!st.dominio;
    const stepMeta = !!st.metatag;
    const stepHTML = !!st.htmlGerado;
    const stepPub = !!st.publicado;

    return `
    <div class="grad-card rounded-3xl p-6 sm:p-8 mb-6">
      <div class="flex items-start gap-4 flex-wrap">
        <div class="icon-cube floaty">🧬</div>
        <div class="flex-1 min-w-0">
          <div class="pill doing mb-2">FLUXO LINEAR</div>
          <h2 class="font-display text-2xl sm:text-3xl font-extrabold">Crie um site do zero</h2>
          <p class="text-slate-300">Siga as caixas abaixo em ordem. Cada uma libera a próxima.</p>
        </div>
        <button class="btn-3d ghost sm" onclick="resetEtapa1()">🔄 Resetar fluxo</button>
      </div>
    </div>

    ${stepBox(1, '🔎', 'Buscar CNPJ', stepCnpj, renderStep1CNPJ())}
    ${stepBox(2, '🌐', 'Gerar Domínio', stepDom, renderStep1Dominio(), !stepCnpj)}
    ${stepBox(3, '🛡️', 'Adicionar Meta Tag', stepMeta, renderStep1Meta(), !stepDom)}
    ${stepBox(4, '🎨', 'Gerar Site Completo', stepHTML, renderStep1Gerar(), !stepMeta)}
    ${stepBox(5, '🚀', 'Publicar no Cloudflare', stepPub, renderStep1Publicar(), !stepHTML)}
    `;
  };

  window.stepBox = stepBox;
  window.renderStep1CNPJ = renderStep1CNPJ;
  window.renderStep1Dominio = renderStep1Dominio;
  window.renderStep1Meta = renderStep1Meta;
  window.renderStep1Gerar = renderStep1Gerar;
  window.renderStep1Publicar = renderStep1Publicar;
  window.e1Buscar = e1Buscar;
  window.e1ManualSalvar = e1ManualSalvar;
  window.e1EscolherDominio = e1EscolherDominio;
  window.e1SalvarMeta = e1SalvarMeta;
  window.e1Gerar = e1Gerar;
  window.e1Preview = e1Preview;
  window.e1Baixar = e1Baixar;
  window.e1Publicar = e1Publicar;
  window.resetEtapa1 = resetEtapa1;
  window.salvarEmpresa = salvarEmpresa;
  window.registrarSite = registrarSite;
}

function stepBox(n, ico, title, done, body, disabled = false) {
  return `<div class="glass step-card mb-4 ${done ? 'done' : ''} ${disabled ? 'disabled' : ''}">
    <div class="step-num">${done ? '✓' : n}</div>
    <div class="flex items-start gap-3 mb-3 flex-wrap">
      <div class="text-2xl">${ico}</div>
      <div class="flex-1 min-w-0">
        <div class="font-display font-bold text-lg">${title}</div>
      </div>
      ${done ? '<span class="pill done">Concluído</span>' : ''}
    </div>
    ${body}
  </div>`;
}

function renderStep1CNPJ() {
  const e = window.etapa1State.empresa;
  if (e) {
    return `<div class="glass rounded-2xl p-4 mb-3">
      <div class="flex items-start gap-3 flex-wrap">
        <div class="icon-cube green" style="width:48px;height:48px;font-size:20px;">🏢</div>
        <div class="flex-1 min-w-0">
          <div class="text-xs text-slate-400">${fmtCNPJ(e.cnpj)}</div>
          <div class="font-bold">${e.razao_social || '—'}</div>
          <div class="text-sm text-slate-300 truncate">${e.cnae_descricao || ''}</div>
          <div class="flex flex-wrap gap-1.5 mt-2">
            ${e.situacao ? `<span class="pill ok">${e.situacao}</span>` : ''}
            ${e.porte ? `<span class="pill doing">${e.porte}</span>` : ''}
            ${e.capital_social ? `<span class="pill ${(Number(e.capital_social) >= 10000 && Number(e.capital_social) <= 50000) ? 'done' : 'todo'}">${fmtMoney(e.capital_social)}</span>` : ''}
            ${e.municipio ? `<span class="pill todo">${e.municipio}${e.uf ? '/' + e.uf : ''}</span>` : ''}
          </div>
        </div>
        <button class="btn-3d ghost sm" onclick="window.etapa1State.empresa=null;window.etapa1State.dominio='';window.etapa1State.metatag='';window.etapa1State.htmlGerado='';window.etapa1State.publicado=null;go('etapa1')">🔄 Trocar</button>
      </div>
    </div>`;
  }
  return `
    <div class="grid sm:grid-cols-[1fr_auto] gap-3 mb-3">
      <input id="e1_cnpj" inputmode="numeric" placeholder="Digite o CNPJ (ex: 34.578.472/0001-48)" class="input"
        oninput="this.value=this.value.replace(/[^0-9./-]/g,''); if(onlyDigits(this.value).length===14)e1Buscar()" />
      <button class="btn-3d cyan" onclick="e1Buscar()">🔍 Buscar</button>
    </div>
    <div id="e1_result"></div>
    <details class="mt-3">
      <summary class="text-sm text-slate-300 cursor-pointer">📝 Não tem CNPJ válido? Cadastrar manualmente</summary>
      <div class="mt-3 grid sm:grid-cols-2 gap-2">
        ${['cnpj', 'm_razao=Razão social', 'm_fantasia=Nome fantasia', 'm_capital=Capital social', 'm_cnae=CNAE principal', 'm_descricao=Descrição CNAE', 'm_logradouro=Endereço', 'm_municipio=Município', 'm_uf=UF', 'm_cep=CEP', 'm_telefone=Telefone', 'm_email=Email', 'm_inicio=Início', 'm_porte=Porte'].map(p => {
          const [id, ph] = p.includes('=') ? p.split('=') : ['e1m_' + p, 'CNPJ (14 dígitos)'];
          const idr = id === 'cnpj' ? 'e1m_cnpj' : id;
          return `<input id="${idr}" class="input" placeholder="${ph}"/>`;
        }).join('')}
        <textarea id="e1m_cnaes" class="input sm:col-span-2" placeholder="CNAEs secundárias (uma por linha)"></textarea>
        <button class="btn-3d success sm:col-span-2" onclick="e1ManualSalvar()">💾 Usar esta empresa</button>
      </div>
    </details>
  `;
}

async function e1Buscar() {
  const raw = document.getElementById('e1_cnpj').value;
  const cnpj = onlyDigits(raw);
  const box = document.getElementById('e1_result');
  if (cnpj.length !== 14) { toast('CNPJ precisa ter 14 números', '⚠️'); return; }
  box.innerHTML = `<div class="glass rounded-2xl p-4 text-center"><span class="spinner"></span> Consultando BrasilAPI...</div>`;
  try {
    const r = await fetch('https://brasilapi.com.br/api/cnpj/v1/' + cnpj);
    if (!r.ok) throw new Error('Não encontrado');
    const d = await r.json();
    const e = normalizarBrasilAPI(d);
    salvarEmpresa(e);
    window.etapa1State.empresa = e;
    toast('Empresa carregada!', '✅');
    window.go('etapa1');
  } catch (err) {
    box.innerHTML = `<div class="glass rounded-2xl p-4 text-center text-rose-300">😕 Não consegui encontrar este CNPJ. Verifique ou cadastre manualmente.</div>`;
  }
}

function e1ManualSalvar() {
  const get = id => document.getElementById(id)?.value?.trim() || '';
  const cnpj = onlyDigits(get('e1m_cnpj'));
  if (cnpj.length !== 14) { toast('CNPJ inválido', '⚠️'); return; }
  const cnaesText = get('e1m_cnaes');
  const cnaes_sec = cnaesText.split('\n').map(l => l.trim()).filter(Boolean).map(l => {
    const m = l.match(/^([0-9.\-/]+)\s*[-–:]?\s*(.*)$/);
    return { codigo: (m?.[1] || '').replace(/\D/g, ''), descricao: m?.[2] || l };
  });
  const e = {
    cnpj, razao_social: get('e1m_razao'), fantasia: get('e1m_fantasia') || get('e1m_razao'),
    capital_social: Number(get('e1m_capital').replace(/\D/g, '')) || null,
    cnae_principal: onlyDigits(get('e1m_cnae')), cnae_descricao: get('e1m_descricao'),
    cnaes_secundarios: cnaes_sec,
    logradouro: get('e1m_logradouro'), municipio: get('e1m_municipio'), uf: get('e1m_uf'), cep: get('e1m_cep'),
    telefone: get('e1m_telefone'), email: get('e1m_email'),
    inicio: get('e1m_inicio'), porte: get('e1m_porte'), situacao: 'ATIVA', socios: []
  };
  salvarEmpresa(e);
  window.etapa1State.empresa = e;
  toast('Empresa adicionada!', '💾');
  window.go('etapa1');
}

function salvarEmpresa(e) {
  const db = getDB();
  const idx = db.empresas.findIndex(x => onlyDigits(x.cnpj) === onlyDigits(e.cnpj));
  if (idx >= 0) db.empresas[idx] = { ...db.empresas[idx], ...e, _updated: Date.now() };
  else db.empresas.push({ ...e, _created: Date.now() });
  saveDB(db);
}

function renderStep1Dominio() {
  const st = window.etapa1State;
  if (!st.empresa) return '';
  if (st.dominio) {
    return `<div class="glass rounded-2xl p-4 ring-glow">
      <div class="flex items-center gap-3 flex-wrap">
        <div class="icon-cube cyan" style="width:44px;height:44px;font-size:20px;">🌐</div>
        <div class="flex-1 min-w-0">
          <div class="text-xs text-slate-400">DOMÍNIO ESCOLHIDO</div>
          <div class="font-display text-lg font-bold break-all">${st.dominio}.pages.dev</div>
        </div>
        <button class="btn-3d cyan sm" onclick="copyText('${st.dominio}.pages.dev','Domínio copiado! Cole na Meta BM')">📋 Copiar domínio</button>
        <button class="btn-3d ghost sm" onclick="window.etapa1State.dominio='';window.etapa1State.metatag='';window.etapa1State.htmlGerado='';window.etapa1State.publicado=null;go('etapa1')">🔄 Trocar</button>
      </div>
      <div class="text-xs text-slate-400 mt-2">👆 Use este domínio na Meta BM (Adequação & Segurança → Domínios) para gerar a meta-tag</div>
    </div>`;
  }
  const sugestoes = gerarSugestoesDominio(st.empresa.fantasia || st.empresa.razao_social);
  return `<div>
    <p class="text-sm text-slate-300 mb-3">Sugestões automáticas (misturadas, evitando nome 100% igual):</p>
    <div class="grid sm:grid-cols-2 gap-2 mb-3">
      ${sugestoes.map(s => `<div class="glass rounded-xl p-3 flex items-center gap-2 cursor-pointer hover:bg-white/5" onclick="e1EscolherDominio('${s}')">
        <div class="font-mono flex-1 truncate"><b class="text-cyan-300">${s}</b><span class="text-slate-500">.pages.dev</span></div>
        <button class="btn-3d sm" onclick="event.stopPropagation();copyText('${s}.pages.dev','Domínio copiado!')">📋</button>
        <button class="btn-3d cyan sm" onclick="event.stopPropagation();e1EscolherDominio('${s}')">Usar</button>
      </div>`).join('')}
    </div>
    <div class="grid sm:grid-cols-[1fr_auto] gap-2">
      <input id="e1_dom_custom" class="input" placeholder="Ou digite o seu (sem .pages.dev)" />
      <button class="btn-3d success" onclick="e1EscolherDominio(document.getElementById('e1_dom_custom').value)">✅ Usar este</button>
    </div>
  </div>`;
}

function e1EscolherDominio(d) {
  d = slugify(d);
  if (!d || d.length < 4) { toast('Domínio precisa ter pelo menos 4 letras', '⚠️'); return; }
  window.etapa1State.dominio = d;
  window.go('etapa1');
}

function renderStep1Meta() {
  const st = window.etapa1State;
  if (!st.dominio) return '';
  if (st.metatag) {
    return `<div class="glass rounded-2xl p-4">
      <div class="flex items-center gap-3 flex-wrap">
        <div class="icon-cube purple" style="width:44px;height:44px;font-size:20px;">🛡️</div>
        <div class="flex-1 min-w-0">
          <div class="text-xs text-slate-400">META-TAG REGISTRADA</div>
          <div class="font-mono text-xs sm:text-sm break-all bg-black/30 p-2 rounded-lg mt-1">${escapeHTML(st.metatag)}</div>
        </div>
        <button class="btn-3d ghost sm" onclick="window.etapa1State.metatag='';window.etapa1State.htmlGerado='';window.etapa1State.publicado=null;go('etapa1')">🔄 Trocar</button>
      </div>
    </div>`;
  }
  return `<div>
    <p class="text-sm text-slate-300 mb-3">Vá na <a class="text-cyan-300 underline" target="_blank" href="https://business.facebook.com/settings/owned-domains">Meta BM → Adequação & Segurança → Domínios</a>, cole <code class="text-cyan-300">${st.dominio}.pages.dev</code> e copie o código <b>Meta-tag</b> que aparecer.</p>
    <div class="grid sm:grid-cols-[1fr_auto] gap-2">
      <input id="e1_meta" class="input" placeholder='<meta name="facebook-domain-verification" content="abc123xyz">' />
      <button class="btn-3d success" onclick="e1SalvarMeta()">✅ Aplicar</button>
    </div>
    <details class="mt-2"><summary class="text-xs text-slate-400 cursor-pointer">Posso pular esse passo?</summary>
    <p class="text-xs text-slate-400 mt-1">Pode. Mas aí o domínio não fica verificado na Meta. Clique em "Aplicar" sem preencher se quiser pular.</p></details>
  </div>`;
}

function e1SalvarMeta() {
  const v = document.getElementById('e1_meta').value.trim();
  if (v && !v.includes('facebook-domain-verification')) {
    if (!confirm('A tag não parece ser do Facebook. Salvar mesmo assim?')) return;
  }
  window.etapa1State.metatag = v || '<!-- meta tag não fornecida -->';
  toast('Meta-tag salva', '🛡️');
  window.go('etapa1');
}

function renderStep1Gerar() {
  const st = window.etapa1State;
  if (!st.metatag) return '';
  if (st.htmlGerado) {
    return `<div class="glass rounded-2xl p-4">
      <div class="flex items-center gap-3 flex-wrap">
        <div class="icon-cube green" style="width:44px;height:44px;font-size:20px;">🎨</div>
        <div class="flex-1 min-w-0">
          <div class="text-xs text-slate-400">SITE GERADO</div>
          <div class="font-bold">${(st.htmlGerado.length / 1024).toFixed(1)} KB — index.html pronto</div>
        </div>
        <button class="btn-3d cyan sm" onclick="e1Preview()">👀 Pré-visualizar</button>
        <button class="btn-3d success sm" onclick="e1Baixar()">⬇️ Baixar</button>
        <button class="btn-3d ghost sm" onclick="window.etapa1State.htmlGerado='';window.etapa1State.publicado=null;go('etapa1')">🔄 Refazer</button>
      </div>
    </div>`;
  }
  return `<div>
    <p class="text-sm text-slate-300 mb-3">Eu vou gerar o site SaaS moderno cheio de detalhes, com a meta-tag já injetada na linha 1 do head. Você pode personalizar:</p>
    <div class="grid sm:grid-cols-2 gap-2">
      <input id="e1g_slogan" class="input" placeholder="Slogan" value="Tradição, qualidade e compromisso." />
      <input id="e1g_horario" class="input" placeholder="Horário (ex: Seg–Sex 8h–18h)" value="Segunda a sexta-feira, das 8h às 18h" />
      <input id="e1g_whats" class="input" placeholder="WhatsApp (só dígitos, opcional)" />
      <input id="e1g_email" class="input" placeholder="E-mail extra (opcional)" />
    </div>
    <button class="btn-3d success mt-3" onclick="e1Gerar()">🎨 Gerar Site Completo</button>
  </div>`;
}

function e1Gerar() {
  const st = window.etapa1State;
  const e = st.empresa;
  const slogan = document.getElementById('e1g_slogan')?.value || 'Tradição, qualidade e compromisso.';
  const horario = document.getElementById('e1g_horario')?.value || '';
  const whats = onlyDigits(document.getElementById('e1g_whats')?.value || '');
  const emailExtra = document.getElementById('e1g_email')?.value || '';

  const dados = {
    cnpj: fmtCNPJ(e.cnpj),
    razao: e.razao_social, fantasia: e.fantasia,
    capital: e.capital_social ? fmtMoney(e.capital_social) : '',
    porte: e.porte, situacao: e.situacao || 'ATIVA', inicio: fmtDate(e.inicio),
    natureza: e.natureza,
    cnae: `${e.cnae_principal || ''} — ${e.cnae_descricao || ''}`,
    cnaesSec: (e.cnaes_secundarios || []).map(c => `${c.codigo} - ${c.descricao}`),
    slogan, horario,
    sobre: `A ${e.razao_social || e.fantasia} atua no segmento de ${e.cnae_descricao || 'sua atividade'}${e.inicio ? ' desde ' + fmtDate(e.inicio) : ''}, oferecendo soluções de alta qualidade e atendimento personalizado para cada cliente. Localizada em ${e.municipio || ''}${e.uf ? '/' + e.uf : ''}, somos referência no setor.`,
    missao: `Oferecer ${(e.cnae_descricao || 'serviços').toLowerCase()} com excelência, gerando confiança e satisfação para os clientes.`,
    visao: `Ser referência${e.municipio ? ' em ' + e.municipio : ''}${e.uf ? '/' + e.uf : ''} no setor de ${(e.cnae_descricao || 'atuação').toLowerCase()}.`,
    valores: ['Compromisso', 'Transparência', 'Qualidade', 'Atendimento humano', 'Ética'],
    diferenciais: ['Atendimento personalizado e próximo', 'Equipe experiente e atualizada', 'Preço justo e transparente', 'Qualidade comprovada em cada entrega'],
    logradouro: e.logradouro, bairro: e.bairro, municipio: e.municipio, uf: e.uf, cep: e.cep,
    telefone: e.telefone, telefoneNosso: '',
    email: emailExtra || e.email, whats,
    dominio: st.dominio
  };
  let html = buildSiteHTML(dados);
  if (st.metatag && !st.metatag.includes('<!-- meta tag não fornecida')) {
    html = html.replace('<head>', '<head>\n' + st.metatag);
  }
  st.htmlGerado = html;
  registrarSite(dados, st.metatag, st.dominio, '');
  toast('Site gerado com sucesso!', '✨');
  window.go('etapa1');
}

function e1Preview() {
  if (!window.etapa1State.htmlGerado) return;
  const w = window.open('about:blank', '_blank');
  if (w) { w.document.open(); w.document.write(window.etapa1State.htmlGerado); w.document.close(); }
}

function e1Baixar() {
  if (!window.etapa1State.htmlGerado) return;
  const blob = new Blob([window.etapa1State.htmlGerado], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'index.html';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast('index.html baixado', '⬇️');
}

function registrarSite(dados, metatag, dominio, telefoneNosso) {
  const db = getDB();
  const cnpj = onlyDigits(dados.cnpj);
  const reg = {
    cnpj, razao: dados.razao, fantasia: dados.fantasia,
    dominio: dominio + '.pages.dev', metatag, telefoneEmpresa: dados.telefone, telefoneNosso,
    status: 'gerado', url: '', deploymentId: '',
    dadosSnapshot: dados,
    criado: Date.now(), atualizado: Date.now()
  };
  const idx = db.sites.findIndex(s => onlyDigits(s.cnpj) === cnpj && s.dominio === reg.dominio);
  if (idx >= 0) db.sites[idx] = { ...db.sites[idx], ...reg };
  else db.sites.push(reg);
  saveDB(db);
}

function renderStep1Publicar() {
  const st = window.etapa1State;
  if (!st.htmlGerado) return '';
  if (st.publicado) {
    return `<div class="glass rounded-2xl p-4 neon">
      <div class="flex items-center gap-3 flex-wrap">
        <div class="icon-cube green pulse-ring" style="width:48px;height:48px;font-size:22px;">🌐</div>
        <div class="flex-1 min-w-0">
          <div class="text-xs text-slate-400">SITE NO AR ✅</div>
          <a target="_blank" href="${st.publicado.url}" class="font-display text-lg font-bold break-all text-cyan-300 underline">${st.publicado.url}</a>
        </div>
        <button class="btn-3d cyan sm" onclick="copyText('${st.publicado.url}','Link copiado!')">📋 Copiar link</button>
        <button class="btn-3d purple sm" onclick="window.open('${st.publicado.url}','_blank')">↗️ Abrir site</button>
      </div>
      <div class="mt-3 flex flex-wrap gap-2">
        <button class="btn-3d success sm" onclick="go('etapa2')">📱 Próximo: Comprar número →</button>
        <button class="btn-3d ghost sm" onclick="go('planilha')">📊 Ver na planilha</button>
      </div>
    </div>`;
  }
  const s = getSettings();
  const podePublicar = s.cf_token && s.cf_account;
  return `<div>
    <p class="text-sm text-slate-300 mb-3">Subo direto para o Cloudflare Pages via API. Sem cliques manuais.</p>
    ${!podePublicar ? `<div class="glass rounded-2xl p-3 mb-3 text-sm" style="border-color:rgba(245,158,11,.4)">⚠️ <b>Configure o token Cloudflare</b> nas <button class="text-cyan-300 underline" onclick="go('config')">Configurações</button> antes.</div>` : ''}
    <div class="flex flex-wrap gap-2">
      <button class="btn-3d success" id="btn-publish" onclick="e1Publicar()" ${!podePublicar ? 'disabled' : ''}>🚀 Publicar no Cloudflare</button>
      <button class="btn-3d ghost" onclick="e1Baixar()">⬇️ Só baixar (manual)</button>
    </div>
    <div id="publish-log" class="mt-3"></div>
  </div>`;
}

async function e1Publicar() {
  const st = window.etapa1State;
  const settings = getSettings();
  const btn = document.getElementById('btn-publish');
  const log = document.getElementById('publish-log');
  if (!btn || !log) return;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Publicando...';
  log.innerHTML = '';

  const pushLog = (msg, ok = null) => {
    const colors = { true: 'text-green-300', false: 'text-rose-300' };
    log.innerHTML += `<div class="text-sm ${colors[ok] || 'text-slate-300'} font-mono">${ok === true ? '✅ ' : ok === false ? '❌ ' : '• '}${msg}</div>`;
  };

  try {
    pushLog('Criando projeto no Cloudflare Pages...');
    const projectName = st.dominio;
    const r1 = await fetch(`https://api.cloudflare.com/client/v4/accounts/${settings.cf_account}/pages/projects`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${settings.cf_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: projectName, production_branch: 'main' })
    });
    const d1 = await r1.json();
    if (!r1.ok && !(d1.errors || []).some(e => e.code === 8000007 || e.code === 8000031 || (e.message || '').toLowerCase().includes('exists'))) {
      throw new Error('CRIAR: ' + JSON.stringify(d1.errors || d1));
    }
    pushLog('Projeto pronto: ' + projectName, true);

    pushLog('Pegando upload-token (JWT)...');
    const r2 = await fetch(`https://api.cloudflare.com/client/v4/accounts/${settings.cf_account}/pages/projects/${projectName}/upload-token`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${settings.cf_token}` }
    });
    const d2 = await r2.json();
    if (!d2.result?.jwt) throw new Error('JWT: ' + JSON.stringify(d2));
    const jwt = d2.result.jwt;
    pushLog('JWT recebido', true);

    pushLog('Calculando hash blake3...');
    const { blake3 } = await import('https://esm.sh/@noble/hashes/blake3');
    const html = st.htmlGerado;
    const b64 = btoa(unescape(encodeURIComponent(html)));
    const toHash = new TextEncoder().encode(b64 + 'html');
    const hashBytes = blake3(toHash);
    const hex = Array.from(hashBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    const fileHash = hex.slice(0, 32);
    pushLog('Hash: ' + fileHash, true);

    pushLog('Checando arquivos faltantes...');
    await fetch('https://api.cloudflare.com/client/v4/pages/assets/check-missing', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${jwt}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ hashes: [fileHash] })
    });

    pushLog('Fazendo upload do index.html...');
    const upRes = await fetch('https://api.cloudflare.com/client/v4/pages/assets/upload', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${jwt}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([{
        key: fileHash, value: b64, base64: true,
        metadata: { contentType: 'text/html' }
      }])
    });
    const upJson = await upRes.json();
    if (!upRes.ok) throw new Error('UPLOAD: ' + JSON.stringify(upJson));
    pushLog('Upload concluído', true);

    pushLog('Criando deployment...');
    const fd = new FormData();
    fd.append('manifest', JSON.stringify({ '/index.html': fileHash }));
    const dep = await fetch(`https://api.cloudflare.com/client/v4/accounts/${settings.cf_account}/pages/projects/${projectName}/deployments`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${settings.cf_token}` },
      body: fd
    });
    const depJson = await dep.json();
    if (!dep.ok) throw new Error('DEPLOY: ' + JSON.stringify(depJson));
    const url = depJson.result?.url || `https://${projectName}.pages.dev`;
    const depId = depJson.result?.id;
    pushLog('Deployment criado: ' + url, true);

    st.publicado = { url, projectName, deploymentId: depId };

    const db = getDB();
    const site = db.sites.find(s => s.dominio === projectName + '.pages.dev');
    if (site) { site.url = url; site.deploymentId = depId; site.status = 'deploy'; site.atualizado = Date.now(); saveDB(db); }

    toast('🎉 Site publicado!', '🚀');
    setTimeout(() => window.go('etapa1'), 800);
  } catch (err) {
    pushLog('Erro: ' + err.message, false);
    pushLog('Dica: verifique se o token tem permissão "Cloudflare Pages — Edit" e o Account ID está certo. Se persistir, baixe o HTML e suba manual.', false);
    if (btn) { btn.disabled = false; btn.innerHTML = '🚀 Tentar novamente'; }
  }
}

function resetEtapa1() {
  window.etapa1State = { empresa: null, dominio: '', metatag: '', htmlGerado: '', publicado: null };
  window.go('etapa1');
}
