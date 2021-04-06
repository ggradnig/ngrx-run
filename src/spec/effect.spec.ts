import { Store } from '@ngrx/store';
import { TestBed } from '@angular/core/testing';
import { EffectStoreModule } from '../lib/module';
import {IncrementAction, reducer, State, SubscribeAction, SubscribedAction} from './counter';
import { testStoreValueAsync } from './util';
import {SubscriptionToken} from '../lib/functions';

describe('Effect description', () => {
  let store: Store<{ feature: State }>;

  function setup(): void {
    TestBed.configureTestingModule({
      imports: [EffectStoreModule.forRoot({ feature: reducer })]
    });
    store = TestBed.inject(Store);
  }

  it(`should contain an effect with the name of effect and actions`, async () => {
    setup();
    store.dispatch(new SubscribeAction());
    await testStoreValueAsync(
      [
        {
          type: 'Interval',
          nextAction: new IncrementAction().type,
          subscribeAction: new SubscribedAction({token: 1 as SubscriptionToken}).type,
        }
      ],
      (state) => state.__effects__
    );
  });
});
