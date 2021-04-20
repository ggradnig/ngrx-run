/*
 * Public API Surface of ngrx-run
 */
export {createEffect} from './src/create-effect';
export {run, unsubscribe} from './src/functions';
export {ReducerResult as StateWithEffects, ActionReducer} from './src/reducer';
export {EffectStoreModule} from './src/module';
export {ActionsOf} from './src/extra-utils';
export {EffectConfig} from './src/effect-config';
