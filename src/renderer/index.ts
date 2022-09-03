import { NodejjiType, INode, ILink, IRender, ScaledCanvasRect } from "@/types";

import { Graph, GraphEvents } from "@/graph";
import { renderNode } from "@/renderer/node";

export class NodifyRenderer implements IRender
{
    private readonly _canvas: HTMLElement;

    private readonly canvasNodeObserver: IntersectionObserver;

    public visibleNodes: Array<INode>;

    constructor(canvasElement: HTMLElement, graph: Graph)
    {
        this._canvas = canvasElement;

        this.canvasNodeObserver = new IntersectionObserver(
            (nodes: Array<IntersectionObserverEntry>) => this.onNodeVisibilityChanged(nodes),
            { root: this._canvas.parentElement!, rootMargin: "0px" }
        );

        this.visibleNodes = new Array<INode>();

        graph.on(GraphEvents.AddNode, (node: INode) => this.addNode(node));
        graph.on(GraphEvents.DelNode, (node: INode) => this.delNode(node));
        graph.on(GraphEvents.AddLink, (link: ILink) => this.addLink(link));
        graph.on(GraphEvents.DelLink, (link: ILink) => this.delLink(link));
    }

    public get canvas(): HTMLElement { return this._canvas; }
    
    public get canvasRect(): ScaledCanvasRect
    {
        const bb = this._canvas.getBoundingClientRect();

        const scaleX = bb.width / this._canvas.offsetWidth;
        const scaleY = bb.height / this._canvas.offsetHeight;
        
        return { 
            rect: new DOMRect(bb.x / scaleX, bb.y / scaleY, bb.width / scaleX, bb.height / scaleY),
            scaleX: scaleX,
            scaleY: scaleY
        };
    }

    public initialize() : void 
    {
    }

    public destroy() : void {}

    private onNodeVisibilityChanged(nodes: IntersectionObserverEntry[]) : void 
    {
        for(const { target, isIntersecting } of nodes)
        {
            const { __node } = target as HTMLElement & { __node: INode }; 
            if(isIntersecting)
            {
                this.visibleNodes.push(__node);
            }
            else 
            {
                this.visibleNodes = this.visibleNodes.filter(node => node !== __node);
            }
        }
    }

    public addNode(node : INode) : NodifyRenderer { this.addNodes([node]); return this; }
    public addLink(link : ILink) : NodifyRenderer { this.addLinks([link]); return this; }
    public addNodes(nodes : Array<INode>) : NodifyRenderer 
    { 
        for(const node of nodes) 
        { 
            const vNode = this.renderNode(node); 
            this.canvasNodeObserver.observe(vNode);
        } 

        return this;
    }
    public addLinks(links : Array<ILink>) : NodifyRenderer 
    { 
        for(const link of links)
        {
            link.input.visual?.classList.add("connected");
            link.output.visual?.classList.add("connected");

            this.renderLink(link);
        }

        return this; 
    }
    
    private renderNode(node: INode) : HTMLElement & { __node: INode }
    { 
        const vNode = node.visual = node.renderer ? node.renderer(this.canvas) : renderNode(node, this.canvas);
        
        //@ts-ignore
        vNode.__node = node; return vNode;
    }

    public renderLink(link: ILink) : void 
    {
        if(link.output === undefined || link.input === undefined) 
        {
            throw new Error(`Invalid link '${link.uuid}'!`);
        }

        const { rect, scaleX, scaleY } = this.canvasRect;

        const outputSocket = link.output.visual!.querySelector('.ne-socket')!.getBoundingClientRect();
        const inputSocket = link.input.visual!.querySelector('.ne-socket')!.getBoundingClientRect();
        
        const outputX = ((outputSocket.x / scaleX) - rect.left) + ((outputSocket.width / scaleX) * 0.5);
        const outputY = ((outputSocket.y / scaleY) - rect.top) + ((outputSocket.height / scaleY) * 0.5);
        const inputX = ((inputSocket.x / scaleX) - rect.left) + ((inputSocket.width / scaleX) * 0.5);
        const inputY = ((inputSocket.y / scaleY) - rect.top) + ((inputSocket.height / scaleY) * 0.5);

        const offsetX = (Math.abs(outputX - inputX) * 0.5);

        const path = `
            M ${outputX} ${outputY} 
            C ${outputX + offsetX} ${outputY} 
              ${inputX  - offsetX} ${inputY} 
              ${inputX} ${inputY}`;
            
        const createNewLink = () : SVGPathElement =>
        {
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.style.position = 'absolute'; // !
            svg.style.width = '1px';
            svg.style.height = '1px';
            svg.style.overflow = 'visible';

            const vNewLink = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            vNewLink.classList.add("ne-link");

            svg.appendChild(vNewLink);
            this._canvas.appendChild(svg);
            return vNewLink;
        }

        let vLink = link.visual;
        if(vLink === undefined) 
        {
            vLink = link.visual = createNewLink();
        }

        vLink.setAttribute('d', path);
    }

    public delNode(node: INode) : NodifyRenderer { this.delNodes([node]); return this; }
    public delLink(link: ILink) : NodifyRenderer { this.delLinks([link]); return this; }
    public delNodes(nodes: Array<INode>) : NodifyRenderer 
    { 
        for(const node of nodes) 
        { 
            this.canvasNodeObserver.unobserve(node.visual!);
            this.delSafe(node); 
        } 
        return this;
    }
    public delLinks(links: Array<ILink>) : NodifyRenderer 
    { 
        for(const link of links) 
        { 
            link.input.visual?.classList.remove("connected");
            link.output.visual?.classList.remove("connected");
            this.delSafe(link); 
        } 
        return this; 
    }

    private delSafe(element: INode | ILink) : void 
    {
        if(element.visual === undefined)
        {
            throw new Error(`Failed to remove ${element.type} [ID: ${element.uuid}] visual from canvas. Invalid reference.`);
        }

        switch(element.type)
        {
            case NodejjiType.Node: 
            {
                this.canvas.removeChild(element.visual);
                break;
            }

            case NodejjiType.Link:
            {
                // note: we must remove the svg parent element not the path element from canvas
                this.canvas.removeChild(element.visual.parentElement!);
                break;
            }

            default:
                throw new Error(`Nodify type ${element.type} is not handled by renderer!`);
        }
        
    }

    public selectNodes(nodes: Set<INode>) : void 
    {
        for(const node of nodes)
        {
            node.visual?.classList.add('selected');
        }
    }

    public deselectNodes(nodes: Set<INode>) : void 
    {
        for(const node of nodes)
        {
            node.visual?.classList.remove('selected');
        }
    }

    public moveNodes(nodes: Set<INode>, dtX: number, dtY: number) : void 
    {
        for(const node of nodes)
        {
            // TODO: the renderer shouldn't update the nodes position field
            node.x += dtX;
            node.y += dtY;

            node.visual!.style.left = `${node.x}px`;
            node.visual!.style.top = `${node.y}px`;
        }
    }
}