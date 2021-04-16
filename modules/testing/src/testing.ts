import {Action, Store} from '@ngrx/store';
import {Provider} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {EffectStoreModule, EffectConfig, StateWithEffects, ActionReducer} from 'ngrx-run';
import {Observable} from 'rxjs';
import {first} from 'rxjs/operators';

type Config = { providers?: Provider[] };

export async function reduceWithEffects<TState>(
  reducer: ActionReducer<TState>,
  actions: Action[],
  config?: Config
): Promise<TState> {
  jest.useFakeTimers();
  TestBed.configureTestingModule({
    imports: [EffectStoreModule.forRoot({feature: reducer})],
    providers: config?.providers
  });
  const store: Store<{ feature: TState }> = TestBed.inject(Store);
  for (const action of actions) {
    store.dispatch(action);
    jest.runOnlyPendingTimers();
  }
  jest.useRealTimers();
  return await firstValueFrom(store.select((state) => state.feature));
}

export const testing = {};

declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveEffect(expected: EffectConfig<any>): R;
    }
  }
}

expect.extend({
  toHaveEffect(received: StateWithEffects<any>, expected: EffectConfig<any>): any {
    const pass = received.effects.includes(expected);
    if (pass) {
      return {
        pass: true,
        message: () => `expected reducer to have effect ${expected.type}`
      };
    } else {
      return {
        pass: false,
        message: () => `expected reducer to have effect ${expected.type}`
      };
    }
  }
});
/* Util */

function firstValueFrom<T>(obs$: Observable<T>): Promise<T> {
  return obs$.pipe(first()).toPromise();
}
