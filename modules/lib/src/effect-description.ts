import {ObservableEffect, SubscriptionToken} from './effect';
import {EffectConfig} from './effect-config';

interface EffectDescription {
  type?: string;
  params?: any;
  nextAction?: string;
  errorAction?: string;
  completeAction?: string;
  subscribeAction?: string;
  unsubscribeAction?: string;
}

const handler = {
  get(): object {
    return proxy;
  }
};

const target = {};
const proxy = new Proxy(target, handler);

export function addEffectDescriptions<TState, TEffect>(
  state: TState,
  effect: EffectConfig<any, any>
): any {
  const effectDescription: EffectDescription = {
    type: effect.type,
    params: effect.params,
    nextAction: hasNextAction(effect) ? effect.next(proxy).type : undefined,
    errorAction: hasErrorAction(effect) ? effect.error(proxy).type : undefined,
    completeAction: hasCompleteAction(effect) ? effect.complete().type : undefined,
    subscribeAction: hasSubscribeAction(effect)
      ? effect.subscribed(0 as SubscriptionToken).type
      : undefined
  };
  return Object.assign(state, {__effect: effectDescription});
}

function hasNextAction<T, E extends EffectConfig<any, any>>(
  effect: E
): effect is E & { next: NonNullable<ObservableEffect<any, any>['next']> } {
  return (effect as ObservableEffect<any, any>).next !== undefined;
}

function hasErrorAction<T, E extends EffectConfig<any, any>>(
  effect: E
): effect is E & { error: NonNullable<ObservableEffect<any, any>['error']> } {
  return (effect as ObservableEffect<any, any>).error !== undefined;
}

function hasCompleteAction<T, E extends EffectConfig<any, any>>(
  effect: E
): effect is E & { complete: NonNullable<ObservableEffect<any, any>['complete']> } {
  return (effect as ObservableEffect<any, any>).complete !== undefined;
}

function hasSubscribeAction<T, E extends EffectConfig<any, any>>(
  effect: E
): effect is E & { subscribed: NonNullable<ObservableEffect<any, any>['subscribed']> } {
  return (effect as ObservableEffect<any, any>).subscribed !== undefined;
}
