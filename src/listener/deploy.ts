import path = require('path');
import * as vscode from 'vscode';
import { Uri } from 'vscode';
import * as fs from 'fs';
import { json } from 'stream/consumers';

let deployPanel: vscode.WebviewPanel | undefined;
let htmlFilePath: vscode.Uri | undefined;
let htmlContent: string | undefined;
let abiFilePath: vscode.Uri | undefined;

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
            console.log('Deploy Result --- htmlFilePath: ', htmlFilePath);
        } catch (error) {
            console.error('Deploy Result --- Error loading HTML content: ', error);
        }

        try {
            abiFilePath = vscode.Uri.file(path.join(context.extensionPath, 'src/result/deploy_info_json_results/reentrancy.json'));
            const abiJson = await fs.promises.readFile(abiFilePath.fsPath, 'utf-8');
            const abiData = JSON.parse(abiJson);
            const abiNames: string[] = abiData.abis.map((abi: { name: string }) => abi.name);

            if (!deployPanel) {
                console.log('Not deployPanel');
                return;
            }
            deployPanel.webview.postMessage({ command: 'sendAbiNames', abiNames });
            console.log('Deploy Result --- Sent ABI names: ', abiNames);

        } catch (error) {
            console.error('Deploy Result --- Error loading ABI content: ', error);
        }

        deployPanel.onDidDispose(() => {
            deployPanel = undefined;
        });
    }



    // deployPanel.webview.onDidReceiveMessage((message: { command: string; }) => {
    //     if (message.command === 'deployClicked') {
    //         deployListener(context);
    //     }
    // });
}
