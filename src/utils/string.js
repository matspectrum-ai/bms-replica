export function onlyDigits(s) {
  return (s || '').replace(/\D/g, '');
}

export function slugify(s) {
  if (!s) return 'empresa';
  let r = s.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 28);
  return r || 'empresa';
}

export function escapeHTML(s) {
  return (s || '').toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function fmtCNPJ(c) {
  c = (c || '').replace(/\D/g, '').padStart(14, '0').slice(0, 14);
  return c.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2}).*/, '$1.$2.$3/$4-$5');
}

export function fmtMoney(v) {
  if (v == null || v === '') return '—';
  const n = Number(v);
  if (isNaN(n)) return v;
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
}

export function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString('pt-BR');
}

export function formatBRPhone(num) {
  let s = String(num || '').replace(/\D/g, '');
  if (s.startsWith('55') && s.length === 13) s = s.slice(2);
  if (s.length === 11) return `(${s.slice(0, 2)}) ${s.slice(2, 7)}-${s.slice(7)}`;
  if (s.length === 10) return `(${s.slice(0, 2)}) ${s.slice(2, 6)}-${s.slice(6)}`;
  return s;
}

export function normalizarBrasilAPI(d) {
  return {
    cnpj: d.cnpj,
    razao_social: d.razao_social,
    fantasia: d.nome_fantasia || d.razao_social,
    capital_social: d.capital_social,
    porte: d.porte || d.descricao_porte || '',
    situacao: d.descricao_situacao_cadastral || (d.situacao_cadastral === 2 ? 'ATIVA' : ''),
    inicio: d.data_inicio_atividade,
    natureza: d.natureza_juridica,
    cnae_principal: d.cnae_fiscal,
    cnae_descricao: d.cnae_fiscal_descricao,
    cnaes_secundarios: (d.cnaes_secundarios || []).map(c => ({ codigo: c.codigo, descricao: c.descricao })),
    logradouro: [d.descricao_tipo_de_logradouro, d.logradouro, d.numero].filter(Boolean).join(' '),
    complemento: d.complemento,
    bairro: d.bairro,
    municipio: d.municipio,
    uf: d.uf,
    cep: d.cep,
    telefone: [d.ddd_telefone_1, d.ddd_telefone_2].filter(Boolean).join(' / '),
    email: d.email,
    socios: (d.qsa || []).map(s => ({ nome: s.nome_socio, qualif: s.qualificacao_socio })),
    raw: d
  };
}

export function calcAnos(inicio) {
  if (!inicio) return 1;
  const m = inicio.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  let dt;
  if (m) dt = new Date(`${m[3]}-${m[2]}-${m[1]}`);
  else dt = new Date(inicio);
  if (isNaN(dt)) return 1;
  return Math.max(1, new Date().getFullYear() - dt.getFullYear());
}

export function gerarSugestoesDominio(nome) {
  const base = slugify(nome);
  if (!base) return ['empresa01'];
  const sugestoes = new Set();
  sugestoes.add(base + base.charAt(base.length - 1));
  sugestoes.add(base.slice(0, Math.min(base.length, 16)) + 's');
  const swap = { a: 'aa', e: 'ee', i: 'ii', o: 'oo', u: 'uu' };
  let v = base;
  let didSwap = false;
  for (const k in swap) {
    if (!didSwap && v.includes(k)) { v = v.replace(k, swap[k]); didSwap = true; }
  }
  if (didSwap) sugestoes.add(v);
  sugestoes.add(base + '01');
  sugestoes.add(base + 'oficial');
  const palavras = (nome || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/\s+/).filter(Boolean);
  if (palavras.length >= 2) {
    const sigla = palavras.slice(0, 2).map(p => p.charAt(0)).join('');
    sugestoes.add(sigla + base.replace(/^.{0,3}/, ''));
  }
  if (base.length > 6) {
    sugestoes.add(base.slice(-4) + base.slice(0, base.length - 4));
  }
  if (base.length > 4) {
    sugestoes.add(base.slice(0, Math.ceil(base.length / 2)) + base.slice(0, 2));
  }
  const finais = [...sugestoes].filter(s => s && s !== base && /^[a-z0-9-]+$/.test(s) && s.length <= 32 && s.length >= 4);
  return finais.slice(0, 6);
}

export function extrairCamposEndereco(text) {
  const T = text.replace(/\s+/g, ' ').toUpperCase();
  const result = { LOGRADOURO: '', NUMERO: '', COMPLEMENTO: '', CEP: '', BAIRRO: '', MUNICIPIO: '', UF: '' };
  const cep = text.match(/\b\d{5}-?\d{3}\b/);
  if (cep) result.CEP = cep[0];
  const uf = T.match(/\b(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)\b(?!\w)/);
  if (uf) result.UF = uf[1];
  const log = text.match(/(?:LOGRADOURO|ENDERE[ÇC]O)\s*[:\-]?\s*([^\n]+?)(?=\s+(?:N[ÚU]MERO|N[º°]|COMPLEMENTO|BAIRRO|CEP|MUNIC|UF)\b|\n|$)/i);
  if (log) result.LOGRADOURO = log[1].trim();
  const num = text.match(/N[ÚU]MERO\s*[:\-]?\s*([0-9][0-9A-Za-z\-\/\.]*)/i)
    || text.match(/N[º°]\s*[:\-]?\s*([0-9A-Za-z\-\/\.]+)/i);
  if (num) result.NUMERO = num[1].trim().replace(/[—–\-]+$/, '');
  const comp = text.match(/COMPLEMENTO\s*[:\-]?\s*([^\n]+?)(?=\s+(?:BAIRRO|CEP|MUNIC|UF)\b|\n|$)/i);
  if (comp) result.COMPLEMENTO = comp[1].trim();
  const bai = text.match(/BAIRRO\s*[:\-]?\s*([^\n]+?)(?=\s+(?:CEP|MUNIC|UF)\b|\n|$)/i);
  if (bai) result.BAIRRO = bai[1].trim();
  const mun = text.match(/MUNIC[ÍI]PIO\s*[:\-]?\s*([^\n]+?)(?=\s+(?:UF|ESTADO|CEP)\b|\n|$)/i)
    || text.match(/CIDADE\s*[:\-]?\s*([^\n]+?)(?=\s+(?:UF|ESTADO)\b|\n|$)/i);
  if (mun) result.MUNICIPIO = mun[1].trim();
  return result;
}
