class ScriptLoader extends HTMLElement {
  connectedCallback() {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = './js/pong/main.js';
    document.head.appendChild(script);
  }
}

customElements.define('script-loader', ScriptLoader);