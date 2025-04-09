
class Summary {
    constructor(anchor) {
        this.anchor = anchor;
        this.containerId = generateSummaryContainerId(anchor.innerText);
        this.container = null;
    }

    render() {
        this.container = document.createElement('div');
        this.container.id = this.containerId;
        this.container.className = 'summary-container';
        this.container.appendChild(this.createTitleWrapper());
        this.container.appendChild(this.createContentWrapper());
        this.container.appendChild(this.createDivider());
        return this.container;
    }

    createTitleWrapper() {
        const titleWrapper = document.createElement('div');
        titleWrapper.className = 'title-wrapper';

        const titleAnchor = document.createElement('a');
        titleAnchor.className = 'title-anchor';
        titleAnchor.href = this.anchor.href;
        titleAnchor.innerText = this.anchor.innerText;
        titleWrapper.appendChild(titleAnchor);

        const closeBtn = document.createElement('button');
        closeBtn.innerText = 'x';
        closeBtn.className = 'close-btn';
        closeBtn.onclick = () => { this.container.remove();}
        titleWrapper.appendChild(closeBtn);
        return titleWrapper;
    }

    createContentWrapper() {
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'content-wrapper';
        return contentWrapper;
    }

    createDivider() {
        const divider = document.createElement('div');
        divider.className = 'summary-divider';
        return divider;
    }
    
    setContent(content) {
        const contentWrapper = this.container.querySelector('.content-wrapper');
        contentWrapper.innerHTML = '';
        contentWrapper.appendChild(content);
    }

    setLoader() {
        const loaderElement = document.createElement('div');
        loaderElement.id = "summary-loader";
        const gif = document.createElement('img');
        gif.src = "https://emojis.slackmojis.com/emojis/images/1643515422/14423/cat-roomba.gif";
        gif.alt = "Loading gif";
        gif.className = 'loader-gif';

        const text = document.createElement('Span');
        text.textContent = "Loading...";

        loaderElement.appendChild(gif);
        loaderElement.appendChild(text);
        this.setContent(loaderElement);
    }

    setSummaryText(text) {
        const content = document.createElement('div');
        content.id = "summary-content";
        content.className = 'summary-content';
        content.innerText = text;
        this.setContent(content);
    }

}



