import { createContext, useContext } from 'react';

/** Какой гид открыт и как из него написать — чтобы кнопки знали, откуда клик. */
export const GuideCtx = createContext({ slug: null, wa: null });
export const useGuide = () => useContext(GuideCtx);
