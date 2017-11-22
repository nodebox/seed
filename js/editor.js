const { h, render, Component } = preact;

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

class App extends Component {
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
            this.setState({ debugOutput: JSON.stringify(phraseBook, null, 4) });
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

    render(props, state) {
        const debugView = h('pre', { className: 'debug' }, this.state.debugOutput);
        return h(
            'div',
            { className: 'app' },
            h(
                'div',
                { className: 'editor' },
                h('div', { className: 'toolbar' }, h('button', { onClick: this.generate.bind(this) }, 'Generate')),
                h('textarea', { className: 'source', value: state.source, onInput: this.onInput.bind(this) }),
                debugView
            ),
            h(
                'div',
                { className: 'viewer' },
                h('div', { className: 'toolbar' }),
                h('div', { className: 'result', dangerouslySetInnerHTML: { __html: this.state.result } })
            )
        );
    }
}

render(h(App), document.getElementById('app'));
