(function () {
  const vscode = acquireVsCodeApi();

  const sendInteractionForm = document.querySelector(".send-eth");
  const addressSelect = document.querySelector(".send-eth__select");
  const addressCopyButton = document.querySelector(".send-eth__copy");
  const toInput = document.querySelector(".send-eth__to");
  const ethInput = document.querySelector(".send-eth__eth");

  sendInteractionForm.addEventListener("submit", (event) => {
    event.preventDefault();

    vscode.postMessage({
      type: "sendEth",
      value: {
        fromPrivateKey: addressSelect.value,
        to: toInput.value,
        value: ethInput.value,
      },
    });
  });

  addressCopyButton.addEventListener("click", () => {
    const address = addressSelect
      .querySelector("option:checked")
      .innerHTML.split("(")[0]
      .trim();
    navigator.clipboard.writeText(address);
  });

  window.addEventListener("message", ({ data }) => {
    switch (data.type) {
      case "changeAddressState": {
        const options = data.value.map((item) => {
          const { address, balance, privateKey } = item;
          const element = document.createElement("option");
          element.value = privateKey;
          element.innerHTML = `${address}(${balance})`;
          return element;
        });
        addressSelect.replaceChildren(...options);
        break;
      }
    }
  });

  // function listenText() {
  //   const sampleText = "sample Text";
  //   text.push(sampleText);
  //   vscode.setState({ text: text });
  // }
})();
