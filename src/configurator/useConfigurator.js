import { useState, useCallback } from 'react';
import { parseConfigUrl } from './config.js';

// Step IDs in a fixed order; actual sequence depends on startPath
const FULL_SEQUENCE = ['diamond', 'shank', 'cast', 'carat', 'metal', 'summary'];

function buildSequence(startPath) {
  if (startPath === 'diamond') {
    return ['diamond', 'shank', 'cast', 'carat', 'metal', 'summary'];
  }
  return ['shank', 'diamond', 'cast', 'carat', 'metal', 'summary'];
}

// Read shared link on page load
const urlConfig = parseConfigUrl();

const INITIAL_CHOICES = {
  startPath:      null,
  shape:          null,
  shapeLabel:     null,
  shank:          null,
  shankLabel:     null,
  cast:           null,
  castLabel:      null,
  carat:          null,
  gem1:           null,
  gem1Label:      null,
  gem2:           null,
  gem2Label:      null,
  metal:          null,
  metalLabel:     null,
  purity:         null,
  combinedGold:   false,
  castMetal:      null,
  castMetalLabel: null,
  castPurity:     null,
};

export function useConfigurator() {
  const [currentStep, setCurrentStep] = useState(urlConfig ? 'summary' : 'start');
  const [sequence, setSequence]       = useState(urlConfig ? FULL_SEQUENCE : []);
  const [choices, setChoices]         = useState(
    urlConfig ? { ...INITIAL_CHOICES, ...urlConfig } : INITIAL_CHOICES
  );

  const choose = useCallback((key, value, labelKey, labelValue) => {
    setChoices((prev) => ({
      ...prev,
      [key]: value,
      ...(labelKey ? { [labelKey]: labelValue } : {}),
    }));
  }, []);

  const start = useCallback((path) => {
    const seq = buildSequence(path);
    setSequence(seq);
    setChoices((prev) => ({ ...prev, startPath: path }));
    setCurrentStep(seq[0]);
  }, []);

  const next = useCallback(() => {
    const idx = sequence.indexOf(currentStep);
    if (idx < sequence.length - 1) setCurrentStep(sequence[idx + 1]);
  }, [currentStep, sequence]);

  const back = useCallback(() => {
    const idx = sequence.indexOf(currentStep);
    if (idx > 0) {
      setCurrentStep(sequence[idx - 1]);
    } else {
      setCurrentStep('start');
      setSequence([]);
    }
  }, [currentStep, sequence]);

  const goToStep = useCallback((stepId) => {
    setCurrentStep(stepId);
  }, []);

  // Progress: 0–1 excluding start/summary
  const contentSteps = sequence.filter((s) => s !== 'summary');
  const stepIdx = contentSteps.indexOf(currentStep);
  const progress = stepIdx >= 0 ? (stepIdx + 1) / contentSteps.length : 0;

  const stepNumber = stepIdx >= 0 ? stepIdx + 1 : null;
  const totalSteps = contentSteps.length;

  return {
    currentStep,
    sequence,
    choices,
    choose,
    start,
    next,
    back,
    goToStep,
    progress,
    stepNumber,
    totalSteps,
  };
}
