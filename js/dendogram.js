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

	var svg = d3.select("#forcemap").append("svg")
	    .attr("width", width)
	    .attr("height", height);





	// filters go in defs element
	var defs = svg.append("defs");

	// create filter with id #drop-shadow
	// height=130% so that the shadow is not clipped
	var filter = defs.append("filter")
	    .attr("id", "drop-shadow")
	    .attr("x", "-200%")
	    .attr("y", "-200%")
	    .attr("height", "400%")
		.attr("width", "400%");

	// SourceAlpha refers to opacity of graphic that this filter will be applied to
	// convolve that with a Gaussian with standard deviation 3 and store result
	// in blur
	filter.append("feGaussianBlur")
	    .attr("in", "SourceAlpha")
	    .attr("stdDeviation", 5)
	    .attr("result", "blur");

	// translate output of Gaussian blur to the right and downwards with 2px
	// store result in offsetBlur
	filter.append("feOffset")
	    .attr("in", "blur")
	    .attr("dx", 1)
	    .attr("dy", 1)
	    .attr("result", "offsetBlur");

	// overlay original SourceGraphic over translated blurred opacity by using
	// feMerge filter. Order of specifying inputs is important!
	var feMerge = filter.append("feMerge");

	feMerge.append("feMergeNode")
	    .attr("in", "offsetBlur")
	feMerge.append("feMergeNode")
	    .attr("in", "SourceGraphic");






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
	    .call(force.drag)
	    .on("click", function(d){
	    	//d3.selectAll()
	    	var associated = [];

	    	data.filter(function(obj){
	    		return obj[d.type.toUpperCase()] == d.name
	    	}).forEach(function(d){
	    		associated.push(d.ODS);
	    		associated.push(d.FUENTE);
	    		associated.push(d.DATOS);

	    	})

	    	//d3.selectAll("circle").classed("selected", false)
	    	d3.selectAll("circle")
	    	.classed("selected", function(d){ return associated.indexOf(d.name) != -1})


	    	d3.selectAll(".link").classed("selected", 
	    								function(d){ 
	    									return associated.indexOf(d.source.name) != -1 && associated.indexOf(d.target.name) != -1})

	    	d3.select("#tooltip")
	  	    .attr("class", d.type)
	    	.html( "<b>" + d.type.toUpperCase() + "</b>: " + d.name)


	    })
	    //.style("filter", "url(#drop-shadow)")


	var text = svg.append("g").selectAll("text")
	    .data(force.nodes())
	  .enter().append("text")
	    .attr("x", 8)
	    .attr("y", ".31em")

	//************************************
	//calculate data positions from start
	//************************************
	var positions = {"ods":{}, "fuente":{}, "datos":{}}

	for(var type in positions){
		d3.selectAll("circle." + type )[0].forEach(function(obj,i){
					var increment_angle = 360/(d3.selectAll("circle." + type)[0].length)
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
					var laps = Math.floor(d3.selectAll("circle." + type)[0].length/180) + 1;
					positions[type][obj.__data__.link_id] = {
					  x: 450 + (radius - (20*(i%laps))) * Math.cos(currentAngleRadians),
					  y: 450 + (radius - (20*(i%laps))) * Math.sin(currentAngleRadians)
					};
					//return coordinates;
				})
	}


	//************************************

	function moveToRadial(e) {
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


		var radialPoint = positions[data.type][data.link_id]
		var affectSize = alpha * 0.1 ;
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
