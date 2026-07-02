import { onlyDigits, calcAnos } from './string.js';

export function buildSiteHTML(d) {
  const fantasia = (d.fantasia || d.razao || 'Empresa').toUpperCase();
  const titulo = `${fantasia} — ${(d.cnae || '').split('—')[1]?.trim() || 'Empresa'}`;
  const descricaoMeta = `${fantasia} — ${(d.cnae || '').split('—')[1]?.trim() || 'Empresa'}. Atendimento em ${d.municipio || ''}${d.uf ? '/' + d.uf : ''}.`;
  const cnaeCodigo = ((d.cnae || '').split('—')[0] || '').trim();
  const cnaeDesc = ((d.cnae || '').split('—')[1] || '').trim();
  const enderecoCompleto = [d.logradouro, d.bairro, d.municipio ? d.municipio + (d.uf ? '/' + d.uf : '') : '', d.cep ? 'CEP ' + d.cep : ''].filter(Boolean).join(' • ');
  const tel = d.telefone || '';
  const whats = d.whats || onlyDigits(tel);
  const wppLink = whats ? `https://wa.me/${whats.length === 10 || whats.length === 11 ? '55' + whats : whats}` : '#contato';

  let telefonesCombinados = tel || '';
  if (d.telefoneNosso) {
    telefonesCombinados = (tel || '(empresa)') + ' /' + d.telefoneNosso;
  }

  const cnaeCards = (d.cnaesSec || []).map((linha, i) => {
    const m = linha.match(/^([\d./-]+)\s*[-–:]?\s*(.*)$/);
    const cod = (m?.[1] || '').replace(/\D/g, '') || (i + 1);
    const desc = (m?.[2] || linha).trim();
    return `<article class="card cnae-card">
      <div class="cnae-num">${i + 1}</div>
      <div class="cnae-tag">CNAE ${cod}</div>
      <h3>${desc}</h3>
      <a class="btn-link" href="#contato">Saiba mais →</a>
    </article>`;
  }).join('');

  const valoresHTML = (d.valores || []).map((v, i) => `<div class="value-card"><div class="value-ico">${['🤝', '✨', '🏆', '💎', '⭐', '🚀', '💡', '🎯'][i % 8]}</div><h4>${v}</h4></div>`).join('');
  const diferenciaisHTML = (d.diferenciais || []).map((v, i) => `<div class="diff-card"><div class="diff-ico">${['🏅', '⚡', '💎', '🎯', '🛡️', '🌟', '📈', '✅'][i % 8]}</div><div><h4>${v.split('.')[0] || v}</h4><p>${v}</p></div></div>`).join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${titulo}</title>
<meta name="description" content="${descricaoMeta}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Sora:wght@600;700;800&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#0b1020;--card:#111a36;--border:rgba(255,255,255,.08);--text:#e6e9f5;--muted:#9aa3c7}
html,body{background:var(--bg);color:var(--text);font-family:Inter,sans-serif;line-height:1.6;scroll-behavior:smooth}
.container{max-width:1200px;margin:0 auto;padding:0 24px}
h1,h2,h3,h4{font-family:Sora,sans-serif;letter-spacing:-.02em;line-height:1.15}
a{color:inherit;text-decoration:none}
.grad-text{background:linear-gradient(120deg,#a5b4fc,#22d3ee 50%,#a855f7);-webkit-background-clip:text;background-clip:text;color:transparent}
.pill{display:inline-flex;align-items:center;gap:.4rem;padding:.35rem .85rem;border-radius:999px;font-size:.75rem;font-weight:700;background:rgba(34,197,94,.15);color:#86efac;border:1px solid rgba(34,197,94,.3)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:.6rem;padding:.95rem 1.5rem;border-radius:16px;font-weight:700;cursor:pointer;border:none;transition:transform .12s,box-shadow .12s,filter .12s;font-size:1rem;font-family:Inter}
.btn-primary{color:#fff;background:linear-gradient(180deg,#6d72ff,#4f46e5);box-shadow:0 6px 0 #312e81,0 12px 24px rgba(79,70,229,.45),inset 0 1px 0 rgba(255,255,255,.25)}
.btn-primary:hover{filter:brightness(1.08)}
.btn-primary:active{transform:translateY(4px);box-shadow:0 2px 0 #312e81,0 6px 14px rgba(79,70,229,.4)}
.btn-secondary{color:#fff;background:linear-gradient(180deg,#1f2a52,#111a36);box-shadow:0 6px 0 #0a0f23,inset 0 1px 0 rgba(255,255,255,.08)}
.btn-success{color:#fff;background:linear-gradient(180deg,#34d399,#10b981);box-shadow:0 6px 0 #065f46,inset 0 1px 0 rgba(255,255,255,.25)}
.icon-cube{width:54px;height:54px;border-radius:16px;display:inline-flex;align-items:center;justify-content:center;font-size:24px;color:#fff;background:linear-gradient(160deg,#7c83ff,#4f46e5 60%,#312e81);box-shadow:0 10px 24px rgba(79,70,229,.45),inset 0 2px 0 rgba(255,255,255,.25),inset 0 -6px 0 rgba(0,0,0,.25)}
.icon-cube.cyan{background:linear-gradient(160deg,#67e8f9,#06b6d4 60%,#155e75);box-shadow:0 10px 24px rgba(6,182,212,.45),inset 0 2px 0 rgba(255,255,255,.25),inset 0 -6px 0 rgba(0,0,0,.25)}
.icon-cube.green{background:linear-gradient(160deg,#34d399,#10b981 60%,#065f46);box-shadow:0 10px 24px rgba(16,185,129,.45),inset 0 2px 0 rgba(255,255,255,.25),inset 0 -6px 0 rgba(0,0,0,.25)}
.icon-cube.purple{background:linear-gradient(160deg,#c084fc,#a855f7 60%,#581c87);box-shadow:0 10px 24px rgba(168,85,247,.45),inset 0 2px 0 rgba(255,255,255,.25),inset 0 -6px 0 rgba(0,0,0,.25)}
.card{background:linear-gradient(145deg,rgba(255,255,255,.04),rgba(255,255,255,.01));border:1px solid var(--border);border-radius:20px;padding:1.5rem;transition:transform .2s,border-color .2s}
.card:hover{transform:translateY(-4px);border-color:rgba(99,102,241,.4)}
header.nav{position:sticky;top:0;z-index:50;background:rgba(11,16,32,.85);backdrop-filter:blur(12px);border-bottom:1px solid var(--border)}
.nav-inner{display:flex;align-items:center;justify-content:space-between;padding:14px 0}
.logo{display:flex;align-items:center;gap:12px;font-family:Sora;font-weight:800;font-size:1.1rem}
.logo-mark{width:42px;height:42px;border-radius:12px;background:linear-gradient(160deg,#7c83ff,#4f46e5);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;box-shadow:0 6px 14px rgba(79,70,229,.4)}
.nav-menu{display:flex;gap:24px;align-items:center}
.nav-menu a{color:#cfd5f2;font-weight:600;font-size:.95rem}
.nav-menu a:hover{color:#fff}
.menu-toggle{display:none;background:none;border:none;color:#fff;font-size:1.5rem;cursor:pointer}
.hero{padding:80px 0 60px;position:relative;overflow:hidden}
.hero::before{content:"";position:absolute;inset:0;background:radial-gradient(70% 60% at 80% 20%,rgba(99,102,241,.25),transparent 60%),radial-gradient(50% 50% at 0% 100%,rgba(168,85,247,.15),transparent 60%);pointer-events:none}
.hero h1{font-size:clamp(2rem,5vw,3.75rem);font-weight:800;margin:1rem 0 1.25rem}
.hero p.lead{font-size:1.15rem;color:#cfd5f2;max-width:640px;margin-bottom:1.75rem}
.hero-actions{display:flex;gap:12px;flex-wrap:wrap}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin-top:48px}
.stat{background:linear-gradient(145deg,rgba(255,255,255,.04),rgba(255,255,255,.01));border:1px solid var(--border);padding:18px;border-radius:16px}
.stat .num{font-family:Sora;font-size:1.7rem;font-weight:800}
.stat .lbl{color:var(--muted);font-size:.9rem}
section{padding:72px 0;position:relative}
.section-eyebrow{font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.15em;color:#a5b4fc;margin-bottom:.6rem}
h2.section-title{font-size:clamp(1.6rem,3.4vw,2.4rem);font-weight:800;margin-bottom:.6rem}
p.section-sub{color:var(--muted);max-width:640px;margin-bottom:2.5rem;font-size:1.02rem}
.about-grid{display:grid;grid-template-columns:1.2fr 1fr;gap:32px;align-items:start}
.about-card{padding:24px}
.about-meta{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-top:20px}
.about-meta .kv{padding:12px;border-radius:12px;background:rgba(255,255,255,.03);border:1px solid var(--border)}
.about-meta .kv .k{font-size:.72rem;color:var(--muted);text-transform:uppercase;letter-spacing:.08em}
.about-meta .kv .v{font-weight:700;margin-top:2px}
.values-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px}
.value-card{padding:24px;text-align:center;background:linear-gradient(160deg,rgba(99,102,241,.08),rgba(255,255,255,.02));border:1px solid var(--border);border-radius:18px;transition:transform .2s}
.value-card:hover{transform:translateY(-4px) scale(1.02)}
.value-ico{font-size:42px;margin-bottom:8px;display:inline-block;filter:drop-shadow(0 6px 14px rgba(99,102,241,.4))}
.value-card h4{font-size:1rem}
.diff-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:18px}
.diff-card{display:flex;gap:16px;padding:20px;border:1px solid var(--border);border-radius:18px;background:linear-gradient(145deg,rgba(255,255,255,.04),rgba(255,255,255,.01))}
.diff-ico{font-size:30px;flex-shrink:0;width:56px;height:56px;display:flex;align-items:center;justify-content:center;border-radius:14px;background:linear-gradient(160deg,rgba(34,211,238,.2),rgba(99,102,241,.1));border:1px solid rgba(99,102,241,.25)}
.diff-card h4{margin-bottom:4px}
.diff-card p{color:var(--muted);font-size:.92rem}
.cnae-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px}
.cnae-card{position:relative;padding-top:34px}
.cnae-num{position:absolute;top:-18px;left:18px;width:38px;height:38px;border-radius:12px;background:linear-gradient(160deg,#7c83ff,#4f46e5);display:flex;align-items:center;justify-content:center;font-weight:800;font-family:Sora;box-shadow:0 6px 14px rgba(79,70,229,.4);color:#fff}
.cnae-tag{font-size:.7rem;color:#a5b4fc;font-weight:700;text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px;display:block}
.cnae-card h3{font-size:1.05rem;margin-bottom:14px;min-height:48px}
.btn-link{color:#22d3ee;font-weight:700;font-size:.9rem}
.data-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px}
.data-card{padding:18px;background:linear-gradient(145deg,rgba(255,255,255,.04),rgba(255,255,255,.01));border:1px solid var(--border);border-radius:16px}
.data-card .lbl{font-size:.72rem;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px}
.data-card .val{font-weight:700;font-size:1rem;word-break:break-word}
.contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:32px}
.contact-list{display:grid;gap:14px}
.contact-item{display:flex;align-items:center;gap:16px;padding:16px;border-radius:16px;background:linear-gradient(145deg,rgba(255,255,255,.04),rgba(255,255,255,.01));border:1px solid var(--border)}
.contact-item .ico{font-size:26px;width:48px;height:48px;display:flex;align-items:center;justify-content:center;border-radius:12px;background:linear-gradient(160deg,#7c83ff,#4f46e5);box-shadow:0 6px 14px rgba(79,70,229,.4)}
.contact-item .lbl{font-size:.7rem;color:var(--muted);text-transform:uppercase;letter-spacing:.1em}
.contact-form{padding:24px}
.contact-form input,.contact-form textarea{width:100%;padding:.9rem 1rem;border-radius:12px;background:#0b1330;border:1px solid var(--border);color:#fff;font-size:1rem;outline:none;margin-bottom:10px;font-family:Inter}
.contact-form input:focus,.contact-form textarea:focus{border-color:#6366f1;box-shadow:0 0 0 4px rgba(99,102,241,.18)}
.contact-form textarea{min-height:120px;resize:vertical}
footer{padding:48px 0 28px;border-top:1px solid var(--border);background:rgba(0,0,0,.2)}
.footer-grid{display:grid;grid-template-columns:1.5fr 1fr 1fr;gap:32px;margin-bottom:32px}
.footer-grid h4{margin-bottom:12px;font-size:1rem}
.footer-grid p,.footer-grid li{color:var(--muted);font-size:.9rem;margin-bottom:6px;list-style:none}
.footer-copy{text-align:center;color:var(--muted);font-size:.85rem;padding-top:20px;border-top:1px solid var(--border)}
@media (max-width:900px){.nav-menu{display:none;position:absolute;top:100%;left:0;right:0;flex-direction:column;background:#0c1330;padding:16px 24px;gap:14px;border-bottom:1px solid var(--border)}.nav-menu.open{display:flex}.menu-toggle{display:block}.about-grid,.contact-grid,.footer-grid{grid-template-columns:1fr}.hero{padding:48px 0 36px}section{padding:48px 0}.container{padding:0 18px}}
.float-wpp{position:fixed;bottom:22px;right:22px;width:64px;height:64px;border-radius:50%;background:linear-gradient(160deg,#25d366,#128c7e);box-shadow:0 10px 30px rgba(37,211,102,.5),inset 0 2px 0 rgba(255,255,255,.3);display:flex;align-items:center;justify-content:center;font-size:32px;z-index:60;animation:pulse 2.4s infinite}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
</style>
</head>
<body>
<header class="nav">
  <div class="container nav-inner">
    <a class="logo" href="#"><span class="logo-mark">${(fantasia || 'E').slice(0, 2)}</span><span>${fantasia}</span></a>
    <nav class="nav-menu" id="navMenu">
      <a href="#sobre">Sobre</a>
      <a href="#valores">Valores</a>
      <a href="#diferencial">Diferencial</a>
      <a href="#servicos">Serviços</a>
      <a href="#empresa">Empresa</a>
      <a href="#contato">Contato</a>
      <a href="#contato" class="btn btn-primary" style="padding:.55rem 1rem;font-size:.85rem">Fale conosco →</a>
    </nav>
    <button class="menu-toggle" onclick="document.getElementById('navMenu').classList.toggle('open')">☰</button>
  </div>
</header>
<section class="hero">
  <div class="container">
    <span class="pill">⭐ ${d.situacao || 'EMPRESA ATIVA'}</span>
    <h1>Bem-vindo à <span class="grad-text">${fantasia}</span></h1>
    <p class="lead">${cnaeDesc ? cnaeDesc + '. ' : ''}Atendimento de excelência${d.municipio ? ' em ' + d.municipio : ''}${d.uf ? '/' + d.uf : ''}.</p>
    <div class="hero-actions">
      <a href="#servicos" class="btn btn-primary">🛠️ Ver Serviços</a>
      <a href="#contato" class="btn btn-secondary">💬 Solicitar Orçamento</a>
      ${whats ? `<a href="${wppLink}" class="btn btn-success" target="_blank">📱 WhatsApp</a>` : ''}
    </div>
    <div class="stats">
      <div class="stat"><div class="num">${calcAnos(d.inicio)}+</div><div class="lbl">Anos no mercado</div></div>
      <div class="stat"><div class="num">${Math.max(1, (d.cnaesSec || []).length)}</div><div class="lbl">Serviços</div></div>
      <div class="stat"><div class="num">100%</div><div class="lbl">Confiança</div></div>
      <div class="stat"><div class="num" style="font-size:1rem">${d.cnpj || ''}</div><div class="lbl">CNPJ</div></div>
    </div>
  </div>
</section>
<section id="sobre">
  <div class="container">
    <div class="section-eyebrow">Sobre nós</div>
    <h2 class="section-title">${d.slogan || 'Tradição, qualidade e compromisso.'}</h2>
    <div class="about-grid">
      <div class="card about-card">
        <p style="color:#cfd5f2;font-size:1.04rem;line-height:1.75">${(d.sobre || '').replace(/\n/g, '<br>')}</p>
        ${d.missao ? `<div style="margin-top:18px"><b class="grad-text" style="font-family:Sora">🎯 Nossa Missão</b><p style="color:#cfd5f2;margin-top:6px">${d.missao}</p></div>` : ''}
        ${d.visao ? `<div style="margin-top:14px"><b class="grad-text" style="font-family:Sora">🔭 Nossa Visão</b><p style="color:#cfd5f2;margin-top:6px">${d.visao}</p></div>` : ''}
      </div>
      <div class="card about-card">
        <div style="display:flex;gap:14px;align-items:center;margin-bottom:8px">
          <div class="icon-cube purple">🏆</div>
          <div><b style="font-family:Sora">Empresa de confiança</b><div style="color:var(--muted);font-size:.9rem">Dados oficiais Receita Federal</div></div>
        </div>
        <div class="about-meta">
          <div class="kv"><div class="k">Natureza Jurídica</div><div class="v">${d.natureza || '—'}</div></div>
          <div class="kv"><div class="k">Porte</div><div class="v">${d.porte || '—'}</div></div>
          <div class="kv"><div class="k">Situação</div><div class="v">${d.situacao || 'ATIVA'}</div></div>
          <div class="kv"><div class="k">Início</div><div class="v">${d.inicio || '—'}</div></div>
        </div>
      </div>
    </div>
  </div>
</section>
${(d.valores || []).length ? `
<section id="valores" style="background:linear-gradient(180deg,transparent,rgba(99,102,241,.04))">
  <div class="container">
    <div class="section-eyebrow">Nossos Valores</div>
    <h2 class="section-title">O que nos move todos os dias</h2>
    <p class="section-sub">Princípios que guiam cada decisão e atendimento.</p>
    <div class="values-grid">${valoresHTML}</div>
  </div>
</section>` : ''}
${(d.diferenciais || []).length ? `
<section id="diferencial">
  <div class="container">
    <div class="section-eyebrow">Nosso Diferencial</div>
    <h2 class="section-title">Por que escolher a ${fantasia}?</h2>
    <p class="section-sub">Experiência, transparência e atendimento humano.</p>
    <div class="diff-grid">${diferenciaisHTML}</div>
  </div>
</section>` : ''}
${(d.cnaesSec || []).length ? `
<section id="servicos" style="background:linear-gradient(180deg,transparent,rgba(168,85,247,.05))">
  <div class="container">
    <div class="section-eyebrow">Nossos Serviços</div>
    <h2 class="section-title">Soluções completas para você</h2>
    <p class="section-sub">Atividades classificadas conforme CNAE oficial.</p>
    <div class="cnae-grid">${cnaeCards}</div>
  </div>
</section>` : ''}
<section id="empresa">
  <div class="container">
    <div class="section-eyebrow">Dados Oficiais</div>
    <h2 class="section-title">Empresa registrada e verificada</h2>
    <p class="section-sub">Informações da Receita Federal.</p>
    <div class="data-grid">
      <div class="data-card"><div class="lbl">CNPJ</div><div class="val">${d.cnpj || '—'}</div></div>
      <div class="data-card"><div class="lbl">Razão Social</div><div class="val">${d.razao || '—'}</div></div>
      <div class="data-card"><div class="lbl">Nome Fantasia</div><div class="val">${d.fantasia || '—'}</div></div>
      <div class="data-card"><div class="lbl">CNAE Principal</div><div class="val">${cnaeCodigo ? cnaeCodigo + ' — ' : ''}${cnaeDesc || '—'}</div></div>
      <div class="data-card"><div class="lbl">Capital Social</div><div class="val">${d.capital || '—'}</div></div>
      <div class="data-card"><div class="lbl">Porte</div><div class="val">${d.porte || '—'}</div></div>
      <div class="data-card"><div class="lbl">Natureza Jurídica</div><div class="val">${d.natureza || '—'}</div></div>
      <div class="data-card"><div class="lbl">Situação</div><div class="val">${d.situacao || 'ATIVA'}</div></div>
      <div class="data-card"><div class="lbl">Início das Atividades</div><div class="val">${d.inicio || '—'}</div></div>
      <div class="data-card"><div class="lbl">Endereço</div><div class="val">${d.logradouro || '—'}${d.bairro ? ', ' + d.bairro : ''}</div></div>
      <div class="data-card"><div class="lbl">Município / UF</div><div class="val">${d.municipio || '—'} ${d.uf ? '/' + d.uf : ''}</div></div>
      <div class="data-card"><div class="lbl">CEP</div><div class="val">${d.cep || '—'}</div></div>
    </div>
  </div>
</section>
<section id="contato" style="background:linear-gradient(180deg,transparent,rgba(34,211,238,.04))">
  <div class="container">
    <div class="section-eyebrow">Contato</div>
    <h2 class="section-title">Vamos conversar?</h2>
    <p class="section-sub">Entre em contato pelos canais oficiais.</p>
    <div class="contact-grid">
      <div class="contact-list">
        <div class="contact-item"><div class="ico">📍</div><div><div class="lbl">Endereço</div><div style="font-weight:700">${enderecoCompleto || '—'}</div></div></div>
        ${telefonesCombinados ? `<div class="contact-item"><div class="ico">📞</div><div><div class="lbl">Telefone</div><div style="font-weight:700">${telefonesCombinados}</div></div></div>` : ''}
        ${d.email ? `<div class="contact-item"><div class="ico">✉️</div><div><div class="lbl">E-mail</div><div style="font-weight:700">${d.email}</div></div></div>` : ''}
        ${whats ? `<div class="contact-item"><div class="ico" style="background:linear-gradient(160deg,#25d366,#128c7e)">💬</div><div><div class="lbl">WhatsApp</div><a href="${wppLink}" style="font-weight:700;color:#86efac" target="_blank">Conversar agora →</a></div></div>` : ''}
        ${d.horario ? `<div class="contact-item"><div class="ico" style="background:linear-gradient(160deg,#fbbf24,#f59e0b)">🕐</div><div><div class="lbl">Horário</div><div style="font-weight:700">${d.horario}</div></div></div>` : ''}
      </div>
      <form class="card contact-form" onsubmit="event.preventDefault();const tel='${whats || ''}';const t=document.getElementById('cf_msg').value;const n=document.getElementById('cf_nome').value;const u='https://wa.me/'+(tel.length===10||tel.length===11?'55'+tel:tel)+'?text='+encodeURIComponent('Olá, sou '+n+'. '+t);window.open(u,'_blank')">
        <h3 style="margin-bottom:14px">✍️ Envie uma mensagem</h3>
        <input id="cf_nome" placeholder="Seu nome" required>
        <input id="cf_email" type="email" placeholder="Seu e-mail">
        <input id="cf_tel" placeholder="Seu telefone">
        <textarea id="cf_msg" placeholder="Como podemos ajudar?" required></textarea>
        <button class="btn btn-primary" style="width:100%" type="submit">📩 Enviar mensagem</button>
      </form>
    </div>
  </div>
</section>
<footer>
  <div class="container">
    <div class="footer-grid">
      <div>
        <div class="logo" style="margin-bottom:10px"><span class="logo-mark">${(fantasia || 'E').slice(0, 2)}</span><span>${fantasia}</span></div>
        <p>${d.razao || fantasia}${d.cnpj ? ' — CNPJ ' + d.cnpj : ''}</p>
        <p style="margin-top:8px">${enderecoCompleto || ''}</p>
      </div>
      <div>
        <h4>Links</h4>
        <ul><li><a href="#sobre">Sobre</a></li><li><a href="#servicos">Serviços</a></li><li><a href="#empresa">Empresa</a></li><li><a href="#contato">Contato</a></li></ul>
      </div>
      <div>
        <h4>Contato</h4>
        ${telefonesCombinados ? `<p>📞 ${telefonesCombinados}</p>` : ''}
        ${d.email ? `<p>✉️ ${d.email}</p>` : ''}
        ${d.horario ? `<p>🕐 ${d.horario}</p>` : ''}
      </div>
    </div>
    <div class="footer-copy">© ${new Date().getFullYear()} ${fantasia}. Todos os direitos reservados.</div>
  </div>
</footer>
${whats ? `<a href="${wppLink}" class="float-wpp" target="_blank" aria-label="WhatsApp">💬</a>` : ''}
</body>
</html>`;
}
