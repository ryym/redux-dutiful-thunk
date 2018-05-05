import {Action, Dispatch} from 'redux';
import * as assert from 'assert';
import {thunk, thunkAs, isThunkAction, createThunkMiddleware} from './index';

const assertEqual = assert.deepStrictEqual;

const dispatch = <A extends Action>(a: A) => a;
const getState = () => ({});

describe('thunk()', () => {
  it('wraps a thunk function as an action', async () => {
    const val = Symbol('return value');
    const action = thunk(async () => val);
    const returnValue = await action.thunk(dispatch, getState);
    assertEqual(returnValue, val, 'comparing return values');
  });

  it('provides a promise to access the return value', async () => {
    const val = Symbol('return value');
    const action = thunk(async () => val);
    action.thunk(dispatch, getState);
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
  const thunkMiddleware = createThunkMiddleware();
  const runNext = thunkMiddleware({dispatch, getState});

  it('runs a thunk', async () => {
    const val = Symbol('return value');
    const action = runNext(dispatch)(thunk(async () => val));
    assertEqual(await action.promise, val, 'checking return value of middleware');
  });

  it('just passes action to next if not a thunk', () => {
    let nextCalled = false;
    let someFuncCalled = false;

    const action = {
      type: 'SOME_ACTION',
      someFunc: async () => {
        someFuncCalled = true;
      },
    };
    const mockDispatch = <A extends Action>(a: A) => {
      nextCalled = true;
      return a;
    };
    const returnedAction = runNext(mockDispatch)(action);

    assert(nextCalled, 'checking next is called');
    assert(!someFuncCalled, 'checking non-thunk action is not called');
    assertEqual(returnedAction, action, 'checking returned action');
  });

  context('with context', () => {
    const context = Symbol('context');
    const thunkMiddleware = createThunkMiddleware(context);
    const runNext = thunkMiddleware({dispatch, getState});

    it('passes a context to thunk function', async () => {
      const action = runNext(dispatch)(thunk(async (d, s, ctx) => ctx));
      assertEqual(await action.promise, context, 'comparing context');
    });
  });
});
