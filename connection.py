#! /usr/bin/python

# Code version 0.1
# Author : fabien Delmotte - dwarf

# -*- coding:utf-8 -*-
from jsonrpclib import Server
from flask import Flask,render_template, request,json
from netaddr import *

userId = 'dwarf'
password = 'arista'
cvxServer = '192.168.10.10'

app = Flask(__name__)

def requeteAPI(command,server):
    global userId
    global password
    try:
        switch = Server('http://'+ userId + ':' + password + '@' + server + '/command-api')
        output = switch.runCmds(1, [command])
        return output
    except:
        pass


@app.route('/')
def signUp():
    return render_template('index.html')

@app.route('/lldpInfo', methods=['GET'])
def lldpIndo():
    nodes=[]
    nodesLinks = []
    tableCytoscape=[]
    command = 'show network physical-topology neighbors'
    result = requeteAPI(command,cvxServer)
    # Recherche des nodes et des connexions
    for key in result[0]['neighbors'].keys() :
        # Recherche des nodes
        nodes.append(key.split('-')[0])
        # Recherche des connexions
        linksNode = result[0]['neighbors'][key]['toPort']
        for item in linksNode :
            nodesLinks.append(key+"-"+item['hostname']+"-"+item['name'])
    # Elimination des doublons des connexions
    for item in nodesLinks :
        valeur = item.split("-")
        compare = valeur[2]+"-"+valeur[3]+"-"+valeur[0]+"-"+valeur[1]
        if compare in nodesLinks :
            nodesLinks.pop(nodesLinks.index(compare))
    # Elimination des doublons de la liste des nodes
    nodesList =  list(set(nodes))
    # mise en forme de la liste des nodes au format cytoscape
    for item in nodesList :
        # '{"group":"nodes","data":{"id":"Spine1"},"style":{"label":"Spine1"}}'
        valeur = '{"group":"nodes","data":{"id":' + '"'+ item + '"},"style":{"label":' + '"' + item + '"}}'
        tableCytoscape.append(valeur)
    for item in nodesLinks :
        # Spine2-Ethernet2-Leaf1-Ethernet2
        # { group: "edges", data: { id: "e0", source: "n0", target: "n1" } }
        explose = item.split('-')
        valeur = '{"group":"edges","data":{"id":"' + item + '", "source":"' + explose[0] + '", "target": "' + explose[2] + '"}}'
        tableCytoscape.append(valeur)
    return json.dumps(tableCytoscape)


# Fonction BGP AS
@app.route('/bgpAS', methods=['POST'])
def bgpAS():
    jsonRequest = request.form['json_str']
    jsonNode = json.loads(jsonRequest)
    data=[]
    command = 'show ip bgp summary'
    for item in jsonNode :
        server = item['data']['id']
        result = requeteAPI(command,server)
        try:
            resultASN = result[0]['vrfs']['default']['asn']
            data.append({'id':server, 'AS':resultASN})
        except KeyError:
            pass
        except:
            pass
    return json.dumps(data)

@app.route('/bgpPeerState', methods=['POST'])
def bgpPeerState():
    jsonRequest = request.form['json_str']
    jsonNode = json.loads(jsonRequest)
    data=[]
    command = 'show ip bgp summary'
    for item in jsonNode :
        server = item['data']['id']
        result = requeteAPI(command,server)
        try:
            resultASN = result[0]['vrfs']['default']['asn']
            peersArray =  result[0]['vrfs']['default']['peers'].keys()
            for peerid in peersArray:
                ip = IPNetwork(peerid + '/31')
                if peerid == str(ip[0]):
                    peerIPSource = str(ip[1])
                    peerIPDest = str(ip[0])
                else :
                    peerIPSource = str(ip[0])
                    peerIPDest = str(ip[1])
                resultPeerState = result[0]['vrfs']['default']['peers'][peerid]['peerState']
                resultASdest = result[0]['vrfs']['default']['peers'][peerid]['asn']
                data.append({'id':server,'ASsource':resultASN,'peerIPSource':peerIPSource,'ASdestination':resultASdest,'peerIPDest':peerIPDest,'peerstate':resultPeerState})   
        except KeyError:
            pass
        except:
            pass
    return json.dumps(data)

@app.route('/vxlanState', methods=['POST'])
def vxlanState():
    jsonRequest = request.form['json_str']
    jsonNode = json.loads(jsonRequest)
    data=[]
    command = 'show interfaces vxlan 1'
    for item in jsonNode :
        server = item['data']['id']
        print server
        result = requeteAPI(command,server)
        try:
            resultMapVlanVni = result[0]['interfaces']['Vxlan1']['vlanToVniMap']
            for key, value in resultMapVlanVni.iteritems():
                # print key, value['vni']
                data.append({'id':server,'vlan':key,'vni':value['vni']})  
        except KeyError:
            pass
        except:
            pass
    return json.dumps(data)

if __name__ == "__main__":
    app.run(debug=True,host ='0.0.0.0', port=3000)