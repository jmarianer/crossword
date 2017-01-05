import * as React from './noreact';

export = (script: string, l10n: any, ...body: JSX.Element[]) =>
  <html>
    <head>
      <link rel="stylesheet" href="/style/style.css" />
      <script src={ "/js/" + script } />
    </head>

    <body dir={ l10n.direction }>
      <h1>{ l10n.title }</h1>
      { body }
    </body>
  </html>
