(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
module.exports = DisjointSet;

function DisjointSet(payload) {
  this.payload = payload;
  this.parent = this;
  this.rank = 0;
}

DisjointSet.prototype.find = find;
DisjointSet.prototype.union = union;

function find() {
  var parent = this.parent;
  if (parent !== this) {
    // compress so that in future we ran faster:
    this.parent = parent.find();
  }

  return this.parent;
}

function union(y) {
  var ourParent = this.find();
  var theirParent = y.find();

  if (theirParent === ourParent) return; // we are in the same set

  if (ourParent.rank < theirParent.rank) {
    ourParent.parent = theirParent;
  } else if (ourParent.rank > theirParent.rank) {
    theirParent.parent = ourParent;
  } else {
    theirParent.parent = ourParent;
    ourParent.rank += 1;
  }
}

},{}],2:[function(require,module,exports){
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

function generatePoints(width, height, numPoints) {
  var points = [];
  var pointSet = new Set();
  while (points.length < numPoints) { // lowkey the coupon collectors problem haha
    var x = Math.floor(Math.random() * width);
    var y = Math.floor(Math.random() * height);
    if (width <= height) { // could be moved out of the loop for speed reasons but this is cleaner
      var candidate = (y * height) + x;
    } else {
      var candidate = (x * width) + y;
    }
    if (!pointSet.has(candidate)) {
      pointSet.add(candidate);
      points.push([x, y]);
    }
  }
  return points;
}

function FRT(points) {
  var maxdist = 0;
  for (var i = 0; i < points.length; i++) {
    for (var j = i + 1; j < points.length; j++) {
      var newdist = l2dist(points[i], points[j]);
      if (l2dist(points[i], points[j]) > maxdist) {
        maxdist = newdist;
      }
    }
  }
  var toprad = 2;
  var r = 0;
  while (toprad < 2 * maxdist) {
    toprad *= 2;
    r++;
  }
  var beta = 0.5 + (Math.random() / 2);
  var rad = beta * toprad;
  var levels = [];
  var circles = [];
  var leaves = [];
  var currlocs = {};
  levels.push(new Set());
  var root = new Tree(new Set([...Array(points.length).keys()]), 0, rad);
  levels[0].add(root);
  for (var i = 0; i < points.length; i++) {
    currlocs[i] = root;
  }
  circles.push([0, rad]);
  while (r > 0 && !singletons(levels[levels.length - 1])) {
    rad /= 2;
    var nextlevel = new Set();
    var nextcurrlocs = {};
    for (var j = 0; j < points.length; j++) {
      var b = intersection(ball(points, j, rad), root.val);
      var jchildren = {};
      for (var treeset of levels[levels.length - 1]) {
        if (treeset.size == 1) {
          continue;
        }
        jchildren[treeset] = null;
      }
      var drawcircle = false;
      for (var point of b) {
        if (!(point in currlocs) || currlocs[point].val.size == 1 || point in nextcurrlocs) { // point wasnt in prev level or was in a leaf node or is already taken
          continue;
        }
        if (jchildren[currlocs[point]] == null) { // point is unclaimed and no child exists. 
          drawcircle = true;
          var child = new Tree(new Set([point]), j, rad);
          jchildren[currlocs[point]] = child;
          nextlevel.add(child);
          nextcurrlocs[point] = child;
          currlocs[point].branches.push(child);
          child.parent = currlocs[point];
        } else if (!(point in nextcurrlocs)) { // point is unclaimed but a child already exists
          nextcurrlocs[point] = jchildren[currlocs[point]];
          nextcurrlocs[point].val.add(point);
        }
      }
      if (drawcircle) {
        circles.push([j, rad]);
      }
    }
    for (var treeset of nextlevel) {
      if (treeset.val.size == 1) {
        leaves.push(treeset);
      }
    }
    currlocs = nextcurrlocs;
    levels.push(nextlevel);
    r--;
  }
  console.log(levels);
  console.log(circles);
  console.log(leaves);
  return [levels, circles, leaves]
}

function Prims(points) {
  var visited = [];
  var dists = [];
  var prev = [];
  var mst = [];
  var numVisited = 0;
  for (var i = 0; i < points.length; i++) {
    visited.push(false);
    dists.push(Infinity);
    prev.push(i);
  }
  var start = Math.floor(Math.random() * points.length);
  dists[start] = 0;
  var min = Infinity;
  var u = -1;
  while (numVisited < points.length) {
    min = Infinity;
    u = -1;
    for (var i = 0; i < points.length; i++) {
      if (!visited[i] && (u < 0 || dists[i] < min)) {
        min = dists[i];
        u = i;
      }
    }
    visited[u] = true;
    if (u != start) {
      mst.push([u, prev[u]])
    }
    numVisited++;
    var newdist;
    for (var v = 0; v < points.length; v++) {
      newdist = l2dist(points[u], points[v]);
      if (!visited[v] && newdist < dists[v]) {
        dists[v] = newdist;
        prev[v] = u;
      }
    }
  }
  console.log(mst);
  return [mst, start];
}

function Kruskals(points) {
  var sets = [];
  var edges = [];
  var mst = [];
  for (var i = 0; i < points.length; i++) {
    sets.push(new DisjointSet());
    for (var j = i + 1; j < points.length; j++) {
      edges.push([i, j, l2dist(points[i], points[j])]);
    }
  }
  edges.sort(function (a, b) { return a[2] - b[2]; });
  for (var i = 0; i < edges.length; i++) {
    if (sets[edges[i][0]].find() !== sets[edges[i][1]].find()) {
      mst.push(edges[i]);
      if (mst.length == points.length - 1) {
        break;
      }
      sets[edges[i][0]].union(sets[edges[i][1]]);
    }
  }
  console.log(mst);
  return mst;
}

function randomTree(points) { // this is O(n log n) but I feel like there should be a way to get it to O(n)
  var mst = [];
  var inTree = [];
  var inTreeSet = new Set();
  var outTree = new Set();
  for (var i = 0; i < points.length; i++) {
    outTree.add(i);
  }
  var start = Math.floor(Math.random() * points.length);
  inTree.push(start);
  inTreeSet.add(start);
  outTree.delete(start);
  for (var i = 0; i < points.length - 1; i++) {
    var l = Math.floor(Math.random() * inTree.length);
    var r = Math.floor(Math.random() * points.length);
    while (inTreeSet.has(r)) {
      r = Math.floor(Math.random() * points.length);
    }
    inTree.push(r);
    inTreeSet.add(r);
    outTree.delete(r);
    mst.push([inTree[l], r]);
  }
  console.log(mst);
  return mst;
}

function calculateDistortion(points, args, isFRT) {
  var max = 1;
  var argmax = [-1, -1];
  var totaldistortion = 0;
  var path = [];
  if (isFRT) {
    var leaves = args[0];
    var root = args[1];
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
    console.log("average distortion: " + totaldistortion/((points.length * points.length) - points.length));
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
    path.push([t.val.values().next().value, t.loc]);
    while (t != s) {
      path.push([t.loc, t.prev.loc]);
      t = t.prev;
    }
    path.push([s.loc, s.val.values().next().value])
  } else {
    var adjlist = {};
    for (var edge of args) {
      if (!(edge[0] in adjlist)) {
        adjlist[edge[0]] = [];
      }
      if (!(edge[1] in adjlist)) {
        adjlist[edge[1]] = [];
      }
      adjlist[edge[0]].push(edge[1]);
      adjlist[edge[1]].push(edge[0]);
    }
    for (var i = 0; i < points.length; i++) {
      var fringe = [i];
      var visited = [];
      var dists = [];
      for (var j = 0; j < points.length; j++) {
        visited.push(false);
        dists.push(Infinity);
      }
      dists[i] = 0;
      while (fringe.length > 0) {
        var u = fringe.pop();
        if (u != i) {
          var uvdistortion = dists[u] / l2dist(points[u], points[i]);
          totaldistortion += uvdistortion;
          if (uvdistortion > max) {
            max = uvdistortion;
            argmax = [u, i];
          }
        }
        visited[u] = true;
        for (var v of adjlist[u]) {
          if (!visited[v]) {
            fringe.push(v);
            dists[v] = dists[u] + l2dist(points[u], points[v]);
          }
        }
      }
    }
    console.log("average distortion: " + totaldistortion/((points.length * points.length) - points.length));
    console.log("worst case distortion: " + max);
    console.log(argmax);
    var t = argmax[0];
    var s = argmax[1];
    var fringe = [s];
    var visited = [];
    var prev = [];
    for (var i = 0; i < points.length; i++) {
      visited.push(false);
      prev.push(i);
    }
    while (fringe.length > 0) {
      var u = fringe.pop();
      if (u == t) {
        break;
      }
      visited[u] = true;
      for (var v of adjlist[u]) {
        if (!visited[v]) {
          fringe.push(v);
          prev[v] = u
        }
      }
    }
    while (t != s) {
      path.push([t, prev[t]]);
      t = prev[t];
    }
  }
  console.log(path);
  return [argmax, path];
}

function main() {
  // const qcanvas = document.querySelector("#glCanvas");
  // Initialize the GL context
  // const gl = canvas.getContext("webgl");
  var canvas = document.getElementById('canvas');
  if (canvas.getContext) {
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = "rgb(0, 0, 255, 0.75)";
    ctx.strokeStyle = "rgb(0, 0, 255, 0.75)";
    var width = 500;
    var height = 500;
    var numPoints = 100;
    var treeType = "random";
    var delay = 30;
    var points = generatePoints(width, height, numPoints);
    console.log(points);

    for (var i = 0; i < numPoints; i++) {
      ctx.beginPath();
      ctx.arc(points[i][0], points[i][1], 3, 0, 2 * Math.PI, false);
      ctx.fill();
    }

    if (treeType == "frt") {
      var frt = FRT(points);
      var levels = frt[0];
      var circles = frt[1];
      var leaves = frt[2];
      var root = levels[0].values().next().value;
      var distortion = calculateDistortion(points, [leaves, root], true);
    } else if (treeType == "prims") {
      var prims = Prims(points);
      var mst = prims[0];
      var start = prims[1];
      var distortion = calculateDistortion(points, mst, false);
    } else if (treeType == "kruskals") {
      var mst = Kruskals(points);
      var distortion = calculateDistortion(points, mst, false);
    } else if (treeType == "random") {
      var mst = randomTree(points);
      var distortion = calculateDistortion(points, mst, false);
    }
    var argmax = distortion[0];
    var path = distortion[1];

    if (delay > 0) {
      // if (treeType == "prims") { // fix later
      //   ctx.fillStyle = "rgb(255, 0, 0, 0.75)";
      //   ctx.arc(points[start][0], points[start][1], 3, 0, 2 * Math.PI, false);
      //   ctx.fill();
      // }
      if (treeType == "frt") {
        var cap = circles.length;
      } else {
        var cap = mst.length;
      }
      var i = 0;
      function drawLine () {
        setTimeout(function () {
          ctx.beginPath();
          if (treeType == "frt") {
            ctx.arc(points[circles[i][0]][0], points[circles[i][0]][1], circles[i][1], 0, 2 * Math.PI, false);
          } else {
            ctx.moveTo(points[mst[i][0]][0], points[mst[i][0]][1]);
            ctx.lineTo(points[mst[i][1]][0], points[mst[i][1]][1]);
            ctx.closePath();
          }
          ctx.stroke();
          i++;
          if (i < cap) {
            drawLine();
          }
        }, delay);
      }
      drawLine();
      // todo: draw worst case distortion after delay (maybe postpone until after gui?)
    } else {
      if (treeType == "frt") {
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
      } else {
        for (var i = 0; i < numPoints - 1; i++) {
          ctx.beginPath();
          ctx.moveTo(points[mst[i][0]][0], points[mst[i][0]][1]);
          ctx.lineTo(points[mst[i][1]][0], points[mst[i][1]][1]);
          ctx.closePath();
          ctx.stroke();
        }
        ctx.strokeStyle = "rgb(255, 0, 0, 0.75)";
        for (var i = 0; i < path.length; i++) {
          ctx.beginPath();
          ctx.moveTo(points[path[i][0]][0], points[path[i][0]][1]);
          ctx.lineTo(points[path[i][1]][0], points[path[i][1]][1]);
          ctx.closePath();
          ctx.stroke();
        }
        console.log("worst-case vertices: " + argmax[0] + " " + argmax[1]);
        ctx.strokeStyle = "rgb(0, 255, 0, 0.75)";
        ctx.beginPath();
        ctx.moveTo(points[argmax[0]][0], points[argmax[0]][1]);
        ctx.lineTo(points[argmax[1]][0], points[argmax[1]][1]);
        ctx.stroke();
      }
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
},{"../modules/ngraph.disjoint-set":1}]},{},[2]);
