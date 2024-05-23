import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as micromatch from 'micromatch';

export function activate(context: vscode.ExtensionContext) {
    let addFilePathCommentCommand = vscode.commands.registerCommand('path-commenter.addFilePathComment', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return; // No open text editor
        }

        const document = editor.document;
        const filePath = path.relative(vscode.workspace.rootPath || '', document.fileName);

        // Get ignore patterns from configuration
        const ignorePatterns: string[] = vscode.workspace.getConfiguration('pathCommenter').get('ignorePatterns', []);

        // Check if the file should be ignored
        if (micromatch.isMatch(filePath, ignorePatterns)) {
            return;
        }

        const comment = getCommentSyntax(document.languageId, filePath);

        if (!comment) {
            vscode.window.showErrorMessage('Unsupported file type for adding file path comment.');
            return;
        }

        const firstLine = document.lineAt(0);
        if (firstLine.text !== comment) {
            editor.edit(editBuilder => {
                editBuilder.insert(new vscode.Position(0, 0), `${comment}\n`);
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

        // Get ignore patterns from configuration
        const ignorePatterns: string[] = vscode.workspace.getConfiguration('pathCommenter').get('ignorePatterns', []);
        const fileTree = generateFileTree(rootPath, '', ignorePatterns);
        await vscode.env.clipboard.writeText(fileTree);
        vscode.window.showInformationMessage('File structure copied to clipboard');
    });

    context.subscriptions.push(addFilePathCommentCommand, generateFileTreeCommand);

    vscode.workspace.onWillSaveTextDocument(event => {
        const document = event.document;
        const filePath = path.relative(vscode.workspace.rootPath || '', document.fileName);

        // Get ignore patterns from configuration
        const ignorePatterns: string[] = vscode.workspace.getConfiguration('pathCommenter').get('ignorePatterns', []);

        // Check if the file should be ignored
        if (micromatch.isMatch(filePath, ignorePatterns)) {
            return;
        }

        const comment = getCommentSyntax(document.languageId, filePath);

        if (!comment) {
            return;
        }

        const firstLine = document.lineAt(0);
        if (firstLine.text !== comment) {
            const edit = new vscode.WorkspaceEdit();
            edit.insert(document.uri, new vscode.Position(0, 0), `${comment}\n`);
            vscode.workspace.applyEdit(edit);
        }
    });
}

function getCommentSyntax(languageId: string, filePath: string): string | null {
    const commentMap: { [key: string]: (filePath: string) => string } = {
        'javascript': filePath => `// ${filePath}`,
        'typescript': filePath => `// ${filePath}`,
        'python': filePath => `# ${filePath}`,
        'html': filePath => `<!-- ${filePath} -->`,
        'css': filePath => `/* ${filePath} */`,
        'c': filePath => `// ${filePath}`,
        'cpp': filePath => `// ${filePath}`,
        'java': filePath => `// ${filePath}`,
        'ruby': filePath => `# ${filePath}`,
        'shellscript': filePath => `# ${filePath}`,
        'php': filePath => `// ${filePath}`,
        'go': filePath => `// ${filePath}`,
        'rust': filePath => `// ${filePath}`,
        'json': filePath => `// ${filePath}`,
        'yaml': filePath => `# ${filePath}`,
        'dart': filePath => `// ${filePath}`,
    };

    return commentMap[languageId] ? commentMap[languageId](filePath) : null;
}


function generateFileTree(dir: string, prefix: string = '', ignorePatterns: string[] = []): string {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    let tree = '';

    items.forEach((item, index) => {
        if (micromatch.isMatch(item.name, ignorePatterns)) {
            return;
        }

        const isLast = index === items.length - 1;
        const newPrefix = prefix + (isLast ? '└── ' : '├── ');
        const nextPrefix = prefix + (isLast ? '    ' : '│   ');

        tree += `${newPrefix}${item.name}\n`;

        if (item.isDirectory()) {
            tree += generateFileTree(path.join(dir, item.name), nextPrefix, ignorePatterns);
        }
    });

    return tree;
}

export function deactivate() {}
