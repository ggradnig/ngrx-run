import { Inject, Injectable, Injector, OnDestroy, Provider } from '@angular/core';
import {
  Action,
  ActionsSubject,
  INIT,
  INITIAL_STATE,
  ReducerObservable,
  ScannedActionsSubject,
  StateObservable,
  Store
} from '@ngrx/store';
import {asyncScheduler, BehaviorSubject, isObservable, Observable, queueScheduler, Subscription} from 'rxjs';
import { observeOn, scan, withLatestFrom } from 'rxjs/operators';
import {
  Cancellable,
  CancelToken,
  ObservableEffect,
  PromiseEffect,
  StateWithCancellation,
  StateWithEffect
} from './functions';

@Injectable()
export class State<T> extends BehaviorSubject<any> implements OnDestroy {
  static readonly INIT = INIT;

  private stateSubscription: Subscription;
  private runtime = new Map<CancelToken, Cancellable<any>>();

  constructor(
    actions$: ActionsSubject,
    reducer$: ReducerObservable,
    scannedActions: ScannedActionsSubject,
    @Inject(INITIAL_STATE) initialState: any,
    injector: Injector
  ) {
    super(initialState);

    const actionsOnQueue$: Observable<Action> = actions$.pipe(observeOn(queueScheduler));
    const withLatestReducer$: Observable<[Action, ActionReducer<any>]> = actionsOnQueue$.pipe(withLatestFrom(reducer$));

    const seed: StateActionPair<T> = { state: initialState };
    const stateAndAction$: Observable<{
      state: any;
      action?: Action;
    }> = withLatestReducer$.pipe(
      scan<[Action, ActionReducer<T>], StateActionPair<T>>(reduceState(injector, this.runtime), seed)
    );

    this.stateSubscription = stateAndAction$.subscribe(({ state, action }) => {
      this.next(state);
      // tslint:disable-next-line:no-non-null-assertion
      scannedActions.next(action!);
    });
  }

  ngOnDestroy(): void {
    this.stateSubscription.unsubscribe();
    this.complete();
  }
}

export const STATE_PROVIDERS: Provider[] = [State, { provide: StateObservable, useExisting: State }];

export type ReducerResult<T> = T | StateWithEffect<T, any> | StateWithCancellation<T>;

export type ActionReducer<T, V extends Action = Action> = (state: T | undefined, action: V) => ReducerResult<T>;

export type StateActionPair<T, V extends Action = Action> = {
  state: T | undefined;
  action?: V;
};

type Runtime = Map<CancelToken, Cancellable<any>>;

export function reduceState<T, V extends Action = Action>(
  injector: Injector,
  runtime: Runtime
): (
  stateActionPair: StateActionPair<T, V> | undefined,
  [action, reducer]: [V, ActionReducer<T, V>]
) => StateActionPair<T, V> {
  return (stateActionPair, [action, reducer]) => {
    const { state } = stateActionPair ?? { state: undefined };
    const reduced = reducer(state, action);
    let newState: T = handleSlice(reduced);
    // tslint:disable-next-line:forin
    for (const key in newState) {
      newState = { ...newState, [key]: handleSlice(newState[key]) };
    }
    return { state: newState, action };
  };

  function handleSlice<S>(slicedState: ReducerResult<S>): S {
    if (isStateWithEffect(slicedState)) {
      return handleStateWithEffect(slicedState, runtime, injector.get(Store));
    } else if (isStateWithCancellation(slicedState)) {
      return handleStateWithCancellation(slicedState, runtime);
    } else {
      return slicedState;
    }
  }
}

function isStateWithEffect(state: any): state is StateWithEffect<any, any> {
  return state.__brand === 'StateWithEffect';
}

function isStateWithCancellation(state: any): state is StateWithCancellation<any> {
  return state.__brand === 'StateWithCancellation';
}

function handleStateWithEffect<S, E>(stateWithEffect: StateWithEffect<S, E>, runtime: Runtime, store: Store): S {
  const token = (Math.max(...runtime.keys()) + 1) as CancelToken;
  if (isObservableEffect(stateWithEffect)) {
    const subscription = stateWithEffect.effect.subscribe({
      next: (value) => store.dispatch(stateWithEffect.handler.next(value)),
      error: (err) => stateWithEffect.handler.error && store.dispatch(stateWithEffect.handler.error(err)),
      complete: () => stateWithEffect.handler.complete && store.dispatch(stateWithEffect.handler.complete())
    });
    runtime.set(token, subscription);
  } else if (isPromiseEffect(stateWithEffect)) {
    stateWithEffect.effect.then(
      (value) => store.dispatch(stateWithEffect.handler.resolve(value)),
      (err) => stateWithEffect.handler.reject && store.dispatch(stateWithEffect.handler.reject(err))
    );
    if (stateWithEffect.abortController) {
      runtime.set(token, stateWithEffect.abortController);
    }
  }
  return stateWithEffect.stateFn(token);
}

function isObservableEffect(
  state: StateWithEffect<any, any>
): state is StateWithEffect<any, any> & ObservableEffect<any> {
  return isObservable(state.effect);
}

function isPromiseEffect(state: StateWithEffect<any, any>): state is StateWithEffect<any, any> & PromiseEffect<any> {
  return state.effect instanceof Promise;
}

function handleStateWithCancellation<S>(stateWithCancellation: StateWithCancellation<S>, runtime: Runtime): S {
  const cancellable = runtime.get(stateWithCancellation.cancelToken);
  if (cancellable instanceof Subscription) {
    runtime.delete(stateWithCancellation.cancelToken);
    cancellable.unsubscribe();
  } else if (cancellable instanceof AbortController) {
    runtime.delete(stateWithCancellation.cancelToken);
    cancellable.abort();
  } else {
    console.warn(`CancelToken ${stateWithCancellation.cancelToken} not recognized. Did you cancel this already?`);
  }
  return stateWithCancellation.state;
}
