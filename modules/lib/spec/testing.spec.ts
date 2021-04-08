import { Actions, reducer, TestService } from './inject';
import { reduceWithEffects } from '../../testing/src/testing';
import { mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';

describe('Testing', () => {
  it('should perform the side effect of the mocked service', async () => {
    const state = await reduceWithEffects(reducer, [Actions.init({inc: 1})], {
      providers: [mockProvider(TestService, { performSideEffect: () => of(void 0) })]
    });

    expect(state).toEqual(2);
  });

  it('should call two actions', async () => {
    const state = await reduceWithEffects(reducer, [Actions.init({inc: 1}), Actions.last()], {
      providers: [mockProvider(TestService, { performSideEffect: () => of(void 0) })]
    });

    expect(state).toEqual(3);
  });
});
