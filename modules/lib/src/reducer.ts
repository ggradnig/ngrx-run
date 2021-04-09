import { Action } from '@ngrx/store';
import {StateWithEffects} from './state-with-effects';

export declare type ActionReducerMap<T, V extends Action = Action> = {
  [p in keyof T]: ActionReducer<T[p]>;
};
export type ReducerResult<T> = T | StateWithEffects<T, any>;
export type ActionReducer<T> = (state: T | undefined, action: any) => ReducerResult<T>;
