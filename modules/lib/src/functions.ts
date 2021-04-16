import {SubscriptionToken, UnsubscribeOperation} from './effect';
import {EffectConfig} from './effect-config';
import {StateWithEffects, stateWithEffectsBrand} from './state-with-effects';

export function run<TState, TEffect>(
  state: TState,
  ...effects: Array<EffectConfig<TEffect>>
): StateWithEffects<TState, TEffect> {
  return {
    __brand: stateWithEffectsBrand,
    state,
    effects
  };
}

export const unsubscribeBrand = 'Unsubscribe';

export function unsubscribe(subscriptionToken: SubscriptionToken): UnsubscribeOperation {
  return {
    __brand: unsubscribeBrand,
    subscriptionToken
  };
}
