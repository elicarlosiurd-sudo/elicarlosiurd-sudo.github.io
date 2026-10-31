// release.js initializes the release before observability; never overwrite it here.

var vitaliaDefaultObservabilityConfig = {
  SENTRY_DSN_PUBLIC: '',
  SENTRY_ENVIRONMENT: 'production',
  SENTRY_RELEASE: window.VITALIA_APP_VERSION,
  POSTHOG_KEY_PUBLIC: '',
  POSTHOG_HOST: 'https://us.i.posthog.com',
  POSTHOG_ENABLED: false,
  ANALYTICS_ENABLED: false
};

window.VITALIA_OBSERVABILITY_CONFIG = Object.assign(
  {},
  vitaliaDefaultObservabilityConfig,
  window.VITALIA_OBSERVABILITY_CONFIG || {}
);

function vitaliaLoadPublicObservabilityConfig(done) {
  if (!window.fetch) {
    done();
    return;
  }

  window.fetch('./config/observability.qa.json?v=' + encodeURIComponent(window.VITALIA_APP_VERSION || 'dev'), {
    cache: 'no-store',
    credentials: 'same-origin'
  })
    .then(function(response) {
      if (!response || !response.ok) return {};
      return response.json();
    })
    .then(function(publicConfig) {
      window.VITALIA_OBSERVABILITY_CONFIG = Object.assign(
        {},
        vitaliaDefaultObservabilityConfig,
        window.VITALIA_OBSERVABILITY_CONFIG || {},
        publicConfig || {}
      );
    })
    .catch(function() {})
    .then(done);
}

vitaliaLoadPublicObservabilityConfig(function initVitaliaObservability() {
  var cfg = window.VITALIA_OBSERVABILITY_CONFIG || {};
  var allowedEvents = {
    daily_action_completed: true,
    daily_completed: true,
    weekly_plan_accepted: true,
    daily_checkin_submitted: true,
    weekly_review_viewed: true,
    plan_adjustment_accepted: true,
    routine_resumed: true,
    usefulness_feedback_submitted: true,
    app_opened: true,
    auth_viewed: true,
    signup_started: true,
    signup_completed: true,
    login_completed: true,
    coach_opened: true,
    coach_message_sent: true,
    scanner_opened: true,
    recipe_viewed: true,
    premium_cta_clicked: true
  };
  var safePropKeys = {
    app: true,
    app_version: true,
    enabled: true,
    environment: true,
    locale: true,
    mode: true,
    module: true,
    plan: true,
    provider: true,
    reason: true,
    release: true,
    source: true,
    state: true,
    step: true,
    surface: true
  };
  var blockedPropPattern = /(email|e-mail|mail|name|nome|phone|telefone|tel|address|endereco|cpf|rg|document|weight|peso|height|altura|bmi|imc|diet|dieta|symptom|sintoma|mood|humor|medication|medicamento|medicine|coach|message|mensagem|prompt|response|resposta|scanner|food|alimento|meal|refeicao|hydration|hidratacao|fasting|jejum|clinical|clinico|diagnosis|diagnostico|photo|foto|image|imagem|pdf|text|texto|history|historico)/i;

  function isTruthy(value) {
    return value === true || value === 'true' || value === '1' || value === 1;
  }

  var CONSENT_STORAGE_KEY = 'vitalia_privacy_consent';
  var LEGACY_ANALYTICS_CONSENT_KEY = 'vitalia_analytics_consent';
  var POSTHOG_DISTINCT_ID_KEY = 'vitalia_posthog_distinct_id';
  var defaultConsent = {
    necessary: true,
    analytics: false,
    marketing: false,
    communications: false
  };

  function normalizeConsent(value) {
    var input = value && typeof value === 'object' ? value : {};
    return {
      necessary: true,
      analytics: input.analytics === true,
      marketing: input.marketing === true,
      communications: input.communications === true
    };
  }

  function readStoredConsent() {
    try {
      if (!window.localStorage) return defaultConsent;
      var raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
      if (!raw) return defaultConsent;
      return normalizeConsent(JSON.parse(raw));
    } catch (err) {
      return defaultConsent;
    }
  }

  function writeStoredConsent(consent) {
    try {
      if (!window.localStorage) return;
      window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(normalizeConsent(consent)));
    } catch (err) {}
  }

  function getConsent() {
    return readStoredConsent();
  }

  function setConsent(partialConsent) {
    var next = normalizeConsent(Object.assign({}, readStoredConsent(), partialConsent || {}));
    writeStoredConsent(next);
    if (next.analytics === true) {
      try { initPostHog(); } catch (err) {}
    }
    return next;
  }

  function resetConsent() {
    try {
      if (window.localStorage) {
        window.localStorage.removeItem(CONSENT_STORAGE_KEY);
        window.localStorage.removeItem(LEGACY_ANALYTICS_CONSENT_KEY);
      }
    } catch (err) {}
    return getConsent();
  }

  function hasAnalyticsConsent() {
    try {
      if (readStoredConsent().analytics === true) return true;
      return window.localStorage &&
        window.localStorage.getItem(LEGACY_ANALYTICS_CONSENT_KEY) === 'granted';
    } catch (err) {
      return false;
    }
  }

  function loadScript(src, onload) {
    try {
      var script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.onload = onload || function() {};
      script.onerror = function() {};
      document.head.appendChild(script);
    } catch (err) {}
  }

  function sanitizeEventProps(props) {
    var sanitized = {};
    var input = props && typeof props === 'object' ? props : {};
    Object.keys(input).forEach(function(key) {
      if (!safePropKeys[key] || blockedPropPattern.test(key)) return;
      var value = input[key];
      if (typeof value === 'string') {
        sanitized[key] = value.slice(0, 64);
      } else if (typeof value === 'number' && isFinite(value)) {
        sanitized[key] = value;
      } else if (typeof value === 'boolean') {
        sanitized[key] = value;
      }
    });
    sanitized.app_version = window.VITALIA_APP_VERSION || 'unknown';
    return sanitized;
  }

  function scrubSentryEvent(event) {
    if (!event || typeof event !== 'object') return event;
    delete event.user;
    delete event.request;
    delete event.extra;
    delete event.breadcrumbs;
    delete event.logentry;
    delete event.fingerprint;
    // Rebuild rather than retain arbitrary SDK/plugin fields (transactions,
    // spans, attachments and dynamic trace descriptions may contain health data).
    var allowed = ['event_id','timestamp','platform','level','release','environment','exception','message','contexts','tags'];
    Object.keys(event).forEach(function(key){if(allowed.indexOf(key)<0)delete event[key];});
    event.message='VitalIA operational event';
    var operational=event.contexts && event.contexts.vitalia;
    event.contexts={vitalia:typeof safeOperationalMetadata==='function'?safeOperationalMetadata(operational):{}};
    if(event.exception && Array.isArray(event.exception.values))event.exception.values=event.exception.values.map(function(value){
      var types=['Error','TypeError','ReferenceError','RangeError','SyntaxError','URIError','DOMException'];
      var frames=value.stacktrace && Array.isArray(value.stacktrace.frames)?value.stacktrace.frames:[];
      return {type:types.indexOf(value.type)>=0?value.type:'Error',value:'runtime_failure',stacktrace:{frames:frames.map(function(frame){
        var filename=String(frame.filename||'').split('?')[0].split('#')[0].split('/').pop();
        var modules=['boot.js','app-core.js','auth.js','screens.js','coach.js','recipes-data.js','labs.js','wearables.js','progress.js','supabase-client.js','i18n.js','bodytwin.js'];
        return {filename:modules.indexOf(filename)>=0?filename:'runtime',lineno:Number.isInteger(frame.lineno)?frame.lineno:undefined,colno:Number.isInteger(frame.colno)?frame.colno:undefined};
      })}};
    });
    event.tags={app:'vitalia',surface:'pwa'};
    return event;
  }

  function getPostHogDistinctId() {
    try {
      if (window.posthog && typeof window.posthog.get_distinct_id === 'function') {
        var sdkDistinctId = window.posthog.get_distinct_id();
        if (sdkDistinctId) return sdkDistinctId;
      }
    } catch (err) {}

    try {
      if (!window.localStorage) return 'vitalia-anonymous';
      var storedDistinctId = window.localStorage.getItem(POSTHOG_DISTINCT_ID_KEY);
      if (storedDistinctId) return storedDistinctId;
      var generatedDistinctId = 'vitalia-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
      window.localStorage.setItem(POSTHOG_DISTINCT_ID_KEY, generatedDistinctId);
      return generatedDistinctId;
    } catch (err) {
      return 'vitalia-anonymous';
    }
  }

  function capturePostHogEvent(name, payload) {
    if (!isTruthy(cfg.ANALYTICS_ENABLED) || !isTruthy(cfg.POSTHOG_ENABLED) || !cfg.POSTHOG_KEY_PUBLIC) return;
    if (!hasAnalyticsConsent()) return;

    try {
      var apiHost = (cfg.POSTHOG_HOST || 'https://us.i.posthog.com').replace(/\/+$/, '');
      var eventPayload = Object.assign({}, payload, {
        token: cfg.POSTHOG_KEY_PUBLIC,
        distinct_id: getPostHogDistinctId(),
        '$lib': 'web',
        '$lib_version': window.VITALIA_APP_VERSION || 'unknown'
      });
      var body = JSON.stringify({
        event: name,
        properties: eventPayload
      });

      window.__vitaliaPostHogLastCaptureTransport = 'direct';
      if (window.fetch) {
        window.fetch(apiHost + '/e/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: body,
          keepalive: true,
          credentials: 'omit',
          mode: 'cors'
        }).catch(function() {});
        return;
      }

      if (window.navigator && window.navigator.sendBeacon) {
        window.navigator.sendBeacon(apiHost + '/e/', new Blob([body], { type: 'application/json' }));
      }
    } catch (err) {}
  }

  function trackEvent(name, props) {
    try {
      if (!allowedEvents[name]) return false;
      var payload = sanitizeEventProps(props);
      capturePostHogEvent(name, payload);
      if (window.__vitaliaSentryReady && window.Sentry && window.Sentry.addBreadcrumb) {
        window.Sentry.addBreadcrumb({
          category: 'product',
          message: name,
          level: 'info',
          data: payload
        });
      }
      return true;
    } catch (err) {
      return false;
    }
  }

  function initSentry() {
    if (!cfg.SENTRY_DSN_PUBLIC || window.__vitaliaSentryLoading || window.__vitaliaSentryReady) return;
    window.__vitaliaSentryLoading = true;
    loadScript('https://browser.sentry-cdn.com/10.53.1/bundle.min.js', function() {
      try {
        if (!window.Sentry || window.__vitaliaSentryReady) return;
        window.Sentry.init({
          dsn: cfg.SENTRY_DSN_PUBLIC,
          release: window.VITALIA_APP_VERSION,
          environment: cfg.SENTRY_ENVIRONMENT || 'production',
          sendDefaultPii: false,
          sampleRate: 1.0,
          tracesSampleRate: 0,
          beforeSend: scrubSentryEvent
        });
        window.__vitaliaSentryReady = true;
      } catch (err) {}
    });
  }

  function initPostHog() {
    if (!isTruthy(cfg.ANALYTICS_ENABLED) || !isTruthy(cfg.POSTHOG_ENABLED) || !cfg.POSTHOG_KEY_PUBLIC) return;
    if (!hasAnalyticsConsent() || window.__vitaliaPostHogLoading || window.__vitaliaPostHogReady) return;
    window.__vitaliaPostHogLoading = true;
    try {
      var posthog = window.posthog = window.posthog || [];
      posthog._i = posthog._i || [];
      if (!posthog.init) {
        posthog.init = function(token, options, name) {
          var target = name ? (posthog[name] = posthog[name] || []) : posthog;
          target.people = target.people || [];
          target.toString = function() { return name || 'posthog'; };
          posthog._i.push([token, options, name]);
        };
      }
      posthog.init(cfg.POSTHOG_KEY_PUBLIC, {
          api_host: cfg.POSTHOG_HOST || 'https://us.i.posthog.com',
          autocapture: false,
          capture_pageview: false,
          capture_pageleave: false,
          disable_session_recording: true,
          disable_surveys: true,
          advanced_disable_decide: true,
          advanced_disable_feature_flags: true,
          request_batching: false,
          opt_out_capturing_by_default: false,
          loaded: function(posthog) {
            try {
              posthog.opt_in_capturing && posthog.opt_in_capturing();
              posthog.persistence && posthog.persistence.unregister && posthog.persistence.unregister('$initial_referrer');
              posthog.persistence && posthog.persistence.unregister && posthog.persistence.unregister('$initial_referring_domain');
              window.__vitaliaPostHogReady = true;
            } catch (err) {}
          }
        });
    } catch (err) {}
    loadScript('https://cdn.jsdelivr.net/npm/posthog-js@1/dist/array.js');
  }

  try {
    window.VitalIAConsent = {
      getConsent: getConsent,
      setConsent: setConsent,
      hasAnalyticsConsent: hasAnalyticsConsent,
      resetConsent: resetConsent
    };
    window.trackEvent = trackEvent;
    window.vitaliaTrackEvent = trackEvent;
    window.VitalIAObservability = {
      allowedEvents: Object.keys(allowedEvents),
      sanitizeEventProps: sanitizeEventProps,
      trackEvent: trackEvent
    };
    initSentry();
    initPostHog();
    document.addEventListener('DOMContentLoaded', function() {
      trackEvent('app_opened', { surface: 'pwa', source: 'runtime' });
      if (document.getElementById('auth-screen')) {
        trackEvent('auth_viewed', { surface: 'auth', source: 'runtime' });
      }
    });
  } catch (err) {}
});
