/*!
 * ChatMOO — chat widget (self-contained, no dependencies).
 * Loaded by embed.js. Reads window.MooChat.{key,base}.
 * Look & flow ported from the KHY Physio widget (kpcb-* design), wired to
 * ChatMOO's multi-tenant config + REST endpoints.
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
    if (attrs) for (var k in attrs) { if (k === 'class') n.className = attrs[k]; else n.setAttribute(k, attrs[k]); }
    if (html != null) n.innerHTML = html;
    return n;
  }
  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }
  function safeUrl(u) { return /^(https?:\/\/|mailto:|tel:)/i.test(u) ? u : '#'; }

  // Escape first, then apply a small safe subset of markdown + linkify, and wrap
  // lines into <p>/<ul><li> so bubbles render like the reference widget.
  function format(raw) {
    var text = escapeHtml(raw);
    text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, function (m, label, url) {
      return '<a href="' + safeUrl(url) + '" target="_blank" rel="noopener nofollow">' + label + '</a>';
    });
    text = text.replace(/(^|[^"'>])(https?:\/\/[^\s<]+[^\s<.,);!?])/g, function (m, pre, url) {
      return pre + '<a href="' + safeUrl(url) + '" target="_blank" rel="noopener nofollow">' + url + '</a>';
    });
    text = text.replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, function (m, email) {
      return '<a href="mailto:' + email + '">' + email + '</a>';
    });
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    var lines = text.split(/\n/), out = '', inList = false;
    lines.forEach(function (line) {
      var t = line.trim();
      if (/^[-*•]\s+/.test(t)) {
        if (!inList) { out += '<ul>'; inList = true; }
        out += '<li>' + t.replace(/^[-*•]\s+/, '') + '</li>';
      } else {
        if (inList) { out += '</ul>'; inList = false; }
        out += t === '' ? '<br>' : '<p>' + line + '</p>';
      }
    });
    if (inList) out += '</ul>';
    return out;
  }

  function sid() {
    var s = localStorage.getItem(SID_STORAGE);
    if (!s) { s = 'moo_' + Math.random().toString(36).slice(2) + Date.now().toString(36); try { localStorage.setItem(SID_STORAGE, s); } catch (e) {} }
    return s;
  }
  function loadMsgs() { try { return JSON.parse(sessionStorage.getItem(MSG_STORAGE) || '[]'); } catch (e) { return []; } }
  function saveMsgs(m) { try { sessionStorage.setItem(MSG_STORAGE, JSON.stringify(m.slice(-60))); } catch (e) {} }
  function loadCursor() { try { return localStorage.getItem(CURSOR_STORAGE) || null; } catch (e) { return null; } }
  function saveCursor(id) { try { if (id) localStorage.setItem(CURSOR_STORAGE, id); } catch (e) {} }

  // ── icons (from the reference widget) ──────────────────────────
  function chatIcon() { return '<svg viewBox="0 0 24 24" width="26" height="26" fill="none"><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.6-.8L3 21l1.9-5.4A8.5 8.5 0 1 1 21 11.5Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'; }
  function closeIcon() { return '<svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M18 6 6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'; }
  function sendIcon() { return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none"><path d="m22 2-7 20-4-9-9-4 20-7Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'; }
  function formIcon() { return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9h6m-6 3h4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>'; }
  function sparkIcon() { return '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2c.4 3.7 2.3 5.6 6 6-3.7.4-5.6 2.3-6 6-.4-3.7-2.3-5.6-6-6 3.7-.4 5.6-2.3 6-6Z"/><path d="M19 13c.2 1.8 1.1 2.8 3 3-1.9.2-2.8 1.2-3 3-.2-1.8-1.1-2.8-3-3 1.9-.2 2.8-1.2 3-3Z" opacity=".7"/></svg>'; }
  function personIcon() { return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M4 18v-1a4 4 0 0 1 4-4M20 18v-1a4 4 0 0 0-4-4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="8" r="3.2" stroke="currentColor" stroke-width="1.7"/></svg>'; }

  // ── styles (kpcb design) ───────────────────────────────────────
  function injectCss() {
    if (document.getElementById('moo-kpcb-style')) return;
    var css = KPCB_CSS;
    document.head.appendChild(el('style', { id: 'moo-kpcb-style' }, css));
  }

  // ── widget ─────────────────────────────────────────────────────
  function build(cfg) {
    injectCss();

    var primary = cfg.primaryColor || '#0f7a8a';
    var accent = cfg.accentColor || '#f4a93d';
    var side = cfg.position === 'left' ? 'left' : 'right';
    var leadForm = cfg.leadForm && cfg.leadForm.enabled ? cfg.leadForm : null;

    var root = el('div', { 'class': 'kpcb-root kpcb-pos-' + side });
    root.style.setProperty('--kpcb-primary', primary);
    root.style.setProperty('--kpcb-accent', accent);

    // Launcher
    var launcher = el('button', { 'class': 'kpcb-launcher', type: 'button', 'aria-label': cfg.launcherLabel || 'Open chat', title: cfg.launcherLabel || 'Open chat' },
      '<span class="kpcb-launcher-icon kpcb-icon-chat" aria-hidden="true">' + chatIcon() + '</span>' +
      '<span class="kpcb-launcher-icon kpcb-icon-close" aria-hidden="true">' + closeIcon() + '</span>');
    var badge = el('span', { 'class': 'kpcb-launcher-badge', 'aria-hidden': 'true' }, '1');
    launcher.appendChild(badge);

    // Panel
    var panel = el('div', { 'class': 'kpcb-panel', role: 'dialog', 'aria-label': cfg.headerTitle || 'Chat' });

    var header = el('div', { 'class': 'kpcb-header' });
    header.appendChild(el('div', { 'class': 'kpcb-header-avatar', 'aria-hidden': 'true' }, sparkIcon()));
    var titleWrap = el('div', { 'class': 'kpcb-header-text' });
    titleWrap.appendChild(el('div', { 'class': 'kpcb-header-title' }, escapeHtml(cfg.headerTitle || 'Assistant')));
    if (cfg.headerSubtitle) {
      var sub = el('div', { 'class': 'kpcb-header-sub' });
      sub.innerHTML = '<span class="kpcb-dot"></span>' + escapeHtml(cfg.headerSubtitle);
      titleWrap.appendChild(sub);
    }
    header.appendChild(titleWrap);
    if (cfg.liveChat) {
      var humanBtn = el('button', { 'class': 'kpcb-header-human', type: 'button', 'aria-label': 'Talk to a person', title: 'Talk to a person' }, personIcon());
      humanBtn.addEventListener('click', function () { requestHuman(); });
      header.appendChild(humanBtn);
    }
    var closeBtn = el('button', { 'class': 'kpcb-header-close', type: 'button', 'aria-label': 'Close chat' }, closeIcon());
    closeBtn.addEventListener('click', close);
    header.appendChild(closeBtn);

    var liveBar = el('div', { 'class': 'kpcb-livebar' });
    liveBar.style.display = 'none';

    var messagesEl = el('div', { 'class': 'kpcb-messages', role: 'log', 'aria-live': 'polite' });

    var footer = el('div', { 'class': 'kpcb-footer' });
    var quoteBtn = null;
    if (leadForm) {
      quoteBtn = el('button', { 'class': 'kpcb-quote-btn', type: 'button' },
        formIcon() + '<span class="kpcb-quote-label">' + escapeHtml(leadForm.buttonLabel || 'Request a quote') + '</span><span class="kpcb-quote-arrow">&rarr;</span>');
      quoteBtn.addEventListener('click', openQuoteForm);
      footer.appendChild(quoteBtn);
    }
    var composer = el('div', { 'class': 'kpcb-composer' });
    var input = el('textarea', { 'class': 'kpcb-input', rows: '1', placeholder: 'Type your question…', 'aria-label': 'Type your question' });
    var send = el('button', { 'class': 'kpcb-send', type: 'button', 'aria-label': 'Send message' }, sendIcon());
    composer.appendChild(input);
    composer.appendChild(send);
    footer.appendChild(composer);
    if (cfg.disclaimer) footer.appendChild(el('div', { 'class': 'kpcb-disclaimer' }, escapeHtml(cfg.disclaimer)));
    if (cfg.showPoweredBy && cfg.poweredByText) {
      footer.appendChild(el('div', { 'class': 'kpcb-credit' },
        cfg.poweredByUrl ? '<a href="' + safeUrl(cfg.poweredByUrl) + '" target="_blank" rel="noopener">' + escapeHtml(cfg.poweredByText) + '</a>' : escapeHtml(cfg.poweredByText)));
    }

    panel.appendChild(header);
    panel.appendChild(liveBar);
    panel.appendChild(messagesEl);
    panel.appendChild(footer);
    root.appendChild(panel);
    root.appendChild(launcher);
    document.body.appendChild(root);

    // ── state ──
    var messages = loadMsgs();
    var busy = false;
    var liveStatus = 'bot';
    var currentAgent = '';
    var pollCursor = loadCursor();
    var pollTimer = null;
    var chipsEl = null;

    // ── rendering ──
    function scrollDown() { window.requestAnimationFrame(function () { messagesEl.scrollTop = messagesEl.scrollHeight; }); }
    function addBubble(role, html, opts) {
      opts = opts || {};
      if (role === 'system') {
        var note = el('div', { 'class': 'kpcb-system' }); note.innerHTML = html; if (opts.id) note.id = opts.id;
        messagesEl.appendChild(note); scrollDown(); return note;
      }
      var row = el('div', { 'class': 'kpcb-row kpcb-row-' + role });
      if (role === 'assistant') row.appendChild(el('div', { 'class': 'kpcb-avatar', 'aria-hidden': 'true' }, sparkIcon()));
      else if (role === 'agent') row.appendChild(el('div', { 'class': 'kpcb-avatar kpcb-avatar-agent', 'aria-hidden': 'true' }, personIcon()));
      var bubble = el('div', { 'class': 'kpcb-bubble kpcb-bubble-' + role }); bubble.innerHTML = html;
      row.appendChild(bubble); if (opts.id) row.id = opts.id;
      messagesEl.appendChild(row); scrollDown(); return row;
    }
    function renderChips() {
      if (!(cfg.suggested && cfg.suggested.length)) return;
      chipsEl = el('div', { 'class': 'kpcb-chips' });
      cfg.suggested.forEach(function (q) {
        var chip = el('button', { 'class': 'kpcb-chip', type: 'button' }, escapeHtml(q));
        chip.addEventListener('click', function () { sendText(q); });
        chipsEl.appendChild(chip);
      });
      messagesEl.appendChild(chipsEl);
    }
    function renderConversation() {
      messagesEl.innerHTML = '';
      if (cfg.welcome) addBubble('assistant', format(cfg.welcome));
      if (messages.length === 0) renderChips();
      messages.forEach(function (m) {
        var role = m.role === 'user' ? 'user' : m.role === 'agent' ? 'agent' : m.role === 'system' ? 'system' : 'assistant';
        addBubble(role, role === 'user' ? format(m.content) : format(m.content));
      });
      scrollDown();
    }
    function showTyping() {
      var row = el('div', { 'class': 'kpcb-row kpcb-row-assistant', id: 'moo-typing' });
      row.appendChild(el('div', { 'class': 'kpcb-avatar', 'aria-hidden': 'true' }, sparkIcon()));
      row.appendChild(el('div', { 'class': 'kpcb-bubble kpcb-bubble-assistant kpcb-typing' }, '<span></span><span></span><span></span>'));
      messagesEl.appendChild(row); scrollDown();
    }
    function hideTyping() { var t = document.getElementById('moo-typing'); if (t && t.parentNode) t.parentNode.removeChild(t); }

    // ── send a message ──
    function sendText(text) {
      text = (text || '').trim();
      if (!text || busy) return;
      if (chipsEl && chipsEl.parentNode) { chipsEl.parentNode.removeChild(chipsEl); chipsEl = null; }
      messages.push({ role: 'user', content: text }); saveMsgs(messages);
      addBubble('user', format(text));
      input.value = ''; input.style.height = 'auto';
      busy = true; send.disabled = true; showTyping();

      fetch(BASE + '/api/v1/widget/message', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: KEY, sessionId: sid(), messages: messages.slice(-16), context: (document.title || '').slice(0, 200) }),
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          hideTyping();
          if (data && data.reply) {
            messages.push({ role: 'assistant', content: data.reply }); saveMsgs(messages);
            addBubble('assistant', format(data.reply));
          } else if (data && data.live) {
            liveStatus = 'live';
            if (data.lastId) { pollCursor = data.lastId; saveCursor(pollCursor); }
            updateLiveBar('live', data.agent); startPolling();
          } else {
            addBubble('assistant', 'Sorry, something went wrong. Please try again.');
          }
        })
        .catch(function () { hideTyping(); addBubble('assistant', 'Sorry, I had trouble connecting. Please try again in a moment.'); })
        .finally(function () { busy = false; send.disabled = false; input.focus(); });
    }

    // ── live chat ──
    function updateLiveBar(status, agent) {
      liveStatus = status || liveStatus;
      if (status === 'waiting') { liveBar.style.display = ''; liveBar.className = 'kpcb-livebar kpcb-livebar-waiting'; liveBar.textContent = '⏳ Connecting you to the team…'; }
      else if (status === 'live') { liveBar.style.display = ''; liveBar.className = 'kpcb-livebar kpcb-livebar-live'; liveBar.textContent = '🟢 ' + (agent || 'A team member') + ' is here to help'; }
      else if (status === 'closed') { liveBar.style.display = ''; liveBar.className = 'kpcb-livebar kpcb-livebar-closed'; liveBar.textContent = 'This chat has been closed.'; }
      else { liveBar.style.display = 'none'; }
    }
    function renderIncoming(m) {
      if (m.role === 'agent') { addBubble('agent', format(m.content)); messages.push({ role: 'agent', content: m.content, agent: currentAgent }); saveMsgs(messages); }
      else if (m.role === 'system') { addBubble('system', format(m.content)); messages.push({ role: 'system', content: m.content }); saveMsgs(messages); }
    }
    function requestHuman() {
      open();
      if (liveStatus === 'waiting' || liveStatus === 'live') return;
      fetch(BASE + '/api/v1/widget/request-human', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: KEY, sessionId: sid() }) })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data && data.ok) {
            pollCursor = data.lastId || pollCursor; saveCursor(pollCursor); liveStatus = 'waiting';
            addBubble('system', 'You asked to talk to a person. Connecting you to the team…');
            updateLiveBar('waiting'); startPolling();
          } else { addBubble('system', (data && data.message) || 'Live chat is unavailable right now.'); }
        })
        .catch(function () { addBubble('system', 'Could not reach the team just now.'); });
    }
    function startPolling() { if (pollTimer) return; pollTimer = setInterval(function () { pollOnce(); }, 5000); pollOnce(); }
    function stopPolling() { if (pollTimer) { clearInterval(pollTimer); pollTimer = null; } }
    function pollOnce() {
      fetch(BASE + '/api/v1/widget/poll', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: KEY, sessionId: sid(), after: pollCursor }) })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (!data) return;
          currentAgent = data.agent || currentAgent;
          updateLiveBar(data.status, data.agent);
          (data.messages || []).forEach(function (m) { pollCursor = m.id; saveCursor(pollCursor); renderIncoming(m); });
          if (data.status === 'closed') { stopPolling(); liveStatus = 'bot'; }
          else if (data.status === 'bot') { stopPolling(); }
          else if ((data.status === 'waiting' || data.status === 'live') && root.classList.contains('kpcb-is-open')) { startPolling(); }
        })
        .catch(function () {});
    }

    // ── lead / quote form (kpcb-quote-card with the tenant's fields) ──
    function openQuoteForm() {
      open();
      if (!leadForm) return;
      var existing = document.getElementById('moo-quote-form');
      if (existing) { existing.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); return; }
      if (chipsEl && chipsEl.parentNode) { chipsEl.parentNode.removeChild(chipsEl); chipsEl = null; }

      var card = el('div', { 'class': 'kpcb-quote-card', id: 'moo-quote-form' });
      var head = el('div', { 'class': 'kpcb-q-head' });
      var titleBox = el('div', {});
      titleBox.appendChild(el('div', { 'class': 'kpcb-q-title' }, escapeHtml(leadForm.title || 'Request a quote')));
      head.appendChild(titleBox);
      var x = el('button', { 'class': 'kpcb-q-close', type: 'button', 'aria-label': 'Close form' }, closeIcon());
      x.addEventListener('click', function () { if (card.parentNode) card.parentNode.removeChild(card); });
      head.appendChild(x);
      card.appendChild(head);
      if (leadForm.intro) card.appendChild(el('p', { 'class': 'kpcb-q-intro' }, escapeHtml(leadForm.intro)));

      var body = el('div', { 'class': 'kpcb-q-body' });
      var inputs = {};
      (leadForm.fields || []).forEach(function (f) {
        var wrap = el('div', { 'class': 'kpcb-q-field-wrap' });
        wrap.appendChild(el('label', { 'class': 'kpcb-q-label' }, escapeHtml(f.label) + (f.required ? ' <span class="kpcb-q-req">*</span>' : '')));
        var inp;
        if (f.type === 'textarea') { inp = el('textarea', { 'class': 'kpcb-q-field', rows: '3' }); }
        else if (f.type === 'select') {
          inp = el('select', { 'class': 'kpcb-q-field' });
          inp.appendChild(el('option', { value: '' }, '— select —'));
          (f.options || []).forEach(function (o) { inp.appendChild(el('option', { value: o }, escapeHtml(o))); });
        } else { inp = el('input', { 'class': 'kpcb-q-field', type: f.type === 'email' ? 'email' : f.type === 'tel' ? 'tel' : 'text' }); }
        if (f.placeholder) inp.setAttribute('placeholder', f.placeholder);
        wrap.appendChild(inp);
        wrap.appendChild(el('div', { 'class': 'kpcb-q-error', 'data-err': f.key }));
        body.appendChild(wrap);
        inputs[f.key] = inp;
      });
      card.appendChild(body);

      var hp = el('input', { type: 'text', tabindex: '-1', autocomplete: 'off', name: 'website', 'aria-hidden': 'true' });
      hp.style.cssText = 'position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden';
      card.appendChild(hp);

      var actions = el('div', { 'class': 'kpcb-q-actions' });
      var cancel = el('button', { 'class': 'kpcb-q-cancel', type: 'button' }, 'Cancel');
      cancel.addEventListener('click', function () { if (card.parentNode) card.parentNode.removeChild(card); });
      var submit = el('button', { 'class': 'kpcb-q-submit', type: 'button' }, escapeHtml(leadForm.buttonLabel || 'Send'));
      actions.appendChild(cancel); actions.appendChild(submit);
      card.appendChild(actions);
      var status = el('div', { 'class': 'kpcb-q-status', 'aria-live': 'polite' });
      card.appendChild(status);

      function clearErrors() { var e = card.querySelectorAll('.kpcb-q-error'); for (var i = 0; i < e.length; i++) e[i].textContent = ''; }
      submit.addEventListener('click', function () {
        clearErrors(); status.textContent = ''; status.className = 'kpcb-q-status';
        var values = {}; for (var k in inputs) values[k] = inputs[k].value;
        // Client-side required check (server validates too).
        var firstBad = null;
        (leadForm.fields || []).forEach(function (f) {
          if (f.required && !String(values[f.key] || '').trim()) {
            var slot = card.querySelector('[data-err="' + f.key + '"]'); if (slot) slot.textContent = 'Required';
            if (inputs[f.key]) inputs[f.key].classList.add('kpcb-q-invalid');
            if (!firstBad) firstBad = inputs[f.key];
          } else if (inputs[f.key]) inputs[f.key].classList.remove('kpcb-q-invalid');
        });
        if (firstBad) { firstBad.focus(); return; }

        submit.disabled = true; submit.textContent = 'Sending…';
        fetch(BASE + '/api/v1/widget/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: KEY, sessionId: sid(), values: values, website: hp.value }) })
          .then(function (r) { return r.json(); })
          .then(function (data) {
            if (data && data.ok) {
              card.innerHTML = '<div class="kpcb-q-head"><div class="kpcb-q-title">✅ ' + escapeHtml(leadForm.title || 'Sent') + '</div></div>' +
                '<div class="kpcb-q-status">' + format(data.message || 'Thanks — your details have been sent. We’ll be in touch shortly.') + '</div>';
              var done = el('div', { 'class': 'kpcb-q-actions' });
              var ok = el('button', { 'class': 'kpcb-q-submit', type: 'button' }, 'Done');
              ok.addEventListener('click', function () { if (card.parentNode) card.parentNode.removeChild(card); });
              done.appendChild(ok); card.appendChild(done); scrollDown();
            } else if (data && data.errors) {
              for (var key in data.errors) { var slot = card.querySelector('[data-err="' + key + '"]'); if (slot) slot.textContent = data.errors[key]; }
              submit.disabled = false; submit.textContent = escapeHtml(leadForm.buttonLabel || 'Send');
            } else {
              status.className = 'kpcb-q-status kpcb-q-status-err'; status.textContent = (data && data.error) || 'Something went wrong. Please try again.';
              submit.disabled = false; submit.textContent = 'Try again';
            }
          })
          .catch(function () { status.className = 'kpcb-q-status kpcb-q-status-err'; status.textContent = 'Could not send just now. Please try again.'; submit.disabled = false; submit.textContent = 'Try again'; });
      });

      messagesEl.appendChild(card); scrollDown();
      setTimeout(function () { var n = card.querySelector('.kpcb-q-field'); if (n) n.focus(); }, 60);
    }

    // ── open / close ──
    function open() { root.classList.add('kpcb-is-open'); launcher.classList.add('kpcb-active'); badge.style.display = 'none'; input.focus(); scrollDown(); if (liveStatus === 'waiting' || liveStatus === 'live') startPolling(); }
    function close() { root.classList.remove('kpcb-is-open'); launcher.classList.remove('kpcb-active'); stopPolling(); }
    function toggle() { if (root.classList.contains('kpcb-is-open')) close(); else open(); }

    launcher.addEventListener('click', toggle);
    send.addEventListener('click', function () { sendText(input.value); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendText(input.value); } });
    input.addEventListener('input', function () { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 120) + 'px'; });

    renderConversation();
    if (cfg.liveChat && pollCursor) pollOnce();
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

  // ── kpcb stylesheet (ported verbatim; colours come from CSS vars) ──
  var KPCB_CSS = [
'.kpcb-root{--kpcb-primary:#0f7a8a;--kpcb-accent:#f4a93d;--kpcb-bg:#fff;--kpcb-surface:#f4f6f9;--kpcb-text:#1f2a37;--kpcb-muted:#6b7785;--kpcb-border:#e4e8ed;--kpcb-user:var(--kpcb-primary);--kpcb-agent:#0e8a5f;--kpcb-shadow:0 18px 50px -12px rgba(13,34,56,.4),0 6px 16px -8px rgba(13,34,56,.25);position:fixed;bottom:22px;z-index:2147483000;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.5;color:var(--kpcb-text)}',
'.kpcb-root.kpcb-pos-right{right:22px}.kpcb-root.kpcb-pos-left{left:22px}',
'.kpcb-root *,.kpcb-root *::before,.kpcb-root *::after{box-sizing:border-box}',
'.kpcb-launcher{position:relative;width:62px;height:62px;border-radius:50%;border:none;cursor:pointer;color:#fff;background:var(--kpcb-primary);box-shadow:var(--kpcb-shadow);display:flex;align-items:center;justify-content:center;margin-left:auto;transition:transform .2s ease,box-shadow .2s ease,background .2s ease}',
'.kpcb-pos-left .kpcb-launcher{margin-left:0;margin-right:auto}.kpcb-launcher:hover{transform:translateY(-2px) scale(1.04)}.kpcb-launcher:active{transform:scale(.97)}.kpcb-launcher:focus-visible{outline:3px solid var(--kpcb-accent);outline-offset:3px}',
'.kpcb-launcher-icon{position:absolute;display:flex;align-items:center;justify-content:center;transition:opacity .2s ease,transform .25s ease}.kpcb-icon-close{opacity:0;transform:rotate(-90deg) scale(.6)}.kpcb-active .kpcb-icon-chat{opacity:0;transform:rotate(90deg) scale(.6)}.kpcb-active .kpcb-icon-close{opacity:1;transform:rotate(0) scale(1)}',
'.kpcb-launcher-badge{position:absolute;top:-2px;right:-2px;min-width:20px;height:20px;padding:0 5px;border-radius:10px;background:var(--kpcb-accent);color:#1f2a37;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;border:2px solid #fff}',
'.kpcb-panel{position:absolute;bottom:78px;width:384px;max-width:calc(100vw - 32px);height:600px;max-height:calc(100vh - 120px);background:var(--kpcb-bg);border-radius:20px;box-shadow:var(--kpcb-shadow);display:flex;flex-direction:column;overflow:hidden;opacity:0;transform:translateY(16px) scale(.98);transform-origin:bottom right;pointer-events:none;transition:opacity .25s ease,transform .25s cubic-bezier(.16,1,.3,1)}',
'.kpcb-pos-right .kpcb-panel{right:0}.kpcb-pos-left .kpcb-panel{left:0;transform-origin:bottom left}.kpcb-is-open .kpcb-panel{opacity:1;transform:translateY(0) scale(1);pointer-events:auto}',
'.kpcb-header{display:flex;align-items:center;gap:12px;padding:16px 16px 16px 18px;color:#fff;background:radial-gradient(120% 140% at 0% 0%,rgba(255,255,255,.18) 0%,rgba(255,255,255,0) 45%),var(--kpcb-primary);flex:0 0 auto}',
'.kpcb-header-avatar{width:40px;height:40px;border-radius:12px;background:rgba(255,255,255,.16);display:flex;align-items:center;justify-content:center;color:var(--kpcb-accent);flex:0 0 auto}',
'.kpcb-header-text{flex:1 1 auto;min-width:0}.kpcb-header-title{font-weight:700;font-size:16px;letter-spacing:.01em}.kpcb-header-sub{display:flex;align-items:center;gap:6px;font-size:12.5px;opacity:.85;margin-top:1px}',
'.kpcb-dot{width:7px;height:7px;border-radius:50%;background:#3ad29f;box-shadow:0 0 0 0 rgba(58,210,159,.6);animation:kpcb-pulse 2s infinite}',
'@keyframes kpcb-pulse{0%{box-shadow:0 0 0 0 rgba(58,210,159,.55)}70%{box-shadow:0 0 0 6px rgba(58,210,159,0)}100%{box-shadow:0 0 0 0 rgba(58,210,159,0)}}',
'.kpcb-header-close,.kpcb-header-human{background:transparent;border:none;color:#fff;cursor:pointer;width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;opacity:.85;transition:background .15s ease,opacity .15s ease;flex:0 0 auto}',
'.kpcb-header-human{background:rgba(255,255,255,.12);opacity:.9}.kpcb-header-close:hover{background:rgba(255,255,255,.16);opacity:1}.kpcb-header-human:hover{background:rgba(255,255,255,.22);opacity:1}',
'.kpcb-messages{flex:1 1 auto;overflow-y:auto;padding:18px 16px 8px;background:linear-gradient(180deg,rgba(14,58,95,.035),rgba(14,58,95,0) 90px),var(--kpcb-surface);scroll-behavior:smooth}',
'.kpcb-messages::-webkit-scrollbar{width:8px}.kpcb-messages::-webkit-scrollbar-thumb{background:rgba(31,42,55,.18);border-radius:8px}',
'.kpcb-row{display:flex;align-items:flex-end;gap:8px;margin-bottom:12px;animation:kpcb-in .28s cubic-bezier(.16,1,.3,1)}@keyframes kpcb-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.kpcb-row-user{flex-direction:row-reverse}',
'.kpcb-avatar{width:28px;height:28px;border-radius:50%;background:var(--kpcb-primary);color:var(--kpcb-accent);display:flex;align-items:center;justify-content:center;flex:0 0 auto;margin-bottom:2px}',
'.kpcb-bubble{max-width:80%;padding:10px 14px;border-radius:16px;font-size:14.5px;word-wrap:break-word;overflow-wrap:anywhere}',
'.kpcb-bubble-assistant{background:#fff;border:1px solid #e7ebf0;border-bottom-left-radius:5px;color:var(--kpcb-text);box-shadow:0 1px 2px rgba(13,34,56,.05)}.kpcb-bubble-user{background:var(--kpcb-user);color:#fff;border-bottom-right-radius:5px}',
'.kpcb-bubble p{margin:0 0 8px}.kpcb-bubble p:last-child{margin-bottom:0}.kpcb-bubble ul{margin:6px 0;padding-left:18px}.kpcb-bubble li{margin:2px 0}.kpcb-bubble a{color:var(--kpcb-accent);font-weight:600;text-decoration:underline}.kpcb-bubble-user a{color:#fff}.kpcb-bubble strong{font-weight:700}',
'.kpcb-avatar-agent{background:var(--kpcb-agent);color:#fff}.kpcb-bubble-agent{background:#eafaf3;border:1px solid #bfe9d6;border-bottom-left-radius:5px;color:#0c3b2a;box-shadow:0 1px 2px rgba(13,34,56,.05)}.kpcb-bubble-agent a{color:var(--kpcb-agent)}',
'.kpcb-system{text-align:center;font-size:12px;color:var(--kpcb-muted);margin:4px auto 14px;padding:0 12px;max-width:90%;line-height:1.45}',
'.kpcb-livebar{flex:0 0 auto;font-size:12.5px;font-weight:600;text-align:center;padding:7px 14px;letter-spacing:.01em;border-bottom:1px solid var(--kpcb-border)}.kpcb-livebar-live{background:#eafaf3;color:#0c6b4b;border-bottom-color:#cdeede}.kpcb-livebar-waiting{background:#fff6e6;color:#9a6a07;border-bottom-color:#f3e2bd}.kpcb-livebar-closed{background:#f1f3f6;color:var(--kpcb-muted)}',
'.kpcb-typing{display:flex;gap:4px;align-items:center}.kpcb-typing span{width:7px;height:7px;border-radius:50%;background:var(--kpcb-muted);animation:kpcb-bounce 1.3s infinite ease-in-out}.kpcb-typing span:nth-child(2){animation-delay:.15s}.kpcb-typing span:nth-child(3){animation-delay:.3s}@keyframes kpcb-bounce{0%,60%,100%{transform:translateY(0);opacity:.5}30%{transform:translateY(-5px);opacity:1}}',
'.kpcb-chips{display:flex;flex-wrap:wrap;gap:8px;margin:4px 0 14px 36px;animation:kpcb-in .3s ease}.kpcb-chip{background:#fff;border:1px solid var(--kpcb-primary);color:var(--kpcb-primary);border-radius:20px;padding:7px 13px;font-size:13px;font-weight:600;cursor:pointer;transition:background .15s ease,color .15s ease,transform .1s ease;line-height:1.3;text-align:left}.kpcb-chip:hover{background:var(--kpcb-primary);color:#fff}.kpcb-chip:active{transform:scale(.97)}',
'.kpcb-footer{flex:0 0 auto;padding:12px 14px 10px;background:#fff;border-top:1px solid #eaeef2}',
'.kpcb-quote-btn{display:flex;align-items:center;justify-content:center;gap:9px;width:100%;padding:11px 14px;margin-bottom:10px;border:none;border-radius:12px;background:var(--kpcb-accent);color:#1f2a37;font-family:inherit;font-weight:700;font-size:14.5px;cursor:pointer;box-shadow:0 4px 12px -4px rgba(240,168,24,.6);transition:transform .12s ease,box-shadow .2s ease,filter .2s ease}.kpcb-quote-btn:hover{transform:translateY(-1px);filter:brightness(1.03)}.kpcb-quote-arrow{transition:transform .2s ease}.kpcb-quote-btn:hover .kpcb-quote-arrow{transform:translateX(3px)}',
'.kpcb-composer{display:flex;align-items:flex-end;gap:8px;background:var(--kpcb-surface);border:1px solid #e2e7ec;border-radius:14px;padding:6px 6px 6px 12px;transition:border-color .15s ease,box-shadow .15s ease}.kpcb-composer:focus-within{border-color:var(--kpcb-primary);box-shadow:0 0 0 3px rgba(14,58,95,.1)}',
'.kpcb-input{flex:1 1 auto;border:none;background:transparent;resize:none;font-family:inherit;font-size:14.5px;line-height:1.45;color:var(--kpcb-text);max-height:120px;padding:6px 0;outline:none}.kpcb-input::placeholder{color:var(--kpcb-muted)}',
'.kpcb-send{flex:0 0 auto;width:38px;height:38px;border:none;border-radius:10px;background:var(--kpcb-primary);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform .12s ease,opacity .15s ease,background .15s ease}.kpcb-send:hover{transform:scale(1.06)}.kpcb-send:disabled{opacity:.5;cursor:default;transform:none}',
'.kpcb-disclaimer{font-size:11px;color:var(--kpcb-muted);text-align:center;margin-top:9px;line-height:1.4}.kpcb-credit{font-size:10.5px;color:#aab3bd;text-align:center;margin-top:4px;letter-spacing:.02em}.kpcb-credit a{color:#8c96a1;text-decoration:none}.kpcb-credit a:hover{color:var(--kpcb-primary);text-decoration:underline}',
'.kpcb-quote-card{background:#fff;border:1px solid var(--kpcb-border);border-radius:16px;box-shadow:0 6px 20px -10px rgba(13,34,56,.28);padding:14px 14px 12px;margin:2px 0 14px;animation:kpcb-in .28s cubic-bezier(.16,1,.3,1)}',
'.kpcb-q-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:4px}.kpcb-q-title{font-weight:700;font-size:15px;color:var(--kpcb-primary)}.kpcb-q-close{background:transparent;border:none;cursor:pointer;width:28px;height:28px;border-radius:7px;display:flex;align-items:center;justify-content:center;color:var(--kpcb-muted)}.kpcb-q-close:hover{background:var(--kpcb-surface);color:var(--kpcb-text)}.kpcb-q-intro{margin:0 0 10px;font-size:12.5px;color:var(--kpcb-muted);line-height:1.45}',
'.kpcb-q-body{display:flex;flex-direction:column;gap:9px}.kpcb-q-field-wrap{display:flex;flex-direction:column;gap:3px}.kpcb-q-label{font-size:12px;font-weight:600;color:var(--kpcb-text)}.kpcb-q-req{color:#d6453c;font-weight:700}',
'.kpcb-q-field{width:100%;font-family:inherit;font-size:14px;color:var(--kpcb-text);background:var(--kpcb-surface);border:1px solid #e2e7ec;border-radius:10px;padding:9px 11px;outline:none;transition:border-color .15s ease,box-shadow .15s ease}textarea.kpcb-q-field{resize:vertical;min-height:64px;line-height:1.45}.kpcb-q-field:focus{border-color:var(--kpcb-primary);box-shadow:0 0 0 3px rgba(14,58,95,.1);background:#fff}.kpcb-q-field.kpcb-q-invalid{border-color:#d6453c;box-shadow:0 0 0 3px rgba(214,69,60,.12)}.kpcb-q-field::placeholder{color:var(--kpcb-muted)}',
'select.kpcb-q-field{appearance:none;-webkit-appearance:none;cursor:pointer;padding-right:34px;background-image:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'8\' viewBox=\'0 0 12 8\'%3E%3Cpath d=\'M1 1l5 5 5-5\' fill=\'none\' stroke=\'%236b7785\' stroke-width=\'1.6\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center}',
'.kpcb-q-error{font-size:11.5px;color:#d6453c;line-height:1.3}.kpcb-q-error:empty{display:none}',
'.kpcb-q-actions{display:flex;gap:8px;margin-top:12px}.kpcb-q-cancel{flex:0 0 auto;padding:10px 14px;border:1px solid #d8dee4;background:#fff;color:var(--kpcb-muted);border-radius:10px;font-family:inherit;font-size:13.5px;font-weight:600;cursor:pointer}.kpcb-q-cancel:hover{background:var(--kpcb-surface);color:var(--kpcb-text)}.kpcb-q-submit{flex:1 1 auto;padding:10px 14px;border:none;background:var(--kpcb-primary);color:#fff;border-radius:10px;font-family:inherit;font-size:14px;font-weight:700;cursor:pointer}.kpcb-q-submit:hover{filter:brightness(1.08)}.kpcb-q-submit:disabled{opacity:.6;cursor:default}',
'.kpcb-q-status{font-size:12.5px;margin-top:9px;line-height:1.4}.kpcb-q-status:empty{display:none}.kpcb-q-status-err{color:#d6453c}',
'@media (max-width:480px){.kpcb-root{bottom:16px}.kpcb-root.kpcb-pos-right{right:16px}.kpcb-root.kpcb-pos-left{left:16px}.kpcb-panel{position:fixed;bottom:0;left:0;right:0;width:100vw;max-width:100vw;height:100dvh;max-height:100dvh;border-radius:0}.kpcb-is-open .kpcb-launcher{opacity:0;pointer-events:none}}',
'@media (prefers-reduced-motion:reduce){.kpcb-root *,.kpcb-root *::before,.kpcb-root *::after{animation-duration:.001ms !important;animation-iteration-count:1 !important;transition-duration:.001ms !important}}',
  ].join('\n');
})();
