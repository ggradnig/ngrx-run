import {ClassProvider, InjectionToken, Injector, ModuleWithProviders, NgModule, Provider} from '@angular/core';
import {
  Action,
  combineReducers,
  META_REDUCERS,
  MetaReducer,
  REDUCER_FACTORY,
  RootStoreConfig,
  State,
  StateObservable,
  StoreConfig,
  StoreFeatureModule,
  StoreModule,
  StoreRootModule,
  USER_PROVIDED_META_REDUCERS
} from '@ngrx/store';
import { createRuntimeReducerFactory } from './reducer';
import {ActionReducer, ActionReducerMap} from './types';

export const _REDUCER_FACTORY = new InjectionToken('ngrx-runtime Internal Reducer Factory Provider');
export const _RESOLVED_META_REDUCERS = new InjectionToken<MetaReducer>('ngrx-runtime Internal Resolved Meta Reducers');

@NgModule({})
export class RuntimeStoreModule extends StoreModule {
  static forRoot<T, V extends Action = Action>(
    reducers: ActionReducerMap<T, V> | InjectionToken<ActionReducerMap<T, V>>,
    config?: RootStoreConfig<T, V>
  ): ModuleWithProviders<StoreRootModule>;
  static forRoot(
    reducers: ActionReducerMap<any, any> | InjectionToken<ActionReducerMap<any, any>>,
    config: RootStoreConfig<any, any> = {}
  ): ModuleWithProviders<StoreRootModule> {
    const store = StoreModule.forRoot(reducers, {
      ...config,
      runtimeChecks: { ...config.runtimeChecks, strictStateImmutability: false }
    });

    return {
      ngModule: store.ngModule,
      providers: [
        ...(store.providers ?? []),
        {
          provide: _RESOLVED_META_REDUCERS,
          deps: [META_REDUCERS, USER_PROVIDED_META_REDUCERS],
          useFactory: _concatMetaReducers
        },
        {
          provide: _REDUCER_FACTORY,
          useValue: config.reducerFactory ? config.reducerFactory : combineReducers
        },
        {
          provide: REDUCER_FACTORY,
          deps: [_REDUCER_FACTORY, Injector, _RESOLVED_META_REDUCERS],
          useFactory: createRuntimeReducerFactory
        }
      ]
    };
  }
}


export function _concatMetaReducers(
  metaReducers: MetaReducer[],
  userProvidedMetaReducers: MetaReducer[]
): MetaReducer[] {
  return metaReducers.concat(userProvidedMetaReducers);
}
