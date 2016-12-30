// Code version 0.1
// Author : fabien Delmotte - dwarf

$(function() {
     $( "#accordion" ).accordion({
         collapsible: true
     });
    var cytoscapeTableNode=[]
    var cytoscapeTableEdge=[]
    var monobjet  = {
        identification : "",
        coordonneesX : "",
        coordonneesY : ""
    };
    // Requete pour l'affichage des informations lldp - connexion a CVX
    $('#LLDPrequest').click(function() {
        $.ajax({
            url: '/lldpInfo',
            dataType: 'json',
            // dataType: $('form').serialize(),
            type: 'GET',
            success: function(response) {
                // console.log(response);
                drawgraphtestlldp(response);
                // drawGraplldp(response);
            },
            error: function(error) {
                console.log(error);
            }
        });
    });

    // Bouton pour enlever les interfaces de Management de la map
    $('#SubmitManagement').click(function() {
      //affichage de tous les Edge de la base
      console.log('Suppression des liens de Management');
        var removeEdge = [];
        for (var i in cy.$('edge')) {
          if (typeof(cy.$('edge')[i]["_private"]) !== 'undefined') {
            var curID = cy.$('edge')[i]["_private"]["data"]["id"];
            // Suppression des interfaces de Management
            if ((curID.indexOf('Management')) != -1) {
              removeEdge.push('#' + curID);
            }
        }
      }
      // Delete les edges de Management
      for (var i in removeEdge){
        cy.remove(removeEdge[i]);
      }
    });

    // Bouton pour afficher les AS BGP des nodes
    $('#SubmitBGPAS').click(function(){
        // console.log(JSON.stringify(cytoscapeTableNode));
        $.ajax({
            url: '/bgpAS',
            dataType: 'json',
            // dataType: $('form').serialize(),
            type: 'POST',
            success: function(response) {
                updateGraphAS(response);
                // console.log(JSON.stringify(response));
            },
            error: function(error) {
                console.log(error);
            },
            data: {json_str:JSON.stringify(cytoscapeTableNode)}
        });
    });

// Bouton pour afficher l etat des peer BGP
    $('#SubmitBGPState').click(function(){
        $.ajax({
            url: '/bgpPeerState',
            dataType: 'json',
            type: 'POST',
            success: function(response) {
                console.log(JSON.stringify(response));
                updateGraphBGPState(response);
            },
            error: function(error) {
                console.log(error);
            },
            data: {json_str:JSON.stringify(cytoscapeTableNode)}
        });
    });

// Bouton pour recuperation de la position des objets et stockage
    $('#SavePosition').click(function(){
        console.log('Traitement de la position des Nodes pour stockage');
        var arraymonobjetjson =[]
        for (var i in cy.nodes()) {
            if (typeof(cy.$('node')[i]["_private"]) !=='undefined') {
            monobjet.identification = cy.$('node')[i]["_private"]["data"]["id"]
            monobjet.coordonneesX = cy.$('node')[i].position('x')
            monobjet.coordonneesY = cy.$('node')[i].position('y')
            var monobjetjson = JSON.stringify(monobjet);
            // Mise en place dans le tableau
            arraymonobjetjson.push(monobjetjson);
            }
        }
        // Utilisation du localstorage
        localStorage.removeItem("objet");
        localStorage.setItem("objet",arraymonobjetjson);
    });

// Bouton pour remettre les nodes en place
    $('#PositionBack').click(function(){
        console.log('Traitement du restore de la position des Nodes');
        // Lecture du localstorage et mise en place au format JSON dans un tableau
        var monobjetjson = JSON.parse('[' + localStorage.getItem("objet")+ ']');
        // Recherche de la corespondance dans le localStorage
        for (var j=0; j < monobjetjson.length; j++) {
            cy.$('#'+ monobjetjson[j].identification).position({
                x: monobjetjson[j].coordonneesX,
                y: monobjetjson[j].coordonneesY
            });
        }
    });
// Bouton VXLAN
    $('#SummitVxlanNumber').click(function(){
        console.log('Traitement du VXLAN')
        $.ajax({
            url: '/vxlanState',
            dataType: 'json',
            type: 'POST',
            success: function(response) {
                console.log(JSON.stringify(response));
                MapVlanVni(response);
            },
            error: function(error) {
                console.log(error);
            },
            data: {json_str:JSON.stringify(cytoscapeTableNode)}
        });
    })

    function MapVlanVni(response){
        console.log('Traitement Vlan Vni');
        ResetMap()
        vxlanId = parseInt(document.getElementById('vxlanNumber').value)
        for (item in response){
            // search vxlanId in response
            if (response[item].vni === vxlanId){
                cy.$('#' + response[item].id).classes('asOK');
            }
            // console.log(response[item].id + " " + response[item].vni);
        }
    }

    function RestorePosition(){
        console.log('Traitement du restore de la position des Nodes');
        // Lecture du localstorage et mise en place au format JSON dans un tableau
        var monobjetjson = JSON.parse('[' + localStorage.getItem("objet")+ ']');
        // Recherche de la corespondance dans le localStorage
        for (var j=0; j < monobjetjson.length; j++) {
            cy.$('#'+ monobjetjson[j].identification).position({
                x: monobjetjson[j].coordonneesX,
                y: monobjetjson[j].coordonneesY
            });
        }
    }

    function ResetMap(){
        console.log('Reset Map');
        for (item in cytoscapeTableNode){
            cy.$('#' + cytoscapeTableNode[item]['data']['id']).classes('.asReset');
        }
        for (item in cytoscapeTableEdge){
            cy.$('#'+cytoscapeTableEdge[item].data.id).classes('.asReset')
        }
    }


    function updateGraphBGPState(response){
        console.log('Traitement BGP state');
        ResetMap()
        for (item in response){
            // Traitement des peer Established
            if (response[item].peerstate === 'Established'){
                sourceId = response[item].id
                sourcePeerIP = response[item].peerIPSource
                for (item1 in response) {
                    destPeerIP = response[item1].peerIPDest
                    // Recherche de l @IP source dans le champs @IP destination d un node
                    if (sourcePeerIP === destPeerIP){
                        destID = response[item1].id
                        // Une corespondance a ete trouve - 2 nodes sont lies par le BGP
                        for (item2 in cytoscapeTableEdge){
                            // console.log('information Edge : ' + JSON.stringify(cytoscapeTableEdge[item2]));
                            edgeSource = cytoscapeTableEdge[item2].data.source;
                            edgeTarget = cytoscapeTableEdge[item2].data.target;
                            edgeId = cytoscapeTableEdge[item2].data.id
                            if ((sourceId === edgeSource && destID === edgeTarget) || (sourceId === edgeTarget && destID === edgeSource)){
                                if (edgeId.search('Management') == -1) {
                                    cy.$('#' + edgeId).classes('bgpstateok');
                                }
                            }
                            if (cy.$('#' + edgeId).style('line-color') != 'green'){
                                cy.$('#' + edgeId).classes('bgpstatenook');
                            }
                            // else {
                            //     cy.$('#' + edgeId).classes('bgpstatenook');
                            // }
                        }     
                    }
                }
            }
        }
    }

    function updateGraphAS(response){
        console.log('Traitement BGP AS number sur MAP');
        ResetMap()
        for (item in response) {
            // console.log(response[item].id)
            myClickedID = response[item].id
            myAS = myClickedID + ' - AS: ' + response[item].AS
            cy.$('#' + myClickedID).style('label', myAS)
        }
        // recherche des Node n'ayant de pas de numero AS
        for (item in cytoscapeTableNode) {
            myClickedID = cytoscapeTableNode[item]['data']['id']
            nodeLabel = cy.$('#' + myClickedID).style('label')
            if (nodeLabel.search('AS') == -1) {
                cy.$("#"+myClickedID).classes('asNotOK');
            }
        }
    }

    // Nouvelle fonction d affichage avec le connection.py
    function drawgraphtestlldp(response){
        for (item in response) {
            cy.add(JSON.parse(response[item]))
            // console.log(JSON.parse(response[item]).group)
            if (JSON.parse(response[item]).group ==='nodes') {
                // console.log(JSON.parse(response[item]).data.id)
                nodeId = JSON.parse(response[item]).data.id
                cytoscapeTableNode.push({
                    group: "nodes",
                    data: {
                        id: nodeId
                    }
                })
            }
            else {
                edgeId = JSON.parse(response[item]).data.id
                sourceId = JSON.parse(response[item]).data.source
                targetId = JSON.parse(response[item]).data.target
                cytoscapeTableEdge.push({
                    group: "edges",
                    data: {
                        id: edgeId,
                        source: sourceId,
                        target: targetId
                    }
                })
            }
        }
         regenEvent();
         RestorePosition();
        //  console.log(JSON.stringify(cytoscapeTableNode));
        //  console.log(JSON.stringify(cytoscapeTableEdge));
    }

    // Gestion des event dans l'espace cytoscape'
    var regenEvent = function (){
        // Reconstruction de l'affichage'
        cy.layout({ name: 'circle' });
        cy.fit();
    }
    
    var listenCytoscapeEvent = function(){
            // Event sur un click et affichage de l id
        cy.on('tap', 'node', function (evt) {
            // var myClickedID = evt.cyTarget.id();
            // cy.$("#"+myClickedID).classes('myfirstclass');
            // console.log("Node : " + myClickedID + " - selected")
        });
        // Event sur un click sur un edges
        cy.on('click', 'edge', function(evt){ 
            var myClickedID = evt.cyTarget.id();
            // Test pour retirer un lien
            // var j = cy.$("#"+myClickedID);
            // cy.remove( j );
            // Affichage des informations
            if (cy.$('#' + myClickedID).style('source-label').length < 1){
                // cy.$("#"+myClickedID).style('label', myClickedID)
                cy.$("#"+myClickedID).toggleClass('autorotate');
                cy.$("#"+myClickedID).style('source-label', "Eth" + myClickedID.split("-")[1].split("Ethernet")[1])
                cy.$("#"+myClickedID).style('target-label', "Eth" + myClickedID.split("-")[3].split("Ethernet")[1])
            } else {
                // cy.$("#"+myClickedID).style('label', '')
                cy.$("#"+myClickedID).toggleClass('autorotate');
                cy.$("#"+myClickedID).style('source-label', "")
                cy.$("#"+myClickedID).style('target-label', "")
            }
        });
    }
    listenCytoscapeEvent()
});
