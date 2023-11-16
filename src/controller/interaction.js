(function () {
  const vscode = acquireVsCodeApi();
  const sendInteractionForm = document.querySelector(".send-eth");
  const addressSelect = document.querySelector(".send-eth__select");
  const addressCopyButton = document.querySelector(".send-eth__copy");
  const gasLimit = document.querySelector(".send-eth__gas");
  const toInput = document.querySelector(".send-eth__to");
  const ethInput = document.querySelector(".send-eth__eth");

  const deployContractButton = document.querySelector(".contract__deploy");
  const contractAddressText = document.querySelector(".contract__address");
  const contractSelect = document.querySelector(".contract__select");
  const callTxButton = document.querySelector(".call-tx");
  const contractInteractionElement = document.querySelector(".contract__interaction");

  const compileInteractionElement = document.querySelector(".compile__interaction");

  const solFilesSelect = document.querySelector(".compile__solFiles");
  const compileButton = document.querySelector(".compile__submit");

  let compiledByteCode = null;

  window.onload = () => {
    vscode.postMessage({
      type: "init",
    });
  };

  //TODO: Refactor
  compileButton.addEventListener("click", () => {
    vscode.postMessage({
      type: "compile",
      value: {
        solFile: solFilesSelect.value,
      },
    });
  });

  sendInteractionForm.addEventListener("submit", (event) => {
    event.preventDefault();

    vscode.postMessage({
      type: "send",
      value: {
        data: compiledByteCode,
        // callData: ,
        // maxFeePergas: ,
        gasLimit: gasLimit.value,
        fromPrivateKey: addressSelect.value,
        value: ethInput.value,
        to: toInput.value,
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
    vscode.postMessage({
      type: "deploy",
      value: {
        solFile: solFilesSelect.value,
      },
    });
    vscode.postMessage({ // 고쳐야해
      type: "send",
      value: {
        data: compiledByteCode,
        fromPrivateKey: addressSelect.value,
        value: 0,
      }
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

      case "contractSelect": {
        console.log("ts -> interaction.js - contractSelect 실행중...");

        const { solFile, contractList } = data.value;
        contractSelect.innerHTML = '';

        console.log("interaction.js - contractSelect - solFile ---", solFile);
        console.log("interaction.js - contractSelect - contractlist ---", contractList);

        const solFileName = solFile.split('/').pop();

        contractList.forEach((contractName, index) => {
          const option = document.createElement("option");
          option.value = index;
          option.innerHTML = `${contractName} - ${solFileName}`;
          contractSelect.appendChild(option);
        });
        break;
      }

      case "compileJson": {
        console.log("ts -> interaction.js - compileJson 실행중...");
        const { contractData, contractBytecode } = data.value;
        const abis = contractData;
        const bytecodes = contractBytecode;
        console.log("interaction.js - compileJson - contractData -—- ", abis);
        console.log("interaction.js - compileJson - bytecodes --- ", bytecodes);

        let abiButton = document.getElementById("abiButton");
        let bytecodesButton = document.getElementById("bytecodesButton");

        if (!abiButton) {
          abiButton = document.createElement("div");
          abiButton.innerHTML = `
            <div type="button" class="compile__copy" id="abiButton">
            <i class="far fa-copy"></i>ABI
            </div>`;
          abiButton = abiButton.firstElementChild;
        }
        abiButton.addEventListener("click", () => {
          copyToClipboard(JSON.stringify(abis));
          console.log("Copy abis");
        });

        if (!bytecodesButton) {
          bytecodesButton = document.createElement("div");
          bytecodesButton.innerHTML = `
            <div type="button" class="compile__copy" id="bytecodesButton">
            <i class="far fa-copy"></i>Bytecode
            </div>`;
          bytecodesButton = bytecodesButton.firstElementChild;
        }
        bytecodesButton.addEventListener("click", () => {
          copyToClipboard(bytecodes);
          console.log("Copy bytecodes");
        });

        compileInteractionElement.appendChild(abiButton);
        compileInteractionElement.appendChild(bytecodesButton);

        break;
      }

      // view , pure 함수는 send 버튼이 아닌 call 버튼으로 호출

      // sidebar에 deploy 결과 contract 띄우는 거 필요없음
      // case "compiled_sidebar": {
      //   console.log("ts -> interaction.js - compiled_sidebar 실행중...");
      //   const { abis, bytecodes, contract } = data.value;
      //   compiledByteCode = bytecodes;
      //   console.log("interaction.js - compiled_sidebar - abis -—- ", abis);
      //   console.log("interaction.js - compiled_sidebar - bytecodes --- ", bytecodes);
      //   console.log("interaction.js - compiled_sidebar - contract ---", contract);

      //   const onlyFunctionAbis = abis.filter(({ type }) => type === "function");
      //   const contractElement = document.createElement("div");
      //   contractElement.classList.add("contract");

      //   const contractTitleElement = document.createElement("div");
      //   const contractNameElement = document.createElement("p");
      //   const contractChevronDownButtonElement = makeChevronDownButtonElement();
      //   const contractActionsWrapperElement = document.createElement("div");
      //   contractActionsWrapperElement.classList.add("contract__actions");

      //   contractTitleElement.classList.add("contract__title");
      //   contractTitleElement.appendChild(contractNameElement);
      //   contractNameElement.innerHTML = contract;
      //   contractTitleElement.appendChild(contractNameElement);

      //   contractElement.appendChild(contractTitleElement);
      //   contractTitleElement.appendChild(contractChevronDownButtonElement);

      //   contractChevronDownButtonElement.addEventListener("click", () => {
      //     contractActionsWrapperElement.classList.toggle("hidden");
      //   });

      //   const functionElements = onlyFunctionAbis.map(
      //     ({ name, inputs, stateMutability, type, signature }) => {
      //       const functionElement = document.createElement("div");
      //       functionElement.classList.add("function");

      //       const functionActionSingleElement = document.createElement("div");
      //       functionActionSingleElement.classList.add(
      //         "function__action-single"
      //       );

      //       const functionActionMultiElement = document.createElement("div");
      //       functionActionMultiElement.classList.add(
      //         "function__action-multi",
      //         "hidden"
      //       );

      //       let argsElement = [];

      //       const actionElement = document.createElement("button");
      //       actionElement.innerHTML = name;
      //       actionElement.classList.add(stateMutability, "function__action");
      //       functionActionSingleElement.appendChild(actionElement);

      //       if (inputs.length === 1) {
      //         const inputElement = document.createElement("input");
      //         inputElement.placeholder = `${inputs[0].type} ${inputs[0].name}`;
      //         argsElement = [inputElement];
      //         functionActionSingleElement.appendChild(inputElement);
      //       }

      //       if (inputs.length > 1) {
      //         const chevronDownButtonElement = makeChevronDownButtonElement();
      //         chevronDownButtonElement.addEventListener("click", () => {
      //           functionActionMultiElement.classList.toggle("hidden");
      //         });
      //         functionActionSingleElement.appendChild(chevronDownButtonElement);

      //         argsElement = makeMultiArgsElements(inputs);
      //         functionActionMultiElement.replaceChildren(...argsElement);
      //       }

      //       actionElement.addEventListener("click", () => {
      //         console.log(argsElement);
      //         const args = argsElement.map(
      //           (argElement) => argElement.childNodes[1].value
      //         );

      //         console.log(contractAddressText.innerHTML);
      //         vscode.postMessage({
      //           type: "call",
      //           value: {
      //             signature,
      //             args,
      //             name,
      //             to: contractAddressText.innerHTML,
      //             fromPrivateKey: addressSelect.value,
      //             value: ethInput.value, // TODO
      //           },
      //         });
      //       });

      //       functionElement.replaceChildren(functionActionSingleElement);
      //       functionElement.appendChild(functionActionMultiElement);

      //       return functionElement;
      //     }
      //   );
      //   contractActionsWrapperElement.replaceChildren(...functionElements);

      //   contractElement.appendChild(contractTitleElement);
      //   contractElement.appendChild(contractActionsWrapperElement);

      //   contractInteractionElement.appendChild(contractElement);

      //   break;
      // }

      case "compiled_webview": {
        console.log("ts -> interaction.js - compiled_webview 실행중...");
        const { abis, bytecodes, contractList } = data.value;
        console.log("interaction.js - compiled_webview - abis -—- ", abis);
        console.log("interaction.js - compiled_webview - bytecodes --- ", bytecodes);
        console.log("interaction.js - compiled_webview - contractList --- ", contractList);

        vscode.postMessage({
          type: "webview",
          value: {
            panel: "deployPanel",
            title: "Deploy Result",
            filePath: "src/pages/deploy_result.ejs",
            abis: abis,
            bytecodes: bytecodes,
            contract: contractList,
          }
        });
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

function copyToClipboard(value) {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}