/*
 * Public API Surface of ngrx-reducer-effects
 */
export {withEffects, unsubscribe, createReducerEffect} from './lib/functions';
export {ReducerResult as StateWithEffects} from './lib/types';
export {EffectStoreModule} from './lib/module';
export {reduceWithEffects, testing} from './lib/testing';
export {ActionsOf, Status, Loaded, Loading, Failed, StatusTypes} from './lib/util';
