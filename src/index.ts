import {Dispatch, Action, AnyAction, Middleware, MiddlewareAPI} from 'redux';

export type Thunk<S, A extends Action, C, R> = (
  dispatch: Dispatch<A>,
  getState: () => S,
  context: C,
) => Promise<R>;

export type ThunkType = string | null;

export type ThunkAction<S, A extends Action, C, R, T extends ThunkType> = {
  readonly type: '@@redux-dutiful-thunk/THUNK';
  readonly thunk: Thunk<S, A, C, R>;
  readonly promise: Promise<R>;
  readonly thunkType: T;
};

export type AnyThunkAction<R = any, T extends ThunkType = any> = ThunkAction<
  any,
  AnyAction,
  any,
  R,
  T
>;

export function thunk<S, A extends Action, C, R>(
  f: Thunk<S, A, C, R>,
): ThunkAction<S, A, C, R, null> {
  return thunkAs(null, f);
}

export function thunkAs<S, A extends Action, C, R, T extends ThunkType>(
  thunkType: T,
  f: Thunk<S, A, C, R>,
): ThunkAction<S, A, C, R, T> {
  let _resolve: (r: R) => any, _reject: (a: any) => any;
  const promise = new Promise<R>((resolve, reject) => {
    _resolve = resolve;
    _reject = reject;
  });

  return {
    type: '@@redux-dutiful-thunk/THUNK',
    thunk: (dispatch, getState, context) => {
      return f(dispatch, getState, context)
        .then(_resolve)
        .catch(_reject);
    },
    promise,
    thunkType,
  };
}

export function createThunkMiddleware<C = void, D extends Dispatch = Dispatch>(
  context?: C,
): Middleware<{}, any, D> {
  return <S>({dispatch, getState}: MiddlewareAPI<D, S>) => next => action => {
    if (action != null && action.type === '@@redux-dutiful-thunk/THUNK') {
      action.thunk(dispatch, getState, context);
      return action;
    }
    return next(action);
  };
}
