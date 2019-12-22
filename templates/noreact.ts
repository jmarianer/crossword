import * as flatten from 'array-flatten';

// tslint:disable:max-classes-per-file
// tslint:disable:no-namespace
declare global {
  namespace JSX {
    class Element {
      public class?: string;
      public id?: string;
      public dir?: string;
      public title?: string;
    }

    class IntrinsicElements {
      public link: { class?: string; rel: string; href: string };
      public script: { class?: string; src: string };
      public a: { class?: string; href: string };
      public form: { class?: string; id?: string; action: string; method: string };
      public textarea: { class?: string; rows: string; cols: string; name: string };
      public input: { class?: string; type?: string; name?: string; value?: string };
      public th: { class?: string, colspan?: string };
      public td: { class?: string, colspan?: string };
      [tag: string]: Element;
    }
  }
}

// Wish I could say simply '...content: flatten.FlatArray<string>', but ts doesn't like that.
export function createElement(name: string, props: any, ...content: Array<string|flatten.FlatArray<string>>) {
  if (name === 'br') {  // annoying special case hack :-(
    return '<br>';
  }
  let propsString = '';
  if (props) {
    for (let key in props) {
      if (props.hasOwnProperty(key)) {
        propsString += ` ${key}='${props[key]}'`;
      }
    }
  }
  return `<${name}${propsString}>${flatten.flatten(content).join('')}</${name}>`;
}
