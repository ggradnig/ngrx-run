import { Action, ActionCreator } from '@ngrx/store';
import { ReducerResult } from './reducer';

export type ActionsOf<T extends { [key: string]: (...args: any) => any }> = ReturnType<
  T[keyof T]
>;

export function isActionOf<T extends { [key: string]: ActionCreator }>(
  action: Action,
  actions: T
): action is ActionsOf<T> & Action {
  return Object.values(actions)
    .map((a) => a.type)
    .includes(action.type);
}

export function childReducer<S, K extends keyof S, A extends Action>(
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

export function tokenized<T, K extends string, P extends object>(
  actionCreator: ActionCreator<K, (props: P) => P & TypedAction<K>>,
  token: Token<P>
): ActionCreator<K, (props: P) => P & TypedAction<K>> & Tokenized<T, P, K> {
  return ((p: P) => Object.assign(actionCreator(p), {token})) as any;
}

export function hasToken<P>(maybeTokenized: Action, token: Token<P>): maybeTokenized is Action & P {
  return isTokenized(maybeTokenized) && maybeTokenized.token === token;
}

export function createToken<U>(token: string): Token<U> {
  return token as Token<U>;
}

type Token<U> = string & U;

function isTokenized(maybeTokenized: any): maybeTokenized is Tokenized<any, any, any> {
  return maybeTokenized.token != null;
}

type Tokenized<T, P, K extends string> = { token: T } & PropsFn<P, K>;
type PropsFn<P, K extends string> = (props: P) => P & TypedAction<K>;

interface TypedAction<T extends string> extends Action {
  readonly type: T;
}
