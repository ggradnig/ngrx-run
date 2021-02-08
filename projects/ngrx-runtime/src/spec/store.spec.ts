import { Action, Store } from '@ngrx/store';
import { TestBed } from '@angular/core/testing';
import { RuntimeStoreModule } from '../lib/module';
import { withEffect } from '../lib/functions';
import {Observable, of, timer} from 'rxjs';
import {first, take} from 'rxjs/operators';
import { ReducerResult } from '../lib/state';

export const TRIGGER = 'TRIGGER';
export const INCREMENT = 'INCREMENT';
export const DECREMENT = 'DECREMENT';
export const RESET = 'RESET';

interface State {
  counter: number;
}

export function counterReducer(state = 0, action: Action): ReducerResult<number> {
  switch (action.type) {
    case TRIGGER:
      return withEffect(state, of(void 0), { next: () => ({ type: INCREMENT }) });
    case INCREMENT:
      return state + 1;
    case DECREMENT:
      return state - 1;
    case RESET:
      return 0;
    default:
      return state;
  }
}

jest.useFakeTimers();
describe('Store', () => {
  let store: Store<State>;

  function setup(initialState: any = { counter: 0 }): void {
    const reducers = {
      counter: counterReducer
    };

    TestBed.configureTestingModule({
      imports: [RuntimeStoreModule.forRoot(reducers, { initialState })]
    });

    store = TestBed.inject(Store);
  }

  function testStoreValue(expected: any, done: () => void) {
    store = TestBed.inject(Store);

    store.pipe(take(1)).subscribe({
      next: (val) => {
        expect(val).toEqual(expected);
      },
      error: done,
      complete: done
    });
  }

  it('should increase the counter value after one second', (done) => {
    setup();
    store.dispatch({type: TRIGGER});
    testStoreValue({counter: 1}, done);
  });
});

export function firstValueFrom<T>(obs$: Observable<T>): Promise<T> {
  return obs$.pipe(first()).toPromise();
}
