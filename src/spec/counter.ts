/* Reducer */

import {SubscriptionToken, unsubscribe, withEffects} from '../lib/functions';
import {interval} from 'rxjs';
import {StateWithEffects} from '../public-api';
import {mapTo} from 'rxjs/operators';

export function reducer(
  state: State = {counter: 0, type: States.unsubscribed},
  action: Action
): StateWithEffects<State> {
  switch (action.type) {
    case Actions.subscribe:
      return withEffects(state, {
        name: 'Interval',
        // Note: we need this object to test effect description for complex objects
        operation: () => interval(1000).pipe(mapTo({a: {b: {c: 1}}})),
        next: (val: { a: { b: { c: number } } }) => new IncrementAction(val.a.b.c),
        subscribe: (token) => new SubscribedAction({token})
      });
    case Actions.subscribed:
      return {...state, type: States.subscribed, subscriptionToken: action.payload.token};
    case Actions.unsubscribe:
      switch (state.type) {
        case States.subscribed:
          return withEffects(state, {
            operation: () => unsubscribe(state.subscriptionToken),
            unsubscribe: () => new UnsubscribedAction()
          });
        case States.unsubscribed:
          return state;
      }
      break;
    case Actions.unsubscribed:
      return {counter: state.counter, type: States.unsubscribed};
    case Actions.increment:
      return {...state, counter: state.counter + 1};
  }
}

export enum Actions {
  subscribe = 'Subscribe',
  subscribed = 'Subscribed',
  increment = 'Increment',
  unsubscribe = 'Unsubscribe',
  unsubscribed = 'Unsubscribed'
}

export class SubscribeAction {
  readonly type = Actions.subscribe;
}

export class SubscribedAction {
  readonly type = Actions.subscribed;

  constructor(public payload: { token: SubscriptionToken }) {
  }
}

export class IncrementAction {
  readonly type = Actions.increment;

  constructor(by: number = 1) {
  }
}

export class UnsubscribeAction {
  readonly type = Actions.unsubscribe;
}

export class UnsubscribedAction {
  readonly type = Actions.unsubscribed;
}

export type Action = SubscribeAction | SubscribedAction | IncrementAction | UnsubscribeAction | UnsubscribedAction;

export enum States {
  unsubscribed = 'Unsubscribed',
  subscribed = 'Subscribed'
}

export interface UnsubscribedState {
  type: States.unsubscribed;
  counter: number;
}

export interface SubscribedState {
  type: States.subscribed;
  counter: number;
  subscriptionToken: SubscriptionToken;
}

export type State = UnsubscribedState | SubscribedState;
