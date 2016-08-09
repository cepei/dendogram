d3.csv("eco_costa_rica.csv", function(data){
	var nodes = {};
	var links = []



	// data.forEach(function(link) {
	// 	// Remember, those frightening operators are or that are evaluated in order, (If first is true second is not executed)
	//   link.ODS  = nodes[link.ODS] || (nodes[link.ODS] = {name: link.ODS});
	//   link.DATOS = nodes[link.DATOS] || (nodes[link.DATOS] = {name: link.DATOS});
	// });	

	data.forEach(function(d) {
		// Remember, those frightening operators are or that are evaluated in order, (If first is true second is not executed)
	  links.push({"source": d.ODS, "target":d.FUENTE, "type": "ods-fuente"});
	  links.push({"source": d.FUENTE, "target":d.DATOS, "type": "fuente-datos"});
	});

	links.forEach(function(link) {
	  link.source = nodes[link.source] || (nodes[link.source] = {name: link.source, type: link.type=="ods-fuente"?"ods":"fuente"});
	  link.target = nodes[link.target] || (nodes[link.target] = {name: link.target, type: link.type=="ods-fuente"?"fuente":"datos"});
	});
	

	var width = 2000,
	    height = 1000;

	var force = d3.layout.force()
	    .nodes(d3.values(nodes))
	    .links(links)
	    .size([width, height])
	    .linkDistance(60)
	    .charge(-100)
	    .on("tick", tick)
	    .start();

	var svg = d3.select("body").append("svg")
	    .attr("width", width)
	    .attr("height", height);

	// Per-type markers, as they don't inherit styles.
	svg.append("defs").selectAll("marker")
	    .data(["suit", "licensing", "resolved"])
	  .enter().append("marker")
	    .attr("id", function(d) { return d; })
	    .attr("viewBox", "0 -5 10 10")
	    .attr("refX", 15)
	    .attr("refY", -1.5)
	    .attr("markerWidth", 6)
	    .attr("markerHeight", 6)
	    .attr("orient", "auto")
	  .append("path")
	    .attr("d", "M0,-5L10,0L0,5");

	var path = svg.append("g").selectAll("path")
	    .data(force.links())
	  .enter().append("path")
	    .attr("class", function(d) { return "link " + d.type; })
	    .attr("marker-end", function(d) { return "url(#" + d.type + ")"; });

	var circle = svg.append("g").selectAll("circle")
	    .data(force.nodes())
	  .enter().append("circle")
	    .attr("r", 6)
	    .attr("class", function(d) { return "link " + d.type; })
	    .call(force.drag);

	var text = svg.append("g").selectAll("text")
	    .data(force.nodes())
	  .enter().append("text")
	    .attr("x", 8)
	    .attr("y", ".31em")
	    //.text(function(d) { return d.name; });

	// Use elliptical arc path segments to doubly-encode directionality.
	function tick() {
	  path.attr("d", linkArc);
	  circle.attr("transform", transform);
	  text.attr("transform", transform);
	}

	function linkArc(d) {
	  var dx = d.target.x - d.source.x,
	      dy = d.target.y - d.source.y,
	      dr = Math.sqrt(dx * dx + dy * dy);
	  return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
	}

	function transform(d) {
	  return "translate(" + d.x + "," + d.y + ")";
	}

	console.log(force.nodes())
})
