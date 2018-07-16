// var qheap = require("qheap"); // heap if wanted. Brute force is actually better here since |E| = Theta(|V|^2)
var DisjointSet = require("../modules/ngraph.disjoint-set");

function l2dist(a, b) { return Math.sqrt((a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1])); }

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
    var numPoints = 100;
    var delay = 100;
    var points = [];
    for (var i = 0; i < numPoints; i++) {
      points.push([Math.floor(Math.random() * width), Math.floor(Math.random() * height)]);
    }

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
    var sets = [];
    var edges = [];
    var mst = [];
    for (var i = 0; i < numPoints; i++) {
      sets.push(new DisjointSet());
      for (var j = i + 1; j < numPoints; j++) {
        edges.push([i, j, l2dist(points[i], points[j])]);
      }
    }

    edges.sort(function (a, b) { return a[2] - b[2]; });
    for (var i = 0; i < edges.length; i++) {
      if (sets[edges[i][0]].find() !== sets[edges[i][1]].find()) {
        mst.push(edges[i]);
        if (mst.length == numPoints - 1) {
          break;
        }
        sets[edges[i][0]].union(sets[edges[i][1]]);
      }
    }

    for (var i = 0; i < numPoints; i++) {
      ctx.beginPath();
      ctx.fillStyle = "rgb(0, 0, 255, 0.75)";
      ctx.arc(points[i][0], points[i][1], 3, 0, 2 * Math.PI, false);
      ctx.fill();
    }

    // prims only
    // ctx.fillStyle = "rgb(255, 0, 0, 0.75)";
    // ctx.arc(points[start][0], points[start][1], 3, 0, 2 * Math.PI, false);

    if (delay > 0) {
      var i = 0;
      function drawLine () {
        setTimeout(function () {
          ctx.beginPath();
          ctx.moveTo(points[mst[i][0]][0], points[mst[i][0]][1]);
          ctx.lineTo(points[mst[i][1]][0], points[mst[i][1]][1]);
          ctx.closePath();
          ctx.stroke();
          i++;
          if (i < mst.length) {
            drawLine();
          }
        }, delay);
      }
      drawLine();
    } else {
      for (var i = 0; i < numPoints; i++) {
        ctx.beginPath();
        ctx.moveTo(points[mst[i][0]][0], points[mst[i][0]][1]);
        ctx.lineTo(points[mst[i][1]][0], points[mst[i][1]][1]);
        ctx.closePath();
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