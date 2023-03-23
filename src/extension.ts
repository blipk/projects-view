"use strict";

import * as vscode from "vscode";
import { posix } from "path";
import { getWebviewContent } from "./webview";

export async function activate(context: vscode.ExtensionContext) {
	const config = vscode.workspace.getConfiguration();

	vscode.commands.registerCommand("projects.showProjects", async function() {
        const projectFolder = config.get("projects.projectFolder");

        if (!projectFolder) {
            vscode.window.showErrorMessage("Please specify the project folder in the extension settings");
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            "projectFiles",
            "Project Files",
            vscode.ViewColumn.One,
            {
				enableScripts: true
			}
        );

        panel.webview.html = await getWebviewContent(projectFolder as string);

		panel.webview.onDidReceiveMessage((message) => {
			if (message.command === "openFolder") {
			const uri = vscode.Uri.file(posix.normalize(message.folderPath));
			vscode.commands.executeCommand("vscode.openFolder", uri, false);
			} else if (message.command === "openSettings") {
                vscode.commands.executeCommand("workbench.action.openSettings", "projects.projectFolder");
            }
		});
    });

    // context.subscriptions.push(disposable);
	if (typeof vscode.workspace.name === "undefined") {
		await vscode.commands.executeCommand("projects.showProjects");
	}
}
