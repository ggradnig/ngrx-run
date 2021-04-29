import { simulate } from '../src/testing';
import { mockProvider } from '@ngneat/spectator/jest';
import {Actions, reducer, TestService} from './inject';
import { of } from 'rxjs';

describe('Testing', () => {
  it('should perform the side effect of the mocked service', async () => {
    const state = await simulate(reducer, [Actions.init({ inc: 1 })], {
      providers: [mockProvider(TestService, { increment: () => of(1) })]
    });

    expect(state).toEqual(2);
  });

  it('should call two actions', async () => {
    const state = await simulate(
      reducer,
      [Actions.init({ inc: 1 }), Actions.last()],
      {
        providers: [mockProvider(TestService, { increment: () => of(1) })]
      }
    );

    expect(state).toEqual(3);
  });
});
