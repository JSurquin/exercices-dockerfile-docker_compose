'use client';

import { useEffect } from 'react';

const PERF_LITE_CLASS = 'perf-lite';
const CB_PAUSED_CLASS = 'cb-paused';

function isModestDevice(): boolean {
  const cores = navigator.hardwareConcurrency || 8;
  return cores <= 4;
}

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function applyPerfLiteClass(target: DOMTokenList = document.documentElement.classList): boolean {
  const lite = prefersReducedMotion() || isModestDevice();
  target.toggle(PERF_LITE_CLASS, lite);
  return lite;
}

export function PerfController() {
  useEffect(() => {
    applyPerfLiteClass();

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMotionChange = () => applyPerfLiteClass();
    motionQuery.addEventListener('change', onMotionChange);

    const syncVisibility = () => {
      document.documentElement.classList.toggle(CB_PAUSED_CLASS, document.hidden);
    };
    syncVisibility();
    document.addEventListener('visibilitychange', syncVisibility);

    return () => {
      motionQuery.removeEventListener('change', onMotionChange);
      document.removeEventListener('visibilitychange', syncVisibility);
    };
  }, []);

  return null;
}
