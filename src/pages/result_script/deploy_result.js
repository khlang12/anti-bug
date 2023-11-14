document.addEventListener("DOMContentLoaded", async function () {
    const vscode = acquireVsCodeApi();
    console.log(vscode);

    // tab action 구현
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

    // toggle action 구현
    // const toggleButton = document.getElementById("card-button");
    // const toggleContent = document.getElementById("card-content");

    // toggleButton.addEventListener("click", function () {
    //     if (toggleContent.style.display === "none" || toggleContent.style.display === "") {
    //         toggleContent.style.display = "block";
    //     } else {
    //         toggleContent.style.display = "none";
    //     }
    // });

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

    // abi function name 가져와서 화면에 출력
    window.addEventListener("message", event => {
        const message = event.data.type;
        console.log("interaction.ts -> deploy_result.ejs -  type —-- ", message);

        if (message === "compileResult" || message === "deployResult") {

            console.log("deploy_result.ejs - ", message, " 실행중…");
            const { abis, bytecodes, contract } = event.data.value;

            console.log("interaction.ts -> deploy_result.ejs - ", message, " abis --- ", abis);
            console.log("interaction.ts -> deploy_result.ejs - ", message, " bytecodes --- ", bytecodes);
            console.log("interaction.ts -> deploy_result.ejs - ", message, " contract --- ", contract);

            // test하려고 위에 뽑은 거
            const test = document.getElementById('test-abis');
            test.textContent = JSON.stringify(abis, null, 2);
            const testtest = document.getElementById('test-bytecodes');
            testtest.textContent = bytecodes.toString();

            const contractInteractionElement = document.querySelector(".contract__interaction");

            // toggle 안에 넣어야 해
            if (message === "deployResult") {

                const contractList = contract;

                contractList.forEach(contract => {
                    const contractName = contract.contractName;
                    const contractAbis = contract.newABIs;

                    console.log(contractName, contractAbis);

                    const onlyFunctionAbis = contractAbis.filter(({ type }) => type === "function");
                    const contractElement = document.createElement("div");
                    contractElement.classList.add("contract");

                    const contractTitleElement = document.createElement("div");
                    const contractNameElement = document.createElement("p");
                    const contractChevronDownButtonElement = makeChevronDownButtonElement();
                    const contractActionsWrapperElement = document.createElement("div");
                    contractActionsWrapperElement.classList.add("contract__actions");

                    contractTitleElement.classList.add("contract__title");
                    contractTitleElement.appendChild(contractNameElement);
                    contractNameElement.innerHTML = contractName;
                    contractTitleElement.appendChild(contractNameElement);

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

                });
            }
        }

    });
});

// 동적으로 script 실행할 때 worker fetch 쓰라는데 api 다시 봐봐..
// const workerSource = '/Users/kahyun/anti-bug/src/pages/result_script/deploy_result.js';
// console.log("workerSource --- ", workerSource);

// fetch(workerSource)
//     .then(result => result.blob())
//     .then(blob => {
//         const blobUrl = URL.createObjectURL(blob);
//         new Worker(blobUrl);
//     });