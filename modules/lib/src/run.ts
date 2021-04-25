import {
  Dependencies,
  ImmediateEffect,
  ImmediateEffectDefinition,
  ImmediateEffectHandler,
  ObservableEffect,
  ObservableEffectDefinition,
  ObservableEffectHandler,
  PromiseEffect,
  PromiseEffectDefinition,
  PromiseEffectHandler
} from './effect';
import { EffectConfig, EffectDefinition, EffectHandler } from './effect-config';

export function run<TDeps extends Dependencies, TResult>(
  effect: ObservableEffectDefinition<TDeps, TResult>,
  handler: ObservableEffectHandler<TResult>
): ObservableEffect<TDeps, TResult>;
export function run<TDeps extends Dependencies, TResult>(
  effect: PromiseEffectDefinition<TDeps, TResult>,
  handler: PromiseEffectHandler<TResult>
): PromiseEffect<TDeps, TResult>;
export function run<TDeps extends Dependencies>(
  effect: ImmediateEffectDefinition<TDeps>,
  handler: ImmediateEffectHandler
): ImmediateEffect<TDeps>;
export function run<TDeps extends Dependencies, TResult>(
  effect: EffectDefinition<TDeps, TResult>,
  handler: EffectHandler<TResult>
): EffectConfig<TDeps, TResult> {
  return {
    ...effect,
    ...handler
  } as EffectConfig<TDeps, TResult>;
}
