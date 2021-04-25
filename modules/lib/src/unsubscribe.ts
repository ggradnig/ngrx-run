import { ImmediateEffectDefinition, SubscriptionToken } from './effect';

export const unsubscribeBrand = 'Unsubscribe';

export function unsubscribe(
  subscriptionToken: SubscriptionToken,
  type?: string
): ImmediateEffectDefinition<[]> {
  return {
    __isEffect: true,
    type: type ?? 'Unsubscribe',
    call: () => ({
      __brand: unsubscribeBrand,
      subscriptionToken
    })
  };
}
