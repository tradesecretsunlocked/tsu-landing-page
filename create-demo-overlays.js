#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const overlays = [
  'apex-card-company',
  'bigtime',
  'breakout-kings',
  'chasin-nukes',
  'h-vault',
  'northland-breaks',
  'lnl',
  'pack-smashers',
  'sms',
  'the-rated-pull'
];

const DEMO_BANNER = `
  <!-- ===== DEMO MODE BANNER ===== -->
  <div style="position: fixed; top: 0; left: 0; right: 0; background: #ff6b00; color: white; padding: 8px; text-align: center; font-weight: bold; z-index: 99999; font-family: Arial, sans-serif;">
    🎬 DEMO MODE – This is a preview. Not connected to live client streams.
  </div>
  <style>
    body { padding-top: 36px !important; }
  </style>
`;

overlays.forEach(folderName => {
  const sourceFile = path.join(
    __dirname,
    '..',
    'card-break-overlay',
    'overlays',
    folderName,
    'index.html'
  );

  const destFile = path.join(
    __dirname,
    'demos',
    'demo-portfolio',
    `${folderName}-demo.html`
  );

  if (!fs.existsSync(sourceFile)) {
    console.warn(`⚠️  Source not found: ${sourceFile}`);
    return;
  }

  try {
    let html = fs.readFileSync(sourceFile, 'utf-8');

    // 1. Remove/disable bridge initialization code
    // Comment out connectBridgeSSE call
    html = html.replace(
      /connectBridgeSSE\s*\(\s*\{[^}]*onEvent:[^}]*onStatus:[^}]*\}\s*\);?/g,
      `// DEMO MODE: Bridge SSE disabled
    // connectBridgeSSE({ onEvent, onStatus });`
    );

    // 2. Comment out connectScoresSSE
    html = html.replace(
      /connectScoresSSE\s*\(\s*\{[^}]*onEvent:[^}]*onStatus:[^}]*\}\s*\);?/g,
      `// DEMO MODE: Scores SSE disabled
    // connectScoresSSE({ onEvent, onStatus });`
    );

    // 3. Comment out bridgeWarmup
    html = html.replace(
      /bridgeWarmup\s*\([^)]*\);?/g,
      `// DEMO MODE: Bridge warmup disabled
    // bridgeWarmup();`
    );

    // 4. Stub out bridgePost to prevent any outbound calls
    html = html.replace(
      /async\s+function\s+bridgePost\s*\([^)]*\)\s*\{[\s\S]*?\n\s*\}/,
      `async function bridgePost(payload) {
    // DEMO MODE: Bridge posting disabled - local interactions only
    return Promise.resolve();
  }`
    );

    // 5. Add demo banner inside body tag (after <body>)
    html = html.replace(
      /<body[^>]*>/i,
      (match) => {
        return match + DEMO_BANNER;
      }
    );

    // 6. Update title to indicate demo
    html = html.replace(
      /<title>([^<]*)<\/title>/i,
      (match, title) => {
        return `<title>[DEMO] ${title}</title>`;
      }
    );

    fs.writeFileSync(destFile, html, 'utf-8');
    console.log(`✅ Created: ${folderName}-demo.html`);
  } catch (err) {
    console.error(`❌ Error processing ${folderName}:`, err.message);
  }
});

console.log('\n✨ Demo overlay generation complete!');
