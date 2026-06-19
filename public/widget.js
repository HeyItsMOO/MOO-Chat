/*!
 * MOO Chat — chat widget (self-contained, no dependencies).
 * Loaded by embed.js. Reads window.MooChat.{key,base}.
 */
(function () {
  var FD = window.MooChat || {};
  var KEY = FD.key;
  var BASE = FD.base || '';
  if (!KEY) return;

  var SID_STORAGE = 'moo_sid_' + KEY;
  var MSG_STORAGE = 'moo_msgs_' + KEY;
  var CURSOR_STORAGE = 'moo_cur_' + KEY;

  // ── tiny helpers ───────────────────────────────────────────────
  function el(tag, attrs, html) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (html != null) n.innerHTML = html;
    return n;
  }
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  // Escape a string for use inside a double-quoted HTML attribute.
  function attrEscape(s) {
    return escapeHtml(s);
  }
  // Safe formatting: tokenize the RAW string into URL / non-URL parts and escape
  // each part for its context (href attribute vs. text). Escaping the whole string
  // first and re-injecting a matched substring into an href is unsafe (entities like
  // &quot; could break out), so we never do that.
  function format(s) {
    s = String(s);
    var urlRe = /(https?:\/\/[^\s<]+)/g;
    var out = '';
    var last = 0;
    var m;
    while ((m = urlRe.exec(s)) !== null) {
      out += escapeHtml(s.slice(last, m.index));
      var url = m[0];
      out += '<a href="' + attrEscape(url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(url) + '</a>';
      last = m.index + url.length;
    }
    out += escapeHtml(s.slice(last));
    out = out.replace(/\*\*([^*<]+)\*\*/g, '<strong>$1</strong>');
    return out.replace(/\n/g, '<br>');
  }
  function sid() {
    var s = localStorage.getItem(SID_STORAGE);
    if (!s) {
      s = 'moo_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      try { localStorage.setItem(SID_STORAGE, s); } catch (e) {}
    }
    return s;
  }
  function loadMsgs() {
    try { return JSON.parse(sessionStorage.getItem(MSG_STORAGE) || '[]'); } catch (e) { return []; }
  }
  function loadCursor() {
    try { return localStorage.getItem(CURSOR_STORAGE) || null; } catch (e) { return null; }
  }
  function saveCursor(id) {
    try { if (id) localStorage.setItem(CURSOR_STORAGE, id); } catch (e) {}
  }
  function saveMsgs(m) {
    try { sessionStorage.setItem(MSG_STORAGE, JSON.stringify(m.slice(-60))); } catch (e) {}
  }

  // ── styles ─────────────────────────────────────────────────────
  function injectCss(cfg) {
    if (document.getElementById('fd-style')) return;
    var primary = cfg.primaryColor || '#4f46e5';
    var accent = cfg.accentColor || '#22c55e';
    var side = cfg.position === 'left' ? 'left' : 'right';
    var css = `
.fdw,.fdw *{box-sizing:border-box}
.fdw{--fd-primary:${primary};--fd-accent:${accent};position:fixed;bottom:20px;${side}:20px;z-index:2147483000;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif}
.fdw-launcher{display:flex;align-items:center;gap:10px;background:var(--fd-primary);color:#fff;border:none;border-radius:999px;padding:13px 18px;font-size:15px;font-weight:600;cursor:pointer;box-shadow:0 8px 30px rgba(0,0,0,.18);transition:transform .15s ease}
.fdw-launcher:hover{transform:translateY(-2px)}
.fdw-launcher svg{width:22px;height:22px;flex:none}
.fdw-panel{position:absolute;bottom:0;${side}:0;width:380px;max-width:calc(100vw - 32px);height:600px;max-height:calc(100vh - 40px);background:#fff;border-radius:18px;box-shadow:0 20px 60px rgba(0,0,0,.28);display:none;flex-direction:column;overflow:hidden}
.fdw.open .fdw-panel{display:flex}
.fdw.open .fdw-launcher{display:none}
.fdw-header{background:var(--fd-primary);color:#fff;padding:16px 18px;display:flex;align-items:center;gap:12px}
.fdw-header .fd-title{font-weight:700;font-size:16px;line-height:1.2}
.fdw-header .fd-sub{font-size:12px;opacity:.85;margin-top:2px}
.fdw-header .fd-spacer{flex:1}
.fdw-iconbtn{background:rgba(255,255,255,.15);border:none;color:#fff;width:32px;height:32px;border-radius:8px;cursor:pointer;font-size:18px;line-height:1;display:flex;align-items:center;justify-content:center}
.fdw-iconbtn:hover{background:rgba(255,255,255,.28)}
.fdw-body{flex:1;overflow-y:auto;padding:16px;background:#f6f7f9}
.fdw-msg{display:flex;margin-bottom:12px}
.fdw-msg.user{justify-content:flex-end}
.fdw-bubble{max-width:82%;padding:10px 13px;border-radius:14px;font-size:14px;line-height:1.5;white-space:normal;word-wrap:break-word}
.fdw-msg.bot .fdw-bubble{background:#fff;color:#1f2937;border:1px solid #e5e7eb;border-bottom-left-radius:4px}
.fdw-msg.user .fdw-bubble{background:var(--fd-primary);color:#fff;border-bottom-right-radius:4px}
.fdw-bubble a{color:inherit;text-decoration:underline}
.fdw-msg.bot .fdw-bubble a{color:var(--fd-primary)}
.fdw-chips{display:flex;flex-wrap:wrap;gap:8px;margin:4px 0 14px}
.fdw-chip{background:#fff;border:1px solid #d1d5db;color:#374151;border-radius:999px;padding:8px 12px;font-size:13px;cursor:pointer}
.fdw-chip:hover{border-color:var(--fd-primary);color:var(--fd-primary)}
.fdw-typing{display:inline-flex;gap:4px;padding:12px 14px}
.fdw-typing span{width:7px;height:7px;border-radius:50%;background:#9ca3af;animation:fdb 1.2s infinite}
.fdw-typing span:nth-child(2){animation-delay:.2s}
.fdw-typing span:nth-child(3){animation-delay:.4s}
@keyframes fdb{0%,60%,100%{opacity:.3}30%{opacity:1}}
.fdw-foot{border-top:1px solid #eceef1;background:#fff;padding:10px 12px}
.fdw-inputrow{display:flex;gap:8px;align-items:flex-end}
.fdw-input{flex:1;border:1px solid #d1d5db;border-radius:12px;padding:10px 12px;font-size:14px;resize:none;max-height:96px;font-family:inherit;outline:none}
.fdw-input:focus{border-color:var(--fd-primary)}
.fdw-send{background:var(--fd-primary);border:none;color:#fff;width:40px;height:40px;border-radius:12px;cursor:pointer;flex:none;display:flex;align-items:center;justify-content:center}
.fdw-send:disabled{opacity:.5;cursor:default}
.fdw-send svg{width:18px;height:18px}
.fdw-disc{font-size:11px;color:#9aa3af;text-align:center;margin-top:8px;line-height:1.4}
.fdw-pb{font-size:11px;color:#b5bcc6;text-align:center;margin-top:6px}
.fdw-pb a{color:#9aa3af;text-decoration:none}
.fdw-banner{display:none;padding:7px 14px;font-size:12px;font-weight:600;text-align:center}
.fdw.waiting .fdw-banner{display:block;background:#fff7ed;color:#c2410c}
.fdw.live .fdw-banner{display:block;background:#ecfdf5;color:#047857}
.fdw-msg.agent .fdw-bubble{background:#ecfdf5;color:#065f46;border:1px solid #a7f3d0;border-bottom-left-radius:4px}
.fdw-msg.agent .fd-who{display:block;font-size:10px;font-weight:700;text-transform:uppercase;opacity:.7;margin-bottom:2px}
.fdw-msg.system{justify-content:center}
.fdw-msg.system .fdw-bubble{background:transparent;color:#9aa3af;font-size:12px;font-style:italic;max-width:100%;text-align:center;border:none;padding:4px}
.fdw-formbar{padding:8px 12px;border-bottom:1px solid #eceef1;background:#fff}
.fdw-formbtn{width:100%;background:var(--fd-accent);color:#fff;border:none;border-radius:10px;padding:9px 12px;font-size:13px;font-weight:600;cursor:pointer}
.fdw-formbtn:hover{filter:brightness(.95)}
.fdw-form{position:absolute;inset:0;top:auto;background:#fff;display:none;flex-direction:column;overflow-y:auto;padding:16px;z-index:5}
.fdw.form-open .fdw-form{display:flex;top:64px;bottom:0}
.fdw-form h4{margin:0 0 4px;font-size:16px;color:#1f2937}
.fdw-form .fd-intro{font-size:13px;color:#6b7280;margin:0 0 12px}
.fdw-field{margin-bottom:12px}
.fdw-flabel{display:block;font-size:13px;font-weight:600;color:#374151;margin-bottom:4px}
.fdw-flabel .req{color:#dc2626}
.fdw-finput{width:100%;border:1px solid #d1d5db;border-radius:10px;padding:9px 11px;font-size:14px;font-family:inherit;outline:none}
.fdw-finput:focus{border-color:var(--fd-primary)}
textarea.fdw-finput{min-height:74px;resize:vertical}
.fdw-ferr{color:#dc2626;font-size:12px;margin-top:3px}
.fdw-form-actions{display:flex;gap:8px;margin-top:6px}
.fdw-submit{flex:1;background:var(--fd-primary);color:#fff;border:none;border-radius:10px;padding:11px;font-size:14px;font-weight:600;cursor:pointer}
.fdw-submit:disabled{opacity:.6}
.fdw-back{background:#f1f3f5;border:none;border-radius:10px;padding:11px 14px;font-size:14px;cursor:pointer;color:#374151}
.fdw-success{text-align:center;padding:24px 8px}
.fdw-success .tick{font-size:40px}
.fdw-hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}
`;
    document.head.appendChild(el('style', { id: 'fd-style' }, css));
  }

  // ── widget ─────────────────────────────────────────────────────
  function build(cfg) {
    injectCss(cfg);

    var root = el('div', { class: 'fdw' });
    var chat =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.4 8.5 8.5 0 0 1-3.9-.9L3 20l1.3-4.1a8.4 8.4 0 0 1-.8-3.6A8.38 8.38 0 0 1 11.5 3 8.38 8.38 0 0 1 21 11.5z"/></svg>';

    var launcher = el('button', { class: 'fdw-launcher', 'aria-label': 'Open chat' },
      chat + '<span>' + escapeHtml(cfg.launcherLabel || 'Chat with us') + '</span>');

    var panel = el('div', { class: 'fdw-panel', role: 'dialog' });
    var humanBtn = cfg.liveChat
      ? '<button class="fdw-iconbtn fd-human" aria-label="Talk to a person" title="Talk to a person">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></button>'
      : '';
    var header = el('div', { class: 'fdw-header' },
      '<div><div class="fd-title">' + escapeHtml(cfg.headerTitle || 'AI Assistant') + '</div>' +
      (cfg.headerSubtitle ? '<div class="fd-sub">' + escapeHtml(cfg.headerSubtitle) + '</div>' : '') +
      '</div><div class="fd-spacer"></div>' +
      humanBtn +
      '<button class="fdw-iconbtn fd-close" aria-label="Close">&times;</button>');

    var bodyEl = el('div', { class: 'fdw-body' });

    var foot = el('div', { class: 'fdw-foot' });
    var inputRow = el('div', { class: 'fdw-inputrow' });
    var input = el('textarea', { class: 'fdw-input', rows: '1', placeholder: 'Type your message…' });
    var send = el('button', { class: 'fdw-send', 'aria-label': 'Send' },
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>');
    inputRow.appendChild(input);
    inputRow.appendChild(send);
    foot.appendChild(inputRow);
    if (cfg.disclaimer) foot.appendChild(el('div', { class: 'fdw-disc' }, escapeHtml(cfg.disclaimer)));
    if (cfg.showPoweredBy && cfg.poweredByText) {
      foot.appendChild(el('div', { class: 'fdw-pb' },
        cfg.poweredByUrl
          ? '<a href="' + attrEscape(cfg.poweredByUrl) + '" target="_blank" rel="noopener">' + escapeHtml(cfg.poweredByText) + '</a>'
          : escapeHtml(cfg.poweredByText)));
    }

    panel.appendChild(header);

    // Live-chat status banner (waiting / connected to a person).
    var banner = el('div', { class: 'fdw-banner' });
    panel.appendChild(banner);

    // Lead form bar + view (only when enabled on this plan/config).
    var leadForm = cfg.leadForm && cfg.leadForm.enabled ? cfg.leadForm : null;
    var formView = null;
    if (leadForm) {
      var bar = el('div', { class: 'fdw-formbar' });
      var formBtn = el('button', { class: 'fdw-formbtn' }, escapeHtml(leadForm.buttonLabel || 'Request a quote'));
      bar.appendChild(formBtn);
      panel.appendChild(bar);
      formView = el('div', { class: 'fdw-form' });
      formBtn.addEventListener('click', function () { openForm(); });
    }

    panel.appendChild(bodyEl);
    panel.appendChild(foot);
    if (formView) panel.appendChild(formView);
    root.appendChild(panel);
    root.appendChild(launcher);
    document.body.appendChild(root);

    // ── state + rendering ──
    var messages = loadMsgs();
    var busy = false;
    var liveStatus = 'bot';
    var pollCursor = loadCursor();
    var pollTimer = null;

    function renderAll() {
      bodyEl.innerHTML = '';
      if (messages.length === 0 && cfg.welcome) {
        addBubble('bot', cfg.welcome, true);
        if (cfg.suggested && cfg.suggested.length) renderChips();
      } else {
        messages.forEach(function (m) {
          var who = m.role === 'user' ? 'user' : m.role === 'agent' ? 'agent' : m.role === 'system' ? 'system' : 'bot';
          addBubble(who, m.content, true, m.agent || currentAgent);
        });
      }
      scrollBottom();
    }
    function addBubble(who, text, noStore, agentName) {
      var row = el('div', { class: 'fdw-msg ' + who });
      var inner = (who === 'agent' && agentName ? '<span class="fd-who">' + escapeHtml(agentName) + '</span>' : '') + format(text);
      row.appendChild(el('div', { class: 'fdw-bubble' }, inner));
      bodyEl.appendChild(row);
      if (!noStore) scrollBottom();
      return row;
    }
    function renderChips() {
      var wrap = el('div', { class: 'fdw-chips' });
      cfg.suggested.forEach(function (q) {
        var chip = el('button', { class: 'fdw-chip' }, escapeHtml(q));
        chip.addEventListener('click', function () { wrap.remove(); sendText(q); });
        wrap.appendChild(chip);
      });
      bodyEl.appendChild(wrap);
    }
    function scrollBottom() { bodyEl.scrollTop = bodyEl.scrollHeight; }

    function showTyping() {
      var row = el('div', { class: 'fdw-msg bot fd-typing-row' });
      row.appendChild(el('div', { class: 'fdw-bubble' }, '<span class="fdw-typing"><span></span><span></span><span></span></span>'));
      bodyEl.appendChild(row);
      scrollBottom();
      return row;
    }

    function sendText(text) {
      text = (text || '').trim();
      if (!text || busy) return;
      var chips = bodyEl.querySelector('.fdw-chips');
      if (chips) chips.remove();

      messages.push({ role: 'user', content: text });
      saveMsgs(messages);
      addBubble('user', text);
      input.value = '';
      input.style.height = 'auto';

      busy = true; send.disabled = true;
      var typing = showTyping();

      fetch(BASE + '/api/v1/widget/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: KEY,
          sessionId: sid(),
          messages: messages.slice(-16),
          context: (document.title || '').slice(0, 200),
        }),
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          typing.remove();
          var reply = data && data.reply;
          if (reply) {
            messages.push({ role: 'assistant', content: reply });
            saveMsgs(messages);
            addBubble('bot', reply);
          } else if (data && data.live) {
            // A human has taken over — replies arrive via polling.
            liveStatus = 'live';
            if (data.lastId) { pollCursor = data.lastId; saveCursor(pollCursor); }
            updateBanner('live', data.agent);
            startPolling();
          } else {
            addBubble('bot', 'Sorry, something went wrong. Please try again.');
          }
        })
        .catch(function () {
          typing.remove();
          addBubble('bot', 'Sorry, I had trouble connecting. Please try again in a moment.');
        })
        .finally(function () { busy = false; send.disabled = false; input.focus(); });
    }

    // ── live chat (talk to a person) ──
    function updateBanner(status, agent) {
      root.classList.remove('waiting', 'live');
      if (status === 'waiting') {
        root.classList.add('waiting');
        banner.textContent = '⏳ Connecting you to the team…';
      } else if (status === 'live') {
        root.classList.add('live');
        banner.textContent = '🟢 ' + (agent || 'A team member') + ' is here to help';
      }
    }
    function renderIncoming(m) {
      if (m.role === 'agent') {
        addBubble('agent', m.content, false, currentAgent);
        messages.push({ role: 'agent', content: m.content, agent: currentAgent });
        saveMsgs(messages);
      } else if (m.role === 'system') {
        addBubble('system', m.content);
        messages.push({ role: 'system', content: m.content });
        saveMsgs(messages);
      }
    }
    var currentAgent = '';
    function requestHuman() {
      open();
      if (liveStatus === 'waiting' || liveStatus === 'live') return;
      fetch(BASE + '/api/v1/widget/request-human', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: KEY, sessionId: sid() }),
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data && data.ok) {
            pollCursor = data.lastId || pollCursor;
            saveCursor(pollCursor);
            liveStatus = 'waiting';
            addBubble('system', 'You asked to talk to a person. Connecting you to the team…');
            updateBanner('waiting');
            startPolling();
          } else {
            addBubble('system', (data && data.message) || 'Live chat is unavailable right now.');
          }
        })
        .catch(function () { addBubble('system', 'Could not reach the team just now.'); });
    }
    function startPolling() {
      if (pollTimer) return;
      pollTimer = setInterval(function () { pollOnce(false); }, 5000); // set first so the
      pollOnce(false); // immediate poll below doesn't re-trigger startPolling
    }
    function stopPolling() {
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    }
    function pollOnce(silent) {
      fetch(BASE + '/api/v1/widget/poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: KEY, sessionId: sid(), after: pollCursor }),
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (!data) return;
          liveStatus = data.status;
          currentAgent = data.agent || currentAgent;
          updateBanner(data.status, data.agent);
          (data.messages || []).forEach(function (m) {
            pollCursor = m.id;
            saveCursor(pollCursor);
            renderIncoming(m); // always render+persist new agent/system messages
          });
          if (data.status === 'closed') { stopPolling(); liveStatus = 'bot'; }
          else if (data.status === 'bot') { stopPolling(); }
          else if ((data.status === 'waiting' || data.status === 'live') && root.classList.contains('open')) {
            startPolling(); // idempotent — resume continuous polling while open
          }
        })
        .catch(function () {});
    }

    // ── events ──
    function open() {
      root.classList.add('open');
      input.focus();
      scrollBottom();
      if (liveStatus === 'waiting' || liveStatus === 'live') startPolling(); // resume on reopen
    }
    function close() { root.classList.remove('open'); stopPolling(); } // don't poll while closed
    launcher.addEventListener('click', open);
    header.querySelector('.fd-close').addEventListener('click', close);
    var humanEl = header.querySelector('.fd-human');
    if (humanEl) humanEl.addEventListener('click', requestHuman);
    send.addEventListener('click', function () { sendText(input.value); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendText(input.value); }
    });
    input.addEventListener('input', function () {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 96) + 'px';
    });

    // ── lead form ──
    var formBuilt = false;
    function openForm() {
      if (!formView) return;
      if (!formBuilt) { buildForm(); formBuilt = true; }
      root.classList.add('form-open');
      open();
    }
    function closeForm() { root.classList.remove('form-open'); }

    function buildForm() {
      formView.innerHTML = '';
      formView.appendChild(el('h4', null, escapeHtml(leadForm.title || 'Request a quote')));
      if (leadForm.intro) formView.appendChild(el('p', { class: 'fd-intro' }, escapeHtml(leadForm.intro)));

      var inputs = {};
      (leadForm.fields || []).forEach(function (f) {
        var field = el('div', { class: 'fdw-field' });
        var lbl = el('label', { class: 'fdw-flabel' },
          escapeHtml(f.label) + (f.required ? ' <span class="req">*</span>' : ''));
        field.appendChild(lbl);
        var inp;
        if (f.type === 'textarea') {
          inp = el('textarea', { class: 'fdw-finput', rows: '3' });
        } else if (f.type === 'select') {
          inp = el('select', { class: 'fdw-finput' });
          inp.appendChild(el('option', { value: '' }, '— select —'));
          (f.options || []).forEach(function (o) { inp.appendChild(el('option', { value: o }, escapeHtml(o))); });
        } else {
          inp = el('input', { class: 'fdw-finput', type: f.type === 'email' ? 'email' : f.type === 'tel' ? 'tel' : 'text' });
        }
        if (f.placeholder) inp.setAttribute('placeholder', f.placeholder);
        field.appendChild(inp);
        field.appendChild(el('div', { class: 'fdw-ferr', 'data-err': f.key }));
        formView.appendChild(field);
        inputs[f.key] = inp;
      });

      // Honeypot
      var hp = el('input', { class: 'fdw-hp', type: 'text', tabindex: '-1', autocomplete: 'off', name: 'website' });
      formView.appendChild(hp);

      var actions = el('div', { class: 'fdw-form-actions' });
      var back = el('button', { class: 'fdw-back' }, '← Back');
      var submit = el('button', { class: 'fdw-submit' }, escapeHtml(leadForm.buttonLabel || 'Send'));
      actions.appendChild(back);
      actions.appendChild(submit);
      formView.appendChild(actions);

      back.addEventListener('click', closeForm);
      submit.addEventListener('click', function () { submitForm(inputs, hp, submit); });
    }

    function clearErrors() {
      var errs = formView.querySelectorAll('.fdw-ferr');
      for (var i = 0; i < errs.length; i++) errs[i].textContent = '';
    }

    function submitForm(inputs, hp, submitBtn) {
      clearErrors();
      var values = {};
      for (var k in inputs) values[k] = inputs[k].value;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';

      fetch(BASE + '/api/v1/widget/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: KEY, sessionId: sid(), values: values, website: hp.value }),
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data && data.ok) {
            formView.innerHTML =
              '<div class="fdw-success"><div class="tick">✅</div><p>' +
              format(data.message || 'Thanks! We will be in touch.') + '</p></div>';
            var done = el('button', { class: 'fdw-submit' }, 'Done');
            done.addEventListener('click', closeForm);
            formView.appendChild(done);
          } else if (data && data.errors) {
            for (var key in data.errors) {
              var slot = formView.querySelector('[data-err="' + key + '"]');
              if (slot) slot.textContent = data.errors[key];
            }
            submitBtn.disabled = false;
            submitBtn.textContent = escapeHtml(leadForm.buttonLabel || 'Send');
          } else {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Try again';
          }
        })
        .catch(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Try again';
        });
    }

    renderAll();

    // Resume an in-progress live/waiting session after a refresh: catch up from the
    // stored cursor (renders only unseen agent/system messages) and, if the panel is
    // open, resume polling. Only runs when a live session was previously started.
    if (cfg.liveChat && pollCursor) pollOnce(false);
  }

  // ── boot ───────────────────────────────────────────────────────
  fetch(BASE + '/api/v1/widget/config?key=' + encodeURIComponent(KEY))
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (!data || !data.ok || !data.enabled) return;
      if (document.body) build(data.config);
      else window.addEventListener('DOMContentLoaded', function () { build(data.config); });
    })
    .catch(function () { /* silent — never break the host site */ });
})();
