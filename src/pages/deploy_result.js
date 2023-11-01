// HTML이 열리면 실행되는 Listener 함수
document.addEventListener("DOMContentLoaded", async function () {

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
    const toggleButton = document.getElementById("card-button");
    const toggleContent = document.getElementById("card-content");

    toggleButton.addEventListener("click", function () {
        if (toggleContent.style.display === "none" || toggleContent.style.display === "") {
            toggleContent.style.display = "block";
        } else {
            toggleContent.style.display = "none";
        }
    });

    // abi 경로 설정
    const abiFilePath = '/src/result/deploy_info_json_results/reentrancy.json';
    const test = document.getElementById('function-test');
    test.textContent = abiFilePath.toString();


    try {
        const response = await fetch(abiFilePath);
        if (response.ok) {
            const abiData = await response.json();
            const functionNames = abiData.map((item) => item.name);

            const functionList = document.getElementById('function-names');
            if (functionList) {
                functionList.textContent = functionNames.join(', ');
            }
        } else {
            throw new Error('Failed to fetch ABI data');
        }
    } catch (error) {
        const functionList = document.getElementById('function-names');
        functionList.textContent = error;
    }
});
