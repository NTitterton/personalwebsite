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

function printList(arr) {
  var toPrint = "[";
  for (var i = 0; i < arr.length - 1; i++) {
    toPrint += arr[i] + ", ";
  }
  toPrint += arr[arr.length - 1] + "]";
  return toPrint
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

class DisjointSet {
  constructor(numPoints) {
    this.elems = [];
    this.heights = [];
    for (var i = 0; i < numPoints; i++) {
      this.elems.push(i);
      this.heights.push(1);
    }
  }

  find(elem) {
    if (this.elems[elem] == elem) {
      return elem;
    }
    var root = this.find(this.elems[elem]);
    this.elems[elem] = root; // this is the path compression
    return root;
  }

  union(elem1, elem2) {
    var a = this.find(elem1);
    var b = this.find(elem2);
    if (this.heights[a] < this.heights[b]) {
      this.elems[a] = b;
    } else if (this.heights[a] > this.heights[b]) {
      this.elems[b] = a;
    } else {
      this.elems[b] = a;
      this.heights[a] += 1;
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
  while (r >= 0 && !singletons(levels[levels.length - 1])) {
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
  var sets = new DisjointSet(points.length);
  var edges = [];
  var mst = [];
  for (var i = 0; i < points.length; i++) {
    for (var j = i + 1; j < points.length; j++) {
      edges.push([i, j, l2dist(points[i], points[j])]);
    }
  }
  edges.sort(function (a, b) { return a[2] - b[2]; });
  for (var i = 0; i < edges.length; i++) {
    if (sets.find(edges[i][0]) != sets.find(edges[i][1])) {
      mst.push(edges[i]);
      if (mst.length == points.length - 1) {
        break;
      }
      sets.union(edges[i][0], edges[i][1]);
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

// function newTree(points, width, height) {
//   // todo: redo this, but sort by xloc and yloc and then do a scan to create the tree (should be O(n log n))
//   var prev = [];
//   var pointIDs = [];
//   for (var i = 0; i < points.length; i++) {
//     prev.push(i);
//     pointIDs.push(i);
//   }
//   function helper(prev, parent, x1, y1, x2, y2, candidates, candidateIDs) {
//     var inzone  = [];
//     var inzoneIDs = [];
//     for (var i = 0; i < candidates.length; i++) {
//       // console.log(x1, candidates[i][0], x2, y1, candidates[i][1], y2);
//       if (x1 <= candidates[i][0] < x2 && y1 <= candidates[i][1] < y2) {
//         inzone.push(candidates[i]);
//         inzoneIDs.push(candidateIDs[i]);
//       }
//     }
//     if (inzone.length == 0) {
//       return;
//     }
//     var centerID = -1;
//     var centerArrPos = -1;
//     var bestDist = Infinity;
//     for (var i = 0; i < inzone.length; i++) {
//       if (l2dist([(x1 + x2) / 2, (y1 + y2) / 2], inzone[i]) < bestDist) {
//         centerID = inzoneIDs[i];
//         centerArrPos = i;
//         bestDist = l2dist([(x1 + x2) / 2, (y1 + y2) / 2], inzone[i]);
//       }
//     }
//     prev[centerID] = parent;
//     console.log("updating prev");
//     console.log(prev);
//     inzone.splice(centerArrPos, 1);
//     inzoneIDs.splice(centerArrPos, 1);
//     xmed = (x1 + x2) / 2;
//     ymed = (y1 + y2) / 2;
//     helper(prev, centerID, x1, xmed, y1, ymed, inzone, inzoneIDs);
//     helper(prev, centerID, xmed, x2, y1, ymed, inzone, inzoneIDs);
//     helper(prev, centerID, x1, xmed, ymed, y2, inzone, inzoneIDs);
//     helper(prev, centerID, xmed, x2, ymed, y2, inzone, inzoneIDs);
//   }
//   // console.log("points");
//   // console.log(points);
//   // console.log("point IDs");
//   // console.log(pointIDs);
//   helper(prev, null, 0, 0, width, height, points, pointIDs);
//   var tree = [];
//   for (var i = 0; i < prev.length; i++) {
//     if (prev[i] != null) {
//       tree.push([i, prev[i]]);
//     }
//   }
//   console.log("tree:");
//   console.log(tree);
//   return tree;
// }

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
    var avg = totaldistortion/((points.length * points.length) - points.length);
    console.log("average distortion: " + avg);
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
    var avg = totaldistortion/((points.length * points.length) - points.length);
    console.log("average distortion: " + avg);
    console.log("worst case distortion: " + max);
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
  return [argmax, path, avg, max];
}

function main() {
  var canvas = document.getElementById('canvas');
  if (canvas.getContext) {
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = "rgb(0, 0, 255, 0.75)";
    ctx.strokeStyle = "rgb(0, 0, 255, 0.75)";
    var width = 500;
    var height = 500;
    var numPoints = 100;
    var treeType = "new";
    var delay = 0;
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
    }// } else if (treeType == "new") {
    //   var mst = newTree(points, width, height);
    //   // var distortion = calculateDistortion(points, mst, false);
    // }
    // var argmax = distortion[0];
    // var path = distortion[1];

    // var z = 4;
    // var frtAvgDistortion = [];
    // var mstAvgDistortion = [];
    // var randAvgDistortion = [];
    // var frtMaxDistortion = [];
    // var mstMaxDistortion = [];
    // var randMaxDistortion = [];
    // var iterations = 100;
    // while (z < 10000) {
    //   console.log("z: " + z);
    //   var frtAvg = [];
    //   var mstAvg = [];
    //   var randAvg = [];
    //   var frtMax = [];
    //   var mstMax = [];
    //   var randMax = [];
    //   for (var y = 0; y < iterations; y++) {
    //     var p = generatePoints(width, height, z);
        // var frt = FRT(p);
        // var leaves = frt[2];
        // var root = frt[0][0].values().next().value;
        // var frtdistortion = calculateDistortion(p, [leaves, root], true);
    //     var mst = Prims(p)[0];
    //     var mstdistortion = calculateDistortion(p, mst, false);
    //     var rand = randomTree(p);
    //     var randdistortion = calculateDistortion(p, rand, false);
    //     frtAvg.push(frtdistortion[2]);
    //     frtMax.push(frtdistortion[3]);
    //     mstAvg.push(mstdistortion[2]);
    //     mstMax.push(mstdistortion[3]);
    //     randAvg.push(randdistortion[2]);
    //     randMax.push(randdistortion[3]);
    //   }
    //   console.log(printList(frtAvg));
    //   console.log(printList(frtMax));
    //   console.log(printList(mstAvg));
    //   console.log(printList(mstMax));
    //   console.log(printList(randAvg));
    //   console.log(printList(randMax));
    //   frtAvgDistortion.push(frtAvg.reduce((a, b) => a + b) / iterations);
    //   frtMaxDistortion.push(frtMax.reduce((a, b) => a + b) / iterations);
    //   mstAvgDistortion.push(mstAvg.reduce((a, b) => a + b) / iterations);
    //   mstMaxDistortion.push(mstMax.reduce((a, b) => a + b) / iterations);
    //   randAvgDistortion.push(randAvg.reduce((a, b) => a + b) / iterations);
    //   randMaxDistortion.push(randMax.reduce((a, b) => a + b) / iterations);
    //   z *= 2;
    // }
    // console.log("FRT avg:");
    // console.log(printList(frtAvgDistortion));
    // console.log("FRT max:");
    // console.log(printList(frtMaxDistortion));
    // console.log("MST avg:");
    // console.log(printList(mstAvgDistortion));
    // console.log("MST max:");
    // console.log(printList(mstMaxDistortion));
    // console.log("random avg:");
    // console.log(printList(randAvgDistortion));
    // console.log("random max:");
    // console.log(printList(randMaxDistortion));
    // var x = [];
    // var y = [];
    // for (var i = 0; i < 100; i++) {
    //   console.log(i);
    //   var p = generatePoints(width, height, 1024);
    //   var frt = FRT(p);
    //   var leaves = frt[2];
    //   var root = frt[0][0].values().next().value;
    //   var frtdistortion = calculateDistortion(p, [leaves, root], true);
    //   x.push(l2dist(p[0], [250, 250]));
    //   y.push(frtdistortion[2]);
    // }
    // console.log(printList(x));
    // console.log(printList(y));

    if (delay > 0) {
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
        // ctx.strokeStyle = "rgb(255, 0, 0, 0.75)";
        // for (var i = 0; i < path.length; i++) {
        //   ctx.beginPath();
        //   ctx.moveTo(points[path[i][0]][0], points[path[i][0]][1]);
        //   ctx.lineTo(points[path[i][1]][0], points[path[i][1]][1]);
        //   ctx.closePath();
        //   ctx.stroke();
        // }
        // console.log("worst-case vertices: " + argmax[0] + " " + argmax[1]);
        // ctx.strokeStyle = "rgb(0, 255, 0, 0.75)";
        // ctx.beginPath();
        // ctx.moveTo(points[argmax[0]][0], points[argmax[0]][1]);
        // ctx.lineTo(points[argmax[1]][0], points[argmax[1]][1]);
        // ctx.stroke();
      }
    }
  }
}

window.onload = function () {
  main();
}