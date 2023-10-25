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

  const BYTECODE =
    "0x608060405234801561001057600080fd5b50336000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550610215806100606000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c80638da5cb5b1461003b578063f5a1f5b414610059575b600080fd5b610043610089565b6040516100509190610154565b60405180910390f35b610073600480360381019061006e919061010d565b6100ad565b604051610080919061016f565b60405180910390f35b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b6000816000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555060019050919050565b600081359050610107816101c8565b92915050565b60006020828403121561011f57600080fd5b600061012d848285016100f8565b91505092915050565b61013f8161018a565b82525050565b61014e8161019c565b82525050565b60006020820190506101696000830184610136565b92915050565b60006020820190506101846000830184610145565b92915050565b6000610195826101a8565b9050919050565b60008115159050919050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6101d18161018a565b81146101dc57600080fd5b5056fea26469706673582212206dcd72df54690b8b5cdf0dab48c3f2bbef7b23ef7c01535142bfe4c32f0eacfc64736f6c63430008000033";

  sendInteractionForm.addEventListener("submit", (event) => {
    event.preventDefault();

    vscode.postMessage({
      type: "send",
      value: {
        fromPrivateKey: addressSelect.value,
        to: toInput.value,
        value: ethInput.value,
        gasLimit: "3000000",
        maxFeePerGas: "1000000000",
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
      type: "send",
      value: {
        callData: BYTECODE,
        fromPrivateKey: addressSelect.value,
        value: 0, // TODO
        gasLimit: "3000000",
        maxFeePerGas: "1000000000",
      },
    });
  });

  window.addEventListener("message", ({ data }) => {
    switch (data.type) {
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
    }
  });

  // function listenText() {
  //   const sampleText = "sample Text";
  //   text.push(sampleText);
  //   vscode.setState({ text: text });
  // }
})();
