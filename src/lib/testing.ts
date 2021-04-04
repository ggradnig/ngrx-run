import { Action, Store } from '@ngrx/store';
import { ActionReducer, ReducerResult } from './types';
import { Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RuntimeStoreModule } from './module';
import { firstValueFrom } from '../spec/util';
import { EffectConfig } from './functions';

export async function reduceWithEffects<TState>(
  action: Action,
  reducer: ActionReducer<TState>,
  providers: Provider[]
): Promise<TState> {
  jest.useFakeTimers();
  TestBed.configureTestingModule({
    imports: [RuntimeStoreModule.forRoot({ feature: reducer })],
    providers
  });
  const store: Store<{ feature: TState }> = TestBed.inject(Store);
  store.dispatch(action);
  jest.runOnlyPendingTimers();
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
  toHaveEffect(received: ReducerResult<any>, expected: EffectConfig<any>): any {
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
