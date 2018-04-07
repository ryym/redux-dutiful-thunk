import {Dispatch, Action, AnyAction, Middleware, MiddlewareAPI} from 'redux';

// Thunk is a type of thunk function.
export type Thunk<S, A extends Action, C = null, R = void> = (
  dispatch: Dispatch<A>,
  getState: () => S,
  context: C,
) => Promise<R>;

export const ACTION_TYPE = '@@redux-dutiful-thunk/THUNK';
export type ActionType = typeof ACTION_TYPE;

export type ThunkType = any | null;

// ThunkAction is a type of a thunk action that is created by thunk action creators.
export type ThunkAction<S, A extends Action, C, R, T extends ThunkType> = {
  readonly type: ActionType;
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

// thunk creates a thunk action from a given thunk function.
// A null is set to its thunk type.
export function thunk<S, A extends Action, C, R>(
  f: Thunk<S, A, C, R>,
): ThunkAction<S, A, C, R, null> {
  return thunkAs(null, f);
}

// thunkAs creates a thunk action from a given thunk function and thunk type.
export function thunkAs<S, A extends Action, C, R, T extends ThunkType>(
  thunkType: T,
  f: Thunk<S, A, C, R>,
): ThunkAction<S, A, C, R, T> {
  let _resolve: (r: R) => any;
  let _reject: (a: any) => any;
  const promise = new Promise<R>((resolve, reject) => {
    _resolve = resolve;
    _reject = reject;
  });

  return {
    type: ACTION_TYPE,
    thunk: (dispatch, getState, context) => {
      f(dispatch, getState, context)
        .then(_resolve)
        .catch(_reject);
      return promise;
    },
    promise,
    thunkType,
  };
}

// isThunkAction determines a given action is a thunk action or not.
export function isThunkAction(action: AnyAction): action is AnyThunkAction {
  return action.type === ACTION_TYPE;
}

// createThunkMiddleware creates a Redux middleware.
// Optionally you can specify a context that will be passed to thunk functions.
export function createThunkMiddleware<C = void, D extends Dispatch = Dispatch>(
  context?: C,
): Middleware<{}, any, D> {
  return <S>({dispatch, getState}: MiddlewareAPI<D, S>) => next => action => {
    if (action != null && isThunkAction(action)) {
      action.thunk(dispatch, getState, context);

      // Currently we return `action` without calling `next` like redux-thunk.
      // But this is just an action so we can pass it to `next` as well.
      return action;
    }
    return next(action);
  };
}
