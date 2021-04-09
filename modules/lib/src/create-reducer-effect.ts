
import {EffectConfig, EffectCreator} from './effect-config';

export function createReducerEffect<TState, TParams>(
  effectCreator: (state: TState, params: TParams) => EffectConfig<any>
): (params: TParams) => EffectCreator<TState>;
export function createReducerEffect<TState>(
  effectCreator: (state: TState) => EffectConfig<any>
): () => EffectCreator<TState>;
export function createReducerEffect<TState, TParams>(
  effectCreator: (state: TState, params?: TParams) => EffectConfig<any>
): (params?: TParams) => EffectCreator<TState> {
  return (params?: TParams) => (state: TState) => Object.assign(effectCreator(state, params), {params});
}
