(function () {
  const vscode = acquireVsCodeApi();

  const button = document.querySelector(".button-deploy");

  button.addEventListener("click", () => {
    vscode.postMessage({ type: "" });
  });
})();

