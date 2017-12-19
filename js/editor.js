const { h, render, Component } = preact;
const { Router, Link } = preactRouter;

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

let gApp;

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
        return h('div', {class: 'app'},
            h(Header, {},
                h(Link, {class: 'button', href: '/sketch'}, 'Create')
            ),
            h('div', {class: 'page'},
                h('h1', {}, 'Click the "create" button to create a new sketch.')
            )
        );
    }
}

class Sketch extends Component {
    constructor() {
        super();
        this.state = { source: INITIAL_TEXT, debug: true, debugOutput: '', result: '' };
        gApp = this;
    }

    generate() {
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
        this.generate();
    }

    onInput(e) {
        const source = e.target.value;
        this.setState({ source: e.target.value });
        this.generate();
    }

    onSave() {
        // FIXME: save the content
    }

    render(props, state) {
        const debugView = h('pre', { className: 'debug' }, this.state.debugOutput);
        return h('div', {class: 'app'},
            h(Header, {},
                h('button', {class: 'button', onClick: this.onSave.bind(this)}, 'Save')
            ),
            h('div', { className: 'editor' },
                h('div', { className: 'editor__toolbar' }, h('button', { class: 'button', onClick: this.generate.bind(this) }, 'Generate')),
                h('div', { className: 'editor__panels'},
                    h('div', { className: 'editor__source' },
                        h('textarea', { className: 'editor__area', value: state.source, onInput: this.onInput.bind(this) }),
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
                h('h1', {}, 'Page not found.')
            )
        );
    }
}

class App extends Component {
    render() {
        return h(Router, {},
                h(Home, { path: '/' }),
                h(Sketch, { path: '/sketch' }),
                h(NotFound, { type: '404', default: true })
        );
    }
}

render(h(App), document.body);
