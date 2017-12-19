const { h, render, Component } = preact;
const { route, Router, Link } = preactRouter;

const INITIAL_TEXT = `root:
- Dear {{ giver }}, thank you for the {{ object }}.
- Hey {{ giver }}, thanks for the {{ object }}!

giver:
- Aunt Emma
- Dave and Edna
- Uncle Bob

object:
- purple vase
- golden retriever
- dishwasher
`;

const GALLERY = [
    '-L0iXXTIHpU3fd0hXiEo',
    '-L0ibWrnaptySlFrOniw',
    '-L0itqXixdWAyoBenEMk'
];

let gApp;

class SeedPicker extends Component {
    onInput(e) {
        const text = e.target.value;
        this.props.onSetSeed(text);
    }

    render(props) {
        return h('div', {class: 'seed-picker'},
            h('span', {class: 'button seed-picker__button seed-picker__prev', onClick: props.onPrevSeed}, '<'),
            h('span', {class: 'seed-picker__value'},
                h('input', {class: 'seed-picker__input', type: 'text', value: props.seed, onInput: this.onInput.bind(this)})
            ),
            h('span', {class: 'button seed-picker__button seed-picker__next', onClick: props.onNextSeed}, '>')
        )
    }
}

class Header extends Component {
    render(props) {
        return h('header', {class: 'header'},
            h(Link, {class: 'header__logo', href: '/'}, 'PCG'),
            h('nav', {class: 'header__nav'}, props.children)
        );
    }
}

class Home extends Component {
    render(props, state) {
        const thumbs = GALLERY.map(id => this.renderThumb(id));
        return h('div', {class: 'app'},
            h(Header, {},
                h(Link, {class: 'button', href: '/sketch'}, 'Create')
            ),
            h('div', {class: 'page'},
                h('h1', {}, 'Gallery'),
                h('div', {class: 'gallery'},
                    thumbs
                )
            )
        );
    }

    renderThumb(id) {
        return h('div', {class: 'gallery__thumb'},
            h(Link, {class: 'gallery__link', href: `/sketch/${id}`},
                h('img', {class: 'gallery__img', src: `/gallery/${id}.png`})
            )
        );
    }
}

class Sketch extends Component {
    constructor(props) {
        super(props);
        let state = { debug: true, debugOutput: '', result: '', unsaved: false, seed: randomTextSeed() };
        if (!props.id) {
            state.source = INITIAL_TEXT;
        } else {
            state.source = '';
            state.loading = true;
        }
        this.state = state;
        gApp = this;
    }

    generate() {
        Math.seedrandom(this.state.seed);
        try {
            const phraseBook = parsePhraseBook(this.state.source);
            const result = generateString(phraseBook);
            this.setState({ result: result });
            //this.setState({ debugOutput: JSON.stringify(phraseBook, null, 4) });
        } catch (e) {
            this.setState({ debugOutput: e.message });
        }
    }

    componentDidMount() {
        if (!this.props.id) {
            this.generate();
        } else {
            firebase.database().ref(`sketch/${this.props.id}`).once('value', snap => {
                const sketch = { key: this.props.id, ...snap.val() };
                this.setState({ loading: false, source: sketch.source });
                this.generate();
            });
        }

        window.addEventListener('beforeunload', (e) => {
            let confirm = null;
            if (this.state.unsaved) {
                confirm = 'You have unsaved changes.';
                (e || window.event).returnValue = confirm;
            }
            return confirm;
        });
    }

    onInput(e) {
        const source = e.target.value;
        this.setState({ unsaved: true, source });
        this.generate();
    }

    onSave() {
        if (this.state.saving) return;
        this.setState({ saving: true });
        const ref = firebase.database().ref('sketch').push();
        ref.set({
            source: this.state.source
        }, () => {
            this.setState({ saving: false, unsaved: false });
            route(`/sketch/${ref.key}`);
        });
    }

    onGenerate() {
        let seed = nextTextSeed(this.state.seed);
        this.setState({seed});
        this.generate();
    }

    onSetSeed(seed) {
        this.setState({seed});
        this.generate();
    }

    onNextSeed() {
        let seed = nextTextSeed(this.state.seed);
        this.setState({seed});
        this.generate();
    }

    onPrevSeed() {
        let seed = prevTextSeed(this.state.seed);
        this.setState({seed});
        this.generate();
    }

    render(props, state) {
        const debugView = h('pre', { className: 'debug' }, this.state.debugOutput);
        const source = state.loading ? 'Loading...' : state.source;
        let saveLabel = state.saving ? 'Saving...' : 'Save';
        return h('div', {class: 'app'},
            h(Header, {},
                h('button', {class: 'button' + (state.unsaved ? ' unsaved' : ''), onClick: this.onSave.bind(this), disabled: state.saving}, saveLabel)
            ),
            h('div', { className: 'editor' },
                h('div', { className: 'editor__toolbar' },
                    h('button', { class: 'button', onClick: this.onGenerate.bind(this) }, 'Generate'),
                    h(SeedPicker, { seed: this.state.seed, onSetSeed: this.onSetSeed.bind(this), onPrevSeed: this.onPrevSeed.bind(this), onNextSeed: this.onNextSeed.bind(this) })
                ),
                h('div', { className: 'editor__panels'},
                    h('div', { className: 'editor__source' },
                        h('textarea', { className: 'editor__area', value: source, onInput: this.onInput.bind(this), readonly: state.loading }),
                        debugView
                    ),
                    h('div', { className: 'editor__viewer' },
                        h('div', { className: 'editor__result', dangerouslySetInnerHTML: { __html: this.state.result } })
                    )
                )
            )
        );
    }
}

class NotFound extends Component {
    render() {
        return h('div', {class: 'app'},
            h(Header, {}),
            h('div', {class: 'page'},
                h('h1', {}, 'Page not found.'),
                h(Link, {href: '/'}, 'Go Back Home')
            )
        );
    }
}

class App extends Component {
    render() {
        return h(Router, {},
                h(Home, { path: '/' }),
                h(Sketch, { path: '/sketch' }),
                h(Sketch, { path: '/sketch/:id' }),
                h(NotFound, { type: '404', default: true })
        );
    }
}

render(h(App), document.body);
