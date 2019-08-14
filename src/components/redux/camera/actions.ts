import { ACTION_TYPE, Point } from "../../constants";

export function zLevelUp() {
    return {
        type: ACTION_TYPE.ZLEVEL_INC,
    };
}

export function zLevelDown() {
    return {
        type: ACTION_TYPE.ZLEVEL_DEC,
    };
}

export function zLevelGoto(level: number) {
    return {
        type: ACTION_TYPE.ZLEVEL_GOTO,
        level,
    };
}

export function toggleAnimation() {
    return {
        type: ACTION_TYPE.ANIMATION_TOGGLE,
    };
}

export function moveCamera(coord: Point) {
    return {
        type: ACTION_TYPE.CAMERA_GOTO,
        coord,
    };
}

export function setGridSize(size: Point) {
    return {
        type: ACTION_TYPE.CAMERA_GRID_SETSIZE,
        size,
    };
}

export function setMapSize(size: Point) {
    return {
        type: ACTION_TYPE.CAMERA_MAP_SETSIZE,
        size,
    };
}
