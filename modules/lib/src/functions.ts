import {SubscriptionToken, UnsubscribeOperation} from './effect';
import {EffectConfig, EffectCreator} from './effect-config';
import {StateWithEffects, stateWithEffectsBrand} from './state-with-effects';

export function withEffects<TState, TEffect>(
  state: TState,
  ...effects: Array<EffectConfig<TEffect> | EffectCreator<TState>>
): StateWithEffects<TState, TEffect> {
  return {
    __brand: stateWithEffectsBrand,
    state,
    effects: effects.map((effectConfig) =>
      typeof effectConfig === 'function' ? effectConfig(state) : effectConfig
    )
  };
}

export const unsubscribeBrand = 'Unsubscribe';

export function unsubscribe(subscriptionToken: SubscriptionToken): UnsubscribeOperation {
  return {
    __brand: unsubscribeBrand,
    subscriptionToken
  };
}
