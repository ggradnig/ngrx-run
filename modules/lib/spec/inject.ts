import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {createAction, props} from '@ngrx/store';
import {ActionReducer, ActionsOf, createEffect, run} from '../public_api';

@Injectable({providedIn: 'root'})
export class TestService {
  increment(inc: number): Observable<number> {
    return of(inc);
  }
}

const Effects = {
  increase: createEffect('Increment', {
    call: (testService) => (inc: number) => testService.increment(inc),
    using: [TestService]
  }),
  promiseTest: createEffect('Promise test', {
    call: (p: string) => Promise.resolve()
  }),
  promiseEmptyParamTest: createEffect('Promise empty param test', {
    call: () => Promise.resolve()
  })
};

export const reducer: ActionReducer<1 | 2 | 3> = (
  state: 1 | 2 | 3 = 1,
  action: ActionsOf<typeof Actions>
) => {
  switch (action.type) {
    case Actions.init.type:
      return [
        state,
        run(Effects.increase(action.inc), {next: (inc) => Actions.next({inc})})
      ];
    case Actions.next.type:
      return 2 as const;
    case Actions.last.type:
      return state === 2 ? 3 : state;
    case Actions.test.type:
      return [
        state,
        run(Effects.promiseTest('abc'), {complete: () => Actions.next({inc: 1})}),
        run(Effects.promiseEmptyParamTest(), {complete: () => Actions.next({inc: 1})}),
      ];
  }
};

export const Actions = {
  init: createAction('init', props<{ inc: number }>()),
  next: createAction('next', props<{ inc: number }>()),
  last: createAction('last'),
  test: createAction('test')
};
