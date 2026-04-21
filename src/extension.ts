import * as vscode from 'vscode';
import { TimeViewProvider, startClock } from './TimeViewProvider';

export function activate(context: vscode.ExtensionContext): void {
  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBar.show();
  context.subscriptions.push(statusBar);

  const clockRef = { stop: () => {} };
  startClock(statusBar, clockRef);

  const provider = new TimeViewProvider(context.extensionUri, statusBar, clockRef);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(TimeViewProvider.viewType, provider, {
      webviewOptions: { retainContextWhenHidden: true },
    })
  );
}

export function deactivate(): void {}
