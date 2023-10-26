(function () {
  const vscode = acquireVsCodeApi();
  const sendInteractionForm = document.querySelector(".send-eth");
  const addressSelect = document.querySelector(".send-eth__select");
  const addressCopyButton = document.querySelector(".send-eth__copy");
  const toInput = document.querySelector(".send-eth__to");
  const ethInput = document.querySelector(".send-eth__eth");

  const deployContractButton = document.querySelector(".contract__deploy");
  const contractAddressText = document.querySelector(".contract__address");
  const callTxButton = document.querySelector(".call-tx");
  const contractInteractionDiv = document.querySelector(
    ".contract__interaction"
  );

  const solFilesSelect = document.querySelector(".compile__solFiles");
  const compileButton = document.querySelector(".compile__submit");

  const dropdown = document.querySelector(".dropdown");

  let compiledByteCode = null;

  dropdown.addEventListener("click", () => {
    dropdown.querySelector(".dropdown__list").classList.toggle("hidden");
  });

  window.onload = () => {
    vscode.postMessage({
      type: "init",
    });
  };

  //TODO: Refactor
  sendInteractionForm.addEventListener("submit", (event) => {
    event.preventDefault();

    vscode.postMessage({
      type: "send",
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

  deployContractButton.addEventListener("click", () => {
    if (!compiledByteCode) {
      console.log("compiledByteCode is null");
      return;
    }
    vscode.postMessage({
      type: "send",
      value: {
        callData: compiledByteCode,
        fromPrivateKey: addressSelect.value,
        value: 0, // TODO
      },
    });
  });

  compileButton.addEventListener("click", () => {
    vscode.postMessage({
      type: "compile",
      value: {
        solFile: solFilesSelect.value,
      },
    });
  });

  window.addEventListener("message", ({ data }) => {
    switch (data.type) {
      case "init": {
        const { accounts, solFiles } = data.value;
        const solFileOptions = solFiles.map(({ path }) => {
          const option = document.createElement("option");
          option.value = path;
          option.innerHTML = path;
          return option;
        });

        solFilesSelect.replaceChildren(...solFileOptions);

        const accountOptions = accounts.map(
          ({ address, privateKey, balance }) => {
            const option = document.createElement("option");
            option.value = privateKey;
            option.innerHTML = `${address} (${balance})`;
            return option;
          }
        );

        addressSelect.replaceChildren(...accountOptions);
        break;
      }

      case "receipt": {
        const {
          accounts,
          contractAddress,
          exectResult,
          totalGasSpent,
          amountSpent,
        } = data.value;
        const { from, to, fromBalance, toBalance } = accounts;
        const options = addressSelect.querySelectorAll("option");

        const fromOption = [...options].find((option) =>
          option.innerHTML.includes(from)
        );
        const newFromOption = document.createElement("option");
        newFromOption.value = fromOption.value;
        newFromOption.innerHTML = `${from} (${fromBalance})`;
        newFromOption.selected = true;
        addressSelect.replaceChild(newFromOption, fromOption);

        if (to) {
          const toOption = [...options].find((option) =>
            option.innerHTML.includes(to)
          );
          const newToOption = document.createElement("option");
          newToOption.value = toOption.value;
          newToOption.innerHTML = `${to} (${toBalance})`;
          addressSelect.replaceChild(newToOption, toOption);
        }

        if (contractAddress) {
          contractAddressText.innerHTML = contractAddress;

          vscode.postMessage({
            type: "makeFunctions",
            value: {
              abi,
            },
          });
        }

        break;
      }

      case "compiled": {
        const { abis, bytecodes, contract } = data.value;
        compiledByteCode = bytecodes;
        const interactionElement = abis.map(
          ({ name, inputs, stateMutability }) => {
            const containerElement = document.createElement("div");
            const functionsElement = document.createElement("div");

            inputs.map(({ internalType, name, type }) => {
              const inputElement = document.createElement("input");
              inputElement.placeholder = `${type} ${name}`;

              functionsElement.appendChild(inputElement);
            });

            console.log(functionsElement);
            const sendElement = document.createElement("button");
            sendElement.innerHTML = name;
            sendElement.classList.add(stateMutability, "function-send");

            containerElement.appendChild(sendElement);
            containerElement.appendChild(functionsElement);

            contractInteractionDiv.appendChild(containerElement);
          }
        );
      }
    }
  });

  // function listenText() {
  //   const sampleText = "sample Text";
  //   text.push(sampleText);
  //   vscode.setState({ text: text });
  // }
})();
