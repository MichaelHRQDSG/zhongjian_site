/**
 * Convert design handoff JSX into Next.js client TSX modules.
 */
const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '../../design_handoff_guangsha_xinan_eap (1)');
const OUT = path.resolve(__dirname, '../src');

function stripWindowExport(code) {
  return code.replace(/\nObject\.assign\(window,\s*\{[\s\S]*?\}\);?\s*/g, '\n');
}

function withClientHeader(imports, body) {
  return (
    `// @ts-nocheck\n` +
    `'use client';\n\n` +
    imports +
    '\n' +
    stripWindowExport(body)
  );
}


function transformShared(code) {
  let out = code;
  out = out.replace(
    /Object\.assign\(window,\s*\{[\s\S]*?\}\);?\s*$/,
    `export {
  EAP_MODULES, STATS, QA_LIST, STORIES, ARTICLES, AUDIOS, COUNSELORS, NAV_ITEMS,
  Icon, CitySkyline, PlaceholderImg,
};
`,
  );
  // Fix asset paths already relative
  out = out.replace(/src: 'assets\//g, "src: '/assets/");
  out = out.replace(/img: 'assets\//g, "img: '/assets/");
  // NAV links for Next
  out = out.replace(
    "{ label: '新员工入职测评', href: '新员工入职测评.html', badge: 'NEW' }",
    "{ label: '新员工入职测评', href: '/onboarding', badge: 'NEW' }",
  );
  return withClientHeader(
    `import React from 'react';\n`,
    out,
  );
}

function transformClassic(code) {
  let out = code;
  out = out.replace(/assets\//g, '/assets/');
  out = out.replace(/href=\{?'新员工入职测评\.html'?\}?/g, "href={'/onboarding'}");
  out = out.replace(/href="新员工入职测评\.html"/g, 'href="/onboarding"');
  out = out.replace(
    /const href = m\.id === 'onboarding' \? '新员工入职测评\.html' : `#\$\{m\.id\}`;/,
    `const href = m.id === 'onboarding' ? '/onboarding' : \`#\${m.id}\`;`,
  );
  // Add responsive class hooks
  out = out.replace(
    /<div style=\{\{ maxWidth: 1360, margin: '0 auto', padding: '90px 40px 110px', display: 'grid', gridTemplateColumns: '1\.05fr 1fr', gap: 80, alignItems: 'center', position: 'relative' \}\}>/,
    `<div className="gxa-hero" style={{ maxWidth: 1360, margin: '0 auto', padding: '90px 40px 110px', display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 80, alignItems: 'center', position: 'relative' }}>`,
  );
  out = out.replace(
    /<div style=\{\{ maxWidth: 1360, margin: '0 auto', padding: '0 40px', display: 'grid', gridTemplateColumns: 'repeat\(4, 1fr\)', gap: 40 \}\}>/,
    `<div className="gxa-stats" style={{ maxWidth: 1360, margin: '0 auto', padding: '0 40px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 40 }}>`,
  );
  out = out.replace(
    /<div style=\{\{ display: 'grid', gridTemplateColumns: 'repeat\(4, 1fr\)', gap: 20, marginTop: 64 \}\}>\s*\{EAP_MODULES\.map/,
    `<div className="gxa-services" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginTop: 64 }}>\n            {EAP_MODULES.map`,
  );
  out = out.replace(
    /\{marginTop: 64, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 \}/,
    `{ marginTop: 64, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }`,
  );
  // library grid
  out = out.replace(
    /<div style=\{\{ marginTop: 64, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 \}\}>/,
    `<div className="gxa-library" style={{ marginTop: 64, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>`,
  );
  out = out.replace(
    /<div style=\{\{ display: 'grid', gridTemplateColumns: 'repeat\(4, 1fr\)', gap: 20, marginTop: 64 \}\}>\s*\{COUNSELORS\.map/,
    `<div className="gxa-counselors" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginTop: 64 }}>\n            {COUNSELORS.map`,
  );
  out = out.replace(
    /display: 'grid', gridTemplateColumns: '1fr auto', gap: 40, alignItems: 'center' \}\}>/,
    `display: 'grid', gridTemplateColumns: '1fr auto', gap: 40, alignItems: 'center' }} className="gxa-book-cta">`,
  );
  out = out.replace(
    /gridTemplateColumns: '1\.5fr 1fr 1fr 1fr 1fr'/,
    `gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr'`,
  );
  // footer grid class - find Footer container
  out = out.replace(
    /<div style=\{\{ display: 'grid', gridTemplateColumns: '1\.5fr 1fr 1fr 1fr 1fr', gap: 60, paddingBottom: 48, marginBottom: 28, borderBottom: '1px solid rgba\(255,255,255,\.1\)' \}\}>/,
    `<div className="gxa-footer-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr', gap: 60, paddingBottom: 48, marginBottom: 28, borderBottom: '1px solid rgba(255,255,255,.1)' }}>`,
  );
  // nav
  out = out.replace(
    /<nav style=\{\{ display: 'flex', alignItems: 'center', gap: 32 \}\}>/,
    `<nav className="gxa-nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>`,
  );
  out = out.replace(
    /<div style=\{\{ display: 'flex', alignItems: 'center', gap: 12 \}\}>\s*<button style=\{\{ background: 'transparent'/,
    `<div className="gxa-nav-cta" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>\n            <button style={{ background: 'transparent'`,
  );
  // H1 responsive class
  out = out.replace(
    /<h1 style=\{\{ fontFamily: '"Noto Serif SC", serif', fontSize: 62,/,
    `<h1 className="gxa-hero-title" style={{ fontFamily: '"Noto Serif SC", serif', fontSize: 62,`,
  );
  out = out.replace(
    /padding: '0 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' \}\}>\s*<div style=\{\{ display: 'flex', alignItems: 'center', gap: 8, opacity: \.9 \}\}>/,
    `padding: '0 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="gxa-topbar">\n          <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: .9 }}>`,
  );

  // Export DesignV1 as default and named
  if (!out.includes('export default')) {
    out += `\n\nexport default DesignV1;\nexport { DesignV1, SectionTitle, Footer, AudioPlayerList };\n`;
  }

  return withClientHeader(
    `import React from 'react';\n` +
      `import {\n  EAP_MODULES, STATS, ARTICLES, AUDIOS, COUNSELORS, NAV_ITEMS,\n  Icon, CitySkyline,\n} from '@/components/shared/data';\n` +
      `import MobileNav from '@/components/layout/MobileNav';\n`,
    out,
  );
}

function transformOnboarding(code) {
  let out = code;
  out = out.replace(/assets\//g, '/assets/');
  out = out.replace(/href="中建三局EAP-方案一\.html"/g, 'href="/"');
  out = out.replace(/href=\{?'中建三局EAP-方案一\.html'?\}?/g, 'href="/"');
  // welcome grid
  out = out.replace(
    /<div style=\{\{ display: 'grid', gridTemplateColumns: '1\.15fr 1fr', gap: 80, alignItems: 'center', minHeight: 620 \}\}>/,
    `<div className="gxa-onb-welcome" style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 80, alignItems: 'center', minHeight: 620 }}>`,
  );
  out = out.replace(
    /<h1 style=\{\{ fontFamily: '"Noto Serif SC", serif', fontSize: 56,/,
    `<h1 className="gxa-onb-title" style={{ fontFamily: '"Noto Serif SC", serif', fontSize: 56,`,
  );
  out = out.replace(
    /<main style=\{\{ maxWidth: 1120, margin: '0 auto', padding: '40px 40px 120px' \}\}>/,
    `<main className="gxa-onb-main" style={{ maxWidth: 1120, margin: '0 auto', padding: '40px 40px 120px' }}>`,
  );
  out = out.replace(
    /padding: '28px 40px', display: 'flex', alignItems: 'center', gap: 0 \}\}>/,
    `padding: '28px 40px', display: 'flex', alignItems: 'center', gap: 0 }} className="gxa-onb-stepper">`,
  );
  // report grids common patterns
  out = out.replace(
    /gridTemplateColumns: '1\.2fr 1fr'/g,
    `gridTemplateColumns: '1.2fr 1fr'`,
  );

  if (!out.includes('export default')) {
    out += `\n\nexport default OnboardingAssessment;\nexport { OnboardingAssessment };\n`;
  }

  return withClientHeader(
    `import React from 'react';\n` +
      `import { Icon } from '@/components/shared/data';\n`,
    out,
  );
}

ensureDir(path.join(OUT, 'components/shared'));
ensureDir(path.join(OUT, 'components/home'));
ensureDir(path.join(OUT, 'components/onboarding'));
ensureDir(path.join(OUT, 'app/onboarding'));

const shared = transformShared(fs.readFileSync(path.join(SRC, 'shared-data.jsx'), 'utf8'));
fs.writeFileSync(path.join(OUT, 'components/shared/data.tsx'), shared);

const classic = transformClassic(fs.readFileSync(path.join(SRC, 'design-v1-classic.jsx'), 'utf8'));
fs.writeFileSync(path.join(OUT, 'components/home/DesignV1.tsx'), classic);

const onb = transformOnboarding(fs.readFileSync(path.join(SRC, 'assessment-onboarding.jsx'), 'utf8'));
fs.writeFileSync(path.join(OUT, 'components/onboarding/OnboardingAssessment.tsx'), onb);

console.log('Converted shared / DesignV1 / OnboardingAssessment');
