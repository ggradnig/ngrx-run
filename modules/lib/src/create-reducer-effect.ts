import { EffectConfig } from './effect-config';

export function createReducerEffect<TParams>(
  effectCreator: (params: TParams) => EffectConfig<any>
): (params: TParams) => EffectConfig<any>;
export function createReducerEffect(
  effectCreator: EffectConfig<any>
): () => EffectConfig<any>;
export function createReducerEffect<TParams>(
  effectCreator: ((params?: TParams) => EffectConfig<any>) | EffectConfig<any>
): (params?: TParams) => EffectConfig<any> {
  return (params?: TParams) =>
    Object.assign(
      typeof effectCreator === 'function' ? effectCreator(params) : effectCreator,
      { params }
    );
}
