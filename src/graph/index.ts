import { NodifyType, Meta, INode, ILink } from "@/types";
import newUUID from "@/utils/uuid";

import { EventEmitter } from "events";

export enum GraphEvents 
{
    AddNode = 'addNode',
    DelNode = 'delNode',
    AddLink = 'addLink',
    DelLink = 'delLink',
}

export declare interface Graph 
{
    on(event: GraphEvents.AddNode, listener: (node: INode) => void): this;
    on(event: GraphEvents.DelNode, listener: (node: INode) => void): this;
    on(event: GraphEvents.AddLink, listener: (link: ILink) => void): this;
    on(event: GraphEvents.DelLink, listener: (link: ILink) => void): this;
}

type NodeId = string;

export class Graph extends EventEmitter implements Meta
{
    public readonly uuid: string;
    public readonly type: NodifyType;

    public readonly nodes: { [node: NodeId]: INode };
    public readonly links: { [node: NodeId]: Array<ILink> };

    public constructor()
    {
        super();

        this.uuid = newUUID();
        this.type = NodifyType.Graph;
        this.nodes = {};
        this.links = {};
    }

    public addNode(node: INode): Graph 
    {
        if(Object.keys(this.nodes).includes(node.uuid))
        {
            throw new Error(`Node ${node.uuid} already added to graph ${this.uuid}!`);
        }

        this.nodes[node.uuid] = node;
        this.links[node.uuid] = new Array<ILink>();
        this.emit(GraphEvents.AddNode, node);

        return this;
    }

    public addLink(link: ILink) : Graph 
    {
        const { source, sink } = this.getNodesSafe(link);
        
        this.links[source.uuid].push(link);
        this.links[sink.uuid].push(link);

        this.emit(GraphEvents.AddLink, link);

        return this;
    }

    public delLink(link: ILink) : Graph 
    {
        const { source, sink } = this.getNodesSafe(link);

        this.links[source.uuid] = this.links[source.uuid].filter(_link => _link.uuid !== link.uuid);
        this.links[sink.uuid] = this.links[source.uuid].filter(_link => _link.uuid !== link.uuid);
        this.emit(GraphEvents.DelLink, link);

        return this;
    }

    public delNode(node: INode) : Graph 
    {
        const _node = this.nodes[node.uuid];
        if(_node === undefined)
        {
            throw new Error(`Node ${node.uuid} is not part of this graph ${this.uuid}!`);
        }

        delete this.nodes[_node.uuid];
        this.emit(GraphEvents.DelNode, node);
        
        for(const nodeId in this.nodes) 
        { 
            // remove all links from or to the deleted node
            for(const link of this.links[nodeId].filter(link => link.output.parent.uuid === _node.uuid || link.input.parent.uuid === _node.uuid))
            {
                this.delLink(link);
            }
        }

        return this;
    }

    public getNodesSafe(link: ILink) : { source: INode, sink: INode }
    {
        const sourceParent = link.output.parent;
        const sinkParent = link.input.parent;
        const sourceNode = this.nodes[sourceParent.uuid];
        const sinkNode = this.nodes[sinkParent.uuid];
        
        if(sourceNode === undefined)
        {
            throw new Error(`Source node ${sourceParent.uuid} is not part of this graph ${this.uuid}!`);
        }

        if(sinkNode === undefined)
        {
            throw new Error(`Sink node ${sinkParent.uuid} is not part of this graph ${this.uuid}!`);
        }

        return { source: sourceNode, sink: sinkNode };
    }
}