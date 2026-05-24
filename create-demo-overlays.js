#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Layout A–H showcase set — maps to the questionnaire's Layout Preference options.
const overlays = [
  'bigtime',          // Layout A — Split Grid
  'deathstar',        // Layout B — Custom Tile Grid
  'choice-breaks',    // Layout C — Single Grid Center Promo
  'midwestbreak',     // Layout D — Single Grid Ticker Banner
  'h-vault',          // Layout E — Grid Camera Embed
  'jp2-cards',        // Layout F — Chase Teams / Custom Banner
  'bird-dogz-breaks', // Layout G — Center Promo / Custom Banner
  'sms'               // Layout H — 3-Panel Camera Embed Banner
];

// Runs before any overlay script — kills every live bridge connection (SSE in, fetch/XHR out)
// so a demo embedded on the landing page can never touch a live client stream.
const DEMO_GUARD = `
  <!-- ===== DEMO MODE GUARD — neutralizes all live bridge connectivity ===== -->
  <script>
  (function(){
    var BLOCK = /bridge\\.tradesecretsunlocked\\.com|onrender\\.com/i;
    try {
      window.EventSource = function(){
        return { close:function(){}, addEventListener:function(){}, removeEventListener:function(){},
                 dispatchEvent:function(){return false;}, onmessage:null, onerror:null, onopen:null,
                 readyState:2, url:'' };
      };
    } catch(e){}
    var realFetch = window.fetch;
    if (realFetch) window.fetch = function(u){
      try { if (BLOCK.test(String(u))) return Promise.resolve(new Response('{}', {status:200, headers:{'Content-Type':'application/json'}})); } catch(e){}
      return realFetch.apply(this, arguments);
    };
    try {
      var rOpen = XMLHttpRequest.prototype.open, rSend = XMLHttpRequest.prototype.send;
      XMLHttpRequest.prototype.open = function(m,u){ this.__demoBlock = BLOCK.test(String(u)); return rOpen.apply(this, arguments); };
      XMLHttpRequest.prototype.send = function(){ if (this.__demoBlock) return; return rSend.apply(this, arguments); };
    } catch(e){}
  })();
  </script>
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

    // 5. Inject <base> (relative assets resolve against the deployed repo) + the demo guard
    html = html.replace(
      /<head[^>]*>/i,
      (match) => {
        return match +
          '\n  <base href="https://tradesecretsunlocked.github.io/card-break-overlay/overlays/' + folderName + '/">' +
          DEMO_GUARD;
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
