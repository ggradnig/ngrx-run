import { Store, StoreModule } from '@ngrx/store';
import { TestBed } from '@angular/core/testing';
import { RuntimeStoreModule } from '../lib/module';
import { reducer, State, States, SubscribeAction, UnsubscribeAction } from './counter';
import {testStoreValue} from './util';

jest.useFakeTimers();
describe('Store', () => {
  let store: Store<{ feature: State }>;

  function setup(): void {
    TestBed.configureTestingModule({
      imports: [RuntimeStoreModule.forRoot({}), StoreModule.forFeature('feature', reducer)]
    });
    store = TestBed.inject(Store);
  }

  it('should increase the counter twice and then unsubscribe', (done) => {
    setup();
    store.dispatch(new SubscribeAction());
    jest.advanceTimersByTime(2000);
    store.dispatch(new UnsubscribeAction());
    jest.advanceTimersByTime(1000);
    testStoreValue({ counter: 2, type: States.unsubscribed }, done);
  });
});
