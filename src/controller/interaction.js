(function () {
  const vscode = acquireVsCodeApi();

  const sendInteractionForm = document.querySelector(".send-interaction");
  const addressSelect = document.querySelector(".send-interaction__address");
  const toInput = document.querySelector(".send-interaction__to");
  const ethInput = document.querySelector(".send-interaction__eth");

  sendInteractionForm.addEventListener("submit", (event) => {
    event.preventDefault();

    console.log(addressSelect.value, toInput.value, ethInput.value);
    vscode.postMessage({
      type: "sendEth",
      value: {
        fromPrivateKey: addressSelect.value,
        to: toInput.value,
        value: ethInput.value,
      },
    });
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
