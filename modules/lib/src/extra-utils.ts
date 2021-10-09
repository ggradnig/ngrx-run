import { ActionCreator } from '@ngrx/store';
import { TypedAction } from '@ngrx/store/src/models';
import { ReducerResult } from './reducer';

export type ActionsOf<T extends { [key: string]: (...args: any) => any }> = ReturnType<
  T[keyof T]
>;

export function isActionOf<T extends { [key: string]: ActionCreator }, K extends string>(
  action: TypedAction<K>,
  actions: T
): action is ActionsOf<T> & TypedAction<K> {
  return Object.values(actions)
    .map((a) => a.type)
    .includes(action.type);
}

export function childReducer<S, K extends keyof S, A extends TypedAction<string>>(
  state: S,
  key: K,
  action: A,
  reducer: InitializedActionReducer<S[K], A>
): S {
  return {
    ...state,
    [key]: reducer(state[key], action)
  };
}

type InitializedActionReducer<T, A> = (state: T, action: A) => ReducerResult<T>;
