document.addEventListener("DOMContentLoaded", function () {

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
});

// toggle action 구현
document.addEventListener("DOMContentLoaded", function () {
    function toggleElement(element) {
        if (element.style.display === "none" || element.style.display === "") {
            element.style.display = "block";
        } else {
            element.style.display = "none";
        }
    }

    const buttons = [
        "toggle-contract__button",
        "toggle-callGraph__button",
        "toggle-abi__button",
        "toggle-evmBytecode__button",
        "toggle-storage__button",
        "toggle-blacklist__button",
    ];

    buttons.forEach(function (buttonId) {
        const button = document.getElementById(buttonId);
        const contentId = buttonId.replace("button", "content");
        const content = document.getElementById(contentId);

        button.addEventListener("click", function () {
            toggleElement(content);
        });
    });
});
