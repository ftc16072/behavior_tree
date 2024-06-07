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

  function render() {
    root.data.deactivate();
    root.data.tick();
    renderTree(parent, root, width, x0, x1);
  }
  render();
}

function loadTree(graphElement, codeElement, javaElement, team_number, tree_name) {
  let tree = new BehaviorTree(parseBehaviorTreeFromText(codeElement.value));
  showTree(tree, graphElement);
  javaElement.value = generateJava(tree, team_number, tree_name);
}

function setupControls(graphElement, codeElement, javaElement) {
  let treeSelect = document.getElementById('treeFileSelect'),
    treeInput = document.getElementById('treeFileInput'),
    codeUpdate = document.getElementById('codeUpdate'),
    teamElement = document.getElementById('team_number'),
    nameElement = document.getElementById('tree_name');

  treeInput.addEventListener('change', function () {
    if (this.files.length < 1) {
      return;
    }
    let reader = new FileReader();
    reader.onload = function (e) {
      codeElement.value = e.target.result
      let team_number = teamElement.value;
      let tree_name = nameElement.value;
      loadTree(graphElement, codeElement, javaElement, team_number, tree_name);
    };
    reader.readAsText(this.files[0]);
  }, false);

  treeSelect.addEventListener('click', function (e) {
    if (treeInput) {
      treeInput.click();
    }
  }, false);


  codeUpdate.addEventListener('click', function () {
    let team_number = teamElement.value;
    let tree_name = nameElement.value;
    loadTree(graphElement, codeElement, javaElement, team_number, tree_name);
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
      downloadLink.download = nameElement.value + ".svg";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    });
}