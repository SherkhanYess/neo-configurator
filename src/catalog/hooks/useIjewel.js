import { useRef, useCallback, useState, useMemo } from 'react';
const FILE_ID  = 'MBYHa_BtQluSyH-pAufiAg';
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

export function useIjewel() {
  const ringRef   = useRef(null);
  const matRef    = useRef(null);
  const viewerRef = useRef(null);

  const [isReady,      setIsReady]      = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [tick, setTick]                 = useState(0);

  const isReadyRef = useRef(false);
  const pendingRef = useRef([]);
  const lastRef    = useRef({});
  isReadyRef.current = isReady;

  const bump = useCallback(() => setTick((t) => t + 1), []);

  // Live reads from refs — recompute whenever tick changes (same pattern as iJewel's own renderUI)
  const shankVariations   = useMemo(() => readShankVariations(ringRef.current),              [tick]); // eslint-disable-line react-hooks/exhaustive-deps
  const gem1Options       = useMemo(() => readGroupOptions(matRef.current, ['центрального', 'gem1', 'center', 'central'], true),        [tick]); // eslint-disable-line react-hooks/exhaustive-deps
  const gem2Options       = useMemo(() => readGroupOptions(matRef.current, ['боковых', 'gem2', 'side', 'scatter', 'россып'], true),      [tick]); // eslint-disable-line react-hooks/exhaustive-deps
  const shankMetalOptions = useMemo(() => readGroupOptions(matRef.current, ['шинки', 'shank', 'band', 'ring', 'metal shank'], false),     [tick]); // eslint-disable-line react-hooks/exhaustive-deps
  const castMetalOptions  = useMemo(() => readGroupOptions(matRef.current, ['каста', 'cast', 'head metal', 'setting', 'prong'], false),   [tick]); // eslint-disable-line react-hooks/exhaustive-deps

  const debugInfo = useMemo(() => { // eslint-disable-line react-hooks/exhaustive-deps
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
          } catch (_) {}
          return _orig(obj, mult, dur, ease, opts);
        };
      }

      const bumpAndFit = () => { bump(); };
      if (ringRef.current) ringRef.current.addEventListener('componentProcessed', bumpAndFit);
      if (matRef.current) {
        matRef.current.addEventListener('deserialize', bump);
        matRef.current.addEventListener('refreshUi',  bump);
      }
      try { viewer.scene?.addEventListener('addSceneObject', bump); } catch (_) {}

      setIsReady(true);
      pendingRef.current.forEach((fn) => { try { fn(); } catch (_) {} });
      pendingRef.current = [];
      bump();

      let attempts = 0;
      const poll = setInterval(() => {
        bump();
        if (++attempts >= 20) clearInterval(poll);
      }, 500);
    };

    // If a viewer already exists (container is persistent, canvas never moved),
    // just re-hook the refs — no DOM manipulation, no model reload.
    const existingViewer = window.webGiViewers?.[0];
    if (existingViewer) {
      setupViewer(existingViewer);
      return;
    }

    // First load: SDK fires ijewel-viewer-ready once when model is ready.
    window.addEventListener('ijewel-viewer-ready', ({ detail }) => {
      setupViewer(detail.viewer);
    }, { once: true });

    ijewelViewer.loadModelById(FILE_ID, INSTANCE, containerEl, {
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
  const applyInitial = useCallback(async ({ shapeTag, castTag, shankName }) => {
    try {
      const heads = getComponent('head');
      if (heads && shapeTag) {
        // Register the default (round+classic) so RC knows what to replace
        const defaultHead = heads.variations?.find(
          x => matchTag(x, 'shape: round') && matchTag(x, 'cast: classic')
        ) ?? heads.variations?.[0];
        if (defaultHead) await applyVariation(heads, defaultHead);

        const v = heads.variations?.find(x => matchTag(x, shapeTag) && matchTag(x, castTag));
        if (v && v !== defaultHead) {
          lastRef.current.head = `${shapeTag ?? ''}|${castTag ?? ''}`;
          await applyVariation(heads, v);
        }
      }

      const shanks = getComponent('shank');
      if (shanks && shankName) {
        // Register the default shank (Sirius) so RC knows what to replace
        const defaultShank = shanks.variations?.find(
          x => (x.title ?? x.name ?? '').replace('.glb', '').toLowerCase() === 'sirius'
        ) ?? shanks.variations?.[0];
        if (defaultShank) await applyVariation(shanks, defaultShank);

        const v = shanks.variations?.find(
          x => (x.title ?? x.name ?? '').replace('.glb', '') === shankName
        );
        if (v && v !== defaultShank) {
          lastRef.current.shank = shankName;
          await applyVariation(shanks, v);
        }
      }
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
  }, [run]); // eslint-disable-line react-hooks/exhaustive-deps

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
  }, [run]); // eslint-disable-line react-hooks/exhaustive-deps

  const applyCastMetal = useCallback((uuid) => {
    if (!uuid || lastRef.current.castMetal === uuid) return;
    run(async () => {
      const group = getMaterialGroup(['каста', 'cast', 'head metal', 'setting', 'prong']);
      if (!group || !matRef.current) return;
      lastRef.current.castMetal = uuid;
      await matRef.current.applyVariation(group, uuid);
    });
  }, [run]); // eslint-disable-line react-hooks/exhaustive-deps

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
  }, [run]); // eslint-disable-line react-hooks/exhaustive-deps

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
          try { await mat.applyVariation(group, partial.uuid); } catch (_) {
            try { await mat.applyVariation(group, partial); } catch (_2) {}
          }
          return;
        }

        try {
          await mat.applyVariation(group, item.uuid);
        } catch (_) {
          try { await mat.applyVariation(group, item); } catch (_2) {}
        }
      };

      await applyLabel(['центрального', 'gem1', 'center', 'central'], gem1Label, true);
      await applyLabel(['боковых', 'gem2', 'side', 'scatter', 'россып'], gem2Label, true);
      await applyLabel(['шинки', 'shank', 'band', 'ring', 'metal shank'], metalLabel, false);
      await applyLabel(['каста', 'cast', 'head metal', 'setting', 'prong'], castMetalLabel || metalLabel, false);
    });
  }, [run]); // eslint-disable-line react-hooks/exhaustive-deps

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

  return {
    init, isReady, isConfigured, resetConfigured, fitScene, startInteractionHint,
    shankVariations, gem1Options, gem2Options, shankMetalOptions, castMetalOptions,
    debugInfo,
    applyInitial, applyHead, applyCarat, applyShankMetal, applyCastMetal, applyGem,
    restoreFromLabels,
  };
}
