import {Action, Dispatch} from 'redux';
import * as assert from 'assert';
import {thunk, thunkAs, isThunkAction} from './index';

const assertEqual = assert.deepStrictEqual;

const dispatch = <A extends Action>(a: A) => a;
const getState = () => ({});

describe('thunk()', () => {
  it('wraps a thunk function as an action', async () => {
    const val = Symbol('return value');
    const action = thunk(async () => val);
    const returnValue = await action.thunk(dispatch, getState, null);
    assertEqual(returnValue, val, 'comparing return values');
  });

  it('provides a promise to access the return value', async () => {
    const val = Symbol('return value');
    const action = thunk(async () => val);
    action.thunk(dispatch, getState, null);
    assertEqual(await action.promise, val, 'comparing return values');
  });
});

describe('thunkAs()', () => {
  it('allows to specify the thunk type', () => {
    const action = thunkAs('SOME_ACTION_NAME', async () => {});
    assertEqual(action.thunkType, 'SOME_ACTION_NAME', 'comparing thunk type');
  });
});

describe('isThunkAction()', () => {
  it('determines a given action is a thunk action or not', () => {
    const normalAction = {type: 'HELLO'};
    assert(!isThunkAction(normalAction), 'checking non-thunk action');

    const thunkAction = thunk(async () => {});
    assert(isThunkAction(thunkAction), 'checking thunk action');
  });
});

describe('thunk middleware', () => {
  // TODO: Write tests about the middleware.
});
