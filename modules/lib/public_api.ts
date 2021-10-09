/*
 * Public API Surface of ngrx-run
 */
export {createEffect} from './src/create-effect';
export {unsubscribe} from './src/unsubscribe';
export {run} from './src/run';
export {ReducerResult as StateWithEffects, ActionReducer} from './src/reducer';
export {EffectStoreModule} from './src/module';
export {ActionsOf, isActionOf, childReducer, tokenized, hasToken, createToken} from './src/extra-utils';
export {EffectConfig} from './src/effect-config';
export {SubscriptionToken} from './src/effect';
