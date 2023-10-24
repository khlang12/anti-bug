(function () {
  const vscode = acquireVsCodeApi();
  const oldState = vscode.getState() || { colors: [] };

  const button = document.querySelector(".send-eth");

  const inputEth = document.querySelector(".input-eth");
  const inputAddress = document.querySelector(".input-address");

  button.addEventListener("click", () => {
    vscode.postMessage({ type: "sendEth" });
  });

  // function listenText() {
  //   const sampleText = "sample Text";
  //   text.push(sampleText);
  //   vscode.setState({ text: text });
  // }
})();
