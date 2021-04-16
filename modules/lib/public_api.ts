/*
 * Public API Surface of ngrx-reducer-effects
 */
export {createReducerEffect} from './src/create-reducer-effect';
export {run, unsubscribe} from './src/functions';
export {ReducerResult as StateWithEffects, ActionReducer} from './src/reducer';
export {EffectStoreModule} from './src/module';
export {ActionsOf} from './src/extra-utils';
export {EffectConfig} from './src/effect-config';
