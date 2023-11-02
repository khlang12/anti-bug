"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode = require("vscode");
const view_provider_1 = require("./provider/view-provider");
const config_1 = require("./util/config");
const node_1 = require("./blockchain/node");
const interaction_1 = require("./listener/interaction");
const deploy_1 = require("./listener/deploy");
const security_1 = require("./listener/security");
const testcode_1 = require("./listener/testcode");
async function activate(context) {
    const antibugNode = await node_1.default.create();
    const primaryPanelInteractionProvider = new view_provider_1.ViewProvider({
        extensionUri: context.extensionUri,
        viewType: "antibug.primaryPanel.interaction",
        cssFile: "custom.css",
        scriptFile: "interaction.js",
        htmlFile: "interaction.ejs",
        initialData: {
            accounts: config_1.DEFAULT_ACCOUNTS,
        },
    });
    const bindedInteractionListener = interaction_1.default.bind(primaryPanelInteractionProvider, antibugNode);
    primaryPanelInteractionProvider.setListner(bindedInteractionListener);
    // Deploy Sidebar Webview
    const primaryPanelDeployProvider = new view_provider_1.ViewProvider({
        extensionUri: context.extensionUri,
        viewType: "antibug.deploy",
        cssFile: "custom.css",
        scriptFile: "deploy.js",
        htmlFile: "deploy.ejs",
    });
    primaryPanelDeployProvider.setListner((data) => {
        (0, deploy_1.default)(context);
    });
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(primaryPanelDeployProvider.getViewType(), primaryPanelDeployProvider));
    // Security Analysis Sidebar Webview
    const primaryPanelSecurityProvider = new view_provider_1.ViewProvider({
        extensionUri: context.extensionUri,
        viewType: "antibug.security",
        cssFile: "custom.css",
        scriptFile: "security.js",
        htmlFile: "security.ejs",
    });
    primaryPanelSecurityProvider.setListner((data) => {
        (0, security_1.default)(context, data);
    });
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(primaryPanelSecurityProvider.getViewType(), primaryPanelSecurityProvider));
    // Testcode Sidebar Webview
    const primaryPanelTestcodeProvider = new view_provider_1.ViewProvider({
        extensionUri: context.extensionUri,
        viewType: "antibug.testcode",
        cssFile: "custom.css",
        scriptFile: "testcode.js",
        htmlFile: "testcode.ejs",
    });
    primaryPanelTestcodeProvider.setListner(testcode_1.default);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(primaryPanelTestcodeProvider.getViewType(), primaryPanelTestcodeProvider));
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(primaryPanelInteractionProvider.getViewType(), primaryPanelInteractionProvider));
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map