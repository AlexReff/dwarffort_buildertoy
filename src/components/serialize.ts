import { BUILDINGS, MENU, MENU_ITEM } from "./constants";
import store, { FlatGetState, FlatReduxState } from "./redux/store";

export function getQuickfortCsv(state: FlatReduxState = FlatGetState({}, store.getState)): string {
    //dig, build, place (stockpiles), query
    let floors = [];
    let minX = 999, minY = 999, maxX = -1, maxY = -1;
    for (const key of Object.keys(state.terrainTiles)) {
        floors.push(key);
        for (const inner of Object.keys(state.terrainTiles[key])) {
            const tile = state.terrainTiles[key][inner];
            minX = Math.min(minX, tile.posX);
            minY = Math.min(minY, tile.posY);
            maxX = Math.max(maxX, tile.posX);
            maxY = Math.max(maxY, tile.posY);
        }
    }
    floors = floors.sort();

    const digRows: Array<string | string[]> = [];
    digRows.push("#dig Generated by Fortd");
    const buildRows: Array<string | string[]> = [];
    buildRows.push("#build Generated by Fortd");
    for (let z = floors[floors.length - 1]; z >= floors[0]; z--) {
        if (floors.some((e) => +e === +z)) {
            //this floor has data
            const floorTerrain = state.terrainTiles[z];
            const floorBuild = state.buildingTiles[z];
            for (let y = minY; y <= maxY; y++) {
                const thisDigRow = [];
                const thisBuildRow = [];
                for (let x = minX; x <= maxX; x++) {
                    const key = `${x}:${y}`;
                    //terrain
                    if (key in floorTerrain) {
                        const thisTile = floorTerrain[key];
                        const thisMenu = MENU.ITEMS[thisTile.type];
                        thisDigRow.push(thisMenu.key);
                    } else {
                        thisDigRow.push("`");
                    }
                    //buildings
                    if (floorBuild != null && key in floorBuild) {
                        const thisTile = floorBuild[key];
                        const thisBldg = BUILDINGS.IDS[thisTile.key];
                        let menu = MENU.ITEMS[thisBldg.submenu];
                        const keyParts = [];
                        while (menu.id !== MENU_ITEM.building) {
                            keyParts.push(menu.key);
                            menu = MENU.ITEMS[menu.parent];
                        }
                        keyParts.reverse();
                        keyParts.push(thisBldg.hotkey);
                        const thisKey = keyParts.join("");
                        thisBuildRow.push(thisKey);
                    } else {
                        thisBuildRow.push("`");
                    }
                }
                digRows.push(thisDigRow);
                buildRows.push(thisBuildRow);
            }
        }
        if (z > floors[0]) {
            digRows.push(["#>"]);
            buildRows.push(["#>"]);
        }
    }

    let result = "";
    for (const line of digRows) {
        if (Array.isArray(line)) {
            //handle array of values
            result += line.join(",");
            for (let pad = -1; pad <= maxX - minX - line.length; pad++) {
                result += ",#";
            }
        } else {
            //handle single entry
            result += line;
        }
        result += "\n";
    }

    result += "#";
    for (let pad = 0; pad <= maxX - minX; pad++) {
        result += ",#";
    }
    result += "\n";

    for (const line of buildRows) {
        if (Array.isArray(line)) {
            //handle array of values
            result += line.join(",");
            for (let pad = -1; pad <= maxX - minX - line.length; pad++) {
                result += ",#";
            }
        } else {
            //handle single entry
            result += line;
        }
        result += "\n";
    }

    result += "#";
    for (let pad = 0; pad <= maxX - minX; pad++) {
        result += ",#";
    }
    result += "\n";

    return result;
}
