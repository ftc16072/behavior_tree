function clamp(val, min, max) {
  if (val < min) {
    return min;
  }
  if (val > max) {
    return max;
  }
  return val;
}
/**
 * Render _root_ inside the _parent_ DOM node with a viewbox width
 * of _width_.  _x0_ and _x1_ are used to determine the vertical height
 * of the tree inside the viewbox.
 * @param {string} parent HTML element type
 * @param {Rl} root D3 hierarchy tree root node
 * @param {number} width 
 * @param {number} x0 
 * @param {number} x1 
 */
function renderTree(parent, root, width, x0, x1) {
  function translate(tree) {
    let x = tree.dy + tree.drag_dx,
      y = tree.dx - x0 + tree.drag_dy;
    return `translate(${x}, ${y}) scale(${root.scale})`;
  }

  const svg = d3.select(parent)
    .html('')
    .append('svg')
    .attr('xmlns', 'http://www.w3.org/2000/svg')
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('viewBox', [0, 0, width, x1 - x0 + root.dx * 4]);

  const g = svg.append('g')
    .attr('font-family', 'sans-serif')
    .attr('font-size', 12)
    .attr('transform', translate(root));

  svg.call(d3.drag().on('drag.svg', function (event) {
    let s = clamp(root.scale, 1.0, root.scale);
    root.drag_dy += event.dy * s;
    root.drag_dx += event.dx * s;
    g.attr('transform', translate(root));
  }));

  const link = g.append('g')
    .attr('fill', 'none')
    .attr('stroke', '#555')
    .attr('stroke-opacity', 0.4)
    .attr('stroke-width', 1.5)
    .selectAll('path')
    .data(root.links())
    .join('path')
    .attr('d', d3.linkHorizontal()
      .x(d => d.y)
      .y(d => d.x));

  const node = g.append('g')
    .attr('stroke-linejoin', 'round')
    .attr('stroke-width', 3)
    .selectAll('g')
    .data(root.descendants())
    .join('g')
    .attr('transform', d => `translate(${d.y},${d.x})`);

  function nodeColor(active, status) {
    let base = 'BF',
      amp = '11',
      color = `#${base}${amp}${amp}`;

    if (active) {
      amp = '50';
    }
    switch (status) {
      case NodeStatus.FAILED: color = `#${base}${amp}${amp}`; break;
      case NodeStatus.SUCCESS: color = `#${amp}${base}${amp}`; break;
      case NodeStatus.RUNNING: color = `#${amp}${amp}${base}`; break;
      default:
        break;
    }
    return color;
  }
  node.each(function (n) {
    const SZ = 24;

    let active = n.data.active(),
      k = n.data.nodeType,
      color = nodeColor(active, n.data.status()),
      fill = 'white',
      text_color = 'black';

    if (k == NodeType.SEQUENCE || k == NodeType.FALLBACK || k == NodeType.PARALLEL) {
      if (active) {
        fill = color;
        color = '#444';
        text_color = 'white';
      }
      d3.select(this)
        .append('rect')
        .attr('x', -SZ / 2)
        .attr('y', -SZ / 2)
        .attr('width', SZ)
        .attr('height', SZ)
        .attr('fill', fill)
        .attr('stroke-width', 2)
        .attr('stroke', (active) ? color : 'gray');

      d3.select(this)
        .append('text')
        .attr('dy', '0.31em')
        .attr('x', d => n.data.kind == NodeType.SEQUENCE ? 5 : 3)
        .attr('text-anchor', 'end')
        .text(n.data.name)
        .attr('fill', text_color)
        .clone(true).lower();
    }
    else if (k == NodeType.CONDITION || k == NodeType.ACTION) {
      let container;

      if (active) {
        fill = color;
        color = '#111';
        text_color = 'white';
      }

      if (k == NodeType.CONDITION) {
        container = d3.select(this).append('ellipse');
      }
      if (k == NodeType.ACTION) {
        container = d3.select(this).append('rect');
      }
      container
        .attr('fill', fill)
        .attr('stroke-width', 2)
        .attr('stroke', (active) ? color : 'gray');

      const PAD = 10;

      let name = n.data.name;
      if (k == NodeType.CONDITION && n.data.hasNot) {
        name = '!' + name;
      }
      let text = d3.select(this)
        .append('text')
        .attr('dy', '0.31em')
        .attr('text-anchor', 'start')
        .attr('fill', text_color)
        .text(name)
        .clone(true).lower()
        .node();

      let width = text.getComputedTextLength() + PAD;
      if (k == NodeType.CONDITION) {
        container
          .attr('cx', width / 2.0 - PAD / 2.0)
          .attr('rx', width / 1.75)
          .attr('ry', '1.0em');
      }
      if (k == NodeType.ACTION) {
        container
          .attr('y', '-0.85em')
          .attr('x', -PAD / 2.0)
          .attr('width', width)
          .attr('height', '1.75em');
      }
    }

    // node tooltip
    var status = getFriendlyStatus(n.data.status());
    d3.select(this)
      .append("svg:title")
      .text(n => `Node: ${n.data.hasNot ? "NOT " : ""}${n.data.name} ${k}\nActive: ${active}\nStatus: ${status}`);
  });
}