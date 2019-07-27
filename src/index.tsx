//libraries
import * as _ from "lodash";
import { Component, h, render } from "preact";
//components
import { BUILDING_TILE_MAP, DEBUG_MODE_ENABLED, Direction, HEADER_HEIGHT_INITIAL, KEYS, MENU_DICTIONARY, MENU_HOTKEYS, MENU_SUBMENUS, MENU_WIDTH_INITIAL, MenuItemId, TILE_HEIGHT, TILE_WIDTH, TILESHEET_URL } from "./components/constants";
import { DebugMenu } from "./components/debug";
import { GameRender } from "./components/game/render";
import { Menu } from "./components/menu";
import { Tile, TileType } from "./components/tile";

require("./css/index.scss");

/*
--Draw a 2d grid on the canvas
Add Mouse support for hover/click on tiles
Add drag support to tilegrid
Add sidebar with build options (+hotkeys?)
Ability to click on sidebar item and modify cursor hover/click behavior
Add drag behavior option - rectangular select or paint (select rectangular area to modify/move/clear or 'paint' - select every item the cursor directly moves over)
Add arrow key support + keyboard tile cursor
Add stockpiles, workshops, walls, multiple z-levels

Add menu state tracking + submenus
Add virtual grid object mapping data structure
Add arrow key support to shift everything on-screen
Add browser resize detection + canvas resizing

'?: Help' Menu?
Add google analytics + simple text ads before public release?
*/

interface IFortressDesignerState {
    // only things relevant to HTML state
    currentMenu: string;
    highlightedMenuItem: MenuItemId;
    debug: boolean;
    gridColumnLayout: number;
    gridRowLayout: number;
    mouseLeft: number;
    mouseTop: number;
    mouseOverGrid: boolean;
    /**
     * Only used to trigger react re-renders
     */
    refresh: boolean;
    zLevel: number;
    hasChangedZLevel: boolean;
    windowResizing: boolean;
    gameLoading: boolean;
}

class FortressDesigner extends Component<{}, IFortressDesignerState> {
    private gridElement: HTMLElement;
    private canvasElement: HTMLElement;
    private headerElement: HTMLElement;
    private tileSheetImage: HTMLImageElement;
    private game: GameRender;
    private listenersOn: boolean;

    constructor() {
        super();

        this.listenersOn = false;

        this.setState({
            currentMenu: "top",
            highlightedMenuItem: null,
            debug: false,
            zLevel: 0,
            hasChangedZLevel: false,
            mouseOverGrid: false,
            windowResizing: false,
            gameLoading: true,
            gridColumnLayout: 0,
            gridRowLayout: 0,
        });
    }

    componentDidMount() {
        this.gridElement = document.getElementById("grid");
        this.headerElement = document.getElementById("header");

        this.updateWrapperCss();

        this.tileSheetImage = new Image();
        this.tileSheetImage.crossOrigin = "Anonymous";
        this.tileSheetImage.onload = () => {
            this.initGame();
        };
        this.tileSheetImage.src = TILESHEET_URL;
    }

    initGame = () => {
        if (this.game == null) {
            this.game = new GameRender(this.tileSheetImage, this.gridElement);
        } else {
            this.game.init();
        }

        this.canvasElement = this.game.getCanvas();

        if (!this.listenersOn) {
            this.gridElement.addEventListener("click", this.handleGridClick);
            this.gridElement.addEventListener("mousemove", this.handleMouseMove);
            this.gridElement.addEventListener("mouseover", this.handleMouseOver);
            this.gridElement.addEventListener("mouseleave", this.handleMouseLeave);
            this.gridElement.addEventListener("contextmenu", this.handleContextMenu);

            window.addEventListener("keydown", this.handleKeyPress);
            window.addEventListener("keyup", this.handleKeyUp);
            window.addEventListener("resize", this.handleWindowResize);

            this.listenersOn = true;
        }

        this.setState({
            gameLoading: false,
        });
    }

    destroyGame = () => {
        //this.game = null;
        this.game.destroy();

        if (this.canvasElement != null) {
            this.canvasElement.remove();
            this.canvasElement = null;
        }

        if (this.listenersOn) {
            this.gridElement.removeEventListener("click", this.handleGridClick);
            this.gridElement.removeEventListener("mousemove", this.handleMouseMove);
            this.gridElement.removeEventListener("mouseover", this.handleMouseOver);
            this.gridElement.removeEventListener("mouseleave", this.handleMouseLeave);
            this.gridElement.removeEventListener("contextmenu", this.handleContextMenu);

            window.removeEventListener("keydown", this.handleKeyPress);
            window.removeEventListener("keyup", this.handleKeyUp);
            window.removeEventListener("resize", this.handleWindowResize);

            this.listenersOn = false;
        }
    }

    // restartGame = () => {
    //     this.setState({
    //         gameLoading: true,
    //     });
    //     this.destroyGame();
    //     this.initGame();
    // }

    updateWrapperCss = (callback?: () => void) => {
        //update the grid's width in css to divisible by grid
        const wOff = (this.gridElement.offsetWidth + this.state.gridColumnLayout) % TILE_WIDTH;
        const hOff = (this.gridElement.offsetHeight + this.state.gridRowLayout) % TILE_WIDTH;
        console.log("wrapper css updated");
        this.setState({
            gridColumnLayout: wOff,
            gridRowLayout: hOff,
        }, callback);
    }

    getWrapperCss = () => {
        if (this.state.gridColumnLayout != null && this.state.gridRowLayout != null) {
            console.log("wrapper css retrieved");
            return {
                gridTemplateColumns: `1fr ${(MENU_WIDTH_INITIAL + this.state.gridColumnLayout).toString()}px`,
                gridTemplateRows: `${HEADER_HEIGHT_INITIAL.toString()}px 1fr ${(HEADER_HEIGHT_INITIAL + this.state.gridRowLayout).toString()}px`,
            };
        }
        return null;
    }

    componentWillUnmount() {
        this.destroyGame();
    }

    handleContextMenu = (e: MouseEvent | TouchEvent) => {
        e.preventDefault();
        const pos = this.game.getMousePosition(e);
        this.game.moveCursorTo(pos);
        this.handleEnterRightClick();
        return false;
    }

    /**
     * Handles enter key + right clicks
     */
    handleEnterRightClick() {
        if (this.game.handleEnterKey(this.state.highlightedMenuItem)) {
            this.setState({
                highlightedMenuItem: null,
            });
        }
    }

    handleGridClick = (e: MouseEvent | TouchEvent) => {
        e.preventDefault();
        const pos = this.game.getMousePosition(e);
        this.game.moveCursorTo(pos);
        this.setState({
            refresh: true,
        });
    }

    handleMouseMove = (e) => {
        this.setState({
            mouseLeft: e.clientX,
            mouseTop: e.clientY,
        });
    }

    handleMouseOver = (e) => {
        this.setState({
            mouseOverGrid: true,
            mouseLeft: e.clientX,
            mouseTop: e.clientY,
        });
    }

    handleMouseLeave = (e) => {
        this.setState({
            mouseOverGrid: false,
        });
    }

    setWindowResizing = () => {
        this.setState({ windowResizing: true });
    }

    endWindowResizing = () => {
        this.updateWrapperCss(function() {
            this.initGame();
            this.setState({ windowResizing: false });
        });
    }

    handleWindowResize = (e: Event) => {
        this.destroyGame();
        _.debounce(this.setWindowResizing, 300)();
        _.debounce(this.setWindowResizing, 300, { leading: true, trailing: false })();
        _.debounce(this.endWindowResizing, 1000)();
    }

    handleKeyUp = (e: KeyboardEvent) => {
        //
    }

    handleKeyPress = (e: KeyboardEvent) => {
        if (e.getModifierState("Control")) {
            return; //don't override ctrl+btn browser hotkeys
        }
        switch (e.keyCode) {
            case KEYS.VK_RETURN:
                e.preventDefault();
                this.handleEnterRightClick();
                break;
            case KEYS.VK_BACK_QUOTE:
            case KEYS.VK_TILDE:
                //toggle debug display
                e.preventDefault();
                this.setState((prevState) => ({
                    debug: !prevState.debug,
                }));
                break;
            case KEYS.VK_ESCAPE:
                e.preventDefault();
                this.handleMenuEvent("escape");
                break;
            case KEYS.VK_UP:
            case KEYS.VK_NUMPAD8:
                //move north
                e.preventDefault();
                this.game.moveCursor(Direction.N, e.shiftKey);
                break;
            case KEYS.VK_PAGE_UP:
            case KEYS.VK_NUMPAD9:
                //move ne
                e.preventDefault();
                this.game.moveCursor(Direction.NE, e.shiftKey);
                break;
            case KEYS.VK_RIGHT:
            case KEYS.VK_NUMPAD6:
                //move east
                e.preventDefault();
                this.game.moveCursor(Direction.E, e.shiftKey);
                break;
            case KEYS.VK_PAGE_DOWN:
            case KEYS.VK_NUMPAD3:
                //move se
                e.preventDefault();
                this.game.moveCursor(Direction.SE, e.shiftKey);
                break;
            case KEYS.VK_DOWN:
            case KEYS.VK_NUMPAD2:
                //move south
                e.preventDefault();
                this.game.moveCursor(Direction.S, e.shiftKey);
                break;
            case KEYS.VK_END:
            case KEYS.VK_NUMPAD1:
                //move sw
                e.preventDefault();
                this.game.moveCursor(Direction.SW, e.shiftKey);
                break;
            case KEYS.VK_LEFT:
            case KEYS.VK_NUMPAD4:
                //move west
                e.preventDefault();
                this.game.moveCursor(Direction.W, e.shiftKey);
                break;
            case KEYS.VK_HOME:
            case KEYS.VK_NUMPAD7:
                //move nw
                e.preventDefault();
                this.game.moveCursor(Direction.NW, e.shiftKey);
                break;
            case KEYS.VK_PERIOD:
            case KEYS.VK_GREATER_THAN:
                this.setState({
                    zLevel: this.game.zUp(),
                    hasChangedZLevel: true,
                });
                break;
            case KEYS.VK_COMMA:
            case KEYS.VK_LESS_THAN:
                this.setState({
                    zLevel: this.game.zDown(),
                    hasChangedZLevel: true,
                });
                break;
            default:
                const key = this.state.currentMenu !== "top" ? this.state.currentMenu + ":" + e.key : e.key;
                const hotkeyTarget = MENU_HOTKEYS[key];
                if (hotkeyTarget) {
                    e.preventDefault();
                    this.handleMenuEvent(MENU_HOTKEYS[key].id);
                } else {
                    // console.log("unhandled keypress: ", e.keyCode, e.key);
                }
                break;
        }
        this.setState({
            refresh: true,
        });
    }

    handleMenuEvent = (e: string) => {
        if (e == null || e.length === 0) {
            return;
        }

        if (e === "top") {
            this.setState({
                highlightedMenuItem: null,
                currentMenu: "top",
            });
            return;
        }

        if (MENU_SUBMENUS[e] != null) {
            this.setState({
                highlightedMenuItem: null,
                currentMenu: MENU_SUBMENUS[e],
            });
            return;
        }

        if (e === "escape") {
            if (this.game.isBuilding()) {
                this.setState({
                    highlightedMenuItem: null,
                });
                this.game.stopBuilding();
            } else if (this.game.isDesignating()) {
                this.game.cancelDesignate();
            } else if (this.state.highlightedMenuItem != null) {
                this.setState({
                    highlightedMenuItem: null,
                });
            } else {
                // go up one menu level
                let newMenu = "";
                const idx = this.state.currentMenu.lastIndexOf(":");
                if (idx > 0) {
                    newMenu = this.state.currentMenu.substr(0, idx);
                } else {
                    newMenu = "top";
                }
                this.setState({
                    currentMenu: newMenu,
                    highlightedMenuItem: null,
                });
            }
        } else {
            if (this.state.highlightedMenuItem !== e) {
                this.setState({
                    highlightedMenuItem: e as MenuItemId,
                });
                //if this item is a building
                if (e === "inspect") {
                    //
                } else if (e in BUILDING_TILE_MAP) {
                    this.game.setCursorToBuilding(e as MenuItemId);
                }
            }
        }
    }

    isInspecting = () => {
        return this.state.highlightedMenuItem != null && this.state.highlightedMenuItem === "inspect";
    }

    getGridPosition = (clientX: number, clientY: number): [number, number] => {
        //returns top-left coordinate for grid item based on mouse position
        if (this.canvasElement != null) {
            const bounds = this.canvasElement.getBoundingClientRect();
            const maxHeight = this.canvasElement.offsetHeight - TILE_HEIGHT + bounds.top;
            const maxWidth = this.canvasElement.offsetWidth - TILE_WIDTH + bounds.left;
            const leftPos = Math.max(0, Math.min(maxWidth, clientX - (clientX % TILE_WIDTH)));
            const topPos = Math.max(0, Math.min(maxHeight, clientY - (clientY % TILE_HEIGHT)));
            return [leftPos, topPos];
        }
    }

    getHighlighterStyle = () => {
        if (this.headerElement && this.canvasElement) {
            if (!this.state.mouseOverGrid || (this.state.mouseLeft == null || this.state.mouseTop == null)) {
                return {
                    display: "none",
                };
            }
            const targetPos = this.getGridPosition(this.state.mouseLeft, this.state.mouseTop);
            return {
                width: `${TILE_WIDTH}px`,
                height: `${TILE_HEIGHT}px`,
                left: targetPos[0],
                top: targetPos[1],
            };
        }
    }

    renderFooterData = () => {
        if (this.game == null) {
            return;
        }
        if (this.game.isDesignating()) {
            return (
                <div class="status">Designating {MENU_DICTIONARY[this.state.highlightedMenuItem].text}</div>
            );
        } else {
            let tile: Tile = null;
            if (this.state.mouseOverGrid) {
                //if we are mousing-over buildings, show that info, otherwise show tile @ kb cursor
                tile = this.game.getTileAtMouse(this.state.mouseLeft, this.state.mouseTop);
                if (!tile.isBuilding()) {
                    tile = this.game.getTileAtCursor();
                }
            } else {
                tile = this.game.getTileAtCursor();
            }
            const type = tile.getType();
            switch (type) {
                case TileType.Building:
                    return (
                        <div>{tile.getBuildingName()} (Building)</div>
                    );
                case TileType.Empty:
                    break;
                default:
                    return (
                        <div class="status">{TileType[type]}</div>
                    );
            }
        }

        return null;
    }

    renderBreadcrumbs = () => {
        const breadcrumbs = [];
        if (this.state.currentMenu !== "top") {
            const activeItem = MENU_HOTKEYS[this.state.currentMenu];
            breadcrumbs.push(<a href="#" data-id={activeItem.key} onClick={(e) => this.breadcrumbHandler(e)}>{activeItem.text}</a>);

            // let parent = activeItem.parent;
            // while (parent != null) {
            //     breadcrumbs.push(<a href="#" data-id={parent.key} onClick={(e) => this.breadcrumbHandler(e)}>{parent.text}</a>);
            //     parent = parent.parent;
            // }
        }

        breadcrumbs.push(<a href="#" data-id="top" title="Main Menu" onClick={(e) => this.breadcrumbHandler(e)}>☺</a>);
        return breadcrumbs.reverse();
    }

    breadcrumbHandler = (e: Event) => {
        e.preventDefault();
        (e.currentTarget as HTMLElement).blur();
        const key = (e.currentTarget as HTMLElement).dataset.id;
        if (key === "top") {
            this.handleMenuEvent("top");
        } else if (MENU_HOTKEYS[key] != null) {
            this.handleMenuEvent(MENU_HOTKEYS[key].id);
        }
    }

    renderMenuStatus = () => {
        if (this.game == null) {
            return null;
        }
        if (this.game.isDesignating()) {
            return (
                <div>Designating {MENU_DICTIONARY[this.state.highlightedMenuItem].text}</div>
            );
        }
        if (this.state.highlightedMenuItem != null && this.state.highlightedMenuItem.length > 0) {
            if (this.state.highlightedMenuItem in BUILDING_TILE_MAP) {
                return (
                    <div>Placing {MENU_DICTIONARY[this.state.highlightedMenuItem].text}</div>
                );
            }
            return (
                <div>Designating {MENU_DICTIONARY[this.state.highlightedMenuItem].text}</div>
            );
        }
        return <div></div>;
    }

    render(props, state: IFortressDesignerState) {
        return (
            <div id="page">
                {DEBUG_MODE_ENABLED ?
                    <DebugMenu isActive={state.debug} />
                    : null}
                <div id="highlighter" style={this.getHighlighterStyle()}></div>
                <div id="wrapper" style={this.getWrapperCss()}>
                    <div id="header">
                        <div class="left"><a class="home-link" href="https://reff.dev/">reff.dev</a></div>
                        <div class="center">
                            <a href="/" class="title">Fortress Designer</a>
                        </div>
                        <div class="right">
                            {/* <div class="cursors">
                                <a><i class="fas fa-mouse-pointer"></i></a>
                                <a><i class="far fa-hand-pointer"></i></a>
                            </div> */}
                        </div>
                    </div>
                    <div id="grid">
                        <div class="loading">
                            Loading...
                        </div>
                    </div>
                    <div id="menu">
                        <div class="menu-breadcrumbs">
                            {this.renderBreadcrumbs()}
                        </div>
                        <Menu highlightedItem={state.highlightedMenuItem}
                            selectedMenu={state.currentMenu}
                            handleMenuEvent={this.handleMenuEvent} />
                        <div class="menu-bottom">
                            <div class="menu-status">
                                {this.renderMenuStatus()}
                            </div>
                            <div class="copy">&copy; {new Date().getFullYear()} Alex Reff</div>
                        </div>
                    </div>
                    <footer id="footer">
                        <div class="inner">
                            <div class="data">{this.renderFooterData()}</div>
                        </div>
                    </footer>
                </div>
            </div>
        );
    }
}

render(<FortressDesigner />, document.getElementById("body"));

// onEnd(e: MouseEvent | TouchEvent) {
//     e.preventDefault();
//     this.dragging = false;

//     let maxWidthOffset = (this.totalColSize + 1) * TILE_SIZE - this.gridElement.offsetWidth;
//     let maxHeightOffset = (this.totalRowSize + 1) * TILE_SIZE - this.gridElement.offsetHeight;

//     if (this.offsetX > 0 || this.offsetY > 0 ||
//         maxWidthOffset < 0 || maxHeightOffset < 0 ||
//         this.offsetX < -1 * Math.abs(maxWidthOffset) ||
//         this.offsetY < -1 * Math.abs(maxHeightOffset)) {
//         let v = { x: this.offsetX, y: this.offsetY };
//         if (this.tween) this.tween.kill();
//         let center = this.getCenterPos();
//         let thisX = maxWidthOffset > 0 ? -1 * maxWidthOffset : center.x;
//         let thisY = maxHeightOffset > 0 ? -1 * maxHeightOffset : center.y;
//         this.tween = TweenMax.to(v, 0.4,
//             {
//                 // x: Math.max(Math.min(0, this.offsetX), -1 * maxWidthOffset),
//                 // y: Math.max(Math.min(0, this.offsetY), -1 * maxHeightOffset),
//                 x: thisX, // _.clamp(this.offsetX, -1 * maxWidthOffset, 0),
//                 y: thisY, // _.clamp(this.offsetY, -1 * maxHeightOffset, 0),
//                 onUpdate: () => {
//                     this.snapBackCallback(v.x, v.y);
//                 }
//             });
//     }
// }

// onMove(e: MouseEvent | TouchEvent) {
//     if (this.dragging) {
//         let target = e instanceof MouseEvent ? e : e.touches[0];
//         let xDelta = target.clientX - this.lastX;
//         let yDelta = target.clientY - this.lastY;
//         let velocity = Math.abs(xDelta * yDelta);

//         if (velocity > MAX_VELOCITY) {
//             let v = { x: xDelta * 0.5, y: yDelta * 0.5 };
//             if (this.tween) this.tween.kill();
//             this.tween = TweenMax.to(v, 0.5,
//                 {
//                     x: 0, y: 0,
//                     onUpdate: () => {
//                         this.onDragCallback(v.x, v.y);
//                     }
//                 });
//         }

//         this.lastX = target.clientX;
//         this.lastY = target.clientY;

//         this.onDragCallback(xDelta, yDelta);
//     }
// }
