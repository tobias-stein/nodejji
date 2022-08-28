
import newUUID from "@/utils/uuid";

import { Graph } from "@/graph";
import { NodifyRenderer } from "@/renderer";

import { NodifyInputManager } from "@/controls/input-manager";
import { CanvasNodifyController } from "@/controls/canvas-controls";
import { NodeNodifyController } from "@/controls/node-controls";
import { SocketNodifyController } from "@/controls/socket-controls";
import { NodeFactory } from "@/components/nodes";
import { JsonObjectNode } from "@/components/nodes/JsonObjectNode";
import { IContext, INode, ILink } from "@/types";

import { JsonNodeGenerator } from "@/generator/fromJson";

const testJson = {
    "fieldZ": {
        "field1": "Hello",
        "field2": "World",
        "field3": "World",
        "field4": "World",
        "field5": "World",
        "field6": "World"
    },
    "field0": {
        "a": {
            "b": {
                "foo": 124
            },
            "c": true
        },
        "d": {
            "e": 12.34
        }
    },
    "field1": 123,
    "field2": false,
    "field3": "Hello, World.",
    "field4": {
        "field1": "Hello",
        "field2": "World",
        "field3": "World",
        "field4": "World",
        "field5": "World",
        "field6": "World"
    },
    "field5": true,
    "field6": {
        "a": {
            "b": {
                "foo": 124
            },
            "c": true
        },
        "d": {
            "e": 12.34
        }
    }

};

export class NodifyFrame extends HTMLElement implements IContext
{
    public readonly frame:          HTMLElement;
    
    public readonly renderer:       NodifyRenderer;
    public readonly input:          NodifyInputManager;

    private readonly graph:         Graph;

    private selection:              Set<INode>;

    public constructor()
    {
        super();

        this.graph = new Graph();
        this.selection = new Set<INode>();

        const { frame, canvas } = this.setupFrame();
        this.frame = frame;
        this.renderer = new NodifyRenderer(canvas, this.graph);
        this.input = new NodifyInputManager(this);
    }

    /** Called once the custom element has been attached to the DOM. */
    private connectedCallback() : void
    {
        if(!this.isConnected) { return; }

        this.applyAttributes();

        this.renderer.initialize();

        this.input.registerController(new CanvasNodifyController(this));
        this.input.registerController(new NodeNodifyController(this));
        this.input.registerController(new SocketNodifyController(this));
        
        setTimeout(async () => 
        {
            const res = await (new JsonNodeGenerator(testJson)).generate(this);
            if(res.nodes.length > 0)
            {
                for(const node of res.nodes) { this.addNode(node); }
                for(const link of res.links) { this.addLink(link); }

                this.muliSelect(res.nodes);
                this.moveNode(res.nodes[0], 25000, 25000);
            }

        }, 100);
    }

    /** Called when this custom element has been removed from DOM. */
    private disconnectedCallback() : void
    {
        this.renderer.destroy();
    }

    private setupFrame() : { frame: HTMLElement, canvas: HTMLElement } 
    {
        const shadow = this.attachShadow({ mode: 'open' });
        const frameID = newUUID();

        const frame = document.createElement('div');
        frame.classList.add('ne-frame');
        frame.id = frameID;

        const canvas = document.createElement('div');
        canvas.classList.add('ne-canvas');

        // Apply external styles to the shadow dom
        const style = document.createElement('link');
        style.setAttribute('rel', 'stylesheet');
        style.setAttribute('href', `${process.env.NODEJJI_PACKAGE_URL}/static/css/nodejji.css`);

        // setup DOM hierarchy
        shadow.appendChild(style);
        frame.appendChild(canvas);
        shadow.appendChild(frame);

        return { frame: frame, canvas: canvas };
    }

    private applyAttributes() 
    {
        const attr = (name: string) : string => `${this.getAttribute(name) || ''}`;

        this.frame.style.width = attr('width');
        this.frame.style.height = attr('height');
    }

    public getNode(element: HTMLElement): INode 
    { 
        const node = this.graph.nodes[element.id];
        if(node === undefined)
        {
            throw new Error(`Invalid node element: ${element}`);
        }

        return node;
    }


    public addNode(node: INode): void { this.graph.addNode(node); }
    public delNode(node: INode): void { this.graph.delNode(node); }

    public addLink(link: ILink): void 
    { 
        // establish the connection between both ends
        link.output.connection = link;
        link.input.connection = link;

        this.graph.addLink(link); 
    }

    public delLink(link: ILink): void 
    { 
        this.graph.delLink(link);

        // remove connection between both ends
        link.output.connection = undefined;
        link.input.connection = undefined;
    }

    public clearSelection() 
    {
        this.renderer.deselectNodes(this.selection);
        this.selection.clear();
    }

    public singleSelect(node: INode): void 
    {
        this.clearSelection();

        this.selection.add(node);
        this.renderer.selectNodes(this.selection);
    }

    public muliSelect(nodes: Array<INode>): void 
    {
        this.clearSelection();
        
        this.selection = new Set(nodes);
        this.renderer.selectNodes(this.selection);
    } 

    public rangeSelect(range: DOMRect) : void 
    {
        function intersect(a: DOMRect, b: DOMRect) : boolean { return !(b.left > a.right || b.right < a.left || b.top > a.bottom || b.bottom < a.top); }
        const selected = this.renderer.visibleNodes.filter(node => intersect(node.visual!.getBoundingClientRect(), range));
        this.muliSelect(selected);
    }

    public moveNode(node: INode, dtX: number, dtY: number): void
    {
        if(!this.selection.has(node)) { this.singleSelect(node); }

        this.renderer.moveNodes(this.selection, dtX, dtY);

        // update all links attached to moved nodes
        const updatedLinks = new Array<string>();
        for(const node of this.selection) 
        {
            for(const link of this.graph.links[node.uuid]) 
            { 
                // note: a link is added to source and sink node, so we could potentially render it twice when both nodes are moved
                if(!updatedLinks.includes(link.uuid))
                {
                    this.renderer.renderLink(link); 
                    updatedLinks.push(link.uuid);
                }
            }
        }
    }
}

