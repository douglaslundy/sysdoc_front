import tripReducer, { addReplicatedTrips } from '../../src/store/ducks/trips';

describe('tripReducer - addReplicatedTrips', () => {
  it('prepends replicated trips to the existing trips list without removing existing ones', () => {
    const initialState = { trips: [{ id: 1, obs: 'original' }], trip: {} };
    const newTrips = [{ id: 2, obs: 'original' }, { id: 3, obs: 'original' }];

    const nextState = tripReducer(initialState, addReplicatedTrips(newTrips));

    expect(nextState.trips).toEqual([
      { id: 2, obs: 'original' },
      { id: 3, obs: 'original' },
      { id: 1, obs: 'original' },
    ]);
  });
});
