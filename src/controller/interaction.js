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

  let compiledByteCode = null;

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

      // view , pure 함수는 send 버튼이 아닌 call 버튼으로 호출

      case "compiled": {
        const { abis, bytecodes, contract } = data.value;
        compiledByteCode = bytecodes;

        const onlyFunctionAbis = abis.filter(({ type }) => type === "function");
        const contractElement = document.createElement("div");
        contractElement.classList.add("contract");

        const functionElements = onlyFunctionAbis.map(
          ({ name, inputs, stateMutability, type }) => {
            const functionElement = document.createElement("div");
            functionElement.classList.add("function");

            const functionActionSingleElement = document.createElement("div");
            functionActionSingleElement.classList.add(
              "function__action-single"
            );

            const functionActionMultiElement = document.createElement("div");
            functionActionMultiElement.classList.add(
              "function__action-multi",
              "hidden"
            );

            const actionElement = document.createElement("button");
            actionElement.innerHTML = name;
            actionElement.classList.add(stateMutability, "function__action");
            functionActionSingleElement.appendChild(actionElement);

            if (inputs.length === 1) {
              const inputElement = document.createElement("input");
              inputElement.placeholder = `${inputs[0].type} ${inputs[0].name}`;
              functionActionSingleElement.appendChild(inputElement);
            }

            if (inputs.length > 1) {
              const chevronDownButtonElement = makeChevronDownButtonElement();
              const argsElement = makeMultiArgsElements(inputs);
              functionActionSingleElement.appendChild(chevronDownButtonElement);
              functionActionMultiElement.replaceChildren(...argsElement);
            }

            functionElement.replaceChildren(functionActionSingleElement);
            functionElement.appendChild(functionActionMultiElement);

            return functionElement;
          }
        );
        contractElement.replaceChildren(...functionElements);
        contractInteractionDiv.appendChild(contractElement);
      }
    }
  });

  function makeMultiArgsElements(inputs) {
    const argsElements = inputs.map(({ name, type }) => {
      const argElement = document.createElement("div");
      argElement.classList.add("argument");

      const inputNameElement = document.createElement("div");
      inputNameElement.classList.add("argument__name");
      inputNameElement.innerHTML = `${type} ${name}`;

      const inputElement = document.createElement("input");

      argElement.appendChild(inputNameElement);
      argElement.appendChild(inputElement);

      return argElement;
    });

    return argsElements;
  }

  function makeChevronDownButtonElement() {
    const chevronDownButtonElement = document.createElement("div");
    const chevronDownIconElement = document.createElement("i");
    chevronDownIconElement.classList.add(
      "fas",
      "fa-chevron-down",
      "dropdown-action"
    );
    chevronDownButtonElement.style.cursor = "pointer";
    chevronDownButtonElement.addEventListener("click", () => {
      functionActionMultiElement.classList.toggle("hidden");
    });
    chevronDownButtonElement.appendChild(chevronDownIconElement);
    return chevronDownButtonElement;
  }
})();
