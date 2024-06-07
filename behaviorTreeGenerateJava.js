function generateJava(tree, team_number, tree_name) {
  let result = `/* Tree ${tree_name} for ${team_number} generated by http://behaviortrees.ftcteams.com */`
  indent = 0;
  result += `\npackage org.firstinspires.ftc.teamcode.ftc${team_number}.BehaviorTrees.Trees;`

  result += "\n" + generateImports(tree, team_number);

  result += `\n\n\npublic class ${tree_name} {`;
  result += '\n   public static Node root(){';
  result += generateNode(2, tree.root, true);
  result += "\n   }\n}"
  result += "\n\n/* TREE"
  result += generateTree(0, tree.root);
  result += "\n */";
  return result;
}
function generateImports(tree, team_number) {
  let result = `\nimport org.firstinspires.ftc.teamcode.ftc${team_number}.BehaviorTrees.Node`;
  for (let node of tree.nodes) {
    result += `\nimport org.firstinspires.ftc.teamcode.ftc${team_number}.BehaviorTrees.${node[0]}`;
  }
  for (let node of tree.actions) {
    result += `\nimport org.firstinspires.ftc.teamcode.ftc${team_number}.BehaviorTrees.Actions.${node[0]}`;
  }
  for (let node of tree.conditions) {
    result += `\nimport org.firstinspires.ftc.teamcode.ftc${team_number}.BehaviorTrees.Conditions.${node[0]}`;
  }
  return result;
}

function generateNode(indent, node, root = false) {
  let result = "\n" + " ".repeat(indent * 3);
  let firstChild = true;
  if (root) {
    result += "return ";
  }
  if (node instanceof Action) {
    result += `new ${node.name}()`;
  } else if (node instanceof Condition) {
    result += `new ${node.name}()`;
  } else if (node instanceof Sequence) {
    result += `new Sequence(`;
    for (let child of node.children) {
      if (!firstChild) {
        result += ",";
      } else {
        firstChild = false;
      }
      result += generateNode(indent + 1, child);
    }
    result += ")";
  } else if (node instanceof Parallel) {
    result += `new Parallel(${node.children.length},`;
    for (let child of node.children) {
      if (!firstChild) {
        result += ",";
      } else {
        firstChild = false;
      }
      result += generateNode(indent + 1, child);
    }
    result += ")";
  } else if (node instanceof Fallback) {
    result += "new Fallback(";
    for (let child of node.children) {
      if (!firstChild) {
        result += ",";
      } else {
        firstChild = false;
      }
      result += generateNode(indent + 1, child);
    }
    result += ")";
  }
  if (root) {
    result += ";";
  }

  return result;
}

function generateTree(indent, node) {
  let result = "\n" + "|  ".repeat(indent);

  if (node instanceof Action) {
    result += `[${node.name}]`;
  } else if (node instanceof Condition) {
    result += `(${node.name})`;
  } else if (node instanceof Sequence) {
    result += `->`;
    for (let child of node.children) {
      result += generateTree(indent + 1, child);
    }
  } else if (node instanceof Parallel) {
    result += `=${node.children.length}`;
    for (let child of node.children) {
      result += generateTree(indent + 1, child);
    }
  } else if (node instanceof Fallback) {
    result += "?";
    for (let child of node.children) {
      result += generateTree(indent + 1, child);
    }
  }
  return result;
}

/*
public static Node root(){
        return new Parallel(5,
                new UpdateIntake(),
                new ResetGyro(),
                new DriveFieldRelative(),
                new UpdateClimber()

        );
    }
*/