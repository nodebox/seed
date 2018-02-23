const { h, render, Component } = preact;
const { route, Router, Link } = preactRouter;

function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        const later = function() {
            timeout = null;
            func.apply(context, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function escape(html, encode) {
  return html
    .replace(!encode ? /&(?!#?\w+;)/g : /&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const gMarkedRenderer = new marked.Renderer();
gMarkedRenderer.code = function(code, lang) {
    let html = '<pre><code>' + escape(code) + '</code></pre>';
    if (lang === 'seed') {
        html = `<div class="code-wrap">${ html }<div class="code-result"></div></div>`;
    }
    return html;
}

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
    '-L4uJCV9VMZPOCBJ6ysM',
    '-L0jT5zaERgBPaf3P6LP',
    '-L4uLB99JzFHMPcVoiTm',
    '-L4uLkY2Yh6GE9_nE6xn',
    '-L4uN8VinvdmaAJqMNHJ',
    '-L4uMMohcfHFX_pBOr6l',
    '-L0jGl9IhooqRuTF9wxS',
    '-L4uNdoRFf9FHpsDA1mc',
    '-L4uNyhbwpSeFdB0_2J4',
    '-L0kGLkGKVe9Iuid9jzC',
    '-L4uOhQIyny6CWcP9yvX',
    '-L4uP84R9XYlbOomuPl0',
    '-L4uPRjyEV237kNmUX5v',
    '-L0l7fV1tlR0Gobb64AM',
    '-L0pQ_yU-SGVmDoRMfsF',
    '-L0tTX3tlVpqHX6Umym4',
    '-L4uQH3RqD3QOSbxHhNE',
    '-L42j_5BckaAOv8BICMj',
];

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
    checkUnsaved(e) {
        if (this.props.unsaved && !confirm('You have unsaved changes.')) {
            e.stopPropagation();
            e.preventDefault();
        }
    }

    render(props) {
        return h('header', {class: 'header'},
            h('a', {class: 'header__logo', href: '/', onClick: this.checkUnsaved.bind(this) }, 'Seed'),
            h('nav', {class: 'header__nav'}, props.children)
        );
    }
}

class Home extends Component {
    render(props, state) {
        const thumbs = GALLERY.map(id => this.renderThumb(id));
        return h('div', {class: 'app'},
            h(Header, {},
                h('a', {class: 'button', href: '/sketch'}, 'New Sketch')
            ),
            h('div', {class: 'page'},
                h('section', { class: 'intro' },
                    h('div', { class: 'intro__inner' },
                        h('p', { class: 'intro__large' },
                            'Seed generates procedural content. Create generated text, shapes or images using web standards.'
                        ),
                        h('div', { class: 'intro__cta' },
                            h('a', { class: 'button primary', href:'/sketch' }, 'Get Started'),
                            h('a', { class: 'button', href:'/docs' }, 'Documentation')
                        )
                    )
                ),
                h('section', { class: 'gallery' },
                    h('div', {class: 'gallery__inner'},
                        thumbs
                    )
                )
            )
        );
    }

    renderThumb(id) {
        return h('div', {class: 'gallery__thumb'},
            h('a', {class: 'gallery__link', href: `/sketch/${id}`},
                h('img', {class: 'gallery__img', src: `/gallery/${id}.jpg`})
            )
        );
    }
}

class LoadSketch {
    constructor() {
        this.online = false;
    }

    async download(url) {
        this.goOnline();
        return await firebase.database().ref(url).once('value');
    }

    goOnline() {
        if (!this.online) {
            firebase.database().goOnline();
            this.online = true;
        }
    }

    goOffline() {
        if (this.online) {
            firebase.database().goOffline();
            this.online = false;
        }
    }
}

class Source extends Component {
    componentDidMount() {
        const options = {
            value: this.props.source,
            indentUnit: 2,
            lineNumbers: true,
        };
        this.codeMirror = CodeMirror.fromTextArea(this.textAreaRef, options);
        this.codeMirror.on('change', this.onChanged.bind(this));
        //this.codeMirror.setSize('50%', '100%');
    }

    componentWillUnmount() {
        if (this.codeMirror) {
            this.codeMirror.toTextArea();
        }
    }

    componentWillReceiveProps(nextProps) {
        if (!this.codeMirror) return;
        if (this.codeMirror.getValue() !== nextProps.source) {
            this.codeMirror.setValue(nextProps.source);
        }
    }

    onChanged(doc, change) {
        if (change.origin === 'setValue') return;
        this.props.onSourceChanged(doc.getValue());
    }

    onInput(e) {
        const source = e.target.value;
        this.props.onSourceChanged(source);
    }

    render(props) {
        return h('div', { className: 'editor__area' },
            h('textarea', { ref: ref => (this.textAreaRef = ref), className: 'editor__source', value: this.props.source, onInput: this.onInput.bind(this), readonly: this.props.loading }),
        );
    }
}

class Editor extends Component {
    constructor(props) {
        super(props);
        let state = { debug: true, debugOutput: '', result: '', seed: randomTextSeed(), playing: false, frame: 0 };
        if (!props.id) {
            state.source = INITIAL_TEXT;
        } else {
            state.source = '';
            state.loading = true;
        }
        this.state = state;
    }

    async generate(parse=true) {
        try {
            if (parse) {
                const loadSketch = this.state.loadSketch || new LoadSketch();
                this.phraseBook = await parsePhraseBook(this.state.source, loadSketch);
                loadSketch.goOffline();
            }
            const result = generateString(this.phraseBook, 'root', {}, this.state.seed);
            this.setState({ result: result, debugOutput: '' });
        } catch (e) {
            this.setState({ debugOutput: e.message });
        }
    }

    componentDidMount() {
        document.querySelector('html').classList.add('fullscreen');
        let localSource;
        if (!this.props.id) {
            if (this.props.onSourceChanged) {
                localSource = window.localStorage.getItem('empty');
                if (localSource !== null && localSource !== undefined) {
                    this.props.onSourceChanged(localSource, true, true);
                    this.setState({ source: localSource, origSource: INITIAL_TEXT });
                } else {
                    this.props.onSourceChanged(INITIAL_TEXT, true);
                }
            }
            if (this.props.onSeedChanged) {
                this.props.onSeedChanged(this.state.seed, true);
            }
            this.generate();
        } else {
            const loadSketch = new LoadSketch();
            this.setState({ loadSketch });
            loadSketch.download(`sketch/${this.props.id}`).then(snap => {
                const sketch = Object.assign({ key: this.props.id }, snap.val());
                let newState = { loading: false, source: sketch.source };
                localSource = window.localStorage.getItem(this.props.id);
                if (localSource !== null && localSource !== undefined && localSource !== sketch.source) {
                    newState.origSource = sketch.source;
                    newState.source = localSource;
                }
                const urlSeed = getURLParameter('seed');
                if (urlSeed) {
                    newState.seed = urlSeed;
                } else if (sketch.seed) {
                    newState.seed = sketch.seed;
                } else {
                    newState.seed = this.state.seed;
                }

                this.setState(newState);
                if (this.props.onSourceChanged) {
                    this.props.onSourceChanged(newState.source, true, localSource !== null && localSource !== undefined);
                }
                if (this.props.onSeedChanged) {
                    this.props.onSeedChanged(newState.seed, true);
                }
                this.generate();
            });
        }
    }

    componentWillUnmount() {
        document.querySelector('html').classList.remove('fullscreen');
    }

    onSourceChanged(source) {
        this.setState({ source });
        if (this.props.onSourceChanged) {
            this.props.onSourceChanged(source);
        }
        this.generate();
    }

    onSetSeed(seed) {
        this.setState({seed});
        if (this.props.onSeedChanged) {
            this.props.onSeedChanged(seed);
        }
        this.generate(false);
    }

    onGenerate() {
        let seed = nextTextSeed(this.state.seed);
        this.onSetSeed(seed);
    }

    onNextSeed() {
        let seed = nextTextSeed(this.state.seed);
        this.onSetSeed(seed);
    }

    onPrevSeed() {
        let seed = prevTextSeed(this.state.seed);
        this.onSetSeed(seed);
    }

    onTogglePlay() {
        if (!this.state.playing) {
            this.setState({playing: true, frame: 0});
            this.startTime = Date.now();
            requestAnimationFrame(this.onDoFrame.bind(this))
        } else {
            this.setState({playing: false, frame: 0});
        }
    }

    durationSeconds() {
        const duration = this.phraseBook['%preamble'].duration;
        if (duration !== undefined) { return duration; }
        return 2.0;
    }

    animationType(){
        const type = this.phraseBook['%preamble'].animation;
        if (type !== undefined) { return type; }
        return 'bounce';
    }

    onDoFrame() {
        if (this.state.playing) {
            const animationType = this.animationType();

            try {
                const elapsedSeconds = (Date.now() - this.startTime) / 1000.0;
                const durationSeconds = this.durationSeconds();
                const t = (elapsedSeconds / durationSeconds) % 1.0;

                if (animationType === 'once' && durationSeconds <= elapsedSeconds) {
                    this.setState({ frame: 0, playing: false });
                } else {
                    const result = generateString(this.phraseBook, 'root', {}, this.state.seed, t);
                    this.setState({ frame: this.state.frame + 1, result: result, debugOutput: '' });
                    window.requestAnimationFrame(this.onDoFrame.bind(this));
                }
            } catch (e) {
                this.setState({ frame: 0, playing: false, debugOutput: e.message });
            }
        }
    }

    restoreOriginalVersion() {
        if (confirm('Are you sure you want to restore to the original version? This will discard your changes.')) {
            this.setState({ source: this.state.origSource, origSource: undefined });
            this.props.onSourceChanged(this.state.origSource, true);
            window.localStorage.removeItem(this.props.id || 'empty');
            this.generate();
        }
    }

    render(props, state) {
        const debugView = h('p', { className: 'editor__debug' }, this.state.debugOutput);
        const source = state.loading ? 'Loading...' : state.source;
        let localVersionDiv;
        if (this.state.origSource) {
            localVersionDiv = h('div', { className: 'localversion' },
                'You\'ve previously made some changes to this sketch. ',
                h('a', {class: 'underline', href: '#', onClick: this.restoreOriginalVersion.bind(this) }, 'Restore original version.'));
        }
        return h('div', { className: 'editor' }, localVersionDiv,
            h('div', { className: 'editor__source-wrap'},
                h('div', { className: 'editor__toolbar' },
                    h('button', { class: 'button', onClick: this.onGenerate.bind(this) }, 'Generate'),
                    h(SeedPicker, { seed: this.state.seed, onSetSeed: this.onSetSeed.bind(this), onPrevSeed: this.onPrevSeed.bind(this), onNextSeed: this.onNextSeed.bind(this) })
                ),
                h('div', { className: 'editor__source' },
                    h(Source, { source, loading: this.state.loading, onSourceChanged: this.onSourceChanged.bind(this) }),
                    debugView
                ),
            ),
            h('div', { className: 'editor__viewer-wrap'},
                h('span', { class: 'editor__toolbar' },
                    h('button', { class: 'button', onClick: this.onTogglePlay.bind(this) }, state.playing ? 'Stop' : 'Play'),
                    h('span', { className: 'editor__toolbar-right' },
                        props.headerRight
                    )
                ),
                h('div', { className: 'editor__viewer' },
                    h('div', { className: 'editor__result', dangerouslySetInnerHTML: { __html: this.state.result } })
                )
            )
        );
    }
}

Editor.prototype.onInput = debounce(Editor.prototype.onInput, 200);

class Sketch extends Component {
    constructor(props) {
        super(props);
        this.state = { saving: false, unsaved: false, source: undefined, seed: undefined };
    }

    onSourceChanged(source, initialLoad, localSource=false) {
        this.setState({ unsaved: localSource || !initialLoad, source });
        if (!initialLoad) {
            const key = this.props.id || 'empty';
            window.localStorage.setItem(key, source);
        }
    }

    onSeedChanged(seed, initialLoad=false) {
        this.setState({ seed });
        if (!initialLoad && this.props.id !== undefined) {
            window.history.replaceState('', '', `${window.location.protocol}\/\/${window.location.host}/sketch/${this.props.id}?seed=${seed}`);
        }
    }

    componentDidMount() {
        window.addEventListener('beforeunload', (e) => {
            let confirm = null;
            if (this.state.unsaved) {
                confirm = 'You have unsaved changes.';
                (e || window.event).returnValue = confirm;
            }
            return confirm;
        });
    }

    onSave() {
        console.assert(this.state.source !== undefined);
        console.assert(this.state.seed !== undefined);
        if (this.state.saving) return;
        this.setState({ saving: true });
        let sketch = {};
        sketch.source = this.state.source;
        sketch.seed = this.state.seed;
        if (this.props.id) sketch.parent = this.props.id;
        firebase.database().goOnline();
        const ref = firebase.database().ref('sketch').push();
        ref.set(sketch, () => {
            this.setState({ saving: false, unsaved: false });
            window.localStorage.removeItem(this.props.id || 'empty');
            route(`/sketch/${ref.key}`);
        }).then(() => {
            firebase.database().goOffline();
        });
    }

    render(props, state) {
        let saveLabel = state.saving ? 'Saving...' : 'Save';
        return h('div', {class: 'app'},
            h(Header, { unsaved: !!state.unsaved },
                h('button', {class: 'button save-button' + (state.unsaved ? ' unsaved' : ''), onClick: this.onSave.bind(this), disabled: state.saving}, saveLabel)
            ),
            h(Editor, {
                id: props.id,
                onSourceChanged: this.onSourceChanged.bind(this),
                onSeedChanged: this.onSeedChanged.bind(this),
                headerRight: h('a', { href:'/docs', target: '_blank' }, 'Documentation')
            })
        );
    }
}

class Embed extends Component {
    render(props) {
        const link = h('a', { href:`/sketch/${ props.id }`, target: '_blank' }, 'Open in new window');
        return h('div', {class: 'app embed'},
            h(Editor, { id: props.id, headerRight: link })
        );
    }
}

class Docs extends Component {
    constructor(props) {
        super(props);
        this.state = { page: undefined, html: 'Loading...', loadSketch: new LoadSketch() };
    }

    render(props) {
        const PAGES = [
            { id: 'index', title: 'Documentation' },
            { id: 'getting-started', title: 'Getting Started' },
            { id: 'graphics', title: 'Generating Graphics' },
            { id: 'animation', title: 'Animation' },
            { id: 'recursion', title: 'Recursion' },
            { id: 'css-tricks', title: 'Using CSS functionality' },
            { id: 'arguments', title: 'Working with arguments' },
            { id: 'cheat-sheet', title: 'Cheat Sheet' },
        ]
        const items = [];
        for (const page of PAGES) {
            let link;
            if (page.id === 'index') {
                link = h(Link, { class: 'docs__header' + (props.page === 'index' ? ' active' : ''), href: '/docs' }, page.title);
            } else {
                link = h(Link, { class: props.page === page.id ? 'active' : '', href: `/docs/${ page.id }` }, page.title);
            }
            items.push(h('li', {}, link));
        }
        return h('div', {class: 'app'},
            h(Header, {},
                h('a', {class: 'button', href: '/sketch'}, 'New Sketch')
            ),
            h('div', {class: 'page docs'},
                h('div', {class: 'docs__nav'},
                    h('ul', {},
                        items
                    )
                ),
                h('div', {class: 'docs__body', dangerouslySetInnerHTML: { __html: this.state.html}})
            )
        );
    }

    onPage() {
        if (this.state.page === this.props.page) return;
        const page = this.props.page || 'index';
        fetch(`/_docs/${page}.md`)
            .then(res => res.text())
            .then(text => {
                const html = marked(text, { renderer: gMarkedRenderer });
                this.setState({ page: this.props.page, html });
            });
    }

    componentDidMount() {
        this.onPage();
    }

    componentDidUpdate() {
        this.onPage();
        if (window.location.pathname.split('/')[1] === 'docs') {
            let cw = document.getElementsByClassName('code-wrap');
            const loadSketch = this.state.loadSketch;
            for (let i = 0; i < cw.length; i += 1) {
                let el = cw[i];
                let code = el.getElementsByTagName('code')[0];
                let codeResult = el.getElementsByClassName('code-result')[0];
                if (code !== undefined && codeResult !== undefined) {
                    parsePhraseBook(code.textContent, loadSketch)
                    .then(phraseBook => generateString(phraseBook))
                    .then(result => { codeResult.innerHTML = result; })
                    .catch(err => { codeResult.innerHTML = err; });
                }
            }
            loadSketch.goOffline();
        }
    }
}

class NotFound extends Component {
    render() {
        return h('div', {class: 'app'},
            h(Header, {}),
            h('div', {class: 'page centered'},
                h('h1', {}, 'Page not found.'),
                h('a', {href: '/'}, 'Go Back Home')
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
                h(Embed, { path: '/embed' }),
                h(Embed, { path: '/embed/:id' }),
                h(Docs, { path: '/docs', page: 'index'}),
                h(Docs, { path: '/docs/:page'}),
                h(NotFound, { type: '404', default: true })
        );
    }
}

render(h(App), document.body);
