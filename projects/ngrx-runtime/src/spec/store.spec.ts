import { Action, select, Store } from '@ngrx/store';
import { TestBed } from '@angular/core/testing';
import { RuntimeStoreModule } from '../lib/module';
import { interval, Observable, timer } from 'rxjs';
import { first, take } from 'rxjs/operators';
import { ReducerResult } from '../lib/state';
import { SubscriptionToken, withEffects } from '../lib/functions';

export const TRIGGER = 'TRIGGER';
export const SUBSCRIBE = 'TRIGGER_INTERVAL';
export const INCREMENT = 'INCREMENT';
export const UNSUBSCRIBE = 'UNSUBSCRIBE';

interface UnsubscribedState {
  type: 'UnsubscribedState';
  counter: number;
}

interface SubscribedState {
  type: 'SubscribedState';
  counter: number;
  subscriptionToken: SubscriptionToken;
}

type State = UnsubscribedState | SubscribedState;

export function reducer(
  state: State = { counter: 0, type: 'UnsubscribedState' },
  action: Action
): ReducerResult<State> {
  switch (action.type) {
    case TRIGGER:
      return withEffects(state, { operation: () => timer(1000), next: () => ({ type: INCREMENT }) });
    case SUBSCRIBE:
      return withEffects(state, { operation: () => interval(1000), next: () => ({ type: INCREMENT }) });
    case UNSUBSCRIBE:
      switch (state.type) {
        case 'SubscribedState':
          return withEffects(state, { operation: state.subscriptionToken });
        case 'UnsubscribedState':
          return state;
      }
      break;
    case INCREMENT:
      return { ...state, counter: state.counter + 1 };
    default:
      return state;
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
  }

  it('should increase the counter value after one second', (done) => {
    setup();
    store.dispatch({ type: TRIGGER });
    jest.advanceTimersByTime(1000);
    testStoreValue({ counter: 1, type: 'UnsubscribedState' }, done);
  });

  it('should increase the counter twice and then unsubscribe', (done) => {
    setup();
    store.dispatch({ type: SUBSCRIBE });
    jest.advanceTimersByTime(2000);
    store.dispatch({ type: UNSUBSCRIBE });
    testStoreValue({ counter: 2, type: 'UnsubscribedState' }, done);
  });
});

export function firstValueFrom<T>(obs$: Observable<T>): Promise<T> {
  return obs$.pipe(first()).toPromise();
}
