import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useConfigurator } from './useConfigurator.js';
import { useIjewel, LABEL_COLORS } from './useIjewel.js';
import { DIAMOND_SHAPES, CAST_DESIGNS } from './config.js';
import { calcPrice, formatPrice } from './priceCalc.js';
import { ViewerPanel } from './components/ViewerPanel.jsx';
import { StepRail } from './components/StepRail.jsx';
import { DiamondShapeStep } from './steps/DiamondShapeStep.jsx';
import { ShankDesignStep } from './steps/ShankDesignStep.jsx';
import { CastDesignStep } from './steps/CastDesignStep.jsx';
import { CaratStep } from './steps/CaratStep.jsx';
import { MetalStep } from './steps/MetalStep.jsx';
import { SummaryStep } from './steps/SummaryStep.jsx';

const LANDING_URL = 'https://neodiamond.kz';

export default function ConfiguratorPage() {
  const cfg    = useConfigurator();
  const ijewel = useIjewel();
  const [prices, setPrices] = useState(null);
  const [leadId, setLeadId] = useState(() => new URLSearchParams(window.location.search).get('lid') || null);

  useEffect(() => {
    const defaults = {
      baseByShank: { 'Neo': 200000, 'Neo Luxe': 250000, 'Sirius': 220000, 'Sirius Luxe': 280000, 'Bezel': 230000 },
      casts: { halo: 30000, bezel: 20000 },
      caratPrice: 200000,
      purity750surcharge: 20000,
      fancyColorSurcharge: 100000,
      scatterFancySurcharge: 150000,
    };
    fetch('/api/get-prices')
      .then(r => r.ok ? r.json() : defaults)
      .then(setPrices)
      .catch(() => setPrices(defaults));
  }, []);

  const choicesRef   = useRef(cfg.choices);
  choicesRef.current = cfg.choices;
  const prevShankRef = useRef(null);

  // Replay all choices into iJewel once it becomes ready
  useEffect(() => {
    if (!ijewel.isReady) return;
    const c = choicesRef.current;
    const s = DIAMOND_SHAPES.find((x) => x.id === c.shape);
    const k = CAST_DESIGNS.find((x) => x.id === c.cast);
    if (s || k) ijewel.applyHead(s?.ijewelTag ?? null, k?.ijewelTag ?? null);
    if (c.shank) ijewel.applyShank(c.shank);
    if (c.carat) ijewel.applyCarat(c.carat);
    if (c.gem1)  ijewel.applyGem('gem1', c.gem1);
    if (c.gem2)  ijewel.applyGem('gem2', c.gem2);
    if (c.metal) {
      ijewel.applyShankMetal(c.metal);
      ijewel.applyCastMetal(c.combinedGold && c.castMetal ? c.castMetal : c.metal);
    }
  }, [ijewel.isReady]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!ijewel.isReady || choicesRef.current.gem1) return;
    const c = choicesRef.current;
    const findGem = (opts, label) =>
      label
        ? opts.find((o) => o.label === label) ?? opts.find((o) => o.label.toLowerCase().includes('бел'))
        : opts.find((o) => o.label.toLowerCase().includes('бел'));
    const w1 = findGem(ijewel.gem1Options, c.gem1Label);
    if (w1) { cfg.choose('gem1', w1.uuid, 'gem1Label', w1.label); ijewel.applyGem('gem1', w1.uuid); }
    const w2 = findGem(ijewel.gem2Options, c.gem2Label);
    if (w2) { cfg.choose('gem2', w2.uuid, 'gem2Label', w2.label); ijewel.applyGem('gem2', w2.uuid); }
  }, [ijewel.gem1Options]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!ijewel.isReady || choicesRef.current.metal) return;
    const label = choicesRef.current.metalLabel;
    if (!label) return;
    const target = ijewel.shankMetalOptions.find((o) => o.label === label);
    if (target) {
      cfg.choose('metal', target.uuid, 'metalLabel', target.label);
      ijewel.applyShankMetal(target.uuid);
      const castUuid = castUuidByLabel(target.label);
      if (castUuid) ijewel.applyCastMetal(castUuid);
    }
  }, [ijewel.shankMetalOptions]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!ijewel.isReady || choicesRef.current.metal || choicesRef.current.metalLabel) return;
    const white = ijewel.castMetalOptions.find((o) => o.label.toLowerCase().includes('бел'));
    if (white) ijewel.applyCastMetal(white.uuid);
  }, [ijewel.castMetalOptions]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Handlers ---

  const handleShape = useCallback((s) => {
    cfg.choose('shape', s.id, 'shapeLabel', s.label);
    const k = CAST_DESIGNS.find((x) => x.id === choicesRef.current.cast);
    ijewel.applyHead(s.ijewelTag, k?.ijewelTag ?? null);
  }, [cfg, ijewel]);

  const handleCast = useCallback((c) => {
    cfg.choose('cast', c.id, 'castLabel', c.label);
    const s = DIAMOND_SHAPES.find((x) => x.id === choicesRef.current.shape);
    ijewel.applyHead(s?.ijewelTag ?? null, c.ijewelTag);
    if (c.id === 'bezel') {
      if (choicesRef.current.shank !== 'Bezel') prevShankRef.current = choicesRef.current.shank;
      cfg.choose('shank', 'Bezel', 'shankLabel', 'Bezel');
      ijewel.applyShank('Bezel');
    } else if (choicesRef.current.cast === 'bezel') {
      const restored = prevShankRef.current;
      prevShankRef.current = null;
      if (restored) { cfg.choose('shank', restored, 'shankLabel', restored); ijewel.applyShank(restored); }
    }
  }, [cfg, ijewel]);

  const handleShank = useCallback((s) => {
    cfg.choose('shank', s.id, 'shankLabel', s.label);
    ijewel.applyShank(s.id);
  }, [cfg, ijewel]);

  const handleCarat  = useCallback((v)        => { cfg.choose('carat', v); ijewel.applyCarat(v); },                [cfg, ijewel]);
  const handleGem1   = useCallback((uuid, lbl) => { cfg.choose('gem1', uuid, 'gem1Label', lbl); ijewel.applyGem('gem1', uuid); }, [cfg, ijewel]);
  const handleGem2   = useCallback((uuid, lbl) => { cfg.choose('gem2', uuid, 'gem2Label', lbl); ijewel.applyGem('gem2', uuid); }, [cfg, ijewel]);

  const castUuidByLabel = useCallback((shankLabel) => {
    const shankColor = LABEL_COLORS[shankLabel];
    let match = ijewel.castMetalOptions.find((o) => o.label === shankLabel);
    if (!match && shankColor) match = ijewel.castMetalOptions.find((o) => LABEL_COLORS[o.label] === shankColor);
    if (!match) {
      const firstWord = shankLabel?.split(' ')[0]?.toLowerCase();
      match = ijewel.castMetalOptions.find((o) => o.label?.toLowerCase().startsWith(firstWord));
    }
    return match?.uuid ?? null;
  }, [ijewel.castMetalOptions]);

  const handleShankMetal = useCallback((uuid, label) => {
    cfg.choose('metal', uuid, 'metalLabel', label);
    ijewel.applyShankMetal(uuid);
    if (!choicesRef.current.combinedGold) {
      const castUuid = castUuidByLabel(label);
      if (castUuid) ijewel.applyCastMetal(castUuid);
    }
  }, [cfg, ijewel, castUuidByLabel]);

  const handleToggleCombined = useCallback((checked) => {
    cfg.choose('combinedGold', checked);
    if (!checked) {
      const castUuid = castUuidByLabel(choicesRef.current.metalLabel);
      if (castUuid) ijewel.applyCastMetal(castUuid);
    }
  }, [cfg, ijewel, castUuidByLabel]);

  const handleCastMetal = useCallback((uuid, label) => {
    cfg.choose('castMetal', uuid, 'castMetalLabel', label);
    ijewel.applyCastMetal(uuid);
  }, [cfg, ijewel]);

  const handleInit = useCallback((el) => { ijewel.init(el); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Back: at first step go to landing; otherwise go to previous step
  const handleBack = useCallback(() => {
    const idx = cfg.sequence.indexOf(cfg.currentStep);
    if (idx <= 0) {
      window.location.href = LANDING_URL;
    } else {
      cfg.back();
    }
  }, [cfg]);

  const isSummary = cfg.currentStep === 'summary';

  // Move lead to "Квалифицировано" when user reaches summary, attach ring config as note
  // Fires each time user reaches summary (including after rebuild) — no dedup guard needed
  useEffect(() => {
    if (!isSummary || !leadId) return;
    const c = cfg.choices;
    const configLines = [
      c.shapeLabel && `Огранка: ${c.shapeLabel}`,
      c.shankLabel && `Шинка: ${c.shankLabel}`,
      c.castLabel  && `Каст: ${c.castLabel}`,
      c.carat      && `Каратность: ${c.carat} кар`,
      c.gem1Label  && `Центр. бриллиант: ${c.gem1Label}`,
      c.gem2Label  && `Россыпь: ${c.gem2Label}`,
      c.purity     && `Проба: ${c.purity}`,
      c.metalLabel && `Металл: ${c.metalLabel}`,
    ].filter(Boolean).join('\n');
    const note = `✅ Клиент собрал украшение в конфигураторе\n\n💍 Конфигурация:\n${configLines || '—'}`;
    fetch('/api/update-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId: Number(leadId), stageId: 87656158, note }),
    }).catch(() => {});
  }, [isSummary, leadId]);

  // Live price: show from step 1 using base price, update as choices are made
  const showPriceBadge = !isSummary;
  const livePrice = (() => {
    if (!showPriceBadge || !prices) return null;
    // If carat is selected use full calc
    if (cfg.choices.carat) return calcPrice(cfg.choices, prices);
    // Otherwise show base price: Sirius default or chosen shank
    const shankLabel = cfg.choices.shankLabel || 'Sirius';
    let base = prices.baseByShank?.[shankLabel] ?? prices.baseByShank?.['Sirius'] ?? 0;
    if (cfg.choices.cast && cfg.choices.cast !== 'classic') {
      base += prices.casts?.[cfg.choices.cast] ?? 0;
    }
    return base || null;
  })();

  return (
    <div className="cfg-root nd-bg">
      {import.meta.env.DEV && ijewel.debugInfo && (
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.92)', color:'#0f0', fontFamily:'monospace', fontSize:12, padding:16, overflowY:'auto', zIndex:9999 }}>
          <b style={{color:'#ff0'}}>DEBUG (?debug=1)</b>
          <pre>{JSON.stringify(ijewel.debugInfo, null, 2)}</pre>
        </div>
      )}

      <ViewerPanel onInit={handleInit} isReady={ijewel.isReady} />

      {/* Step rail — shown on all config steps, includes live price */}
      {!isSummary && (
        <StepRail
          sequence={cfg.sequence}
          currentStep={cfg.currentStep}
          onGoTo={cfg.goToStep}
          livePrice={livePrice ? formatPrice(livePrice) : null}
          hasExactPrice={!!cfg.choices.carat}
        />
      )}

      {/* Light panel for controls */}
      <div className="cfg-panel cfg-panel--light">
        {cfg.currentStep === 'diamond' && (
          <DiamondShapeStep
            chosen={cfg.choices.shape}
            onChoose={handleShape}
            onNext={cfg.next}
            onBack={handleBack}
          />
        )}

        {cfg.currentStep === 'shank' && (
          <ShankDesignStep
            chosen={cfg.choices.shank}
            onChoose={handleShank}
            onNext={cfg.next}
            onBack={handleBack}
            variations={ijewel.shankVariations}
            castChosen={cfg.choices.cast}
            prices={prices}
          />
        )}

        {cfg.currentStep === 'cast' && (
          <CastDesignStep
            chosen={cfg.choices.cast}
            onChoose={handleCast}
            onNext={cfg.next}
            onBack={handleBack}
            prices={prices}
          />
        )}

        {cfg.currentStep === 'carat' && (
          <CaratStep
            carat={cfg.choices.carat}
            gem1={cfg.choices.gem1}
            gem2={cfg.choices.gem2}
            gem1Options={ijewel.gem1Options}
            gem2Options={ijewel.gem2Options}
            cast={cfg.choices.cast}
            prices={prices}
            onChooseCarat={handleCarat}
            onChooseGem1={handleGem1}
            onChooseGem2={handleGem2}
            onNext={cfg.next}
            onBack={handleBack}
          />
        )}

        {cfg.currentStep === 'metal' && (
          <MetalStep
            purity={cfg.choices.purity}
            shankMetal={cfg.choices.metal}
            castMetal={cfg.choices.castMetal}
            combinedGold={cfg.choices.combinedGold}
            shankMetalOptions={ijewel.shankMetalOptions}
            castMetalOptions={ijewel.castMetalOptions}
            prices={prices}
            onChoosePurity={(v) => cfg.choose('purity', v)}
            onChooseShankMetal={handleShankMetal}
            onToggleCombined={handleToggleCombined}
            onChooseCastMetal={handleCastMetal}
            onNext={cfg.next}
            onBack={handleBack}
          />
        )}

        {cfg.currentStep === 'summary' && (
          <SummaryStep
            choices={cfg.choices}
            sequence={cfg.sequence}
            onGoTo={cfg.goToStep}
            leadId={leadId}
          />
        )}

      </div>
    </div>
  );
}
