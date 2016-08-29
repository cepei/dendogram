(function(){
	var force
	function create_graph(filename){
		d3.csv("ODSs.csv", function(ODSs){
			d3.csv(filename, function(rawdata){


				var width = 1000,
				    height = 1000
				var x_center = 450;
				var y_center = 450;

				var base_node = {
					"base_radius":{"ods":10, "fuente":5, "datos":3},
					"charge":{"ods":-50, "fuente":-20, "datos":-10}
				}

				var data = rawdata.filter(rowContainsValidODS);
				var nodes = createNodes(data, ODSs);
				var links = createLinks(data);
				var positions = getNodesPositions(nodes, data, x_center, y_center);
				console.log(positions)
				var ocurrences = getNodesOcurrencesInDatabase(data, ODSs)
				setInitialNodePositions(nodes)

				if(force)
					force.stop()

				force = d3.layout.force()
				    .nodes(d3.values(nodes))
				    .links(links)
				    .size([width, height])
				    .linkDistance(60)
				    .linkStrength(0)
				    .friction(0.9)
				    .gravity(0)
				    .charge(calculateCharge)
				    .chargeDistance(50)
				    .on("tick", moveToRadial)
				    .start()
				


				d3.select("#forcemap").html("")

				var svg = d3.select("#forcemap").append("svg")
				    .attr("width", width)
				    .attr("height", height);



				var defs = svg.append("defs");
				filter = createFilter(defs)


				var path = svg.append("g").selectAll("path")
				    .data(force.links())
				  .enter().append("path")
				    .attr("class", function(d) { return "link " + d.type; })
				    .attr("marker-end", function(d) { return "url(#" + d.type + ")"; });

				var circle = svg.append("g").selectAll("circle")
				    .data(force.nodes())
				  .enter().append("circle")
				    .attr("r", calculateNodeRadius)
				    .attr("class", function(d) { return d.type; })
				    .call(force.drag)
				    .on("click", clickNode)



				//************************************
				//Functions
				//************************************

				function rowContainsValidODS(row){
					var ods_index = parseInt(row.ODS.split(" ")[0]);
					return ods_index > 0 && ods_index <=17;
				}


				function createNodes(data, ODSs){
					var nodes = {}
					ODSs.forEach(function(d,i){
						nodes[d.ODS] = {name: d.ODS, type: "ods", node_index: -i}
					})

					data
					.forEach(function(d,i) {
						nodes[d.ODS] = {name: d.ODS, type: "ods", node_index: i}	
						nodes[d.FUENTE] = {name: d.FUENTE, type: "fuente", node_index: i}	
						nodes[d.DATOS] = {name: d.DATOS, type: "datos", node_index: i}	

					});
					console.log(nodes)

					return nodes

				}

				function createLinks(data){
						var links = [];
						data
						.forEach(function(d,i) {
						  links.push({"source": nodes[d.ODS], "target":nodes[d.DATOS], "type": "ods-fuente"});
						  links.push({"source": nodes[d.DATOS], "target":nodes[d.FUENTE], "type": "fuente-datos"});

						})

						return links
				}

				function clickNode(d){
				    	var associated = getAssociatedNodes(d);
				    	d3.selectAll("circle")
				    	.classed("selected", function(d){ return associated.indexOf(d.name) != -1})
				    	.style("filter", function(d){ return associated.indexOf(d.name) != -1?"url(#drop-shadow)":""})


				    	d3.selectAll(".link").classed("selected", 
				    								function(d){ 
				    									var is_source_associated = associated.indexOf(d.source.name) != -1;
				    									var is_target_associated = associated.indexOf(d.target.name) != -1;
				    									return is_source_associated && is_target_associated})

				    	d3.select("#tooltip")
				  	    .attr("class", d.type)
				    	.html( "<b>" + d.type.toUpperCase() + "</b>: " + d.name)

				}


				function calculateNodeRadius(nodedata){
					var weight = (1 + ocurrences[nodedata.type][nodedata.name]/ocurrences[nodedata.type]["__max"]);
			    	return base_node.base_radius[nodedata.type] * weight;

				}

				function calculateCharge(nodedata){
			    	return base_node.charge[nodedata.type];
				}

				function getNodesPositions(nodes, data, x_center, y_center){
						var positions = {"ods":{}, "fuente":{}, "datos":{}}		
						setODSNodesOnCircularPositions(positions, nodes);
						setNodesPositionsByODSAfinity(positions, nodes, data, x_center, y_center);
						return positions;
				}

				function setODSNodesOnCircularPositions(positions, nodes){
						for(key in nodes){
							var node = nodes[key];
							if(node.type == "ods"){
								positions["ods"][node.node_index] = getODSNodePosition(node)
							}
						}
				}

				function setNodesPositionsByODSAfinity(positions, nodes, data, x_center, y_center){
						for(key in nodes){
							var node = nodes[key];
							if(node.type != "ods"){
							    positions[node.type][node.node_index] = getNodePositionByODSAfinity(node, 
							    																	data, 
							    																	x_center, 
							    																	y_center, 
							    																	positions)
							}
						}
				}

				function getNodePositionByODSAfinity(node, data, x_center, y_center, positions){
					var coordinates = {x:x_center,y:y_center};
					var type = node.type;
					var name = node.name;
			    	data.filter(function(datanode){
				    		return datanode[type.toUpperCase()] == name && datanode.ODS != "";
				    	}).forEach(function(d, i, arr){
				    		var weight = 1 / (arr.length * (type=="fuente"?1.25:1.1));
				    		var ods_coordinates = positions.ods[nodes[d.ODS].node_index];
		    				coordinates.x += (ods_coordinates.x - x_center) * weight;	
		    				coordinates.y += (ods_coordinates.y - y_center) * weight;									
				    	})
				    return coordinates

				}

				function getODSNodePosition(node){
					var i = parseInt(node.name.split(" ")[0])
					var increment_angle = 360/17
					var radius = 400;
					var offsetAngle = 0;
					var currentAngleRadians = (offsetAngle + (increment_angle * i)) * Math.PI / 180 ;
					return {
							  x: x_center + (radius * Math.cos(currentAngleRadians)),
							  y: y_center + (radius * Math.sin(currentAngleRadians))
							};			
				}


				function getNodesOcurrencesInDatabase(data, ODSs){
					var ocurrences = {"ods":{"__max":0}, "fuente":{"__max":0}, "datos":{"__max":0}}

					ODSs.forEach(function(d){
						ocurrences["ods"][d.ODS] = 0;
					})
					
					data.forEach(function(d){
						for(key in ocurrences){
							if(!ocurrences[key][d[key.toUpperCase()]])
								ocurrences[key][d[key.toUpperCase()]] = 0;
							ocurrences[key][d[key.toUpperCase()]]++;
							if(ocurrences[key][d[key.toUpperCase()]] > ocurrences[key]["__max"])
								ocurrences[key]["__max"] = ocurrences[key][d[key.toUpperCase()]]
						}
					})

					return ocurrences;

				}

				function setInitialNodePositions(nodes){
						var  D2R = Math.PI / 180;		
						for(var key in nodes){
							var tetha = Math.random() * 360 * D2R					
							var r = (100 + Math.random() * data.length * 0.1) //* (1 - Math.cos((tetha + Math.PI/2) * 3));
							nodes[key].x = 400 + (r * Math.cos(tetha));
							nodes[key].y = 400 + (r * Math.sin(tetha));
						}
						
				}

				function moveToRadial(e) {
					path.attr("d", linkArc);
				  circle.each(function(d,i) { radial(d,i,e.alpha); });
					
				  circle
					.attr("cx", function(d) { return d.x ; })
					.attr("cy", function(d) { return d.y ; })
				}


				function getAssociatedNodes(nodedata){
					var associated = [];

				    	data.filter(function(obj){
				    		return obj[nodedata.type.toUpperCase()] == nodedata.name
				    	}).forEach(function(d){
				    		associated.push(d.ODS);
				    		associated.push(d.FUENTE);
				    		associated.push(d.DATOS);

				    	})
				    return associated;
				}

				// functions 
				function linkArc(d) {
				  return "M" + d.source.x + "," + d.source.y + "L" + d.target.x + "," + d.target.y;
				}

				function transform(d) {
				  return "translate(" + d.x + "," + d.y + ")";
				}

				function radial(data, index, alpha) {
					var radialPoint = positions[data.type][data.node_index]
					var affectSize = alpha * 0.1 ;
					data.x += (radialPoint.x - data.x) * affectSize;
					data.y += (radialPoint.y - data.y) * affectSize;


				}

				function createFilter(parent){

					var filter = appendNewFilterToParent(parent);
					appendGaussianBlurToFilter(filter);
					setOffsetToFilter(filter);
					overlayOriginalImageToFilter(filter);


				}

				function appendNewFilterToParent(parent){
					// create filter with id #drop-shadow
					// height=130% so that the shadow is not clipped
					return filter = parent.append("filter")
										    .attr("id", "drop-shadow")
										    .attr("x", "-200%")
										    .attr("y", "-200%")
										    .attr("height", "400%")
											.attr("width", "400%");

				}

				function appendGaussianBlurToFilter(filter){
					// SourceAlpha refers to opacity of graphic that this filter will be applied to
					// convolve that with a Gaussian with standard deviation 3 and store result
					// in blur
					filter.append("feGaussianBlur")
					    .attr("in", "SourceAlpha")
					    .attr("stdDeviation", 5)
					    .attr("result", "blur");

				}

				function setOffsetToFilter(filter){
					// translate output of Gaussian blur to the right and downwards with 2px
					// store result in offsetBlur
					filter.append("feOffset")
					    .attr("in", "blur")
					    .attr("dx", 1)
					    .attr("dy", 1)
					    .attr("result", "offsetBlur");
				}

				function overlayOriginalImageToFilter(filter){
					// overlay original SourceGraphic over translated blurred opacity by using
					// feMerge filter. Order of specifying inputs is important!
					var feMerge = filter.append("feMerge");

					feMerge.append("feMergeNode")
					    .attr("in", "offsetBlur")
					feMerge.append("feMergeNode")
					    .attr("in", "SourceGraphic");

				}

			})
		})
	}
	window.onload = function(){
			var buttons = d3.selectAll(".country-selector")
									.on("click", function(d){
										create_graph(this.value)
									})
		}

}())