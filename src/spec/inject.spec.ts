import { Store } from '@ngrx/store';
import { TestBed } from '@angular/core/testing';
import { RuntimeStoreModule } from '../lib/module';
import { InitAction, reducer } from './inject';
import {testStoreValue} from './util';

describe('Store', () => {
  let store: Store<{ feature: {} }>;

  function setup(): void {
    TestBed.configureTestingModule({
      imports: [RuntimeStoreModule.forRoot({ feature: reducer })]
    });
    store = TestBed.inject(Store);
  }

  it('should increase the counter twice and then unsubscribe', done => {
    setup();
    store.dispatch(new InitAction());
    testStoreValue('after', done);
  });
});
