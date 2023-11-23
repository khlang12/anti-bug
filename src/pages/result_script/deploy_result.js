document.addEventListener("DOMContentLoaded", async function () {
    const vscode = acquireVsCodeApi();

    // tab action
    const tabLinks = document.querySelectorAll(".tab-link");
    const tabContents = document.querySelectorAll(".tab-content");

    tabLinks.forEach(function (link) {
        link.addEventListener("click", function () {
            const tabId = this.getAttribute("data-tab");

            tabLinks.forEach(function (tabLink) {
                tabLink.classList.remove("current");
            });
            tabContents.forEach(function (tabContent) {
                tabContent.classList.remove("current");
            });

            this.classList.add("current");
            document.getElementById(tabId).classList.add("current");
        });
    });

    // toggle action
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

    // delete action
    function makeDeleteButtonElement() {
        const deleteButtonElement = document.createElement("div");
        const deleteIconElement = document.createElement("i");
        deleteIconElement.classList.add(
            "fas",
            "fa-times",
            "delete-action"
        );
        deleteButtonElement.style.cursor = "pointer";

        deleteButtonElement.appendChild(deleteIconElement);
        return deleteButtonElement;
    }

    // make multi argument
    function makeMultiArgsElements(inputs) {
        const argsElements = inputs.map(({ name, type }) => {
            const argElement = document.createElement("div");
            argElement.classList.add("argument");

            const inputNameElement = document.createElement("div");
            inputNameElement.classList.add("argument__name");
            inputNameElement.innerHTML = `${name}`;

            const inputElement = document.createElement("input");
            inputElement.placeholder = `${type} `;

            argElement.appendChild(inputNameElement);
            argElement.appendChild(inputElement);

            return argElement;
        });

        return argsElements;
    }

    // contract interaction
    window.addEventListener("message", event => {
        const message = event.data.type;
        console.log("interaction.ts -> deploy_result.ejs -  type —-- ", message);

        if (message === "deployResult") {

            console.log("deploy_result.ejs - ", message, " 실행중…");
            const { solFile, abis, bytecodes, contract, contractAddress } = event.data.value;

            console.log("interaction.ts -> deploy_result.ejs - ", message, " solFile --- ", solFile);
            console.log("interaction.ts -> deploy_result.ejs - ", message, " abis --- ", abis);
            console.log("interaction.ts -> deploy_result.ejs - ", message, " bytecodes --- ", bytecodes);
            console.log("interaction.ts -> deploy_result.ejs - ", message, " contract --- ", contract);
            console.log("interaction.ts -> deploy_result.ejs - ", message, " contractAddress --- ", contractAddress);

            // test하려고 위에 뽑은 거
            // const test = document.getElementById('test-abis');
            // test.textContent = JSON.stringify(abis, null, 2);
            // const testtest = document.getElementById('test-bytecodes');
            // testtest.textContent = bytecodes.toString();

            const contractInteractionElements = document.querySelectorAll(".contract__interaction");

            contractInteractionElements.forEach((contractInteractionElement) => {
                const contractList = contract;
                const solFileName = solFile.split('/').pop();

                contractList.forEach((contract) => {
                    const contractName = contract.contractName;
                    const contractAbis = contract.newABIs;

                    console.log("deploy_result.ejs - ", contractName, contractAbis);

                    const onlyFunctionAbis = contractAbis.filter(({ type }) => type === "function");
                    const contractElement = document.createElement("div");
                    contractElement.classList.add("contract");

                    const contractTitleElement = document.createElement("div");
                    contractTitleElement.classList.add("contract__title");

                    const contractNameAddressElement = document.createElement("div");
                    contractNameAddressElement.classList.add("contract__name-address");
                    const contractNameElement = document.createElement("p");
                    contractNameElement.classList.add("contract__name");
                    const contractAddressElement = document.createElement("p");
                    contractAddressElement.classList.add("contract__address");

                    const contractChevronDownButtonElement = makeChevronDownButtonElement();
                    contractChevronDownButtonElement.classList.add("contract__icon");
                    const deleteButtonElement = makeDeleteButtonElement();
                    deleteButtonElement.classList.add("contract__icon");
                    const contractActionsWrapperElement = document.createElement("div");
                    contractActionsWrapperElement.classList.add("contract__actions");

                    contractElement.appendChild(contractTitleElement);
                    contractTitleElement.appendChild(deleteButtonElement);

                    contractNameElement.innerHTML = `${contractName} - ${solFileName}`;
                    contractAddressElement.innerHTML = `${contractAddress}`;
                    contractNameAddressElement.appendChild(contractNameElement);
                    contractNameAddressElement.appendChild(contractAddressElement);
                    
                    contractTitleElement.appendChild(contractNameAddressElement);
                    contractTitleElement.appendChild(contractChevronDownButtonElement);

                    contractChevronDownButtonElement.addEventListener("click", () => {
                        contractActionsWrapperElement.classList.toggle("hidden");
                    });

                    deleteButtonElement.addEventListener("click", () => {
                        contractElement.classList.toggle("hidden");
                    });

                    const functionElements = onlyFunctionAbis.map(
                        ({ name, inputs, stateMutability, type, signature }) => {
                            const functionElement = document.createElement("div");
                            functionElement.classList.add("function");

                            const functionActionSingleElement = document.createElement("div");
                            functionActionSingleElement.classList.add("function__action-single");

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
                                inputElement.placeholder = `${inputs[0].type}`;
                                argsElement = [inputElement];
                                functionActionSingleElement.appendChild(inputElement);
                            }

                            if (inputs.length > 1) {
                                const chevronDownButtonElement = makeChevronDownButtonElement();
                                chevronDownButtonElement.classList.add("contract__icon");
                                chevronDownButtonElement.addEventListener("click", () => {
                                    functionActionMultiElement.classList.toggle("hidden");
                                });
                                functionActionSingleElement.appendChild(chevronDownButtonElement);

                                argsElement = makeMultiArgsElements(inputs);
                                functionActionMultiElement.replaceChildren(...argsElement);
                            }

                            // function button : stateMutability (call, transact)
                            actionElement.addEventListener("click", () => {
                                const args = argsElement.map((argElement) => argElement.childNodes[1].value);

                                // 여기서 argsElement를 하나도 못 받아오는데?
                                console.log("deploy_result.ejs - function button click - argsElement ---", argsElement);
                                console.log("deploy_result.ejs - function button click - args ---", args);
                                console.log("deploy_result.ejs - function button click - contractAddressText.innerHTML ---", contractAddressText.innerHTML);

                                const isPayable = actionElement.classList.contains('payable');
                                const isNonpayable = actionElement.classList.contains('nonpayable');

                                if (isPayable || isNonpayable) {
                                    const transactionObject = {
                                        to: contractAddressText.innerHTML,
                                        from: addressSelect.value,
                                        value: ethInput.value, // 이더 전송할 경우에만 설정
                                    };

                                    if (isPayable) {
                                        // payable function
                                        contract.methods[name](...args).send(transactionObject);
                                    } else if (isNonpayable) {
                                        // nonpayable function
                                        contract.methods[name](...args).send(transactionObject);
                                    }
                                } else {
                                    // pure, view function
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
                                    const result = contract.methods[name](...args).call();
                                    console.log("Result of the view/pure function:", result);
                                }
                            });

                            functionElement.replaceChildren(functionActionSingleElement);
                            functionElement.appendChild(functionActionMultiElement);

                            return functionElement;
                        }
                    );
                    contractActionsWrapperElement.replaceChildren(...functionElements);

                    contractElement.appendChild(contractTitleElement);
                    contractElement.appendChild(contractActionsWrapperElement);

                    contractInteractionElement.prepend(contractElement);
                });
            });


        }

    });
});