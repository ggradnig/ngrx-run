import { Store, StoreModule } from '@ngrx/store';
import { TestBed } from '@angular/core/testing';
import { EffectStoreModule } from '../lib/module';
import { IncrementAction, reducer, State, States, SubscribeAction, UnsubscribeAction } from './counter';
import { testStoreValue } from './util';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';

jest.useFakeTimers();
describe('Store', () => {
  let store: Store<{ feature: State }>;

  function setup(): void {
    TestBed.configureTestingModule({
      imports: [EffectStoreModule.forRoot({ feature: reducer })]
    });
    store = TestBed.inject(Store);
  }

  function setupWithFeature(): void {
    TestBed.configureTestingModule({
      imports: [EffectStoreModule.forRoot({}), StoreModule.forFeature('feature', reducer)]
    });
    store = TestBed.inject(Store);
  }

  function setupWithDevTools(): void {
    TestBed.configureTestingModule({
      imports: [
        EffectStoreModule.forRoot({}),
        StoreModule.forFeature('feature', reducer),
        StoreDevtoolsModule.instrument()
      ]
    });
    store = TestBed.inject(Store);
  }

  it(`should run the basic test case with default setup`, (done) => {
    setup();
    basicTestCase(store, done);
  });

  it(`should run the interval test case with default setup`, (done) => {
    setup();
    intervalTestCase(store, done);
  });

  it(`should run the basic test case with feature-store setup`, (done) => {
    setupWithFeature();
    basicTestCase(store, done);
  });

  it(`should run the interval test case with feature-store setup`, (done) => {
    setupWithFeature();
    intervalTestCase(store, done);
  });

  it(`should run the basic test case with dev-tools setup`, (done) => {
    setupWithDevTools();
    basicTestCase(store, done);
  });

  it(`should run the interval test case with dev-tools setup`, (done) => {
    setupWithDevTools();
    intervalTestCase(store, done);
  });
});

function basicTestCase(store: Store<any>, done: () => void): void {
  store.dispatch(new IncrementAction());
  testStoreValue({ counter: 1, type: States.unsubscribed }, done);
}

function intervalTestCase(store: Store<any>, done: () => void): void {
  store.dispatch(new SubscribeAction());
  jest.advanceTimersByTime(2000);
  store.dispatch(new UnsubscribeAction());
  jest.advanceTimersByTime(1000);
  testStoreValue({ counter: 2, type: States.unsubscribed }, done);
}
