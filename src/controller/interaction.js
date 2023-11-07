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
  const contractInteractionElement = document.querySelector(
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
        data: "0x608060405234801561001057600080fd5b50336000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550610215806100606000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c80638da5cb5b1461003b578063f5a1f5b414610059575b600080fd5b610043610089565b6040516100509190610154565b60405180910390f35b610073600480360381019061006e919061010d565b6100ad565b604051610080919061016f565b60405180910390f35b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b6000816000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555060019050919050565b600081359050610107816101c8565b92915050565b60006020828403121561011f57600080fd5b600061012d848285016100f8565b91505092915050565b61013f8161018a565b82525050565b61014e8161019c565b82525050565b60006020820190506101696000830184610136565b92915050565b60006020820190506101846000830184610145565b92915050565b6000610195826101a8565b9050919050565b60008115159050919050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6101d18161018a565b81146101dc57600080fd5b5056fea26469706673582212206dcd72df54690b8b5cdf0dab48c3f2bbef7b23ef7c01535142bfe4c32f0eacfc64736f6c63430008000033",
        // data: compiledByteCode,
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
        }

        break;
      }

      // view , pure 함수는 send 버튼이 아닌 call 버튼으로 호출

      case "compiled": {
        const { abis, bytecodes, contract } = data.value;
        compiledByteCode = bytecodes;

        console.log(abis);

        const onlyFunctionAbis = abis.filter(({ type }) => type === "function");
        const contractElement = document.createElement("div");
        contractElement.classList.add("contract");

        const contractTitleElement = document.createElement("div");
        const contractNameElement = document.createElement("p");
        const contractChevronDownButtonElement = makeChevronDownButtonElement();
        const contractActionsWrapperElement = document.createElement("div");
        contractActionsWrapperElement.classList.add("contract__actions");

        contractTitleElement.classList.add("contract__title");
        contractTitleElement.appendChild(contractNameElement);
        contractNameElement.innerHTML = contract;

        contractElement.appendChild(contractTitleElement);
        contractTitleElement.appendChild(contractChevronDownButtonElement);

        contractChevronDownButtonElement.addEventListener("click", () => {
          contractActionsWrapperElement.classList.toggle("hidden");
        });

        const functionElements = onlyFunctionAbis.map(
          ({ name, inputs, stateMutability, type, signature }) => {
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

            let argsElement = [];

            const actionElement = document.createElement("button");
            actionElement.innerHTML = name;
            actionElement.classList.add(stateMutability, "function__action");
            functionActionSingleElement.appendChild(actionElement);

            if (inputs.length === 1) {
              const inputElement = document.createElement("input");
              inputElement.placeholder = `${inputs[0].type} ${inputs[0].name}`;
              argsElement = [inputElement];
              functionActionSingleElement.appendChild(inputElement);
            }

            if (inputs.length > 1) {
              const chevronDownButtonElement = makeChevronDownButtonElement();
              chevronDownButtonElement.addEventListener("click", () => {
                functionActionMultiElement.classList.toggle("hidden");
              });
              functionActionSingleElement.appendChild(chevronDownButtonElement);

              argsElement = makeMultiArgsElements(inputs);
              functionActionMultiElement.replaceChildren(...argsElement);
            }

            actionElement.addEventListener("click", () => {
              console.log(argsElement);
              const args = argsElement.map(
                (argElement) => argElement.childNodes[1].value
              );

              console.log(contractAddressText.innerHTML);
              vscode.postMessage({
                type: "call",
                value: {
                  signature,
                  args,
                  name,
                  to: contractAddressText.innerHTML,
                  fromPrivateKey: addressSelect.value,
                  value: ethInput.value, // TODO
                },
              });
            });

            functionElement.replaceChildren(functionActionSingleElement);
            functionElement.appendChild(functionActionMultiElement);

            return functionElement;
          }
        );
        contractActionsWrapperElement.replaceChildren(...functionElements);

        contractElement.appendChild(contractTitleElement);
        contractElement.appendChild(contractActionsWrapperElement);

        contractInteractionElement.appendChild(contractElement);
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

    chevronDownButtonElement.appendChild(chevronDownIconElement);
    return chevronDownButtonElement;
  }
})();
