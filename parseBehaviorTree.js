function expect(what, have) {
  return `Expecting '${what}', have '${have}'`;
}

function ParseException(message, lineNum) {
  const error = new Error(message);
  error.lineNum = lineNum;
  return error;
}

function parseBehaviorTreeFromText(buf) {
  /** @type {Node[]} nodes in the current tree branch */
  let nodes = [null];
  let indent = 0;

  function pushNode(node) {
    if (indent === 0 && nodes[indent]) {
      return `More than one root node or node '${node.name}' has wrong indentation.`;
    }
    if (indent > 0) {
      let parent = nodes[indent - 1];
      if (!parent) {
        return `${node.name} node has no parent (wrong indentation level)`;
      }
      if (parent.children) {
        parent.children.push(node);
        nodes[indent] = node;
      } else {
        return `${parent.kind} node can't have child nodes`;
      }
    } else {
      nodes[indent] = node;
    }
    indent++; // nested child on the same line should be indented
    return null; // no error to be reported
  };

  const lines = buf.split('\n');
  let lineNum = 0;
  for (let line of lines) {
    let not = false;
    indent = 0;
    lineNum++;
    for (let part of line.split(' ')) {
      if (part.length === 0) {
        continue;
      }
      let pos = 0;
      let err = null;
      while (part[pos] === '|') {
        indent++;
        pos++;
      }
      while (part[pos] === '!') {
        not = !not;
        pos++;
      }
      if (pos >= part.length) {
        continue;
      }
      switch (part[pos]) {
        case '-':
          if (part[pos + 1] != '>') {
            throw ParseException(expect('->', part[pos + 1]), lineNum);
          }
          err = pushNode(new Sequence());
          break;
        case '?':
          err = pushNode(new Fallback());
          break;
        case '=':
          let number = parseInt(part.substring(pos + 1));
          if (isNaN(number)) {
            throw ParseException(expect('number', part.substring(pos + 1)), lineNum);
          }
          err = pushNode(new Parallel(number));
          break;
        case '[':
          let actionName = part.substring(pos + 1, part.length - 1);
          err = pushNode(new Action(actionName));
          break;
        case '(':
          let conditionName = part.substring(pos + 1, part.length - 1);
          err = pushNode(new Condition(conditionName, not));
          break;
        default:
          throw ParseException(`Expecting '|', '-', '!', '[', or '(' but have '${part[pos]}'`, lineNum);
      }
      if (err) {
        throw ParseException(err, lineNum);
      }
    }
  }
  return nodes[0];
}