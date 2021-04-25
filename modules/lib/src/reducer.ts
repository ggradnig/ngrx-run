import { Action } from '@ngrx/store';
import { StateWithEffect } from './state-with-effect';

export declare type ActionReducerMap<T, V extends Action = Action> = {
  [p in keyof T]: ActionReducer<T[p]>;
};
export type ReducerResult<TState> = TState | StateWithEffect<TState, any[], any>;
export type ActionReducer<T> = (state: T | undefined, action: any) => ReducerResult<T>;
