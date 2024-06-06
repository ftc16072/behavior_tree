class BehaviorTree {
  constructor(root) {
    /** @property {Node} root node. */
    this.root = root;
    /** @property {Map<string, Action[]>} actions list of actions grouped by name */
    this.actions = new Map();
    /** @property {Map<string, Condition[]>} conditions list of conditions grouped by name */
    this.conditions = new Map();

    if (this.root) {
      this.extractActionsAndConditions(this.root);
    }
  }
  /**
 * 
 * @param {Map<string, Node[]>} map map to insert to
 * @param {string} key map key
 * @param {Node} value value to insert for the given _key_
 */

  addToArrayMap(map, key, value) {
    if (map.has(key)) {
      map.get(key).push(value);
    } else {
      map.set(key, [value]);
    }
  }
  /**
 * Recursively extracts action and condition nodes from the sub-tree.
 * @param {Node} node tree node
 * @returns {void}
 */
  extractActionsAndConditions(node) {
    if (node instanceof Action) {
      this.addToArrayMap(this.actions, node.name, node);
    } else if (node instanceof Condition) {
      this.addToArrayMap(this.conditions, node.name, node);
    }
    if (node.children) {
      node.children.forEach(c => this.extractActionsAndConditions(c));
    }
  }
  /**
 * Updates tree with new condition value.
 * @param {string} name condition name
 * @param {number} status new status
 */
  setConditionStatus(name, status) {
    if (this.conditions.has(name)) {
      this.conditions.get(name).forEach((/** @type {Condition} */ c) => c.setStatus(status));
    }
  }

  /**
   * Updates tree with new action status.
   * @param {string} name action name
   * @param {number} status new status
   */
  setActionStatus(name, status) {
    if (this.actions.has(name)) {
      this.actions.get(name).forEach((/** @type {Action} */ a) => a.setStatus(status));
    }
  }

  tick() {
    if (this.root) {
      this.root.tick();
    }
  }
}