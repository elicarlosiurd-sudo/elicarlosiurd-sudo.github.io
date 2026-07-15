/* ═══════════════════════════════════════
   V230-D3 — MÓDULO MICROBIOME (js/modules/microbiome.js)
   Ex-bloco inline do index.html (extração literal).
═══════════════════════════════════════ */

var MICROBIOME_FOODS = [
  { key:'yogurt',       emoji:'🥛', name:'Iogurte natural',    cat:'fermented',  plant:false, benefit:'Lactobacillus vivo, melhora barreira intestinal' },
  { key:'kefir',        emoji:'🥤', name:'Kefir',              cat:'fermented',  plant:false, benefit:'30+ cepas bacterianas, o fermentado mais diverso' },
  { key:'kimchi',       emoji:'🌶️', name:'Kimchi',             cat:'fermented',  plant:true,  benefit:'Lactobacilos + compostos bioativos antiinflamatórios' },
  { key:'sauerkraut',   emoji:'🥬', name:'Chucrute',           cat:'fermented',  plant:true,  benefit:'Fermentação lacto, vitamina C e bactérias vivas' },
  { key:'kombucha',     emoji:'🍵', name:'Kombucha',           cat:'fermented',  plant:false, benefit:'Ácidos orgânicos + leveduras probióticas' },
  { key:'miso',         emoji:'🍜', name:'Missô',              cat:'fermented',  plant:true,  benefit:'Kojic acid, enzimas digestivas, isoflavonas' },
  { key:'tempeh',       emoji:'🫘', name:'Tempeh',             cat:'fermented',  plant:true,  benefit:'Proteína completa + fermentação que reduz antinutrientes' },
  { key:'cheese_aged',  emoji:'🧀', name:'Queijo maturado',    cat:'fermented',  plant:false, benefit:'Tyrosine, vitamina K2, bactérias lácticas' },
  { key:'garlic',       emoji:'🧄', name:'Alho',               cat:'prebiotic',  plant:true,  benefit:'FOS (frutooligossacarídeos), alimenta Bifidobacterium' },
  { key:'onion',        emoji:'🧅', name:'Cebola',             cat:'prebiotic',  plant:true,  benefit:'Inulina + quercetina, potente prebiótico' },
  { key:'leek',         emoji:'🌿', name:'Alho-poró',          cat:'prebiotic',  plant:true,  benefit:'Inulina de alta biodisponibilidade' },
  { key:'asparagus',    emoji:'🥦', name:'Aspargo',            cat:'prebiotic',  plant:true,  benefit:'Inulina + vitaminas do grupo B' },
  { key:'green_banana', emoji:'🍌', name:'Banana verde',       cat:'prebiotic',  plant:true,  benefit:'Amido resistente tipo 2 — combustível para Faecalibacterium' },
  { key:'oats',         emoji:'🌾', name:'Aveia',              cat:'prebiotic',  plant:true,  benefit:'Beta-glucana, reduz colesterol e alimenta bactérias benéficas' },
  { key:'artichoke',    emoji:'🌱', name:'Alcachofra',         cat:'prebiotic',  plant:true,  benefit:'Inulina mais concentrada dentre os vegetais' },
  { key:'chicory',      emoji:'🍃', name:'Chicória / raiz',    cat:'prebiotic',  plant:true,  benefit:'Fonte #1 de inulina (41% do peso seco)' },
  { key:'blueberry',    emoji:'🫐', name:'Mirtilo',            cat:'polyphenol', plant:true,  benefit:'Antocianinas — elevam Bifidobacterium e reduzem Clostridium' },
  { key:'dark_choc',    emoji:'🍫', name:'Chocolate 70%+',     cat:'polyphenol', plant:true,  benefit:'Flavanóis aumentam bactérias anti-inflamatórias' },
  { key:'green_tea',    emoji:'🍵', name:'Chá verde',          cat:'polyphenol', plant:true,  benefit:'EGCG aumenta Akkermansia muciniphila (proteção da mucosa)' },
  { key:'olive_oil',    emoji:'🫒', name:'Azeite extra virgem',cat:'polyphenol', plant:true,  benefit:'Oleocanthal antiinflamatório + polifenóis prebióticos' },
  { key:'pomegranate',  emoji:'🍎', name:'Romã',               cat:'polyphenol', plant:true,  benefit:'Urolitinas (metabólito) ativam autofagia mitocondrial' },
  { key:'red_grape',    emoji:'🍇', name:'Uva roxa',           cat:'polyphenol', plant:true,  benefit:'Resveratrol + antocianinas, modulação microbiota' },
  { key:'lentils',      emoji:'🫘', name:'Lentilha',           cat:'fiber',      plant:true,  benefit:'Fibra solúvel + insolúvel, proteína vegetal, ferro' },
  { key:'chickpeas',    emoji:'🫛', name:'Grão-de-bico',       cat:'fiber',      plant:true,  benefit:'Amido resistente + fibra, sustentação de bactérias butirato-produtoras' },
  { key:'chia',         emoji:'🌱', name:'Chia',               cat:'fiber',      plant:true,  benefit:'Fibra mucilaginosa forma gel prebiótico no intestino' },
  { key:'flaxseed',     emoji:'🌾', name:'Linhaça',            cat:'fiber',      plant:true,  benefit:'Lignanas + ômega-3 ALA + fibra solúvel' },
  { key:'broccoli',     emoji:'🥦', name:'Brócolis',           cat:'fiber',      plant:true,  benefit:'Sulforafano + fibra, potente modulador da microbiota' },
  { key:'sweet_potato', emoji:'🍠', name:'Batata-doce',        cat:'fiber',      plant:true,  benefit:'Amido resistente quando fria + betacaroteno' },
  { key:'quinoa',       emoji:'🌾', name:'Quinoa',             cat:'fiber',      plant:true,  benefit:'Proteína completa + fibra + saponinas que modulam microbiota' },
  { key:'ginger',       emoji:'🫚', name:'Gengibre',           cat:'gutpositive',plant:true,  benefit:'Gingerol reduz inflamação intestinal, acelera esvaziamento gástrico' },
  { key:'turmeric',     emoji:'🟡', name:'Cúrcuma',            cat:'gutpositive',plant:true,  benefit:'Curcumina modula TLRs, reduz permeabilidade intestinal' },
  { key:'apple',        emoji:'🍎', name:'Maçã (com casca)',   cat:'gutpositive',plant:true,  benefit:'Pectina prebiótica + quercetina, alta em diversidade' }
];

var MICROBIOME_CATS = {
  fermented:   { label:'Fermentados',   emoji:'🦠', color:'#9c27b0', bg:'#9c27b018' },
  prebiotic:   { label:'Prebióticos',   emoji:'🌱', color:'#4caf50', bg:'#4caf5018' },
  polyphenol:  { label:'Polifenóis',    emoji:'🍇', color:'#673ab7', bg:'#673ab718' },
  fiber:       { label:'Fibras',        emoji:'🌾', color:'#ff9800', bg:'#ff980018' },
  gutpositive: { label:'Anti-inflamat.',emoji:'✨', color:'#2196f3', bg:'#2196f318' }
};

function renderMicrobiomeShell() {
  return '<div class="screen-header"><div class="screen-title">🦠 Microbioma Intestinal</div></div><div id="main-content"></div>';
}

async function renderMicrobiome() {
  var main = document.getElementById('main-content');
  if (!main) return;

  var today = new Date().toISOString().split('T')[0];
  var weekLogs = [];
  var todayFoods = {};

  try {
    var sb = getVitaliaSupabaseClient();
    if (sb) {
      var { data: { user } } = await sb.auth.getUser();
      if (user) {
        var sevenDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        var { data: logs } = await sb.from('microbiome_logs')
          .select('*')
          .eq('user_id', user.id)
          .gte('log_date', sevenDaysAgo)
          .order('log_date', { ascending: false });
        if (logs && logs.length > 0) {
          weekLogs = logs;
          var t = logs.find(function(r){ return r.log_date === today; });
          if (t) {
            (t.foods_consumed || []).forEach(function(k){ todayFoods[k] = true; });
          }
        }
      }
    }
  } catch(e) {}

  var weekPlantSet = {};
  weekLogs.forEach(function(r) {
    (r.foods_consumed || []).forEach(function(k) {
      var food = MICROBIOME_FOODS.find(function(f){ return f.key === k; });
      if (food && food.plant) weekPlantSet[k] = true;
    });
  });
  var weekPlantCount = Object.keys(weekPlantSet).length;
  var weekGoal = 30;
  var weekPct = Math.min(100, Math.round((weekPlantCount / weekGoal) * 100));
  var weekColor = weekPct >= 100 ? '#4caf50' : weekPct >= 60 ? '#ff9800' : '#9e9e9e';

  var todayCount = Object.keys(todayFoods).length;
  var fermentedToday = MICROBIOME_FOODS.filter(function(f){ return todayFoods[f.key] && f.cat === 'fermented'; }).length;

  var gutScore = Math.min(100, Math.round(
    (weekPlantCount / weekGoal) * 50 +
    Math.min(fermentedToday, 3) / 3 * 30 +
    Math.min(todayCount, 8) / 8 * 20
  ));
  var scoreColor = gutScore >= 70 ? '#4caf50' : gutScore >= 40 ? '#ff9800' : '#9e9e9e';

  var progressBar = '<div class="card" style="padding:14px;margin-bottom:12px;">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">'
    + '<span style="font-size:13px;font-weight:600;">🌿 Meta de diversidade semanal</span>'
    + '<span style="font-size:13px;font-weight:700;color:' + weekColor + ';">' + weekPlantCount + '/' + weekGoal + '</span>'
    + '</div>'
    + '<div style="background:var(--bg-secondary);border-radius:6px;height:10px;overflow:hidden;">'
    + '<div style="width:' + weekPct + '%;height:100%;background:' + weekColor + ';border-radius:6px;transition:width .4s;"></div>'
    + '</div>'
    + '<div style="font-size:11px;opacity:.6;margin-top:5px;">30 plantas/semana = microbioma de elite (Tim Spector · British Gut Project)</div>'
    + '</div>';

  var statsHtml = '<div style="display:flex;gap:10px;margin-bottom:14px;">'
    + '<div class="card" style="flex:1;text-align:center;padding:12px;">'
    + '<div style="font-size:11px;opacity:.6;">Score Intestinal</div>'
    + '<div style="font-size:24px;font-weight:700;color:' + scoreColor + ';">' + gutScore + '</div>'
    + '</div>'
    + '<div class="card" style="flex:1;text-align:center;padding:12px;">'
    + '<div style="font-size:11px;opacity:.6;">Hoje</div>'
    + '<div style="font-size:24px;font-weight:700;">' + todayCount + '</div>'
    + '<div style="font-size:10px;opacity:.5;">alimentos</div>'
    + '</div>'
    + '<div class="card" style="flex:1;text-align:center;padding:12px;">'
    + '<div style="font-size:11px;opacity:.6;">Fermentados</div>'
    + '<div style="font-size:24px;font-weight:700;color:#9c27b0;">' + fermentedToday + '</div>'
    + '<div style="font-size:10px;opacity:.5;">hoje</div>'
    + '</div>'
    + '</div>';

  var activeFilter = window._microbiomeFilter || 'all';
  var filterHtml = '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;">'
    + '<button onclick="window._microbiomeFilter=\'all\';renderMicrobiome();" style="padding:5px 10px;border-radius:20px;border:1px solid;cursor:pointer;font-size:11px;font-weight:500;'
    + (activeFilter === 'all' ? 'background:rgba(108,99,255,.15);color:var(--color-primary,#6c63ff);border-color:var(--color-primary,#6c63ff);' : 'background:var(--bg-secondary);color:var(--text-secondary);border-color:var(--border-color);')
    + '">Todos</button>'
    + Object.keys(MICROBIOME_CATS).map(function(k) {
        var c = MICROBIOME_CATS[k];
        var isA = activeFilter === k;
        return '<button onclick="window._microbiomeFilter=\'' + k + '\';renderMicrobiome();" style="padding:5px 10px;border-radius:20px;border:1px solid;cursor:pointer;font-size:11px;font-weight:500;'
          + (isA ? 'background:' + c.bg + ';color:' + c.color + ';border-color:' + c.color + ';' : 'background:var(--bg-secondary);color:var(--text-secondary);border-color:var(--border-color);')
          + '">' + c.emoji + ' ' + c.label + '</button>';
      }).join('')
    + '</div>';

  var filtered = MICROBIOME_FOODS.filter(function(f) {
    return activeFilter === 'all' || f.cat === activeFilter;
  });

  var foodGrid = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;">'
    + filtered.map(function(f) {
        var sel = !!todayFoods[f.key];
        var cat = MICROBIOME_CATS[f.cat] || {};
        return '<div onclick="toggleMicrobiomeFood(\'' + f.key + '\',' + (!sel) + ');" style="cursor:pointer;padding:10px;border-radius:10px;border:2px solid;'
          + (sel ? 'border-color:' + (cat.color||'var(--color-primary)') + ';background:' + (cat.bg||'rgba(108,99,255,.1)') + ';' : 'border-color:var(--border-color);background:var(--bg-secondary);')
          + '">'
          + '<div style="font-size:22px;margin-bottom:3px;">' + f.emoji + '</div>'
          + '<div style="font-size:12px;font-weight:' + (sel ? '700' : '500') + ';line-height:1.3;">' + escHtml(f.name) + '</div>'
          + '<div style="font-size:10px;opacity:.6;margin-top:2px;">' + escHtml(f.benefit.substring(0,45)) + (f.benefit.length > 45 ? '…' : '') + '</div>'
          + (f.plant ? '<div style="font-size:9px;margin-top:4px;opacity:.5;">🌿 conta para 30/sem</div>' : '')
          + '</div>';
      }).join('')
    + '</div>';

  main.innerHTML = '<div class="view-container" style="max-width:520px;margin:0 auto;padding:16px;">'
    + '<h2 style="margin-bottom:4px;">🦠 Microbioma Intestinal</h2>'
    + '<p style="font-size:13px;opacity:.6;margin-bottom:16px;">Diversidade alimentar · 30 plantas/semana · Alimentos fermentados</p>'
    + progressBar
    + statsHtml
    + filterHtml
    + foodGrid
    + '<button id="micro-coach-btn" class="btn-secondary" style="width:100%;margin-top:4px;">🤖 Analisar meu microbioma com CoachIA</button>'
    + '</div>';

  var cb = document.getElementById('micro-coach-btn');
  if (cb) {
    cb.addEventListener('click', function() {
      try {
        localStorage.setItem('vitalia_coach_context_microbiome', JSON.stringify({
          week_plant_diversity: weekPlantCount,
          week_goal: weekGoal,
          fermented_today: fermentedToday,
          gut_score: gutScore,
          foods_today: Object.keys(todayFoods)
        }));
      } catch(e) {}
      navigate('coach');
    });
  }
}

function toggleMicrobiomeFood(key, activate) {
  var sb = getVitaliaSupabaseClient();
  if (!sb) { reportProgressHealthError('Microbioma', 'Supabase não disponível'); return; }
  var today = new Date().toISOString().split('T')[0];
  sb.auth.getUser().then(function(res) {
    var user = res.data && res.data.user;
    if (!user) { reportProgressHealthError('Microbioma', 'Usuário não autenticado'); return; }
    sb.from('microbiome_logs').select('*').eq('user_id', user.id).eq('log_date', today).maybeSingle()
      .then(function(r) {
        if (r && r.error) { reportProgressHealthError('Microbioma', r.error); return; }
        var existing = r.data;
        var cur = existing ? (existing.foods_consumed || []) : [];
        var newFoods = activate
          ? (cur.indexOf(key) >= 0 ? cur : cur.concat([key]))
          : cur.filter(function(k){ return k !== key; });
        var fermented = newFoods.filter(function(k){
          var f = MICROBIOME_FOODS.find(function(x){ return x.key === k; });
          return f && f.cat === 'fermented';
        }).length;
        var plants = newFoods.filter(function(k){
          var f = MICROBIOME_FOODS.find(function(x){ return x.key === k; });
          return f && f.plant;
        }).length;
        var upd = { foods_consumed: newFoods, fermented_count: fermented, plant_diversity_count: plants };
        if (existing) {
          sb.from('microbiome_logs').update(upd).eq('id', existing.id).then(function(writeResult){
            if (writeResult && writeResult.error) { reportProgressHealthError('Microbioma', writeResult.error); return; }
            renderMicrobiome();
          });
        } else {
          upd.user_id = user.id;
          upd.log_date = today;
          sb.from('microbiome_logs').insert([upd]).then(function(writeResult){
            if (writeResult && writeResult.error) { reportProgressHealthError('Microbioma', writeResult.error); return; }
            renderMicrobiome();
          });
        }
      }).catch(function(err){ reportProgressHealthError('Microbioma', err); });
  }).catch(function(err){ reportProgressHealthError('Microbioma', err); });
}
