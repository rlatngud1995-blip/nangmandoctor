# 낭만닥터집사부 홈페이지

정적 사이트 생성기. `node build.js` → `public/`

- `data.js` — 연락처, 시공 항목, 지역 목록
- `style.css` — 디자인
- `img/` — 시공 사진 (`{slug}.webp`, 썸네일 `{slug}-s.webp`)
- 도메인 연결 시 `data.js`의 `SITE` 값을 바꾸면 canonical·사이트맵이 함께 바뀝니다.
