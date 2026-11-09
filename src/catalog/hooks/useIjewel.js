import { useRef, useCallback, useState, useMemo, useEffect } from 'react';
export const RING_FILE_ID   = 'MBYHa_BtQluSyH-pAufiAg';
const INSTANCE = 'neodiamondkz';

const normalizeTag = (t) => (t ?? '').replace(/:\s*/, ': ').toLowerCase().trim();

const METAL_RU = {
  'white gold':  'Белое золото',
  'yellow gold': 'Жёлтое золото',
  'rose gold':   'Розовое золото',
  'white':       'Белое',
  'yellow':      'Жёлтое',
  'rose':        'Розовое',
};

const GEM_RU = {
  'white':   'Белый',
  'greem':   'Зелёный',
  'green':   'Зелёный',
  'yellow':  'Жёлтый',
  'pink':    'Розовый',
  'blue':    'Синий',
  'ruby':    'Рубин',
  'red':     'Красный',
  'purple':  'Фиолетовый',
  'black':   'Чёрный',
  'orange':  'Оранжевый',
};

export const LABEL_COLORS = {
  // Gems
  'Белый':       '#E8ECF5',
  'Зелёный':     '#3DAA6E',
  'Жёлтый':      '#F0C93A',
  'Розовый':     '#F07A9E',
  'Синий':       '#4A80C4',
  'Рубин':       '#C0182B',
  'Красный':     '#C0182B',
  'Фиолетовый':  '#7B52C4',
  'Чёрный':      '#222',
  'Оранжевый':   '#E8803A',
  // Metals
  'Белое золото':  '#CDD2DB',
  'Жёлтое золото': '#D4A843',
  'Розовое золото':'#D4967A',
  'Белое':  '#CDD2DB',
  'Жёлтое': '#D4A843',
  'Розовое':'#D4967A',
};

function humanizeLabel(raw, isGem) {
  if (!raw) return raw;
  const lower = raw.toLowerCase().replace('.dmat', '');
  if (!isGem) {
    if (METAL_RU[lower]) return METAL_RU[lower];
  }
  // Try gem color extraction from filename like "2_gem_diamond_pink_2_abc123.dmat"
  for (const [key, label] of Object.entries(isGem ? GEM_RU : METAL_RU)) {
    if (lower.includes(key)) return label;
  }
  // Capitalize first word as fallback
  return raw.replace('.dmat', '').split(/[_\s]/)[0];
}

// Pure functions — read directly from plugin refs, no state involved
function readGroupOptions(mat, hints, isGem = false) {
  if (!mat?.variations?.length) return [];
  const hintList = Array.isArray(hints) ? hints : [hints];
  const group = mat.variations.find((g) => {
    const t = (g.title ?? g.name ?? '').toLowerCase();
    return hintList.some((h) => t.includes(h.toLowerCase()));
  });
  if (!group) return [];
  const idx = mat.variations.indexOf(group);
  const items = (mat.options?.[idx]?.length ? mat.options[idx] : null) ?? group.materials ?? [];
  return items.map((m) => {
    const rawLabel = m.userData?.label ?? m.title ?? m.name ?? m.uuid;
    return {
      uuid:  m.uuid,
      label: humanizeLabel(rawLabel, isGem),
    };
  });
}

function readShankVariations(ring) {
  if (!ring?.components?.length) return [];
  const list = ring.components;
  const shank = list.find(
    (c) => c.name?.toLowerCase().includes('shank') || c.title?.toLowerCase().includes('shank')
  );
  if (!shank?.variations?.length) return [];
  return shank.variations.map((v) => {
    const name = (v.title ?? v.name ?? '').replace('.glb', '');
    return { id: name, label: name };
  });
}

export function useIjewel(fileId = RING_FILE_ID) {
  const ringRef   = useRef(null);
  const matRef    = useRef(null);
  const viewerRef = useRef(null);

  const [isReady,      setIsReady]      = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [tick, setTick]                 = useState(0);

  const isReadyRef = useRef(false);
  const pollRef    = useRef(null);
  // Шинка: движок уже знает, какая стоит (первая «двойная подстановка»
  // сделана), и заранее подставленная на ленте — см. prepare.
  const shankKnownRef = useRef(false);
  const prepRef       = useRef({ running: null, wanted: null });
  const pendingRef = useRef([]);
  const lastRef    = useRef({});
  isReadyRef.current = isReady;

  // Always up-to-date fileId — avoids stale closure in init useCallback
  const fileIdRef = useRef(fileId);
  fileIdRef.current = fileId;

  // When category changes (fileId changes), reset all plugin refs and state
  // so the hook is clean for the new model that will be loaded.
  useEffect(() => {
    ringRef.current   = null;
    matRef.current    = null;
    viewerRef.current = null;
    pendingRef.current = [];
    lastRef.current   = {};
    shankKnownRef.current = false;
    setIsReady(false);
    setIsConfigured(false);
  }, [fileId]);

  const bump = useCallback(() => setTick((t) => t + 1), []);
  useEffect(() => () => clearInterval(pollRef.current), []);

  // Live reads from refs — recompute whenever tick changes (same pattern as iJewel's own renderUI)
  const shankVariations   = useMemo(() => readShankVariations(ringRef.current),              [tick]); // eslint-disable-line react-hooks/exhaustive-deps
  // Hints cover both ring names (шинки/shank) and pusety/earring names (metal/gold/earring)
  const gem1Options       = useMemo(() => readGroupOptions(matRef.current, ['центрального', 'gem1', 'center', 'central', 'diamond', 'gem'], true),                             [tick]); // eslint-disable-line react-hooks/exhaustive-deps
  const gem2Options       = useMemo(() => readGroupOptions(matRef.current, ['боковых', 'gem2', 'side', 'scatter', 'россып'], true),                                            [tick]); // eslint-disable-line react-hooks/exhaustive-deps
  const shankMetalOptions = useMemo(() => readGroupOptions(matRef.current, ['шинки', 'shank', 'band', 'ring', 'metal shank', 'metal', 'gold', 'earring', 'пусет'], false),    [tick]); // eslint-disable-line react-hooks/exhaustive-deps
  const castMetalOptions  = useMemo(() => readGroupOptions(matRef.current, ['каста', 'cast', 'head metal', 'setting', 'prong'], false),                                        [tick]); // eslint-disable-line react-hooks/exhaustive-deps

  const debugInfo = useMemo(() => {
    if (!new URLSearchParams(window.location.search).get('debug')) return null;
    const mat = matRef.current;
    return {
      components: (ringRef.current?.components ?? []).map((c) => ({
        name: c.name, title: c.title,
        variations: c.variations?.map((v) => ({ name: v.name, title: v.title, tags: v.tags })),
      })),
      materials: (mat?.variations ?? []).map((g, gi) => ({
        title: g.title ?? g.name,
        options: ((mat.options?.[gi]?.length ? mat.options[gi] : null) ?? g.materials ?? [])
          .map((m) => m.userData?.label ?? m.title ?? m.name ?? m.uuid),
      })),
    };
  }, [tick]); // eslint-disable-line react-hooks/exhaustive-deps

  const getComponent = (hint) => {
    const list = ringRef.current?.components ?? [];
    return list.find(
      (c) =>
        c.name?.toLowerCase().includes(hint.toLowerCase()) ||
        c.title?.toLowerCase().includes(hint.toLowerCase())
    );
  };

  const getMaterialGroup = (hints) => {
    const list = Array.isArray(hints) ? hints : [hints];
    return (matRef.current?.variations ?? []).find((g) => {
      const t = (g.title ?? g.name ?? '').toLowerCase();
      return list.some((h) => t.includes(h.toLowerCase()));
    });
  };

  const init = useCallback((containerEl) => {
    if (!containerEl || !window.ijewelViewer) return;

    let setupDone = false;

    const setupViewer = (viewer) => {
      if (setupDone) return;
      setupDone = true;

      viewerRef.current = viewer;
      ringRef.current = viewer.getPluginByType('RingConfigurator');
      matRef.current  = viewer.getPluginByType('MaterialConfiguratorPlugin');

      // Camera override — intercept animateToFitObject so the ring always
      // lands at the designer's saved camera pose instead of auto-fitting.
      const cameraViews = viewer.getPluginByType('CameraViews');
      if (cameraViews && !cameraViews.__nd_patched) {
        cameraViews.__nd_patched = true;
        const _orig = cameraViews.animateToFitObject.bind(cameraViews);
        cameraViews.animateToFitObject = async function(obj, mult, dur, ease, opts) {
          if (this.camViews?.length > 0) {
            return this.animateToView(this.camViews[0], dur ?? 600, ease);
          }
          try {
            const editorPlugin = viewer.getPluginByType('IjewelEditorPlugin');
            const camCfg = editorPlugin?.project?.cameraConfig;
            if (camCfg?.position && camCfg?.target) {
              const view = this.getCurrentCameraView?.();
              if (view?.position?.set) {
                view.position.set(camCfg.position.x, camCfg.position.y, camCfg.position.z);
                if (view.target?.set) {
                  view.target.set(camCfg.target.x, camCfg.target.y, camCfg.target.z);
                } else {
                  Object.assign(view.target, camCfg.target);
                }
                return this.animateToView(view, dur ?? 600, ease);
              }
            }
          } catch { /* не критично для просмотра */ }
          return _orig(obj, mult, dur, ease, opts);
        };
      }

      // Подписки — один раз на просмотрщик. Раньше каждый заход на страницу
      // модели добавлял ещё по обработчику: после десятка моделей каждое
      // событие 3D перерисовывало страницу десяток раз.
      if (!viewer.__nd_listening) {
        viewer.__nd_listening = true;
        ringRef.current?.addEventListener('componentProcessed', bump);
        matRef.current?.addEventListener('deserialize', bump);
        matRef.current?.addEventListener('refreshUi', bump);
        try { viewer.scene?.addEventListener('addSceneObject', bump); } catch { /* в этой версии SDK нет события */ }
      }

      setIsReady(true);
      pendingRef.current.forEach((fn) => { try { fn(); } catch { /* не критично для просмотра */ } });
      pendingRef.current = [];
      bump();

      // Варианты в плагинах появляются не сразу — 10 секунд перечитываем их.
      // Прошлый опрос (быстро открыли следующую модель) — останавливаем.
      clearInterval(pollRef.current);
      let attempts = 0;
      pollRef.current = setInterval(() => {
        bump();
        if (++attempts >= 20) clearInterval(pollRef.current);
      }, 500);
    };

    const currentFileId = fileIdRef.current;

    // If the same model is already loaded, just re-hook refs — no reload.
    const existingViewer = window.webGiViewers?.[0];
    if (existingViewer && window.__nd_viewer_file_id === currentFileId) {
      setupViewer(existingViewer);
      return;
    }

    // Different model (category switch) — dispose old viewer and reload.
    if (existingViewer && window.__nd_viewer_file_id !== currentFileId) {
      try { existingViewer.dispose?.(); } catch { /* не критично для просмотра */ }
      if (window.webGiViewers) window.webGiViewers.length = 0;
      containerEl.innerHTML = '';
    }

    window.__nd_viewer_file_id = currentFileId;

    // First load / reload: SDK fires ijewel-viewer-ready when model is ready.
    window.addEventListener('ijewel-viewer-ready', ({ detail }) => {
      setupViewer(detail.viewer);
    }, { once: true });

    window.ijewelViewer.loadModelById(currentFileId, INSTANCE, containerEl, {
      showConfigurator: false,
      showCard: false,
      showLogo: false,
      useIjewelLogo: false,
      brandingSettings: { enable: false, showLoadingScreenLogo: false },
      hideQuality: true,
      transparentBg: false,
      hideFullScreen: true,
      hideFitScene: true,
      hideCameraViews: true,
      hideRotateCamera: true,
      hideResetView: true,
      hideGltfAnimations: true,
      runRotateCamera: false,
    });

    // Safety fallback in case the event misfires (very first load edge case).
    let fallbackAttempts = 0;
    const fallbackPoll = setInterval(() => {
      if (setupDone) { clearInterval(fallbackPoll); return; }
      const v = window.webGiViewers?.[0];
      if (v) { clearInterval(fallbackPoll); setupViewer(v); }
      if (++fallbackAttempts > 60) clearInterval(fallbackPoll);
    }, 100);
  }, [bump]);

  const run = useCallback((fn) => {
    if (!isReadyRef.current) { pendingRef.current.push(fn); return; }
    try { fn(); } catch (e) { console.warn('[iJewel]', e); }
  }, []);

  const matchTag = (v, tag) => {
    if (!tag) return true;
    return (v.tags ?? []).map(normalizeTag).includes(normalizeTag(tag));
  };

  const applyVariation = async (component, variation) => {
    const ring = ringRef.current;
    if (ring?.applyVariation) {
      await ring.applyVariation(component, variation);
    } else {
      await component.applyVariation(variation);
    }
  };

  // Applies head (shape+cast) then shank sequentially — one fully completes before the next
  // starts. Only then sets isConfigured→true so the ring reveals without visual overlap.
  //
  // "Double-tap" pattern: the SDK's RingConfigurator tracks which variation is currently
  // active so it knows what to HIDE when the next one is applied. On first open, the base
  // model (round+classic+sirius) was loaded via loadModelById OUTSIDE the variation system,
  // so RC has nothing registered as "current" — applyVariation adds the new variation ON TOP
  // instead of replacing. Fix: apply the default variation first to register it, then apply
  // the desired one so RC correctly hides the default and shows only the target.
  //
  // Головка подставляется за ~10 мс — для неё всё как было: каждый раз сначала
  // по умолчанию, потом нужная. Шинка — дорогая (Neo ~3 с), поэтому для неё
  // «двойная подстановка» делается один раз (движок запомнил текущую), а нужная
  // ставится, только если стоит другая (ensureShank).
  const shankName = (x) => (x.title ?? x.name ?? '').replace('.glb', '');

  const ensureShank = async (name) => {
    const shanks = getComponent('shank');
    if (!shanks || !name) return;
    if (!shankKnownRef.current) {
      const defaultShank = shanks.variations?.find(x => shankName(x).toLowerCase() === 'sirius') ?? shanks.variations?.[0];
      if (defaultShank) {
        await applyVariation(shanks, defaultShank);
        lastRef.current.shank = shankName(defaultShank);
      }
      shankKnownRef.current = true;
    }
    if (lastRef.current.shank === name) return;
    const v = shanks.variations?.find(x => shankName(x) === name);
    if (v) {
      await applyVariation(shanks, v);
      lastRef.current.shank = name;
    }
  };

  // Заранее, пока человек в ленте: подставить шинку модели, на которой он
  // задержался или которой коснулся, — к нажатию она уже стоит. Берётся
  // последняя просьба: пролистал дальше — готовится уже следующая.
  const prepare = useCallback((name) => {
    if (!isReadyRef.current || !name) return;
    prepRef.current.wanted = name;
    if (prepRef.current.running) return;
    prepRef.current.running = (async () => {
      while (prepRef.current.wanted) {
        const next = prepRef.current.wanted;
        prepRef.current.wanted = null;
        try { await ensureShank(next); } catch (e) { console.warn('[iJewel prepare]', e); }
      }
      prepRef.current.running = null;
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const applyInitial = useCallback(async ({ shapeTag, castTag, shankName: targetShank }) => {
    // Начатую на ленте подготовку дожидаемся (две подстановки разом движок
    // путает), очередную — отменяем.
    prepRef.current.wanted = null;
    if (prepRef.current.running) await prepRef.current.running;
    try {
      const heads = getComponent('head');
      if (heads && shapeTag) {
        // Register the default (round+classic) so RC knows what to replace
        const defaultHead = heads.variations?.find(
          x => matchTag(x, 'shape: round') && matchTag(x, 'cast: classic')
        ) ?? heads.variations?.[0];
        if (defaultHead) {
          await applyVariation(heads, defaultHead);
          // Сцена теперь с головкой по умолчанию — так и запоминаем. Раньше
          // память оставалась от прошлой модели, и выбор той же огранки на
          // новой модели не срабатывал.
          lastRef.current.head = 'shape: round|cast: classic';
        }

        const v = heads.variations?.find(x => matchTag(x, shapeTag) && matchTag(x, castTag));
        if (v && v !== defaultHead) {
          lastRef.current.head = `${shapeTag ?? ''}|${castTag ?? ''}`;
          await applyVariation(heads, v);
        }
      }

      await ensureShank(targetShank);
    } finally {
      await new Promise(r => setTimeout(r, 350));
      setIsConfigured(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // For user-triggered shape changes (shape picker).
  const applyHead = useCallback((shapeTag, castTag) => {
    const key = `${shapeTag ?? ''}|${castTag ?? ''}`;
    if (!shapeTag && !castTag) return;
    if (lastRef.current.head === key) return;
    run(async () => {
      const heads = getComponent('head');
      if (!heads) return;
      const v = heads.variations?.find(x => matchTag(x, shapeTag) && matchTag(x, castTag));
      if (!v) return;
      lastRef.current.head = key;
      await applyVariation(heads, v);
    });
  }, [run]);

  const applyCarat = useCallback((carat) => {
    const tag = `size: ${carat}ct`;
    if (lastRef.current.carat === tag) return;
    run(async () => {
      const heads = getComponent('head');
      if (!heads) return;
      const v = heads.variations?.find(x =>
        (x.tags ?? []).map(normalizeTag).includes(normalizeTag(tag))
      );
      if (!v) return;
      lastRef.current.carat = tag;
      await applyVariation(heads, v);
    });
  }, [run]);

  const applyShankMetal = useCallback((uuid) => {
    if (!uuid || lastRef.current.shankMetal === uuid) return;
    // Reset cast cache so sync can apply new cast UUID even if color was previously set
    lastRef.current.castMetal = null;
    run(async () => {
      const group = getMaterialGroup(['шинки', 'shank', 'band', 'ring', 'metal shank']);
      if (!group || !matRef.current) return;
      lastRef.current.shankMetal = uuid;
      await matRef.current.applyVariation(group, uuid);
    });
  }, [run]);

  const applyCastMetal = useCallback((uuid) => {
    if (!uuid || lastRef.current.castMetal === uuid) return;
    run(async () => {
      const group = getMaterialGroup(['каста', 'cast', 'head metal', 'setting', 'prong']);
      if (!group || !matRef.current) return;
      lastRef.current.castMetal = uuid;
      await matRef.current.applyVariation(group, uuid);
    });
  }, [run]);

  const applyGem = useCallback((slot, uuid) => {
    const hints = slot === 'gem1'
      ? ['центрального', 'gem1', 'center', 'central']
      : ['боковых', 'gem2', 'side', 'scatter', 'россып'];
    const key = `gem_${slot}`;
    if (!uuid || lastRef.current[key] === uuid) return;
    run(async () => {
      const group = getMaterialGroup(hints);
      if (!group || !matRef.current) return;
      lastRef.current[key] = uuid;
      await matRef.current.applyVariation(group, uuid);
    });
  }, [run]);

  // Restore all colors from human-readable labels (for SharePage).
  // Runs sequentially, logs everything to console for diagnostics,
  // tries both uuid and full material object in applyVariation.
  const restoreFromLabels = useCallback(({ gem1Label, gem2Label, metalLabel, castMetalLabel }) => {
    run(async () => {
      const mat = matRef.current;
      if (!mat) return;

      const applyLabel = async (hints, label, isGem) => {
        if (!label) return;
        const groupList = mat.variations ?? [];
        const group = groupList.find((g) => {
          const t = (g.title ?? g.name ?? '').toLowerCase();
          return hints.some((h) => t.includes(h.toLowerCase()));
        });
        if (!group) return;

        const idx = groupList.indexOf(group);
        const items = (mat.options?.[idx]?.length ? mat.options[idx] : null) ?? group.materials ?? [];

        const item = items.find((m) =>
          humanizeLabel(m.userData?.label ?? m.title ?? m.name ?? m.uuid, isGem) === label
        );
        if (!item) {
          // Partial fallback: first word match
          const partial = items.find((m) => {
            const lbl = humanizeLabel(m.userData?.label ?? m.title ?? m.name ?? m.uuid, isGem);
            return lbl?.split(' ')[0]?.toLowerCase() === label?.split(' ')[0]?.toLowerCase();
          });
          if (!partial) return;
          try { await mat.applyVariation(group, partial.uuid); } catch {
            try { await mat.applyVariation(group, partial); } catch { /* не критично для просмотра */ }
          }
          return;
        }

        try {
          await mat.applyVariation(group, item.uuid);
        } catch {
          try { await mat.applyVariation(group, item); } catch { /* не критично для просмотра */ }
        }
      };

      await applyLabel(['центрального', 'gem1', 'center', 'central'], gem1Label, true);
      await applyLabel(['боковых', 'gem2', 'side', 'scatter', 'россып'], gem2Label, true);
      await applyLabel(['шинки', 'shank', 'band', 'ring', 'metal shank'], metalLabel, false);
      await applyLabel(['каста', 'cast', 'head metal', 'setting', 'prong'], castMetalLabel || metalLabel, false);
    });
  }, [run]);

  // Start the idle interaction hint animation via official InteractionPromptPlugin API.
  // The plugin is disabled at init via hideRotateCamera:true → plugin.disable("local").
  // Re-enable with plugin.enable("local") then call startAnimation().
  const startInteractionHint = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    try {
      const plugin = viewer.getPluginByType('InteractionPromptPlugin');
      if (!plugin) return;
      plugin.enable('local');
      plugin.startAnimation();
    } catch (e) { console.warn('[iJewel hint]', e); }
  }, []);

  // fitToView is intercepted at CameraViews level (see init), so this always gives correct pose.
  const fitScene = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    try { viewer.fitToView(); } catch (e) { console.warn('[iJewel fitScene]', e); }
  }, []);

  const resetConfigured = useCallback(() => setIsConfigured(false), []);

  // Сцена рисует, только пока её видно: на ленте (прогретая заранее или после
  // возврата со страницы модели) она спит и не тратит процессор и батарею.
  const setRendering = useCallback((on) => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    try {
      viewer.renderEnabled = on;
      if (on) viewer.setDirty?.();
    } catch (e) { console.warn('[iJewel render]', e); }
  }, []);

  return {
    init, isReady, isConfigured, resetConfigured, fitScene, startInteractionHint, setRendering, prepare,
    shankVariations, gem1Options, gem2Options, shankMetalOptions, castMetalOptions,
    debugInfo,
    applyInitial, applyHead, applyCarat, applyShankMetal, applyCastMetal, applyGem,
    restoreFromLabels,
  };
}
