import { Store } from '@ngrx/store';
import { TestBed } from '@angular/core/testing';
import { RuntimeStoreModule } from '../lib/module';
import { Actions, reducer } from './inject';
import { testStoreValue } from './util';

describe('Inject', () => {
  let store: Store<{ feature: {} }>;

  function setup(): void {
    TestBed.configureTestingModule({
      imports: [RuntimeStoreModule.forRoot({ feature: reducer })]
    });
    store = TestBed.inject(Store);
  }

  it('should perform the side effect', (done) => {
    setup();
    store.dispatch(Actions.init());
    testStoreValue(2, done);
  });
});
