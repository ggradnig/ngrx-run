/*
 * Public API Surface of ngrx-reducer-effects
 */
export {withEffects, unsubscribe, createReducerEffect, EffectConfig} from './src/functions';
export {ReducerResult as StateWithEffects, ActionReducer} from './src/types';
export {EffectStoreModule} from './src/module';
export {ActionsOf, Status, Loaded, Loading, Failed, StatusTypes} from './src/util';
