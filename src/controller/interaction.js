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
  const contractConstructor = document.querySelector(".contract__constructor");
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
    deployContractButton.removeAttribute("disabled");
  });

  solFilesSelect.addEventListener("change", () => {
    deployContractButton.setAttribute("disabled", "disabled");
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
        contractSelect: contractSelect.value,
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

        const { solFile, contractNameList, contractData } = data.value;
        contractSelect.innerHTML = '';

        console.log("interaction.js - contractSelect - solFile ---", solFile);
        console.log("interaction.js - contractSelect - contractNameList ---", contractNameList);
        console.log("interaction.js - contractSelect - contractData ---", contractData);

        const solFileName = solFile.split('/').pop();

        contractNameList.forEach((contractName) => {
          const option = document.createElement("option");
          option.value = contractName;
          option.innerHTML = `${contractName} - ${solFileName}`;
          contractSelect.appendChild(option);
        });

        // 아래 코드와 중복 (무조건 1회 실행 되어야 함)
        while (contractConstructor.firstChild) {
          contractConstructor.removeChild(contractConstructor.firstChild);
        }

        const selectedContractName = contractSelect.value;
        const selectedContractAbi = contractData[selectedContractName].abis;
        const constructorAbi = selectedContractAbi.find((item) => item.type === "constructor");

        if (constructorAbi && constructorAbi.inputs) {
          constructorAbi.inputs.forEach((input) => {
            const constructorElement = document.createElement("div");
            constructorElement.classList.add("constructor");

              const constructorName = document.createElement("div");
              constructorName.classList.add("constructor__name");
              constructorName.innerHTML = `${input.name}`;

              const constructorInput = document.createElement("input");
              constructorInput.type = "text";
              constructorInput.placeholder = `${input.type}`;

              constructorElement.appendChild(constructorName);
              constructorElement.appendChild(constructorInput);
              contractConstructor.appendChild(constructorElement);
          });
        }

        // 위 코드와 중복
        contractSelect.addEventListener("change", () => {
          console.log("select contract - ", contractSelect.value);

          while (contractConstructor.firstChild) {
            contractConstructor.removeChild(contractConstructor.firstChild);
          }

          const selectedContractName = contractSelect.value;
          const selectedContractAbi = contractData[selectedContractName].abis;
          const constructorAbi = selectedContractAbi.find((item) => item.type === "constructor");

          console.log("select contract - name - ", selectedContractName);
          console.log("select contract - abis - ", selectedContractAbi);
          console.log("select contract - constructor - ", constructorAbi);

          if (constructorAbi && constructorAbi.inputs) {
            constructorAbi.inputs.forEach((input) => {
              const constructorInput = document.createElement("input");
              constructorInput.type = "text";
              constructorInput.placeholder = `${input.name} ${input.type}`;
              contractConstructor.appendChild(constructorInput);
            });
          }
        });

        break;
      }

      case "copyJson": {
        console.log("ts -> interaction.js - copyJson 실행중...");
        const { contractData, contractBytecode } = data.value;
        const abis = contractData;
        const bytecodes = contractBytecode;
        console.log("interaction.js - copyJson - contractData -—- ", abis);
        console.log("interaction.js - copyJson - bytecodes --- ", bytecodes);

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

      case "compiled": {
        console.log("ts -> interaction.js - compiled 실행중...");
        const { solFile, abis, bytecodes, contract } = data.value;
        console.log("interaction.js - compiled - solFile -—- ", solFile);
        console.log("interaction.js - compiled - abis -—- ", abis);
        console.log("interaction.js - compiled - bytecodes --- ", bytecodes);
        console.log("interaction.js - compiled - contractList --- ", contract);

        vscode.postMessage({
          type: "webview",
          value: {
            panel: "deployPanel",
            title: "Deploy Result",
            filePath: "src/pages/deploy_result.ejs",
            solFile: solFile,
            abis: abis,
            bytecodes: bytecodes,
            contract: contract,
          }
        });
      }
    }
  });
})();

function copyToClipboard(value) {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}