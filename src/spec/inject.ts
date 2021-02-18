/* Reducer */

import { ReducerResult } from '../lib/state';
import { withEffects } from '../lib/functions';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
class TestService {
  performSideEffect(): Observable<void> {
    return of(void 0);
  }
}

export function reducer(state: 'before' | 'after' = 'before', action: Action): ReducerResult<'before' | 'after'> {
  switch (action.type) {
    case Actions.init:
      return withEffects(state, {
        operation: (inject) => inject(TestService).performSideEffect(),
        next: () => new NextAction()
      });
    case Actions.next:
      return 'after' as const;
  }
}

export enum Actions {
  init = 'init',
  next = 'next'
}

export class InitAction {
  readonly type = Actions.init;
}

export class NextAction {
  readonly type = Actions.next;
}

export type Action = InitAction | NextAction;
