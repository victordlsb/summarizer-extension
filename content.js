if (window.contentJsInitialized) {
  console.log("Content script already initialized.");
} else {
  const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
  const summaryInstances = new WeakMap();
  window.contentJsInitialized = true;

  // Initialize keys object to track key states
  const keys = {
    ctrl: false,
    alt: false,
    meta: false
  };

  // Add the keydown event listener
  document.addEventListener('keydown', function (event) {
    if (event.code === 'ControlLeft' || event.code === 'ControlRight') keys.ctrl = true;
    if (event.code === 'AltLeft' || event.code === 'AltRight') keys.alt = true;
    if (event.code === 'MetaLeft' || event.code === 'MetaRight') keys.meta = true; // Command key on macOS
  });

  // Keyup event listener
  document.addEventListener('keyup', function (event) {
    if (event.code === 'ControlLeft' || event.code === 'ControlRight') keys.ctrl = false;
    if (event.code === 'AltLeft' || event.code === 'AltRight') keys.alt = false;
    if (event.code === 'MetaLeft' || event.code === 'MetaRight') keys.meta = false; // Command key on macOS
  });

  // Add this function at the top of your initialization block
  function getPlatform() {
    const userAgent = navigator.userAgent.toLowerCase();
    console.log(navigator.userAgent);
    if (userAgent.includes('mac')) {
      console.log("macOS detected");
      return 'macOS';
    } else if (userAgent.includes('win')) {
      return 'Windows';
    } else {
      return 'Other';
    }
  }

  document.addEventListener('click', function (event) {
    const os = getPlatform();
    if ((os === "macOS" && keys.meta && keys.alt) || (os === "Windows" && keys.ctrl && keys.alt)) {
      console.log("Command+Option/Control+Alt click detected");
      event.preventDefault();
      const anchor = event.target.closest("a");
      if (anchor) {
        console.log("Anchor clicked for summarizing:", anchor);
        browserAPI.runtime.sendMessage({ action: "summarizeAnchor", href: anchor.href, innerText: anchor.innerText });      }
    }
  });

  let lastClickedAnchor = null;

  // Listen for the contextmenu event on <a> elements
  document.addEventListener("contextmenu", (event) => {
    if (event.target.tagName === "A") {
      lastClickedAnchor = event.target; // Store the <a> element
    }
  });



  // Add helper to get or create the right-side frame.
  function getOrCreateFrame() {
    let frame = document.getElementById('summarizer-frame');
    if (!frame) {
      frame = document.createElement('div');
      frame.id = "summarizer-frame";
      frame.className = "summarizer-frame";
      document.body.appendChild(frame);
    }

    if (!frame.querySelector('#summarizer-title')){
      const titleElement = document.createElement('div');
      titleElement.id = "summarizer-title";
      titleElement.className = "summarizer-title";
      titleElement.textContent = "Summarizer";
      frame.appendChild(titleElement);
    }
    if (!frame.querySelector('#close-button')){
      // Create a close button for the frame.
      const closeBtn = document.createElement('button');
      closeBtn.textContent = "×";
      closeBtn.className = "summarizer-close-button";
      closeBtn.addEventListener('click', () => frame.remove());
      frame.appendChild(closeBtn);
    }
    if(!frame.querySelector('#summarizer-error-container')){
      const errorContainer = document.createElement('div');
      errorContainer.id = "summarizer-error-container";
      errorContainer.className = "error-container";
      frame.appendChild(errorContainer);
    }
    if (!frame.querySelector('#summaries-container')){
      // Create a container for the summaries.
      const summariesContainer = document.createElement('div');
      summariesContainer.id = "summaries-container";
      frame.appendChild(summariesContainer);
    }
    frame.querySelector('#summarizer-error-container').style.display = 'none';
    
    return frame;
  }


  browserAPI.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if(request.action === "getLastClickedAnchor"){
      const anchorData = lastClickedAnchor ? {
        href: lastClickedAnchor.href,
        innerText: lastClickedAnchor.innerText || lastClickedAnchor.textContent || '' } 
      : null;
      sendResponse(anchorData);
    }
    else if (request.action === "noAPIKey") {
      const frame = getOrCreateFrame();
      errorContainer = frame.querySelector('#summarizer-error-container');
      errorContainer.innerHTML = "";

      const errorContent = document.createElement('p');
      errorContent.innerHTML = "There is no LLM API Key in the extension configuration. Please enter a valid API key to obtain the summary. If you have already input it, summarize the link again.";
      errorContent.className = "error-text-content";
      errorContent.style = "color: #ff4444; margin-bottom: 15px;"
      
      const errorButton = document.createElement('button');
      errorButton.innerHTML = "Open Configuration";
      errorButton.className = "summarizerButton";
      errorButton.id = "openConfig";

      errorContainer.appendChild(errorContent);
      errorContainer.appendChild(errorButton);
      errorContainer.style.display = 'block';
      document.getElementById('openConfig').addEventListener('click', () => {
        browserAPI.runtime.sendMessage({ action: "openConfig" });
        errorContainer.style.display = 'none';
      });
    } else if (request.action === "showFrame") {
      console.log("Received showFrame message");
      const frame = getOrCreateFrame();
      frame.style.display = 'block'; 
    } else if(request.anchor) {
      frame = getOrCreateFrame();
      const container = frame.querySelector('#summaries-container');
      title = request.anchor.innerText;
      let divId = window.generateSummaryContainerId(title)
      let summaryContainer = document.getElementById(divId);
      let summaryInstance;
      if (!summaryContainer) {
        summaryInstance = new Summary(request.anchor);
        summaryContainer = summaryInstance.render();
        container.insertBefore(summaryContainer, container.firstChild);
        summaryInstances.set(summaryContainer, summaryInstance);  
      } else {
        summaryInstance = summaryInstances.get(summaryContainer);
      }

      if (request.action === "displayLoader") {
        summaryInstance.setLoader();
        frame.scrollTo({ top: 0, behavior: 'smooth' }); // Add this line
      } else if (request.action === "displayResult") {
        summaryInstance.setSummaryText(request.text);
      }
    }
  });
  frame = getOrCreateFrame();
  frame.style.display = "none";
}
