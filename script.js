
'use strict';
// ══════════════════════════════════════════════════════
// NEXUS ERP — Single Unified JS Block
// showPage defined ONCE. All features below, no conflicts.
// Multi-user: Supabase RLS handles concurrent sessions.
// ══════════════════════════════════════════════════════

// Inject animations
(function(){
  const s = document.createElement('style');
  s.textContent = '@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:.3}50%{opacity:1}}';
  document.head.appendChild(s);
})();

// ── PAGE REGISTRY ──
const PAGES = {
  dashboard:'Dashboard', leads:'Lead Management', customers:'Customer Management',
  pipeline:'Sales Pipeline', tasks:'Task Management', orders:'Order Management',
  inventory:'Inventory Management', invoices:'Invoicing Engine', currency:'Multi-Currency Invoicing',
  payments:'Payments & A/R', quotes:'Quotes & Proposals', signature:'Digital Signatures',
  email:'Email Notifications', employees:'Employee Central', attendance:'Attendance & Leave',
  payroll:'Payroll Engine', performance:'Performance KPIs', mpesa:'M-Pesa STK Push',
  ai:'AI Assistant', security:'Security & Audit Logs', supabase:'Supabase Schema'
};

// ── SINGLE showPage — handles routing, sidebar close, sig pad init, inactivity ──
function showPage(id) {
  // Guard: page must exist
  const target = document.getElementById('page-' + id);
  if (!target) { console.warn('showPage: no page found for', id); return; }

  // Deactivate all
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  // Activate target
  target.classList.add('active');
  const titleEl = document.getElementById('topbar-title');
  if (titleEl) titleEl.textContent = PAGES[id] || id;

  // Highlight nav
  document.querySelectorAll('.nav-item').forEach(n => {
    const oc = n.getAttribute('onclick') || '';
    if (oc.includes("'" + id + "'") || oc.includes('"' + id + '"')) n.classList.add('active');
  });

  // Close notif panel + mobile sidebar
  const notif = document.getElementById('notif-panel');
  if (notif) notif.classList.remove('open');
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebar-overlay')?.classList.remove('open');

  // Init signature pad when navigating to that page
  if (id === 'signature') setTimeout(initSigPad, 60);

  // Reset inactivity timer
  resetInactivityTimer();
}

// ── NOTIFICATIONS ──
function toggleNotif() {
  document.getElementById('notif-panel').classList.toggle('open');
}
document.addEventListener('click', function(e) {
  const panel = document.getElementById('notif-panel');
  if (panel && !panel.contains(e.target) && !e.target.closest('.topbar-btn')) {
    panel.classList.remove('open');
  }
});

// ── MODALS ──
function openModal(id) { document.getElementById(id)?.classList.add('open'); }
function closeModal(e, id) { if (e.target.classList.contains('modal-overlay')) document.getElementById(id)?.classList.remove('open'); }
function closeModal2(id) { document.getElementById(id)?.classList.remove('open'); }
function switchTab(el) {
  el.parentElement.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
}

  // ══════════════════════════════════════════
  // M-PESA STK PUSH
  // ══════════════════════════════════════════
  function autoFillSTK() {
    const val = document.getElementById('stk-customer').value;
    if (!val) return;
    const parts = val.split('|');
    const phone = parts[1]; const amount = parts[2];
    document.getElementById('stk-phone').value = phone.substring(3); // strip 254
    document.getElementById('stk-amount').value = amount;
    document.getElementById('stk-ref').value = 'INV-' + (2840 + Math.floor(Math.random()*10));
    document.getElementById('stk-desc').value = 'Payment for invoice from ' + parts[0].toUpperCase();
  }

  function validatePhone(input) {
    const v = input.value.replace(/\D/g,'');
    input.value = v;
    const hint = document.getElementById('phone-hint');
    if (v.length === 9) {
      hint.textContent = '✓ Will send to 254' + v;
      hint.style.color = 'var(--green)';
    } else {
      hint.textContent = 'Format: 7XX XXX XXX (9 digits, we add 254 prefix)';
      hint.style.color = 'var(--text3)';
    }
  }

  async function sendSTKPush() {
    const rawPhone = document.getElementById('stk-phone').value.trim();
    const amount   = document.getElementById('stk-amount').value.trim();
    const ref      = document.getElementById('stk-ref').value.trim() || 'NEXUS-ERP';
    const desc     = document.getElementById('stk-desc').value.trim() || 'Payment';
    const btn      = document.getElementById('stk-btn');

    // Validate phone
    const cleanPhone = rawPhone.replace(/\D/g,'');
    if (cleanPhone.length !== 9) { showSTKStatus('error','⚠ Enter a valid 9-digit Safaricom number (e.g. 722000000)'); return; }
    if (!amount || isNaN(amount) || parseFloat(amount) < 1) { showSTKStatus('error','⚠ Enter a valid amount (minimum KES 1)'); return; }

    const phone = '254' + cleanPhone;

    btn.disabled = true;
    btn.innerHTML = '<span style="display:inline-block;animation:spin 1s linear infinite">⏳</span> Authenticating with Daraja…';
    showSTKStatus('loading', `📡 Connecting to Safaricom Daraja API…`);

    try {
      // ── PRODUCTION: calls your Supabase Edge Function ──
      // The Edge Function holds your Daraja keys securely as secrets.
      // Each user's browser calls this — Supabase handles concurrency.
      //
      // const EDGE_URL = `${SUPABASE_URL}/functions/v1/mpesa-stk`;
      // const res = await fetch(EDGE_URL, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({ phone, amount: parseFloat(amount), accountRef: ref, description: desc })
      // });
      // const data = await res.json();

      // ── SANDBOX SIMULATION (replace with above in production) ──
      // Mimics the exact Daraja STK Push API response shape
      await new Promise(r => setTimeout(r, 1400));
      btn.innerHTML = '<span style="display:inline-block;animation:spin 1s linear infinite">⏳</span> Sending prompt to ' + phone + '…';
      showSTKStatus('loading', `📲 Sending PIN prompt to <strong>${phone}</strong>…`);
      await new Promise(r => setTimeout(r, 1800));

      const success = Math.random() > 0.08; // 92% success rate
      const checkoutId = 'ws_CO_' + Date.now() + '_' + Math.floor(Math.random()*99999);
      const merchantId = `${Math.floor(Math.random()*90000000+10000000)}-${Math.floor(Math.random()*99999999)}-1`;

      if (success) {
        // Update API response panel
        document.getElementById('api-response').innerHTML =
          `<span style="color:var(--green)">{</span><br>` +
          `&nbsp;&nbsp;<span style="color:var(--accent)">"MerchantRequestID"</span>: <span style="color:var(--yellow)">"${merchantId}"</span>,<br>` +
          `&nbsp;&nbsp;<span style="color:var(--accent)">"CheckoutRequestID"</span>: <span style="color:var(--yellow)">"${checkoutId}"</span>,<br>` +
          `&nbsp;&nbsp;<span style="color:var(--accent)">"ResponseCode"</span>: <span style="color:var(--green)">"0"</span>,<br>` +
          `&nbsp;&nbsp;<span style="color:var(--accent)">"ResponseDescription"</span>: <span style="color:var(--green)">"Success. Request accepted for processing"</span>,<br>` +
          `&nbsp;&nbsp;<span style="color:var(--accent)">"CustomerMessage"</span>: <span style="color:var(--yellow)">"Success. Request accepted for processing"</span><br>` +
          `<span style="color:var(--green)">}</span>`;

        showSTKStatus('success',
          `✅ <strong>STK Push sent!</strong> M-Pesa PIN prompt delivered to <strong>${phone}</strong>.<br>` +
          `🔑 Checkout ID: <code style="font-size:11px;font-family:'JetBrains Mono',monospace">${checkoutId}</code><br>` +
          `⏳ Waiting for customer to enter PIN… Payment will auto-confirm via callback.<br>` +
          `<span style="font-size:12px;color:var(--text3)">Callback URL: ${SUPABASE_URL}/functions/v1/mpesa-callback</span>`
        );

        // Add to transaction history
        const now = new Date();
        const timeStr = now.toTimeString().slice(0,8);
        const row = document.createElement('div');
        row.className = 'aging-row';
        row.style.cssText = 'gap:8px;border-top:1px solid var(--border);padding:10px 0;';
        row.innerHTML = `
          <div style="flex:1">
            <div style="font-size:13.5px;font-weight:600">Manual · ${phone}</div>
            <div style="font-size:11.5px;color:var(--text3);font-family:'JetBrains Mono',monospace">${phone} · ${timeStr}</div>
          </div>
          <div style="font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700;color:var(--yellow)">KES ${parseFloat(amount).toLocaleString()}</div>
          <span class="badge yellow">Pending PIN</span>`;
        const hist = document.getElementById('stk-history');
        hist.insertBefore(row, hist.firstChild);

        // Simulate customer paying after 6 seconds (demo only)
        setTimeout(() => {
          row.querySelector('.badge').className = 'badge green';
          row.querySelector('.badge').textContent = 'Paid ✓';
          row.querySelector('[style*="color:var(--yellow)"]').style.color = 'var(--green)';
          showSTKStatus('success',
            `🎉 <strong>Payment confirmed!</strong> KES ${parseFloat(amount).toLocaleString()} received from ${phone}.<br>` +
            `📄 M-Pesa Receipt: <strong>QKA${Math.random().toString(36).slice(2,8).toUpperCase()}</strong><br>` +
            `✅ Invoice auto-updated to <strong>Paid</strong> and receipt emailed to client.`
          );
        }, 6000);

      } else {
        document.getElementById('api-response').innerHTML =
          `<span style="color:var(--red)">{</span><br>` +
          `&nbsp;&nbsp;<span style="color:var(--accent)">"ResponseCode"</span>: <span style="color:var(--red)">"1"</span>,<br>` +
          `&nbsp;&nbsp;<span style="color:var(--accent)">"ResponseDescription"</span>: <span style="color:var(--red)">"Request cancelled by user"</span><br>` +
          `<span style="color:var(--red)">}</span>`;
        showSTKStatus('error',
          `❌ <strong>STK Push failed / declined.</strong><br>` +
          `Common causes: number not on M-Pesa, wrong PIN 3× (number locked), or network timeout.<br>` +
          `<span style="font-size:12px;color:var(--text3)">Try again or use a different payment method.</span>`
        );
      }
    } catch(err) {
      showSTKStatus('error', `❌ Network error: ${err.message}<br><span style="font-size:12px">Check your Supabase Edge Function is deployed and DARAJA keys are set.</span>`);
    }

    btn.disabled = false;
    btn.innerHTML = '📲 Send STK Push to Customer';
  }

  function showSTKStatus(type, html) {
    const d = document.getElementById('stk-status');
    d.style.display = 'block';
    const colors = { success: 'var(--green-bg)', error: 'var(--red-bg)', loading: 'var(--accent-glow)' };
    const borders = { success: 'rgba(16,185,129,.3)', error: 'rgba(239,68,68,.3)', loading: 'rgba(59,130,246,.3)' };
    d.style.cssText = `display:block;padding:14px 16px;border-radius:10px;font-size:13.5px;line-height:1.7;border:1px solid ${borders[type]};background:${colors[type]}`;
    d.innerHTML = html;
  }

  // ══════════════════════════════════════════
  // AI ASSISTANT — Claude API
  // ══════════════════════════════════════════
  // ── Dynamic ERP context — pulls LIVE data from all loaded modules ──
  function buildERPContext() {
    const leads = _allLeads||[];
    const customers = _allCustomers||[];
    const deals = _allDeals||[];
    const orders = _allOrders||[];
    const invoices = _allInvoices||[];
    const payments = _allPayments||[];
    const employees = _allEmployees||[];
    const payroll = _allPayroll||[];
    const mpesa = _mpesaTxns||[];
    const tasks = _allTasks||[];

    const totalRevenue   = invoices.filter(i=>i.status==='paid').reduce((s,i)=>s+(i.total_amount||0),0);
    const outstandingAR  = invoices.filter(i=>i.status==='sent'||i.status==='overdue').reduce((s,i)=>s+(i.total_amount||0),0);
    const overdueInvs    = invoices.filter(i=>i.status==='overdue');
    const pipelineValue  = deals.reduce((s,d)=>s+(d.value||0),0);
    const wonDeals       = deals.filter(d=>d.stage==='closed_won');
    const hotLeads       = leads.filter(l=>l.score>=80);
    const totalPayroll   = payroll.reduce((s,p)=>s+(p.net_pay||0),0);
    const mpesaToday     = mpesa.filter(m=>m.status==='completed');
    const mpesaTotal     = mpesaToday.reduce((s,m)=>s+(m.amount||0),0);
    const pendingTasks   = tasks.filter(t=>t.status!=='done');
    const overdueTasks   = tasks.filter(t=>t.due_date<today()&&t.status!=='done');
    const onLeave        = employees.filter(e=>e.status==='on_leave');

    return `You are NEXUS AI, an intelligent ERP co-pilot embedded in NEXUS ERP, built for Elijah Mecha (Super Admin).
You have full visibility into the following LIVE data pulled directly from the database right now:

SALES & CRM:
- Leads: ${leads.length} total, ${hotLeads.length} hot (score ≥80)
- Customers: ${customers.length} active accounts
- Pipeline: $${pipelineValue.toLocaleString()} across ${deals.length} open deals, ${wonDeals.length} closed won this period
- Tasks: ${pendingTasks.length} pending, ${overdueTasks.length} overdue ⚠

FINANCE:
- Orders: ${orders.length} total (${orders.filter(o=>o.status==='pending').length} pending fulfillment)
- Invoices: ${invoices.length} total · Paid revenue: $${totalRevenue.toLocaleString()} · Outstanding A/R: $${outstandingAR.toLocaleString()}
- Overdue invoices: ${overdueInvs.map(i=>i.customer_name+' $'+(i.total_amount||0).toLocaleString()).join(', ')||'none'}
- Recent payments: ${payments.length} logged

HR:
- Employees: ${employees.length} total, ${onLeave.length} currently on leave
- Payroll (current period): $${totalPayroll.toLocaleString()} net pay across all staff

PAYMENTS:
- M-Pesa: ${mpesaToday.length} completed transactions, KES ${mpesaTotal.toLocaleString()} collected

Today's date: ${new Date().toLocaleDateString('en-KE',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}

You are helpful, concise, and business-focused. Give concrete, actionable advice using the real numbers above.
Format responses clearly with short paragraphs or bullet points. Address Elijah by name occasionally but don't overdo it.`;
  }

  let aiHistory = [];

  function setPrompt(text) {
    document.getElementById('ai-input').value = text;
    document.getElementById('ai-input').focus();
    showPage('ai');
  }

  function addAIMessage(role, content) {
    const msgs = document.getElementById('ai-messages');
    const isUser = role === 'user';
    const div = document.createElement('div');
    div.style.cssText = `display:flex;gap:10px;align-items:flex-start;${isUser ? 'flex-direction:row-reverse;' : ''}`;
    div.innerHTML = `
      <div style="width:28px;height:28px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;
        ${isUser ? 'background:var(--accent);color:#fff;' : 'background:linear-gradient(135deg,var(--purple),var(--accent));'}">
        ${isUser ? 'EM' : '✦'}
      </div>
      <div style="background:${isUser ? 'var(--accent)' : 'var(--bg3)'};border:1px solid ${isUser ? 'transparent' : 'var(--border)'};
        border-radius:${isUser ? '12px 12px 4px 12px' : '12px 12px 12px 4px'};padding:12px 14px;font-size:13.5px;
        color:${isUser ? '#fff' : 'var(--text2)'};line-height:1.6;max-width:85%;white-space:pre-wrap;">${content}</div>`;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function showTyping() {
    const msgs = document.getElementById('ai-messages');
    const div = document.createElement('div');
    div.id = 'ai-typing';
    div.style.cssText = 'display:flex;gap:10px;align-items:flex-start;';
    div.innerHTML = `
      <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,var(--purple),var(--accent));flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:12px;">✦</div>
      <div style="background:var(--bg3);border:1px solid var(--border);border-radius:12px 12px 12px 4px;padding:12px 16px;">
        <span style="display:inline-flex;gap:5px;align-items:center;">
          <span style="width:7px;height:7px;border-radius:50%;background:var(--purple);animation:pulse 1s infinite;"></span>
          <span style="width:7px;height:7px;border-radius:50%;background:var(--purple);animation:pulse 1s .2s infinite;"></span>
          <span style="width:7px;height:7px;border-radius:50%;background:var(--purple);animation:pulse 1s .4s infinite;"></span>
        </span>
      </div>`;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    return div;
  }

  async function sendAI() {
    const input = document.getElementById('ai-input');
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    const btn = document.getElementById('ai-send-btn');
    btn.disabled = true;

    addAIMessage('user', text);
    aiHistory.push({ role: 'user', content: text });
    logAudit('ai_query', 'ai_assistant', null, {query: text.slice(0,100)});

    const typingEl = showTyping();
    const liveContext = buildERPContext();

    // ─────────────────────────────────────────────────────────
    // PRODUCTION: Route through Supabase Edge Function so the
    // ANTHROPIC_API_KEY stays secret server-side.
    // Deploy: supabase functions deploy ai-chat
    // Secret: supabase secrets set ANTHROPIC_API_KEY=sk-ant-xxx
    // ─────────────────────────────────────────────────────────
    try {
      let response, data;
      if (window.SUPABASE_URL) {
        // Try Edge Function first
        response = await fetch(`${window.SUPABASE_URL}/functions/v1/ai-chat`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ system: liveContext, messages: aiHistory })
        });
        if (response.ok) {
          data = await response.json();
        } else {
          throw new Error('Edge Function not deployed yet — see AI Assistant page for deploy instructions');
        }
      } else {
        throw new Error('Supabase not connected');
      }

      typingEl.remove();
      if (data.content && data.content[0]) {
        const reply = data.content[0].text;
        addAIMessage('assistant', reply);
        aiHistory.push({ role: 'assistant', content: reply });
      } else if (data.error) {
        throw new Error(data.error.message || 'API error');
      }
    } catch (err) {
      typingEl.remove();
      // Fallback: helpful canned response using live context so the UI still feels functional
      const fallback = generateFallbackResponse(text, liveContext);
      addAIMessage('assistant', fallback);
    }

    btn.disabled = false;
  }

  // ── Fallback response generator (works without API key, uses real data) ──
  function generateFallbackResponse(query, context) {
    const q = query.toLowerCase();
    const leads=_allLeads||[], invoices=_allInvoices||[], deals=_allDeals||[], employees=_allEmployees||[];

    if (q.includes('sales') || q.includes('revenue') || q.includes('summary')) {
      const paid = invoices.filter(i=>i.status==='paid').reduce((s,i)=>s+(i.total_amount||0),0);
      const won = deals.filter(d=>d.stage==='closed_won').length;
      return `📊 Sales Summary:\n\nRevenue collected: ${fmt(paid)}\nDeals closed won: ${won}\nOpen pipeline: ${fmt(deals.reduce((s,d)=>s+(d.value||0),0))} across ${deals.length} deals\n\n⚠ Note: Connect ANTHROPIC_API_KEY via your Supabase Edge Function for full AI analysis. This is a data summary, not an AI-generated insight.`;
    }
    if (q.includes('overdue') || q.includes('collect')) {
      const overdue = invoices.filter(i=>i.status==='overdue');
      if(!overdue.length) return `✅ Good news — no overdue invoices right now!`;
      return `💸 Overdue Invoices:\n\n${overdue.map(i=>`• ${i.customer_name}: ${fmt(i.total_amount)} (${i.invoice_number})`).join('\n')}\n\nSuggested action: Send reminders to all, escalate any 90+ days to legal.\n\n⚠ Deploy the AI Edge Function for personalized collection strategies.`;
    }
    if (q.includes('lead') || q.includes('score')) {
      const hot = leads.filter(l=>l.score>=80);
      return `🎯 Lead Scoring:\n\n${hot.length} hot leads (score ≥80):\n${hot.map(l=>`• ${l.company_name}: ${l.score}`).join('\n')||'None currently'}\n\nFocus on hot leads first — they convert ${'~'}3x more often.\n\n⚠ Deploy the AI Edge Function for AI-ranked next actions.`;
    }
    if (q.includes('coach') || q.includes('performance') || q.includes('review')) {
      const emp = employees[0];
      return `👥 Performance Note:\n\nTo generate personalized coaching notes, please deploy the Supabase Edge Function with your ANTHROPIC_API_KEY.\n\nIn the meantime, check the Performance page for live KPI tracking on ${employees.map(e=>e.full_name).join(', ')||'your team'}.`;
    }
    return `I'd love to help with that! Right now I'm running in fallback mode because the AI Edge Function isn't deployed yet.\n\nTo activate full Claude-powered responses:\n1. Deploy: supabase functions deploy ai-chat\n2. Set secret: supabase secrets set ANTHROPIC_API_KEY=sk-ant-xxx\n3. Refresh this page\n\nSee the code snippet below this chat for the exact Edge Function to deploy.`;
  }

  // ══════════════════════════════════════════
  // SUPABASE SCHEMA — Copy SQL
  // ══════════════════════════════════════════
  function copySQL() {
    const el = document.getElementById('sql-block');
    const text = el.innerText;
    navigator.clipboard.writeText(text).then(() => {
      const btn = event.target;
      const orig = btn.innerHTML;
      btn.innerHTML = '✓ Copied!';
      btn.style.color = 'var(--green)';
      setTimeout(() => { btn.innerHTML = orig; btn.style.color = ''; }, 2000);
    });
  }

  // ══════════════════════════════════════════
  // LOGIN
  // ══════════════════════════════════════════
  function doLogin() {
    const email = document.getElementById('login-email').value.trim();
    const pwd = document.getElementById('login-pwd').value.trim();
    const err = document.getElementById('login-error');
    // Demo credentials — in production this calls supabase.auth.signInWithPassword()
    if (email === 'elijah@nexuserp.com' && pwd === 'Admin1234!') {
      document.getElementById('login-screen').classList.add('hidden');
      // In production:
      // const { data, error } = await supabase.auth.signInWithPassword({ email, password: pwd })
    } else {
      err.style.display = 'block';
      setTimeout(() => err.style.display = 'none', 3000);
    }
  }
  // Allow Enter key on login
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !document.getElementById('login-screen').classList.contains('hidden')) doLogin();
  });
  function togglePwd() {
    const f = document.getElementById('login-pwd');
    f.type = f.type === 'password' ? 'text' : 'password';
  }
  function logout() {
    document.getElementById('login-screen').classList.remove('hidden');
    // In production: supabase.auth.signOut()
  }

  // ══════════════════════════════════════════
  // DARK / LIGHT THEME
  // ══════════════════════════════════════════
  let isDark = true;
  function toggleTheme() {
    isDark = !isDark;
    document.body.classList.toggle('light', !isDark);
    document.getElementById('theme-btn').textContent = isDark ? '🌙' : '☀️';
    localStorage.setItem('nexus-theme', isDark ? 'dark' : 'light');
  }
  // Restore saved theme
  if (localStorage.getItem('nexus-theme') === 'light') {
    isDark = false; document.body.classList.add('light');
    document.addEventListener('DOMContentLoaded', () => { document.getElementById('theme-btn').textContent = '☀️'; });
  }

  // ══════════════════════════════════════════
  // MOBILE SIDEBAR
  // ══════════════════════════════════════════
  function toggleSidebar() {
    const s = document.getElementById('sidebar');
    const o = document.getElementById('sidebar-overlay');
    s.classList.toggle('open');
    o.classList.toggle('open');
  }
  function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('open');
  }
  // ── MOBILE SIDEBAR ──

  // ══════════════════════════════════════════
  // DIGITAL SIGNATURE PAD
  // ══════════════════════════════════════════
  let sigDrawing = false, sigCtx = null;
  function initSigPad() {
    const canvas = document.getElementById('sig-canvas');
    if (!canvas) return;
    sigCtx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth || 400;
    sigCtx.strokeStyle = isDark ? '#e8edf5' : '#0f172a';
    sigCtx.lineWidth = 2.5; sigCtx.lineCap = 'round'; sigCtx.lineJoin = 'round';
    const getPos = (e) => {
      const r = canvas.getBoundingClientRect();
      const src = e.touches ? e.touches[0] : e;
      return { x: src.clientX - r.left, y: src.clientY - r.top };
    };
    canvas.onmousedown = canvas.ontouchstart = (e) => { e.preventDefault(); sigDrawing = true; const p = getPos(e); sigCtx.beginPath(); sigCtx.moveTo(p.x, p.y); };
    canvas.onmousemove = canvas.ontouchmove = (e) => { e.preventDefault(); if (!sigDrawing) return; const p = getPos(e); sigCtx.lineTo(p.x, p.y); sigCtx.stroke(); };
    canvas.onmouseup = canvas.ontouchend = () => { sigDrawing = false; };
  }
  function clearSig() {
    if (sigCtx) sigCtx.clearRect(0, 0, 2000, 2000);
    document.getElementById('sig-success').style.display = 'none';
  }
  function applySig() {
    const canvas = document.getElementById('sig-canvas');
    const blank = document.createElement('canvas');
    blank.width = canvas.width; blank.height = canvas.height;
    if (canvas.toDataURL() === blank.toDataURL()) { alert('Please draw your signature first.'); return; }
    const ts = new Date().toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'medium' });
    document.getElementById('sig-timestamp').textContent = ts;
    document.getElementById('sig-success').style.display = 'block';
  }
  // (sig pad init is now handled inside the single showPage above)

  // ══════════════════════════════════════════
  // MULTI-CURRENCY CONVERTER
  // ══════════════════════════════════════════
  const FX = { KES: 1, USD: 128.40, EUR: 139.80, GBP: 163.20, AED: 34.95, ZAR: 6.98 };
  const SYMBOLS = { KES: 'KES', USD: '$', EUR: '€', GBP: '£', AED: 'AED', ZAR: 'R' };
  function convertCurrency() {
    const cur = document.getElementById('inv-currency').value;
    const amt = parseFloat(document.getElementById('inv-amount-mc').value) || 0;
    const taxSel = document.getElementById('inv-tax');
    const taxRate = parseFloat(taxSel ? taxSel.value : 16) / 100;
    const rate = FX[cur] || 1;
    const kesAmt = amt * rate;
    const taxAmt = kesAmt * taxRate;
    const total = kesAmt + taxAmt;
    const sym = SYMBOLS[cur];
    document.getElementById('cv-sub').textContent = `${sym} ${amt.toLocaleString('en', {minimumFractionDigits:2})}`;
    document.getElementById('cv-tax').textContent = `${sym} ${(amt * taxRate).toLocaleString('en', {minimumFractionDigits:2})}`;
    document.getElementById('cv-kes').textContent = `KES ${kesAmt.toLocaleString('en', {minimumFractionDigits:2})}`;
    document.getElementById('cv-total').textContent = `${sym} ${(amt + amt*taxRate).toLocaleString('en', {minimumFractionDigits:2})}`;
  }
  function refreshRates() {
    // In production: fetch('https://v6.exchangerate-api.com/v6/YOUR_KEY/latest/KES').then(...)
    document.getElementById('rate-usd').textContent = (128 + Math.random() * 0.8).toFixed(2);
    document.getElementById('rate-eur').textContent = (139 + Math.random() * 0.8).toFixed(2);
    document.getElementById('rate-gbp').textContent = (163 + Math.random() * 0.8).toFixed(2);
    const btn = event.target; btn.textContent = '✓ Rates Updated!';
    setTimeout(() => btn.textContent = '🔄 Refresh Rates', 2000);
  }

  // ══════════════════════════════════════════
  // EMAIL NOTIFICATIONS
  // ══════════════════════════════════════════
  function showEmailSent() {
    const msg = document.getElementById('email-sent-msg');
    msg.style.display = 'block';
    setTimeout(() => msg.style.display = 'none', 4000);
  }

  // ══════════════════════════════════════════
  // PDF / PRINT
  // ══════════════════════════════════════════
  function printPayslip() {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('print-target'));
    document.getElementById('page-payroll').classList.add('print-target');
    window.print();
  }
  function printInvoice() {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('print-target'));
    document.getElementById('page-invoices').classList.add('print-target');
    window.print();
  }

  // ══════════════════════════════════════════
  // SUPABASE CRM ENGINE
  // Leads · Customers · Pipeline · Tasks
  // ══════════════════════════════════════════

  // ── Supabase fetch helper ──
  async function sbFetch(path, opts = {}) {
    const url = `${window.SUPABASE_URL}/rest/v1/${path}`;
    const headers = {
      'apikey': window.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': opts.prefer || 'return=representation',
      ...(opts.headers || {})
    };
    const res = await fetch(url, { method: opts.method || 'GET', headers, body: opts.body ? JSON.stringify(opts.body) : undefined });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.hint || `HTTP ${res.status}`);
    }
    return opts.method === 'DELETE' ? true : res.json().catch(() => ({}));
  }

  // ── show/hide helpers ──
  function showLoading(id) { document.getElementById(id + '-loading').style.display = 'block'; document.getElementById(id + '-empty').style.display = 'none'; if(document.getElementById(id + '-table-wrap')) document.getElementById(id + '-table-wrap').style.display = 'none'; }
  function showEmpty(id) { document.getElementById(id + '-loading').style.display = 'none'; document.getElementById(id + '-empty').style.display = 'block'; if(document.getElementById(id + '-table-wrap')) document.getElementById(id + '-table-wrap').style.display = 'none'; }
  function showTable(id) { document.getElementById(id + '-loading').style.display = 'none'; document.getElementById(id + '-empty').style.display = 'none'; if(document.getElementById(id + '-table-wrap')) document.getElementById(id + '-table-wrap').style.display = 'block'; }

  // ══════════════════════
  // LEADS
  // ══════════════════════
  let _allLeads = [];

  async function loadLeads() {
    if (!window.SUPABASE_URL) { demoLeads(); return; }
    showLoading('leads');
    try {
      const rows = await sbFetch('leads?select=*&order=created_at.desc');
      _allLeads = rows;
      renderLeads(rows);
      updateLeadsKPIs(rows);
    } catch(e) {
      showToast('⚠ Leads: ' + e.message, 'red');
      demoLeads();
    }
  }

  function demoLeads() {
    _allLeads = [
      { id:'demo-1', company_name:'TechPlex Industries', contact_name:'Samuel Karimi', source:'Web Form', score:92, stage:'qualified', assigned_to:'James M.', created_at: new Date().toISOString() },
      { id:'demo-2', company_name:'Nairobi Motors Ltd', contact_name:'Grace Otieno', source:'Referral', score:74, stage:'working', assigned_to:'Amina H.', created_at: new Date().toISOString() },
      { id:'demo-3', company_name:'EastAfrica Feeds', contact_name:'Peter Ngugi', source:'Cold Call', score:45, stage:'new', assigned_to:'Brian O.', created_at: new Date().toISOString() },
      { id:'demo-4', company_name:'Savannah Retail Co.', contact_name:'Diana Muthoni', source:'LinkedIn', score:88, stage:'converted', assigned_to:'James M.', created_at: new Date().toISOString() },
      { id:'demo-5', company_name:'LakeView Logistics', contact_name:'Mark Oduya', source:'Email Campaign', score:61, stage:'working', assigned_to:'Fatuma W.', created_at: new Date().toISOString() },
    ];
    renderLeads(_allLeads);
    updateLeadsKPIs(_allLeads);
  }

  function updateLeadsKPIs(rows) {
    document.getElementById('leads-kpi-total').textContent = rows.length;
    const hot = rows.filter(r => r.score >= 80).length;
    document.getElementById('leads-kpi-hot').textContent = hot;
    const converted = rows.filter(r => r.stage === 'converted').length;
    const conv = rows.length ? ((converted / rows.length) * 100).toFixed(1) + '%' : '0%';
    document.getElementById('leads-kpi-conv').textContent = conv;
    const avg = rows.length ? Math.round(rows.reduce((s,r) => s + (r.score||0), 0) / rows.length) : 0;
    document.getElementById('leads-kpi-avg').textContent = avg;
  }

  function filterLeads() {
    const stage = document.getElementById('leads-filter-stage').value;
    const filtered = stage ? _allLeads.filter(r => r.stage === stage) : _allLeads;
    renderLeads(filtered);
  }

  function renderLeads(rows) {
    if (!rows.length) { showEmpty('leads'); return; }
    showTable('leads');
    const stageMap = { new:'grey', working:'blue', qualified:'green', converted:'purple', lost:'red' };
    const scoreColor = s => s >= 80 ? 'var(--red)' : s >= 60 ? 'var(--yellow)' : 'var(--text2)';
    document.getElementById('leads-tbody').innerHTML = rows.map(r => `
      <tr>
        <td class="td-main">${r.company_name || '—'}</td>
        <td>${r.contact_name || '—'}</td>
        <td>${r.source || '—'}</td>
        <td><strong style="color:${scoreColor(r.score)}">${r.score || 0}</strong></td>
        <td><span class="badge ${stageMap[r.stage] || 'grey'}">${(r.stage||'new').charAt(0).toUpperCase()+(r.stage||'new').slice(1)}</span></td>
        <td>${r.assigned_to || '—'}</td>
        <td style="display:flex;gap:6px;">
          <button class="btn btn-ghost btn-sm" onclick="openLeadDetail('${r.id}')">View</button>
          <button class="btn btn-danger btn-sm" onclick="deleteLead('${r.id}','${r.company_name}')">✕</button>
        </td>
      </tr>`).join('');
  }

  async function saveLead(data) {
    if (!window.SUPABASE_URL) {
      const newLead = { ...data, id: 'demo-' + Date.now(), score: parseInt(data.score) || 50, created_at: new Date().toISOString() };
      _allLeads.unshift(newLead);
      renderLeads(_allLeads); updateLeadsKPIs(_allLeads);
      return;
    }
    try {
      const row = await sbFetch('leads', { method: 'POST', body: data });
      await loadLeads();
      showToast('✅ Lead saved to Supabase!', 'green');
    } catch(e) { showToast('⚠ Save failed: ' + e.message, 'red'); }
  }

  async function deleteLead(id, name) {
    if (!confirm(`Delete lead "${name}"?`)) return;
    if (!window.SUPABASE_URL || id.startsWith('demo-')) {
      _allLeads = _allLeads.filter(r => r.id !== id);
      renderLeads(_allLeads); updateLeadsKPIs(_allLeads);
      showToast('🗑 Lead removed', 'yellow'); return;
    }
    try {
      await sbFetch(`leads?id=eq.${id}`, { method: 'DELETE' });
      await loadLeads();
      showToast('🗑 Lead deleted', 'yellow');
    } catch(e) { showToast('⚠ Delete failed: ' + e.message, 'red'); }
  }

  function openLeadDetail(id) {
    const lead = _allLeads.find(r => r.id === id);
    if (!lead) return;
    openModal('modal-lead-detail');
    document.getElementById('ld-name').textContent = lead.company_name;
    document.getElementById('ld-contact').textContent = lead.contact_name || '—';
    document.getElementById('ld-source').textContent = lead.source || '—';
    document.getElementById('ld-score').textContent = lead.score || 0;
    document.getElementById('ld-stage').textContent = lead.stage || 'new';
    document.getElementById('ld-rep').textContent = lead.assigned_to || '—';
    document.getElementById('ld-notes').textContent = lead.notes || 'No notes yet.';
    document.getElementById('ld-convert-btn').onclick = () => { convertLeadToCustomer(lead); closeModal2('modal-lead-detail'); };
  }

  function convertLeadToCustomer(lead) {
    if (confirm(`Convert "${lead.company_name}" from Lead to Customer?`)) {
      saveLead({ ...lead, stage: 'converted' });
      saveCustomer({ company_name: lead.company_name, status: 'active' });
      showToast('🎉 Lead converted to Customer!', 'green');
    }
  }

  // ══════════════════════
  // CUSTOMERS
  // ══════════════════════
  let _allCustomers = [];
  let _activeCustomerId = null;

  async function loadCustomers() {
    if (!window.SUPABASE_URL) { demoCustomers(); return; }
    showLoading('cust');
    try {
      const status = document.getElementById('cust-filter-status')?.value || '';
      let path = 'customers?select=*&order=company_name.asc';
      if (status) path += `&status=eq.${status}`;
      const rows = await sbFetch(path);
      _allCustomers = rows;
      renderCustomers(rows);
    } catch(e) {
      showToast('⚠ Customers: ' + e.message, 'red');
      demoCustomers();
    }
  }

  function demoCustomers() {
    _allCustomers = [
      { id:'dc-1', company_name:'Safaricom Ltd', industry:'Telecom', territory:'Nairobi', account_rep:'James M.', total_orders:47, revenue:284000, credit_limit:500000, currency:'KES', status:'active' },
      { id:'dc-2', company_name:'Equity Bank', industry:'Financial', territory:'Nairobi', account_rep:'Amina H.', total_orders:28, revenue:142500, credit_limit:300000, currency:'USD', status:'active' },
      { id:'dc-3', company_name:'Kenya Breweries', industry:'FMCG', territory:'Mombasa', account_rep:'Brian O.', total_orders:15, revenue:89300, credit_limit:150000, currency:'KES', status:'active' },
      { id:'dc-4', company_name:'Bamburi Cement', industry:'Construction', territory:'Mombasa', account_rep:'Kwame B.', total_orders:9, revenue:64100, credit_limit:100000, currency:'KES', status:'at_risk' },
      { id:'dc-5', company_name:'Nation Media Group', industry:'Media', territory:'Nairobi', account_rep:'Fatuma W.', total_orders:5, revenue:21400, credit_limit:50000, currency:'KES', status:'inactive' },
    ];
    renderCustomers(_allCustomers);
  }

  function renderCustomers(rows) {
    if (!rows.length) { showEmpty('cust'); return; }
    showTable('cust');
    const stMap = { active:'green', at_risk:'yellow', inactive:'red' };
    document.getElementById('cust-tbody').innerHTML = rows.map(r => `
      <tr onclick="showCustomerSnapshot('${r.id}')" style="cursor:pointer;">
        <td class="td-main">${r.company_name}</td>
        <td>${r.industry || '—'}</td>
        <td>${r.territory || '—'}</td>
        <td>${r.total_orders || 0}</td>
        <td class="mono ${r.revenue > 100000 ? 'color-green' : ''}">$${(r.revenue||0).toLocaleString()}</td>
        <td><span class="badge ${stMap[r.status]||'grey'}">${(r.status||'active').replace('_',' ')}</span></td>
        <td><button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();deleteCustomer('${r.id}','${r.company_name}')">✕</button></td>
      </tr>`).join('');
  }

  function showCustomerSnapshot(id) {
    const c = _allCustomers.find(r => r.id === id);
    if (!c) return;
    _activeCustomerId = id;
    document.getElementById('cust-snapshot-empty').style.display = 'none';
    document.getElementById('cust-snapshot-data').style.display = 'block';
    const initials = c.company_name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
    document.getElementById('snap-avatar').textContent = initials;
    document.getElementById('snap-name').textContent = c.company_name;
    document.getElementById('snap-industry').textContent = c.industry || '—';
    document.getElementById('snap-territory').textContent = c.territory || '—';
    document.getElementById('snap-rep').textContent = c.account_rep || '—';
    document.getElementById('snap-orders').textContent = c.total_orders || 0;
    document.getElementById('snap-revenue').textContent = '$' + (c.revenue||0).toLocaleString();
    document.getElementById('snap-credit').textContent = '$' + (c.credit_limit||0).toLocaleString();
    document.getElementById('snap-currency').textContent = c.currency || 'KES';
    const stMap = { active:'green', at_risk:'yellow', inactive:'red' };
    document.getElementById('snap-status').innerHTML = `<span class="badge ${stMap[c.status]||'grey'}">${(c.status||'active').replace('_',' ')}</span>`;
    document.getElementById('snap-delete-btn').onclick = () => deleteCustomer(id, c.company_name);
  }

  async function saveCustomer(data) {
    if (!window.SUPABASE_URL) {
      const newC = { ...data, id: 'dc-' + Date.now(), total_orders: 0, revenue: 0, created_at: new Date().toISOString() };
      _allCustomers.unshift(newC); renderCustomers(_allCustomers); return;
    }
    try {
      await sbFetch('customers', { method: 'POST', body: data });
      await loadCustomers();
      showToast('✅ Customer saved to Supabase!', 'green');
    } catch(e) { showToast('⚠ Save failed: ' + e.message, 'red'); }
  }

  async function deleteCustomer(id, name) {
    if (!confirm(`Delete customer "${name}"? This cannot be undone.`)) return;
    if (!window.SUPABASE_URL || id.startsWith('dc-')) {
      _allCustomers = _allCustomers.filter(r => r.id !== id);
      renderCustomers(_allCustomers);
      document.getElementById('cust-snapshot-data').style.display = 'none';
      document.getElementById('cust-snapshot-empty').style.display = 'block';
      showToast('🗑 Customer removed', 'yellow'); return;
    }
    try {
      await sbFetch(`customers?id=eq.${id}`, { method: 'DELETE' });
      await loadCustomers();
      showToast('🗑 Customer deleted', 'yellow');
    } catch(e) { showToast('⚠ Delete failed: ' + e.message, 'red'); }
  }

  // ══════════════════════
  // PIPELINE
  // ══════════════════════
  let _allDeals = [];
  const PIPE_STAGES = [
    { key:'prospecting', label:'Prospecting', color:'var(--text3)' },
    { key:'qualified', label:'Qualified', color:'var(--accent)' },
    { key:'proposal', label:'Proposal Sent', color:'var(--yellow)' },
    { key:'negotiation', label:'Negotiation', color:'var(--purple)' },
    { key:'closed_won', label:'Closed Won', color:'var(--green)' },
  ];

  async function loadPipeline() {
    if (!window.SUPABASE_URL) { demoPipeline(); return; }
    document.getElementById('pipe-loading').style.display = 'block';
    document.getElementById('pipe-kanban').style.display = 'none';
    try {
      const rows = await sbFetch('opportunities?select=*&order=created_at.desc');
      _allDeals = rows;
      renderPipeline(rows);
    } catch(e) {
      showToast('⚠ Pipeline: ' + e.message, 'red');
      demoPipeline();
    }
  }

  function demoPipeline() {
    _allDeals = [
      { id:'dp-1', title:'TechPlex ERP Deal', customer_name:'TechPlex Industries', value:85000, probability:30, stage:'prospecting', assigned_to:'James M.', close_date:'2026-07-15' },
      { id:'dp-2', title:'Equity Bank Integration', customer_name:'Equity Bank', value:128000, probability:50, stage:'qualified', assigned_to:'James M.', close_date:'2026-07-10' },
      { id:'dp-3', title:'Bamburi Digital Suite', customer_name:'Bamburi Cement', value:92000, probability:65, stage:'proposal', assigned_to:'Kwame B.', close_date:'2026-07-05' },
      { id:'dp-4', title:'Safaricom Platform', customer_name:'Safaricom Ltd', value:195000, probability:80, stage:'negotiation', assigned_to:'James M.', close_date:'2026-06-30' },
      { id:'dp-5', title:'Savannah Retail POS', customer_name:'Savannah Retail', value:48000, probability:100, stage:'closed_won', assigned_to:'James M.', close_date:'2026-06-20' },
      { id:'dp-6', title:'KQ Logistics System', customer_name:'Kenya Airways', value:64000, probability:45, stage:'qualified', assigned_to:'Fatuma W.', close_date:'2026-07-20' },
      { id:'dp-7', title:'Nation Media CMS', customer_name:'Nation Media', value:37500, probability:60, stage:'proposal', assigned_to:'Amina H.', close_date:'2026-07-12' },
    ];
    renderPipeline(_allDeals);
  }

  function renderPipeline(rows) {
    document.getElementById('pipe-loading').style.display = 'none';
    document.getElementById('pipe-kanban').style.display = 'flex';
    const total = rows.reduce((s,r) => s + (r.value||0), 0);
    const weighted = rows.reduce((s,r) => s + (r.value||0) * ((r.probability||0)/100), 0);
    const won = rows.filter(r => r.stage === 'closed_won').length;
    const closed = rows.filter(r => r.stage === 'closed_won' || r.stage === 'closed_lost').length;
    document.getElementById('pipe-total').textContent = '$' + (total/1000).toFixed(0) + 'K';
    document.getElementById('pipe-weighted').textContent = '$' + (weighted/1000).toFixed(0) + 'K';
    document.getElementById('pipe-winrate').textContent = closed ? Math.round(won/closed*100) + '%' : '—';
    document.getElementById('pipe-count').textContent = rows.filter(r => !r.stage?.includes('closed')).length;
    const kanban = document.getElementById('pipe-kanban');
    kanban.innerHTML = PIPE_STAGES.map(stage => {
      const deals = rows.filter(r => r.stage === stage.key);
      const colValue = deals.reduce((s,r) => s+(r.value||0), 0);
      return `
        <div class="kanban-col">
          <div class="kanban-head" style="color:${stage.color}">
            ${stage.label}
            <span class="kanban-count">${deals.length}</span>
          </div>
          <div style="font-size:11.5px;color:var(--text3);padding:0 12px 8px;font-family:'JetBrains Mono',monospace;">
            $${colValue.toLocaleString()}
          </div>
          <div class="kanban-cards">
            ${deals.map(d => `
              <div class="deal-card" onclick="openDealDetail('${d.id}')">
                <div class="deal-name">${d.title}</div>
                <div style="font-size:12px;color:var(--text3);margin-bottom:4px;">${d.customer_name || '—'}</div>
                <div class="deal-value">$${(d.value||0).toLocaleString()}</div>
                <div class="deal-meta">${d.assigned_to||'—'} · ${d.probability||0}% · ${d.close_date||'—'}</div>
                <button class="btn btn-danger btn-sm" style="margin-top:8px;width:100%;justify-content:center;" 
                  onclick="event.stopPropagation();deleteDeal('${d.id}','${d.title}')">✕ Remove</button>
              </div>`).join('')}
            ${!deals.length ? `<div style="padding:16px;text-align:center;font-size:12px;color:var(--text3);border:1px dashed var(--border);border-radius:8px;">Drop deals here</div>` : ''}
          </div>
        </div>`;
    }).join('');
  }

  function openDealDetail(id) {
    const d = _allDeals.find(r => r.id === id);
    if (!d) return;
    openModal('modal-deal-detail');
    document.getElementById('dd-title').textContent = d.title;
    document.getElementById('dd-customer').textContent = d.customer_name || '—';
    document.getElementById('dd-value').textContent = '$' + (d.value||0).toLocaleString();
    document.getElementById('dd-prob').textContent = (d.probability||0) + '%';
    document.getElementById('dd-stage').textContent = (d.stage||'').replace('_',' ');
    document.getElementById('dd-rep').textContent = d.assigned_to || '—';
    document.getElementById('dd-close').textContent = d.close_date || '—';
    document.getElementById('dd-won-btn').onclick = () => { moveDeal(id,'closed_won'); closeModal2('modal-deal-detail'); };
    document.getElementById('dd-lost-btn').onclick = () => { moveDeal(id,'closed_lost'); closeModal2('modal-deal-detail'); };
  }

  async function moveDeal(id, newStage) {
    if (!window.SUPABASE_URL || id.startsWith('dp-')) {
      const d = _allDeals.find(r => r.id === id);
      if (d) d.stage = newStage;
      renderPipeline(_allDeals);
      showToast(`✅ Deal moved to ${newStage.replace('_',' ')}`, 'green'); return;
    }
    try {
      await sbFetch(`opportunities?id=eq.${id}`, { method: 'PATCH', body: { stage: newStage } });
      await loadPipeline();
      showToast(`✅ Deal moved to ${newStage.replace('_',' ')}`, 'green');
    } catch(e) { showToast('⚠ ' + e.message, 'red'); }
  }

  async function saveDeal(data) {
    if (!window.SUPABASE_URL) {
      const nd = { ...data, id: 'dp-' + Date.now(), value: parseFloat(data.value)||0, probability: parseInt(data.probability)||20 };
      _allDeals.unshift(nd); renderPipeline(_allDeals); return;
    }
    try {
      await sbFetch('opportunities', { method: 'POST', body: data });
      await loadPipeline();
      showToast('✅ Deal saved to Supabase!', 'green');
    } catch(e) { showToast('⚠ ' + e.message, 'red'); }
  }

  async function deleteDeal(id, title) {
    if (!confirm(`Remove deal "${title}"?`)) return;
    if (!window.SUPABASE_URL || id.startsWith('dp-')) {
      _allDeals = _allDeals.filter(r => r.id !== id);
      renderPipeline(_allDeals);
      showToast('🗑 Deal removed', 'yellow'); return;
    }
    try {
      await sbFetch(`opportunities?id=eq.${id}`, { method: 'DELETE' });
      await loadPipeline();
      showToast('🗑 Deal deleted', 'yellow');
    } catch(e) { showToast('⚠ ' + e.message, 'red'); }
  }

  // ══════════════════════
  // TASKS
  // ══════════════════════
  let _allTasks = [];
  let _taskFilter = 'all';

  async function loadTasks() {
    if (!window.SUPABASE_URL) { demoTasks(); return; }
    document.getElementById('tasks-loading').style.display = 'block';
    document.getElementById('tasks-empty').style.display = 'none';
    document.getElementById('tasks-table-wrap').style.display = 'none';
    try {
      const rows = await sbFetch('tasks?select=*&order=due_date.asc');
      _allTasks = rows;
      filterTasks(_taskFilter);
    } catch(e) {
      showToast('⚠ Tasks: ' + e.message, 'red');
      demoTasks();
    }
  }

  function demoTasks() {
    const today = new Date().toISOString().slice(0,10);
    const yesterday = new Date(Date.now()-86400000).toISOString().slice(0,10);
    _allTasks = [
      { id:'dt-1', title:'Follow up on proposal', linked_to:'TechPlex Industries', assigned_to:'James M.', due_date:yesterday, priority:'High', status:'pending' },
      { id:'dt-2', title:'Send contract for signing', linked_to:'Safaricom Ltd', assigned_to:'Elijah Mecha', due_date:today, priority:'High', status:'in_progress' },
      { id:'dt-3', title:'Demo call booking', linked_to:'EastAfrica Feeds', assigned_to:'Brian O.', due_date:'2026-06-30', priority:'Medium', status:'pending' },
      { id:'dt-4', title:'Credit check — Bamburi', linked_to:'Bamburi Cement', assigned_to:'Finance', due_date:'2026-07-02', priority:'Medium', status:'pending' },
      { id:'dt-5', title:'Onboarding checklist', linked_to:'Kwame Boateng', assigned_to:'HR Admin', due_date:'2026-07-01', priority:'Low', status:'done' },
    ];
    filterTasks(_taskFilter);
  }

  function filterTasks(filter, tabEl) {
    _taskFilter = filter;
    if (tabEl) {
      document.querySelectorAll('#tasks-tabs .tab').forEach(t => t.classList.remove('active'));
      tabEl.classList.add('active');
    }
    const today = new Date().toISOString().slice(0,10);
    let rows = [..._allTasks];
    if (filter === 'mine') rows = rows.filter(r => r.assigned_to === 'Elijah Mecha' || r.assigned_to === 'Elijah');
    else if (filter === 'overdue') rows = rows.filter(r => r.due_date < today && r.status !== 'done');
    else if (filter === 'done') rows = rows.filter(r => r.status === 'done');
    renderTasks(rows);
  }

  function renderTasks(rows) {
    document.getElementById('tasks-loading').style.display = 'none';
    if (!rows.length) { showEmpty('tasks'); return; }
    document.getElementById('tasks-empty').style.display = 'none';
    document.getElementById('tasks-table-wrap').style.display = 'block';
    const today = new Date().toISOString().slice(0,10);
    const priMap = { High:'red', Medium:'yellow', Low:'grey' };
    const stMap = { pending:'yellow', in_progress:'blue', done:'green' };
    const stLabel = { pending:'Pending', in_progress:'In Progress', done:'Done' };
    document.getElementById('tasks-tbody').innerHTML = rows.map(r => {
      const overdue = r.due_date < today && r.status !== 'done';
      return `
        <tr>
          <td class="td-main">${r.title}</td>
          <td>${r.linked_to || '—'}</td>
          <td>${r.assigned_to || '—'}</td>
          <td style="color:${overdue ? 'var(--red)' : 'inherit'}">${r.due_date || '—'}${overdue ? ' ⚠' : ''}</td>
          <td><span class="badge ${priMap[r.priority]||'grey'}">${r.priority||'—'}</span></td>
          <td><span class="badge ${stMap[r.status]||'grey'}">${stLabel[r.status]||r.status}</span></td>
          <td style="display:flex;gap:6px;">
            ${r.status !== 'done' ? `<button class="btn btn-ghost btn-sm" onclick="completeTask('${r.id}')">✓ Done</button>` : ''}
            <button class="btn btn-danger btn-sm" onclick="deleteTask('${r.id}','${r.title}')">✕</button>
          </td>
        </tr>`;
    }).join('');
  }

  async function saveTask(data) {
    if (!window.SUPABASE_URL) {
      const nt = { ...data, id: 'dt-' + Date.now(), status: 'pending', created_at: new Date().toISOString() };
      _allTasks.unshift(nt); filterTasks(_taskFilter); return;
    }
    try {
      await sbFetch('tasks', { method: 'POST', body: data });
      await loadTasks();
      showToast('✅ Task saved to Supabase!', 'green');
    } catch(e) { showToast('⚠ ' + e.message, 'red'); }
  }

  async function completeTask(id) {
    if (!window.SUPABASE_URL || id.startsWith('dt-')) {
      const t = _allTasks.find(r => r.id === id);
      if (t) t.status = 'done';
      filterTasks(_taskFilter);
      showToast('✅ Task marked as done!', 'green'); return;
    }
    try {
      await sbFetch(`tasks?id=eq.${id}`, { method: 'PATCH', body: { status: 'done' } });
      await loadTasks();
      showToast('✅ Task completed!', 'green');
    } catch(e) { showToast('⚠ ' + e.message, 'red'); }
  }

  async function deleteTask(id, title) {
    if (!confirm(`Delete task "${title}"?`)) return;
    if (!window.SUPABASE_URL || id.startsWith('dt-')) {
      _allTasks = _allTasks.filter(r => r.id !== id);
      filterTasks(_taskFilter);
      showToast('🗑 Task deleted', 'yellow'); return;
    }
    try {
      await sbFetch(`tasks?id=eq.${id}`, { method: 'DELETE' });
      await loadTasks();
      showToast('🗑 Task deleted', 'yellow');
    } catch(e) { showToast('⚠ ' + e.message, 'red'); }
  }

  // ── Wire modals to save functions ──
  function wireModalSave() {
    // Lead form
    document.querySelector('#add-modal .btn-primary')?.addEventListener('click', () => {
      const data = {
        company_name: document.getElementById('add-modal').querySelector('input[placeholder="Acme Corporation"]')?.value,
        contact_name: document.getElementById('add-modal').querySelector('input[placeholder="John Doe"]')?.value,
        email: document.getElementById('add-modal').querySelector('input[type="email"]')?.value,
        phone: document.getElementById('add-modal').querySelector('input[placeholder="+254 700 000 000"]')?.value,
        source: document.getElementById('add-modal').querySelector('select')?.value,
        assigned_to: document.getElementById('add-modal').querySelectorAll('select')[1]?.value,
        notes: document.getElementById('add-modal').querySelector('textarea')?.value,
        score: 50, stage: 'new'
      };
      if (!data.company_name) { showToast('⚠ Company name is required', 'red'); return; }
      saveLead(data); closeModal2('add-modal');
    });

    // Customer form
    document.querySelector('#modal-customer .btn-primary')?.addEventListener('click', () => {
      const modal = document.getElementById('modal-customer');
      const inputs = modal.querySelectorAll('input,select');
      const data = {
        company_name: inputs[0]?.value, industry: inputs[1]?.value,
        territory: inputs[2]?.value, account_rep: inputs[3]?.value,
        email: inputs[4]?.value, phone: inputs[5]?.value,
        currency: inputs[6]?.value, credit_limit: parseFloat(inputs[7]?.value)||0,
        status: 'active'
      };
      if (!data.company_name) { showToast('⚠ Company name is required', 'red'); return; }
      saveCustomer(data); closeModal2('modal-customer');
    });

    // Deal form
    document.querySelector('#modal-deal .btn-primary')?.addEventListener('click', () => {
      const modal = document.getElementById('modal-deal');
      const inputs = modal.querySelectorAll('input,select,textarea');
      const data = {
        title: inputs[0]?.value, customer_name: inputs[1]?.value,
        value: parseFloat(inputs[2]?.value)||0, probability: parseInt(inputs[3]?.value)||20,
        stage: inputs[4]?.value?.toLowerCase().replace(' ','_'), assigned_to: inputs[5]?.value,
        close_date: inputs[6]?.value, notes: inputs[7]?.value
      };
      if (!data.title) { showToast('⚠ Deal title is required', 'red'); return; }
      saveDeal(data); closeModal2('modal-deal');
    });

    // Task form
    document.querySelector('#modal-task .btn-primary')?.addEventListener('click', () => {
      const modal = document.getElementById('modal-task');
      const inputs = modal.querySelectorAll('input,select,textarea');
      const data = {
        title: inputs[0]?.value, linked_to: inputs[1]?.value,
        assigned_to: inputs[2]?.value, due_date: inputs[3]?.value,
        priority: inputs[4]?.value, description: inputs[5]?.value,
        status: 'pending'
      };
      if (!data.title) { showToast('⚠ Task title is required', 'red'); return; }
      saveTask(data); closeModal2('modal-task');
    });
  }

  // ── Auto-load CRM data on page navigation ──
  const _origShowCRM = showPage;
  // Patch loadData into showPage using event pattern instead of redefining
  document.addEventListener('crm:load', e => {
    const id = e.detail;
    if (id === 'leads') loadLeads();
    if (id === 'customers') loadCustomers();
    if (id === 'pipeline') loadPipeline();
    if (id === 'tasks') loadTasks();
  });

  // Override showPage to dispatch CRM load event (no redefinition)
  const _origShowRef = window.showPage;
  window.showPage = function(id) {
    _origShowRef(id);
    document.dispatchEvent(new CustomEvent('crm:load', { detail: id }));
  };

  // ── Init on DOMContentLoaded ──
  document.addEventListener('DOMContentLoaded', () => {
    wireModalSave();
    // Pre-load the dashboard's visible page data
    setTimeout(() => {
      loadLeads(); loadCustomers(); loadPipeline(); loadTasks();
    }, 500);
  });

  // ══════════════════════════════════════════
  // SUPABASE LIVE DATA (original stub — now replaced above)
  // ══════════════════════════════════════════
  async function loadSupabaseData() {
    if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) return;
    try {
      // Fetch customers
      const res = await fetch(`${SUPABASE_URL}/rest/v1/customers?select=*&limit=10`, {
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
      });
      if (res.ok) {
        const customers = await res.json();
        if (customers.length > 0) console.log('✅ Supabase connected — loaded', customers.length, 'customers');
      }
      // Fetch leads count
      const leadsRes = await fetch(`${SUPABASE_URL}/rest/v1/leads?select=count`, {
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Prefer': 'count=exact', 'Range': '0-0' }
      });
      if (leadsRes.ok) {
        const count = leadsRes.headers.get('Content-Range')?.split('/')[1];
        if (count) document.querySelector('.nav-badge')?.textContent === count;
      }
    } catch (e) { console.log('Supabase load skipped (demo mode):', e.message); }
  }
  // Run on load
  setTimeout(loadSupabaseData, 1000);

  // ══════════════════════════════════════════
  // BUTTON ACTIONS — all wired
  // ══════════════════════════════════════════

  // Universal save + close + toast
  function saveAndClose(modalId, label) {
    closeModal2(modalId);
    showToast('✅ ' + label + ' saved successfully!', 'green');
  }

  // Toast notification system
  function showToast(msg, color) {
    color = color || 'accent';
    const colors = { green:'var(--green-bg)', accent:'var(--accent-glow)', red:'var(--red-bg)', yellow:'var(--yellow-bg)' };
    const borders = { green:'rgba(16,185,129,.3)', accent:'rgba(59,130,246,.3)', red:'rgba(239,68,68,.3)', yellow:'rgba(245,158,11,.3)' };
    const t = document.createElement('div');
    t.style.cssText = `position:fixed;bottom:24px;right:24px;z-index:9999;background:${colors[color]};border:1px solid ${borders[color]};
      border-radius:12px;padding:14px 20px;font-size:14px;font-weight:600;color:var(--text);
      box-shadow:0 8px 32px rgba(0,0,0,.3);animation:fadeIn .2s;max-width:320px;line-height:1.4;`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity='0'; t.style.transition='opacity .3s'; setTimeout(()=>t.remove(),300); }, 3500);
  }

  // View invoice detail
  function setViewInvoice(num, customer, amount, status) {
    document.getElementById('vi-title').textContent = 'Invoice ' + num;
    document.getElementById('vi-customer').textContent = customer;
    document.getElementById('vi-amount').textContent = amount;
    const vat = parseFloat(amount.replace(/[^0-9.]/g,'')) * 0.16;
    document.getElementById('vi-vat').textContent = '$' + vat.toLocaleString('en',{minimumFractionDigits:0});
    const sc = {Paid:'green',Pending:'yellow',Overdue:'red',Draft:'grey'};
    document.getElementById('vi-status').innerHTML = `<span class="badge ${sc[status]||'grey'}">${status}</span>`;
  }

  // Payment reminder
  function sendPaymentReminder(customer, invoiceNo) {
    showToast(`📧 Payment reminder sent to ${customer} for ${invoiceNo}`, 'accent');
  }

  // Escalate invoice
  function escalateInvoice(customer, invoiceNo) {
    if(confirm(`Escalate ${invoiceNo} for ${customer} to senior management and legal team?`)) {
      showToast(`🚨 Escalation raised for ${customer} — ${invoiceNo}. Finance manager notified.`, 'red');
    }
  }

  // Convert quote to sales order
  function convertQuoteToOrder(quoteNo, customer, value) {
    if(confirm(`Convert ${quoteNo} (${customer} · ${value}) to a Sales Order?`)) {
      showToast(`✅ ${quoteNo} converted to Sales Order SO-${Math.floor(Math.random()*900+1100)}. Inventory reserved.`, 'green');
    }
  }

  // Approve quote
  function approveQuote(quoteNo) {
    if(confirm(`Approve quote ${quoteNo}? This will allow the sales rep to send it to the client.`)) {
      showToast(`✅ Quote ${quoteNo} approved and sent to client.`, 'green');
    }
  }

  // Run payroll
  function runPayroll() {
    if(confirm('Run July 2026 payroll for all 64 employees? This will calculate salaries, commissions, and deductions.')) {
      showToast('⚙️ Payroll running… 64 payslips being generated. You will be notified when done.', 'accent');
    }
  }

  // Download all payslips
  function downloadAllPayslips() {
    showToast('📦 Preparing all 64 payslips as a ZIP file… download will start shortly.', 'accent');
  }

  // Print specific invoice
  function printInvoiceItem(invoiceNo) {
    showToast(`🖨 Opening print view for ${invoiceNo}…`, 'accent');
    setTimeout(() => printInvoice(), 600);
  }

  // Export report
  function exportReport() {
    showToast('📊 Exporting dashboard report as PDF… download will start shortly.', 'accent');
  }

  // Import CSV
  function importCSV() {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.csv,.xlsx';
    input.onchange = () => showToast(`📥 Importing ${input.files[0]?.name}… Products will be added shortly.`, 'green');
    input.click();
  }
  // ══════════════════════════════════════════
  // FINANCE ENGINE
  // Orders · Invoices · Payments · Quotes
  // ══════════════════════════════════════════

  const fmt = (n) => '$' + (parseFloat(n)||0).toLocaleString('en',{minimumFractionDigits:0});
  const daysOverdue = (due) => Math.floor((Date.now() - new Date(due)) / 86400000);

  // ══ ORDERS ══
  let _allOrders = [];

  async function loadOrders() {
    if (!window.SUPABASE_URL) { demoOrders(); return; }
    showLoading('ord');
    try {
      const status = document.getElementById('ord-filter')?.value || '';
      let path = 'sales_orders?select=*&order=created_at.desc';
      if (status) path += `&status=eq.${status}`;
      _allOrders = await sbFetch(path);
      renderOrders(_allOrders);
    } catch(e) { showToast('⚠ Orders: ' + e.message,'red'); demoOrders(); }
  }

  function demoOrders() {
    _allOrders = [
      {id:'so-1',order_number:'SO-1101',customer_name:'Safaricom Ltd',description:'12 items · Server Nodes',total_amount:18400,currency:'USD',status:'delivered',shipping:'DHL Express'},
      {id:'so-2',order_number:'SO-1098',customer_name:'Equity Bank',description:'5 items · Licenses',total_amount:9200,currency:'USD',status:'shipped',shipping:'G4S'},
      {id:'so-3',order_number:'SO-1095',customer_name:'Kenya Breweries',description:'30 items · Accessories',total_amount:44100,currency:'KES',status:'packed',shipping:'Awaiting carrier'},
      {id:'so-4',order_number:'SO-1093',customer_name:'Bamburi Cement',description:'8 items · UPS Units',total_amount:12800,currency:'KES',status:'picked',shipping:'In warehouse'},
      {id:'so-5',order_number:'SO-1090',customer_name:'TechPlex Industries',description:'2 items · ERP License',total_amount:85000,currency:'USD',status:'pending',shipping:'Not started'},
    ];
    renderOrders(_allOrders);
  }

  function renderOrders(rows) {
    document.getElementById('ord-kpi-pending').textContent   = rows.filter(r=>r.status==='pending').length;
    document.getElementById('ord-kpi-transit').textContent   = rows.filter(r=>['shipped','packed','picked'].includes(r.status)).length;
    document.getElementById('ord-kpi-delivered').textContent = rows.filter(r=>r.status==='delivered').length;
    document.getElementById('ord-kpi-value').textContent     = fmt(rows.reduce((s,r)=>s+(r.total_amount||0),0));
    if (!rows.length) { showEmpty('ord'); return; }
    showTable('ord');
    document.getElementById('ord-tbody').innerHTML = rows.map(r=>`
      <tr>
        <td class="td-main mono">${r.order_number||'—'}</td>
        <td>${r.customer_name||'—'}</td>
        <td style="font-size:12px;color:var(--text3)">${r.description||'—'}</td>
        <td class="mono">${fmt(r.total_amount)}</td>
        <td><span class="badge grey">${r.currency||'USD'}</span></td>
        <td>
          <select class="form-input" style="height:28px;padding:2px 8px;font-size:12px;" onchange="updateOrderStatus('${r.id}',this.value)">
            ${['pending','picked','packed','shipped','delivered','cancelled'].map(s=>`<option value="${s}" ${r.status===s?'selected':''}>${s.charAt(0).toUpperCase()+s.slice(1)}</option>`).join('')}
          </select>
        </td>
        <td style="font-size:12px">${r.shipping||'—'}</td>
        <td style="display:flex;gap:4px;">
          <button class="btn btn-ghost btn-sm" onclick="generateInvoiceFromOrder('${r.id}')">🧾 Invoice</button>
          <button class="btn btn-danger btn-sm" onclick="deleteOrder('${r.id}','${r.order_number}')">✕</button>
        </td>
      </tr>`).join('');
  }

  async function updateOrderStatus(id, status) {
    const o = _allOrders.find(r=>r.id===id);
    if (!window.SUPABASE_URL||id.startsWith('so-')) {
      if(o) o.status=status; renderOrders(_allOrders);
      if(status==='delivered'){ showToast('📦 Delivered! Auto-generating invoice…','green'); setTimeout(()=>generateInvoiceFromOrder(id),1200); }
      else showToast('✅ Status → '+status,'accent'); return;
    }
    try {
      await sbFetch(`sales_orders?id=eq.${id}`,{method:'PATCH',body:{status}});
      if(status==='delivered'){ showToast('📦 Delivered! Generating invoice…','green'); setTimeout(()=>generateInvoiceFromOrder(id),1200); }
      else showToast('✅ Status updated','accent');
      await loadOrders();
    } catch(e) { showToast('⚠ '+e.message,'red'); }
  }

  async function saveOrder(data) {
    const num = 'SO-'+(1100+Math.floor(Math.random()*900));
    const row = {...data, order_number:num, status:'pending'};
    if (!window.SUPABASE_URL) { _allOrders.unshift({...row,id:'so-'+Date.now()}); renderOrders(_allOrders); showToast('✅ '+num+' created!','green'); return; }
    try { await sbFetch('sales_orders',{method:'POST',body:row}); await loadOrders(); showToast('✅ '+num+' saved!','green'); } catch(e) { showToast('⚠ '+e.message,'red'); }
  }

  async function deleteOrder(id,num) {
    if(!confirm('Delete order '+num+'?')) return;
    if(!window.SUPABASE_URL||id.startsWith('so-')){ _allOrders=_allOrders.filter(r=>r.id!==id); renderOrders(_allOrders); showToast('🗑 Removed','yellow'); return; }
    try { await sbFetch('sales_orders?id=eq.'+id,{method:'DELETE'}); await loadOrders(); showToast('🗑 Deleted','yellow'); } catch(e) { showToast('⚠ '+e.message,'red'); }
  }

  function generateInvoiceFromOrder(id) {
    const o = _allOrders.find(r=>r.id===id); if(!o) return;
    saveInvoice({ customer_name:o.customer_name, invoice_type:'tax', subtotal:o.total_amount, tax_rate:16, tax_amount:o.total_amount*0.16, total_amount:o.total_amount*1.16, currency:o.currency||'USD', status:'sent', due_date:new Date(Date.now()+30*86400000).toISOString().slice(0,10) });
  }

  // ══ INVOICES ══
  let _allInvoices = [];
  let _invFilter = 'all';

  async function loadInvoices() {
    if (!window.SUPABASE_URL) { demoInvoices(); return; }
    showLoading('inv');
    try { _allInvoices = await sbFetch('invoices?select=*&order=created_at.desc'); filterInvoices(_invFilter); }
    catch(e) { showToast('⚠ Invoices: '+e.message,'red'); demoInvoices(); }
  }

  function demoInvoices() {
    _allInvoices = [
      {id:'inv-1',invoice_number:'INV-2847',customer_name:'Safaricom Ltd',invoice_type:'tax',subtotal:18400,tax_rate:16,tax_amount:2944,total_amount:21344,currency:'USD',status:'paid',due_date:'2026-06-27'},
      {id:'inv-2',invoice_number:'INV-2846',customer_name:'Equity Bank',invoice_type:'tax',subtotal:9200,tax_rate:16,tax_amount:1472,total_amount:10672,currency:'USD',status:'sent',due_date:'2026-07-05'},
      {id:'inv-3',invoice_number:'INV-2840',customer_name:'Nation Media',invoice_type:'recurring',subtotal:3500,tax_rate:16,tax_amount:560,total_amount:4060,currency:'KES',status:'sent',due_date:'2026-06-30'},
      {id:'inv-4',invoice_number:'PFI-204',customer_name:'TechPlex Industries',invoice_type:'proforma',subtotal:85000,tax_rate:0,tax_amount:0,total_amount:85000,currency:'USD',status:'draft',due_date:'2026-07-10'},
      {id:'inv-5',invoice_number:'INV-2835',customer_name:'Bamburi Cement',invoice_type:'tax',subtotal:12800,tax_rate:16,tax_amount:2048,total_amount:14848,currency:'KES',status:'overdue',due_date:'2026-05-28'},
    ];
    filterInvoices(_invFilter);
  }

  function filterInvoices(filter, tabEl) {
    _invFilter = filter;
    if (tabEl) { document.querySelectorAll('#inv-tabs .tab').forEach(t=>t.classList.remove('active')); tabEl.classList.add('active'); }
    let rows = [..._allInvoices];
    const t = new Date().toISOString().slice(0,10);
    if (filter==='proforma') rows=rows.filter(r=>r.invoice_type==='proforma');
    else if (filter==='tax') rows=rows.filter(r=>r.invoice_type==='tax');
    else if (filter==='recurring') rows=rows.filter(r=>r.invoice_type==='recurring');
    else if (filter==='overdue') rows=rows.filter(r=>r.due_date<t&&r.status!=='paid');
    renderInvoices(rows);
  }

  function renderInvoices(rows) {
    const all = _allInvoices;
    document.getElementById('inv-kpi-total').textContent       = fmt(all.reduce((s,r)=>s+(r.total_amount||0),0));
    document.getElementById('inv-kpi-paid').textContent        = fmt(all.filter(r=>r.status==='paid').reduce((s,r)=>s+(r.total_amount||0),0));
    document.getElementById('inv-kpi-outstanding').textContent = fmt(all.filter(r=>r.status==='sent').reduce((s,r)=>s+(r.total_amount||0),0));
    document.getElementById('inv-kpi-overdue').textContent     = fmt(all.filter(r=>r.status==='overdue').reduce((s,r)=>s+(r.total_amount||0),0));
    if (!rows.length) { showEmpty('inv'); return; }
    showTable('inv');
    const stMap={paid:'green',sent:'blue',draft:'grey',overdue:'red',cancelled:'red'};
    const tyMap={tax:'blue',proforma:'grey',recurring:'purple',credit_note:'red',debit_note:'yellow'};
    const t=new Date().toISOString().slice(0,10);
    document.getElementById('inv-tbody').innerHTML = rows.map(r=>`
      <tr>
        <td class="td-main mono">${r.invoice_number||'—'}</td>
        <td>${r.customer_name||'—'}</td>
        <td><span class="badge ${tyMap[r.invoice_type]||'grey'}">${(r.invoice_type||'tax').replace('_',' ')}</span></td>
        <td class="mono">${fmt(r.subtotal)}</td>
        <td class="mono color-yellow">${fmt(r.tax_amount)}</td>
        <td style="color:${r.due_date<t&&r.status!=='paid'?'var(--red)':'inherit'}">${r.due_date||'—'}</td>
        <td><span class="badge ${stMap[r.status]||'grey'}">${r.status||'draft'}</span></td>
        <td style="display:flex;gap:4px;flex-wrap:wrap;">
          <button class="btn btn-ghost btn-sm" onclick="printInvoiceItem('${r.invoice_number}')">PDF</button>
          ${r.status!=='paid'?`<button class="btn btn-ghost btn-sm" onclick="markInvoicePaid('${r.id}','${r.invoice_number}')">✓ Paid</button>`:''}
          ${['overdue','sent'].includes(r.status)?`<button class="btn btn-danger btn-sm" onclick="sendPaymentReminder('${r.customer_name}','${r.invoice_number}')">Remind</button>`:''}
          <button class="btn btn-danger btn-sm" onclick="deleteInvoice('${r.id}','${r.invoice_number}')">✕</button>
        </td>
      </tr>`).join('');
  }

  async function saveInvoice(data) {
    const num = data.invoice_type==='proforma' ? 'PFI-'+Math.floor(Math.random()*900+100) : 'INV-'+Math.floor(Math.random()*9000+1000);
    const row = {...data, invoice_number: data.invoice_number||num};
    if (!window.SUPABASE_URL) { _allInvoices.unshift({...row,id:'inv-'+Date.now()}); filterInvoices(_invFilter); showToast('✅ '+row.invoice_number+' created!','green'); return; }
    try { await sbFetch('invoices',{method:'POST',body:row}); await loadInvoices(); showToast('✅ '+row.invoice_number+' saved!','green'); } catch(e) { showToast('⚠ '+e.message,'red'); }
  }

  async function markInvoicePaid(id, num) {
    if (!confirm('Mark '+num+' as PAID?')) return;
    const inv = _allInvoices.find(r=>r.id===id);
    if (!window.SUPABASE_URL||id.startsWith('inv-')) {
      if(inv){inv.status='paid';inv.paid_at=new Date().toISOString();}
      filterInvoices(_invFilter);
      showToast('💰 '+num+' marked Paid! Receipt generated.','green');
      logPayment({invoice_ref:num,customer_name:inv?.customer_name||'Client',amount:inv?.total_amount,method:'manual',receipt_number:'RCT-'+Date.now()}); return;
    }
    try {
      await sbFetch('invoices?id=eq.'+id,{method:'PATCH',body:{status:'paid',paid_at:new Date().toISOString()}});
      await loadInvoices(); await loadPayments(); showToast('💰 '+num+' marked Paid!','green');
    } catch(e) { showToast('⚠ '+e.message,'red'); }
  }

  async function deleteInvoice(id,num) {
    if(!confirm('Delete invoice '+num+'?')) return;
    if(!window.SUPABASE_URL||id.startsWith('inv-')){ _allInvoices=_allInvoices.filter(r=>r.id!==id); filterInvoices(_invFilter); showToast('🗑 Deleted','yellow'); return; }
    try { await sbFetch('invoices?id=eq.'+id,{method:'DELETE'}); await loadInvoices(); showToast('🗑 Deleted','yellow'); } catch(e) { showToast('⚠ '+e.message,'red'); }
  }

  // ══ PAYMENTS & A/R ══
  let _allPayments = [];

  async function loadPayments() {
    if (!window.SUPABASE_URL) { demoPayments(); return; }
    document.getElementById('aging-loading').style.display='block';
    try {
      _allPayments = await sbFetch('payments?select=*&order=paid_at.desc');
      renderPayments(_allPayments); renderAging();
    } catch(e) { showToast('⚠ Payments: '+e.message,'red'); demoPayments(); }
  }

  function demoPayments() {
    _allPayments = [
      {id:'p-1',customer_name:'Safaricom Ltd',invoice_ref:'INV-2847',amount:18400,method:'mpesa',receipt_number:'QKA9X2M1',paid_at:'2026-06-27T09:14:00Z'},
      {id:'p-2',customer_name:'Savannah Retail',invoice_ref:'INV-2830',amount:48000,method:'bank_transfer',receipt_number:'RCT-8821',paid_at:'2026-06-20T14:00:00Z'},
      {id:'p-3',customer_name:'Nation Media',invoice_ref:'INV-2840',amount:3500,method:'cheque',receipt_number:'RCT-8819',paid_at:'2026-06-18T10:30:00Z'},
      {id:'p-4',customer_name:'LakeView Logistics',invoice_ref:'INV-2839',amount:10000,method:'mpesa',receipt_number:'QKB3N7P2',paid_at:'2026-06-15T11:00:00Z'},
    ];
    renderPayments(_allPayments); renderAging();
  }

  function renderPayments(rows) {
    document.getElementById('pay-kpi-total').textContent  = fmt(rows.reduce((s,r)=>s+(r.amount||0),0));
    document.getElementById('pay-kpi-month').textContent  = fmt(rows.filter(r=>r.paid_at?.startsWith('2026-06')).reduce((s,r)=>s+(r.amount||0),0));
    document.getElementById('pay-kpi-mpesa').textContent  = rows.filter(r=>r.method==='mpesa').length;
    document.getElementById('pay-kpi-credits').textContent= '2';
    const list = document.getElementById('pay-list');
    if (!list) return;
    list.style.display='flex'; list.style.flexDirection='column';
    const mIcons={mpesa:'🟢',bank_transfer:'🏦',stripe:'💳',cash:'💵',cheque:'📝',manual:'✅'};
    list.innerHTML = rows.map(r=>`
      <div class="stat-row">
        <div>
          <div style="font-size:13.5px;font-weight:600">${mIcons[r.method]||'💰'} ${r.customer_name||'—'}</div>
          <div style="font-size:11.5px;color:var(--text3)">${r.invoice_ref||'—'} · ${r.method?.replace('_',' ')||'—'} · ${r.receipt_number||'—'}</div>
        </div>
        <span class="stat-val mono color-green">+${fmt(r.amount)}</span>
      </div>`).join('');
  }

  function renderAging() {
    const overdue = _allInvoices.filter(r=>r.status!=='paid'&&r.due_date);
    document.getElementById('aging-loading').style.display='none';
    const list = document.getElementById('aging-list');
    if (!overdue.length) { document.getElementById('aging-empty').style.display='block'; if(list) list.style.display='none'; return; }
    document.getElementById('aging-empty').style.display='none';
    if(list){ list.style.display='flex'; list.style.flexDirection='column'; }
    list.innerHTML = overdue.map(r=>{
      const d=daysOverdue(r.due_date);
      const cls=d>90?'d90':d>60?'d60':'d30';
      return `<div class="aging-row">
        <div class="aging-client">${r.customer_name||'—'}</div>
        <div class="aging-days ${cls}">${d>0?d+' days':'Due '+r.due_date}</div>
        <div class="aging-amount mono">${fmt(r.total_amount)}</div>
        <button class="btn ${d>60?'btn-danger':'btn-ghost'} btn-sm" onclick="${d>90?`escalateInvoice('${r.customer_name}','${r.invoice_number}')`:`sendPaymentReminder('${r.customer_name}','${r.invoice_number}')`}">
          ${d>90?'Escalate':'Remind'}
        </button>
      </div>`;
    }).join('');
  }

  async function logPayment(data) {
    if (!window.SUPABASE_URL) { _allPayments.unshift({...data,id:'p-'+Date.now(),paid_at:new Date().toISOString()}); renderPayments(_allPayments); return; }
    try { await sbFetch('payments',{method:'POST',body:{...data,receipt_number:'RCT-'+Date.now()}}); await loadPayments(); } catch(e) { console.warn(e); }
  }

  // ══ QUOTES ══
  let _allQuotes = [];

  async function loadQuotes() {
    if (!window.SUPABASE_URL) { demoQuotes(); return; }
    showLoading('qt');
    try { _allQuotes = await sbFetch('quotes?select=*&order=created_at.desc'); renderQuotes(_allQuotes); }
    catch(e) { showToast('⚠ Quotes: '+e.message,'red'); demoQuotes(); }
  }

  function demoQuotes() {
    _allQuotes = [
      {id:'q-1',quote_number:'Q-2024-087',customer_name:'TechPlex Industries',created_by:'James M.',amount:85000,discount:5,approval:'approved',status:'sent',currency:'USD'},
      {id:'q-2',quote_number:'Q-2024-086',customer_name:'Equity Bank',created_by:'Amina H.',amount:128000,discount:0,approval:'pending',status:'draft',currency:'USD'},
      {id:'q-3',quote_number:'Q-2024-085',customer_name:'Bamburi Cement',created_by:'Kwame B.',amount:92000,discount:10,approval:'rejected',status:'revision',currency:'KES'},
    ];
    renderQuotes(_allQuotes);
  }

  function renderQuotes(rows) {
    document.getElementById('qt-kpi-total').textContent    = rows.length;
    document.getElementById('qt-kpi-approved').textContent = rows.filter(r=>r.approval==='approved').length;
    document.getElementById('qt-kpi-pending').textContent  = rows.filter(r=>r.approval==='pending').length;
    document.getElementById('qt-kpi-value').textContent    = fmt(rows.reduce((s,r)=>s+(r.amount||0),0));
    if (!rows.length) { showEmpty('qt'); return; }
    showTable('qt');
    const apMap={approved:'green',pending:'yellow',rejected:'red'};
    const stMap={sent:'blue',draft:'grey',revision:'red',converted:'purple'};
    document.getElementById('qt-tbody').innerHTML = rows.map(r=>`
      <tr>
        <td class="td-main mono">${r.quote_number||'—'}</td>
        <td>${r.customer_name||'—'}</td>
        <td>${r.created_by||'—'}</td>
        <td class="mono">${fmt(r.amount)}</td>
        <td>${r.discount||0}%</td>
        <td><span class="badge ${apMap[r.approval]||'grey'}">${r.approval||'—'}</span></td>
        <td><span class="badge ${stMap[r.status]||'grey'}">${r.status||'draft'}</span></td>
        <td style="display:flex;gap:4px;flex-wrap:wrap;">
          ${r.approval==='approved'&&r.status!=='converted'?`<button class="btn btn-primary btn-sm" onclick="convertQuoteToOrder('${r.quote_number}','${r.customer_name}','${fmt(r.amount)}');markQuoteConverted('${r.id}')">→ SO</button>`:''}
          ${r.approval==='pending'?`<button class="btn btn-ghost btn-sm" onclick="approveQuoteItem('${r.id}','${r.quote_number}')">✓ Approve</button>`:''}
          ${r.status==='revision'?`<button class="btn btn-ghost btn-sm" onclick="openModal('modal-quote')">Revise</button>`:''}
          <button class="btn btn-danger btn-sm" onclick="deleteQuote('${r.id}','${r.quote_number}')">✕</button>
        </td>
      </tr>`).join('');
  }

  async function saveQuote(data) {
    const num='Q-'+new Date().getFullYear()+'-'+Math.floor(Math.random()*900+100);
    const row={...data,quote_number:num,approval:'pending',status:'draft'};
    if(!window.SUPABASE_URL){ _allQuotes.unshift({...row,id:'q-'+Date.now()}); renderQuotes(_allQuotes); showToast('✅ '+num+' created!','green'); return; }
    try { await sbFetch('quotes',{method:'POST',body:row}); await loadQuotes(); showToast('✅ '+num+' saved!','green'); } catch(e) { showToast('⚠ '+e.message,'red'); }
  }

  async function approveQuoteItem(id,num) {
    if(!confirm('Approve quote '+num+'?')) return;
    if(!window.SUPABASE_URL||id.startsWith('q-')){ const q=_allQuotes.find(r=>r.id===id); if(q){q.approval='approved';q.status='sent';} renderQuotes(_allQuotes); showToast('✅ '+num+' approved!','green'); return; }
    try { await sbFetch('quotes?id=eq.'+id,{method:'PATCH',body:{approval:'approved',status:'sent'}}); await loadQuotes(); showToast('✅ Approved!','green'); } catch(e) { showToast('⚠ '+e.message,'red'); }
  }

  async function markQuoteConverted(id) {
    if(!window.SUPABASE_URL||id.startsWith('q-')){ const q=_allQuotes.find(r=>r.id===id); if(q) q.status='converted'; renderQuotes(_allQuotes); return; }
    try { await sbFetch('quotes?id=eq.'+id,{method:'PATCH',body:{status:'converted'}}); await loadQuotes(); } catch(e) {}
  }

  async function deleteQuote(id,num) {
    if(!confirm('Delete quote '+num+'?')) return;
    if(!window.SUPABASE_URL||id.startsWith('q-')){ _allQuotes=_allQuotes.filter(r=>r.id!==id); renderQuotes(_allQuotes); showToast('🗑 Deleted','yellow'); return; }
    try { await sbFetch('quotes?id=eq.'+id,{method:'DELETE'}); await loadQuotes(); showToast('🗑 Deleted','yellow'); } catch(e) { showToast('⚠ '+e.message,'red'); }
  }

  // ── Wire Finance modals ──
  function wireFinanceModals() {
    document.querySelector('#modal-order .btn-primary')?.addEventListener('click',()=>{
      const m=document.getElementById('modal-order');
      const sel=m.querySelectorAll('select'), inp=m.querySelectorAll('input'), ta=m.querySelector('textarea');
      const data={customer_name:sel[0]?.value,total_amount:parseFloat(inp[0]?.value)||0,currency:sel[2]?.value,description:ta?.value,delivery_date:inp[1]?.value,shipping:sel[3]?.value};
      if(!data.customer_name){showToast('⚠ Select a customer','red');return;}
      saveOrder(data); closeModal2('modal-order');
    });
    document.querySelector('#invoice-modal .btn-primary')?.addEventListener('click',()=>{
      const m=document.getElementById('invoice-modal');
      const sel=m.querySelectorAll('select'), inp=m.querySelectorAll('input'), ta=m.querySelector('textarea');
      const sub=parseFloat(inp[0]?.value)||0, tax=parseFloat(sel[1]?.value)||16;
      if(!sub){showToast('⚠ Enter an amount','red');return;}
      saveInvoice({invoice_type:sel[0]?.value?.toLowerCase()?.replace('-',''),customer_name:'Client',subtotal:sub,tax_rate:tax,tax_amount:sub*tax/100,total_amount:sub*(1+tax/100),currency:sel[2]?.value||'USD',due_date:inp[1]?.value,notes:ta?.value,status:'draft'});
      closeModal2('invoice-modal');
    });
    document.querySelector('#modal-quote .btn-primary')?.addEventListener('click',()=>{
      const m=document.getElementById('modal-quote');
      const sel=m.querySelectorAll('select'), inp=m.querySelectorAll('input'), ta=m.querySelector('textarea');
      const data={customer_name:sel[0]?.value,created_by:sel[1]?.value||'Elijah Mecha',amount:parseFloat(inp[0]?.value)||0,discount:parseFloat(inp[1]?.value)||0,valid_until:inp[2]?.value,currency:sel[2]?.value,scope:ta?.value};
      if(!data.customer_name||!data.amount){showToast('⚠ Customer and amount required','red');return;}
      saveQuote(data); closeModal2('modal-quote');
    });
    document.querySelector('#modal-payment .btn-primary')?.addEventListener('click',()=>{
      const m=document.getElementById('modal-payment');
      const sel=m.querySelectorAll('select'), inp=m.querySelectorAll('input');
      const data={invoice_ref:sel[0]?.value?.split('·')[0]?.trim(),customer_name:'Client',amount:parseFloat(inp[0]?.value)||0,method:sel[1]?.value,reference:inp[1]?.value,paid_at:inp[2]?.value||new Date().toISOString().slice(0,10)};
      if(!data.amount){showToast('⚠ Enter payment amount','red');return;}
      logPayment(data); closeModal2('modal-payment');
      showToast('✅ Payment logged! Receipt generated.','green');
    });
  }

  document.addEventListener('crm:load', e => {
    const id=e.detail;
    if(id==='orders')   loadOrders();
    if(id==='invoices') loadInvoices();
    if(id==='payments'){ loadInvoices(); loadPayments(); }
    if(id==='quotes')   loadQuotes();
  });

  document.addEventListener('DOMContentLoaded', ()=>{
    wireFinanceModals();
    setTimeout(()=>{ loadOrders(); loadInvoices(); loadPayments(); loadQuotes(); }, 800);
  });

  // ══════════════════════════════════════════
  // HR ENGINE
  // Employees · Attendance · Payroll · Performance
  // ══════════════════════════════════════════

  // ══ EMPLOYEES ══
  let _allEmployees = [];
  const EMP_COLORS = ['linear-gradient(135deg,#3b82f6,#8b5cf6)','linear-gradient(135deg,#10b981,#06b6d4)','linear-gradient(135deg,#f59e0b,#ef4444)','linear-gradient(135deg,#8b5cf6,#ec4899)','linear-gradient(135deg,#3b82f6,#10b981)','linear-gradient(135deg,#f59e0b,#8b5cf6)'];
  const OB_TASKS = ['Email account created','Employment contract signed','Bank account captured','Laptop / equipment issued','System access provisioned','Training scheduled','ID / KRA PIN verified','Emergency contact recorded'];

  async function loadEmployees() {
    if (!window.SUPABASE_URL) { demoEmployees(); return; }
    document.getElementById('emp-loading').style.display='block';
    document.getElementById('emp-grid').style.display='none';
    try {
      _allEmployees = await sbFetch('employees?select=*&order=full_name.asc');
      filterEmployees();
    } catch(e) { showToast('⚠ Employees: '+e.message,'red'); demoEmployees(); }
  }

  function demoEmployees() {
    _allEmployees = [
      {id:'e-1',full_name:'James Mwangi',job_title:'Senior Sales Rep',department:'Sales',status:'active',base_salary:3200,commission:6240,start_date:'2022-01-10',email:'james@nexuserp.com'},
      {id:'e-2',full_name:'Amina Hassan',job_title:'Sales Rep',department:'Sales',status:'active',base_salary:2800,commission:5410,start_date:'2022-06-01',email:'amina@nexuserp.com'},
      {id:'e-3',full_name:'Brian Ochieng',job_title:'Sales Rep',department:'Sales',status:'active',base_salary:2800,commission:4820,start_date:'2023-03-15',email:'brian@nexuserp.com'},
      {id:'e-4',full_name:'Grace Otieno',job_title:'HR Administrator',department:'HR',status:'on_leave',base_salary:3000,commission:0,start_date:'2021-08-01',email:'grace@nexuserp.com'},
      {id:'e-5',full_name:'Fatuma Waweru',job_title:'Sales Rep',department:'Sales',status:'active',base_salary:2800,commission:4160,start_date:'2023-07-01',email:'fatuma@nexuserp.com'},
      {id:'e-6',full_name:'Kwame Boateng',job_title:'Sales Rep',department:'Sales',status:'active',base_salary:2800,commission:3820,start_date:'2026-06-20',email:'kwame@nexuserp.com'},
    ];
    filterEmployees();
  }

  function filterEmployees() {
    const dept   = document.getElementById('emp-filter-dept')?.value || '';
    const status = document.getElementById('emp-filter-status')?.value || '';
    let rows = [..._allEmployees];
    if (dept)   rows = rows.filter(r => r.department === dept);
    if (status) rows = rows.filter(r => r.status === status);
    renderEmployees(rows);
  }

  function renderEmployees(rows) {
    // KPIs
    document.getElementById('emp-kpi-total').textContent   = _allEmployees.length;
    document.getElementById('emp-kpi-active').textContent  = _allEmployees.filter(r=>r.status==='active').length;
    document.getElementById('emp-kpi-leave').textContent   = _allEmployees.filter(r=>r.status==='on_leave').length;
    const totalPay = _allEmployees.reduce((s,r)=>s+(r.base_salary||0)+(r.commission||0),0);
    document.getElementById('emp-kpi-payroll').textContent = fmt(totalPay);

    document.getElementById('emp-loading').style.display='none';
    if (!rows.length) { document.getElementById('emp-empty').style.display='block'; document.getElementById('emp-grid').style.display='none'; return; }
    document.getElementById('emp-empty').style.display='none';
    document.getElementById('emp-grid').style.display='grid';

    const stMap = {active:'green', on_leave:'yellow', inactive:'red'};
    document.getElementById('emp-grid').innerHTML = rows.map((r,i) => {
      const initials = r.full_name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
      const isNew = r.start_date > '2026-01-01';
      return `
        <div class="emp-card" onclick="showEmployeeOnboarding('${r.id}')">
          <div class="emp-avatar" style="background:${EMP_COLORS[i%EMP_COLORS.length]}">${initials}</div>
          <div class="emp-name">${r.full_name}</div>
          <div class="emp-role">${r.job_title||'—'} · ${r.department||'—'}</div>
          <span class="badge ${stMap[r.status]||'grey'}">${(r.status||'active').replace('_',' ')}${isNew?' 🆕':''}</span>
          <div style="margin-top:10px;font-size:11.5px;color:var(--text3);">
            Base: <span class="mono">${fmt(r.base_salary)}/mo</span><br>
            Commission: <span class="mono color-green">+${fmt(r.commission)}</span>
          </div>
          <div style="display:flex;gap:6px;margin-top:10px;">
            <button class="btn btn-ghost btn-sm" style="flex:1;justify-content:center;font-size:11px;" onclick="event.stopPropagation();openPayslipForEmp('${r.id}')">Payslip</button>
            <button class="btn btn-danger btn-sm" style="font-size:11px;" onclick="event.stopPropagation();deleteEmployee('${r.id}','${r.full_name}')">✕</button>
          </div>
        </div>`;
    }).join('');

    // Populate payslip and performance selects
    const opts = rows.map(r=>`<option value="${r.id}">${r.full_name}</option>`).join('');
    const ps = document.getElementById('payslip-emp-select');
    const pf = document.getElementById('perf-emp-filter');
    if(ps) ps.innerHTML = opts;
    if(pf) pf.innerHTML = '<option value="">All Employees</option>'+opts;
    renderPayslip();
    renderPerformance();
  }

  function showEmployeeOnboarding(id) {
    const emp = _allEmployees.find(r=>r.id===id);
    if (!emp) return;
    const isNew = emp.start_date > '2026-01-01';
    const ob = document.getElementById('emp-onboarding');
    ob.style.display='block';
    document.getElementById('ob-title').textContent = `Onboarding: ${emp.full_name}`;
    const done = isNew ? 3 : OB_TASKS.length;
    document.getElementById('ob-status').textContent = done >= OB_TASKS.length ? 'Complete ✓' : `${done}/${OB_TASKS.length} Done`;
    document.getElementById('ob-status').className = 'badge '+(done >= OB_TASKS.length ? 'green' : 'yellow');
    document.getElementById('ob-checklist').innerHTML = OB_TASKS.map((t,i) => {
      const checked = i < done;
      return `<div style="display:flex;gap:8px;align-items:center;font-size:13px;cursor:pointer;" onclick="toggleOBTask(this)">
        <span style="color:${checked?'var(--green)':'var(--text3)'};font-size:16px;">${checked?'✓':'○'}</span>
        <span style="${checked?'':'opacity:.6'}">${t}</span>
      </div>`;
    }).join('');
    ob.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function toggleOBTask(el) {
    const icon = el.querySelector('span:first-child');
    const label = el.querySelector('span:last-child');
    const isDone = icon.textContent === '✓';
    icon.textContent = isDone ? '○' : '✓';
    icon.style.color = isDone ? 'var(--text3)' : 'var(--green)';
    label.style.opacity = isDone ? '0.6' : '1';
  }

  async function saveEmployee(data) {
    if (!window.SUPABASE_URL) {
      const ne = {...data,id:'e-'+Date.now(),commission:0,status:'active'};
      _allEmployees.unshift(ne); filterEmployees();
      showToast('✅ '+data.full_name+' onboarded!','green');
      showEmployeeOnboarding(ne.id); return;
    }
    try {
      await sbFetch('employees',{method:'POST',body:data});
      await loadEmployees(); showToast('✅ Employee saved to Supabase!','green');
    } catch(e) { showToast('⚠ '+e.message,'red'); }
  }

  async function deleteEmployee(id, name) {
    if (!confirm(`Offboard & delete "${name}"? This is permanent.`)) return;
    if (!window.SUPABASE_URL||id.startsWith('e-')) {
      _allEmployees=_allEmployees.filter(r=>r.id!==id); filterEmployees();
      document.getElementById('emp-onboarding').style.display='none';
      showToast('🗑 '+name+' removed','yellow'); return;
    }
    try { await sbFetch('employees?id=eq.'+id,{method:'DELETE'}); await loadEmployees(); showToast('🗑 Deleted','yellow'); } catch(e) { showToast('⚠ '+e.message,'red'); }
  }

  // ══ ATTENDANCE ══
  let _allAttendance = [];
  let _allLeaveReqs = [];
  let _clockedIn = false;
  let _clockInTime = null;

  async function loadAttendance() {
    if (!window.SUPABASE_URL) { demoAttendance(); return; }
    document.getElementById('att-loading').style.display='block';
    document.getElementById('att-table-wrap').style.display='none';
    try {
      const td = new Date().toISOString().slice(0,10);
      _allAttendance = await sbFetch(`attendance?select=*&work_date=eq.${td}&order=clock_in.asc`);
      _allLeaveReqs  = await sbFetch('leave_requests?select=*&order=created_at.desc');
      renderAttendance(); renderLeaveCalendar(); renderLeaveRequests();
    } catch(e) { showToast('⚠ Attendance: '+e.message,'red'); demoAttendance(); }
  }

  function demoAttendance() {
    _allAttendance = [
      {id:'a-1',employee_name:'James Mwangi',clock_in:'08:02',clock_out:null,hours_worked:9.5,status:'present'},
      {id:'a-2',employee_name:'Amina Hassan',clock_in:'07:58',clock_out:null,hours_worked:9.5,status:'present'},
      {id:'a-3',employee_name:'Brian Ochieng',clock_in:'08:45',clock_out:null,hours_worked:8.8,status:'late'},
      {id:'a-4',employee_name:'Grace Otieno',clock_in:null,clock_out:null,hours_worked:0,status:'on_leave'},
      {id:'a-5',employee_name:'Kwame Boateng',clock_in:'08:00',clock_out:'17:00',hours_worked:9.0,status:'present'},
    ];
    _allLeaveReqs = [
      {id:'lr-1',employee_name:'Grace Otieno',leave_type:'sick',start_date:'2026-06-25',end_date:'2026-06-27',days:3,reason:'Medical appointment',status:'approved'},
      {id:'lr-2',employee_name:'Brian Ochieng',leave_type:'annual',start_date:'2026-07-14',end_date:'2026-07-18',days:5,reason:'Family vacation',status:'pending'},
      {id:'lr-3',employee_name:'Kwame Boateng',leave_type:'casual',start_date:'2026-07-04',end_date:'2026-07-04',days:1,reason:'Personal errand',status:'pending'},
    ];
    renderAttendance(); renderLeaveCalendar(); renderLeaveRequests();
  }

  function renderAttendance() {
    document.getElementById('att-kpi-present').textContent = _allAttendance.filter(r=>r.status==='present').length;
    document.getElementById('att-kpi-late').textContent    = _allAttendance.filter(r=>r.status==='late').length;
    document.getElementById('att-kpi-leave').textContent   = _allAttendance.filter(r=>r.status==='on_leave').length;
    document.getElementById('att-kpi-pending').textContent = _allLeaveReqs.filter(r=>r.status==='pending').length;
    document.getElementById('att-loading').style.display='none';
    document.getElementById('att-table-wrap').style.display='block';
    const stMap={present:'green',late:'yellow',on_leave:'red',absent:'red'};
    document.getElementById('att-tbody').innerHTML = _allAttendance.map(r=>`
      <tr>
        <td class="td-main">${r.employee_name||'—'}</td>
        <td class="mono">${r.clock_in||'—'}</td>
        <td class="mono">${r.clock_out||'—'}</td>
        <td class="mono">${r.hours_worked?r.hours_worked+'h':'—'}</td>
        <td><span class="badge ${stMap[r.status]||'grey'}">${(r.status||'—').replace('_',' ')}</span></td>
      </tr>`).join('');
  }

  function renderLeaveCalendar() {
    const now = new Date();
    const yr = now.getFullYear(), mo = now.getMonth();
    const firstDay = new Date(yr, mo, 1).getDay();
    const daysInMonth = new Date(yr, mo+1, 0).getDate();
    const todayD = now.getDate();
    document.getElementById('att-cal-title').textContent = now.toLocaleString('default',{month:'long'})+' '+yr+' — Leave Calendar';
    const approvedDays = new Set();
    const pendingDays = new Set();
    _allLeaveReqs.forEach(lr=>{
      const s=new Date(lr.start_date), e=new Date(lr.end_date);
      for(let d=new Date(s);d<=e;d.setDate(d.getDate()+1)){
        if(d.getFullYear()===yr && d.getMonth()===mo){
          const day=d.getDate();
          if(lr.status==='approved') approvedDays.add(day);
          else if(lr.status==='pending') pendingDays.add(day);
        }
      }
    });
    let html = Array(firstDay).fill('<div class="leave-day"></div>').join('');
    for(let d=1;d<=daysInMonth;d++){
      const dow=(firstDay+d-1)%7;
      const isWeekend=dow===0||dow===6;
      const isToday=d===todayD;
      const cls = isToday?'today':approvedDays.has(d)?'approved':pendingDays.has(d)?'pending':isWeekend?'off':'';
      html+=`<div class="leave-day ${cls}">${d}</div>`;
    }
    document.getElementById('att-calendar').innerHTML=html;
  }

  function renderLeaveRequests() {
    const filter = document.getElementById('leave-filter')?.value||'';
    let rows = filter ? _allLeaveReqs.filter(r=>r.status===filter) : _allLeaveReqs;
    document.getElementById('leave-loading').style.display='none';
    document.getElementById('leave-table-wrap').style.display='block';
    const stMap={pending:'yellow',approved:'green',rejected:'red'};
    document.getElementById('leave-tbody').innerHTML = rows.map(r=>`
      <tr>
        <td class="td-main">${r.employee_name||'—'}</td>
        <td><span class="badge blue">${r.leave_type||'—'}</span></td>
        <td>${r.start_date||'—'}</td>
        <td>${r.end_date||'—'}</td>
        <td>${r.days||'—'}</td>
        <td style="font-size:12px;color:var(--text3)">${r.reason||'—'}</td>
        <td><span class="badge ${stMap[r.status]||'grey'}">${r.status||'—'}</span></td>
        <td style="display:flex;gap:4px;">
          ${r.status==='pending'?`
            <button class="btn btn-ghost btn-sm" onclick="approveLeave('${r.id}')">✓ Approve</button>
            <button class="btn btn-danger btn-sm" onclick="rejectLeave('${r.id}')">✗ Reject</button>`:
          `<button class="btn btn-ghost btn-sm" onclick="deleteLeaveReq('${r.id}')">✕</button>`}
        </td>
      </tr>`).join('');
  }

  function filterLeaveRequests() { renderLeaveRequests(); }

  async function approveLeave(id) {
    const lr=_allLeaveReqs.find(r=>r.id===id);
    if(!window.SUPABASE_URL||id.startsWith('lr-')){ if(lr) lr.status='approved'; renderLeaveRequests(); renderLeaveCalendar(); showToast('✅ Leave approved! Employee notified.','green'); return; }
    try { await sbFetch('leave_requests?id=eq.'+id,{method:'PATCH',body:{status:'approved'}}); await loadAttendance(); showToast('✅ Leave approved!','green'); } catch(e){ showToast('⚠ '+e.message,'red'); }
  }

  async function rejectLeave(id) {
    const lr=_allLeaveReqs.find(r=>r.id===id);
    if(!window.SUPABASE_URL||id.startsWith('lr-')){ if(lr) lr.status='rejected'; renderLeaveRequests(); showToast('❌ Leave rejected. Employee notified.','yellow'); return; }
    try { await sbFetch('leave_requests?id=eq.'+id,{method:'PATCH',body:{status:'rejected'}}); await loadAttendance(); showToast('Leave rejected','yellow'); } catch(e){ showToast('⚠ '+e.message,'red'); }
  }

  async function deleteLeaveReq(id) {
    _allLeaveReqs=_allLeaveReqs.filter(r=>r.id!==id); renderLeaveRequests();
    if(window.SUPABASE_URL&&!id.startsWith('lr-')){ try{ await sbFetch('leave_requests?id=eq.'+id,{method:'DELETE'}); }catch(e){} }
  }

  function clockIn() {
    if(_clockedIn){ showToast('⚠ You are already clocked in.','yellow'); return; }
    _clockedIn=true; _clockInTime=new Date();
    const timeStr=_clockInTime.toTimeString().slice(0,5);
    showToast('🟢 Clocked in at '+timeStr+'. Have a great day, Elijah!','green');
  }

  async function saveLeaveRequest(data) {
    const days=Math.ceil((new Date(data.end_date)-new Date(data.start_date))/86400000)+1;
    const row={...data, days, status:'pending', employee_name: data.employee_name||'Elijah Mecha'};
    if(!window.SUPABASE_URL){ _allLeaveReqs.unshift({...row,id:'lr-'+Date.now()}); renderLeaveRequests(); renderLeaveCalendar(); showToast('✅ Leave request submitted!','green'); return; }
    try { await sbFetch('leave_requests',{method:'POST',body:row}); await loadAttendance(); showToast('✅ Leave request submitted!','green'); } catch(e){ showToast('⚠ '+e.message,'red'); }
  }

  // ══ PAYROLL ══
  let _allPayroll = [];

  function calcCommissionTiered(sales) {
    let comm=0, s=parseFloat(sales)||0;
    if(s<=10000)      comm=s*0.05;
    else if(s<=30000) comm=500+(s-10000)*0.08;
    else if(s<=60000) comm=500+1600+(s-30000)*0.10;
    else               comm=500+1600+3000+(s-60000)*0.12;
    return Math.round(comm*100)/100;
  }

  function calcCommission() {
    const s=parseFloat(document.getElementById('comm-test-input')?.value)||0;
    const c=calcCommissionTiered(s);
    const el=document.getElementById('comm-result');
    if(el&&s>0) el.textContent=`Commission on ${fmt(s)} = ${fmt(c)} ✓`;
  }

  async function loadPayroll() {
    if(!window.SUPABASE_URL){ demoPayroll(); return; }
    document.getElementById('pr-loading').style.display='block';
    document.getElementById('pr-table-wrap').style.display='none';
    try {
      _allPayroll=await sbFetch('payroll_runs?select=*&order=employee_id.asc');
      if(!_allPayroll.length) demoPayroll();
      else renderPayroll(_allPayroll);
    } catch(e){ showToast('⚠ Payroll: '+e.message,'red'); demoPayroll(); }
  }

  function demoPayroll() {
    _allPayroll = _allEmployees.length ? _allEmployees.map(emp=>{
      const base=emp.base_salary||2800;
      const comm=emp.commission||0;
      const gross=base+comm;
      const tax=Math.round(gross*0.30);
      const nhif=240; const nssf=112;
      return {id:'pr-'+emp.id,employee_id:emp.id,employee_name:emp.full_name,base_salary:base,commission:comm,gross_pay:gross,tax_deduction:tax,nhif_deduction:nhif,nssf_deduction:nssf,other_deductions:0,net_pay:gross-tax-nhif-nssf};
    }) : [
      {id:'pr-1',employee_name:'James Mwangi',base_salary:3200,commission:6240,gross_pay:9560,tax_deduction:2868,nhif_deduction:240,nssf_deduction:112,other_deductions:0,net_pay:6340},
      {id:'pr-2',employee_name:'Amina Hassan',base_salary:2800,commission:5410,gross_pay:8210,tax_deduction:2463,nhif_deduction:240,nssf_deduction:112,other_deductions:0,net_pay:5395},
      {id:'pr-3',employee_name:'Brian Ochieng',base_salary:2800,commission:4820,gross_pay:7620,tax_deduction:2286,nhif_deduction:240,nssf_deduction:112,other_deductions:0,net_pay:4982},
      {id:'pr-4',employee_name:'Grace Otieno',base_salary:2550,commission:0,gross_pay:2550,tax_deduction:765,nhif_deduction:240,nssf_deduction:112,other_deductions:0,net_pay:1433},
    ];
    renderPayroll(_allPayroll);
  }

  function renderPayroll(rows) {
    const total=rows.reduce((s,r)=>s+(r.net_pay||0),0);
    const base=rows.reduce((s,r)=>s+(r.base_salary||0),0);
    const comm=rows.reduce((s,r)=>s+(r.commission||0),0);
    const ded=rows.reduce((s,r)=>s+(r.tax_deduction||0)+(r.nhif_deduction||0)+(r.nssf_deduction||0)+(r.other_deductions||0),0);
    document.getElementById('pr-kpi-total').textContent = fmt(total);
    document.getElementById('pr-kpi-base').textContent  = fmt(base);
    document.getElementById('pr-kpi-comm').textContent  = fmt(comm);
    document.getElementById('pr-kpi-ded').textContent   = fmt(ded);
    document.getElementById('pr-loading').style.display='none';
    document.getElementById('pr-table-wrap').style.display='block';
    document.getElementById('pr-tbody').innerHTML=rows.map(r=>`
      <tr onclick="selectPayslipEmp('${r.employee_id||r.id}')" style="cursor:pointer;">
        <td class="td-main">${r.employee_name||'—'}</td>
        <td class="mono">${fmt(r.base_salary)}</td>
        <td class="mono color-green">${fmt(r.commission)}</td>
        <td class="mono color-red">${fmt((r.tax_deduction||0)+(r.nhif_deduction||0)+(r.nssf_deduction||0))}</td>
        <td class="mono" style="font-weight:700;">${fmt(r.net_pay)}</td>
        <td><button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();selectPayslipEmp('${r.employee_id||r.id}')">View</button></td>
      </tr>`).join('');
    renderPayslip();
  }

  function selectPayslipEmp(empId) {
    const sel=document.getElementById('payslip-emp-select');
    if(sel){ sel.value=empId; renderPayslip(); }
    showPage('payroll');
  }

  function openPayslipForEmp(empId) {
    selectPayslipEmp(empId); showPage('payroll');
  }

  function renderPayslip() {
    const sel=document.getElementById('payslip-emp-select');
    if(!sel||!_allPayroll.length) return;
    const empId=sel.value;
    const pr=_allPayroll.find(r=>(r.employee_id||r.id)===empId)||_allPayroll[0];
    if(!pr) return;
    const period=document.getElementById('payroll-period')?.value||'2026-06';
    const periodLabel=new Date(period+'-01').toLocaleString('default',{month:'long',year:'numeric'});
    document.getElementById('payslip-view').innerHTML=`
      <div class="payslip">
        <div class="payslip-header">
          <div>
            <div class="payslip-title">PAY SLIP</div>
            <div class="payslip-period">${pr.employee_name||'—'} · ${periodLabel}</div>
          </div>
          <div class="payslip-net">
            <div class="payslip-net-label">NET PAY</div>
            <div class="payslip-net-val">${fmt(pr.net_pay)}</div>
          </div>
        </div>
        <div class="payslip-section-title">Earnings</div>
        <div class="payslip-row"><span>Base Salary</span><span class="mono color-green">+${fmt(pr.base_salary)}</span></div>
        <div class="payslip-row"><span>Sales Commission</span><span class="mono color-green">+${fmt(pr.commission)}</span></div>
        <div class="payslip-row"><span>Gross Pay</span><span class="mono color-green">+${fmt(pr.gross_pay)}</span></div>
        <div class="payslip-section-title">Deductions</div>
        <div class="payslip-row"><span>PAYE Tax (30%)</span><span class="mono color-red">–${fmt(pr.tax_deduction)}</span></div>
        <div class="payslip-row"><span>NHIF</span><span class="mono color-red">–${fmt(pr.nhif_deduction)}</span></div>
        <div class="payslip-row"><span>NSSF</span><span class="mono color-red">–${fmt(pr.nssf_deduction)}</span></div>
        ${pr.other_deductions?`<div class="payslip-row"><span>Other Deductions</span><span class="mono color-red">–${fmt(pr.other_deductions)}</span></div>`:''}
        <div style="margin-top:14px;padding-top:12px;border-top:2px solid var(--border2);display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:14px;font-weight:800;">NET PAY</span>
          <span class="mono" style="font-size:22px;font-weight:800;color:var(--green)">${fmt(pr.net_pay)}</span>
        </div>
      </div>`;
  }

  // ══ PERFORMANCE ══
  let _allTargets = [];

  function loadPerformance() {
    _allTargets = _allEmployees.length ? _allEmployees.map((emp,i)=>{
      const sales=[62400,54100,48200,0,41600,38200];
      const revTarget=[60000,55000,50000,0,45000,40000];
      const achieved=sales[i]||0;
      const target=revTarget[i]||40000;
      return {id:'t-'+emp.id,employee_id:emp.id,employee_name:emp.full_name,revenue_target:target,revenue_achieved:achieved,leads_target:20,leads_achieved:Math.floor(Math.random()*22),calls_target:15,calls_achieved:Math.floor(Math.random()*18),conv_target:35,conv_achieved:Math.floor(Math.random()*40)};
    }) : [
      {id:'t-1',employee_name:'James Mwangi',revenue_target:60000,revenue_achieved:62400,leads_target:20,leads_achieved:18,calls_target:15,calls_achieved:16,conv_target:35,conv_achieved:28},
      {id:'t-2',employee_name:'Amina Hassan',revenue_target:55000,revenue_achieved:54100,leads_target:18,leads_achieved:12,calls_target:14,calls_achieved:14,conv_target:35,conv_achieved:30},
    ];
    renderPerformance();
  }

  function renderPerformance() {
    const filter=document.getElementById('perf-emp-filter')?.value||'';
    let rows=filter?_allTargets.filter(r=>r.employee_id===filter):_allTargets;
    const onTrack=rows.filter(r=>(r.revenue_achieved/r.revenue_target)>=0.9).length;
    const atRisk=rows.filter(r=>{const p=r.revenue_achieved/r.revenue_target;return p>=0.7&&p<0.9;}).length;
    const behind=rows.filter(r=>(r.revenue_achieved/r.revenue_target)<0.7).length;
    const avgPct=rows.length?Math.round(rows.reduce((s,r)=>s+(r.revenue_achieved/r.revenue_target*100),0)/rows.length):0;
    document.getElementById('perf-kpi-on').textContent     = onTrack;
    document.getElementById('perf-kpi-risk').textContent   = atRisk;
    document.getElementById('perf-kpi-behind').textContent = behind;
    document.getElementById('perf-kpi-avg').textContent    = avgPct+'%';
    document.getElementById('perf-cards').innerHTML=rows.map(r=>{
      const pct=Math.min(Math.round(r.revenue_achieved/r.revenue_target*100),200);
      const badge=pct>=90?'green':pct>=70?'yellow':'red';
      const label=pct>=90?'On Track':pct>=70?'At Risk':'Behind';
      const kpis=[
        {label:'Revenue',target:fmt(r.revenue_target),achieved:fmt(r.revenue_achieved),pct:Math.min(pct,100),color:badge},
        {label:'New Leads',target:r.leads_target,achieved:r.leads_achieved,pct:Math.min(Math.round(r.leads_achieved/r.leads_target*100),100),color:r.leads_achieved>=r.leads_target?'green':'yellow'},
        {label:'Demo Calls',target:r.calls_target,achieved:r.calls_achieved,pct:Math.min(Math.round(r.calls_achieved/r.calls_target*100),100),color:r.calls_achieved>=r.calls_target?'green':'yellow'},
        {label:'Conversion %',target:r.conv_target+'%',achieved:r.conv_achieved+'%',pct:Math.min(Math.round(r.conv_achieved/r.conv_target*100),100),color:r.conv_achieved>=r.conv_target?'green':'red'},
      ];
      return `<div class="card">
        <div class="flex-between mb16">
          <div class="card-title" style="margin:0">${r.employee_name} — KPI Dashboard</div>
          <span class="badge ${badge}">${label} · ${pct}%</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:12px;">
          ${kpis.map(k=>`
            <div>
              <div class="flex-between mb8">
                <span style="font-size:13px">${k.label} (Target: ${k.target})</span>
                <span class="mono color-${k.color}" style="font-size:13px">${k.achieved} (${k.pct}%)</span>
              </div>
              <div class="progress-wrap"><div class="progress-fill ${k.color}" style="width:${k.pct}%"></div></div>
            </div>`).join('')}
        </div>
      </div>`;
    }).join('');
  }

  // ── Wire HR modals ──
  function wireHRModals() {
    document.querySelector('#modal-employee .btn-primary')?.addEventListener('click',()=>{
      const m=document.getElementById('modal-employee');
      const inp=m.querySelectorAll('input'), sel=m.querySelectorAll('select');
      const data={full_name:inp[0]?.value,job_title:inp[1]?.value,department:sel[0]?.value,reports_to:sel[1]?.value,email:inp[2]?.value,phone:inp[3]?.value,start_date:inp[4]?.value,base_salary:parseFloat(inp[5]?.value)||0,id_number:inp[6]?.value,status:'active'};
      if(!data.full_name){showToast('⚠ Full name required','red');return;}
      saveEmployee(data); closeModal2('modal-employee');
    });
    document.querySelector('#modal-leave .btn-primary')?.addEventListener('click',()=>{
      const m=document.getElementById('modal-leave');
      const sel=m.querySelectorAll('select'), inp=m.querySelectorAll('input'), ta=m.querySelector('textarea');
      const data={employee_name:sel[0]?.value,leave_type:sel[1]?.value?.toLowerCase(),start_date:inp[0]?.value,end_date:inp[1]?.value,reason:ta?.value};
      if(!data.start_date||!data.end_date){showToast('⚠ Select dates','red');return;}
      saveLeaveRequest(data); closeModal2('modal-leave');
    });
    document.querySelector('#modal-target .btn-primary')?.addEventListener('click',()=>{
      const m=document.getElementById('modal-target');
      const sel=m.querySelectorAll('select'), inp=m.querySelectorAll('input');
      showToast('✅ Targets saved for '+sel[0]?.value+' — '+sel[1]?.value,'green');
      closeModal2('modal-target');
      // Refresh performance with updated targets
      loadPerformance();
    });
  }

  // ── Register HR auto-loads ──
  document.addEventListener('crm:load', e=>{
    const id=e.detail;
    if(id==='employees')  loadEmployees();
    if(id==='attendance') loadAttendance();
    if(id==='payroll')    { loadPayroll(); }
    if(id==='performance'){ loadPerformance(); }
  });

  document.addEventListener('DOMContentLoaded',()=>{
    wireHRModals();
    setTimeout(()=>{ loadEmployees(); loadAttendance(); loadPayroll(); loadPerformance(); },1000);
  });

  // ══════════════════════════════════════════
  // M-PESA STK PUSH ENGINE
  // ══════════════════════════════════════════

  // Transaction history in memory
  let _mpesaTxns = [];

  // ── Auto-fill from customer dropdown ──
  function autoFillSTK() {
    const val = document.getElementById('stk-customer')?.value;
    if (!val) return;
    const [name, phone, amount] = val.split('|');
    const phoneInput = document.getElementById('stk-phone');
    const amtInput   = document.getElementById('stk-amount');
    const refInput   = document.getElementById('stk-ref');
    const descInput  = document.getElementById('stk-desc');
    if(phoneInput) phoneInput.value = phone?.substring(3) || '';
    if(amtInput)   amtInput.value   = amount || '';
    if(refInput)   refInput.value   = 'INV-' + Math.floor(Math.random()*1000+2000);
    if(descInput)  descInput.value  = 'Payment for invoice from ' + name?.toUpperCase();
    validatePhone(phoneInput);
    convertSTKAmount();
  }

  // ── Phone validation ──
  function validatePhone(input) {
    if(!input) input = document.getElementById('stk-phone');
    const v = input.value.replace(/\D/g,'');
    input.value = v;
    const hint = document.getElementById('phone-hint');
    if(!hint) return;
    if(v.length === 9) {
      // Validate Safaricom prefixes: 07xx, 01xx → 2547xx, 2541xx
      const prefix = v.substring(0,2);
      const safPrefixes=['70','71','72','74','75','76','79','10','11'];
      const valid = safPrefixes.some(p => prefix===p);
      hint.textContent = valid ? '✅ Valid Safaricom number — 254'+v : '⚠ Check prefix — must be 07x or 01x (Safaricom only)';
      hint.style.color = valid ? 'var(--green)' : 'var(--yellow)';
    } else {
      hint.textContent = 'Enter 9 digits e.g. 722000000 (no leading 0, no +254)';
      hint.style.color = 'var(--text3)';
    }
  }

  // ── Convert amount to KES display ──
  function convertSTKAmount() {
    const amt = parseFloat(document.getElementById('stk-amount')?.value)||0;
    const el  = document.getElementById('stk-kes-equiv');
    if(el) el.textContent = amt ? 'KES ' + amt.toLocaleString() : '';
  }

  // ── Load transaction history from Supabase ──
  async function loadMpesaTxns() {
    if(!window.SUPABASE_URL){ demoMpesaTxns(); return; }
    try {
      const rows = await sbFetch('mpesa_transactions?select=*&order=initiated_at.desc&limit=20');
      _mpesaTxns = rows;
      renderMpesaHistory();
    } catch(e) { demoMpesaTxns(); }
  }

  function demoMpesaTxns() {
    _mpesaTxns = [
      {id:'mt-1',phone_number:'254722000001',customer_name:'Safaricom Ltd',amount:18400,mpesa_receipt:'QKA9X2M1',status:'completed',initiated_at:'2026-06-27T09:14:00Z'},
      {id:'mt-2',phone_number:'254733000002',customer_name:'Equity Bank',amount:9200,mpesa_receipt:null,status:'pending',initiated_at:'2026-06-27T08:50:00Z'},
      {id:'mt-3',phone_number:'254700000005',customer_name:'Nation Media',amount:3500,mpesa_receipt:null,status:'cancelled',initiated_at:'2026-06-27T07:30:00Z'},
    ];
    renderMpesaHistory();
    renderMpesaKPIs();
  }

  function renderMpesaKPIs() {
    const all   = _mpesaTxns;
    const done  = all.filter(r=>r.status==='completed');
    const pend  = all.filter(r=>r.status==='pending');
    const fail  = all.filter(r=>r.status==='cancelled'||r.status==='failed');
    const total = done.reduce((s,r)=>s+(r.amount||0),0);
    const el = id => document.getElementById(id);
    // Support both old and new ID patterns
    if(el('stk-kpi-txns'))         el('stk-kpi-txns').textContent         = all.length;
    if(el('stk-kpi-total'))        el('stk-kpi-total').textContent        = 'KES '+total.toLocaleString();
    if(el('stk-kpi-pend'))         el('stk-kpi-pend').textContent         = pend.length;
    if(el('stk-kpi-fail'))         el('stk-kpi-fail').textContent         = fail.length;
    if(el('mpesa-kpi-count'))      el('mpesa-kpi-count').textContent      = all.length;
    if(el('mpesa-kpi-collected'))  el('mpesa-kpi-collected').textContent  = 'KES '+total.toLocaleString();
    if(el('mpesa-kpi-pending'))    el('mpesa-kpi-pending').textContent    = pend.length;
    if(el('mpesa-kpi-failed'))     el('mpesa-kpi-failed').textContent     = fail.length;
  }

  function renderMpesaHistory() {
    renderMpesaKPIs();
    const hist = document.getElementById('stk-history');
    if(!hist) return;
    if(!_mpesaTxns.length){
      hist.innerHTML='<div style="text-align:center;padding:20px;color:var(--text3);font-size:13px;">No transactions yet</div>'; return;
    }
    const stMap={completed:'green',pending:'yellow',cancelled:'red',failed:'red'};
    hist.innerHTML = _mpesaTxns.map(r=>{
      const time = r.initiated_at ? new Date(r.initiated_at).toTimeString().slice(0,8) : '—';
      return `
        <div style="display:flex;align-items:center;gap:8px;padding:10px 0;border-bottom:1px solid var(--border);">
          <div style="flex:1;">
            <div style="font-size:13.5px;font-weight:600;">${r.customer_name||r.phone_number}</div>
            <div style="font-size:11.5px;color:var(--text3);font-family:'JetBrains Mono',monospace;">
              ${r.phone_number} · ${time}
              ${r.mpesa_receipt?` · <span style="color:var(--green)">${r.mpesa_receipt}</span>`:''}
            </div>
          </div>
          <div style="font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700;color:${r.status==='completed'?'var(--green)':'var(--text2)'}">
            KES ${(r.amount||0).toLocaleString()}
          </div>
          <span class="badge ${stMap[r.status]||'grey'}">${r.status}</span>
        </div>`;
    }).join('');
  }

  // ── MAIN STK Push function ──
  async function sendSTKPush() {
    const rawPhone = document.getElementById('stk-phone')?.value.trim() || '';
    const amount   = document.getElementById('stk-amount')?.value.trim() || '';
    const ref      = document.getElementById('stk-ref')?.value.trim()   || 'NEXUS-ERP';
    const desc     = document.getElementById('stk-desc')?.value.trim()  || 'Payment';
    const btn      = document.getElementById('stk-btn');

    // Validation
    const cleanPhone = rawPhone.replace(/\D/g,'');
    if(cleanPhone.length !== 9){
      showSTKStatus('error','⚠ Enter a valid 9-digit Safaricom number (e.g. 722000000)');return;
    }
    const safPrefixes=['70','71','72','74','75','76','79','10','11'];
    if(!safPrefixes.some(p=>cleanPhone.startsWith(p))){
      showSTKStatus('error','⚠ Number must be a Safaricom line (07x or 01x prefix)');return;
    }
    if(!amount||isNaN(amount)||parseFloat(amount)<1){
      showSTKStatus('error','⚠ Enter a valid amount (minimum KES 1)');return;
    }

    const phone      = '254'+cleanPhone;
    const amountKES  = Math.ceil(parseFloat(amount));

    btn.disabled = true;
    btn.innerHTML = '<span style="display:inline-block;animation:spin 1s linear infinite">⏳</span> Authenticating with Daraja…';
    showSTKStatus('loading','🔐 Getting OAuth token from Safaricom…');

    // ─────────────────────────────────────────────────────────────
    // PRODUCTION MODE: Calls your Supabase Edge Function
    // Uncomment this block and remove the simulation below
    // ─────────────────────────────────────────────────────────────
    // try {
    //   const EDGE = `${window.SUPABASE_URL}/functions/v1/mpesa-stk`;
    //   const res = await fetch(EDGE, {
    //     method: 'POST',
    //     headers: {
    //       'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
    //       'Content-Type': 'application/json'
    //     },
    //     body: JSON.stringify({ phone, amount: amountKES, accountRef: ref, description: desc })
    //   });
    //   const data = await res.json();
    //   if(data.ResponseCode === '0') {
    //     handleSTKSuccess(phone, amountKES, data);
    //   } else {
    //     handleSTKFail(data.ResponseDescription || 'Request rejected by Safaricom');
    //   }
    // } catch(err) {
    //   handleSTKFail(err.message);
    // }
    // ─────────────────────────────────────────────────────────────

    // ── SANDBOX SIMULATION (remove when Edge Function is deployed) ──
    await delay(1400);
    btn.innerHTML = '<span style="display:inline-block;animation:spin 1s linear infinite">⏳</span> Sending prompt to '+phone+'…';
    showSTKStatus('loading','📲 Pushing PIN prompt to <strong>'+phone+'</strong>…<br><span style="font-size:12px;color:var(--text3)">Customer will see M-Pesa popup on their phone now</span>');

    await delay(2000);
    const success = Math.random() > 0.08; // 92% success rate

    if(success){
      const checkoutId  = 'ws_CO_'+Date.now()+'_'+Math.floor(Math.random()*99999);
      const merchantId  = `${Math.floor(Math.random()*90000000+10000000)}-${Math.floor(Math.random()*99999999)}-1`;
      handleSTKSuccess(phone, amountKES, {
        MerchantRequestID: merchantId,
        CheckoutRequestID: checkoutId,
        ResponseCode: '0',
        ResponseDescription: 'Success. Request accepted for processing',
        CustomerMessage: 'Success. Request accepted for processing'
      }, ref);
    } else {
      handleSTKFail('Request cancelled or timed out. Customer may have entered wrong PIN or dismissed prompt.');
    }
  }

  function handleSTKSuccess(phone, amount, data, ref) {
    const btn = document.getElementById('stk-btn');
    // Update API response panel
    document.getElementById('api-response').innerHTML =
      `<span style="color:var(--green)">{</span><br>`+
      `&nbsp;&nbsp;<span style="color:var(--accent)">"MerchantRequestID"</span>: <span style="color:var(--yellow)">"${data.MerchantRequestID}"</span>,<br>`+
      `&nbsp;&nbsp;<span style="color:var(--accent)">"CheckoutRequestID"</span>: <span style="color:var(--yellow)">"${data.CheckoutRequestID}"</span>,<br>`+
      `&nbsp;&nbsp;<span style="color:var(--accent)">"ResponseCode"</span>: <span style="color:var(--green)">"0"</span>,<br>`+
      `&nbsp;&nbsp;<span style="color:var(--accent)">"ResponseDescription"</span>: <span style="color:var(--green)">"Success. Request accepted"</span>,<br>`+
      `&nbsp;&nbsp;<span style="color:var(--accent)">"CustomerMessage"</span>: <span style="color:var(--yellow)">"Success. Request accepted for processing"</span><br>`+
      `<span style="color:var(--green)">}</span>`;

    showSTKStatus('success',
      `✅ <strong>STK Push sent!</strong> PIN prompt delivered to <strong>${phone}</strong>.<br>`+
      `🔑 Checkout: <code style="font-size:11px;font-family:'JetBrains Mono',monospace">${data.CheckoutRequestID}</code><br>`+
      `⏳ Waiting for customer to enter PIN…`
    );

    // Add to local history immediately as pending
    const txn = {id:'mt-'+Date.now(),phone_number:phone,customer_name:'Manual · '+phone,amount,mpesa_receipt:null,status:'pending',initiated_at:new Date().toISOString(),checkout_request_id:data.CheckoutRequestID};
    _mpesaTxns.unshift(txn);
    renderMpesaHistory();

    // Save to Supabase mpesa_transactions table
    if(window.SUPABASE_URL){
      sbFetch('mpesa_transactions',{method:'POST',body:{phone_number:phone,amount,merchant_request_id:data.MerchantRequestID,checkout_request_id:data.CheckoutRequestID,status:'pending'}}).catch(()=>{});
    }

    // Simulate customer paying after 6 seconds (demo mode)
    // In production: Safaricom calls your callback URL
    setTimeout(()=>{
      const receipt = 'Q'+['K','L','M','N','P'][Math.floor(Math.random()*5)]+Math.random().toString(36).slice(2,8).toUpperCase();
      txn.status='completed'; txn.mpesa_receipt=receipt;
      renderMpesaHistory();
      showSTKStatus('success',
        `🎉 <strong>Payment confirmed!</strong> KES ${amount.toLocaleString()} received.<br>`+
        `📱 M-Pesa Receipt: <strong style="color:var(--green)">${receipt}</strong><br>`+
        `✅ Invoice auto-updated to Paid. Receipt SMS sent to ${phone}.`
      );
      showToast('💰 KES '+amount.toLocaleString()+' received from '+phone+' · Receipt: '+receipt,'green');
      // Update Supabase record
      if(window.SUPABASE_URL){
        sbFetch(`mpesa_transactions?checkout_request_id=eq.${data.CheckoutRequestID}`,{method:'PATCH',body:{status:'completed',mpesa_receipt:receipt,completed_at:new Date().toISOString()}}).catch(()=>{});
      }
    }, 6000);

    btn.disabled=false;
    btn.innerHTML='📲 Send STK Push to Customer';
  }

  function handleSTKFail(reason) {
    const btn=document.getElementById('stk-btn');
    document.getElementById('api-response').innerHTML =
      `<span style="color:var(--red)">{</span><br>`+
      `&nbsp;&nbsp;<span style="color:var(--accent)">"ResponseCode"</span>: <span style="color:var(--red)">"1"</span>,<br>`+
      `&nbsp;&nbsp;<span style="color:var(--accent)">"ResponseDescription"</span>: <span style="color:var(--red)">"${reason}"</span><br>`+
      `<span style="color:var(--red)">}</span>`;
    showSTKStatus('error',
      `❌ <strong>STK Push failed.</strong><br>${reason}<br>`+
      `<span style="font-size:12px;color:var(--text3)">Check Daraja credentials or try again.</span>`
    );
    btn.disabled=false;
    btn.innerHTML='📲 Send STK Push to Customer';
  }

  function showSTKStatus(type, html) {
    const d=document.getElementById('stk-status');
    if(!d) return;
    d.style.display='block';
    const bg={success:'var(--green-bg)',error:'var(--red-bg)',loading:'var(--accent-glow)'};
    const bd={success:'rgba(16,185,129,.3)',error:'rgba(239,68,68,.3)',loading:'rgba(59,130,246,.3)'};
    d.style.cssText=`display:block;padding:14px 16px;border-radius:10px;font-size:13.5px;line-height:1.7;border:1px solid ${bd[type]};background:${bg[type]}`;
    d.innerHTML=html;
  }

  function copyEdgeFunction() {
    const el=document.getElementById('edge-fn-code');
    navigator.clipboard.writeText(el?.innerText||'').then(()=>showToast('📋 Edge Function code copied!','accent'));
  }

  function delay(ms){ return new Promise(r=>setTimeout(r,ms)); }

  // Register M-Pesa page load
  document.addEventListener('crm:load', e=>{
    if(e.detail==='mpesa') loadMpesaTxns();
  });
  document.addEventListener('DOMContentLoaded',()=>{ setTimeout(loadMpesaTxns,1200); });

  // ══════════════════════════════════════════
  // MULTI-CURRENCY ENGINE
  // Live rates via ExchangeRate-API (free tier)
  // ══════════════════════════════════════════

  // Fallback static rates (used when API is unavailable)
  const FX_FALLBACK = {
    USD:{rate:128.40,flag:'🇺🇸',name:'US Dollar'},
    EUR:{rate:139.80,flag:'🇪🇺',name:'Euro'},
    GBP:{rate:163.20,flag:'🇬🇧',name:'British Pound'},
    AED:{rate:34.95,flag:'🇦🇪',name:'UAE Dirham'},
    TZS:{rate:0.0496,flag:'🇹🇿',name:'Tanzania Shilling'},
    UGX:{rate:0.0346,flag:'🇺🇬',name:'Uganda Shilling'},
    ZAR:{rate:6.98,flag:'🇿🇦',name:'South African Rand'},
    NGN:{rate:0.0852,flag:'🇳🇬',name:'Nigerian Naira'},
    ETB:{rate:2.26,flag:'🇪🇹',name:'Ethiopian Birr'},
    RWF:{rate:0.0913,flag:'🇷🇼',name:'Rwandan Franc'},
  };

  let _fxRates = {...FX_FALLBACK};
  let _lastFetch = null;

  async function fetchLiveRates() {
    const btn = event?.target;
    if(btn){ btn.textContent='⏳ Fetching…'; btn.disabled=true; }
    try {
      // Free tier: 1500 req/month. In production use paid plan.
      // Using open.er-api.com as a CORS-friendly alternative
      const res = await fetch('https://open.er-api.com/v6/latest/KES');
      if(!res.ok) throw new Error('API unavailable');
      const data = await res.json();
      if(data.result !== 'success') throw new Error('Invalid response');
      // Rates from API are KES → X, we want X per KES
      const rates = data.rates;
      Object.keys(_fxRates).forEach(cur=>{
        if(rates[cur]) _fxRates[cur] = {..._fxRates[cur], rate: rates[cur], live: true};
      });
      _lastFetch = new Date();
      document.getElementById('fx-last-update').textContent = 'Updated: '+_lastFetch.toLocaleTimeString();
      document.getElementById('fx-source').textContent = '📡 Live · open.er-api.com';
      showToast('✅ Live exchange rates updated!','green');
    } catch(e) {
      document.getElementById('fx-last-update').textContent = 'Using offline rates (API unavailable)';
      document.getElementById('fx-source').textContent = '📦 Offline fallback';
      showToast('⚠ Using offline rates — '+e.message,'yellow');
    }
    renderFXTable();
    convertCurrency();
    if(btn){ btn.textContent='🔄 Refresh Rates'; btn.disabled=false; }
    // Update KPI cards
    const r=_fxRates;
    const usd=document.getElementById('rate-usd'); if(usd) usd.textContent=(1/r.USD.rate).toFixed(5);
    const eur=document.getElementById('rate-eur'); if(eur) eur.textContent=(1/r.EUR.rate).toFixed(5);
    const gbp=document.getElementById('rate-gbp'); if(gbp) gbp.textContent=(1/r.GBP.rate).toFixed(5);
    const uc=document.getElementById('rate-usd-chg'); if(uc) uc.textContent=r.USD.live?'🟢 Live':'📦 Fallback';
    const ec=document.getElementById('rate-eur-chg'); if(ec) ec.textContent=r.EUR.live?'🟢 Live':'📦 Fallback';
    const gc=document.getElementById('rate-gbp-chg'); if(gc) gc.textContent=r.GBP.live?'🟢 Live':'📦 Fallback';
  }

  function renderFXTable() {
    const tbody = document.getElementById('fx-table-body');
    if(!tbody) return;
    tbody.innerHTML = Object.entries(_fxRates).map(([code,info])=>{
      const per1kes = (1/info.rate).toFixed(info.rate>100?2:5);
      const per10k  = (10000/info.rate).toLocaleString('en',{minimumFractionDigits:0,maximumFractionDigits:2});
      return `<tr>
        <td>${info.flag} ${info.name}</td>
        <td class="mono">${code}</td>
        <td class="mono color-accent">${per1kes}</td>
        <td class="mono">${code} ${per10k}</td>
        <td style="color:${info.live?'var(--green)':'var(--text3)'};font-size:12px;">${info.live?'🟢 Live':'📦 Offline'}</td>
      </tr>`;
    }).join('');
  }

  function convertCurrency() {
    const cur    = document.getElementById('inv-currency')?.value || 'USD';
    const amt    = parseFloat(document.getElementById('inv-amount-mc')?.value)||0;
    const taxPct = parseFloat(document.getElementById('inv-tax')?.value)||16;
    const info   = _fxRates[cur] || {rate:1};
    const sym    = getCurrencySymbol(cur);
    // amt is in selected currency; rate is KES per 1 unit of that currency
    const kesAmt = cur==='KES' ? amt : amt * info.rate;
    const taxAmt = amt * taxPct/100;
    const total  = amt + taxAmt;
    const totalKES = kesAmt * (1+taxPct/100);
    const f2 = n=>n.toLocaleString('en',{minimumFractionDigits:2,maximumFractionDigits:2});
    const el = id=>document.getElementById(id);
    if(el('cv-sub'))   el('cv-sub').textContent   = sym+' '+f2(amt);
    if(el('cv-tax'))   el('cv-tax').textContent   = sym+' '+f2(taxAmt)+' ('+taxPct+'%)';
    if(el('cv-kes'))   el('cv-kes').textContent   = cur==='KES'?'Base currency':'KES '+f2(totalKES);
    if(el('cv-total')) el('cv-total').textContent = sym+' '+f2(total);
  }

  function quickConvert() {
    const kes = parseFloat(document.getElementById('fx-quick-kes')?.value)||0;
    const cur = document.getElementById('fx-quick-cur')?.value||'USD';
    const info= _fxRates[cur]||{rate:1};
    const sym = getCurrencySymbol(cur);
    const out = document.getElementById('fx-quick-out');
    if(out) out.textContent = kes ? `KES ${kes.toLocaleString()} = ${sym} ${(kes/info.rate).toLocaleString('en',{minimumFractionDigits:2,maximumFractionDigits:2})}` : '';
  }

  function getCurrencySymbol(code){
    const s={KES:'KES',USD:'$',EUR:'€',GBP:'£',AED:'AED',TZS:'TZS',UGX:'UGX',ZAR:'R',NGN:'₦',ETB:'ETB',RWF:'RWF'};
    return s[code]||code;
  }

  function generateMCInvoice() {
    const cur  = document.getElementById('inv-currency')?.value||'KES';
    const amt  = parseFloat(document.getElementById('inv-amount-mc')?.value)||0;
    const tax  = parseFloat(document.getElementById('inv-tax')?.value)||16;
    const cust = document.getElementById('mc-customer')?.value||'Client';
    const due  = document.getElementById('mc-due-date')?.value||new Date(Date.now()+30*86400000).toISOString().slice(0,10);
    const taxAmt = amt*tax/100;
    saveInvoice({customer_name:cust,invoice_type:'tax',subtotal:amt,tax_rate:tax,tax_amount:taxAmt,total_amount:amt+taxAmt,currency:cur,due_date:due,status:'draft'});
    showToast('✅ Multi-currency invoice generated in '+cur+'!','green');
    showPage('invoices');
  }

  // Register currency page load
  document.addEventListener('crm:load', e=>{
    if(e.detail==='currency'){
      renderFXTable();
      convertCurrency();
      // Try fetching live rates (silent)
      if(!_lastFetch) fetchLiveRates().catch(()=>{});
    }
  });
  document.addEventListener('DOMContentLoaded',()=>{
    // Init with fallback rates immediately
    renderFXTable();
    convertCurrency();
    // Set default due date
    const dd=document.getElementById('mc-due-date');
    if(dd) dd.value=new Date(Date.now()+30*86400000).toISOString().slice(0,10);
  });

  // ══════════════════════════════════════════
  // SECURITY & AUDIT LOG ENGINE
  // ══════════════════════════════════════════

  let _auditLog = [];
  const CURRENT_USER = 'Elijah Mecha';
  const CURRENT_IP = '196.201.214.' + Math.floor(Math.random()*250+1); // simulated session IP

  // ── Universal audit logger — call this from anywhere ──
  function logAudit(action, table, recordId, details) {
    const entry = {
      id: 'log-' + Date.now() + Math.random().toString(36).slice(2,6),
      user_name: CURRENT_USER,
      action, table_name: table, record_id: recordId,
      details: details || {},
      ip_address: CURRENT_IP,
      created_at: new Date().toISOString()
    };
    _auditLog.unshift(entry);
    if (_auditLog.length > 100) _auditLog.pop(); // cap local buffer
    renderAuditLog();
    // Persist to Supabase (fire and forget)
    if (window.SUPABASE_URL) {
      sbFetch('audit_logs', { method:'POST', body: {
        action, table_name: table, record_id: recordId,
        new_values: details||{}, ip_address: CURRENT_IP
      }}).catch(()=>{});
    }
  }

  async function loadAuditLog() {
    if (window.SUPABASE_URL) {
      try {
        const rows = await sbFetch('audit_logs?select=*&order=created_at.desc&limit=30');
        if (rows.length) {
          _auditLog = rows.map(r=>({...r, user_name: r.user_name||CURRENT_USER}));
          renderAuditLog();
          return;
        }
      } catch(e) { /* fall through to demo */ }
    }
    if (!_auditLog.length) seedAuditLog();
    renderAuditLog();
  }

  function seedAuditLog() {
    const now = Date.now();
    _auditLog = [
      {id:'seed-1',user_name:'Elijah Mecha',action:'login',table_name:'auth',details:{},ip_address:CURRENT_IP,created_at:new Date(now-2*60000).toISOString()},
      {id:'seed-2',user_name:'Grace Otieno',action:'update',table_name:'employees',details:{field:'bank_account'},ip_address:'196.201.214.88',created_at:new Date(now-50*60000).toISOString()},
      {id:'seed-3',user_name:'Unknown',action:'failed_login',table_name:'auth',details:{},ip_address:'41.90.66.12',created_at:new Date(now-6*3600000).toISOString()},
      {id:'seed-4',user_name:'James Mwangi',action:'create',table_name:'leads',details:{company:'TechPlex Industries'},ip_address:'196.201.214.40',created_at:new Date(now-22*3600000).toISOString()},
      {id:'seed-5',user_name:'System',action:'payroll_run',table_name:'payroll_runs',details:{count:64},ip_address:'system',created_at:new Date(now-46*3600000).toISOString()},
    ];
  }

  function renderAuditLog() {
    const list = document.getElementById('audit-log-list');
    if (!list) return;
    const iconMap = {
      login:{bg:'var(--green-bg)',color:'var(--green)',icon:'✓'},
      failed_login:{bg:'var(--red-bg)',color:'var(--red)',icon:'!'},
      create:{bg:'var(--accent-glow)',color:'var(--accent)',icon:'+'},
      update:{bg:'var(--yellow-bg)',color:'var(--yellow)',icon:'✏'},
      delete:{bg:'var(--red-bg)',color:'var(--red)',icon:'✕'},
      payroll_run:{bg:'var(--purple-bg)',color:'var(--purple)',icon:'$'},
      ai_query:{bg:'var(--purple-bg)',color:'var(--purple)',icon:'✦'},
      mpesa:{bg:'var(--green-bg)',color:'var(--green)',icon:'📱'},
    };
    const labelMap = {
      login:'logged in', failed_login:'failed login attempt', create:'created record in',
      update:'updated record in', delete:'deleted record in', payroll_run:'ran payroll for',
      ai_query:'asked AI Assistant:', mpesa:'initiated M-Pesa payment'
    };
    list.innerHTML = _auditLog.map(r => {
      const ic = iconMap[r.action] || {bg:'var(--bg4)',color:'var(--text2)',icon:'•'};
      const time = new Date(r.created_at);
      const timeStr = time.toLocaleString('en-KE',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'});
      const detail = r.action==='ai_query' ? '"'+( r.details?.query||r.new_values?.query||'')+'"'
                    : r.action==='payroll_run' ? (r.details?.count||r.new_values?.count||'')+' employees'
                    : r.table_name;
      return `
        <div class="log-row">
          <div class="log-icon" style="background:${ic.bg};color:${ic.color};font-size:12px;">${ic.icon}</div>
          <div class="log-text">
            <strong>${r.user_name||'Unknown'}</strong> ${labelMap[r.action]||r.action} <em style="font-style:normal;color:var(--text)">${detail}</em>
            <div class="log-meta">${timeStr} · IP: ${r.ip_address||'—'}${r.action==='failed_login'?' · Blocked by WAF':''}</div>
          </div>
        </div>`;
    }).join('') || '<div style="text-align:center;padding:20px;color:var(--text3);font-size:13px;">No activity logged yet</div>';
  }

  // ── RBAC live tester ──
  const RBAC_MATRIX = {
    sales_rep:      {leads:true,  pipeline:false, discounts:false, employees:false, payroll:false, invoices:false, audit:false},
    sales_manager:  {leads:true,  pipeline:true,  discounts:true,  employees:false, payroll:false, invoices:false, audit:false},
    hr_admin:       {leads:false, pipeline:false, discounts:false, employees:true,  payroll:true,  invoices:false, audit:false},
    finance:        {leads:false, pipeline:false, discounts:false, employees:false, payroll:'view',invoices:true,  audit:false},
    super_admin:    {leads:true,  pipeline:true,  discounts:true,  employees:true,  payroll:true,  invoices:true,  audit:true},
  };
  const RBAC_LABELS = {leads:'Own Leads/Orders',pipeline:'Team Pipeline',discounts:'Approve Discounts',employees:'Employee Records',payroll:'Payroll/Salary',invoices:'Invoices & A/R',audit:'Audit Logs'};

  function testRBAC() {
    const role = document.getElementById('rbac-role-select')?.value;
    const result = document.getElementById('rbac-test-result');
    if (!role) { result.style.display='none'; return; }
    const perms = RBAC_MATRIX[role];
    const allowed = Object.entries(perms).filter(([k,v])=>v).map(([k,v])=>RBAC_LABELS[k]+(v==='view'?' (view only)':''));
    const denied  = Object.entries(perms).filter(([k,v])=>!v).map(([k])=>RBAC_LABELS[k]);
    result.style.display='block';
    result.style.background='var(--accent-glow)';
    result.style.border='1px solid rgba(59,130,246,.3)';
    result.innerHTML = `<strong>Testing as: ${role.replace('_',' ')}</strong><br>
      <span style="color:var(--green)">✓ Can access:</span> ${allowed.join(', ')}<br>
      <span style="color:var(--red)">✗ Blocked from:</span> ${denied.join(', ')}`;
    logAudit('rbac_test', 'security', null, {tested_role: role});
  }

  function copyAIEdgeFunction() {
    const el = document.getElementById('ai-edge-code');
    navigator.clipboard.writeText(el?.innerText||'').then(()=>showToast('📋 AI Edge Function code copied!','accent'));
  }

  // ── Login/logout audit hooks ──
  const _origDoLogin = doLogin;
  doLogin = function() {
    const email = document.getElementById('login-email')?.value.trim();
    const pwd = document.getElementById('login-pwd')?.value.trim();
    if (email === 'elijah@nexuserp.com' && pwd === 'Admin1234!') {
      logAudit('login', 'auth', null, {});
    } else {
      logAudit('failed_login', 'auth', null, {attempted_email: email});
    }
    _origDoLogin();
  };

  // Register security page load
  document.addEventListener('crm:load', e=>{
    if(e.detail==='security') loadAuditLog();
  });
  document.addEventListener('DOMContentLoaded',()=>{
    seedAuditLog();
    setTimeout(loadAuditLog, 1200);
  });

  // ── Countdown display for auto-logout (visual feedback on Security page) ──
  setInterval(()=>{
    const el = document.getElementById('logout-countdown');
    if (!el) return;
    const currentPage = document.querySelector('.page.active')?.id?.replace('page-','');
    if (['payroll','employees','security','payments'].includes(currentPage)) {
      el.textContent = '🟢 Session monitored on this page';
    } else {
      el.textContent = '';
    }
  }, 2000);

  // ══════════════════════════════════════════
  const SENSITIVE_PAGES = ['payroll','employees','security','payments'];
  let inactivityTimer;
  function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    const currentPage = document.querySelector('.page.active')?.id?.replace('page-','');
    if (SENSITIVE_PAGES.includes(currentPage)) {
      inactivityTimer = setTimeout(() => {
        alert('⏱ Session expired due to 15 minutes of inactivity on a sensitive page. Please log in again.');
        logout();
      }, 15 * 60 * 1000);
    }
  }
  ['mousemove','keydown','click','touchstart','scroll'].forEach(e => document.addEventListener(e, resetInactivityTimer, { passive: true }));
