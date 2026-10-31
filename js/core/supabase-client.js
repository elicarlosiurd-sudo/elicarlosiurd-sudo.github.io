/* ═══════════════════════════════════════
   SUPABASE — CONFIG E AUTH REAL
═══════════════════════════════════════ */
const SUPABASE_URL = 'https://qyerrlteeoiudtgmguzk.supabase.co';
// Chave pública (anon) do Supabase; segurança garantida por Auth/RLS e pelas Edge Functions.
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5ZXJybHRlZW9pdWR0Z21ndXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMjM4MzgsImV4cCI6MjA4OTU5OTgzOH0.DZiOp28edRnu8EL-MOvDilG2DlON8W_OAL2gm4gwVIw';
let sb;
try {
  if (typeof supabase !== 'undefined') {
    sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  } else {
    console.warn('[VitalIA] Supabase CDN não carregado — modo offline');
    sb = {
    auth: {
      getSession:           async () => ({ data: { session: null }, error: null }),
      getUser:              async () => ({ data: { user: null },    error: null }),
      signInWithPassword:   async () => ({ data: null, error: { message: 'Sem conexão com servidor' } }),
      signUp:               async () => ({ data: null, error: { message: 'Sem conexão com servidor' } }),
      signOut:              async () => ({}),
      onAuthStateChange:    ()    => ({ data: { subscription: { unsubscribe: () => {} } } }),
      resetPasswordForEmail:async () => ({ data: null, error: { message: 'Sem conexão com servidor' } })
    },
    from: (table) => ({
      select: (cols) => ({
        eq: (col, val) => ({
          single: async () => ({ data: null, error: null }),
          order:  (c, o) => ({ data: [], error: null }),
          then: (fn) => Promise.resolve({ data: [], error: null }).then(fn)
        }),
        order: (col, opts) => ({ data: [], error: null }),
        then: (fn) => Promise.resolve({ data: [], error: null }).then(fn)
      }),
      insert: (obj) => ({ then: (fn) => Promise.resolve({ data: null, error: null }).then(fn) }),
      upsert: (obj) => ({ then: (fn) => Promise.resolve({ data: null, error: null }).then(fn) }),
      update: (obj) => ({ eq: () => ({ then: (fn) => Promise.resolve({ data: null, error: null }).then(fn) }) }),
      delete: ()    => ({ eq: () => ({ then: (fn) => Promise.resolve({ data: null, error: null }).then(fn) }) })
    }),
    rpc: async () => ({ data: null, error: { message: 'Serviço indisponível.' } })
  };
  }
} catch(e) { console.error('[VitalIA] Supabase init error:', e); }
try {
  if (sb) {
    window._supabase = sb;
    window.vitaliaSupabaseClient = sb;
  }
} catch(_) {}

function getVitaliaSupabaseClient() {
  try {
    var client = null;
    if (window._supabase && window._supabase.auth && typeof window._supabase.from === 'function') {
      client = window._supabase;
    } else if (window.vitaliaSupabaseClient && window.vitaliaSupabaseClient.auth && typeof window.vitaliaSupabaseClient.from === 'function') {
      client = window.vitaliaSupabaseClient;
    } else if (typeof sb !== 'undefined' && sb && sb.auth && typeof sb.from === 'function') {
      client = sb;
    }
    if (client) {
      window._supabase = client;
      window.vitaliaSupabaseClient = client;
      return client;
    }
  } catch(_) {}
  return null;
}

async function getVitaliaSupabaseUser(featureName) {
  var client = getVitaliaSupabaseClient();
  if (!client) throw new Error('Supabase nao disponivel. Atualize o app e entre novamente.');
  var res = await client.auth.getUser();
  if (res && res.error) throw res.error;
  var user = res && res.data && res.data.user;
  if (!user) throw new Error('Sessao expirada. Entre novamente para salvar ' + (featureName || 'este registro') + '.');
  return { sb: client, user: user };
}

// ── Auth helpers ──────────────────────
function getAuthRedirectUrl() {
  var publicUrl = 'https://elicarlosiurd-sudo.github.io/vitalia-app/';
  try {
    var host = location.hostname || '';
    if (!host || host === 'localhost' || host === '127.0.0.1' || host === '::1') return publicUrl;
    var cleanPath = location.pathname || '/';
    if (host.indexOf('github.io') >= 0) return location.origin + cleanPath;
    return publicUrl;
  } catch(_) {
    return publicUrl;
  }
}

async function sbSignUp(email, password, nome) {
  try { localStorage.setItem('v_pending_signup_email', email); } catch(_) {}
  const { data, error } = await sb.auth.signUp({
    email, password,
    options: {
      data: { nome },
      emailRedirectTo: getAuthRedirectUrl()
    }
  });
  return { data, error };
}

function isExistingAccountSignup(data) {
  return !!(data && data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0);
}

async function sbResendSignupConfirmation(email) {
  if (!email) return { data:null, error:{ message:'Informe seu email para reenviar a confirmação.' } };
  try { localStorage.setItem('v_pending_signup_email', email); } catch(_) {}
  try {
    return await sb.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: getAuthRedirectUrl() }
    });
  } catch(e) {
    return { data:null, error:{ message:e.message || 'Não foi possível reenviar agora.' } };
  }
}

async function sbSignIn(email, password) {
  if (typeof sb === 'undefined' || !sb?.auth) {
    return { data: null, error: { message: 'Servi\u00e7o indispon\u00edvel.' } };
  }
  try {
    var r = await sb.auth.signInWithPassword({ email, password });
    return r;
  } catch (e) {
    return { data: null, error: { message: e.message === 'Failed to fetch' ? 'Sem conex\u00e3o com o servidor.' : (e.message || 'Erro.') } };
  }
}

async function sbSignOut() {
  await sb.auth.signOut();
}

async function sbGetUser() {
  try {
    // getUser may not exist in all Supabase versions — fallback to getSession
    if (typeof sb.auth.getUser === 'function') {
      const { data, error } = await sb.auth.getUser();
      if (error || !data) return null;
      return data.user || null;
    } else {
      const { data } = await sb.auth.getSession();
      return data?.session?.user || null;
    }
  } catch(e) { return null; }
}

// ── Perfil ────────────────────────────
async function sbGetPerfil(userId) {
  const { data, error } = await sb.from('perfis').select('*').eq('id', userId).single();
  if (error) return null;
  return sanitizeDbObject(data);
}

async function sbSavePerfil(userId, perfil) {
  const clean = sanitizeDbObject(perfil || {});
  const { error } = await sb.from('perfis').upsert({ id: userId, ...clean, atualizado_em: new Date().toISOString() });
  return !error;
}

async function sbSaveOnboardingGoal(userId, goal, meta) {
  return sbSavePerfil(userId, {
    objetivo: goal,
    profile_reviewed_at: currentUserId()===userId && APP.profile?.profileSource==='user_confirmed' ? new Date().toISOString() : null,
    restricoes: APP.profile?.restrictions || []
  });
}

// ── Refeições ─────────────────────────
function localDateKey(value) {
  const date = value instanceof Date ? value : new Date(value || Date.now());
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function sbGetRefeicoes(userId) {
  const hoje = localDateKey();
  const { data, error } = await sb.from('refeicoes').select('*').eq('user_id', userId).eq('data', hoje).order('hora');
  if (error) throw error;
  return sanitizeDbObject(data || []);
}

async function sbAddRefeicao(userId, refeicao) {
  const hoje = localDateKey();
  const clean = sanitizeDbObject(refeicao || {});
  const { data, error } = await sb.from('refeicoes').insert({ user_id: userId, data: hoje, ...clean }).select('*').single();
  if (error) throw error;
  return sanitizeDbObject(data);
}

async function sbUpdateRefeicao(userId, refeicaoId, refeicao) {
  if (!userId || !refeicaoId) throw new Error('Refeição sem identidade persistida.');
  const clean = sanitizeDbObject(refeicao || {});
  const { data, error } = await sb.from('refeicoes')
    .update(clean)
    .eq('id', refeicaoId)
    .eq('user_id', userId)
    .select('*')
    .single();
  if (error) throw error;
  return sanitizeDbObject(data);
}

async function sbDeleteRefeicao(userId, refeicaoId) {
  if (!userId || !refeicaoId) throw new Error('Refeição sem identidade persistida.');
  const { data, error } = await sb.from('refeicoes')
    .delete()
    .eq('id', refeicaoId)
    .eq('user_id', userId)
    .select('id')
    .single();
  if (error) throw error;
  return data?.id === refeicaoId;
}

async function sbGetRefeicoesPeriodo(userId, startDate, endDate) {
  const { data, error } = await sb.from('refeicoes')
    .select('*')
    .eq('user_id', userId)
    .gte('data', startDate)
    .lte('data', endDate)
    .order('data')
    .order('hora');
  if (error) throw error;
  return sanitizeDbObject(data || []);
}

// ── Hidratação ────────────────────────
async function sbGetAgua(userId) {
  const hoje = localDateKey();
  const { data } = await sb.from('hidratacao').select('*').eq('user_id', userId).eq('data', hoje).single();
  return data?.copos || 0;
}

async function sbSaveAgua(userId, copos) {
  const hoje = localDateKey();
  await sb.from('hidratacao').upsert({
    user_id: userId, data: hoje, copos,
    ml: copos * 250, atualizado_em: new Date().toISOString()
  }, { onConflict: 'user_id,data' });
}

// ── Peso ──────────────────────────────
async function sbGetPesos(userId) {
  const { data } = await sb.from('peso_historico').select('*').eq('user_id', userId).order('data', { ascending: false }).limit(30);
  return (data || []).map(r => ({ date: new Date(r.data+'T12:00:00').toLocaleDateString({pt:'pt-BR',en:'en-US',es:'es-ES',ru:'ru-RU'}[getUserLanguage()]||'en-US', {day:'2-digit',month:'2-digit'}), peso: r.peso })).reverse();
}

async function sbGetHydrationPeriodo(userId,from,to) {
  const {data,error}=await sb.from('hidratacao').select('data,copos').eq('user_id',userId).gte('data',from).lte('data',to).order('data');
  if(error)throw error;
  return data||[];
}

async function sbAddPeso(userId, peso) {
  const hoje = localDateKey();
  const { error } = await sb.from('peso_historico').insert({ user_id: userId, peso, data: hoje });
  return !error;
}

// ── Gamificação ───────────────────────
async function sbGetGamificacao(userId) {
  const { data, error } = await sb.from('gamificacao').select('*').eq('user_id', userId).single();
  if (!error) window.VitaliaDaily?.rememberGamification?.(data, userId);
  return data || { xp: 0, streak: 0 };
}

async function sbSaveGamificacao(userId, xp, streak) {
  const hoje = localDateKey();
  await sb.from('gamificacao').upsert({
    user_id: userId, xp, streak,
    ultimo_registro: hoje, atualizado_em: new Date().toISOString()
  }, { onConflict: 'user_id' });
}

async function sbSaveHumor(userId, humor) {
  const hoje = localDateKey();
  const cleanHumor = sanitizeDbString(humor, 20);
  await sb.from('humor').insert({
    user_id: userId,
    data: hoje,
    emoji: cleanHumor
  });
}

async function sbRecordConsent(userId, meta) {
  const payload = {
    user_id: userId,
    terms_version: CONFIG.TERMS_VERSION,
    privacy_version: CONFIG.PRIVACY_VERSION,
    health_data_consent: true,
    ai_processing_consent: true,
    language: APP.lang || 'pt',
    metadata: sanitizeDbObject(meta || {})
  };
  const { error } = await sb.from('privacy_consents').insert(payload);
  if (error) throw error;
}

// ── Sincronização ─────────────────────
async function syncFromSupabase(userId) {
  try {
    var authName = APP.user?.name || APP.user?.email?.split('@')[0] || 'Usuário';
    const [perfil, agua, pesos, gami, refeicoes] = await Promise.all([
      sbGetPerfil(userId),
      sbGetAgua(userId),
      sbGetPesos(userId),
      sbGetGamificacao(userId),
      sbGetRefeicoes(userId)
    ]);
    // A late response from a previous account must never replace current state.
    if (currentUserId() !== userId) return;

    APP.profile = normalizeUserProfile(perfil,authName);
    APP.calc = calcProfile(APP.profile);

    APP.water = agua || 0;
    APP.weightHistory = Array.isArray(pesos) ? pesos : [];
    APP.xp = gami.xp || 0;
    APP.streak = gami.streak || 0;
    APP.meals = (refeicoes || []).map(r => ({
      id: r.id, persisted: true,
      name: r.nome, emoji: r.emoji || '🍽️',
      kcal: r.calorias || 0, prot: r.proteina || 0,
      carb: r.carbo || 0, fat: r.gordura || 0,
      quantity: Number(r.quantidade ?? 1), date: r.data,
      time: r.hora?.slice(0,5) || '12:00', type: r.tipo || 'lunch'
    }));
    try {
      var scopedLanguage = null;
      try { scopedLanguage = localStorage.getItem(userScopedKey('v_lang', userId)); } catch (_) {}
      var profileLanguage = perfil?.language;
      saveUserLanguage(VITALIA_CLINICAL.normalizeClinicalLang(scopedLanguage || profileLanguage || getUserLanguage(userId)), userId);
      coachMemoryService().saveMemory(userId, 'profile', APP.profile, { silent:true });
      coachMemoryService().saveMemory(userId, 'nutrition_sync', { meals:APP.meals.length, water:APP.water, calc:APP.calc }, { silent:true });
    } catch(_) {}

    clearSensitiveLocalCache();
    APP.cloudReady = true;
  } catch (e) {
    console.warn('Sync error:', e);
    toastFriendlyError('sync', e);
  }
}

async function syncToSupabase() {
  const owner=currentUserId();
  const user = await sbGetUser();
  if (!user || user.id!==owner || currentUserId()!==owner) return;
  try {
    await Promise.all([
      sbSaveAgua(user.id, APP.water),
      sbSaveGamificacao(user.id, APP.xp, APP.streak),
    ]);
    if (currentUserId() !== owner) return;
    if (APP.profile) {
      await sbSavePerfil(user.id, {
        nome: APP.profile.name,
        peso: APP.profile.weight,
        altura: APP.profile.height,
        idade: APP.profile.age,
        genero: APP.profile.gender,
        objetivo: APP.profile.goal,
        atividade: APP.profile.activity,
        email: APP.user?.email
      });
    }
  } catch (e) {
    console.warn('[sync] save_failed');
    toastFriendlyError('sync-save', e);
  }
}

// Auto-sync a cada 30 segundos
setInterval(syncToSupabase, 30000);
