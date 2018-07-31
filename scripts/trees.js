// var qheap = require("qheap"); // heap if wanted. Brute force is actually better here since |E| = Theta(|V|^2)
var DisjointSet = require("../modules/ngraph.disjoint-set");

function l2dist(a, b) { return Math.sqrt((a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1])); }

function intersection(setA, setB) { // taken from Mozilla at https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set
    var _intersection = new Set();
    for (var elem of setB) {
        if (setA.has(elem)) {
            _intersection.add(elem);
        }
    }
    return _intersection;
}

function ball(points, i, rad) {
  var ball = new Set();
  for (var j = 0; j < points.length; j++) {
    if (l2dist(points[i], points[j]) < rad) {
      ball.add(j)
    }
  }
  return ball;
}

function singletons(s) {
  for (var t of s) {
    if (t.val.size > 1) {
      return false;
    }
  }
  return true;
}

class Tree {
  constructor(val, loc, rad) {
    this.val = val;
    this.loc = loc;
    this.rad = rad;
    this.parent = null;
    this.visited = false;
    this.prev = null;
    this.branches = [];
  }

  resetVisited() {
    this.visited = false;
    this.prev = null;
    for (var t of this.branches) {
      t.resetVisited();
    }
  }
}

function main() {
  // const qcanvas = document.querySelector("#glCanvas");
  // Initialize the GL context
  // const gl = canvas.getContext("webgl");
  var canvas = document.getElementById('glCanvas');
  if (canvas.getContext) {
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = "rgb(0, 0, 255, 0.75)";
    ctx.strokeStyle = "rgb(0, 0, 255, 0.75)";
    var width = 500;
    var height = 500;
    var numPoints = 20;
    var delay = 0;
    var points = [];
    for (var i = 0; i < numPoints; i++) {
      points.push([Math.floor(Math.random() * width), Math.floor(Math.random() * height)]);
    }
    console.log(points);

    // FRT
    var maxdist = 0;
    for (var i = 0; i < numPoints; i++) {
      for (var j = i + 1; j < numPoints; j++) {
        var newdist = l2dist(points[i], points[j]);
        if (l2dist(points[i], points[j]) > maxdist) {
          maxdist = newdist;
        }
      }
    }
    var toprad = 2;
    var i = 0;
    while (toprad < 2 * maxdist) {
      toprad *= 2;
      i++;
    }
    var beta = 0.5 + (Math.random() / 2);
    var rad = beta * toprad;
    var D = [];
    var circles = [];
    var leaves = [];
    D.push(new Set());
    var root = new Tree(new Set([...Array(numPoints).keys()]), 0, rad);
    D[0].add(root);
    circles.push([0, rad]);
    while (i > 0 && !singletons(D[D.length - 1])) {
      console.log("i: " + i);
      console.log("rad: " + rad)
      rad /= 2;
      var nextlevel = new Set();
      for (var treeset of D[D.length - 1]) {
        if (treeset.val.size == 1) {
          continue;
        }
        var S = new Set(treeset.val);
        var toAdd = new Set();
        for (var j = 0; j < numPoints; j++) {
          var b = intersection(ball(points, j, rad), S);
          if (b.size > 0) {
            circles.push([j, rad]); // since the same circle can intersect multiple different parent circles, there are some duplicate circles. Fixing this brings the runtime to O(n^2)-ish, but finding the distortion is O(n^3) anyway so I'm not going to go with the fancy implementation.
            var c = new Tree(b, j, rad);
            if (c.val.size == 1) {
              leaves.push(c);
            }
            c.parent = treeset;
            nextlevel.add(c);
            toAdd.add(c);
          }
          for (var point of b) {
            S.delete(point);
          }
        }
        for (var toAddTreeSet of toAdd) {
          treeset.branches.push(toAddTreeSet);
        }
      }
      D.push(nextlevel);
      i--;
    }
    if (i == 0) {
      for (var t of D[D.length - 1]) {
        leaves.push(t);
      }
    }
    console.log(D);

    // now we find out which pair of nodes has the worst distortion with n runs of DFS
    var max = 1;
    var argmax = [-1, -1];
    var totaldistortion = 0;
    var path = [];
    for (var leaf of leaves) {
      var fringe = [[leaf, l2dist(points[leaf.val.values().next().value], points[leaf.loc])]];
      while (fringe.length > 0) {
        var x = fringe.pop();
        var u = x[0];
        u.visited = true;
        var d = x[1];
        if (u.val.size == 1 && u.val.values().next().value != leaf.val.values().next().value) {
          var uvdistortion = (d + l2dist(points[u.val.values().next().value], points[u.loc])) / l2dist(points[u.val.values().next().value], points[leaf.val.values().next().value]);
          totaldistortion += uvdistortion;
          if (uvdistortion > max) {
            max = uvdistortion;
            argmax = [leaf, u];
          }
        }
        if (u.parent != null && !u.parent.visited) {
          u.parent.prev = u;
          fringe.push([u.parent, d + l2dist(points[u.loc], points[u.parent.loc])]);
        }
        for (var child of u.branches) {
          if (!child.visited) {
            child.prev = u;
            var newdist = d + l2dist(points[u.loc], points[child.loc]);
            fringe.push([child, newdist]);
          }
        }
      }
      root.resetVisited();
    }

    console.log("average distortion: " + totaldistortion/(numPoints * numPoints - numPoints));
    console.log("worst case distortion: " + max);
    var t = argmax[0];
    var s = argmax[1];
    var fringe = [s];
    while (fringe.length > 0) {
      var u = fringe.pop();
      if (u == t) {
        break;
      }
      u.visited = true;
      if (u.parent != null && !u.parent.visited) {
        u.parent.prev = u;
        fringe.push(u.parent);
      }
      for (var child of u.branches) {
        if (!child.visited) {
          child.prev = u;
          fringe.push(child);
        }
      }
    }

    console.log(s, t, path);
    path.push([t.val.values().next().value, t.loc]);
    while (t != s) {
      path.push([t.loc, t.prev.loc]);
      t = t.prev;
    }
    path.push([s.loc, s.val.values().next().value])
    console.log(path);

    // prims
    // var visited = [];
    // var dists = [];
    // var prev = [];
    // var mst = [];
    // var numVisited = 0;
    // for (var i = 0; i < numPoints; i++) {
    //   visited.push(false);
    //   dists.push(Infinity);
    //   prev.push(i);
    // }

    // var start = Math.floor(Math.random() * numPoints);
    // dists[start] = 0;
    // var min = Infinity;
    // var u = -1;
    // while (numVisited < numPoints) {
    //   min = Infinity;
    //   u = -1;
    //   for (var i = 0; i < numPoints; i++) {
    //     if (!visited[i] && (u < 0 || dists[i] < min)) {
    //       min = dists[i];
    //       u = i;
    //     }
    //   }
    //   visited[u] = true;
    //   if (u != start) {
    //     mst.push([u, prev[u]])
    //   }
    //   numVisited++;
    //   var newdist;
    //   for (var v = 0; v < numPoints; v++) {
    //     newdist = l2dist(points[u], points[v]);
    //     if (!visited[v] && newdist < dists[v]) {
    //       dists[v] = newdist;
    //       prev[v] = u;
    //     }
    //   }
    // }

    //kruskals
    // var sets = [];
    // var edges = [];
    // var mst = [];
    // for (var i = 0; i < numPoints; i++) {
    //   sets.push(new DisjointSet());
    //   for (var j = i + 1; j < numPoints; j++) {
    //     edges.push([i, j, l2dist(points[i], points[j])]);
    //   }
    // }

    // edges.sort(function (a, b) { return a[2] - b[2]; });
    // for (var i = 0; i < edges.length; i++) {
    //   if (sets[edges[i][0]].find() !== sets[edges[i][1]].find()) {
    //     mst.push(edges[i]);
    //     if (mst.length == numPoints - 1) {
    //       break;
    //     }
    //     sets[edges[i][0]].union(sets[edges[i][1]]);
    //   }
    // }

    for (var i = 0; i < numPoints; i++) {
      ctx.beginPath();
      ctx.fillStyle = "rgb(0, 0, 255, 0.75)";
      ctx.arc(points[i][0], points[i][1], 3, 0, 2 * Math.PI, false);
      ctx.fill();
    }

    // prims only
    // ctx.fillStyle = "rgb(255, 0, 0, 0.75)";
    // ctx.arc(points[start][0], points[start][1], 3, 0, 2 * Math.PI, false);

    console.log("circles: " + circles.length);
    if (delay > 0) {
      var i = 0;
      function drawLine () {
        setTimeout(function () {
          ctx.beginPath();
          // ctx.moveTo(points[mst[i][0]][0], points[mst[i][0]][1]);
          // ctx.lineTo(points[mst[i][1]][0], points[mst[i][1]][1]);
          // ctx.closePath();
          ctx.arc(points[circles[i][0]][0], points[circles[i][0]][1], circles[i][1], 0, 2 * Math.PI, false);
          ctx.stroke();
          i++;
          // if (i < mst.length) {
          if (i < circles.length) {
            drawLine();
          }
        }, delay);
      }
      drawLine();
    } else {
      // for (var i = 0; i < numPoints; i++) {
      //   ctx.beginPath();
      //   ctx.moveTo(points[mst[i][0]][0], points[mst[i][0]][1]);
      //   ctx.lineTo(points[mst[i][1]][0], points[mst[i][1]][1]);
      //   ctx.closePath();
      //   ctx.stroke();
      // }
      for (var i = 0; i < circles.length; i++) {
        ctx.beginPath();
        ctx.arc(points[circles[i][0]][0], points[circles[i][0]][1], circles[i][1], 0, 2 * Math.PI, false);
        ctx.stroke();
      }
      ctx.strokeStyle = "rgb(255, 0, 0, 0.75)";
      for (var i = 0; i < path.length; i++) {
        ctx.beginPath();
        ctx.moveTo(points[path[i][0]][0], points[path[i][0]][1]);
        ctx.lineTo(points[path[i][1]][0], points[path[i][1]][1]);
        ctx.stroke();
      }
      console.log("worst-case vertices: " + argmax[0].val.values().next().value + " " + argmax[1].val.values().next().value);
      ctx.strokeStyle = "rgb(0, 255, 0, 0.75)";
      ctx.beginPath();
      ctx.moveTo(points[argmax[0].val.values().next().value][0], points[argmax[0].val.values().next().value][1]);
      ctx.lineTo(points[argmax[1].val.values().next().value][0], points[argmax[1].val.values().next().value][1]);
      ctx.stroke();
    }
  }
  // Only continue if WebGL is available and working
  // if (!gl) {
  //   alert("Unable to initialize WebGL. Your browser or machine may not support it.");
  //   return;
  // }
}

window.onload = function () {
  main();
}