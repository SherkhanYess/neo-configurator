import { useRef, useCallback, useState, useMemo } from 'react';
import { FILE_ID, INSTANCE } from './config.js';

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
  const ringRef = useRef(null);
  const matRef  = useRef(null);

  const [isReady, setIsReady] = useState(false);
  const [tick, setTick]       = useState(0); // incremented on every plugin event → triggers useMemo recompute

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

    window.addEventListener('ijewel-viewer-ready', ({ detail }) => {
      const viewer = detail.viewer;
      ringRef.current = viewer.getPluginByType('RingConfigurator');
      matRef.current  = viewer.getPluginByType('MaterialConfiguratorPlugin');

      // Plugin events
      if (ringRef.current) ringRef.current.addEventListener('componentProcessed', bump);
      if (matRef.current) {
        matRef.current.addEventListener('deserialize', bump);
        matRef.current.addEventListener('refreshUi',  bump);
      }
      // Scene event — fires when ring parts are added (advanced template pattern)
      try { viewer.scene?.addEventListener('addSceneObject', bump); } catch (_) {}

      setIsReady(true);
      pendingRef.current.forEach((fn) => { try { fn(); } catch (_) {} });
      pendingRef.current = [];
      bump();

      // Polling fallback: bump every 500ms for 10s in case events don't fire
      let attempts = 0;
      const poll = setInterval(() => {
        bump();
        if (++attempts >= 20) clearInterval(poll);
      }, 500);
    }, { once: true });
  }, [bump]);

  const run = useCallback((fn) => {
    if (!isReadyRef.current) { pendingRef.current.push(fn); return; }
    try { fn(); } catch (e) { console.warn('[iJewel]', e); }
  }, []);

  const applyHead = useCallback((shapeTag, castTag) => {
    const key = `${shapeTag ?? ''}|${castTag ?? ''}`;
    if (!shapeTag && !castTag) return;
    if (lastRef.current.head === key) return;
    run(async () => {
      const heads = getComponent('head');
      if (!heads) return;
      const matchTag = (v, tag) => {
        if (!tag) return true;
        return (v.tags ?? []).map(normalizeTag).includes(normalizeTag(tag));
      };
      const variation = heads.variations?.find((v) => matchTag(v, shapeTag) && matchTag(v, castTag));
      if (variation) { lastRef.current.head = key; await heads.applyVariation(variation); }
    });
  }, [run]);

  const applyShank = useCallback((name) => {
    if (!name || lastRef.current.shank === name) return;
    run(async () => {
      const shanks = getComponent('shank');
      if (!shanks) return;
      const variation = shanks.variations?.find(
        (v) => (v.title ?? v.name ?? '').replace('.glb', '') === name
      );
      if (variation) { lastRef.current.shank = name; await shanks.applyVariation(variation); }
    });
  }, [run]);

  const applyCarat = useCallback((carat) => {
    const tag = `size: ${carat}ct`;
    if (lastRef.current.carat === tag) return;
    run(async () => {
      const heads = getComponent('head');
      if (!heads) return;
      const variation = heads.variations?.find((v) =>
        (v.tags ?? []).map(normalizeTag).includes(normalizeTag(tag))
      );
      if (variation) { lastRef.current.carat = tag; await heads.applyVariation(variation); }
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

  return {
    init, isReady,
    shankVariations, gem1Options, gem2Options, shankMetalOptions, castMetalOptions,
    debugInfo,
    applyHead, applyShank, applyCarat, applyShankMetal, applyCastMetal, applyGem,
  };
}
