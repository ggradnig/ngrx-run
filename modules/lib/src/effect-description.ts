import {
  CancellationToken,
  EffectConfig,
  ObservableEffect,
  PromiseEffect,
  SubscriptionToken,
  UnsubscriptionEffect
} from './functions';

interface EffectDescription {
  type?: string;
  nextAction?: string;
  errorAction?: string;
  completeAction?: string;
  resolveAction?: string;
  rejectAction?: string;
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

export function addEffectDescriptions<T, E>(state: T, effects: EffectConfig<any>[]): any {
  const effectDescriptions: EffectDescription[] = effects.map((effect) => ({
    type: effect.type,
    nextAction: hasNextAction(effect) ? effect.next(proxy).type : undefined,
    errorAction: hasErrorAction(effect) ? effect.error(proxy).type : undefined,
    completeAction: hasCompleteAction(effect) ? effect.complete().type : undefined,
    subscribeAction: hasSubscribeAction(effect) ? effect.subscribe(0 as SubscriptionToken).type : undefined,
    resolveAction: hasResolveAction(effect) ? effect.resolve(proxy).type : undefined,
    rejectAction: hasRejectAction(effect) ? effect.reject(proxy).type : undefined,
    unsubscribeAction: hasUnsubscribeAction(effect) ? effect.unsubscribe(0 as CancellationToken).type : undefined
  }));
  return Object.assign(state, { __effects__: effectDescriptions });
}

function hasNextAction<T, E extends EffectConfig<T>>(effect: E): effect is E & { next: ObservableEffect<T>['next'] } {
  return (effect as ObservableEffect<T>).next !== undefined;
}

function hasErrorAction<T, E extends EffectConfig<T>>(
  effect: E
): effect is E & { error: NonNullable<ObservableEffect<T>['error']> } {
  return (effect as ObservableEffect<T>).error !== undefined;
}

function hasCompleteAction<T, E extends EffectConfig<T>>(
  effect: E
): effect is E & { complete: NonNullable<ObservableEffect<T>['complete']> } {
  return (effect as ObservableEffect<T>).complete !== undefined;
}

function hasSubscribeAction<T, E extends EffectConfig<T>>(
  effect: E
): effect is E & { subscribe: NonNullable<ObservableEffect<T>['subscribe']> } {
  return (effect as ObservableEffect<T>).subscribe !== undefined;
}

function hasResolveAction<T, E extends EffectConfig<T>>(effect: E): effect is E & { resolve: PromiseEffect<T>['resolve'] } {
  return (effect as PromiseEffect<T>).resolve !== undefined;
}

function hasRejectAction<T, E extends EffectConfig<T>>(
  effect: E
): effect is E & { reject: NonNullable<PromiseEffect<T>['reject']> } {
  return (effect as PromiseEffect<T>).reject !== undefined;
}

function hasUnsubscribeAction<T, E extends EffectConfig<T>>(
  effect: E
): effect is E & { unsubscribe: NonNullable<UnsubscriptionEffect<T>['unsubscribe']> } {
  return (effect as UnsubscriptionEffect<T>).unsubscribe !== undefined;
}
