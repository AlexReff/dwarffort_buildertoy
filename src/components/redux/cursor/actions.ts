import { DEFAULTS, DIRECTION, IRenderTile } from "../../constants";
import { setCameraPos } from "../camera/actions";
import { ACTION_TYPE, FlatGetState, FlatReduxState } from "../store";
import { getCursorTiles } from "./cursor";

// export function hideCursor() {
//     return {
//         type: ACTION_TYPE.CURSOR_HIDE,
//     };
// }

// export function showCursor() {
//     return {
//         type: ACTION_TYPE.CURSOR_SHOW,
//     };
// }

/** DO NOT CALL DIRECTLY -- USE 'moveCursorToPos' INSTEAD */
export function setCursorPos(cursorX: number, cursorY: number) {
    return {
        type: ACTION_TYPE.SET_CURSOR_POS,
        cursorX,
        cursorY,
    };
}

export function setCursorTiles(tiles: IRenderTile[]) {
    return {
        type: ACTION_TYPE.SET_CURSOR_TILES,
        tiles,
    };
}

export function moveCursorDirection(dir: DIRECTION, shiftPressed: boolean = false) {
    return (dispatch, getState) => {
        const state = FlatGetState({}, getState);
        const distance = shiftPressed ? 10 : 1;

        switch (dir) {
            case DIRECTION.N:
                if (state.cursorY - state.cursorDiameter > 0) {
                    state.cursorY = Math.max(state.cursorDiameter, state.cursorY - distance);
                }
                break;
            case DIRECTION.NE:
                if (state.cursorY - state.cursorDiameter > 0 ||
                    state.cursorX + state.cursorDiameter < state.mapWidth - 1) {
                    state.cursorX = Math.min(state.mapWidth - 1 - state.cursorDiameter, state.cursorX + distance);
                    state.cursorY = Math.max(state.cursorDiameter, state.cursorY - distance);
                }
                break;
            case DIRECTION.E:
                if (state.cursorX + state.cursorDiameter < state.mapWidth - 1) {
                    state.cursorX = Math.min(state.mapWidth - 1 - state.cursorDiameter + 0, state.cursorX + distance);
                }
                break;
            case DIRECTION.SE:
                if (state.cursorX + state.cursorDiameter < state.mapWidth - 1 ||
                    state.cursorY + state.cursorDiameter < state.mapHeight - 1) {
                    state.cursorX = Math.min(state.mapWidth - 1 - state.cursorDiameter, state.cursorX + distance);
                    state.cursorY = Math.min(state.mapHeight - 1 - state.cursorDiameter, state.cursorY + distance);
                }
                break;
            case DIRECTION.S:
                if (state.cursorY + state.cursorDiameter < state.mapHeight - 1) {
                    state.cursorY = Math.min(state.mapHeight - 1 - state.cursorDiameter, state.cursorY + distance);
                }
                break;
            case DIRECTION.SW:
                if (state.cursorX - state.cursorDiameter > 0 ||
                    state.cursorY + state.cursorDiameter < state.mapHeight - 1) {
                    state.cursorX = Math.max(state.cursorDiameter, state.cursorX - 1);
                    state.cursorY = Math.min(state.mapHeight - 1 - state.cursorDiameter, state.cursorY + distance);
                }
                break;
            case DIRECTION.W:
                if (state.cursorX - state.cursorDiameter > 0) {
                    state.cursorX = Math.max(state.cursorDiameter, state.cursorX - distance);
                }
                break;
            case DIRECTION.NW:
                if (state.cursorX - state.cursorDiameter > 0 ||
                    state.cursorY - state.cursorDiameter > 0) {
                    state.cursorX = Math.max(state.cursorDiameter, state.cursorX - distance);
                    state.cursorY = Math.max(state.cursorDiameter, state.cursorY - distance);
                }
                break;
            default:
                return;
        }

        dispatch(moveCursorToPos(state.cursorX, state.cursorY));
    };
}

export function moveCursorToGridPos(x: number, y: number) {
    return (dispatch, getState) => {
        const state = FlatGetState({}, getState);
        // dispatch(setCursorTiles(tiles));
        dispatch(moveCursorToPos(x + state.cameraX, y + state.cameraY));
    };
}

export function moveCursorToPos(x: number, y: number) {
    return (dispatch, getState) => {
        const state = FlatGetState({}, getState);

        if (x < 0 || y < 0 ||
            x > state.mapWidth ||
            y > state.mapHeight) {
            return;
        }

        //ensure camera is moved to include cursor
        const newState = {
            ...state,
            cursorX: x,
            cursorY: y,
        } as FlatReduxState;
        if (y - state.cursorDiameter < state.cameraY) {
            //MOVE NORTH
            const dist = Math.ceil((state.cameraY - y + state.cursorDiameter) / 10) * 10;
            const toMove = Math.max(0, state.cameraY - dist);
            newState.cameraY = toMove;
        } else if (y + state.cursorDiameter >= state.cameraY + state.gridHeight) {
            //MOVE SOUTH
            const dist = Math.ceil((y + state.cursorDiameter - state.cameraY - (state.gridHeight - 1)) / 10) * 10;
            const toMove = Math.min(state.mapHeight - state.gridHeight, state.cameraY + dist);
            newState.cameraY = toMove;
        }
        if (x - state.cursorDiameter < state.cameraX) {
            //MOVE WEST
            const dist = Math.ceil((state.cameraX - x + state.cursorDiameter) / 10) * 10;
            const toMove = Math.max(0, state.cameraX - dist);
            newState.cameraX = toMove;
        } else if (x + state.cursorDiameter >= state.cameraX + state.gridWidth) {
            //MOVE EAST
            const dist = Math.ceil((x + state.cursorDiameter - state.cameraX - (state.gridWidth - 1)) / 10) * 10;
            const toMove = Math.min(state.mapWidth - state.gridWidth, state.cameraX + dist);
            newState.cameraX = toMove;
        }

        if (state.cameraX !== newState.cameraX || state.cameraY !== newState.cameraY) {
            dispatch(setCameraPos(newState.cameraX, newState.cameraY));
        }

        const tiles = getCursorTiles(newState);
        dispatch(setCursorPos(x, y));
        dispatch(setCursorTiles(tiles));
    };
}

// export function setCursorDiameter(diam: number) {
//     return {
//         type: ACTION_TYPE.CURSOR_SETDIAMETER,
//         cursorDiameter: diam,
//     };
// }

// export function setCursorCharacter(char: string) {
//     return {
//         type: ACTION_TYPE.CURSOR_SETCHAR,
//         char,
//     };
// }

// export function setCursorBuilding(building: boolean) {
//     if (building) {
//         return {
//             type: ACTION_TYPE.CURSOR_BUILDING_START,
//         };
//     } else {
//         return {
//             type: ACTION_TYPE.CURSOR_BUILDING_END,
//         };
//     }
// }
