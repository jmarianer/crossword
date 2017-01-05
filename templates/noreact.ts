import * as flatten from 'array-flatten';
declare global {
  namespace JSX {
    class Element {
      class?: string;
      id?: string;
      dir?: string;
      title?: string;
    }
    class IntrinsicElements {
      link: { rel: string; href: string };
      script: { src: string };
      a: { class?: string; href: string };
      form: { class?: string; id?: string; action: string; method: string };
      textarea: { rows: string; cols: string; name: string };
      input: { class?: string; type?: string; name?: string; value?: string };
      [tag: string]: Element;
      th: { class?: string, colspan?: string };
      td: { class?: string, colspan?: string };
    }
  }
}

// Wish I could say simply "...content: flatten.NestedArray<string>", but ts doesn't like that.
export function createElement(name: string, props: any, ...content: (string|flatten.NestedArray<string>)[]) {
  if (name == 'br') {  // annoying special case hack :-(
    return '<br>';
  }
  let propsString = '';
  if (props) {
    for (let key in props) {
      propsString += ` ${key}="${props[key]}"`;
    }
  }
  return `<${name}${propsString}>${flatten(content).join("")}</${name}>`;
}
