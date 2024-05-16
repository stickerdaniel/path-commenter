# PathCommenter

PathCommenter is a Visual Studio Code extension that automatically adds a file path comment at the top of each file if not present. It also provides a command to generate a file structure tree and copy it to the clipboard.

This is particularly useful when working with ChatGPT or other AI-based code assistants. By automatically adding file path comments and generating file structure trees, it provides context about the file's location within the project. This context helps ChatGPT better understand the structure and organization of your project when you copy and paste code for assistance or debugging.

https://marketplace.visualstudio.com/items?itemName=CreatasyStudio.path-commenter

## Features

- **Add File Path Comment**: Automatically adds a file path comment at the top of each file when the file is saved.
- **Generate File Tree**: Generates a file structure tree from the open folder (or a specified subfolder) and copies it to the clipboard.

## Commands

- `path-commenter.addFilePathComment`: Adds a file path comment to the top of the current file.
- `path-commenter.generateFileTree`: Generates a file structure tree and copies it to the clipboard.

## Usage

1. **Add File Path Comment**: This command runs automatically when you save a file. You can also trigger it manually from the Command Palette (`Ctrl+Shift+P`) by typing "Add File Path Comment".
2. **Generate File Tree**: Run this command from the Command Palette (`Ctrl+Shift+P`) by typing "Generate File Tree". Optionally, specify a subfolder to generate the tree from that subfolder.

## Installation

1. Download and install the extension from the Visual Studio Code Marketplace.
2. Reload VS Code to activate the extension.

## Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

## License

MIT
