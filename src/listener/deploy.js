"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode = require("vscode");
const fs = require("fs");
let deployPanel;
let htmlFilePath;
let htmlContent;
async function deployListener(context) {
    vscode.window.showInformationMessage('deployListener 실행됨!');
    if (deployPanel) {
        deployPanel.reveal(vscode.ViewColumn.Two);
    }
    else {
        deployPanel = vscode.window.createWebviewPanel('deployResultView', 'Deploy Result View', vscode.ViewColumn.Two, { enableScripts: true });
        try {
            htmlFilePath = vscode.Uri.file(path.join(context.extensionPath, 'src/pages/deploy.html'));
            htmlContent = await fs.promises.readFile(htmlFilePath.fsPath, 'utf-8');
            deployPanel.webview.html = htmlContent;
        }
        catch (error) {
            console.error('Error loading HTML content: ', error);
        }
        deployPanel.onDidDispose(() => {
            deployPanel = undefined;
        });
    }
    deployPanel.webview.onDidReceiveMessage((message) => {
        if (message.command === 'deployClicked') {
            deployListener(context);
        }
    });
}
exports.default = deployListener;
//# sourceMappingURL=deploy.js.map