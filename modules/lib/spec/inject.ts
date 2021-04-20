import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {ActionsOf, createEffect, StateWithEffects, run} from '../public_api';
import {createAction, props} from '@ngrx/store';

@Injectable({providedIn: 'root'})
export class TestService {
  performSideEffect(): Observable<void> {
    return of(void 0);
  }
}

const effect = createEffect((params: { state: number, inc: number }) => ({
  operation: (inject) => inject(TestService).performSideEffect(),
  next: () => Actions.next( {inc: params.inc})
}));

export function reducer(
  state: 1 | 2 | 3 = 1,
  action: ActionsOf<typeof Actions>
): StateWithEffects<1 | 2 | 3> {
  switch (action.type) {
    case Actions.init.type:
      return run(state, effect({state, inc: action.inc}));
    case Actions.next.type:
      return 2 as const;
    case Actions.last.type:
      return state === 2 ? 3 : state;
  }
}

export const Actions = {
  init: createAction('init', props<{ inc: number }>()),
  next: createAction('next', props<{ inc: number }>()),
  last: createAction('last')
};
