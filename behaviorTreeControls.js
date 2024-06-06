function windowSize() {
  let w = window,
    d = document,
    e = d.documentElement,
    g = d.getElementsByTagName('body')[0],
    x = w.innerWidth || e.clientWidth || g.clientWidth,
    y = w.innerHeight || e.clientHeight || g.clientHeight;
  return [x, y];
}
/**
 * Populates the page with the behavior _tree_ and condition and action control elements.
 * @param {BehaviorTree} tree behavior tree
 * @param {string} parent name of hosting HTML element
 * @returns {void}
 */
function showTree(tree, parent) {
  let x0 = Infinity,
    x1 = -x0,
    data = d3.hierarchy(tree.root),
    root = undefined,
    horizontal_stretch = 0,
    vertical_stretch = 8,
    [width, height] = windowSize();

  data.drag_dx = 0;
  data.drag_dy = 0;
  data.scale = 1;

  function resizeRoot() {
    data.dx = vertical_stretch;
    data.dy = (width + horizontal_stretch) / (data.height + 3);

    root = d3.tree().nodeSize([4 * data.dx, data.dy])(data);
    root.each(d => {
      if (d.x > x1) x1 = d.x;
      if (d.x < x0) x0 = d.x;
    });
  }
  resizeRoot();

  window.addEventListener('resize', function () {
    [width, height] = windowSize();
    resizeRoot();
    render();
  });

  d3.select(parent)
    .on('wheel', function (e) {
      let up = false;

      if (e.deltaY == 0) {
        return;
      }
      if (e.deltaY < 0) {
        up = true;
      }
      if (e.shiftKey && e.altKey) {
        vertical_stretch += up ? 1 : -1;
        vertical_stretch = clamp(vertical_stretch, 3, 1000);
      } else if (e.shiftKey) {
        horizontal_stretch += up ? 30 : -30;
        horizontal_stretch = clamp(horizontal_stretch, -width * 0.6, 1000.0);
      } else {
        data.scale += up ? 0.10 : -0.10;
        data.scale = clamp(data.scale, 0.10, 100.0);
      }
      resizeRoot();
      render();
    });

  let conds = d3.select('#tree-conditions')
    .html('')
    .selectAll('a')
    .data([...tree.conditions.keys()].sort())
    .enter()
    .append('a')
    .classed('mdl-navigation__link', true);

  let condLabels = conds.append('label')
    .attr('for', function (d, i) { return `switch-${i}`; });

  condLabels.append('input')
    .attr('type', 'checkbox')
    .attr('id', function (d, i) { return `switch-${i}`; })
    .classed('mdl-switch__input', true)
    .on('change', function (event, name) {
      let s = event.target.checked ? NodeStatus.SUCCESS : NodeStatus.FAILED;
      tree.setConditionStatus(name, s);
      render();
    });
  condLabels
    .classed('mdl-switch mdl-js-switch mdl-js-ripple-effect', true);
  condLabels.append('span')
    .classed('mdl-switch__label', true)
    .text(name => name);
  // Force the material library to call the JS on all label
  // elements; otherwise, if loading a new tree the switches will
  // appear as checkboxes.
  condLabels.each(function (d) {
    let label = d3.select(this).node();
    componentHandler.upgradeElement(label);
  });

  const BTN_CLASS = 'mdl-button mdl-js-button mdl-button--fab tree-action--mini-fab mdl-js-ripple-effect';

  let actions = d3.select('#tree-actions')
    .html('')
    .selectAll('a')
    .data([...tree.actions.keys()].sort())
    .enter()
    .append('a')
    .classed('mdl-navigation__link tree-action', true);
  actions.append('span')
    .text(name => name);

  let actionBtns = actions.append('div');

  let fail = actionBtns.append('button')
    .classed(BTN_CLASS, true)
    .classed('tree-action--failure', true)
    .attr('title', name => "Set action '" + name + "' as failed")
    .on('click', function (event, name) {
      tree.setActionStatus(name, NodeStatus.FAILED);
      render();
    });
  fail
    .append('i')
    .classed('material-icons', true)
    .text('clear');
  fail.each(function (d) {
    let btn = d3.select(this).node();
    componentHandler.upgradeElement(btn);
  });

  let succeed = actionBtns.append('button')
    .classed(BTN_CLASS, true)
    .classed('tree-action--success', true)
    .attr('title', name => "Set action '" + name + "' as succeeded")
    .on('click', function (event, name) {
      tree.setActionStatus(name, NodeStatus.SUCCESS);
      render();
    });
  succeed
    .append('i')
    .classed('material-icons', true)
    .text('add');
  succeed.each(function (d) {
    let btn = d3.select(this).node();
    componentHandler.upgradeElement(btn);
  });

  let run = actionBtns.append('button')
    .classed(BTN_CLASS, true)
    .classed('tree-action--running', true)
    .attr('title', name => "Start '" + name + "' action")
    .on('click', function (event, name) {
      tree.setActionStatus(name, NodeStatus.RUNNING);
      render();
    });
  run
    .append('i')
    .classed('material-icons', true)
    .text('play_arrow');
  run.each(function (d) {
    let btn = d3.select(this).node();
    componentHandler.upgradeElement(btn);
  });

  function render() {
    root.data.deactivate();
    root.data.tick();
    renderTree(parent, root, width, x0, x1);
  }
  render();
}

function loadTree(graphElement, codeElement) {
  let tree = new BehaviorTree(parseBehaviorTreeFromText(codeElement.value));
  showTree(tree, graphElement);
}

function setupControls(graphElement, codeElement) {
  let treeSelect = document.getElementById('treeFileSelect'),
    treeInput = document.getElementById('treeFileInput'),
    codeUpdate = document.getElementById('codeUpdate');

  treeInput.addEventListener('change', function () {
    if (this.files.length < 1) {
      return;
    }
    let reader = new FileReader();
    reader.onload = function (e) {
      codeElement.value = e.target.result
      loadTree(graphElement, codeElement);
    };
    reader.readAsText(this.files[0]);
  }, false);

  treeSelect.addEventListener('click', function (e) {
    if (treeInput) {
      treeInput.click();
    }
  }, false);


  codeUpdate.addEventListener('click', function () {
    loadTree(graphElement, codeElement)
  }, false);

  d3.select('#tree-help__button')
    .on('click', function () {
      let card = d3.select('#tree-help__card'),
        viz = card.style('visibility');
      if (viz == 'hidden') {
        viz = 'visible';
      } else {
        viz = 'hidden';
      }
      card.style('visibility', viz);
    });

  d3.select('#download_svg__button')
    .on('click', function () {
      let graph = document.getElementById("graph");
      var svgData = graph.innerHTML;
      var svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      var svgUrl = URL.createObjectURL(svgBlob);
      var downloadLink = document.createElement("a");
      downloadLink.href = svgUrl;
      downloadLink.download = "newesttree.svg";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    });
}