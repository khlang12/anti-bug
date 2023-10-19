// @ts-ignore

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
  const vscode = acquireVsCodeApi();
  const oldState = vscode.getState() || { colors: [] };
  const text = [];

  const button = document.querySelector(".test-show-message");
  button.addEventListener("click", () => {
    vscode.postMessage({ type: "showText", value: "button click" });
  });

  // Handle messages sent from the extension to the webview
  // command
  window.addEventListener("message", (event) => {
    switch (event.data.type) {
      case "addText": {
        listenText();
        sendPostMessage();
        break;
      }
    }
  });

  function sendPostMessage() {
    vscode.postMessage({ type: "showText", value: text[0] });
  }

  function listenText() {
    const sampleText = "sample Text";
    text.push(sampleText);
    vscode.setState({ text: text });
  }
})();
