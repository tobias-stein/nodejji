import { IContext, ScaledCanvasRect } from '@/types';

import { NodifyController } from ".";

import { INode } from "@/types";

enum NodeInteraction {
    None = 0,
    Clicked,
    Grabbed
}

export class NodeNodifyController extends NodifyController 
{
    private interaction:            NodeInteraction;
    private interactionStart:       number;
    private interactionEnd:         number;
    private currentNode:            INode | undefined;

    private canvasRect:             ScaledCanvasRect;

    public constructor(context: IContext)
    {
        super(context);

        this.interaction = NodeInteraction.None;
        this.interactionStart = Date.now();
        this.interactionEnd = Date.now();
        this.currentNode = undefined;
  
        this.canvasRect = this.context.renderer.canvasRect;

        this.subscribe('ne-node', 'mousedown', (e: MouseEvent) => this.onDown(e)),
        this.subscribe(this.context.renderer.canvas, 'mouseup', (e: MouseEvent) => this.onUp(e)),
        this.subscribe(this.context.renderer.canvas, 'mousemove', (e: MouseEvent) => this.onMove(e))    
    }

    private onDown(e: MouseEvent) : void
    {
        const nodeElement = e.composedPath().find(element => (element as HTMLElement).classList.contains('ne-node')) as HTMLElement;
        this.currentNode = this.context.getNode(nodeElement);
        this.currentNode.visual!.style.cursor = 'grab';

        this.canvasRect = this.context.renderer.canvasRect;

        this.interaction = NodeInteraction.Clicked;
        this.interactionStart = Date.now();
    }

    private onUp(e: MouseEvent) : void
    {
        if(this.currentNode !== undefined)
        {
            this.interactionEnd = Date.now();
            const interactionDuration = this.interactionEnd - this.interactionStart;
            
            if(this.interaction === NodeInteraction.Clicked)
            {
                this.onClicked(e);
            }

            this.currentNode.visual!.style.cursor = 'move';
        }

        this.interaction = NodeInteraction.None;
        this.currentNode = undefined;
    }

    private onMove(e: MouseEvent) : void
    {
        const { rect, scaleX, scaleY } = this.canvasRect;

        if(this.currentNode !== undefined)
        {
            this.interaction = NodeInteraction.Grabbed;
            this.context.moveNode(this.currentNode, e.movementX / scaleX, e.movementY / scaleY);
        }
    }
    
    private onClicked(e: MouseEvent) : void
    {
        this.context.clearSelection();
        this.context.singleSelect(this.currentNode!);   
    }
}