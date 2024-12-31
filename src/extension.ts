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
        // no json comment because it doesn't support comments
        'javascript': filePath => `// ${filePath}`,
        'typescript': filePath => `// ${filePath}`,
        'python': filePath => `# ${filePath}`,
        'html': filePath => `<!-- ${filePath} -->`,
        'svelte': filePath => `<!-- ${filePath} -->`,
        'css': filePath => `/* ${filePath} */`,
        'c': filePath => `// ${filePath}`,
        'cpp': filePath => `// ${filePath}`,
        'java': filePath => `// ${filePath}`,
        'ruby': filePath => `# ${filePath}`,
        'shellscript': filePath => `# ${filePath}`, // Note: Sometimes 'shellscript' can be 'sh'
        'php': filePath => `// ${filePath}`,
        'go': filePath => `// ${filePath}`,
        'rust': filePath => `// ${filePath}`,
        'yaml': filePath => `# ${filePath}`,
        'dart': filePath => `// ${filePath}`,
        'swift': filePath => `// ${filePath}`,
        'kotlin': filePath => `// ${filePath}`,
        'perl': filePath => `# ${filePath}`,
        'sql': filePath => `-- ${filePath}`,
        'r': filePath => `# ${filePath}`,
        'vb': filePath => `' ${filePath}`, // Sometimes 'vb' can be 'vbscript'
        'lua': filePath => `-- ${filePath}`,
        'matlab': filePath => `% ${filePath}`,
        'erlang': filePath => `% ${filePath}`,
        'haskell': filePath => `-- ${filePath}`,
        'clojure': filePath => `; ${filePath}`,
        'elixir': filePath => `# ${filePath}`,
        'fsharp': filePath => `// ${filePath}`,
        'scala': filePath => `// ${filePath}`,
        'groovy': filePath => `// ${filePath}`,
        'coffeescript': filePath => `# ${filePath}`,
        'handlebars': filePath => `{{!-- ${filePath} --}}`,
        'julia': filePath => `# ${filePath}`,
        'nim': filePath => `# ${filePath}`,
        'pascal': filePath => `{ ${filePath} }`,
        'fortran': filePath => `! ${filePath}`,
        'prolog': filePath => `% ${filePath}`,
        'scheme': filePath => `; ${filePath}`,
        'lisp': filePath => `; ${filePath}`,
        'assembly': filePath => `; ${filePath}`,
        'vbscript': filePath => `' ${filePath}`,
        'tcl': filePath => `# ${filePath}`,
        'ada': filePath => `-- ${filePath}`,
        'awk': filePath => `# ${filePath}`,
        'ocaml': filePath => `(* ${filePath} *)`,
        'verilog': filePath => `// ${filePath}`,
        'vhdl': filePath => `-- ${filePath}`,
        'plaintext': filePath => `// ${filePath}`, // Generic comment for plaintext
        'dockerfile': filePath => `# ${filePath}`,
        'powershell': filePath => `# ${filePath}`,
        'makefile': filePath => `# ${filePath}`,
        'toml': filePath => `# ${filePath}`,
        'graphql': filePath => `# ${filePath}`,
        'jsx': filePath => `// ${filePath}`,
        'tsx': filePath => `// ${filePath}`,
        'typescriptreact': filePath => `// ${filePath}`,
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
