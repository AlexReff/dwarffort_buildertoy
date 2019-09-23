//libraries
import _ from "lodash";
import { Component, h, render } from "preact";
import { Provider } from "react-redux";
//components
import { HEADER_H, MENU_W, TILE_URL, TILE_W } from "./components/constants";
import { Game } from "./components/game";
import Header from "./components/react/header";
import GameHighlighter from "./components/react/highlighter";
import Menu from "./components/react/menu";
import { resizeWindow } from "./components/redux/camera/actions";
import { Initialize } from "./components/redux/settings/actions";
import store from "./components/redux/store";

require("./css/index.scss");

interface IFortressDesignerState {
    debug: boolean;
    gridColumnLayout: number;
    gridRowLayout: number;
    windowResizing: boolean;
    gameLoading: boolean;
}

class FortressDesigner extends Component<{}, IFortressDesignerState> {
    private gridElement: HTMLElement;
    private tileSheetImage: HTMLImageElement;
    private game: Game;

    constructor() {
        super();

        this.setState({
            debug: false,
            windowResizing: false,
            gameLoading: true,
            gridColumnLayout: 0,
            gridRowLayout: 0,
        });
    }

    componentDidMount = () => {
        this.gridElement = document.getElementById("grid");

        this.updateWrapperCss();

        this.tileSheetImage = new Image();
        this.tileSheetImage.crossOrigin = "Anonymous";
        this.tileSheetImage.id = "tilesheet";
        this.tileSheetImage.onload = () => {
            this.initGame();
        };

        // window.addEventListener("keydown", this.handleKeyPress);
        window.addEventListener("resize", this.handleWindowResize);

        store.dispatch(Initialize(this.gridElement));

        this.tileSheetImage.src = TILE_URL; //ensure onload runs after
    }

    initGame = () => {
        if (this.game == null) {
            this.game = new Game(document.getElementById("canvas") as HTMLCanvasElement, this.tileSheetImage);
        } else {
            this.game.restart();
        }

        this.setState({
            gameLoading: false,
        });
    }

    destroyGame = () => {
        if (this.game == null) {
            return;
        }

        this.game.destroy();
        // this.game = null;

        this.setState({
            gameLoading: true,
        });
    }

    componentWillUnmount = () => {
        this.destroyGame();
    }

    //#region window resizing

    setWindowResizing = () => {
        this.destroyGame();
        this.setState({
            windowResizing: true,
        });
    }

    endWindowResizing = () => {
        // console.log("what");
        this.updateWrapperCss(() => {
            store.dispatch(resizeWindow(this.gridElement));
            this.initGame();
            this.setState({ windowResizing: false });
        });
    }

    // tslint:disable-next-line: member-ordering
    windowResizeBouncer = _.debounce(this.setWindowResizing, 300, { leading: true, trailing: false });

    // tslint:disable-next-line: member-ordering
    windowResizeEndBouncer = _.debounce(this.endWindowResizing, 400, { leading: false, trailing: true });

    handleWindowResize = () => {
        this.windowResizeBouncer();
        this.windowResizeEndBouncer();
    }

    //#endregion

    //#region wrapper CSS
    updateWrapperCss = (callback?: () => void) => {
        //update the grid's width in css to divisible by grid
        const wOff = (this.gridElement.offsetWidth + this.state.gridColumnLayout) % TILE_W;
        const hOff = (this.gridElement.offsetHeight + this.state.gridRowLayout) % TILE_W;
        this.setState({
            gridColumnLayout: wOff,
            gridRowLayout: hOff,
        }, callback);
    }

    getWrapperCss = () => {
        if (this.state.gridColumnLayout != null && this.state.gridRowLayout != null) {
            return {
                gridTemplateColumns: `1fr ${(MENU_W + this.state.gridColumnLayout).toString()}px`,
                gridTemplateRows: `${HEADER_H.toString()}px 1fr ${(HEADER_H + this.state.gridRowLayout).toString()}px`,
            };
        }
        return null;
    }
    //#endregion

    render(props, state: IFortressDesignerState) {
        return (
            <div id="page">
                <GameHighlighter />
                <div id="wrapper" style={this.getWrapperCss()}>
                    <div id="header">
                        <div class="left"><a class="home-link" href="https://reff.dev/">reff.dev</a></div>
                        <div class="center">
                            <a href="/" class="title">Fortress Designer</a>
                        </div>
                        <div class="right">
                            <Header />
                        </div>
                    </div>
                    <div id="grid">
                        <div class="loading">
                            Loading...
                        </div>
                        <canvas id="canvas"></canvas>
                    </div>
                    <Menu />
                    <footer id="footer">
                        <div class="inner">
                            {/* <div class="data-cursor">Cursor: {this.renderFooterCursor()}</div>
                            <div class="data-mouse">Mouse: {this.renderFooterMouse()}</div> */}
                        </div>
                    </footer>
                </div>
            </div>
        );
    }
}

render(<Provider store={store}><FortressDesigner /></Provider>, document.getElementById("body"));
