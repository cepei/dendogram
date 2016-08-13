d3.csv("eco_colombia.csv", function(data){
	var nodes = {};
	var links = []


	data.forEach(function(d) {
		// Remember, those frightening operators are or that are evaluated in order, (If first is true second is not executed)
	  links.push({"source": d.ODS, "target":d.FUENTE, "type": "ods-fuente"});
	  links.push({"source": d.FUENTE, "target":d.DATOS, "type": "fuente-datos"});
	});

	links.forEach(function(link, i) {
	  link.source = nodes[link.source] || (nodes[link.source] = {name: link.source, type: link.type=="ods-fuente"?"ods":"fuente", link_id: i});
	  link.target = nodes[link.target] || (nodes[link.target] = {name: link.target, type: link.type=="ods-fuente"?"fuente":"datos", link_id: i});
	});
	

	var width = 1000,
	    height = 1000,
		D2R = Math.PI / 180;

	var force = d3.layout.force()
	    .nodes(d3.values(nodes))
	    .links(links)
	    .size([width, height])
	    .linkDistance(60)
	    .linkStrength(0)
	    .friction(0.9)
	    .gravity(0)
	    .charge(-30)
	    .chargeDistance(6)
	    .on("tick", moveToRadial)
	    .start();

	var svg = d3.select("body").append("svg")
	    .attr("width", width)
	    .attr("height", height);

	var path = svg.append("g").selectAll("path")
	    .data(force.links())
	  .enter().append("path")
	    .attr("class", function(d) { return "link " + d.type; })
	    .attr("marker-end", function(d) { return "url(#" + d.type + ")"; });

	var circle = svg.append("g").selectAll("circle")
	    .data(force.nodes())
	  .enter().append("circle")
	    .attr("r", 6)
	    .attr("class", function(d) { return d.type; })
	    .call(force.drag);

	var text = svg.append("g").selectAll("text")
	    .data(force.nodes())
	  .enter().append("text")
	    .attr("x", 8)
	    .attr("y", ".31em")

	//************************************
	//calculate data positions from start
	//************************************
	var angles = {"ods":{}, "fuente":{}, "datos":{}}

	for(var type in angles){
		d3.selectAll("circle." + type )[0].forEach(function(obj,i){
					var increment_angle = 360/d3.selectAll("circle." + type)[0].length
					if(type=="ods")
						var radius = 200;
					if(type=="fuente")
						var radius = 300;
					if(type=="datos")
						var radius = 400;
					var startAngle = 0;
					var currentAngle = startAngle + (increment_angle * i);
					var currentAngleRadians = currentAngle * D2R;
					// the 500 & 250 are to center the circle we are creating
					angles[type][obj.__data__.link_id] = {
					  x: 450 + radius * Math.cos(currentAngleRadians),
					  y: 450 + radius * Math.sin(currentAngleRadians)
					};
					//return coordinates;
				})
	}


	console.log(angles)


	//************************************

	function moveToRadial(e) {
		console.log(e)
		path.attr("d", linkArc);
	  circle.each(function(d,i) { radial(d,i,e.alpha); });
		
	  circle
		.attr("cx", function(d) { return d.x; })
		.attr("cy", function(d) { return d.y; })
		.attr("data_link_id", function(d){return d.link_id })
	}


	function radial(data, index, alpha) {
		// check out the post
		// http://macwright.org/2013/03/05/math-for-pictures.html
		// for more info on how this works
		// the 500 & 250 are to center the circle we are creating

		var radialPoint = angles[data.type][data.link_id]

		// here we attenuate the effect of the centering
		// by the alpha of the force layout. 
		// this gives other forces - like gravity -
		// to have an effect on the nodes
		var affectSize = alpha * 0.1 ;

		// here we adjust the x / y coordinates stored in our
		// data to move them closer to where we want them
		// this doesn't move the visual circles yet - 
		// we will do that in moveToRadial
		data.x += (radialPoint.x - data.x) * affectSize;
		data.y += (radialPoint.y - data.y) * affectSize;


	}

	function linkArc(d) {
	  return "M" + d.source.x + "," + d.source.y + "L" + d.target.x + "," + d.target.y;
	}

	function transform(d) {
	  return "translate(" + d.x + "," + d.y + ")";
	}

})
