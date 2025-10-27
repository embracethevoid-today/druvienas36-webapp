const tg = window.Telegram?.WebApp; tg?.ready?.(); tg?.expand?.();

// ---------- i18n ----------
const L = {
  ru: {
    who_fallback: "гость",
    menu_results: "Результаты голосований",
    menu_docs: "Документы",
    menu_qa: "Вопросы / Ответы",
    menu_works: "Планируемые работы",
    entrance: "Подъезд",
    yes: "за",
    no: "против",
    updated: "обновлено",
    docs_open: "Открыть",
    ask_title: "Задать вопрос",
    ask_entrance: "Подъезд",
    ask_flat: "Квартира",
    ask_text: "Ваш вопрос",
    ask_submit: "Отправить",
    ask_limit: "Лимит: 2 вопроса в день. Попробуйте завтра.",
    ask_required: "Заполните все обязательные поля.",
    pending: "Ожидает ответа",
    answered: "Отвечено",
    works_header: "Раздел в разработке",
    works_text: "Under construction — come back later."
  },
  lv: {
    who_fallback: "viesis",
    menu_results: "Balsošanas rezultāti",
    menu_docs: "Dokumenti",
    menu_qa: "Jautājumi / Atbildes",
    menu_works: "Plānotie darbi",
    entrance: "Ieeja",
    yes: "par",
    no: "pret",
    updated: "atjaunināts",
    docs_open: "Atvērt",
    ask_title: "Uzdot jautājumu",
    ask_entrance: "Ieeja",
    ask_flat: "Dzīvoklis",
    ask_text: "Jautājums",
    ask_submit: "Nosūtīt",
    ask_limit: "Limits: 2 jautājumi dienā. Pamēģiniet rīt.",
    ask_required: "Aizpildiet obligātos laukus.",
    pending: "Gaida atbildi",
    answered: "Atbildēts",
    works_header: "Sadaļa izstrādē",
    works_text: "Under construction — come back later."
  }
};
let state = {
  lang: (tg?.initDataUnsafe?.user?.language_code || 'ru').toLowerCase().startsWith('lv') ? 'lv' : 'ru',
  page: 'results',
  votes: null,
  docs: null,
  userId: tg?.initDataUnsafe?.user?.id || 0,
};

const $ = (s, r=document)=>r.querySelector(s);
const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));

// header who
(function setWho(){
  const u = tg?.initDataUnsafe?.user;
  $('#who').textContent = u?.first_name || (u?.username ? '@'+u.username : L[state.lang].who_fallback);
})();

// lang buttons
$('#btnRU').onclick = ()=>{ state.lang='ru'; applyLang(); };
$('#btnLV').onclick = ()=>{ state.lang='lv'; applyLang(); };
function applyLang(){
  // toggle btns
  $('#btnRU').classList.toggle('active', state.lang==='ru');
  $('#btnLV').classList.toggle('active', state.lang==='lv');
  // menu labels
  $('[data-page="results"] span').textContent = L[state.lang].menu_results;
  $('[data-page="docs"] span').textContent    = L[state.lang].menu_docs;
  $('[data-page="qa"] span').textContent      = L[state.lang].menu_qa;
  $('[data-page="works"] span').textContent   = L[state.lang].menu_works;
  // re-render current page
  render(state.page);
}

// menu routing
$$('.menu-item').forEach(b=>{
  b.onclick = ()=>{
    $$('.menu-item').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    state.page = b.dataset.page;
    render(state.page);
    window.scrollTo({top:0,behavior:'smooth'});
  };
});
// default active
$('[data-page="results"]').classList.add('active');

// load data
Promise.all([
  fetch('./votes.json').then(r=>r.json()).catch(()=>null),
  fetch('./docs.json').then(r=>r.json()).catch(()=>[])
]).then(([votes, docs])=>{
  state.votes = votes;
  state.docs = docs;
  applyLang();
});

// main renderer
function render(page){
  const v = $('#view');
  v.innerHTML = '';
  if(page==='results') return renderResults(v);
  if(page==='docs')    return renderDocs(v);
  if(page==='qa')      return renderQA(v);
  if(page==='works')   return renderWorks(v);
}

// -------- Results ----------
function renderResults(root){
  const Lc = L[state.lang];
  if(!state.votes){ root.innerHTML = `<p class="muted">No data.</p>`; return; }

  const head = document.createElement('div');
  head.className='row';
  head.innerHTML = `<div class="muted">${Lc.updated}: ${new Date(state.votes.updated_at).toLocaleString()}</div>`;
  root.appendChild(head);

  const grid = document.createElement('div');
  grid.className='grid';
  root.appendChild(grid);

  // Expect entrances 1..5
  for(let i=1;i<=5;i++){
    const item = state.votes.entrances.find(e=>e.id===i) || {id:i,yes:0,no:0};
    const card = document.createElement('div');
    card.className='card';

    const thumb = document.createElement('div');
    thumb.className='thumb';
    const img = new Image();
    img.src = `./images/entrance${i}.png`;     // твои отдельные PNG
    img.onerror = ()=>{ img.src = './images/entrance.png'; };
    const title = document.createElement('h4');
    title.textContent = `${Lc.entrance} ${item.id}`;
    thumb.append(img, title);

    const row = document.createElement('div');
    row.className='row';
    row.innerHTML = `
      <span class="pill ok">✅ ${item.yes} ${Lc.yes}</span>
      <span class="pill bad">❌ ${item.no} ${Lc.no}</span>
    `;

    card.append(thumb, row);
    grid.appendChild(card);
  }
}

// -------- Docs ----------
function renderDocs(root){
  const Lc = L[state.lang];
  if(!Array.isArray(state.docs)){ root.innerHTML = `<p class="muted">No data.</p>`; return; }

  state.docs.forEach(d=>{
    const el = document.createElement('div'); el.className='doc';
    const title = document.createElement('div'); title.className='meta';
    title.innerHTML = `<strong>${d.title?.[state.lang] || d.title?.ru || '—'}</strong>
      <span class="muted">${d.type?.toUpperCase() || ''}</span>`;
    const a = document.createElement('a'); a.textContent = Lc.docs_open; a.target="_blank";
    a.href = d.url;
    el.append(title, a);
    root.appendChild(el);
  });
}

// -------- QA (localStorage stub) ----------
function renderQA(root){
  const Lc = L[state.lang];
  const form = document.createElement('form');
  form.className='form';
  form.innerHTML = `
    <h3 style="grid-column:1/-1;margin:0 0 6px 0">${Lc.ask_title}</h3>
    <label>${Lc.ask_entrance}
      <select name="entrance" required>
        <option value="">—</option>
        <option>1</option><option>2</option><option>3</option><option>4</option><option>5</option>
      </select>
    </label>
    <label>${Lc.ask_flat}
      <input name="flat" required placeholder="27" />
    </label>
    <label style="grid-column:1/-1">${Lc.ask_text}
      <textarea name="text" required maxlength="2000" placeholder=""></textarea>
    </label>
    <div class="actions">
      <button class="btn" type="submit">${Lc.ask_submit}</button>
    </div>
  `;
  root.appendChild(form);

  const list = document.createElement('div'); list.className='list';
  root.appendChild(list);

  // load existing
  const key = 'qa_items';
  const items = JSON.parse(localStorage.getItem(key)||'[]');
  renderQaList(items, list);

  form.onsubmit = (e)=>{
    e.preventDefault();
    const fd = new FormData(form);
    const entrance = fd.get('entrance')?.trim();
    const flat = fd.get('flat')?.trim();
    const text = fd.get('text')?.trim();
    if(!entrance || !flat || !text){ alert(Lc.ask_required); return; }

    // limit 2/day per user
    const uid = state.userId || 0;
    const dayKey = `qa:sent:${uid}:${new Date().toISOString().slice(0,10)}`;
    const count = +(localStorage.getItem(dayKey)||'0');
    if(count >= 2){ alert(Lc.ask_limit); return; }
    localStorage.setItem(dayKey, String(count+1));

    const item = {
      id: `q_${Date.now()}`,
      user_id: uid,
      entrance: +entrance,
      flat,
      text,
      status: 'pending',
      answer: null,
      created_at: new Date().toISOString()
    };
    items.unshift(item);
    localStorage.setItem(key, JSON.stringify(items));
    renderQaList(items, list);
    form.reset();
  };
}

function renderQaList(items, root){
  root.innerHTML = '';
  const Lc = L[state.lang];
  if(!items.length){ root.innerHTML = `<p class="muted">—</p>`; return; }
  items.forEach(x=>{
    const el = document.createElement('div'); el.className='qa';
    el.innerHTML = `
      <div class="tag">${L[state.lang].entrance} ${x.entrance} · kv. ${x.flat} · ${new Date(x.created_at).toLocaleString()}</div>
      <div style="margin:6px 0 8px 0">${escapeHtml(x.text)}</div>
      <div class="tag"><span class="status">${x.status==='answered'?'✅ '+Lc.answered:'⏳ '+Lc.pending}</span></div>
    `;
    root.appendChild(el);
  });
}

function escapeHtml(s){ return s.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

// -------- Works ----------
function renderWorks(root){
  const Lc = L[state.lang];
  const box = document.createElement('div'); box.className='center';
  const img = new Image(); img.src='./images/under_construction.png'; img.alt='';
  img.onerror = ()=>{ img.style.display='none'; };
  const h = document.createElement('h3'); h.textContent = Lc.works_header;
  const p = document.createElement('div'); p.className='muted'; p.textContent = Lc.works_text;
  box.append(img, h, p);
  root.appendChild(box);
}
