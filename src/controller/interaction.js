(function () {
  const vscode = acquireVsCodeApi();

  // sidebar 실행과 동시에 getSolFiles로 Listener 실행
  vscode.postMessage({ type: "getSolFiles", value: null });

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
        console.log("addEventListener 실행중...");
        const options = data.value.map((item) => {
          const { address, balance, privateKey } = item;
          const element = document.createElement("option");
          element.value = privateKey;
          element.innerHTML = `${address}(${balance})`;
          console.log("element...", element);
          return element;
        });
        addressSelect.replaceChildren(...options);
        break;
      }
      case "solFiles": {
        const dropdown = document.getElementById("solFileDropdown");
        dropdown.innerHTML = "";

        data.value.forEach((option) => {
          const optionElement = document.createElement("option");
          optionElement.value = option.value;
          optionElement.textContent = option.text;
          dropdown.appendChild(optionElement);
        });
      }
    }
  });
}) () ;