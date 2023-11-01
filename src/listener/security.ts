import path = require('path');
import * as vscode from 'vscode';
import * as fs from 'fs';

const markdownIt = require('markdown-it');
const md = markdownIt();

let securityPanel: vscode.WebviewPanel | undefined;
let auditreportPanel: vscode.WebviewPanel | undefined;
let htmlFilePath: vscode.Uri | undefined;
let htmlContent: string | undefined;


export default async function securityListener(
    context: vscode.ExtensionContext,
    data: { type: string }
) {
    vscode.window.showInformationMessage('securityListener 실행됨!');

    switch (data.type) {
        case "analysis": {
            vscode.window.showInformationMessage('securityListener의 analysis 실행됨!');
            if (securityPanel) {
                securityPanel.reveal(vscode.ViewColumn.Two);
            } else {
                securityPanel = vscode.window.createWebviewPanel(
                    'securityResultView',
                    'Security Result View',
                    vscode.ViewColumn.Two,
                    { enableScripts: true }
                );

                try {
                    htmlFilePath = vscode.Uri.file(path.join(context.extensionPath, 'src/pages/security_result.ejs'));
                    htmlContent = await fs.promises.readFile(htmlFilePath.fsPath, 'utf-8');
                    securityPanel.webview.html = htmlContent;
                } catch (error) {
                    console.error('Error loading HTML content: ', error);
                }

                securityPanel.onDidDispose(() => {
                    securityPanel = undefined;
                });
            }

            securityPanel.webview.onDidReceiveMessage((message) => {
                if (message.command === 'analysisClicked') {
                    securityListener(context, { type: "analysis" });
                }
            });
            break;
        }
        case "auditreport": {
            vscode.window.showInformationMessage('securityListener의 auditreport 실행됨!');
            if (auditreportPanel) {
                auditreportPanel.reveal(vscode.ViewColumn.Two);
            } else {
                auditreportPanel = vscode.window.createWebviewPanel(
                    'auditreportView',
                    'Audit Report View',
                    vscode.ViewColumn.Two,
                    { enableScripts: true }
                );

                try {
                    htmlFilePath = vscode.Uri.file(path.join(context.extensionPath, 'src/pages/auditreport.md'));
                    htmlContent = await fs.readFileSync(htmlFilePath.fsPath, 'utf-8');
                    auditreportPanel.webview.html = md.render(htmlContent);
                } catch (error) {
                    console.error('Error loading HTML content: ', error);
                }

                auditreportPanel.onDidDispose(() => {
                    auditreportPanel = undefined;
                });
            }

            auditreportPanel.webview.onDidReceiveMessage((message) => {
                if (message.command === 'auditreportClicked') {
                    securityListener(context, { type: "auditreport" });
                }
            });
            break;
        }
        default: {
            vscode.window.showInformationMessage('securityListener의 default 실행됨! + ', data.type);
        }
            break;
    }


}