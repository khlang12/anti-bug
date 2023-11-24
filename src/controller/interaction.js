(function () {
  const vscode = acquireVsCodeApi();
  const addressSelect = document.querySelector(".send-eth__select");
  const addressCopyButton = document.querySelector(".send-eth__copy");
  const gasLimit = document.querySelector(".send-eth__gas");
  const toInput = document.querySelector(".send-eth__to");
  const ethInput = document.querySelector(".send-eth__eth");
  const unitInput = document.querySelector(".send-eth__unit");

  const deployForm = document.querySelector('.contract__deploy-form');
  const deployButton = document.querySelector(".contract__deploy");
  const contractAddressText = document.querySelector(".contract__address");
  const contractSelect = document.querySelector(".contract__select");
  const contractConstructor = document.querySelector(".contract__constructor");
  const contractConstructorInputs = document.querySelectorAll(".constructor__input");

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
    deployButton.setAttribute("disabled", "disabled");
    ethInput.setAttribute("disabled", "disabled");
    unitInput.setAttribute("disabled", "disabled");
    vscode.postMessage({
      type: "compile",
      value: {
        solFile: solFilesSelect.value,
      },
    });
  });

  solFilesSelect.addEventListener("change", () => {
    deployButton.setAttribute("disabled", "disabled");
    ethInput.setAttribute("disabled", "disabled");
    unitInput.setAttribute("disabled", "disabled");
    contractSelect.innerHTML = '';
    while (contractConstructor.firstChild) {
      contractConstructor.removeChild(contractConstructor.firstChild);
    }
    vscode.postMessage({
      type: "solFileOpen",
      value: {
        solFile: solFilesSelect.value
      }
    });
  });

  ethInput.addEventListener("input", () => {
    const inputValue = parseInt(ethInput.value, 10);
    if (inputValue < 0) {
      ethInput.value = 0;
    }
  });

  addressCopyButton.addEventListener("click", () => {
    const address = addressSelect
      .querySelector("option:checked")
      .innerHTML.split("(")[0]
      .trim();
    navigator.clipboard.writeText(address);
  });

  deployForm.addEventListener('submit', (event) => {
    event.preventDefault();

    ethInput.disabled = false;
    unitInput.disabled = false;

    const constructorInputValues = Array.from(event.target.querySelectorAll(".contract__constructor .constructor__input")).map(input => input.value);

    console.log("deploy clicked - solFile --- ", solFilesSelect.value);
    console.log("deploy clicked - contractSelect --- ", contractSelect.value);
    console.log("deploy clicked - constructorInputValues --- ", constructorInputValues);
    console.log("deploy clicked - fromPrivateKey --- ", addressSelect.value);
    console.log("deploy clicked - gasLimit --- ", gasLimit.value);
    console.log("deploy clicked - ethInput --- ", ethInput.value);

    vscode.postMessage({
      type: "deploy",
      value: {
        solFile: solFilesSelect.value,
        contractSelect: contractSelect.value,
        constructorInputValues: constructorInputValues,
        fromPrivateKey: addressSelect.value,
        gasLimit: gasLimit.value,
        value: ethInput.value,
        unit: unitInput.value,
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
            option.innerHTML = `${address} (${balance} Wei)`;
            return option;
          }
        );

        addressSelect.replaceChildren(...accountOptions);
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

        function updateContractConstructor(selectedContractName, contractData) {

          const selectedContractAbi = contractData[selectedContractName].abis;
          const constructorAbi = selectedContractAbi.find((item) => item.type === "constructor");

          console.log("select contract - name - ", selectedContractName);
          console.log("select contract - abis - ", selectedContractAbi);
          console.log("select contract - constructor - ", constructorAbi);

          while (contractConstructor.firstChild) {
            contractConstructor.removeChild(contractConstructor.firstChild);
          }

          if (constructorAbi && constructorAbi.inputs) {
            const constructorHead = document.createElement("p");
            constructorHead.innerHTML = "Constructor";
            constructorHead.classList.add("head");
            contractConstructor.append(constructorHead);

            constructorAbi.inputs.forEach((input) => {
              const constructorElement = document.createElement("div");
              constructorElement.classList.add("constructor");

              const constructorName = document.createElement("div");
              constructorName.classList.add("constructor__name");
              constructorName.innerHTML = `${input.name}`;

              const constructorInput = document.createElement("input");
              constructorInput.type = "text";
              constructorInput.placeholder = `${input.type}`;
              constructorInput.classList.add("constructor__input");

              constructorElement.appendChild(constructorName);
              constructorElement.appendChild(constructorInput);

              contractConstructor.appendChild(constructorElement);
            });
            console.log("stateMutability: ", constructorAbi.stateMutability);

            if (constructorAbi.stateMutability === "payable") {
              ethInput.disabled = false;
              unitInput.disabled = false;
            }
            const constructorInputs = document.querySelectorAll(".constructor__input");
            constructorInputs.forEach(constructorInput => {
              constructorInput.addEventListener("input", () => {
                deployButton.disabled = Array.from(constructorInputs).some(input => input.value.trim() === "");
              });
            });
          } else {
            deployButton.disabled = false;
          }
        }

        updateContractConstructor(contractNameList[0], contractData);

        contractSelect.addEventListener("change", () => {
          deployButton.setAttribute("disabled", "disabled");
          ethInput.setAttribute("disabled", "disabled");
          unitInput.setAttribute("disabled", "disabled");
          console.log("select contract - ", contractSelect.value);

          updateContractConstructor(contractSelect.value, contractData);
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

        if (abiButton) {
          abiButton.remove();
        }
        abiButton = document.createElement("div");
        abiButton.innerHTML = `
          <div type="button" class="compile__copy" id="abiButton">
          <i class="far fa-copy"></i>ABI
          </div>`;
        abiButton = abiButton.firstElementChild;

        abiButton.addEventListener("click", () => {
          copyToClipboard(JSON.stringify(abis));
          console.log("Copy abis");
        });

        if (bytecodesButton) {
          bytecodesButton.remove();
        }
        bytecodesButton = document.createElement("div");
        bytecodesButton.innerHTML = `
          <div type="button" class="compile__copy" id="bytecodesButton">
          <i class="far fa-copy"></i>Bytecode
          </div>`;
        bytecodesButton = bytecodesButton.firstElementChild;

        bytecodesButton.addEventListener("click", () => {
          copyToClipboard(bytecodes);
          console.log("Copy bytecodes");
        });

        compileInteractionElement.appendChild(abiButton);
        compileInteractionElement.appendChild(bytecodesButton);

        break;
      }

      case "sendOption": {
        console.log("ts -> interaction.js - sendOption 실행중...");
        const { stateMutability, functionInput, functionName } = data.value;

        vscode.postMessage({
          type: "send",
          value: {
            contractName: contractSelect.value,
            functionName: functionName,
            functionInput: functionInput,
            stateMutability: stateMutability,
            toAddress: toInput.value,
            fromPrivateKey: addressSelect.value,
            gasLimit: gasLimit.value,
            value: ethInput.value,
            unit: unitInput.value,
          }
        });
        break;
      }

      case "receipt": {  // send 반영하여 addressSelect 업데이트만 구현됨 receipt 띄워야해
        const {
          accounts,
          contractAddress,
          exectResult,
          totalGasSpent,
          amountSpent,
        } = data.value;
        const { from, to, fromBalance, toBalance } = accounts;
        const options = addressSelect.querySelectorAll("option");

        console.log("interaction.js - receipt - from --- ", from);
        console.log("interaction.js - receipt - to --- ", to);
        console.log("interaction.js - receipt - fromBalance --- ", fromBalance);
        console.log("interaction.js - receipt - toBalance --- ", toBalance);
        console.log("interaction.js - receipt - exectResult --- ", exectResult);
        console.log("interaction.js - receipt - totalGasSpent --- ", totalGasSpent);
        console.log("interaction.js - receipt - amountSpent --- ", amountSpent);


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
            returnoption.innerHTML.includes(to)
          );
          const newToOption = document.createElement("option");
          newToOption.value = toOption.value;
          newToOption.innerHTML = `${to} (${toBalance})`;
          addressSelect.replaceChild(newToOption, toOption);
        }

        if (contractAddress) {
          contractAddressText.innerHTML = contractAddress;
        }

        console.log("interaction.js - receipt - contractAddress --- ", contractAddress);

        break;
      }

      case "balanceUpdate": {
        const { from, to, fromBalance, toBalance } = data.value;
        const options = addressSelect.querySelectorAll("option");

        console.log("interaction.js - balanceUpdate - from --- ", from);
        console.log("interaction.js - balanceUpdate - to --- ", to);
        console.log("interaction.js - balanceUpdate - fromBalance --- ", fromBalance);
        console.log("interaction.js - balanceUpdate - toBalance --- ", toBalance);


        const fromOption = [...options].find((option) =>
          option.innerHTML.toLowerCase().includes(from.toLowerCase())
        );
        console.log("interaction.js - balanceUpdate - fromOption --- ", fromOption);

        const newFromOption = document.createElement("option");
        newFromOption.value = fromOption.value;
        newFromOption.innerHTML = `${from} (${fromBalance} Wei)`;
        newFromOption.selected = true;
        addressSelect.replaceChild(newFromOption, fromOption);

        if (to) {
          const toOption = [...options].find((option) =>
            option.innerHTML.toLowerCase().includes(to.toLowerCase())
          );
          const newToOption = document.createElement("option");
          newToOption.value = toOption.value;
          newToOption.innerHTML = `${to} (${toBalance} Wei)`;
          addressSelect.replaceChild(newToOption, toOption);
        }

        break;
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

