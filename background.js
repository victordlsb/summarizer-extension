const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
const contextMenuAPI = browserAPI.contextMenus || browserAPI.menus;

browserAPI.runtime.onInstalled.addListener(function() {
  contextMenuAPI.create({
    id: "summarize",
    title: "Summarize",
    contexts: ["link"]
  });
});

// Helper function to process summarization for a given tab and link data.
function processSummarize(anchor, tab) {
  console.log("Processing summarize for:", anchor);
  link = anchor.href;
  title = anchor.innerText !== "" ? anchor.innerText : link;
  browserAPI.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content.js']
  }, () => {
    browserAPI.tabs.sendMessage(tab.id, { action: "showFrame" });
  });
  return new Promise((resolve, reject) => {
    console.log("Obtaining API Key from storage");
    browserAPI.storage.sync.get(['apiKey'], async function(result) {
      const apiKey = result.apiKey;
      if (!apiKey) {
        console.error('API key not set');
        browserAPI.scripting.executeScript({
          target: {tabId: tab.id},
          files: ['content.js']
        }, () => {
          browserAPI.tabs.sendMessage(tab.id, {action: "noAPIKey"});
        });
        return resolve();
      }
      browserAPI.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      }, () => {
        browserAPI.tabs.sendMessage(tab.id, { action: "displayLoader", anchor: anchor });
      });
      console.log("Fetching URL content for summarization");
      fetch(link)
        .then(response => response.text())
        .then(async html => {
          let cleanedHtml = html.replace(/<script[\s\S]*?<\/script>/gi, '')
                                .replace(/<style[\s\S]*?<\/style>/gi, '');
          const plainText = cleanedHtml.replace(/<[^>]+>/g, ' ')
                                      .replace(/\s\s+/g, ' ')
                                      .trim();
  
          const messageContent = `Title: ${title} Content: ${plainText}`;
  
          // Retrieve API key from storage
          const options = {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: "sonar",
              messages: [
                { role: "system", content: "I'll give you a title of a link and its content. Give me a summary in two to three lines without the title.  Give me the most direct answer to the tiel in the first line. Max 3 lines. Reply in the native language of the content provided." },
                { role: "user", content: messageContent }
              ],
              max_tokens: 123,
              temperature: 0.2,
              top_p: 0.9,
              search_domain_filter: null,
              return_images: false,
              return_related_questions: false,
              top_k: 0,
              stream: false,
              presence_penalty: 0,
              frequency_penalty: 1,
              response_format: null
            })
          };
  
          try {
            const response = await fetch('https://api.perplexity.ai/chat/completions', options);
            const apiResponse = await response.json();
            console.log("Perplexity API response:", apiResponse);
            const perplexityText = apiResponse?.choices?.[0]?.message?.content || "No response";
            browserAPI.scripting.executeScript({
              target: { tabId: tab.id },
              files: ['content.js']
            }, () => {
              browserAPI.tabs.sendMessage(tab.id, { action: "displayResult", anchor: anchor, text: perplexityText });
            });
          } catch (err) {
            return console.error('Error calling Perplexity API:', err);
          }
        })
        .catch(error => console.error('Error fetching URL:', error))
        .finally(() => resolve());
    });
  });
}

function getLastClickedAnchor(tabId) {
  return new Promise((resolve, reject) => {
    console.log("Getting last clicked anchor");
    browserAPI.tabs.sendMessage(tabId, { action: "getLastClickedAnchor" }, (response) => {
      if (browserAPI.runtime.lastError) {
        // Handle errors (e.g., no content script available)
        reject(browserAPI.runtime.lastError);
      } else if (response && response.href && response.innerText) {
          let anchor = { href: response.href, innerText: response.innerText };
          resolve(anchor); // Resolve with anchor details
      } else {
        resolve(null); // No anchor was clicked
      }
    });
  });
}

// Reuse the helper in the context menu listener
contextMenuAPI.onClicked.addListener(function(info, tab) {
  if (info.menuItemId === "summarize") {
    console.log("Summarize context menu clicked:");
    getLastClickedAnchor(tab.id)
    .then((anchor) => { 
      if (anchor) {
        processSummarize(anchor, tab);
      }
    });
  }
});

// New runtime message listener to handle command+option/ctrl+alt clicks.
browserAPI.runtime.onMessage.addListener(function(message, sender) {
  if (message.action === "summarizeAnchor" && message.href && message.innerText) {
    console.log("Summarize command+option/ctrl+alt clicked:");
    let anchor = { href: message.href, innerText: message.innerText };
    processSummarize(anchor, sender.tab);
  } else if (message.action === "openConfig") {
    browserAPI.tabs.create({ url: browserAPI.runtime.getURL("options.html") });
  }
});

