/* ═══════════════════════════════════════
   V230-D3 — MÓDULO SHOPPING (js/modules/shopping.js)
   Ex-bloco inline do index.html (extração literal).
═══════════════════════════════════════ */

var SHOPPING_CATEGORIES = {
  hortifruti:   { label:'🥬 Hortifruti',          color:'#4caf50', bg:'#4caf5015' },
  proteinas:    { label:'🥩 Proteínas',            color:'#f44336', bg:'#f4433615' },
  laticinios:   { label:'🥛 Laticínios & Ferm.',   color:'#9c27b0', bg:'#9c27b015' },
  graos:        { label:'🌾 Grãos & Sementes',     color:'#ff9800', bg:'#ff980015' },
  condimentos:  { label:'🫙 Condimentos & Óleos',  color:'#795548', bg:'#79554815' },
  suplementos:  { label:'💊 Suplementos',          color:'#2196f3', bg:'#2196f315' },
  outros:       { label:'🛒 Outros',               color:'#607d8b', bg:'#607d8b15' }
};

var SHOPPING_TEMPLATES = {
  semana_saudavel: {
    label: '🥗 Semana Saudável',
    desc:  'Itens essenciais para uma semana equilibrada',
    color: '#4caf50',
    items: [
      { name:'Brócolis',          cat:'hortifruti',  qty:'2',  unit:'unid.' },
      { name:'Espinafre',         cat:'hortifruti',  qty:'1',  unit:'maço' },
      { name:'Batata-doce',       cat:'hortifruti',  qty:'1',  unit:'kg' },
      { name:'Cenoura',           cat:'hortifruti',  qty:'500',unit:'g' },
      { name:'Tomate',            cat:'hortifruti',  qty:'6',  unit:'unid.' },
      { name:'Maçã (c/ casca)',   cat:'hortifruti',  qty:'6',  unit:'unid.' },
      { name:'Banana',            cat:'hortifruti',  qty:'1',  unit:'cacho' },
      { name:'Mirtilo / blueberry',cat:'hortifruti', qty:'1',  unit:'cx' },
      { name:'Limão siciliano',   cat:'hortifruti',  qty:'4',  unit:'unid.' },
      { name:'Frango (filé)',     cat:'proteinas',   qty:'1',  unit:'kg' },
      { name:'Ovos caipiras',     cat:'proteinas',   qty:'12', unit:'unid.' },
      { name:'Salmão',            cat:'proteinas',   qty:'400',unit:'g' },
      { name:'Iogurte natural',   cat:'laticinios',  qty:'4',  unit:'unid.' },
      { name:'Kefir',             cat:'laticinios',  qty:'1',  unit:'L' },
      { name:'Aveia',             cat:'graos',       qty:'500',unit:'g' },
      { name:'Quinoa',            cat:'graos',       qty:'500',unit:'g' },
      { name:'Lentilha',          cat:'graos',       qty:'500',unit:'g' },
      { name:'Grão-de-bico',      cat:'graos',       qty:'400',unit:'g' },
      { name:'Chia',              cat:'graos',       qty:'250',unit:'g' },
      { name:'Azeite extra virgem',cat:'condimentos',qty:'1',  unit:'un' },
      { name:'Alho',              cat:'condimentos', qty:'1',  unit:'cabeça' },
      { name:'Gengibre fresco',   cat:'condimentos', qty:'1',  unit:'un' },
      { name:'Cúrcuma em pó',     cat:'condimentos', qty:'1',  unit:'un' }
    ]
  },
  microbioma: {
    label: '🦠 Microbioma',
    desc:  'Foco em diversidade intestinal e fermentados',
    color: '#9c27b0',
    items: [
      { name:'Kimchi',            cat:'laticinios',  qty:'1',  unit:'pote' },
      { name:'Chucrute',          cat:'laticinios',  qty:'1',  unit:'pote' },
      { name:'Kombucha',          cat:'laticinios',  qty:'2',  unit:'un' },
      { name:'Missô (pasta)',     cat:'condimentos', qty:'1',  unit:'un' },
      { name:'Tempeh',            cat:'proteinas',   qty:'300',unit:'g' },
      { name:'Kefir',             cat:'laticinios',  qty:'1',  unit:'L' },
      { name:'Alho',              cat:'condimentos', qty:'2',  unit:'cabeça' },
      { name:'Cebola roxa',       cat:'hortifruti',  qty:'3',  unit:'unid.' },
      { name:'Alho-poró',         cat:'hortifruti',  qty:'2',  unit:'un' },
      { name:'Aspargo',           cat:'hortifruti',  qty:'1',  unit:'maço' },
      { name:'Banana verde',      cat:'hortifruti',  qty:'6',  unit:'unid.' },
      { name:'Alcachofra',        cat:'hortifruti',  qty:'2',  unit:'unid.' },
      { name:'Mirtilo',           cat:'hortifruti',  qty:'2',  unit:'cx' },
      { name:'Uva roxa',          cat:'hortifruti',  qty:'500',unit:'g' },
      { name:'Aveia',             cat:'graos',       qty:'500',unit:'g' },
      { name:'Linhaça',           cat:'graos',       qty:'250',unit:'g' },
      { name:'Chocolate 70%+',    cat:'outros',      qty:'2',  unit:'un' },
      { name:'Chá verde (sachê)', cat:'outros',      qty:'1',  unit:'cx' },
      { name:'Azeite extra virgem',cat:'condimentos',qty:'1',  unit:'un' }
    ]
  },
  longevidade: {
    label: '🧬 Longevidade',
    desc:  'Alimentos e suplementos dos protocolos Sinclair/Attia',
    color: '#2196f3',
    items: [
      { name:'NMN 500mg',         cat:'suplementos', qty:'1',  unit:'frasco' },
      { name:'Resveratrol 500mg', cat:'suplementos', qty:'1',  unit:'frasco' },
      { name:'Vitamina D3 5000UI',cat:'suplementos', qty:'1',  unit:'frasco' },
      { name:'Ômega-3 (EPA+DHA)', cat:'suplementos', qty:'1',  unit:'frasco' },
      { name:'CoQ10 200mg',       cat:'suplementos', qty:'1',  unit:'frasco' },
      { name:'Magnésio (glic/mal)',cat:'suplementos', qty:'1', unit:'frasco' },
      { name:'Romã',              cat:'hortifruti',  qty:'2',  unit:'unid.' },
      { name:'Mirtilo',           cat:'hortifruti',  qty:'2',  unit:'cx' },
      { name:'Brócolis',          cat:'hortifruti',  qty:'3',  unit:'unid.' },
      { name:'Uva roxa',          cat:'hortifruti',  qty:'500',unit:'g' },
      { name:'Salmão selvagem',   cat:'proteinas',   qty:'500',unit:'g' },
      { name:'Sardinha (lata)',   cat:'proteinas',   qty:'3',  unit:'lata' },
      { name:'Azeite extra virgem',cat:'condimentos',qty:'1',  unit:'un' },
      { name:'Cúrcuma + pimenta', cat:'condimentos', qty:'1',  unit:'kit' },
      { name:'Chá verde',         cat:'outros',      qty:'1',  unit:'cx' },
      { name:'Chocolate 85%+',    cat:'outros',      qty:'2',  unit:'un' }
    ]
  },
  imunidade: {
    label: '💪 Imunidade & Energia',
    desc:  'Reforço imunológico e energia sustentada',
    color: '#ff9800',
    items: [
      { name:'Laranja',           cat:'hortifruti',  qty:'8',  unit:'unid.' },
      { name:'Acerola (polpa)',   cat:'hortifruti',  qty:'1',  unit:'pacote' },
      { name:'Kiwi',              cat:'hortifruti',  qty:'6',  unit:'unid.' },
      { name:'Espinafre',         cat:'hortifruti',  qty:'2',  unit:'maço' },
      { name:'Alho',              cat:'condimentos', qty:'3',  unit:'cabeça' },
      { name:'Gengibre fresco',   cat:'condimentos', qty:'2',  unit:'un' },
      { name:'Cúrcuma em pó',     cat:'condimentos', qty:'1',  unit:'un' },
      { name:'Mel puro',          cat:'condimentos', qty:'1',  unit:'un' },
      { name:'Ovos caipiras',     cat:'proteinas',   qty:'12', unit:'unid.' },
      { name:'Frango',            cat:'proteinas',   qty:'1',  unit:'kg' },
      { name:'Iogurte natural',   cat:'laticinios',  qty:'4',  unit:'unid.' },
      { name:'Aveia',             cat:'graos',       qty:'500',unit:'g' },
      { name:'Lentilha',          cat:'graos',       qty:'500',unit:'g' },
      { name:'Batata-doce',       cat:'hortifruti',  qty:'1',  unit:'kg' },
      { name:'Vitamina C 1g',     cat:'suplementos', qty:'1',  unit:'frasco' },
      { name:'Zinco',             cat:'suplementos', qty:'1',  unit:'frasco' }
    ]
  }
};

async function renderShoppingV200() {
  var main = document.querySelector('.screen.active.shopping-screen') || document.getElementById('main-content');
  if (!main) return;

  var activeList = null;
  var listItems = [];

  try {
    var sb = getVitaliaSupabaseClient();
    if (sb) {
      var { data: { user } } = await sb.auth.getUser();
      if (user) {
        var { data: lists } = await sb.from('shopping_lists')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1);
        if (lists && lists.length > 0) {
          activeList = lists[0];
          listItems = activeList.items || [];
        }
      }
    }
  } catch(e) {}

  var checkedCount = listItems.filter(function(i){ return i.checked; }).length;
  var totalCount = listItems.length;
  var progressHtml = '';
  if (totalCount > 0) {
    var pct = Math.round((checkedCount / totalCount) * 100);
    var pColor = pct === 100 ? '#4caf50' : pct >= 50 ? '#ff9800' : 'var(--color-primary,#6c63ff)';
    progressHtml = '<div class="card" style="padding:12px;margin-bottom:12px;">'
      + '<div style="display:flex;justify-content:space-between;margin-bottom:5px;">'
      + '<span style="font-size:12px;font-weight:600;">Progresso da compra</span>'
      + '<span style="font-size:12px;font-weight:700;color:' + pColor + ';">' + checkedCount + '/' + totalCount + ' itens</span>'
      + '</div>'
      + '<div style="background:var(--bg-secondary);border-radius:6px;height:8px;overflow:hidden;">'
      + '<div style="width:' + pct + '%;height:100%;background:' + pColor + ';border-radius:6px;transition:width .3s;"></div>'
      + '</div>'
      + '</div>';
  }

  var templateHtml = '<div style="margin-bottom:14px;">'
    + '<div style="font-size:13px;font-weight:600;margin-bottom:8px;">⚡ Gerar lista por objetivo</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">'
    + Object.keys(SHOPPING_TEMPLATES).map(function(k) {
        var tmpl = SHOPPING_TEMPLATES[k];
        return '<div onclick="applyShoppingTemplate(\'' + k + '\');" style="cursor:pointer;padding:10px;border-radius:10px;border:1.5px solid ' + tmpl.color + '22;background:' + tmpl.color + '0e;text-align:center;">'
          + '<div style="font-size:14px;margin-bottom:3px;">' + tmpl.label.split(' ')[0] + '</div>'
          + '<div style="font-size:11px;font-weight:600;color:' + tmpl.color + ';">' + tmpl.label.substring(tmpl.label.indexOf(' ')+1) + '</div>'
          + '<div style="font-size:10px;opacity:.6;margin-top:2px;">' + tmpl.items.length + ' itens</div>'
          + '</div>';
      }).join('')
    + '</div>'
    + '</div>';

  var addHtml = '<div class="card" style="padding:12px;margin-bottom:14px;">'
    + '<div style="font-size:12px;font-weight:600;margin-bottom:8px;">➕ Adicionar item</div>'
    + '<div style="display:flex;gap:6px;flex-wrap:wrap;">'
    + '<input id="shop-item-name" type="text" placeholder="Nome do item" style="flex:1;min-width:120px;padding:7px 10px;border-radius:8px;border:1px solid var(--border-color);background:var(--bg-secondary);color:var(--text-primary);font-size:13px;" />'
    + '<select id="shop-item-cat" style="padding:7px 8px;border-radius:8px;border:1px solid var(--border-color);background:var(--bg-secondary);color:var(--text-primary);font-size:12px;">'
    + Object.keys(SHOPPING_CATEGORIES).map(function(k){ return '<option value="' + k + '">' + SHOPPING_CATEGORIES[k].label + '</option>'; }).join('')
    + '</select>'
    + '<button onclick="addShoppingItem();" style="padding:7px 14px;border-radius:8px;border:none;background:var(--color-primary,#6c63ff);color:#fff;font-size:13px;font-weight:600;cursor:pointer;">OK</button>'
    + '</div>'
    + '</div>';

  var listHtml = '';
  if (totalCount > 0) {
    var grouped = {};
    listItems.forEach(function(item, idx) {
      var c = item.cat || 'outros';
      if (!grouped[c]) grouped[c] = [];
      grouped[c].push({ item: item, idx: idx });
    });

    listHtml = '<div style="margin-bottom:14px;">';
    Object.keys(SHOPPING_CATEGORIES).forEach(function(catKey) {
      var group = grouped[catKey];
      if (!group || group.length === 0) return;
      var catInfo = SHOPPING_CATEGORIES[catKey];
      var doneInCat = group.filter(function(g){ return g.item.checked; }).length;
      listHtml += '<div style="margin-bottom:12px;">'
        + '<div style="font-size:12px;font-weight:600;color:' + catInfo.color + ';margin-bottom:6px;padding:4px 0;border-bottom:1px solid ' + catInfo.color + '33;">'
        + catInfo.label + ' <span style="font-weight:400;opacity:.6;">(' + doneInCat + '/' + group.length + ')</span>'
        + '</div>'
        + group.map(function(g) {
            var item = g.item;
            var idx = g.idx;
            return '<div style="display:flex;align-items:center;gap:8px;padding:7px 4px;border-bottom:1px solid var(--border-color)22;">'
              + '<input type="checkbox" ' + (item.checked ? 'checked' : '') + ' onchange="toggleShoppingItem(' + idx + ',this.checked);" style="width:18px;height:18px;accent-color:' + catInfo.color + ';cursor:pointer;flex-shrink:0;" />'
              + '<span style="flex:1;font-size:13px;' + (item.checked ? 'text-decoration:line-through;opacity:.45;' : '') + '">' + escHtml(item.name) + '</span>'
              + (item.qty ? '<span style="font-size:11px;opacity:.5;">' + escHtml(item.qty) + ' ' + escHtml(item.unit||'') + '</span>' : '')
              + '<button onclick="removeShoppingItem(' + idx + ');" style="background:none;border:none;cursor:pointer;font-size:16px;opacity:.35;padding:0 2px;line-height:1;">×</button>'
              + '</div>';
          }).join('')
        + '</div>';
    });
    listHtml += '</div>';
  } else {
    listHtml = '<div style="text-align:center;padding:24px 0;opacity:.5;font-size:14px;">Lista vazia — escolha um template acima ou adicione itens</div>';
  }

  var actionsHtml = totalCount > 0 ? '<div style="display:flex;gap:8px;margin-bottom:16px;">'
    + '<button onclick="copyShoppingList();" class="btn-secondary" style="flex:1;padding:9px;">📋 Copiar lista</button>'
    + '<button onclick="clearCheckedItems();" class="btn-secondary" style="flex:1;padding:9px;">🗑 Remover marcados</button>'
    + '</div>' : '';

  main.innerHTML = '<div class="screen-header"><div class="screen-title">🛒 Lista de Compras</div></div>'
    + '<div class="view-container" style="max-width:520px;margin:0 auto;padding:16px;">'
    + '<p style="font-size:13px;opacity:.6;margin-bottom:14px;">Gere por objetivo ou adicione manualmente</p>'
    + progressHtml
    + templateHtml
    + addHtml
    + actionsHtml
    + listHtml
    + '</div>';

  if (typeof injectBackBtn === 'function') injectBackBtn(main);
  var inp = document.getElementById('shop-item-name');
  if (inp) inp.addEventListener('keydown', function(e){ if (e.key === 'Enter') addShoppingItem(); });
}

function _getShoppingSupabase() { return getVitaliaSupabaseClient(); }

function _loadActiveList(cb) {
  var sb = _getShoppingSupabase();
  if (!sb) { cb(null, []); return; }
  sb.auth.getUser().then(function(res) {
    var user = res.data && res.data.user;
    if (!user) { cb(null, []); return; }
    sb.from('shopping_lists').select('*').eq('user_id', user.id).eq('status','active')
      .order('created_at', { ascending: false }).limit(1)
      .then(function(r) {
        if (r && r.error) { reportProgressHealthError('Lista de Compras', r.error); cb(null, []); return; }
        if (r.data && r.data.length > 0) { cb(r.data[0], r.data[0].items || []); }
        else { cb(null, []); }
      }).catch(function(err){ reportProgressHealthError('Lista de Compras', err); cb(null, []); });
  }).catch(function(err){ reportProgressHealthError('Lista de Compras', err); cb(null, []); });
}

function _saveList(existingId, userId, items, cb) {
  var sb = _getShoppingSupabase();
  if (!sb) return;
  if (existingId) {
    sb.from('shopping_lists').update({ items: items, updated_at: new Date().toISOString() })
      .eq('id', existingId).then(function(result){
        if (result && result.error) { reportProgressHealthError('Lista de Compras', result.error); return; }
        if(cb) cb(); renderShoppingV200();
      }).catch(function(err){ reportProgressHealthError('Lista de Compras', err); });
  } else {
    sb.from('shopping_lists').insert([{ user_id: userId, name: 'Lista de Compras', items: items, status: 'active' }])
      .then(function(result){
        if (result && result.error) { reportProgressHealthError('Lista de Compras', result.error); return; }
        if(cb) cb(); renderShoppingV200();
      }).catch(function(err){ reportProgressHealthError('Lista de Compras', err); });
  }
}

function applyShoppingTemplate(templateKey) {
  var tmpl = SHOPPING_TEMPLATES[templateKey];
  if (!tmpl) return;
  var sb = _getShoppingSupabase();
  if (!sb) return;
  sb.auth.getUser().then(function(res) {
    var user = res.data && res.data.user;
    if (!user) { reportProgressHealthError('Lista de Compras', 'Usuário não autenticado'); return; }
    _loadActiveList(function(existing, currentItems) {
      var existingNames = currentItems.map(function(i){ return i.name.toLowerCase(); });
      var newItems = tmpl.items.filter(function(ti){ return existingNames.indexOf(ti.name.toLowerCase()) < 0; })
        .map(function(ti){ return { id: Date.now() + Math.random(), name: ti.name, cat: ti.cat, qty: ti.qty, unit: ti.unit, checked: false, source: 'template' }; });
      var merged = currentItems.concat(newItems);
      _saveList(existing ? existing.id : null, user.id, merged);
    });
  }).catch(function(err){ reportProgressHealthError('Lista de Compras', err); });
}

function addShoppingItem() {
  var inp = document.getElementById('shop-item-name');
  var sel = document.getElementById('shop-item-cat');
  if (!inp || !inp.value.trim()) return;
  var name = inp.value.trim();
  var cat = sel ? sel.value : 'outros';
  var sb = _getShoppingSupabase();
  if (!sb) return;
  sb.auth.getUser().then(function(res) {
    var user = res.data && res.data.user;
    if (!user) { reportProgressHealthError('Lista de Compras', 'Usuário não autenticado'); return; }
    _loadActiveList(function(existing, items) {
      var newItem = { id: Date.now() + Math.random(), name: name, cat: cat, qty: '', unit: '', checked: false, source: 'manual' };
      inp.value = '';
      _saveList(existing ? existing.id : null, user.id, items.concat([newItem]));
    });
  }).catch(function(err){ reportProgressHealthError('Lista de Compras', err); });
}

function toggleShoppingItem(idx, checked) {
  var sb = _getShoppingSupabase();
  if (!sb) return;
  sb.auth.getUser().then(function(res) {
    var user = res.data && res.data.user;
    if (!user) { reportProgressHealthError('Lista de Compras', 'Usuário não autenticado'); return; }
    _loadActiveList(function(existing, items) {
      if (!existing || !items[idx]) return;
      items[idx].checked = checked;
      _saveList(existing.id, user.id, items);
    });
  }).catch(function(err){ reportProgressHealthError('Lista de Compras', err); });
}

function removeShoppingItem(idx) {
  var sb = _getShoppingSupabase();
  if (!sb) return;
  sb.auth.getUser().then(function(res) {
    var user = res.data && res.data.user;
    if (!user) { reportProgressHealthError('Lista de Compras', 'Usuário não autenticado'); return; }
    _loadActiveList(function(existing, items) {
      if (!existing) return;
      items.splice(idx, 1);
      _saveList(existing.id, user.id, items);
    });
  }).catch(function(err){ reportProgressHealthError('Lista de Compras', err); });
}

function clearCheckedItems() {
  var sb = _getShoppingSupabase();
  if (!sb) return;
  sb.auth.getUser().then(function(res) {
    var user = res.data && res.data.user;
    if (!user) return;
    _loadActiveList(function(existing, items) {
      if (!existing) return;
      var filtered = items.filter(function(i){ return !i.checked; });
      _saveList(existing.id, user.id, filtered);
    });
  });
}

function copyShoppingList() {
  var sb = _getShoppingSupabase();
  if (!sb) return;
  _loadActiveList(function(existing, items) {
    if (!items.length) return;
    var grouped = {};
    items.forEach(function(item) {
      var c = item.cat || 'outros';
      if (!grouped[c]) grouped[c] = [];
      grouped[c].push(item);
    });
    var text = '🛒 Lista de Compras VitalIA\n\n';
    Object.keys(SHOPPING_CATEGORIES).forEach(function(k) {
      var g = grouped[k];
      if (!g || !g.length) return;
      text += SHOPPING_CATEGORIES[k].label + '\n';
      g.forEach(function(i){ text += (i.checked ? '✓' : '◻') + ' ' + i.name + (i.qty ? ' — ' + i.qty + ' ' + (i.unit||'') : '') + '\n'; });
      text += '\n';
    });
    try { navigator.clipboard.writeText(text); } catch(e) {}
    var btn = document.querySelector('[onclick="copyShoppingList();"]');
    if (btn) { btn.textContent = '✓ Copiado!'; setTimeout(function(){ btn.textContent = '📋 Copiar lista'; }, 2000); }
  });
}
