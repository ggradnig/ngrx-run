import {ClassProvider, InjectionToken, ModuleWithProviders, NgModule, Provider} from '@angular/core';
import {
  Action,
  RootStoreConfig,
  State,
  StateObservable,
  StoreConfig,
  StoreFeatureModule,
  StoreModule,
  StoreRootModule
} from '@ngrx/store';
import {ActionReducer, STATE_PROVIDERS} from './state';

/**
 * An object with the name and the reducer for the feature.
 */
export interface FeatureSlice<T, V extends Action = Action> {
  name: string;
  reducer: ActionReducer<T>;
}

@NgModule({})
export class RuntimeStoreModule {
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
      runtimeChecks: {...config.runtimeChecks, strictStateImmutability: false}
    });
    store.providers = [
      ...(store.providers as Provider[]).filter(
        (provider) => !isClassProvider(provider) || (provider.provide !== StateObservable && provider.provide !== State)
      ),
      ...STATE_PROVIDERS
    ];
    return store;
  }

  static forFeature<T, V extends Action = Action>(
    featureName: string,
    reducers: ActionReducerMap<T, V> | InjectionToken<ActionReducerMap<T, V>>,
    config?: StoreConfig<T, V> | InjectionToken<StoreConfig<T, V>>
  ): ModuleWithProviders<StoreFeatureModule>;
  static forFeature<T, V extends Action = Action>(
    featureName: string,
    // tslint:disable-next-line:unified-signatures
    reducer: ActionReducer<T> | InjectionToken<ActionReducer<T>>,
    config?: StoreConfig<T, V> | InjectionToken<StoreConfig<T, V>>
  ): ModuleWithProviders<StoreFeatureModule>;
  static forFeature<T, V extends Action = Action>(
    slice: FeatureSlice<T, V>,
    config?: StoreConfig<T, V> | InjectionToken<StoreConfig<T, V>>
  ): ModuleWithProviders<StoreFeatureModule>;
  static forFeature(
    featureNameOrSlice: string | FeatureSlice<any, any>,
    reducersOrConfig?:
      | ActionReducerMap<any, any>
      | InjectionToken<ActionReducerMap<any, any>>
      | ActionReducer<any>
      | InjectionToken<ActionReducer<any>>
      | StoreConfig<any, any>
      | InjectionToken<StoreConfig<any, any>>,
    config: StoreConfig<any, any> | InjectionToken<StoreConfig<any, any>> = {}
  ): ModuleWithProviders<StoreFeatureModule> {
    // @ts-ignore
    const store = StoreModule.forFeature(featureNameOrSlice, reducersOrConfig, config);
    store.providers = [
      ...(store.providers as Provider[]).filter(
        (provider) => !isClassProvider(provider) || (provider.provide !== StateObservable && provider.provide !== State)
      ),
      ...STATE_PROVIDERS
    ];
    return store;
  }
}

function isClassProvider(provider: any): provider is ClassProvider {
  return provider.provide !== undefined && provider.useClass !== undefined;
}

export declare type ActionReducerMap<T, V extends Action = Action> = {
  [p in keyof T]: ActionReducer<T[p]>;
};
