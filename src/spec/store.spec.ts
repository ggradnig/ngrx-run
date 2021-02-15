import { select, Store } from '@ngrx/store';
import { TestBed } from '@angular/core/testing';
import { RuntimeStoreModule } from '../lib/module';
import { interval, Observable } from 'rxjs';
import { first, take } from 'rxjs/operators';
import { ReducerResult } from '../lib/state';
import { SubscriptionToken, unsubscribe, withEffects } from '../lib/functions';

export function reducer(
  state: State = { counter: 0, type: States.unsubscribed },
  action: Action
): ReducerResult<State> {
  switch (action.type) {
    case Actions.subscribe:
      return withEffects(state, {
        operation: () => interval(1000),
        next: () => new IncrementAction(),
        subscribe: (token) => new SubscribedAction({ token })
      });
    case Actions.subscribed:
      return { ...state, type: States.subscribed, subscriptionToken: action.payload.token };
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
      return { counter: state.counter, type: States.unsubscribed };
    case Actions.increment:
      return { ...state, counter: state.counter + 1 };
  }
}

jest.useFakeTimers();
describe('Store', () => {
  let store: Store<{ feature: State }>;

  function setup(): void {
    TestBed.configureTestingModule({
      imports: [RuntimeStoreModule.forRoot({ feature: reducer })]
    });

    store = TestBed.inject(Store);
  }

  function testStoreValue(expected: any, done: () => void): void {
    store = TestBed.inject(Store);

    store
      .pipe(
        select((state) => state.feature),
        take(1)
      )
      .subscribe({
        next: (val) => {
          expect(val).toEqual(expected);
        },
        error: done,
        complete: done
      });
    jest.runOnlyPendingTimers();
  }

  it('should increase the counter twice and then unsubscribe', (done) => {
    setup();
    store.dispatch(new SubscribeAction());
    jest.advanceTimersByTime(2000);
    store.dispatch(new UnsubscribeAction());
    jest.advanceTimersByTime(1000);
    testStoreValue({ counter: 2, type: States.unsubscribed }, done);
  });
});

export function firstValueFrom<T>(obs$: Observable<T>): Promise<T> {
  return obs$.pipe(first()).toPromise();
}

enum Actions {
  subscribe = 'Subscribe',
  subscribed = 'Subscribed',
  increment = 'Increment',
  unsubscribe = 'Unsubscribe',
  unsubscribed = 'Unsubscribed'
}

class SubscribeAction {
  readonly type = Actions.subscribe;
}

class SubscribedAction {
  readonly type = Actions.subscribed;

  constructor(public payload: { token: SubscriptionToken }) {}
}

class IncrementAction {
  readonly type = Actions.increment;
}

class UnsubscribeAction {
  readonly type = Actions.unsubscribe;
}

class UnsubscribedAction {
  readonly type = Actions.unsubscribed;
}

type Action = SubscribeAction | SubscribedAction | IncrementAction | UnsubscribeAction | UnsubscribedAction;

enum States {
  unsubscribed = 'Unsubscribed',
  subscribed = 'Subscribed'
}

interface UnsubscribedState {
  type: States.unsubscribed;
  counter: number;
}

interface SubscribedState {
  type: States.subscribed;
  counter: number;
  subscriptionToken: SubscriptionToken;
}

type State = UnsubscribedState | SubscribedState;
