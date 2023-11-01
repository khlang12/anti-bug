import path = require('path');
import * as vscode from 'vscode';
import { Uri } from 'vscode';
import * as fs from 'fs';
import { json } from 'stream/consumers';

let deployPanel: vscode.WebviewPanel | undefined;
let htmlFilePath: vscode.Uri | undefined;
let htmlContent: string | undefined;

export default async function deployListener(context: vscode.ExtensionContext) {
    vscode.window.showInformationMessage('deployListener 실행됨!');

    // 우측 패널에 deploy_result.ejs 열기
    if (deployPanel) {
        deployPanel.reveal(vscode.ViewColumn.Two);
    } else {
        deployPanel = vscode.window.createWebviewPanel(
            'deployResultView',
            'Deploy Result View',
            vscode.ViewColumn.Two,
            { enableScripts: true }
        );

        try {
            htmlFilePath = vscode.Uri.file(path.join(context.extensionPath, 'src/pages/deploy_result.ejs'));
            htmlContent = await fs.promises.readFile(htmlFilePath.fsPath, 'utf-8');
            deployPanel.webview.html = htmlContent;
        } catch (error) {
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

