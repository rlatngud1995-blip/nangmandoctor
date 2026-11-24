// 매직후드 정적 사이트 생성기 — node build.js → public/
const fs = require('fs');
const path = require('path');
const D = require('./data.js');
const P = require('./pool.js');
const { SITE, BRAND, PHONE, PHONE_D, TYPES, GUIDES, GALLERY } = D;
const OUT = path.join(__dirname, 'public');
const IMG = path.join(__dirname, 'img');
const TODAY = new Date().toISOString().slice(0, 10);

// ---------- utils
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const strip = s => String(s).replace(/<[^>]+>/g, '');
const sms = b => 'sms:' + PHONE + '?&body=' + encodeURIComponent(b);
const hash = s => { let h = 2166136261; for (const c of s) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
function rng(seed) { let x = hash(seed) || 7; return () => { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; }
function shuffle(arr, seed) { const r = rng(String(seed)), a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const one = (arr, seed) => arr[hash(seed) % arr.length];
const has = f => fs.existsSync(path.join(IMG, f));
const pages = [];
const titles = new Map(), descs = new Map();
let CSSV = '';

// ---------- illustrations (사진이 없을 때)
const ILL = {
  duct: `<svg viewBox="0 0 200 220" fill="none" role="img" aria-label="후드 덕트 일러스트"><path d="M40 196V126c0-22 18-40 40-40h50c22 0 40-18 40-40V22" stroke="url(#g5)" stroke-width="30" stroke-linecap="round"/><path d="M40 196V126c0-22 18-40 40-40h50c22 0 40-18 40-40V22" stroke="#e9bd6a" stroke-width="1.8" stroke-dasharray="4 10" stroke-linecap="round" class="dash"/><rect x="154" y="8" width="32" height="12" rx="2" fill="#d4a24c"/><rect x="24" y="196" width="32" height="12" rx="2" fill="#9ca1a8"/><defs><linearGradient id="g5" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#b9bdc3"/><stop offset="1" stop-color="#5c6168"/></linearGradient></defs></svg>`
};
const HERO_SVG = `<svg viewBox="0 0 560 572" fill="none" role="img" aria-label="연기를 빨아들이는 침니형 주방 후드 일러스트">
<defs><linearGradient id="hs" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#6f747b"/><stop offset=".45" stop-color="#e4e6e9"/><stop offset=".55" stop-color="#c9ccd1"/><stop offset="1" stop-color="#5d6269"/></linearGradient><linearGradient id="hb" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#cfd2d6"/><stop offset="1" stop-color="#7e838a"/></linearGradient><radialGradient id="lg" cx="50%" cy="0%" r="80%"><stop stop-color="#e9bd6a" stop-opacity=".5"/><stop offset="1" stop-color="#e9bd6a" stop-opacity="0"/></radialGradient><linearGradient id="ct" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#202328"/><stop offset="1" stop-color="#101214"/></linearGradient></defs>
<rect x="232" y="0" width="96" height="190" fill="url(#hs)"/><path d="M90 300 232 190h96l142 110z" fill="url(#hs)"/><rect x="90" y="300" width="380" height="22" rx="3" fill="url(#hb)"/><rect x="170" y="318" width="220" height="4" rx="2" fill="#e9bd6a"/>
<path class="glow" d="M120 322h320l70 190H50z" fill="url(#lg)"/>
<g class="flow" stroke="#e9bd6a" stroke-width="2.2" stroke-linecap="round" opacity=".85"><path d="M170 500c-10-60 30-90 30-170"/><path d="M230 510c0-70 20-100 20-185"/><path d="M290 512c-6-70 10-110-6-190"/><path d="M350 508c6-70-14-100-10-185"/><path d="M410 500c10-60-26-90-30-170"/></g>
<rect x="40" y="512" width="480" height="44" rx="6" fill="url(#ct)" stroke="#2c3036"/><ellipse cx="190" cy="520" rx="52" ry="7" fill="#0b0c0e" stroke="#3a3f46"/><ellipse cx="370" cy="520" rx="52" ry="7" fill="#0b0c0e" stroke="#3a3f46"/><circle cx="452" cy="540" r="4" fill="#e9bd6a"/><circle cx="472" cy="540" r="4" fill="#3a3f46"/></svg>`;
const LOGO_SVG = `<svg viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="11" fill="#131518"/><rect x=".5" y=".5" width="39" height="39" rx="10.5" stroke="#d4a24c" stroke-opacity=".5"/><path d="M16 9h8v8l8 7H8l8-7z" fill="#e1e4e7"/><rect x="8" y="24" width="24" height="3" rx="1" fill="#e9bd6a"/><path d="M14 31v2M20 31v3M26 31v2" stroke="#e9bd6a" stroke-width="1.6" stroke-linecap="round"/></svg>`;
const typeImg = t => has(`type-${t.slug}.webp`) ? `/img/type-${t.slug}.webp` : null;
const typeVisual = (t, alt, eager) => typeImg(t) ? `<img src="${typeImg(t)}" alt="${esc(alt)}" width="640" height="800" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'}>` : ILL[t.slug] || HERO_SVG;

// ---------- areas
const AREAS = [];
const mk = o => (AREAS.push(o), o);
const seoul = mk({ path: '/area/seoul/', name: '서울', label: '서울', full: '서울특별시', level: 'sido', children: [] });
for (const e of D.SEOUL) { const [n, s] = e.split(':'); seoul.children.push(mk({ path: `/area/seoul/${s}/`, name: n, label: `서울 ${n}`, full: `서울특별시 ${n}`, level: 'gu', parent: seoul })); }
function addProv(code, name, full, list) {
  const p = mk({ path: `/area/${code}/`, name, label: name, full, level: 'sido', children: [] });
  for (const [n, s, gus] of list) {
    const short = n.replace(/[시군]$/, '');
    const c = mk({ path: `/area/${code}/${s}/`, name: n, label: n, short, full: `${full} ${n}`, level: n.endsWith('군') ? 'gun' : 'si', parent: p, children: [] });
    p.children.push(c);
    for (const e of gus || []) { const [gn, gs] = e.split(':'); c.children.push(mk({ path: `/area/${code}/${s}/${gs}/`, name: gn, label: `${short} ${gn}`, full: `${full} ${n} ${gn}`, level: 'gu', parent: c })); }
  }
  return p;
}
const gg = addProv('gyeonggi', '경기', '경기도', D.GYEONGGI);
const ic = mk({ path: '/area/incheon/', name: '인천', label: '인천', full: '인천광역시', level: 'sido', children: [] });
for (const e of D.INCHEON) { const [n, s] = e.split(':'); ic.children.push(mk({ path: `/area/incheon/${s}/`, name: n, label: `인천 ${n}`, full: `인천광역시 ${n}`, level: n.endsWith('군') ? 'gun' : 'gu', parent: ic })); }
const cn = addProv('chungnam', '충남', '충청남도', D.CHUNGNAM);
const SIDO = [seoul, gg, ic, cn];
const unit = a => a === seoul ? '구' : a === ic ? '구·군' : a.level === 'sido' ? '시·군' : '구';

// ---------- layout
function head(o) {
  if (titles.has(o.title)) throw new Error('중복 title: ' + o.title + ' @ ' + o.path + ' & ' + titles.get(o.title));
  if (descs.has(o.desc)) throw new Error('중복 description @ ' + o.path + ' & ' + descs.get(o.desc));
  titles.set(o.title, o.path); descs.set(o.desc, o.path);
  pages.push({ path: o.path, title: o.title, desc: o.desc, noindex: o.noindex });
  const og = SITE + (o.image || '/og.png');
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.desc)}">
${o.noindex ? '<meta name="robots" content="noindex,follow">' : `<link rel="canonical" href="${SITE}${o.path}">\n<meta name="robots" content="index,follow,max-image-preview:large">`}
${D.NAVER_VERIFY ? `<meta name="naver-site-verification" content="${esc(D.NAVER_VERIFY)}">\n` : ''}${D.GOOGLE_VERIFY ? `<meta name="google-site-verification" content="${esc(D.GOOGLE_VERIFY)}">\n` : ''}<meta property="og:type" content="${o.ogType || 'website'}">
<meta property="og:site_name" content="${BRAND}">
<meta property="og:url" content="${SITE}${o.path}">
<meta property="og:title" content="${esc(o.title)}">
<meta property="og:description" content="${esc(o.desc)}">
<meta property="og:image" content="${og}">
<meta property="og:locale" content="ko_KR">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0b0c0e">
<meta name="format-detection" content="telephone=no">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32">
<link rel="icon" href="/favicon-16x16.png" type="image/png" sizes="16x16">
<link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180">
<link rel="manifest" href="/site.webmanifest">
<link rel="alternate" type="application/rss+xml" title="${BRAND}" href="${SITE}/rss.xml">
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<link rel="stylesheet" href="/style.css?v=${CSSV}">
${(o.ld || []).map(x => `<script type="application/ld+json">${JSON.stringify(x)}</script>`).join('\n')}
</head>
<body>
<header class="hd"><div class="wrap">
  <a href="/" class="logo" aria-label="${BRAND} 홈">${LOGO_SVG}<span><b>${BRAND}</b><small>HOOD SPECIALIST</small></span></a>
  <nav class="nav" aria-label="주요 메뉴"><a href="/hood/">후드 종류</a><a href="/#works">시공 사례</a><a href="/area/">시공 지역</a><a href="/guide/">후드 가이드</a><a href="/#faq">자주 묻는 질문</a></nav>
  <a href="tel:${PHONE}" class="tel" aria-label="전화 상담 ${PHONE_D}"><i></i>${PHONE_D}</a>
</div></header>
<main>`;
}
function foot(body) {
  return `</main>
<footer class="ft"><div class="wrap">
  <div class="ftg">
    <div><a href="/" class="logo">${LOGO_SVG}<span><b style="color:#fff">${BRAND}</b><small>HOOD SPECIALIST</small></span></a>
      <p style="margin-top:18px">주방 후드 교체·설치 전문<br>대표번호 <a href="tel:${PHONE}" style="color:#fff;font-weight:800">${PHONE_D}</a><br>상담 ${D.HOURS}<br>${D.AS}</p></div>
    <div><h4>후드 종류</h4><ul>${TYPES.map(t => `<li><a href="/hood/${t.slug}/">${t.name}</a></li>`).join('')}</ul></div>
    <div><h4>후드 가이드</h4><ul>${GUIDES.map(g => `<li><a href="/guide/${g.slug}/">${g.short}</a></li>`).join('')}</ul></div>
    <div><h4>시공 지역</h4><ul>${SIDO.map(s => `<li><a href="${s.path}">${s.full}</a></li>`).join('')}<li><a href="/area/">전체 지역 보기</a></li></ul></div>
  </div>
  <div class="cp"><span>© ${BRAND} · 주방 후드 교체 전문</span><span><a href="/sitemap.xml">사이트맵</a> · <a href="/rss.xml">RSS</a></span></div>
</div></footer>
<nav class="mb" aria-label="빠른 상담"><a href="${esc(sms(body || `[${BRAND} 후드 견적]\n지역: \n(후드 사진 첨부)`))}">문자 견적</a><a href="tel:${PHONE}">전화 상담</a></nav>
</body>
</html>
`;
}
const BIZ_ID = SITE + '/#business';
const BIZ = areaServed => ({
  '@context': 'https://schema.org', '@type': 'HomeAndConstructionBusiness', '@id': BIZ_ID, name: BRAND, url: SITE + '/', telephone: '+82-10-9413-4686',
  image: SITE + '/og.png', logo: SITE + '/icon-512.png',
  description: '주방 후드 교체·설치 전문. 슬림형·침니형·아일랜드·빌트인 후드 교체와 후드 덕트 교체.',
  areaServed, knowsAbout: ['주방 후드 교체', '렌지후드 설치', '아일랜드 후드', '침니 후드', '빌트인 후드', '후드 덕트', '역류 방지 댐퍼'],
  openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], opens: '09:00', closes: '22:00' }],
  hasOfferCatalog: { '@type': 'OfferCatalog', name: '후드 시공', itemListElement: TYPES.map(t => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: t.name, url: `${SITE}/hood/${t.slug}/` } })) }
});
const FAQLD = f => ({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: f.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: strip(a) } })) });
const CRUMB = l => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: l.map(([n, p], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: SITE + p })) });
const crumbHtml = l => `<nav class="crumb" aria-label="현재 위치">${l.map(([n, p], i) => i < l.length - 1 ? `<a href="${p}">${esc(n)}</a><i>/</i>` : `<span aria-current="page">${esc(n)}</span>`).join('')}</nav>`;
const faqHtml = f => `<div class="faq">${f.map(([q, a], i) => `<details${i === 0 ? ' open' : ''}><summary>${esc(q)}</summary><p>${a}</p></details>`).join('')}</div>`;
const FIN = (lead, body) => `<section class="fin"><div class="wrap"><span class="ey">Contact</span><h2 style="margin-top:18px">${lead}</h2><a href="tel:${PHONE}" class="big">${PHONE_D}</a><p>상담 ${D.HOURS} · ${D.AS}</p><div class="cta"><a class="btn btn-g ar" href="${esc(sms(body))}">후드 사진 보내고 견적받기</a><a class="btn btn-o" href="tel:${PHONE}">전화 상담</a></div></div></section>`;
const TL = [['사진 상담', '지금 후드 사진과 쿡탑이 보이는 사진을 문자로 보내 주세요.'], ['규격 확인', '후드 폭, 덕트 위치, 상부장 구조를 보고 맞는 제품과 범위를 안내합니다.'], ['방문 철거', '보양 후 기존 후드를 안전하게 철거하고 덕트 상태를 점검합니다.'], ['설치·연결', '수평을 맞춰 고정하고 덕트와 전원을 연결해 마감합니다.'], ['작동 확인', '흡입·조명·버튼을 함께 확인하고, 시공 후 1개월 A/S를 책임집니다.']];
const tlHtml = () => `<div class="tl">${TL.map(([a, b], i) => `<div><span class="d">${i + 1}</span><h3>${a}</h3><p>${b}</p></div>`).join('')}</div>`;
const galHtml = (list, eager) => `<div class="ba">${list.map(g => `<figure><img src="/img/gallery/${g.file}" alt="${BRAND} ${esc(g.title)} 시공 전 시공 후 비교 사진" width="1400" height="700" ${eager ? '' : 'loading="lazy"'}><figcaption><b>${esc(g.title)}</b><span>${esc(g.note)}</span></figcaption></figure>`).join('')}</div>`;
function write(p, html) { const f = path.join(OUT, p, 'index.html'); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, html); }

// ---------- MAIN
function main() {
  const faqs = [
    ['후드 교체는 어떻게 문의하나요?', `지금 쓰는 후드 정면 사진과 쿡탑이 함께 보이는 사진, 주소를 ${PHONE_D}로 문자 보내 주세요. 맞는 규격과 시공 범위를 먼저 안내합니다.`],
    ['어느 지역까지 시공하나요?', '서울·경기·인천·충남을 시·군·구 단위로 방문합니다. 지역별 안내는 <a href="/area/">시공 지역</a>에서 확인할 수 있습니다.'],
    ['제가 구매한 후드도 설치해 주나요?', '네. 모델명을 미리 알려 주시면 상부장·덕트 호환을 먼저 확인합니다.'],
    ['후드만 바꾸면 흡입력이 좋아지나요?', '덕트가 찢어지거나 꺾여 있으면 새 후드도 제 성능을 내기 어렵습니다. 교체할 때 덕트 상태를 함께 점검합니다.'],
    ['다른 집 냄새가 들어오는 것도 해결되나요?', '역류 방지 댐퍼가 있는 제품으로 교체하거나 덕트에 댐퍼를 추가하면 도움이 됩니다. <a href="/guide/backflow/">냄새 역류 가이드</a>'],
    ['상담 시간과 A/S는요?', `상담은 ${D.HOURS} 가능하며, ${D.AS}를 책임집니다.`]
  ];
  const body = `[${BRAND} 후드 견적]\n증상: \n지역: \n(후드 사진 첨부)`;
  const SYM = [['흡입력이 약해요', '연기가 위로 안 빨려요'], ['소리가 너무 커요', '윙윙·떨림 소음'], ['냄새가 역류해요', '다른 집 냄새가 들어와요'], ['기름이 떨어져요', '쿡탑 위로 기름 방울'], ['쿡탑을 바꿨어요', '인덕션 폭에 맞추고 싶어요'], ['형태를 바꾸고 싶어요', '슬림 → 침니·아일랜드']];
  let h = head({
    path: '/', title: `${BRAND} | 주방 후드 교체·설치 전문 — 슬림·침니·아일랜드·빌트인`,
    desc: `주방 후드 교체 전문 ${BRAND}. 흡입력 약한 후드, 시끄러운 후드를 실측 후 맞는 규격으로 교체하고 덕트까지 정리합니다. 서울·경기·인천·충남 출장, 매일 09~22시 상담.`,
    ld: [BIZ(SIDO.map(s => ({ '@type': 'AdministrativeArea', name: s.full }))), { '@context': 'https://schema.org', '@type': 'WebSite', '@id': SITE + '/#website', name: BRAND, url: SITE + '/', inLanguage: 'ko-KR', publisher: { '@id': BIZ_ID } }, FAQLD(faqs)]
  });
  h += `
<section class="hero"><div class="wrap">
  <div class="hg">
    <div>
      <span class="ey">Kitchen Hood Specialist</span>
      <h1>주방 후드 교체,<br><em>매직후드</em>가<br>제대로 합니다.</h1>
      <p class="sub">후드만 다룹니다. 그래서 상부장 폭, 덕트 경로, 천장 구조까지 먼저 봅니다. 연기는 빨아들이고 소음과 냄새는 줄이는 후드 교체.</p>
      <div class="cta"><a class="btn btn-g ar" href="${esc(sms(body))}">후드 사진 보내고 견적받기</a><a class="btn btn-o" href="tel:${PHONE}">${PHONE_D}</a></div>
      <div class="badges"><div><b>5가지</b><span>후드 형태 시공</span></div><div><b>09–22</b><span>매일 상담</span></div><div><b>1개월</b><span>시공 후 A/S</span></div><div><b>4개 시·도</b><span>서울·경기·인천·충남</span></div></div>
    </div>
    <div class="hv">${HERO_SVG}</div>
  </div>
  <div class="strip" aria-hidden="true"><div>${[0, 1].map(() => TYPES.map(t => `<span><b>${t.en.toUpperCase()}</b>${t.name}</span>`).join('') + '<span><b>DAMPER</b>역류 방지 댐퍼</span><span><b>NOISE</b>소음 해결</span>').join('')}</div></div>
</div></section>

<section id="works"><div class="wrap">
  <div class="hrow"><div><span class="ey">01 · Before &amp; After</span><h2 class="h">말보다 사진으로<br>보여 드립니다</h2><p class="lead">${BRAND}가 직접 교체한 현장입니다. 같은 주방, 후드만 바꿨습니다.</p></div></div>
  ${galHtml(GALLERY)}
</div></section>

<section class="st0" id="start"><div class="wrap">
  <span class="ey">02 · Diagnosis</span><h2 class="h">어떤 문제가 있으세요?</h2><p class="lead">증상을 고르고 지역을 적으면 견적 문자가 자동으로 작성됩니다. 사진만 첨부해서 보내 주세요.</p>
  <div class="pick" role="group" aria-label="후드 증상 선택">${SYM.map(([a, b], i) => `<button type="button" aria-pressed="${i === 0}" data-v="${esc(a)}"><b>${a}</b><small>${b}</small></button>`).join('')}</div>
  <div class="pick-go"><p>선택한 증상: <b id="sv">${SYM[0][0]}</b></p><label for="ar" class="sr">지역</label><input id="ar" type="text" placeholder="지역 (예: 수원시 영통구)" autocomplete="address-level2"><a id="go" class="btn btn-k ar" href="sms:${PHONE}">문자 견적 보내기</a></div>
</div></section>

<section class="dk" id="types"><div class="wrap">
  <div class="hrow"><div><span class="ey">03 · Hood types</span><h2 class="h">우리 집 후드는<br>어떤 형태인가요</h2><p class="lead">형태마다 확인할 부분이 다릅니다. 지금 쓰는 후드와 비슷한 형태를 눌러 보세요.</p></div><a class="btn btn-o ar" href="/guide/choose-type/">후드 종류 고르는 법</a></div>
  <div class="types">${TYPES.map(t => `<a class="tc" href="/hood/${t.slug}/"><div class="ill">${typeVisual(t, `${BRAND} ${t.name} 교체 시공 사진`)}</div><div class="tx"><small>${t.en.toUpperCase()}</small><h3>${t.name}</h3><p>${t.lead}</p></div></a>`).join('')}</div>
  <div class="why">
    <div><span class="n">01</span><h3>후드만 합니다</h3><p>후드와 덕트만 다루기 때문에 현장 판단이 빠르고 정확합니다.</p></div>
    <div><span class="n">02</span><h3>덕트까지 봅니다</h3><p>새 후드 성능이 제대로 나오도록 덕트 손상과 꺾임을 함께 확인합니다.</p></div>
    <div><span class="n">03</span><h3>먼저 설명합니다</h3><p>규격, 작업 범위, 필요한 부속을 시공 전에 먼저 안내합니다.</p></div>
    <div><span class="n">04</span><h3>끝까지 확인합니다</h3><p>흡입·조명·버튼을 함께 확인하고 시공 후 1개월 A/S를 책임집니다.</p></div>
  </div>
</div></section>

<section id="process"><div class="wrap"><span class="ey">04 · Process</span><h2 class="h">사진 한 장에서<br>작동 확인까지</h2>${tlHtml()}</div></section>

<section class="st0" id="guide"><div class="wrap">
  <div class="hrow"><div><span class="ey">05 · Guide</span><h2 class="h">후드 교체 전에<br>읽어 보세요</h2></div><a class="btn btn-l ar" href="/guide/">가이드 전체</a></div>
  <div class="gd">${GUIDES.slice(0, 3).map(g => `<a href="/guide/${g.slug}/"><small>GUIDE</small><h3>${g.title}</h3><p>${g.desc}</p></a>`).join('')}</div>
</div></section>

<section class="dk" id="area"><div class="wrap">
  <div class="hrow"><div><span class="ey">06 · Service area</span><h2 class="h">서울·경기·인천·충남<br>시·군·구까지 방문합니다</h2></div><a class="btn btn-o ar" href="/area/">전체 지역</a></div>
  <div class="ag">${SIDO.map(s => `<div class="ab"><h3><a href="${s.path}">${s.full}</a><small>${s.children.length}개 ${unit(s)}</small></h3><div class="lk">${s.children.map(c => `<a href="${c.path}">${c.short || c.name}</a>`).join('')}</div></div>`).join('')}</div>
</div></section>

<section id="faq"><div class="wrap"><span class="ey">07 · FAQ</span><h2 class="h">자주 묻는 질문</h2>${faqHtml(faqs)}</div></section>
${FIN('연기 가득한 주방,<br>오늘 상담하세요.', body)}
<script>
(function(){var P='${PHONE}',b=document.querySelectorAll('.pick button'),sv=document.getElementById('sv'),ar=document.getElementById('ar'),go=document.getElementById('go'),v=b[0].dataset.v;
function u(){go.href='sms:'+P+'?&body='+encodeURIComponent('[${BRAND} 후드 견적]\\n증상: '+v+'\\n지역: '+(ar.value.trim()||'')+'\\n(후드 사진 첨부)')}
b.forEach(function(x){x.addEventListener('click',function(){b.forEach(function(y){y.setAttribute('aria-pressed',y===x)});v=x.dataset.v;sv.textContent=v;u()})});ar.addEventListener('input',u);u()})();
</script>
` + foot(body);
  write('/', h);
}

// ---------- HOOD TYPES
function typeIndex() {
  const p = '/hood/', cr = [['홈', '/'], ['후드 종류', p]];
  let h = head({ path: p, title: `후드 종류별 교체 안내 — 슬림·침니·아일랜드·빌트인·덕트 | ${BRAND}`, desc: '슬림형, 침니형, 아일랜드, 빌트인 후드와 후드 덕트 교체까지. 형태별 특징과 교체 전 확인할 점을 정리했습니다.', ld: [CRUMB(cr)] });
  h += `<section class="sh"><div class="wrap">${crumbHtml(cr)}<h1>후드 형태별<br><em>교체 안내</em></h1><p class="sub">지금 쓰는 후드와 비슷한 형태를 골라 보세요. 형태마다 확인할 부분과 시공 포인트가 다릅니다.</p></div></section>
<section style="padding-top:64px"><div class="wrap"><div class="types" style="margin-top:0">${TYPES.map(t => `<a class="tc" href="/hood/${t.slug}/"><div class="ill">${typeVisual(t, `${BRAND} ${t.name} 교체 사진`)}</div><div class="tx"><small>${t.en.toUpperCase()}</small><h3>${t.name}</h3><p>${t.lead}</p></div></a>`).join('')}</div></div></section>
${FIN('형태가 헷갈리면<br>사진만 보내 주세요.', `[${BRAND} 후드 견적]\n(후드 사진 첨부)`)}` + foot();
  write(p, h);
}
function typePage(t) {
  const p = `/hood/${t.slug}/`, cr = [['홈', '/'], ['후드 종류', '/hood/'], [t.name, p]];
  const faqs = t.faq.concat([['교체 후 A/S는요?', `${D.AS}를 책임집니다. 문제가 생기면 같은 번호로 연락 주세요.`]]);
  const body = `[${BRAND} ${t.name} 견적]\n지역: \n(후드 사진 첨부)`;
  const areaPick = shuffle(AREAS.filter(a => a.level !== 'sido'), 'tp' + t.slug).slice(0, 16);
  const gal = GALLERY.filter(g => g.type === t.slug);
  const isDuct = t.slug === 'duct';
  let h = head({
    path: p, title: isDuct ? `후드 덕트 교체·역류 방지 댐퍼 시공 | ${BRAND}` : `${t.name} 교체·설치 전문 시공 | ${BRAND}`, desc: `${t.lead} 교체 전 확인할 점과 시공 과정, 자주 묻는 질문을 정리했습니다.`,
    image: typeImg(t),
    ld: [CRUMB(cr), FAQLD(faqs), { '@context': 'https://schema.org', '@type': 'Service', name: t.name, serviceType: '주방 후드 교체', description: t.lead, url: SITE + p, image: typeImg(t) ? SITE + typeImg(t) : undefined, provider: { '@id': BIZ_ID }, areaServed: SIDO.map(s => ({ '@type': 'AdministrativeArea', name: s.full })) }]
  });
  h += `<section class="sh"><div class="wrap shg"><div>${crumbHtml(cr)}<h1>${t.name},<br><em>${isDuct ? '성능의 절반' : '딱 맞게'}</em> ${isDuct ? '입니다' : '교체합니다'}</h1><p class="sub">${t.lead}</p><div class="cta"><a class="btn btn-g ar" href="${esc(sms(body))}">${t.short} 견적받기</a><a class="btn btn-o" href="tel:${PHONE}">${PHONE_D}</a></div></div><div class="shv">${typeVisual(t, `${BRAND} ${t.name} 교체 시공 사진`, true)}</div></div></section>
<div class="wrap"><dl class="facts"><div><dt>시공 형태</dt><dd>${t.name}</dd></div><div><dt>사전 확인</dt><dd>${t.check[0]}</dd></div><div><dt>상담</dt><dd>${D.HOURS}</dd></div><div><dt>사후 관리</dt><dd>${D.AS}</dd></div></dl></div>
${gal.length ? `<section style="padding-top:80px;padding-bottom:0"><div class="wrap"><span class="ey">Before &amp; After</span><h2 class="h">${t.short} 실제 교체 사례</h2>${galHtml(gal)}</div></section>` : ''}
<section style="padding-top:80px"><div class="wrap art"><div class="body">
  <h2>${t.name}${isDuct ? '가 중요한 이유' : '은 이런 후드입니다'}</h2>${t.body.map(x => `<p>${x}</p>`).join('')}
  <h2>교체 전에 확인할 세 가지</h2><ul class="chk" style="grid-template-columns:1fr">${t.check.map(x => `<li>${x}</li>`).join('')}</ul><p>세 가지가 보이는 사진을 문자로 보내 주시면 가장 빠르게 안내받을 수 있습니다.</p>
  <h2>${t.short} 교체 과정</h2><ol class="steps">${TL.map(([a, b]) => `<li><b>${a}</b><span>${b}</span></li>`).join('')}</ol>
  <h2>${t.short} 자주 묻는 질문</h2>${faqHtml(faqs)}
</div><aside class="aside"><div class="card-k"><h3>${t.short} 견적</h3><p>후드 정면 사진과 쿡탑이 보이는 사진, 지역만 보내 주세요.</p><a class="btn btn-g" href="${esc(sms(body))}">문자 보내기</a></div>
<div class="card-w"><h3>다른 후드 형태</h3><ul>${TYPES.filter(x => x !== t).map(x => `<li><a href="/hood/${x.slug}/">${x.name}</a></li>`).join('')}</ul></div>
<div class="card-w"><h3>관련 가이드</h3><ul>${GUIDES.map(g => `<li><a href="/guide/${g.slug}/">${g.short}</a></li>`).join('')}</ul></div></aside></div></section>
<section class="st0"><div class="wrap"><span class="ey">Area</span><h2 class="h">${t.short} 시공 지역</h2><div class="ll">${areaPick.map(a => `<a href="${a.path}">${a.label}</a>`).join('')}<a href="/area/" class="on">전체 지역 →</a></div></div></section>
${FIN(`${t.short} 교체,<br>사진 한 장이면 됩니다.`, body)}` + foot(body);
  write(p, h);
}

// ---------- GUIDES
function guideIndex() {
  const p = '/guide/', cr = [['홈', '/'], ['후드 가이드', p]];
  let h = head({ path: p, title: `주방 후드 가이드 — 교체 시기·종류·크기·소음·냄새 역류 | ${BRAND}`, desc: '주방 후드를 바꾸기 전에 알아 두면 좋은 정보. 교체 시기, 후드 종류와 크기 고르는 법, 소음과 냄새 역류 해결 방법.', ld: [CRUMB(cr)] });
  h += `<section class="sh"><div class="wrap">${crumbHtml(cr)}<h1>후드, 알고 바꾸면<br><em>후회가 없습니다</em></h1><p class="sub">후드 교체를 고민할 때 가장 많이 묻는 질문을 주제별로 정리했습니다.</p></div></section>
<section style="padding-top:64px"><div class="wrap"><div class="gd" style="margin-top:0">${GUIDES.map(g => `<a href="/guide/${g.slug}/"><small>GUIDE</small><h3>${g.title}</h3><p>${g.desc}</p></a>`).join('')}</div></div></section>` + foot();
  write(p, h);
}
function guidePage(g, i) {
  const p = `/guide/${g.slug}/`, cr = [['홈', '/'], ['후드 가이드', '/guide/'], [g.short, p]];
  const body = `[${BRAND} 후드 상담]\n(후드 사진 첨부)`;
  let h = head({
    path: p, title: `${g.title} | ${BRAND}`, desc: g.desc, ogType: 'article',
    ld: [CRUMB(cr), { '@context': 'https://schema.org', '@type': 'Article', headline: g.title, description: g.desc, inLanguage: 'ko-KR', datePublished: '2026-11-24', dateModified: TODAY, image: SITE + '/og.png', author: { '@type': 'Organization', name: BRAND, url: SITE + '/' }, publisher: { '@id': BIZ_ID }, mainEntityOfPage: SITE + p }]
  });
  h += `<section class="sh" style="padding-bottom:72px"><div class="wrap">${crumbHtml(cr)}<span class="ey" style="margin-top:22px">Guide ${String(i + 1).padStart(2, '0')}</span><h1 style="font-size:clamp(30px,4.4vw,52px);max-width:900px">${g.title}</h1><p class="sub">${g.desc}</p></div></section>
<section style="padding-top:72px"><div class="wrap art"><article class="body">
  <div class="sum"><b>핵심 요약</b><ul>${g.sections.map(s => `<li>${s[0]}</li>`).join('')}</ul></div>
  ${g.sections.map(([a, b]) => `<h2>${a}</h2><p>${b}</p>`).join('')}
  <h2>정리</h2><p>판단이 어렵다면 지금 쓰는 후드 사진을 보내 주세요. 교체가 필요한지, 청소나 부분 수리로 충분한지부터 솔직하게 안내해 드립니다. 후드 형태별 안내는 <a href="/hood/">후드 종류</a>에서 볼 수 있습니다.</p>
</article><aside class="aside"><div class="card-k"><h3>사진으로 바로 확인</h3><p>후드 정면 사진과 쿡탑이 보이는 사진을 보내 주세요.</p><a class="btn btn-g" href="${esc(sms(body))}">문자 보내기</a></div>
<div class="card-w"><h3>다른 가이드</h3><ul>${GUIDES.filter(x => x !== g).map(x => `<li><a href="/guide/${x.slug}/">${x.short}</a></li>`).join('')}</ul></div>
<div class="card-w"><h3>후드 종류</h3><ul>${TYPES.map(x => `<li><a href="/hood/${x.slug}/">${x.name}</a></li>`).join('')}</ul></div></aside></div></section>
${FIN('읽어 봐도 헷갈린다면<br>사진으로 물어보세요.', body)}` + foot(body);
  write(p, h);
}

// ---------- AREA pages
const SECKEYS = Object.keys(P.SECTIONS);
function areaPage(a) {
  const seed = a.path, n = a.label, full = a.full;
  const r = rng(seed + 'x');
  const pickFn = arr => arr[Math.floor(r() * arr.length)];
  pickFn.n = (arr, k) => shuffle(arr, seed + r()).slice(0, k);
  const title = one(P.TITLE, seed + 't')(n);
  const desc = one(P.DESC, seed + 'd')(n, full);
  const h1 = one(P.H1, seed + 'h')(esc(n));
  const sub = one(P.SUB, seed + 's')(n);
  const secs = shuffle(SECKEYS, seed + 'o').slice(0, 5 + (hash(seed + 'k') % 2));
  const faqs = [P.FAQ[0](n)].concat(shuffle(P.FAQ.slice(1), seed + 'f').slice(0, 4).map(f => f(n)));
  const photoTypes = TYPES.filter(t => typeImg(t));
  const heroType = one(photoTypes.length ? photoTypes : TYPES, seed + 'ht');
  const case1 = one(GALLERY, seed + 'g');
  const cr = [['홈', '/'], ['시공 지역', '/area/']];
  let x = a; const chain = []; while (x) { chain.unshift(x); x = x.parent; }
  chain.forEach(c => cr.push([c.level === 'sido' ? c.full : c.name, c.path]));
  const body = `[${BRAND} 후드 견적]\n지역: ${full} \n(후드 사진 첨부)`;
  const secHtml = secs.map(k => { const S = P.SECTIONS[k]; return `<div class="blk"><h2>${esc(one(S.t, seed + k)(n))}</h2>${S.b(n, pickFn, TYPES)}</div>`; }).join('');
  const caseHtml = `<div class="blk case"><h2>${one([`실제 교체 사례: ${case1.title}`, `${case1.title}, 이렇게 바뀝니다`, `참고 사례 — ${case1.title}`], seed + 'ct')}</h2><figure><img src="/img/gallery/${case1.file}" alt="${BRAND} ${esc(case1.title)} 시공 전 시공 후 사진" width="1400" height="700" loading="lazy"></figure><p>${esc(case1.note)}</p></div>`;
  const blocks = secHtml.split('</div><div class="blk">');
  const insertAt = 1 + (hash(seed + 'ci') % 3);
  const allBlocks = secs.map(k => { const S = P.SECTIONS[k]; return `<div class="blk"><h2>${esc(one(S.t, seed + k)(n))}</h2>${S.b(n, pickFn, TYPES)}</div>`; });
  void blocks;
  allBlocks.splice(insertAt, 0, caseHtml);

  let kids = '';
  if (a.children && a.children.length) kids = `<section style="padding-top:80px;padding-bottom:0"><div class="wrap"><span class="ey">Districts</span><h2 class="h">${esc(a.level === 'sido' ? a.full : n)} ${a.children.length}개 ${unit(a)}</h2><div class="ll">${a.children.map(c => `<a href="${c.path}">${c.label}</a>`).join('')}</div></div></section>`;
  let near;
  if (a.parent) {
    const sib = a.parent.children.filter(c => c !== a);
    const i = Math.max(0, a.parent.children.indexOf(a) - 5);
    const take = sib.slice(i, i + 10);
    near = `<section class="st0"><div class="wrap"><span class="ey">Nearby</span><h2 class="h">${esc(a.parent.level === 'sido' ? a.parent.full : a.parent.name)}의 다른 지역</h2><div class="ll">${(take.length ? take : sib.slice(0, 10)).map(c => `<a href="${c.path}">${c.label}</a>`).join('')}<a class="on" href="${a.parent.path}">${a.parent.label} 전체 →</a></div></div></section>`;
  } else near = `<section class="st0"><div class="wrap"><span class="ey">Other areas</span><h2 class="h">다른 시·도</h2><div class="ll">${SIDO.filter(s => s !== a).map(s => `<a href="${s.path}">${s.full}</a>`).join('')}</div></div></section>`;
  const place = { '@type': a.level === 'sido' ? 'AdministrativeArea' : 'City', name: full };
  let h = head({ path: a.path, title, desc, image: typeImg(heroType), ld: [BIZ([place]), CRUMB(cr), FAQLD(faqs), { '@context': 'https://schema.org', '@type': 'Service', name: `${n} 주방 후드 교체`, serviceType: '주방 후드 교체', url: SITE + a.path, provider: { '@id': BIZ_ID }, areaServed: place }] });
  h += `<section class="sh"><div class="wrap shg"><div>${crumbHtml(cr)}<h1>${h1}</h1><p class="sub">${esc(sub)}</p><div class="cta"><a class="btn btn-g ar" href="${esc(sms(body))}">${esc(n)} 후드 견적</a><a class="btn btn-o" href="tel:${PHONE}">${PHONE_D}</a></div></div><div class="shv">${typeVisual(heroType, `${n} ${heroType.name} 교체 시공 사진`, true)}</div></div></section>
<div class="wrap"><dl class="facts"><div><dt>방문 지역</dt><dd>${esc(full)}</dd></div><div><dt>시공</dt><dd>후드 교체·설치·덕트</dd></div><div><dt>상담</dt><dd>${D.HOURS}</dd></div><div><dt>사후 관리</dt><dd>${D.AS}</dd></div></dl></div>
${kids}
<section style="padding-top:${kids ? 56 : 80}px"><div class="wrap">${allBlocks.join('')}</div></section>
<section class="st0"><div class="wrap"><span class="ey">FAQ</span><h2 class="h">${esc(n)} 후드 교체 질문</h2>${faqHtml(faqs)}</div></section>
${near}
${FIN(`${esc(n)} 후드 교체,<br>지금 상담하세요.`, body)}` + foot(body);
  write(a.path, h);
}
function areaIndex() {
  const p = '/area/', cr = [['홈', '/'], ['시공 지역', p]];
  let h = head({ path: p, title: `후드 교체 시공 지역 — 서울·경기·인천·충남 시·군·구 | ${BRAND}`, desc: '서울 25개 구, 경기 31개 시·군과 구, 인천 구·군, 충남 시·군까지. 매직후드 후드 교체 방문 지역을 확인하세요.', ld: [CRUMB(cr)] });
  h += `<section class="sh"><div class="wrap">${crumbHtml(cr)}<h1>어디든 <em>후드 교체</em><br>방문합니다</h1><p class="sub">시·도를 고른 뒤 시·군·구를 선택하면 해당 지역 안내를 볼 수 있습니다.</p></div></section>
<section style="padding-top:72px"><div class="wrap">${SIDO.map(s => `<div class="blk"><h2><a href="${s.path}">${s.full}</a></h2>${s.children.some(c => c.children && c.children.length) ? s.children.map(c => `<div class="ll" style="margin-top:12px"><a class="on" href="${c.path}">${c.name}</a>${(c.children || []).map(g => `<a href="${g.path}">${g.name}</a>`).join('')}</div>`).join('') : `<div class="ll">${s.children.map(c => `<a href="${c.path}">${c.name}</a>`).join('')}</div>`}</div>`).join('')}</div></section>` + foot();
  write(p, h);
}
function notFound() {
  const h = head({ path: '/404', title: `페이지를 찾을 수 없습니다 | ${BRAND}`, desc: '요청하신 페이지를 찾을 수 없습니다. 주소를 확인해 주세요.', noindex: true }) +
    `<section class="sh"><div class="wrap"><h1>페이지를 <em>찾을 수 없습니다</em></h1><p class="sub">주소가 바뀌었거나 삭제된 페이지입니다.</p><div class="cta"><a class="btn btn-g ar" href="/">홈으로</a><a class="btn btn-o" href="/area/">시공 지역</a></div></div></section>` + foot();
  fs.writeFileSync(path.join(OUT, '404.html'), h);
}

// ---------- RUN
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const css = fs.readFileSync(path.join(__dirname, 'style.css'), 'utf8');
CSSV = hash(css).toString(36);
fs.writeFileSync(path.join(OUT, 'style.css'), css);
if (fs.existsSync(IMG)) fs.cpSync(IMG, path.join(OUT, 'img'), { recursive: true });
for (const f of fs.readdirSync(path.join(__dirname, 'static'))) fs.copyFileSync(path.join(__dirname, 'static', f), path.join(OUT, f));

main(); typeIndex(); TYPES.forEach(typePage); guideIndex(); GUIDES.forEach(guidePage); areaIndex(); AREAS.forEach(areaPage); notFound();

const idx = pages.filter(p => !p.noindex);
const pri = p => p === '/' ? '1.0' : /^\/(hood|guide|area)\/$/.test(p) ? '0.9' : p.split('/').length <= 4 ? '0.8' : '0.7';
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${idx.map(p => `  <url><loc>${SITE}${p.path}</loc><lastmod>${TODAY}</lastmod><priority>${pri(p.path)}</priority></url>`).join('\n')}\n</urlset>\n`);
fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n\nUser-agent: Yeti\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
const rssItems = idx.filter(p => /^\/(guide|hood)\/.+/.test(p.path));
fs.writeFileSync(path.join(OUT, 'rss.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>${BRAND}</title><link>${SITE}/</link><description>주방 후드 교체·설치 전문</description><language>ko</language><lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n${rssItems.map(p => `<item><title>${esc(p.title)}</title><link>${SITE}${p.path}</link><guid>${SITE}${p.path}</guid><description>${esc(p.desc)}</description><pubDate>${new Date('2026-11-24T09:00:00+09:00').toUTCString()}</pubDate></item>`).join('\n')}\n</channel></rss>\n`);
fs.writeFileSync(path.join(OUT, 'llms.txt'), `# ${BRAND}\n\n> 주방 후드 교체·설치 전문 업체. 슬림형·침니형·아일랜드·빌트인 후드 교체와 후드 덕트 교체를 합니다.\n\n- 대표번호: ${PHONE_D} (전화·문자)\n- 상담: ${D.HOURS}\n- 사후 관리: ${D.AS}\n- 시공 지역: 서울특별시, 경기도, 인천광역시, 충청남도 (시·군·구 단위 안내)\n- 견적: 후드 정면 사진과 쿡탑이 보이는 사진, 주소를 문자로 보내면 1차 견적 안내\n\n## 후드 종류\n${TYPES.map(t => `- [${t.name}](${SITE}/hood/${t.slug}/): ${t.lead}`).join('\n')}\n\n## 가이드\n${GUIDES.map(g => `- [${g.title}](${SITE}/guide/${g.slug}/): ${g.desc}`).join('\n')}\n\n## 시공 지역\n${SIDO.map(s => `- [${s.full}](${SITE}${s.path})`).join('\n')}\n`);
console.log('built', pages.length, 'pages; unique titles', titles.size, '; unique descs', descs.size);
