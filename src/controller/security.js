// Button -> Webview Action
(function () {
    const vscode = acquireVsCodeApi();

    const buttons = document.querySelectorAll("button[command]");

    buttons.forEach((button) => {
        button.addEventListener("click", () => {
            const command = button.getAttribute("command");
            vscode.postMessage({ type: command });
        });
    });
})();

// Similarity Toggle Action
function toggleAction() {

    const toggleButton = document.getElementById('toggle-button');
    const toggleContent = document.getElementById('toggle-content');
    const slider = toggleButton.querySelector('.slider');
    const checked = slider.classList.contains('checked');

    var computedStyle = getComputedStyle(toggleButton);
    var buttonBackgroundColor = computedStyle.getPropertyValue('--vscode-button-background');


    if (checked) {
        slider.classList.remove('checked');
    } else {
        slider.classList.add('checked');
    }

    toggleButton.addEventListener('click', function () {
        if (toggleContent.style.display === 'block') {
            toggleContent.style.display = 'none';
            slider.style.transform = 'translateX(0)';
            toggleButton.style.backgroundColor = null;
        } else {
            toggleContent.style.display = 'block';
            slider.style.transform = 'translateX(17px)';
            toggleButton.style.backgroundColor = buttonBackgroundColor;
        }
    });

}