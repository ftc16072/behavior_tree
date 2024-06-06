const NodeType = {
  FALLBACK: 1,
  SEQUENCE: 2,
  PARALLEL: 3,
  ACTION: 4,
  CONDITION: 5
}

const NodeStatus = {
  SUCCESS: 1,
  FAILED: 2,
  RUNNING: 3
}
class Node {
  constructor(name, nodeType, children = undefined) {
    this.name = name
    this.nodeType = nodeType
    this.children = children || null;
    this._active = false
    this.nodeStatus = NodeStatus.FAILED;
  }
  status() {
    return this.nodeStatus;
  }
  setStatus(status) {
    this.nodeStatus = status;
  }

  active() {
    return this._active;
  }

  setActive(isActive) {
    this._active = isActive;
  }

  tick() {
    this.setActive(true);
    return this.status();
  }

  deactivate() {
    this.setActive(false);
    if (this.children) {
      for (let i = 0; i < this.children.length; i++) {
        this.children[i].deactivate();
      }
    }
  }
}

class Fallback extends Node {
  constructor(children = []) {
    super('?', NodeType.FALLBACK, children || []);
  }
  tick() {
    this.setActive(true);
    for (let i = 0; i < this.children.length; i++) {
      let s = this.children[i].tick();
      this.setStatus(s);
      if (s == NodeStatus.RUNNING || s == NodeStatus.SUCCESS) {
        return this.status();
      }
    }
    this.setStatus(NodeStatus.FAILED);
    return this.status();
  }
}

class Sequence extends Node {
  constructor(children = []) {
    super('\u2192', NodeType.SEQUENCE, children);
  }
  tick() {
    this.setActive(true);
    for (let i = 0; i < this.children.length; i++) {
      let s = this.children[i].tick();
      this.setStatus(s);
      if (s == NodeStatus.RUNNING || s == NodeStatus.FAILED) {
        return this.status();
      }
    }
    this.setStatus(NodeStatus.SUCCESS);
    return this.status();
  }
}

class Parallel extends Node {
  constructor(successCount, children = []) {
    super('\u21C9', PARALLEL, children || []);
    this.successCount = successCount;
  }
  tick() {
    this.setActive(true);

    let succeeded = 0,
      failed = 0,
      kidCount = this.children.length;

    for (let i = 0; i < this.children.length; i++) {
      let s = this.children[i].tick();
      if (s == NodeStatus.SUCCESS) {
        succeeded++;
      }
      if (s == NodeStatus.FAILED) {
        failed++;
      }
    }

    let st = NodeStatus.RUNNING;
    if (succeeded >= this.successCount) {
      st = NodeStatus.SUCCESS;
    } else if (failed > kidCount - this.successCount) {
      st = NodeStatus.FAILED;
    }
    this.setStatus(st);
    return st;
  }
}
class Action extends Node {
  constructor(name, status = NodeStatus.RUNNING) {
    super(name, NodeType.ACTION);
    this.setStatus(status);
  }
}
class Condition extends Node {
  constructor(name, hasNot = false, status = NodeStatus.FAILED) {
    super(name, NodeType.CONDITION);
    this.hasNot = hasNot;
    this.setStatus(status);
  }
  status() {
    let nodeStatus = super.status();
    if (this.hasNot) {
      switch (nodeStatus) {
        case NodeStatus.SUCCESS: return NodeStatus.FAILED;
        case NodeStatus.FAILED: return NodeStatus.SUCCESS;
      }
    }
    return nodeStatus;
  }
}
/**
 * Gets friendly status
 * @param {number} status tree node status
 * @returns {string} user-friendly status string
 */
function getFriendlyStatus(status) {
  switch (status) {
    case NodeStatus.FAILED:
      return 'Failed';
    case NodeStatus.SUCCESS:
      return 'Success';
    case NodeStatus.RUNNING:
      return 'Running';
    default:
      return 'Unknown';
  }
}
if (typeof exports !== 'undefined' && exports) {
  exports.bt = {
    Node,
    Fallback,
    Sequence,
    Parallel,
    Action,
    Condition,
    NodeType,
    NodeStatus,
  };
}