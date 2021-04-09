import { EffectConfig } from './effect-config';

export const stateWithEffectsBrand = 'StateWithEffects';
export type StateWithEffects<TState, TEffect> = {
  __brand: typeof stateWithEffectsBrand;
  state: TState;
  effects: EffectConfig<TEffect>[];
};
