pv.Layout.indent = function(map) {
  var nodes,
      bspace = 15,
      dspace = 15,
      ax,
      ay;

  /** @private */
  function position(n, breadth, depth) {
    n.x = ax + depth++ * dspace;
    n.y = ay + breadth++ * bspace;
    for (var c = n.firstChild; c; c = c.nextSibling) {
      breadth = position(c, breadth, depth);
    }
    return breadth;
  }

  /** @private */
  function data() {
    if (nodes) return nodes;
    nodes = pv.dom(map).nodes();
    ax = dspace - .5;
    ay = bspace - .5;
    position(nodes[0], 0, 0);
    return nodes;
  }

  var layout = {};

  layout.nodes = data;

  layout.links = function() {
    return data.call(this)
        .filter(function(n) { return n.parentNode; })
        .map(function(n) { return [n, n.parentNode]; });
  };

  layout.spacing = function(depth, breadth) {
    dspace = depth;
    bspace = breadth;
    return this;
  };

  /* A dummy mark, like an anchor, which the caller extends. */
  layout.node = new pv.Mark()
      .data(data)
      .strokeStyle("#1f77b4")
      .fillStyle("white")
      .left(function(n) { return n.x; })
      .top(function(n) { return n.y; });

  /* A dummy mark, like an anchor, which the caller extends. */
  layout.link = new pv.Mark().extend(layout.node)
      .data(pv.identity)
      .interpolate("step-after")
      .lineWidth(1)
      .strokeStyle("#ccc")
      .fillStyle(null);

  return layout;
};
