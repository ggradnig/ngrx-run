import {
  Dependency,
  ImmediateEffect,
  ImmediateEffectDefinition,
  ImmediateEffectHandler,
  IsEffect,
  ObservableEffect,
  ObservableEffectDefinition,
  ObservableEffectHandler,
  PromiseEffect,
  PromiseEffectDefinition,
  PromiseEffectHandler
} from './effect';

type EffectExtras = {
  type: string;
  params?: any;
};
export type EffectConfig<TDeps extends Dependency[], TResult> = IsEffect &
  (
    | ObservableEffect<TDeps, TResult>
    | PromiseEffect<TDeps, TResult>
    | ImmediateEffect<TDeps>
  ) &
  Partial<EffectExtras>;

export type EffectDefinition<TDeps extends Dependency[], TResult> =
  | ObservableEffectDefinition<TDeps, TResult>
  | PromiseEffectDefinition<TDeps, TResult>
  | ImmediateEffectDefinition<TDeps>;

export type EffectHandler<TResult> =
  | ObservableEffectHandler<TResult>
  | PromiseEffectHandler<TResult>
  | ImmediateEffectHandler;
