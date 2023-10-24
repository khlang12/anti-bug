// @ts-ignore

(function () {
  const vscode = acquireVsCodeApi();
  const oldState = vscode.getState() || { colors: [] };
  const text = [];

  const button = document.querySelector(".test-show-message");
  button.addEventListener("click", () => {
    vscode.postMessage({ type: "showText", value: "button click" });
  });
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
