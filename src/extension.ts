import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
    let addFilePathCommentCommand = vscode.commands.registerCommand('path-commenter.addFilePathComment', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return; // No open text editor
        }

        const document = editor.document;
        const firstLine = document.lineAt(0);
        const filePathComment = `// ${path.relative(vscode.workspace.rootPath || '', document.fileName)}`;

        // Check if the first line is already the file path comment
        if (firstLine.text !== filePathComment) {
            editor.edit(editBuilder => {
                editBuilder.insert(new vscode.Position(0, 0), `${filePathComment}\n`);
            });
        }
    });

    let generateFileTreeCommand = vscode.commands.registerCommand('path-commenter.generateFileTree', async (param) => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No open folder found');
            return;
        }

        const rootPath = param ? path.join(workspaceFolders[0].uri.fsPath, param) : workspaceFolders[0].uri.fsPath;
        
        if (!fs.existsSync(rootPath)) {
            vscode.window.showErrorMessage(`Path does not exist: ${rootPath}`);
            return;
        }

        const fileTree = generateFileTree(rootPath);
        await vscode.env.clipboard.writeText(fileTree);
        vscode.window.showInformationMessage('File structure copied to clipboard');
    });

    context.subscriptions.push(addFilePathCommentCommand, generateFileTreeCommand);

    vscode.workspace.onWillSaveTextDocument(event => {
        const document = event.document;
        const firstLine = document.lineAt(0);
        const filePathComment = `// ${path.relative(vscode.workspace.rootPath || '', document.fileName)}`;

        if (firstLine.text !== filePathComment) {
            const edit = new vscode.WorkspaceEdit();
            edit.insert(document.uri, new vscode.Position(0, 0), `${filePathComment}\n`);
            return vscode.workspace.applyEdit(edit);
        }
    });
}

function generateFileTree(dir: string, prefix: string = ''): string {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    let tree = '';

    items.forEach((item, index) => {
        const isLast = index === items.length - 1;
        const newPrefix = prefix + (isLast ? '└── ' : '├── ');
        const nextPrefix = prefix + (isLast ? '    ' : '│   ');

        tree += `${newPrefix}${item.name}\n`;

        if (item.isDirectory()) {
            tree += generateFileTree(path.join(dir, item.name), nextPrefix);
        }
    });

    return tree;
}

export function deactivate() {}
