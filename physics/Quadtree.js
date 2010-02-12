/**
 * A quadtree.
 *
 * @constructor Constructs a new quadtree for the specified array of particles.
 *
 * @param {pv.Particle} particles the linked list of particles.
 */
pv.Quadtree = function(particles) {
  var p;

  /* Compute bounds. */
  var x1 = Number.POSITIVE_INFINITY, y1 = x1,
      x2 = Number.NEGATIVE_INFINITY, y2 = x2;
  for (p = particles; p; p = p.next) {
    if (p.x < x1) x1 = p.x;
    if (p.y < y1) y1 = p.y;
    if (p.x > x2) x2 = p.x;
    if (p.y > y2) y2 = p.y;
  }

  /* Squarify the bounds. */
  var dx = x2 - x1, dy = y2 - y1;
  if (dx > dy) y2 = y1 + dx;
  else x2 = x1 + dy;

  /** @private Caches quadtree nodes. */
  function node() {
    if (pv.Quadtree.$cache) {
      var n = pv.Quadtree.$cache;
      pv.Quadtree.$cache = n.next;
      return n;
    }
    return new pv.Quadtree.Node();
  }

  /**
   * Recursively inserts the specified particle <i>p</i> at the node <i>n</i> or
   * one of its descendants. The bounds are defined by [<i>x1</i>, <i>x2</i>]
   * and [<i>y1</i>, <i>y2</i>].
   */
  function insert(n, p, x1, y1, x2, y2) {

    if (isNaN(p.x) || isNaN(p.y)) {
      fail();
      return; // ignore NaN TODO??
    }

    if (n.leaf) {
      if (n.p) {
        /*
         * If the particle at this leaf node is at the same position as the new
         * particle we are adding, we leave the particle associated with the
         * internal node while adding the new particle to a child node. This
         * avoids infinite recursion.
         */
        if ((Math.abs(n.p.x - p.x) + Math.abs(n.p.y - p.y)) < .01) {
          insertChild(n, p, x1, y1, x2, y2);
        } else {
          var v = n.p;
          n.p = null;
          insertChild(n, v, x1, y1, x2, y2);
          insertChild(n, p, x1, y1, x2, y2);
        }
      } else {
        n.p = p;
      }
    } else {
      insertChild(n, p, x1, y1, x2, y2);
    }
  }

  /**
   * Recursively inserts the specified particle <i>p</i> into a descendant of
   * node <i>n</i>. The bounds are defined by [<i>x1</i>, <i>x2</i>] and
   * [<i>y1</i>, <i>y2</i>].
   */
  function insertChild(n, p, x1, y1, x2, y2) {
    /* Compute the split point, and the quadrant in which to insert p. */
    var sx = (x1 + x2) / 2,
        sy = (y1 + y2) / 2,
        c = (p.x >= sx) + (p.y >= sy) * 2;

    /* Update the bounds as we recurse. */
    if ((c == 1) || (c == 3)) x1 = sx; else x2 = sx;
    if (c > 1) y1 = sy; else y2 = sy;

    /* Recursively insert into the child node. */
    n.leaf = false;
    switch (c) {
      case 0: n = n.c1 || (n.c1 = node()); break;
      case 1: n = n.c2 || (n.c2 = node()); break;
      case 2: n = n.c3 || (n.c3 = node()); break;
      default: n = n.c4 || (n.c4 = node()); break;
    }
    insert(n, p, x1, y1, x2, y2);
  }

  /* Insert all particles. */
  this.root = node();
  for (p = particles; p; p = p.next) insert(this.root, p, x1, y1, x2, y2);

  this.xMin = x1;
  this.yMin = y1;
  this.xMax = x2;
  this.yMax = y2;
};

/** Disposes all quadtree nodes so they can be recycled. */
pv.Quadtree.prototype.dispose = function() {
  function dispose(n) {
    if (n.c1) dispose(n.c1);
    if (n.c2) dispose(n.c2);
    if (n.c3) dispose(n.c3);
    if (n.c4) dispose(n.c4);
    n.leaf = true;
    n.c1 = n.c2 = n.c3 = n.c4 = n.p = null;
    n.next = pv.Quadtree.$cache;
    pv.Quadtree.$cache = n;
  }
  dispose(this.root);
};

/**
 * @type pv.Quadtree.Node
 * @field pv.Quadtree.prototype.root
 */

/**
 * @type number
 * @field pv.Quadtree.prototype.xMin
 */

/**
 * @type number
 * @field pv.Quadtree.prototype.xMax
 */

/**
 * @type number
 * @field pv.Quadtree.prototype.yMin
 */

/**
 * @type number
 * @field pv.Quadtree.prototype.yMax
 */

/**
 * A node in a quadtree.
 *
 * @constructor Constructs a new node. TODO Use a node pool to avoid constructor
 * overhead?
 */
pv.Quadtree.Node = function() {};

/**
 * True if this node is a leaf node; i.e., it has no children. Note that both
 * leaf nodes and non-leaf (internal) nodes may have associated particles. If
 * this is a non-leaf node, then at least one of {@link #c1}, {@link #c2},
 * {@link #c3} or {@link #c4} is guaranteed to be non-null.
 *
 * @type boolean
 */
pv.Quadtree.Node.prototype.leaf = true;

/**
 * @type pv.Quadtree.Node
 * @field pv.Quadtree.Node.prototype.next
 */

/**
 * The particle associated with this node, if any.
 *
 * @type pv.Particle
 * @field pv.Quadtree.Node.prototype.p
 */

/**
 * The child node for the second quadrant, if any.
 *
 * @type pv.Quadtree.Node
 * @field pv.Quadtree.Node.prototype.c2
 */

/**
 * The child node for the third quadrant, if any.
 *
 * @type pv.Quadtree.Node
 * @field pv.Quadtree.Node.prototype.c3
 */

/**
 * The child node for the fourth quadrant, if any.
 *
 * @type pv.Quadtree.Node
 * @field pv.Quadtree.Node.prototype.c4
 */
