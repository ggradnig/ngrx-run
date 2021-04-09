import { ObservableEffect, PromiseEffect, UnsubscriptionEffect } from './effect';

type EffectExtras = {
  type: string;
  params?: any;
};
export type EffectConfig<T> = (
  | ObservableEffect<T>
  | PromiseEffect<T>
  | UnsubscriptionEffect<T>
) &
  Partial<EffectExtras>;

export type EffectCreator<TState> = <TEffect>(state: TState) => EffectConfig<TEffect>;
