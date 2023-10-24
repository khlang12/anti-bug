(function () {
  const vscode = acquireVsCodeApi();

  const button = document.querySelector(".send-eth");

  const inputEth = document.querySelector(".input-eth");
  const inputAddress = document.querySelector(".input-address");

  button.addEventListener("click", () => {
    vscode.postMessage({ type: "sendEth" });
  });
})();
