import { BUILDINGS, MENU, MENU_ITEM } from "../../constants";
import { ACTION_TYPE, FlatGetState } from "../store";
import { IMenuState } from "./reducer";

//#region REDUX ACTIONS

export function _setMenus(currentSubmenu, currentMenuItem) {
    let cursorRadius = 0;
    if (currentMenuItem in BUILDINGS.ITEMS) {
        const tiles = BUILDINGS.ITEMS[currentMenuItem];
        if (tiles && tiles.tiles) {
            cursorRadius = Math.floor(tiles.tiles.length / 2.0);
        }
    }
    return {
        type: ACTION_TYPE.SET_MENU,
        currentSubmenu,
        currentMenuItem,
        cursorRadius,
    };
}

//#endregion
//#region THUNK ACTIONS

export function selectMenu(val: IMenuState["currentSubmenu"]) {
    return (dispatch, getState) => {
        const state = FlatGetState({}, getState);
        let currentMenuItem = state.currentMenuItem;
        let currentSubmenu = state.currentSubmenu;
        if (val == null) { //deselect highlighted menu item
            currentMenuItem = null;
        } else if (val === MENU_ITEM.top) { //go to top menu
            currentSubmenu = MENU_ITEM.top;
            currentMenuItem = null;
        } else if (val in MENU.SUBMENUS) { //change submenu
            currentSubmenu = val;
            currentMenuItem = null;
        } else { //highlight menu item
            currentMenuItem = val;
        }
        dispatch(_setMenus(currentSubmenu, currentMenuItem));
    };
}

export function selectPrevSubmenu() {
    return (dispatch, getState) => {
        const state = FlatGetState({}, getState);
        if (state.currentMenuItem != null) {
            state.currentMenuItem = null;
        } else if (state.currentSubmenu !== MENU_ITEM.top) {
            const key = MENU.ITEMS[state.currentSubmenu].parsedKey;
            const idx = key.lastIndexOf(":");
            if (idx > -1) {
                const newMenuKey = key.substr(0, idx);
                if (newMenuKey in MENU.KEYS) {
                    state.currentSubmenu = MENU.KEYS[newMenuKey].id;
                }
            } else {
                state.currentSubmenu = MENU_ITEM.top;
            }
        }
        dispatch(_setMenus(state.currentSubmenu, state.currentMenuItem));
    };
}

//#endregion
