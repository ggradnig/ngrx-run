import { EffectConfig } from './effect-config';
import { Dependencies } from './effect';

export type StateWithEffect<TState, TDeps extends Dependencies, TResult> = readonly [
  state: TState,
  effect: EffectConfig<TDeps, TResult>
];
