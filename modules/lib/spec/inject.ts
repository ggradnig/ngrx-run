import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {ActionsOf, createReducerEffect, StateWithEffects, withEffects} from '../public_api';
import {createAction, props} from '@ngrx/store';

@Injectable({providedIn: 'root'})
export class TestService {
  performSideEffect(): Observable<void> {
    return of(void 0);
  }
}

const effect = createReducerEffect<1 | 2 | 3, { inc: number }>((_, action) => ({
  operation: (inject) => inject(TestService).performSideEffect(),
  next: () => Actions.next(action)
}));

export function reducer(
  state: 1 | 2 | 3 = 1,
  action: ActionsOf<typeof Actions>
): StateWithEffects<1 | 2 | 3> {
  switch (action.type) {
    case Actions.init.type:
      return withEffects(state, effect(action));
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
