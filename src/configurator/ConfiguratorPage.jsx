import React, { useCallback, useEffect, useRef } from 'react';
import { useConfigurator } from './useConfigurator.js';
import { useIjewel, LABEL_COLORS } from './useIjewel.js';
import { DIAMOND_SHAPES, CAST_DESIGNS } from './config.js';
import { ViewerPanel } from './components/ViewerPanel.jsx';
import { ProgressBar } from './components/ProgressBar.jsx';
import { StartStep } from './steps/StartStep.jsx';
import { DiamondShapeStep } from './steps/DiamondShapeStep.jsx';
import { ShankDesignStep } from './steps/ShankDesignStep.jsx';
import { CastDesignStep } from './steps/CastDesignStep.jsx';
import { CaratStep } from './steps/CaratStep.jsx';
import { MetalStep } from './steps/MetalStep.jsx';
import { SummaryStep } from './steps/SummaryStep.jsx';

export default function ConfiguratorPage() {
  const cfg    = useConfigurator();
  const ijewel = useIjewel();

  // Stable refs so handlers always read fresh values without stale closures
  const choicesRef = useRef(cfg.choices);
  choicesRef.current = cfg.choices;

  // Remember non-Bezel shank to restore when switching away from bezel cast
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

  // Restore gem colors from URL label OR apply white default
  // Fires when gem1Options first populate (after viewer ready)
  useEffect(() => {
    if (!ijewel.isReady || choicesRef.current.gem1) return;
    const c = choicesRef.current;

    // If label came from URL — find matching option; otherwise fall back to white
    const findGem = (opts, label) =>
      label
        ? opts.find((o) => o.label === label) ?? opts.find((o) => o.label.toLowerCase().includes('бел'))
        : opts.find((o) => o.label.toLowerCase().includes('бел'));

    const w1 = findGem(ijewel.gem1Options, c.gem1Label);
    if (w1) { cfg.choose('gem1', w1.uuid, 'gem1Label', w1.label); ijewel.applyGem('gem1', w1.uuid); }

    const w2 = findGem(ijewel.gem2Options, c.gem2Label);
    if (w2) { cfg.choose('gem2', w2.uuid, 'gem2Label', w2.label); ijewel.applyGem('gem2', w2.uuid); }
  }, [ijewel.gem1Options]); // eslint-disable-line react-hooks/exhaustive-deps

  // Restore shank metal from URL label OR skip (no default — user must choose)
  useEffect(() => {
    if (!ijewel.isReady || choicesRef.current.metal) return;
    const label = choicesRef.current.metalLabel;
    if (!label) return; // no URL label — leave as iJewel default
    const target = ijewel.shankMetalOptions.find((o) => o.label === label);
    if (target) {
      cfg.choose('metal', target.uuid, 'metalLabel', target.label);
      ijewel.applyShankMetal(target.uuid);
      // sync cast too
      const castUuid = castUuidByLabel(target.label);
      if (castUuid) ijewel.applyCastMetal(castUuid);
    }
  }, [ijewel.shankMetalOptions]); // eslint-disable-line react-hooks/exhaustive-deps

  // Default white cast — only when there's no URL config at all
  useEffect(() => {
    if (!ijewel.isReady || choicesRef.current.metal || choicesRef.current.metalLabel) return;
    const white = ijewel.castMetalOptions.find((o) => o.label.toLowerCase().includes('бел'));
    if (white) ijewel.applyCastMetal(white.uuid);
  }, [ijewel.castMetalOptions]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Handlers: call iJewel immediately (same tick as setState) ---

  const handleShape = useCallback((s) => {
    cfg.choose('shape', s.id, 'shapeLabel', s.label);
    const k = CAST_DESIGNS.find((x) => x.id === choicesRef.current.cast);
    ijewel.applyHead(s.ijewelTag, k?.ijewelTag ?? null);
  }, [cfg, ijewel]);

  const handleCast = useCallback((c) => {
    cfg.choose('cast', c.id, 'castLabel', c.label);
    const s = DIAMOND_SHAPES.find((x) => x.id === choicesRef.current.shape);
    ijewel.applyHead(s?.ijewelTag ?? null, c.ijewelTag);

    // Auto-select Bezel shank when choosing bezel cast
    if (c.id === 'bezel') {
      if (choicesRef.current.shank !== 'Bezel') {
        prevShankRef.current = choicesRef.current.shank; // remember previous
      }
      cfg.choose('shank', 'Bezel', 'shankLabel', 'Bezel');
      ijewel.applyShank('Bezel');
    } else if (choicesRef.current.cast === 'bezel') {
      // Switching away from bezel — restore previous shank
      const restored = prevShankRef.current;
      prevShankRef.current = null;
      if (restored) {
        cfg.choose('shank', restored, 'shankLabel', restored);
        ijewel.applyShank(restored);
      }
    }
  }, [cfg, ijewel]);

  const handleShank = useCallback((s) => {
    cfg.choose('shank', s.id, 'shankLabel', s.label);
    ijewel.applyShank(s.id);
  }, [cfg, ijewel]);

  const handleCarat = useCallback((v) => {
    cfg.choose('carat', v);
    ijewel.applyCarat(v);
  }, [cfg, ijewel]);

  const handleGem1 = useCallback((uuid, label) => {
    cfg.choose('gem1', uuid, 'gem1Label', label);
    ijewel.applyGem('gem1', uuid);
  }, [cfg, ijewel]);

  const handleGem2 = useCallback((uuid, label) => {
    cfg.choose('gem2', uuid, 'gem2Label', label);
    ijewel.applyGem('gem2', uuid);
  }, [cfg, ijewel]);

  // Find cast UUID that matches shank color (labels differ: "Белое золото" vs "Белое")
  // Match by shared hex color value from LABEL_COLORS, or by first word
  const castUuidByLabel = useCallback((shankLabel) => {
    const shankColor = LABEL_COLORS[shankLabel];
    // Try exact label match first
    let match = ijewel.castMetalOptions.find((o) => o.label === shankLabel);
    // Try color hex match
    if (!match && shankColor) {
      match = ijewel.castMetalOptions.find((o) => LABEL_COLORS[o.label] === shankColor);
    }
    // Try first-word match ("Белое золото" → "Белое")
    if (!match) {
      const firstWord = shankLabel?.split(' ')[0]?.toLowerCase();
      match = ijewel.castMetalOptions.find((o) =>
        o.label?.toLowerCase().startsWith(firstWord)
      );
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
      // Sync cast back to shank color
      const label = choicesRef.current.metalLabel;
      const castUuid = label ? castUuidByLabel(label) : null;
      if (castUuid) ijewel.applyCastMetal(castUuid);
    }
  }, [cfg, ijewel, castUuidByLabel]);

  const handleCastMetal = useCallback((uuid, label) => {
    cfg.choose('castMetal', uuid, 'castMetalLabel', label);
    ijewel.applyCastMetal(uuid);
  }, [cfg, ijewel]);

  const handleInit = useCallback((el) => { ijewel.init(el); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isStart   = cfg.currentStep === 'start';
  const isSummary = cfg.currentStep === 'summary';

  return (
    <div className="cfg-root nd-bg">
      {ijewel.debugInfo && (
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.92)', color:'#0f0', fontFamily:'monospace', fontSize:12, padding:16, overflowY:'auto', zIndex:9999 }}>
          <b style={{color:'#ff0'}}>DEBUG (?debug=1)</b>
          <pre>{JSON.stringify(ijewel.debugInfo, null, 2)}</pre>
        </div>
      )}
      {!isStart && <ViewerPanel onInit={handleInit} isReady={ijewel.isReady} />}
      {!isStart && !isSummary && <ProgressBar value={cfg.progress} />}

      <div className={`cfg-panel ${isStart ? 'cfg-panel--full' : ''}`}>
        {cfg.currentStep === 'start' && <StartStep onStart={cfg.start} />}

        {cfg.currentStep === 'diamond' && (
          <DiamondShapeStep
            chosen={cfg.choices.shape}
            onChoose={handleShape}
            onNext={cfg.next}
            onBack={cfg.back}
          />
        )}

        {cfg.currentStep === 'shank' && (
          <ShankDesignStep
            chosen={cfg.choices.shank}
            onChoose={handleShank}
            onNext={cfg.next}
            onBack={cfg.back}
            variations={ijewel.shankVariations}
            castChosen={cfg.choices.cast}
          />
        )}

        {cfg.currentStep === 'cast' && (
          <CastDesignStep
            chosen={cfg.choices.cast}
            onChoose={handleCast}
            onNext={cfg.next}
            onBack={cfg.back}
          />
        )}

        {cfg.currentStep === 'carat' && (
          <CaratStep
            carat={cfg.choices.carat}
            gem1={cfg.choices.gem1}
            gem2={cfg.choices.gem2}
            gem1Options={ijewel.gem1Options}
            gem2Options={ijewel.gem2Options}
            onChooseCarat={handleCarat}
            onChooseGem1={handleGem1}
            onChooseGem2={handleGem2}
            onNext={cfg.next}
            onBack={cfg.back}
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
            onChoosePurity={(v) => cfg.choose('purity', v)}
            onChooseShankMetal={handleShankMetal}
            onToggleCombined={handleToggleCombined}
            onChooseCastMetal={handleCastMetal}
            onNext={cfg.next}
            onBack={cfg.back}
          />
        )}

        {cfg.currentStep === 'summary' && (
          <SummaryStep
            choices={cfg.choices}
            sequence={cfg.sequence}
            onGoTo={cfg.goToStep}
          />
        )}
      </div>
    </div>
  );
}
