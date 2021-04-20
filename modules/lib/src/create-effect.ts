import { EffectConfig } from './effect-config';

export function createEffect<TParams, TEffect>(
  effectCreator: (params: TParams) => EffectConfig<TEffect>
): (params: TParams) => EffectConfig<TEffect>;
export function createEffect<TEffect>(
  effectCreator: EffectConfig<TEffect>
): () => EffectConfig<TEffect>;
export function createEffect<TParams, TEffect>(
  effectCreator: ((params?: TParams) => EffectConfig<TEffect>) | EffectConfig<TEffect>
): (params?: TParams) => EffectConfig<TEffect> {
  return (params?: TParams) =>
    Object.assign(
      typeof effectCreator === 'function' ? effectCreator(params) : effectCreator,
      { params }
    );
}
