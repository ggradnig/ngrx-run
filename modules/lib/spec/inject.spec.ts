import { Store } from '@ngrx/store';
import { TestBed } from '@angular/core/testing';
import { EffectStoreModule } from '../src/module';
import { Actions, reducer } from '../../testing/spec/inject';
import { testStoreValue } from './util';

describe('Inject', () => {
  let store: Store<{ feature: {} }>;

  function setup(): void {
    TestBed.configureTestingModule({
      imports: [EffectStoreModule.forRoot({ feature: reducer })]
    });
    store = TestBed.inject(Store);
  }

  it('should perform the side effect', (done) => {
    setup();
    store.dispatch(Actions.init({inc: 1}));
    testStoreValue(2, done);
  });
});
