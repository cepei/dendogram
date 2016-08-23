
var force
function create_graph(filename){
	d3.csv(filename, function(data){
		var nodes = {};
		var links = []


		data
		.filter(function(elem){
			var ods_index = parseInt(elem.ODS.split(" ")[0]);
			return ods_index > 0 && ods_index <=17;

		})
		.forEach(function(d,i) {
			// Remember, those frightening operators are or that are evaluated in order, (If first is true second is not executed)
		  nodes[d.ODS] = {name: d.ODS, type: "ods", node_index: i}	
		  nodes[d.FUENTE] = {name: d.FUENTE, type: "fuente", node_index: i}	
		  nodes[d.DATOS] = {name: d.DATOS, type: "datos", node_index: i}	

		  links.push({"source": d.ODS, "target":d.DATOS, "type": "ods-fuente"});
		  links.push({"source": d.DATOS, "target":d.FUENTE, "type": "fuente-datos"});
		});

		for(var key in nodes){
			nodes[key].x = 300 + Math.random()*300;
			nodes[key].y = 300 + Math.random()*300;
		}
		
		console.log(links)
		links.forEach(function(link, i) {
		  link.source = nodes[link.source] //|| (nodes[link.source] = {name: link.source, type: link.type=="ods-fuente"?"ods":"fuente", node_index: i});
		  link.target = nodes[link.target] //|| (nodes[link.target] = {name: link.target, type: link.type=="ods-fuente"?"fuente":"datos", node_index: i});

		});
		
		console.log(links)

		var width = 1000,
		    height = 1000,
			D2R = Math.PI / 180;

		if(force)
			force.stop()

		force = d3.layout.force()
		    .nodes(d3.values(nodes))
		    .links(links)
		    .size([width, height])
		    .linkDistance(60)
		    .linkStrength(0)
		    .friction(0)
		    .gravity(0)
		    .charge(-30)
		    .chargeDistance(20)
		    .on("tick", moveToRadial)
		


		d3.select("#forcemap").html("")

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
		    .attr("r", function(d){
		    	if(d.type=="ods")
		    		return 10
		    	if(d.type=="fuente")
		    		return 4
		    	return 2
		    })
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
		    	.style("filter", function(d){ return associated.indexOf(d.name) != -1?"url(#drop-shadow)":""})


		    	d3.selectAll(".link").classed("selected", 
		    								function(d){ 
		    									return associated.indexOf(d.source.name) != -1 && associated.indexOf(d.target.name) != -1})

		    	d3.select("#tooltip")
		  	    .attr("class", d.type)
		    	.html( "<b>" + d.type.toUpperCase() + "</b>: " + d.name)


		    })



		//************************************
		//calculate data positions from start
		//************************************
		var positions = {"ods":{}, "fuente":{}, "datos":{}}

			d3.selectAll("circle.ods")
				.sort(function(a,b){
					return d3.ascending(parseInt(a.name.split(" ")[0]), parseInt(b.name.split(" ")[0]))
				})[0]
				.forEach(function(obj,i){

					var increment_angle = 360/(d3.selectAll("circle.ods")[0].length)
					var radius = 400;
					var startAngle = 0;
					var currentAngle = startAngle + (increment_angle * i);
					var currentAngleRadians = currentAngle * D2R;
					// the 500 & 250 are to center the circle we are creating
					var laps = Math.floor(d3.selectAll("circle.ods")[0].length/180) + 1;
					positions["ods"][obj.__data__.node_index] = {
					  x: 450 + (radius - (20*(i%laps))) * Math.cos(currentAngleRadians),
					  y: 450 + (radius - (20*(i%laps))) * Math.sin(currentAngleRadians)
					};
					//return coordinates;
				})


		for(var type in positions){
			d3.selectAll("circle." + type )[0].forEach(function(obj,i){
				if(type!="ods"){
		    			var associated_ods = [];
		    			var name = d3.select(obj).data()[0].name
				    	data.filter(function(datanode){
					    		return datanode[type.toUpperCase()] == name;
					    	}).forEach(function(d){
						    	
						    	//.classed("selected", function(d){ return associated.indexOf(d.name) != -1})
					    		associated_ods.push(d.ODS);
					    	})
						var coordinates = {x:450,y:450};
					    var associated_points = d3.selectAll("circle.ods")
							    			.data()
							    			.filter(function(d){ return associated_ods.indexOf(d.name) != -1})
							    			//.map(function(d){ return {x:d.x, y:d.y}})
							    			.forEach(function(d, i, arr){
							    				//console.log(d.type);
							    				coordinates.x += (positions.ods[d.node_index].x - 450)/(arr.length + (type=="fuente"?0.3:0.1));	
							    				coordinates.y += (positions.ods[d.node_index].y - 450)/(arr.length + (type=="fuente"?0.3:0.1));	
							    			})
							    positions[type][obj.__data__.node_index] = coordinates;
							}

						
						//return coordinates;
					})
		}

/*		circle
			.attr("cx", function(d) { return 0 })
			.attr("cy", function(d) { return 0 })*/
			//.attr("cy", function(d) { return d.y ; })

		force.start();

		force.friction(0.9)

		//************************************

		function moveToRadial(e) {
			path.attr("d", linkArc);
		  circle.each(function(d,i) { radial(d,i,e.alpha); });
			
		  circle
			.attr("cx", function(d) { return d.x ; })
			.attr("cy", function(d) { return d.y ; })
		}


		function radial(data, index, alpha) {
			// check out the post
			// http://macwright.org/2013/03/05/math-for-pictures.html

			var radialPoint = positions[data.type][data.node_index]

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
}
window.onload = function(){
		var buttons = d3.selectAll(".country-selector")
								.on("click", function(d){
									create_graph(this.value)
								})
	}