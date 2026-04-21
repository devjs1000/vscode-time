import * as vscode from 'vscode';

export class TimeViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'timeView';

  constructor(private readonly _extensionUri: vscode.Uri) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this._extensionUri, 'dist')],
    };

    webviewView.webview.html = this._getHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(msg => {
      if (msg.type === 'timerComplete') {
        showTimerCompletePanel(this._extensionUri, msg.title, msg.desc);
      }
    });
  }

  private _getHtml(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview.js')
    );
    const cssUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview.css')
    );
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <title>Time</title>
</head>
<body>
  <script nonce="${nonce}">window.__cssUri__ = "${cssUri}";</script>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function showTimerCompletePanel(extensionUri: vscode.Uri, title: string, desc: string): void {
  const panel = vscode.window.createWebviewPanel(
    'timerComplete',
    `⏱ ${title}`,
    vscode.ViewColumn.Active,
    { enableScripts: false }
  );

  panel.webview.html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--vscode-font-family);
      background: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      text-align: center;
    }
    .card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 48px 40px;
      max-width: 480px;
      width: 100%;
    }
    .icon {
      font-size: 64px;
      line-height: 1;
      color: #4ec9b0;
    }
    .title {
      font-size: 28px;
      font-weight: 600;
      letter-spacing: -0.5px;
    }
    .desc {
      font-size: 15px;
      opacity: 0.65;
      line-height: 1.5;
    }
    .label {
      font-size: 13px;
      opacity: 0.4;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-top: 8px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✓</div>
    <div class="title">${escapeHtml(title)}</div>
    ${desc ? `<div class="desc">${escapeHtml(desc)}</div>` : ''}
    <div class="label">Timer Complete</div>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
