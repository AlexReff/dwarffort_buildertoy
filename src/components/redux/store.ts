import { produce as createNextState } from "immer";
import { Action, AnyAction, applyMiddleware, createStore, Reducer, ReducersMapObject } from "redux";
import thunk, { ThunkMiddleware } from "redux-thunk";
import building from "./building/reducer";
import { setCameraPos, setCameraZ, setMapSize } from "./camera/actions";
import camera from "./camera/reducer";
import { setCursorPos } from "./cursor/actions";
import cursor from "./cursor/reducer";
import { setDesignateStart, setDigData } from "./digger/actions";
import digger from "./digger/reducer";
import { _setMenus } from "./menu/actions";
import menu from "./menu/reducer";
import { _initialize, toggleAnimation } from "./settings/actions";
import settings from "./settings/reducer";

export const ALL_REDUCERS = {
    building,
    camera,
    cursor,
    digger,
    menu,
    settings,
};

export const enum ACTION_TYPE {
    INITIALIZE,
    SET_MENU,
    SELECT_PREV_MENU,
    SET_STRICT_MODE,
    SET_CAMERA_POS,
    SET_CURSOR_POS,
    SET_MAP_SIZE,
    SET_ZLEVEL,
    DESIGNATE_START,
    ANIMATION_TOGGLE,
    DESIGNATE_SET_TILES,
}

function combineReducersImmer<S, A extends Action = AnyAction>(produce, reducers: ReducersMapObject<S, A> = {} as ReducersMapObject): Reducer<S, A> {
    const keys = Object.keys(reducers);
    const initialState = keys.reduce((a, k) => {
        a[k] = reducers[k](undefined, {});
        return a;
    }, {});

    return produce((draft, action) => {
        for (const key of keys) {
            draft[key] = reducers[key](draft[key], action);
        }
        return draft;
    }, initialState);
}

const COMBINED_REDUCERS = combineReducersImmer(createNextState, ALL_REDUCERS);

export type ReduxState = ReturnType<typeof COMBINED_REDUCERS>;

type CombinedParamTypes<T extends {
    [key: string]: (state: any, action: any) => any;
}> = T extends {
    [key: string]: (state: infer R, action: any) => any;
} ? R : never;

type CombinedReturnTypes<T extends {
    [key: string]: (...args: any) => any;
}> = T extends {
    [key: string]: (...args) => infer R;
} ? R : never;

export type FlatReduxState = CombinedParamTypes<typeof ALL_REDUCERS>;

type NON_THUNK_ACTIONS =
    //camera
    ReturnType<typeof setMapSize> |
    ReturnType<typeof setCameraPos> |
    ReturnType<typeof setCameraZ> |
    //cursor
    ReturnType<typeof setCursorPos> |
    // ReturnType<typeof setCursorTiles> |
    //digger
    ReturnType<typeof setDesignateStart> |
    ReturnType<typeof setDigData> |
    //menu
    ReturnType<typeof _setMenus> |
    //settings
    ReturnType<typeof toggleAnimation> |
    // ReturnType<typeof setStrictMode> |
    ReturnType<typeof _initialize>;

const store = createStore(COMBINED_REDUCERS, applyMiddleware(thunk as ThunkMiddleware<ReduxState, NON_THUNK_ACTIONS>));

export function GetFlattenedState(_this: FlatReduxState, _store: typeof store) {
    return FlatGetState(_this, _store.getState);
}

export function FlatGetState(_this: Partial<FlatReduxState>, getState: typeof store.getState): FlatReduxState {
    const newState = getState();
    for (const reducer of Object.keys(newState)) {
        for (const prop of Object.keys(newState[reducer])) {
            _this[prop] = newState[reducer][prop];
        }
    }
    return _this as FlatReduxState;
}

export default store;
