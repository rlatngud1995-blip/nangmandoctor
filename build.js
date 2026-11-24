// 낭만닥터집사부 정적 사이트 생성기 — node build.js → public/
const fs = require('fs');
const path = require('path');
const D = require('./data.js');
const { SITE, PHONE, PHONE_D, BLOG, SERVICES, GROUPS } = D;
const OUT = path.join(__dirname, 'public');
const TODAY = new Date().toISOString().slice(0, 10);

// ---------- utils
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const sms = body => 'sms:' + PHONE + '?&body=' + encodeURIComponent(body);
const hash = s => { let h = 2166136261; for (const c of s) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
function rng(seed) { let x = hash(seed) || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; }
function pick(arr, n, seed) { const r = rng(seed), a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, n); }
const one = (arr, seed) => arr[hash(seed) % arr.length];
const svc = slug => SERVICES.find(s => s.slug === slug);
const imgOf = (s, small) => s.img ? `/img/${s.slug}${small ? '-s' : ''}.webp` : null;
const LAND = new Set(['countertop', 'countertop-removal']);
const josa = (w, a, b) => { const c = w.charCodeAt(w.length - 1); return (c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28) ? a : b; };
const pages = [];

// ---------- area model
const AREAS = []; // {path, name, label, full, level, parent, children, cities}
const seoul = { path: '/area/seoul/', name: '서울', label: '서울', full: '서울특별시', level: 'hub', children: [] };
AREAS.push(seoul);
for (const e of D.SEOUL) { const [n, s] = e.split(':'); const a = { path: `/area/seoul/${s}/`, name: n, label: `서울 ${n}`, full: `서울특별시 ${n}`, level: 'gu', parent: seoul }; seoul.children.push(a); AREAS.push(a); }
const gg = { path: '/area/gyeonggi/', name: '경기', label: '경기도', full: '경기도', level: 'hub', children: [] };
AREAS.push(gg);
for (const [n, s, gus] of D.GYEONGGI) {
  const short = n.replace(/[시군]$/, '');
  const c = { path: `/area/gyeonggi/${s}/`, name: n, label: n, short, full: `경기도 ${n}`, level: 'city', parent: gg, children: [] };
  gg.children.push(c); AREAS.push(c);
  for (const e of gus || []) { const [gn, gs] = e.split(':'); const g = { path: `/area/gyeonggi/${s}/${gs}/`, name: gn, label: `${short} ${gn}`, full: `경기도 ${n} ${gn}`, level: 'gu', parent: c }; c.children.push(g); AREAS.push(g); }
}
const ic = { path: '/area/incheon/', name: '인천', label: '인천', full: '인천광역시', level: 'hub', children: [] };
AREAS.push(ic);
for (const e of D.INCHEON) { const [n, s] = e.split(':'); const a = { path: `/area/incheon/${s}/`, name: n, label: `인천 ${n}`, full: `인천광역시 ${n}`, level: 'gu', parent: ic }; ic.children.push(a); AREAS.push(a); }
const PROV = D.PROVINCES.map(p => ({ path: `/area/${p.slug}/`, name: p.name, label: p.name, full: p.full, level: 'province', cities: p.cities, children: [] }));
AREAS.push(...PROV);
const HUBS = [seoul, gg, ic];

// ---------- layout
const LOGO = `<span class="logo-m"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/><path d="M12 11.5v5M9.5 14h5"/></svg></span>`;

function head(o) {
  const og = o.image ? SITE + o.image : SITE + '/img/island-hood.webp';
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.desc)}">
<link rel="canonical" href="${SITE}${o.path}">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta property="og:type" content="website">
<meta property="og:site_name" content="낭만닥터집사부">
<meta property="og:url" content="${SITE}${o.path}">
<meta property="og:title" content="${esc(o.title)}">
<meta property="og:description" content="${esc(o.desc)}">
<meta property="og:image" content="${og}">
<meta property="og:locale" content="ko_KR">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0e1013">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<link rel="stylesheet" href="/style.css?v=${hash(fs.readFileSync(path.join(__dirname, 'style.css'), 'utf8')).toString(36)}">
${o.preload ? `<link rel="preload" as="image" href="${o.preload}">` : ''}
${(o.ld || []).map(x => `<script type="application/ld+json">${JSON.stringify(x)}</script>`).join('\n')}
</head>
<body>
<header class="hd"><div class="wrap">
  <a href="/" class="logo" aria-label="낭만닥터집사부 홈">${LOGO}<span><b>낭만닥터집사부</b><small>HOME REPAIR</small></span></a>
  <nav class="nav" aria-label="주요 메뉴"><a href="/service/">시공 항목</a><a href="/area/">시공 지역</a><a href="/#process">진행 과정</a><a href="/#faq">자주 묻는 질문</a><a href="${BLOG}" target="_blank" rel="noopener">시공 블로그</a></nav>
  <a href="tel:${PHONE}" class="hd-tel" aria-label="전화 상담 ${PHONE_D}"><i></i>${PHONE_D}</a>
</div></header>
<main>`;
}

function foot(smsBody) {
  const body = smsBody || '[낭만닥터집사부 견적문의]\n지역: \n작업: \n(사진 첨부)';
  return `</main>
<footer class="ft"><div class="wrap">
  <div class="ft-g">
    <div><a href="/" class="logo">${LOGO}<span><b style="color:#fff">낭만닥터집사부</b><small>HOME REPAIR</small></span></a>
      <p style="margin-top:18px">전국 출장 집수리 · 부분 시공<br>대표번호 <a href="tel:${PHONE}" style="color:#fff;font-weight:800">${PHONE_D}</a><br>상담 매일 09:00 – 22:00<br>시공 후 1개월 A/S</p></div>
    <div><h4>주방</h4><ul>${SERVICES.filter(s => s.group === 'kitchen').map(s => `<li><a href="/service/${s.slug}/">${esc(s.name)}</a></li>`).join('')}</ul></div>
    <div><h4>실내·생활</h4><ul>${SERVICES.filter(s => s.group === 'living').map(s => `<li><a href="/service/${s.slug}/">${esc(s.name)}</a></li>`).join('')}</ul></div>
    <div><h4>건물 외부·시설</h4><ul>${SERVICES.filter(s => s.group === 'outdoor').map(s => `<li><a href="/service/${s.slug}/">${esc(s.name)}</a></li>`).join('')}</ul>
      <h4 style="margin-top:22px">시공 지역</h4><ul><li><a href="/area/seoul/">서울</a> · <a href="/area/gyeonggi/">경기</a> · <a href="/area/incheon/">인천</a></li><li>${PROV.map(p => `<a href="${p.path}">${p.name}</a>`).join(' · ')}</li></ul></div>
  </div>
  <p class="copy">© 낭만닥터집사부 · <a href="${BLOG}" target="_blank" rel="noopener">네이버 블로그 시공기록</a> · <a href="/sitemap.xml">사이트맵</a></p>
</div></footer>
<nav class="mbar" aria-label="빠른 상담"><a href="${esc(sms(body))}">문자 견적</a><a href="tel:${PHONE}">전화 상담</a></nav>
</body>
</html>
`;
}

const BIZ = (url, areaServed) => ({
  '@context': 'https://schema.org', '@type': 'HomeAndConstructionBusiness', '@id': SITE + '/#business',
  name: '낭만닥터집사부', url, telephone: '+82-10-9413-4686', image: SITE + '/img/island-hood.webp',
  description: '전국 출장 집수리·부분 시공. 상판 타공, 쿡탑·후드 교체, 수전·싱크볼 교체, 방범창, 주차시설물 등.',
  areaServed, sameAs: [BLOG],
  openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], opens: '09:00', closes: '22:00' }],
  hasOfferCatalog: { '@type': 'OfferCatalog', name: '시공 항목', itemListElement: SERVICES.map(s => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s.name, url: `${SITE}/service/${s.slug}/` } })) }
});
const FAQLD = f => ({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: f.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
const CRUMB = list => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: list.map(([n, p], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: SITE + p })) });
const crumbHtml = list => `<nav class="crumb" aria-label="현재 위치">${list.map(([n, p], i) => i < list.length - 1 ? `<a href="${p}">${esc(n)}</a><span>/</span>` : `<b>${esc(n)}</b>`).join('')}</nav>`;

const faqHtml = f => `<div class="faq">${f.map(([q, a], i) => `<details${i === 0 ? ' open' : ''}><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>`;

const card = (s, i, prefix = '') => `<a class="card" href="/service/${s.slug}/" data-g="${s.group}">
  <div class="ph${s.img ? '' : ' noimg'}">${s.img ? `<img src="${imgOf(s, true)}" alt="낭만닥터집사부 ${esc(s.name)} 시공 사진" loading="lazy" width="520" height="${LAND.has(s.slug) ? 390 : 693}">` : `<span><small>${GROUPS.find(g => g.id === s.group).en.toUpperCase()}</small>${esc(s.short)}</span>`}</div>
  <div class="tx"><span class="no">${String(i + 1).padStart(2, '0')}</span><h3>${esc(prefix + s.name)}</h3><p>${esc(s.lead)}</p></div>
</a>`;

const PROCESS = (place = '') => `<div class="proc">
  <div><span class="n">STEP 01</span><h3>문자 접수</h3><p>고장 부위 사진과 ${place ? esc(place) + ' ' : ''}주소를 문자로 보내주세요.</p></div>
  <div><span class="n">STEP 02</span><h3>진단 · 견적</h3><p>사진을 보고 1차 견적을 안내하고, 필요하면 현장 실측으로 확정합니다.</p></div>
  <div><span class="n">STEP 03</span><h3>방문 시공</h3><p>약속한 날 방문해 시공하고 주변 정리까지 마무리합니다.</p></div>
  <div><span class="n">STEP 04</span><h3>검수 · A/S</h3><p>함께 작동을 확인하고, 시공 후 1개월 A/S를 책임집니다.</p></div>
</div>`;

const FINAL = (place, body) => `<section class="final"><div class="wrap">
  <h2>${place ? esc(place) + ',<br>' : ''}사진 한 장이면<br>견적이 시작됩니다.</h2>
  <div><a href="tel:${PHONE}" class="tel">${PHONE_D}</a><small>매일 09:00 – 22:00 상담 · 시공 후 1개월 A/S</small><br>
  <a class="btn btn-ink arr" href="${esc(sms(body))}">문자로 사진 보내기</a></div>
</div></section>`;

function write(p, html) { const f = path.join(OUT, p, 'index.html'); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, html); pages.push(p); }

// ---------- MAIN
function mainPage() {
  const faqs = [
    ['어느 지역까지 출장 오시나요?', '전국 출장 시공합니다. 서울·경기·인천은 구 단위까지 지역 안내 페이지가 있으니 해당 지역을 선택해 보세요. 그 밖의 지역도 문자로 주소를 보내주시면 방문 일정을 안내합니다.'],
    ['견적은 어떻게 받나요?', `고장 부위 사진과 지역을 ${PHONE_D}로 문자 보내주시면 확인 후 견적을 안내해 드립니다. 필요한 경우 현장 실측 후 확정합니다.`],
    ['A/S 기간은 어떻게 되나요?', '시공 후 1개월 동안 A/S를 책임집니다. 문제가 생기면 같은 번호로 연락 주세요.'],
    ['상담은 몇 시까지 가능한가요?', '매일 오전 9시부터 저녁 10시까지 전화·문자 상담이 가능합니다.'],
    ['제품은 직접 구매해도 되나요?', '네. 구매하신 제품 설치가 가능합니다. 모델명을 미리 알려주시면 설치 가능 여부를 먼저 확인합니다.'],
    ['목록에 없는 작업도 가능한가요?', '집수리 전반을 다룹니다. 사진을 보내주시면 가능 여부부터 바로 알려드립니다.']
  ];
  const body = '[낭만닥터집사부 견적문의]\n지역: \n작업: \n(사진 첨부)';
  const m = ['island-hood', 'countertop', 'cooktop'].map(svc);
  let html = head({
    path: '/', title: '낭만닥터집사부 | 전국 출장 집수리 — 상판타공·쿡탑·후드 교체·방범창·주차시설물',
    desc: `전국 출장 집수리 낭만닥터집사부. 상판 타공·철거, 쿡탑·후드 교체, 수전·싱크볼, 선반·거울·펫도어, 에어컨 배관 테이핑, 방범창, 카스토퍼·주차구역 도색까지 ${SERVICES.length}가지 시공. 매일 09~22시 상담, 시공 후 1개월 A/S.`,
    preload: imgOf(m[0]), image: imgOf(m[0]),
    ld: [BIZ(SITE + '/', { '@type': 'Country', name: '대한민국' }), FAQLD(faqs), { '@context': 'https://schema.org', '@type': 'WebSite', name: '낭만닥터집사부', url: SITE + '/' }]
  });
  html += `
<section class="hero"><div class="wrap">
  <div class="hero-g">
    <div>
      <span class="eyebrow">Home Repair Specialist</span>
      <h1>집의 아픈 곳만,<br><em>정확하게</em> 고칩니다.</h1>
      <p class="sub">전체 공사 없이 필요한 부분만. 주방 상판 타공부터 후드·쿡탑 교체, 방범창과 주차장 시설물까지 한 번의 문자로 상담하세요.</p>
      <div class="cta"><a class="btn btn-acc arr" href="${esc(sms(body))}">사진 보내고 견적받기</a><a class="btn btn-ghost" href="tel:${PHONE}">${PHONE_D}</a></div>
      <div class="chips"><span><b>전국</b> 출장</span><span>매일 <b>09–22시</b> 상담</span><span>시공 후 <b>1개월</b> A/S</span></div>
    </div>
    <div class="mosaic">${m.map((s, i) => `<figure><img src="${imgOf(s, i > 0)}" alt="${esc(s.name)} 시공 사진" ${i ? 'loading="lazy"' : 'fetchpriority="high"'}><figcaption>${esc(s.name)}</figcaption></figure>`).join('')}</div>
  </div>
  <div class="stats"><div><b>${SERVICES.length}+</b><span>시공 카테고리</span></div><div><b>전국</b><span>출장 시공</span></div><div><b>09–22</b><span>매일 상담 시간</span></div><div><b>1개월</b><span>시공 후 A/S</span></div></div>
</div></section>

<section id="services"><div class="wrap">
  <div class="head-row"><div><span class="eyebrow"><b>01</b> Services</span><h2 class="h">시공 카테고리</h2><p class="lead">카테고리를 누르면 작업 범위, 진행 방식, 자주 묻는 질문을 볼 수 있습니다.</p></div><a class="btn btn-line arr" href="/service/">전체 보기</a></div>
  <div class="tabs" role="group" aria-label="카테고리 필터"><button type="button" aria-pressed="true" data-f="all">전체</button>${GROUPS.map(g => `<button type="button" aria-pressed="false" data-f="${g.id}">${g.name}</button>`).join('')}</div>
  <div class="cat" id="cat">${SERVICES.filter(s => s.img).concat(SERVICES.filter(s => !s.img)).map((s, i) => card(s, i)).join('')}</div>
</div></section>

<section class="sec-t" id="start"><div class="wrap">
  <div class="intake">
    <div class="intake-l"><span class="eyebrow"><b>02</b> Quick estimate</span><h2 class="h">30초 문자 견적</h2><p class="lead">항목과 지역을 고르면 문자가 자동으로 작성됩니다.</p>
      <ol><li>작업 항목 선택</li><li>지역 입력</li><li>사진 첨부해서 전송</li></ol></div>
    <div class="intake-r">
      <div class="fld"><label for="f-job">작업 항목</label><select id="f-job">${SERVICES.map(s => `<option>${esc(s.name)}</option>`).join('')}<option>기타</option></select></div>
      <div class="fld"><label for="f-area">지역</label><input id="f-area" type="text" placeholder="예) 수원시 영통구" autocomplete="address-level2"></div>
      <div class="fld"><label for="f-memo">요청 사항 (선택)</label><input id="f-memo" type="text" placeholder="예) 인덕션 자리 타공"></div>
      <a id="f-send" class="btn btn-acc arr" href="sms:${PHONE}">문자 견적 보내기</a>
      <p class="hint">고장 부위 사진과 전체 사진 1장씩이면 견적이 더 정확합니다.</p>
    </div>
  </div>
</div></section>

<section class="sec-t" id="process"><div class="wrap">
  <span class="eyebrow"><b>03</b> Process</span><h2 class="h">진행 과정</h2>${PROCESS()}
</div></section>

<section class="dark" id="area"><div class="wrap">
  <div class="head-row"><div><span class="eyebrow"><b>04</b> Service area</span><h2 class="h">전국 어디든 방문합니다</h2><p class="lead">서울·경기·인천은 구 단위로 지역 안내를 확인할 수 있습니다.</p></div><a class="btn btn-ghost arr" href="/area/">전체 지역</a></div>
  <div class="area-g">
    <div class="area-b"><h3><a href="${seoul.path}">서울</a><small>${seoul.children.length}개 구</small></h3><div class="links">${seoul.children.map(a => `<a href="${a.path}">${a.name}</a>`).join('')}</div></div>
    <div class="area-b"><h3><a href="${gg.path}">경기</a><small>${gg.children.length}개 시·군</small></h3><div class="links">${gg.children.map(a => `<a href="${a.path}">${a.short}</a>`).join('')}</div></div>
    <div class="area-b"><h3><a href="${ic.path}">인천</a><small>${ic.children.length}개 구·군</small></h3><div class="links">${ic.children.map(a => `<a href="${a.path}">${a.name}</a>`).join('')}</div>
      <h3 style="margin-top:26px">그 밖의 지역</h3><div class="links">${PROV.map(p => `<a href="${p.path}">${p.name}</a>`).join('')}</div></div>
  </div>
</div></section>

<section id="faq"><div class="wrap">
  <span class="eyebrow"><b>05</b> FAQ</span><h2 class="h">자주 묻는 질문</h2>${faqHtml(faqs)}
  <div class="links-l" style="margin-top:36px"><a href="${BLOG}" target="_blank" rel="noopener">네이버 블로그에서 시공 전·후 사진 보기 →</a></div>
</div></section>
${FINAL('', body)}
<script>
(function(){
var t=document.querySelectorAll('.tabs button'),c=document.querySelectorAll('#cat .card');
t.forEach(function(b){b.addEventListener('click',function(){t.forEach(function(x){x.setAttribute('aria-pressed',x===b)});var f=b.dataset.f;c.forEach(function(k){k.hidden=!(f==='all'||k.dataset.g===f)})})});
var P='${PHONE}',s=document.getElementById('f-send');
function u(){var j=document.getElementById('f-job').value,a=document.getElementById('f-area').value.trim()||'(지역)',m=document.getElementById('f-memo').value.trim();
s.href='sms:'+P+'?&body='+encodeURIComponent('[낭만닥터집사부 견적접수]\\n작업: '+j+'\\n지역: '+a+'\\n요청: '+m+'\\n(사진 첨부)')}
['f-job','f-area','f-memo'].forEach(function(i){var e=document.getElementById(i);e.addEventListener('input',u);e.addEventListener('change',u)});u();
})();
</script>
` + foot(body);
  write('/', html);
}

// ---------- SERVICE pages
function servicePage(s, idx) {
  const g = GROUPS.find(x => x.id === s.group);
  const related = SERVICES.filter(x => x.group === s.group && x.slug !== s.slug);
  const localLinks = pick(AREAS.filter(a => a.level === 'gu' || a.level === 'city'), 18, 's' + s.slug);
  const p = `/service/${s.slug}/`;
  const faqs = s.faq.concat([['A/S와 상담 시간은 어떻게 되나요?', '시공 후 1개월 A/S를 책임지며, 상담은 매일 오전 9시부터 저녁 10시까지 가능합니다.']]);
  const body = `[낭만닥터집사부 ${s.short} 견적문의]\n지역: \n(사진 첨부)`;
  const crumbs = [['홈', '/'], ['시공 항목', '/service/'], [s.name, p]];
  let html = head({
    path: p, title: `${s.name} | 전국 출장 — 낭만닥터집사부`,
    desc: `${s.lead} 매일 09~22시 상담, 시공 후 1개월 A/S. ☎ ${PHONE_D}`,
    image: imgOf(s), preload: imgOf(s),
    ld: [BIZ(SITE + '/', { '@type': 'Country', name: '대한민국' }), CRUMB(crumbs), FAQLD(faqs),
      { '@context': 'https://schema.org', '@type': 'Service', name: s.name, serviceType: s.name, description: s.lead, url: SITE + p, image: s.img ? SITE + imgOf(s) : undefined, provider: { '@id': SITE + '/#business' }, areaServed: { '@type': 'Country', name: '대한민국' } }]
  });
  html += `
<section class="shero"><div class="wrap shero-g">
  <div>${crumbHtml(crumbs)}
    <h1>${esc(s.name)},<br><em>정확하게</em> 시공합니다.</h1>
    <p class="sub">${esc(s.lead)}</p>
    <div class="cta"><a class="btn btn-acc arr" href="${esc(sms(body))}">${esc(s.short)} 문자 견적</a><a class="btn btn-ghost" href="tel:${PHONE}">${PHONE_D}</a></div>
  </div>
  ${s.img ? `<figure class="shero-ph${LAND.has(s.slug) ? ' land' : ''}"><img src="${imgOf(s)}" alt="낭만닥터집사부 ${esc(s.name)} 시공 사진" fetchpriority="high"><figcaption>실제 시공 · ${esc(s.name)}</figcaption></figure>` : ''}
</div></section>

<div class="wrap"><dl class="facts">
  <div><dt>카테고리</dt><dd>${esc(g.name)}</dd></div><div><dt>시공 지역</dt><dd>전국 출장</dd></div><div><dt>상담 시간</dt><dd>매일 09:00–22:00</dd></div>
  <div><dt>견적 방법</dt><dd>사진 문자 → 1차 견적</dd></div><div><dt>사후 관리</dt><dd>시공 후 1개월 A/S</dd></div><div><dt>문의</dt><dd><a href="tel:${PHONE}">${PHONE_D}</a></dd></div>
</dl></div>

<section><div class="wrap">
  <span class="eyebrow"><b>01</b> Overview</span><h2 class="h">이럴 때 필요합니다</h2>
  <div class="two">
    <div class="box"><h3>이런 경우 문의하세요</h3><ul>${s.when.map(w => `<li>${esc(w)}</li>`).join('')}</ul></div>
    <div class="box num"><h3>이렇게 작업합니다</h3><ol>${s.points.map(w => `<li>${esc(w)}</li>`).join('')}</ol></div>
  </div>
</div></section>

<section class="sec-t"><div class="wrap">
  <span class="eyebrow"><b>02</b> Process</span><h2 class="h">${esc(s.short)} 진행 과정</h2>${PROCESS()}
</div></section>

<section class="sec-t"><div class="wrap">
  <span class="eyebrow"><b>03</b> FAQ</span><h2 class="h">${esc(s.short)} 자주 묻는 질문</h2>${faqHtml(faqs)}
</div></section>

<section class="sec-t"><div class="wrap">
  <span class="eyebrow"><b>04</b> Related</span><h2 class="h">함께 많이 찾는 ${esc(g.name)} 시공</h2>
  <div class="cat">${related.slice(0, 4).map((r) => card(r, SERVICES.indexOf(r))).join('')}</div>
  <h3 style="margin-top:56px;font-size:20px;font-weight:800">지역별 ${esc(s.short)} 안내</h3>
  <div class="links-l">${localLinks.map(a => `<a href="${a.path}">${esc(a.label)} ${esc(s.short)}</a>`).join('')}</div>
</div></section>
${FINAL(s.short + ' 문의', body)}` + foot(body);
  write(p, html);
}

function serviceIndex() {
  const p = '/service/';
  const crumbs = [['홈', '/'], ['시공 항목', p]];
  let html = head({ path: p, title: `시공 항목 ${SERVICES.length}가지 | 낭만닥터집사부`, desc: `주방·실내·건물 외부까지 낭만닥터집사부의 시공 항목 ${SERVICES.length}가지. 상판 타공, 쿡탑·후드, 수전, 선반·거울·펫도어, 방범창, 카스토퍼, 주차구역 도색 등.`, ld: [CRUMB(crumbs)] });
  html += `<section class="shero" style="padding-bottom:56px"><div class="wrap">${crumbHtml(crumbs)}<h1>시공 항목 <em>${SERVICES.length}가지</em></h1><p class="sub">카테고리를 누르면 작업 범위와 진행 방식을 볼 수 있습니다.</p></div></section>
${GROUPS.map(g => `<section${g.id === 'kitchen' ? '' : ' class="sec-t"'}><div class="wrap"><span class="eyebrow">${g.en}</span><h2 class="h">${g.name}</h2><div class="cat">${SERVICES.filter(s => s.group === g.id).map(s => card(s, SERVICES.indexOf(s))).join('')}</div></div></section>`).join('')}
${FINAL('', null)}` + foot();
  write(p, html);
}

// ---------- AREA content engine
const H1 = [
  n => `${n} 집수리,<br><em>필요한 곳만</em> 정확하게`,
  n => `${n} 부분 시공,<br><em>사진 한 장</em>이면 견적`,
  n => `${n}에서 부르는<br><em>집 고장</em> 해결사`,
  n => `${n} 주방·생활 수리<br><em>왕진</em> 갑니다`,
  n => `${n},<br>상판 타공부터 <em>시설물</em>까지`,
  n => `${n} 집 고장,<br><em>오늘</em> 상담하세요`
];
const INTRO = [
  (n, p) => `${n}에서 집 안 고장이나 시설물 보수가 필요할 때, 낭만닥터집사부가 직접 방문해 필요한 부분만 고칩니다.`,
  (n, p) => `전체 공사를 하지 않아도 됩니다. ${n} 아파트·빌라·주택·상가 어디든 고장 난 곳만 정확하게 손봅니다.`,
  (n, p) => `상판 타공, 쿡탑·후드 교체 같은 주방 작업부터 방범창·카스토퍼 같은 외부 시설물까지 한 번에 상담할 수 있습니다.`,
  (n, p) => `사진 한 장을 문자로 보내주시면 작업 가능 여부와 1차 견적을 먼저 안내해 드립니다.`,
  (n, p) => `상담은 매일 오전 9시부터 밤 10시까지 받습니다. ${n}에서 퇴근 후에도 편하게 문의하세요.`,
  (n, p) => `시공이 끝나면 함께 작동을 확인하고, 시공 후 1개월 동안 A/S를 책임집니다.`,
  (n, p) => `${p ? p + ' 전역을' : '전국을'} 다니며 시공하고 있어 ${n}도 일정만 맞추면 방문할 수 있습니다.`,
  (n, p) => `작은 고장도 미루면 커지기 쉽습니다. ${n}에서 '이것도 되나?' 싶은 작업이 있다면 먼저 물어보세요.`,
  (n, p) => `여러 곳을 한 번에 맡기시면 방문 한 번으로 묶어서 처리할 수 있어 일정 부담이 줄어듭니다.`
];
const TIPS = [
  '고장 부위를 가까이서 찍은 사진 1장과 주변이 보이는 사진 1장을 함께 보내주시면 견적이 정확해집니다.',
  '아파트는 관리사무소에 공사 신고가 필요한 경우가 있으니 미리 확인해 두시면 좋습니다.',
  '방문 차량 주차가 가능한지 알려주시면 일정 잡기가 수월합니다.',
  '교체할 제품을 이미 구매하셨다면 모델명을 알려주세요. 설치 가능 여부를 먼저 확인합니다.',
  '상판 타공이나 쿡탑 교체는 제품 설명서의 타공 치수가 있으면 더 빠르게 진행됩니다.',
  '방범창·에어컨 배관 같은 외부 작업은 높이와 접근 경로가 보이는 사진이 있으면 판단이 빠릅니다.',
  '임대 주택은 설치 전에 집주인과 작업 범위를 미리 맞춰 두시면 좋습니다.',
  '상가·사무실은 영업에 지장이 적은 시간대를 알려주시면 그에 맞춰 일정을 조율합니다.'
];
const FAQP = [
  (n) => [`${n}도 출장 오시나요?`, `네, ${n} 전 지역을 방문합니다. 주소(동 단위까지)와 작업 내용을 문자로 보내주시면 방문 가능한 일정을 안내해 드립니다.`],
  (n) => [`${n} 견적은 어떻게 받나요?`, `고장 부위 사진과 주소를 ${PHONE_D}로 문자 보내주시면 확인 후 1차 견적을 안내합니다. 필요하면 현장 실측 후 확정합니다.`],
  (n) => ['사진만으로도 견적이 되나요?', '대부분 사진으로 1차 견적을 안내합니다. 현장 상황에 따라 실측 후 최종 금액을 확정합니다.'],
  (n) => ['제품은 제가 따로 사도 되나요?', '네, 구매하신 제품으로 설치할 수 있습니다. 모델명을 알려주시면 설치 가능 여부를 먼저 확인합니다.'],
  (n) => ['A/S 기간은 얼마나 되나요?', '시공 후 1개월 동안 A/S를 책임집니다.'],
  (n) => ['상담 가능한 시간은요?', '매일 오전 9시부터 저녁 10시까지 전화·문자 상담이 가능합니다.'],
  (n) => ['여러 작업을 한 번에 맡길 수 있나요?', '네. 한 번 방문으로 함께 처리할 수 있는 작업은 묶어서 진행합니다.'],
  (n) => ['목록에 없는 작업도 가능한가요?', '집수리 전반을 다룹니다. 사진을 보내주시면 가능 여부부터 알려드립니다.']
];
const ORDERS = [['feat', 'about', 'all', 'tips', 'proc', 'faq', 'near'], ['about', 'feat', 'proc', 'all', 'faq', 'tips', 'near'], ['feat', 'all', 'about', 'faq', 'tips', 'proc', 'near']];

function areaPage(a) {
  const seed = a.path;
  const n = a.label;
  const parentLabel = a.parent ? (a.parent.level === 'hub' ? a.parent.full : a.parent.full) : null;
  const withImg = SERVICES.filter(s => s.img);
  const homeImg = withImg.filter(s => s.group !== 'outdoor');
  const hero = one(homeImg, seed + 'hero');
  const feat = [hero].concat(pick(withImg.filter(s => s !== hero), 5, seed + 'f'));
  const intro5 = pick(INTRO, 6, seed + 'i').map(f => f(n, parentLabel));
  const heroSub = intro5.slice(0, 2), intro = intro5.slice(2);
  const tips = pick(TIPS, 4, seed + 't');
  const faqs = [FAQP[0](n)].concat(pick(FAQP.slice(1), 3, seed + 'q').map(f => f(n))).concat([[`${n} ${feat[1].short} 작업도 하나요?`, feat[1].faq[0][1]]]);
  const order = one(ORDERS, seed + 'o');
  const crumbs = [['홈', '/'], ['시공 지역', '/area/']];
  let x = a; const chain = []; while (x) { chain.unshift(x); x = x.parent; }
  chain.forEach(c => crumbs.push([c.level === 'gu' || c.level === 'city' ? c.name : c.label, c.path]));
  const body = `[낭만닥터집사부 견적문의]\n지역: ${a.full} \n작업: \n(사진 첨부)`;
  const s3 = feat.slice(0, 3).map(s => s.short);
  const title = one([
    `${n} 집수리 | ${s3.join('·')} — 낭만닥터집사부`,
    `${n} ${s3[0]}·${s3[1]} 출장 시공 | 낭만닥터집사부`,
    `${n} 부분 시공·집수리 (${s3.join(', ')}) | 낭만닥터집사부`
  ], seed + 'ti');
  const desc = `${a.full} 출장 집수리. ${feat.slice(0, 4).map(s => s.short).join(', ')} 등 ${SERVICES.length}가지 시공. 사진 문자로 1차 견적, 매일 09~22시 상담, 시공 후 1개월 A/S. ☎ ${PHONE_D}`;

  // siblings
  let near = [];
  if (a.parent) { const sib = a.parent.children.filter(c => c !== a); const i = a.parent.children.indexOf(a); near = sib.slice(Math.max(0, i - 6), Math.max(0, i - 6) + 12); if (near.length < 12) near = sib.slice(0, 12); }
  else if (a.level === 'province') near = PROV.filter(p => p !== a).concat(HUBS);

  const blocks = {
    feat: `<section class="sec-t"><div class="wrap"><span class="eyebrow">Popular</span><h2 class="h">${esc(n)}에서 많이 찾는 시공</h2>
      <div class="feat">${feat.map(s => `<a href="/service/${s.slug}/"><span class="th"><img src="${imgOf(s, true)}" alt="${esc(n)} ${esc(s.name)} 시공 사진" loading="lazy"></span><span><h3>${esc(n)} ${esc(s.short)}</h3><p>${esc(s.lead)}</p></span></a>`).join('')}</div></div></section>`,
    about: `<section class="sec-t"><div class="wrap"><span class="eyebrow">About</span><h2 class="h">${esc(n)} 집수리 안내</h2><div class="prose">${intro.map(t => `<p>${esc(t)}</p>`).join('')}</div></div></section>`,
    all: `<section class="sec-t"><div class="wrap"><span class="eyebrow">All services</span><h2 class="h">${esc(n)} 시공 가능 항목</h2><div class="links-l">${pick(SERVICES, SERVICES.length, seed + 'a').map(s => `<a href="/service/${s.slug}/">${esc(n)} ${esc(s.short)}</a>`).join('')}</div></div></section>`,
    tips: `<section class="sec-t"><div class="wrap"><div class="two" style="margin-top:0"><div class="box"><h3>${esc(n)} 견적 문의 전 체크</h3><ul>${tips.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>
      <div class="box num"><h3>${esc(n)} 견적 문자 이렇게 보내세요</h3><ol><li>작업할 곳 사진 2장 (가까이 · 전체)</li><li>주소 (${esc(a.full)} 이하 동 이름까지)</li><li>원하는 작업 내용과 희망 일정</li></ol><a class="btn btn-acc arr" style="margin-top:22px" href="${esc(sms(body))}">문자 보내기</a></div></div></div></section>`,
    proc: `<section class="sec-t"><div class="wrap"><span class="eyebrow">Process</span><h2 class="h">${esc(n)} 시공 진행 과정</h2>${PROCESS(n)}</div></section>`,
    faq: `<section class="sec-t"><div class="wrap"><span class="eyebrow">FAQ</span><h2 class="h">${esc(n)} 자주 묻는 질문</h2>${faqHtml(faqs)}</div></section>`,
    near: near.length ? `<section class="sec-t"><div class="wrap"><span class="eyebrow">Nearby</span><h2 class="h">${a.level === 'province' ? '다른 지역' : esc(a.parent.level === 'hub' ? a.parent.label : a.parent.name) + ' 다른 지역'}</h2><div class="links-l">${near.map(c => `<a href="${c.path}">${esc(c.label)} 집수리</a>`).join('')}${a.parent ? `<a href="${a.parent.path}">${esc(a.parent.label)} 전체 보기</a>` : ''}</div></div></section>` : ''
  };

  // children list for hub / city / province
  let kids = '';
  if (a.children && a.children.length) kids = `<section><div class="wrap"><span class="eyebrow">Districts</span><h2 class="h">${esc(n)} ${a.children.length}개 ${a.level === 'city' ? '구' : (a === gg ? '시·군' : (a === ic ? '구·군' : '구'))} 지역 안내</h2><div class="links-l">${a.children.map(c => `<a href="${c.path}">${esc(c.label)} 집수리</a>`).join('')}</div></div></section>`;
  if (a.level === 'province') kids = `<section><div class="wrap"><span class="eyebrow">Districts</span><h2 class="h">${esc(a.full)} 방문 지역</h2><p class="lead">아래 모든 시·군·구에 출장 시공합니다. 목록에 없는 곳도 문의해 주세요.</p><div class="links-l">${a.cities.map(c => `<a href="${esc(sms(`[낭만닥터집사부 견적문의]\n지역: ${a.name} ${c}\n작업: \n(사진 첨부)`))}">${esc(a.name)} ${esc(c)}</a>`).join('')}</div></div></section>`;

  let html = head({
    path: a.path, title, desc, image: imgOf(hero), preload: imgOf(hero, true),
    ld: [BIZ(SITE + a.path, { '@type': a.level === 'gu' ? 'City' : 'AdministrativeArea', name: a.full }), CRUMB(crumbs), FAQLD(faqs)]
  });
  html += `
<section class="shero"><div class="wrap shero-g">
  <div>${crumbHtml(crumbs)}
    <h1>${one(H1, seed + 'h')(esc(n))}</h1>
    <p class="sub">${esc(heroSub[0])} ${esc(heroSub[1])}</p>
    <div class="cta"><a class="btn btn-acc arr" href="${esc(sms(body))}">${esc(n)} 문자 견적</a><a class="btn btn-ghost" href="tel:${PHONE}">${PHONE_D}</a></div>
  </div>
  <figure class="shero-ph${LAND.has(hero.slug) ? ' land' : ''}"><img src="${imgOf(hero, true)}" alt="${esc(n)} ${esc(hero.name)} 시공 사진" fetchpriority="high"><figcaption>${esc(hero.name)}</figcaption></figure>
</div></section>
<div class="wrap"><dl class="facts">
  <div><dt>방문 지역</dt><dd>${esc(a.full)}</dd></div><div><dt>시공 항목</dt><dd>${SERVICES.length}가지 (주방·실내·외부)</dd></div><div><dt>상담 시간</dt><dd>매일 09:00–22:00</dd></div>
  <div><dt>견적 방법</dt><dd>사진 문자 → 1차 견적</dd></div><div><dt>사후 관리</dt><dd>시공 후 1개월 A/S</dd></div><div><dt>문의</dt><dd><a href="tel:${PHONE}">${PHONE_D}</a></dd></div>
</dl></div>
${kids || '<div style="height:100px"></div>'}
${order.map(k => blocks[k]).join('\n')}
<div style="height:100px"></div>
${FINAL(n, body)}` + foot(body);
  write(a.path, html);
}

function areaIndex() {
  const p = '/area/';
  const crumbs = [['홈', '/'], ['시공 지역', p]];
  let html = head({ path: p, title: '시공 지역 — 서울·경기·인천 구별 안내 | 낭만닥터집사부', desc: '낭만닥터집사부 출장 시공 지역. 서울 25개 구, 경기 31개 시·군과 구, 인천 구·군별 안내와 충북·충남·경남·경북·부산 지역 안내.', ld: [CRUMB(crumbs)] });
  html += `<section class="shero" style="padding-bottom:56px"><div class="wrap">${crumbHtml(crumbs)}<h1>전국 어디든 <em>방문</em>합니다</h1><p class="sub">지역을 선택하면 해당 지역의 시공 안내를 볼 수 있습니다.</p></div></section>
<section><div class="wrap">
  <h2 class="h"><a href="${seoul.path}">서울특별시</a></h2><div class="links-l">${seoul.children.map(c => `<a href="${c.path}">${c.name}</a>`).join('')}</div>
  <h2 class="h" style="margin-top:64px"><a href="${gg.path}">경기도</a></h2>${gg.children.map(c => `<div style="margin-top:18px"><div class="links-l" style="margin-top:0"><a href="${c.path}" style="background:var(--ink);color:#fff;border-color:var(--ink)">${c.name}</a>${c.children.map(g => `<a href="${g.path}">${g.name}</a>`).join('')}</div></div>`).join('')}
  <h2 class="h" style="margin-top:64px"><a href="${ic.path}">인천광역시</a></h2><div class="links-l">${ic.children.map(c => `<a href="${c.path}">${c.name}</a>`).join('')}</div>
  <h2 class="h" style="margin-top:64px">그 밖의 지역</h2><div class="links-l">${PROV.map(c => `<a href="${c.path}">${c.full}</a>`).join('')}</div>
</div></section>
${FINAL('', null)}` + foot();
  write(p, html);
}

// ---------- 404
function notFound() {
  const html = head({ path: '/404', title: '페이지를 찾을 수 없습니다 | 낭만닥터집사부', desc: '요청하신 페이지를 찾을 수 없습니다.' }).replace('index,follow', 'noindex') +
    `<section class="shero"><div class="wrap"><h1>페이지를 <em>찾을 수 없습니다</em></h1><p class="sub">주소가 바뀌었거나 삭제된 페이지입니다.</p><div class="cta"><a class="btn btn-acc arr" href="/">홈으로</a><a class="btn btn-ghost" href="/area/">시공 지역</a></div></div></section>` + foot();
  fs.writeFileSync(path.join(OUT, '404.html'), html);
}

// ---------- RUN
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.copyFileSync(path.join(__dirname, 'style.css'), path.join(OUT, 'style.css'));
fs.cpSync(path.join(__dirname, 'img'), path.join(OUT, 'img'), { recursive: true });
fs.writeFileSync(path.join(OUT, 'favicon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#ff5a1f"/><g fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" transform="translate(4 4)"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/><path d="M12 11.5v5M9.5 14h5"/></g></svg>`);

mainPage();
serviceIndex();
SERVICES.forEach(servicePage);
areaIndex();
AREAS.forEach(areaPage);
notFound();

fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(p => `  <url><loc>${SITE}${p}</loc><lastmod>${TODAY}</lastmod><priority>${p === '/' ? '1.0' : p.split('/').length > 4 ? '0.6' : '0.8'}</priority></url>`).join('\n')}\n</urlset>\n`);
fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n\nUser-agent: Yeti\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
fs.writeFileSync(path.join(OUT, 'rss.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>낭만닥터집사부</title><link>${SITE}/</link><description>전국 출장 집수리·부분 시공</description><language>ko</language>\n${pages.filter(p => p.startsWith('/service/') && p !== '/service/').map(p => { const s = SERVICES.find(x => p.includes('/' + x.slug + '/')); return `<item><title>${esc(s.name)}</title><link>${SITE}${p}</link><description>${esc(s.lead)}</description><pubDate>${new Date().toUTCString()}</pubDate></item>`; }).join('\n')}\n</channel></rss>\n`);
fs.writeFileSync(path.join(OUT, 'llms.txt'), `# 낭만닥터집사부\n\n> 전국 출장 집수리·부분 시공 업체. 전체 공사 없이 필요한 부분만 고칩니다.\n\n- 대표번호: ${PHONE_D} (전화·문자)\n- 상담 시간: 매일 09:00–22:00\n- 시공 지역: 전국 (서울·경기·인천 구 단위 안내 페이지 제공)\n- 사후 관리: 시공 후 1개월 A/S\n- 견적 방법: 고장 부위 사진과 주소를 문자로 보내면 1차 견적 안내, 필요 시 현장 실측 후 확정\n- 시공 기록: ${BLOG}\n\n## 시공 항목\n${SERVICES.map(s => `- [${s.name}](${SITE}/service/${s.slug}/): ${s.lead}`).join('\n')}\n\n## 지역 안내\n- [서울](${SITE}/area/seoul/)\n- [경기](${SITE}/area/gyeonggi/)\n- [인천](${SITE}/area/incheon/)\n${PROV.map(p => `- [${p.full}](${SITE}${p.path})`).join('\n')}\n`);
console.log('built', pages.length, 'pages');
