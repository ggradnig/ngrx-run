import {ObservableEffect, PromiseEffect, SynchronousEffect, UnsubscriptionEffect} from './effect';

type EffectExtras = {
  type: string;
  params?: any;
};
export type EffectConfig<T> = (
  | ObservableEffect<T>
  | PromiseEffect<T>
  | SynchronousEffect<T>
  | UnsubscriptionEffect<T>
) &
  Partial<EffectExtras>;
