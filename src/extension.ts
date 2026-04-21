import * as vscode from 'vscode';
import { TimeViewProvider } from './TimeViewProvider';

export function activate(context: vscode.ExtensionContext): void {
  const provider = new TimeViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(TimeViewProvider.viewType, provider)
  );
}

export function deactivate(): void {}
