// Ultra Premium Markdown Previewer JS
(function(){
  const $editor = document.getElementById('editor');
  const $preview = document.getElementById('preview');
  const $previewWrapper = document.getElementById('preview-wrapper');
  const $stats = document.getElementById('render-stats');
  const $copyHtml = document.getElementById('btn-copy-html');
  const $copyMd = document.getElementById('btn-copy-md');
  const $downloadHtml = document.getElementById('btn-download-html');
  const $clear = document.getElementById('btn-clear');
  const $paste = document.getElementById('btn-paste');
  const $scrollTop = document.getElementById('btn-scroll-top');

  // Smooth scroll via Lenis
  const lenis = new Lenis({
    wheelMultiplier: 0.9,
    smoothWheel: true,
    duration: 1.1
  });
  function raf(time){ lenis.raf(time); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);

  // Three.js delightful black/white wireframe sculpture
  const bgCanvas = document.getElementById('bg-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas: bgCanvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 6);

  const geometry = new THREE.IcosahedronGeometry(2.4, 2);
  const material = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.22 });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  const pointsGeom = new THREE.IcosahedronGeometry(2.4, 3);
  const pointsMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.012, transparent: true, opacity: 0.6 });
  const points = new THREE.Points(pointsGeom, pointsMat);
  scene.add(points);

  const resize = () => {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', resize); resize();

  let t = 0;
  (function animate(){
    t += 0.005;
    mesh.rotation.x = Math.sin(t*0.7)*0.12 + 0.2;
    mesh.rotation.y = t*0.6;
    points.rotation.copy(mesh.rotation);
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  })();

  // Markdown-It configuration
  const md = window.markdownit({
    html: true,
    linkify: true,
    typographer: true,
    highlight: function (str, lang) {
      try {
        // Use highlight.js auto if language missing
        const res = (lang && window.hljs.getLanguage(lang)) ? window.hljs.highlight(str, { language: lang }).value : window.hljs.highlightAuto(str).value;
        return `<pre><code class="hljs">${res}</code></pre>`;
      } catch (e) {
        return `<pre><code>${md.utils.escapeHtml(str)}</code></pre>`;
      }
    }
  })
  .use(window.markdownitEmoji)
  .use(window.markdownitFootnote)
  .use(window.markdownitSub)
  .use(window.markdownitSup)
  .use(window.markdownitMark)
  .use(window.markdownitIns)
  .use(window.markdownitDeflist)
  .use(window.markdownItAttrs || window.markdownitAttrs)
  // Containers for callouts
  .use(window.markdownitContainer, 'info')
  .use(window.markdownitContainer, 'tip')
  .use(window.markdownitContainer, 'warning')
  .use(window.markdownitContainer, 'success')
  .use(window.markdownitContainer, 'note')
  .use(window.markdownitTaskLists, { enabled: true, label: true, labelAfter: true })
  .use(window.markdownItAnchor, { permalink: window.markdownItAnchor.permalink.ariaHidden({}), slugify: s => s.trim().toLowerCase().replace(/[^a-z0-9]+/g,'-') })
  .use(window.markdownitTocDoneRight, { containerClass: 'toc', listType: 'ul' })
  .use(window.markdownitKatex);

  // Mermaid setup
  if (window.mermaid) {
    window.mermaid.initialize({ startOnLoad: false, theme: 'neutral' });
  }

  // Seed text showcasing wide syntax coverage
  const seed = `---\nTitle: Ultra Premium Markdown\n---\n
# Classical, Minimal, Powerful

- Black & White aesthetic  
- Glassmorphism panels  
- Smooth scrolling (Lenis)  
- Animations (Anime.js, Velocity)  
- 3D ambient background (Three.js)

## Table of Contents
[[toc]]

## Typography
- Bold, italic, ~strike~, ==mark==, ^sup^, ~sub~
- Emoji: :sparkles: :rocket: :black_heart:
- Footnote example[^1]

> A tasteful quotation in grayscale elegance.

## Code

\`inline code\` and a block:

\`\`\`js
function sum(a, b) { return a + b }
console.log(sum(2, 3))
\`\`\`

## Math (KaTeX)
Euler: $e^{i\\pi} + 1 = 0$  
Block:

$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$

## Tasks
- [x] Design
- [ ] Implement
- [ ] Polish

## Tables

| Column | Value |
|---|---|
| Alpha | 1 |
| Beta | 2 |

## Definition List
Term
: A term definition

## Mermaid

\`\`\`mermaid
graph TD; A[Start] --> B{Branch}; B -->|Yes| C[Do]; B -->|No| D[Skip]
\`\`\`

[^1]: A delicate footnote in monochrome.
`;

  $editor.value = seed;

  let lastRenderAt = performance.now();
  function render(){
    const started = performance.now();
    const raw = $editor.value;

    // Render md -> html
    const renderedHtml = md.render(raw);

    // Sanitize
    const safe = DOMPurify.sanitize(renderedHtml, {
      ALLOWED_ATTR: ['class', 'style', 'href', 'name', 'target', 'rel', 'id', 'aria-hidden']
    });

    // Inject
    $preview.innerHTML = safe;

    // Mermaid: transform fenced blocks
    const mermaidBlocks = $preview.querySelectorAll('pre code.language-mermaid');
    mermaidBlocks.forEach((code) => {
      const parent = code.closest('pre');
      const graph = document.createElement('div');
      graph.className = 'mermaid';
      graph.textContent = code.textContent;
      parent.replaceWith(graph);
    });
    if (window.mermaid) { window.mermaid.run({ querySelector: '.mermaid' }); }

    // Highlight code
    if (window.hljs) { window.hljs.highlightAll(); }

    const ended = performance.now();
    $stats.textContent = `Rendered in ${Math.max(1, Math.round(ended - started))}ms • ${raw.length} chars`;

    // Tasteful pulse on preview using Anime.js
    anime({
      targets: '#preview',
      opacity: [0.96, 1],
      duration: 420,
      easing: 'easeOutQuad'
    });

    // Stagger in visible elements for premium feel
    const elems = $preview.querySelectorAll('h1,h2,h3,blockquote,pre,table,ul,ol,p,.mermaid');
    Velocity(elems, { translateY: [0, 6], opacity: [1, 0] }, { duration: 360, stagger: 12, easing: 'easeOutCubic' });
  }

  // Debounce keystrokes
  let debounceId = 0;
  function scheduleRender(){
    clearTimeout(debounceId);
    debounceId = setTimeout(render, 120);
  }

  // Events
  $editor.addEventListener('input', scheduleRender);
  $editor.addEventListener('change', scheduleRender);

  // Paste button
  $paste.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) { $editor.value = text; render(); }
    } catch(e) {
      alert('Clipboard read failed. Paste manually (Ctrl/Cmd+V).');
    }
  });

  // Clear button
  $clear.addEventListener('click', () => {
    Velocity($editor, { opacity: 0 }, { duration: 140, complete: () => {
      $editor.value = '';
      Velocity($editor, { opacity: 1 }, { duration: 140 });
      render();
    }});
  });

  // Smooth scroll to top
  $scrollTop.addEventListener('click', () => {
    lenis.scrollTo(0, { offset: 0, duration: 1.2, easing: t => 1 - Math.pow(1 - t, 3) });
  });

  // Copy buttons
  $copyHtml.addEventListener('click', async () => {
    await navigator.clipboard.writeText($preview.innerHTML);
    toast('HTML copied');
  });
  $copyMd.addEventListener('click', async () => {
    await navigator.clipboard.writeText($editor.value);
    toast('Markdown copied');
  });

  // Download HTML
  $downloadHtml.addEventListener('click', () => {
    const blob = new Blob([
      `<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>Markdown Export</title>` +
      `<link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css\">` +
      `<link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/styles/github-dark.min.css\">` +
      `</head><body><article class=\"markdown-body\">${$preview.innerHTML}</article>` +
      `<script src=\"https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js\"><\/script>` +
      `<script>mermaid.initialize({startOnLoad:true,theme:'neutral'})<\/script>` +
      `</body></html>`
    ], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'export.html'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  });

  // Drag & Drop .md
  const editorPanel = $editor.closest('.panel');
  const prevent = e => { e.preventDefault(); e.stopPropagation(); };
  ['dragenter','dragover','dragleave','drop'].forEach(ev => editorPanel.addEventListener(ev, prevent));
  editorPanel.addEventListener('dragover', () => editorPanel.classList.add('ring-pulse'));
  editorPanel.addEventListener('dragleave', () => editorPanel.classList.remove('ring-pulse'));
  editorPanel.addEventListener('drop', async (e) => {
    editorPanel.classList.remove('ring-pulse');
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!/\.(md|markdown|txt)$/i.test(file.name)) { alert('Please drop a .md/.markdown/.txt file.'); return; }
    const text = await file.text();
    $editor.value = text; render();
  });

  // Toast feedback using Velocity for subtle pop
  function toast(message){
    let el = document.getElementById('toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      el.style.position = 'fixed';
      el.style.left = '50%'; el.style.bottom = '28px';
      el.style.transform = 'translateX(-50%)';
      el.style.padding = '10px 14px';
      el.style.background = 'rgba(255,255,255,.14)';
      el.style.border = '1px solid rgba(255,255,255,.32)';
      el.style.backdropFilter = 'blur(10px)';
      el.style.borderRadius = '10px';
      el.style.color = '#fff';
      el.style.zIndex = 99;
      document.body.appendChild(el);
    }
    el.textContent = message;
    Velocity(el, { opacity: [1, 0], translateY: [-6, 0] }, { duration: 180, display: 'block' });
    setTimeout(() => Velocity(el, { opacity: 0, translateY: 0 }, { duration: 250 }), 1200);
  }

  // Initial entrance animation
  Velocity(document.querySelectorAll('.panel'), { translateY: [0, 16], opacity: [1, 0] }, { duration: 480, stagger: 80, easing: 'easeOutCubic' });

  // jQuery-powered hover micro-interactions on glassy buttons
  if (window.$) {
    $('.glassy-btn').on('mouseenter', function(){
      anime({ targets: this, scale: 1.04, duration: 160, easing: 'easeOutQuad' });
    }).on('mouseleave', function(){
      anime({ targets: this, scale: 1.0, duration: 200, easing: 'easeOutQuad' });
    });
  }

  // First render
  render();

})();
