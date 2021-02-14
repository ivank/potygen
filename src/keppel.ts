import { Ignore, All, Any, Plus, Optional, Node, Y } from '@ikerin/rd-parse';

const Identifier = /^([a-zA-Z][a-zA-Z0-9_-]*)/;
const Text = Any(/^'([^']*)'/, /^"([^"]*)"/);

// Ignore line comments and all whitespace
export const Keppel = Ignore(
  /^\s+|^\/\/[^\r\n]*\n/,
  Y((ThisGrammar) => {
    const TagAttr = Node(All(Identifier, '=', Text), ([name, value]) => ({ name, value }));
    const TagAttrBlock = Node(All('(', TagAttr, Optional(Plus(All(',', TagAttr))), ')'), (stack) => ({
      attributes: stack,
    }));
    const TagId = Node(All('#', Identifier), ([id]) => ({ id }));
    const TagClasses = Node(Plus(All('.', Identifier)), (stack) => ({ classes: stack }));

    const TagHeader = Node(
      All(Identifier, Optional(TagAttrBlock), Optional(TagId), Optional(TagClasses)),
      ([name, ...rest]) => rest.reduce((acc, e) => Object.assign(acc, e), { name }),
    );

    const TagBody = Node(All('[', ThisGrammar, ']'), ([body]) => ({ body }));

    const Tag = Node(All(TagHeader, Optional(TagBody)), ([header, body]) =>
      Object.assign({ type: 'tag', ...header }, body || {}),
    );

    const FreeText = Node(Text, ([value]) => ({ type: 'free text', value }));

    return Node(Plus(Any(Tag, FreeText)), (stack) => stack);
  }),
);
