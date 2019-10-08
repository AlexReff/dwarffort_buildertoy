import { TILE_H, TILE_W } from "../../constants";
import { ACTION_TYPE, ReduxState } from "../store";

//#region REDUX ACTIONS

export function setCameraPos(x: number, y: number) {
    return {
        type: ACTION_TYPE.SET_CAMERA_POS,
        x,
        y,
    };
}

export function setCameraZ(z: number) {
    return {
        type: ACTION_TYPE.SET_ZLEVEL,
        z,
    };
}

export function setMapSize(mapWidth: number, mapHeight: number, gridWidth: number, gridHeight: number) {
    return {
        type: ACTION_TYPE.SET_MAP_SIZE,
        mapWidth,
        mapHeight,
        gridWidth,
        gridHeight,
    };
}

export function setGridBounds(bounds: ReturnType<HTMLElement["getBoundingClientRect"]>) {
    return {
        type: ACTION_TYPE.SET_GRID_BOUNDS,
        bounds,
    };
}

//#endregion
//#region THUNK ACTIONS

export function resizeWindow(container: HTMLElement) {
    return (dispatch, getState) => {
        const state: ReduxState = getState();

        const gridWidth = Math.floor(container.offsetWidth / TILE_W);
        const gridHeight = Math.floor(container.offsetHeight / TILE_H);

        const mapWidth = Math.max(state.camera.mapWidth, gridWidth);
        const mapHeight = Math.max(state.camera.mapHeight, gridHeight);

        dispatch(setMapSize(mapWidth, mapHeight, gridWidth, gridHeight));
    };
}

//#endregion
