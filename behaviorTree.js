const NodeType = {
  FAILOVER: 1,
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
  constructor(name, hasNot, nodeType, children = undefined) {
    this.name = name
    this.nodeType = nodeType
    this.hasNot = hasNot
    this.children = children || null;
    this._active = false
    this.nodeStatus = NodeStatus.FAILED;
  }
  status() {
    if (this.hasNot) {
      if (this.nodeStatus == NodeStatus.SUCCESS) {
        return NodeStatus.FAILED;
      } else if (this.nodeStatus == NodeStatus.FAILED) {
        return NodeStatus.SUCCESS;
      }
    }
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
  updateNameStatus(name, status) {
    if (this.name == name) {
      this.setStatus(status);
    }
    if (this.children) {
      for (let i = 0; i < this.children.length; i++) {
        this.children[i].updateNameStatus(name, status);
      }
    }
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

class Failover extends Node {
  constructor(hasNot, children = []) {
    super('?', hasNot, NodeType.FAILOVER, children || []);
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
  constructor(hasNot, children = []) {
    super('\u2192', hasNot, NodeType.SEQUENCE, children);
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
  constructor(hasNot, successCount, children = []) {
    super('\u21C9', hasNot, NodeType.PARALLEL, children || []);
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
  constructor(name, hasNot, status = NodeStatus.RUNNING) {
    super(name, hasNot, NodeType.ACTION);
    this.setStatus(status);
  }
  nextStatus() {
    if (this.nodeStatus == NodeStatus.RUNNING) {
      this.setStatus(NodeStatus.SUCCESS);
    } else if (this.nodeStatus == NodeStatus.SUCCESS) {
      this.setStatus(NodeStatus.FAILED);
    } else {
      this.setStatus(NodeStatus.RUNNING);
    }
  }
}
class Condition extends Node {
  constructor(name, hasNot, status = NodeStatus.FAILED) {
    super(name, hasNot, NodeType.CONDITION);
    this.hasNot = hasNot;
    this.setStatus(status);
  }

  nextStatus(status) {
    if (this.nodeStatus == NodeStatus.SUCCESS) {
      this.setStatus(NodeStatus.FAILED);
    }
    else if (this.nodeStatus == NodeStatus.FAILED) {
      this.setStatus(NodeStatus.SUCCESS);
    }
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
    Failover,
    Sequence,
    Parallel,
    Action,
    Condition,
    NodeType,
    NodeStatus,
  };
}
