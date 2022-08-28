import { NodifyType, IContext, ScaledCanvasRect } from '@/types';

import { NodifyController } from ".";

import { INode, IPin, ILink, IODirection, PinValueAccess } from "@/types";

import newUUID from "@/utils/uuid";

enum SocketInteraction {
    None = 0,
    Clicked,
    NewFromOutput,
    NewFromInput,
    GrabbedOutput,
    GrabbedInput
}

export class SocketNodifyController extends NodifyController 
{
    private interaction:            SocketInteraction;
    private interactionStart:       number;
    private interactionEnd:         number;

    private currentNode:            INode | undefined;
    private currentPin:             IPin | undefined;
    private currentLink:            ILink | undefined;

    private isTemporaryLink:        boolean;
    private canvasRect:             ScaledCanvasRect;

    private outputX:                 number;
    private outputY:                 number;
    private inputX:                  number;
    private inputY:                  number;

    public constructor(context: IContext)
    {
        super(context);

        this.interaction = SocketInteraction.None;
        this.interactionStart = Date.now();
        this.interactionEnd = Date.now();

        this.currentNode = undefined;
        this.currentPin = undefined;
        this.currentLink = undefined;

        this.canvasRect = this.context.renderer.canvasRect;

        this.outputX = this.inputX = 0;
        this.outputY = this.inputY = 0;

        this.isTemporaryLink = true;
  
        this.subscribe('ne-socket', 'mousedown', (e: MouseEvent) => this.onDown(e)),
        this.subscribe(this.context.renderer.canvas, 'mouseup', (e: MouseEvent) => this.onUp(e)),
        this.subscribe(this.context.renderer.canvas, 'mousemove', (e: MouseEvent) => this.onMove(e))    
    }

    private onDown(e: MouseEvent) : void
    {
        this.interaction = SocketInteraction.Clicked;
        this.interactionStart = Date.now();
        this.canvasRect = this.context.renderer.canvasRect;

        const { rect, scaleX, scaleY } = this.canvasRect;
    
        const socketElement = e.composedPath().find(element => (element as HTMLElement).classList?.contains('ne-socket')) as HTMLElement;
        const nodeElement = e.composedPath().find(element => (element as HTMLElement).classList?.contains('ne-node')) as HTMLElement;
        const pinElement = e.composedPath().find(element => (element as HTMLElement).classList?.contains('ne-pin')) as HTMLElement;
        if(socketElement && nodeElement && pinElement)
        {
            this.currentNode = this.context.getNode(nodeElement);
            const pinUUID = pinElement.id;

            this.currentPin = this.currentNode.outputs.find(pin => pin.uuid === pinUUID) || this.currentNode.inputs.find(pin => pin.uuid === pinUUID);
            if(this.currentPin === undefined)
            {
                throw new Error(`Failed to get pin from node '${this.currentNode.uuid}'!`);
            }

            // inital position of link interaction (snapped to socket center)
            const socket = socketElement.getBoundingClientRect();            
        
            this.inputX = this.outputX = ((socket.x / scaleX) - rect.left) + ((socket.width / scaleX) * 0.5);
            this.inputY = this.outputY = ((socket.y / scaleY) - rect.top) + ((socket.height / scaleY) * 0.5);

            this.interaction = SocketInteraction.Clicked;
        }
    }

    private onUp(e: MouseEvent) : void
    {
        if(this.currentLink !== undefined)
        {
            this.interactionEnd = Date.now();
            const interactionDuration = this.interactionEnd - this.interactionStart;
            
            const { rect, scaleX, scaleY } = this.canvasRect;

            const socketElement = e.composedPath().find(element => (element as HTMLElement).classList?.contains('ne-socket')) as HTMLElement;
            const nodeElement = e.composedPath().find(element => (element as HTMLElement).classList?.contains('ne-node')) as HTMLElement;
            const pinElement = e.composedPath().find(element => (element as HTMLElement).classList?.contains('ne-pin')) as HTMLElement;
            
            switch(this.interaction)
            {
                case SocketInteraction.Clicked:
                {
                    this.onClicked(e);
                    break;
                }
                
                case SocketInteraction.NewFromInput:
                case SocketInteraction.NewFromOutput:
                case SocketInteraction.GrabbedInput:
                case SocketInteraction.GrabbedOutput:
                {
                    if(socketElement && nodeElement && pinElement)
                    {
                        const targetNode = this.context.getNode(nodeElement);
                        const targetPin = targetNode.outputs.find(pin => pin.uuid === pinElement.id) || targetNode.inputs.find(pin => pin.uuid === pinElement.id);
                        if(targetPin === undefined)
                        {
                            throw new Error(`Failed to get pin from node '${targetNode.uuid}'!`);
                        }

                        const isThisRef = (): boolean =>
                        {
                            if(this.currentPin!.valueAccess === PinValueAccess.This)
                            {
                                return this.currentPin!.value === targetPin.value;
                            }
                            else if(targetPin!.valueAccess === PinValueAccess.This)
                            {
                                return targetPin.value === this.currentPin!.value;
                            }

                            return false;
                        }

                        if(
                            // make sure I/O direction matches (never I/I or O/O)
                            this.currentPin!.direction !== targetPin.direction && 
                            // no self-referencing (node)
                            this.currentPin!.parent.uuid !== targetPin.parent.uuid &&
                            // make sure types are compatible
                            (this.currentPin!.pinType === targetPin.pinType || isThisRef()))
                        {
                            // end position of link interaction (snapped to target socket center)
                            const targetSocket = socketElement.getBoundingClientRect();
                            const isOutput = this.currentPin!.direction === IODirection.Output;
                            if(isOutput)
                            {
                                this.outputX = ((targetSocket.x / scaleX) - rect.left) + ((targetSocket.width / scaleX) * 0.5);
                                this.outputY = ((targetSocket.y / scaleY) - rect.top) + ((targetSocket.height / scaleY) * 0.5);
                            }
                            else
                            {
                                this.inputX = ((targetSocket.x / scaleX) - rect.left) + ((targetSocket.width / scaleX) * 0.5);
                                this.inputY = ((targetSocket.y / scaleY) - rect.top) + ((targetSocket.height / scaleY) * 0.5);
                            }

                            this.updateLink();
                            
                            // complete link
                            this.currentLink.output = this.currentPin!.direction === IODirection.Output ? this.currentLink.output : targetPin as IPin<IODirection.Output>;
                            this.currentLink.input = this.currentPin!.direction === IODirection.Input ? this.currentLink.input : targetPin as IPin<IODirection.Input>;
                            this.context.addLink(this.currentLink);

                            break; // !
                        }
                    }

                    // no valid socket link, clear link
                    this.isTemporaryLink 
                        ? this.deleteTemporaryLink(this.currentLink) 
                        : this.context.delLink(this.currentLink);
                    break;
                }
            }

        }

        this.interaction = SocketInteraction.None;

        this.currentNode = undefined;
        this.currentPin = undefined;
        this.currentLink = undefined;

        this.outputX = this.inputX = 0;
        this.outputY = this.inputY = 0;

        this.isTemporaryLink = true;
    }

    private onMove(e: MouseEvent) : void
    {
        const { rect, scaleX, scaleY } = this.canvasRect;

        switch(this.interaction)
        {
            case SocketInteraction.Clicked:
            {
                const isOutput = this.currentPin!.direction === IODirection.Output;
                this.isTemporaryLink = this.currentPin!.connection === undefined;
                
                if(this.isTemporaryLink)
                {
                    this.currentLink = this.createTemporaryLink(isOutput);
                    this.interaction = isOutput ? SocketInteraction.NewFromOutput : SocketInteraction.NewFromInput;
                }
                else 
                {
                    this.currentLink = this.currentPin!.connection!;
                    
                    const outputSocket = this.currentLink.output.visual?.getElementsByClassName('ne-socket').item(0);
                    const inputSocket = this.currentLink.input.visual?.getElementsByClassName('ne-socket').item(0);
                    if(inputSocket && outputSocket)
                    {
                        const osr = outputSocket.getBoundingClientRect();            
                        const isr = inputSocket.getBoundingClientRect();            

                        this.outputX = ((osr.x / scaleX) - rect.left) + ((osr.width  / scaleX) * 0.5);
                        this.outputY = ((osr.y / scaleY) - rect.top)  + ((osr.height / scaleY) * 0.5);
                        this.inputX  = ((isr.x / scaleX) - rect.left) + ((isr.width  / scaleX) * 0.5);
                        this.inputY  = ((isr.y / scaleY) - rect.top)  + ((isr.height / scaleY) * 0.5);
                    }
                    else 
                    {
                        throw new Error(`Failed to retrieve input [${inputSocket}] and/or output [${outputSocket}] socket.`);
                    }

                    this.interaction = isOutput ? SocketInteraction.GrabbedOutput : SocketInteraction.GrabbedInput;
                }

                break;
            }
            
            case SocketInteraction.NewFromInput:
            case SocketInteraction.GrabbedOutput:
            {
                this.outputX = ((e.clientX / scaleX) - rect.left);
                this.outputY = ((e.clientY / scaleY) - rect.top);
                break;
            }
            
            case SocketInteraction.NewFromOutput:
            case SocketInteraction.GrabbedInput:
            {
                this.inputX = ((e.clientX / scaleX) - rect.left);
                this.inputY = ((e.clientY / scaleY) - rect.top);
                break;
            }
        }

        this.updateLink();
    }
    
    private updateLink() : void 
    {
        if(this.currentLink === undefined) { return; }

        const vLink = this.currentLink.visual! as SVGPathElement;

        const offsetX = Math.abs(this.outputX - this.inputX) * 0.5;
        const path = `
            M ${this.outputX} ${this.outputY} 
            C ${this.outputX + offsetX} ${this.outputY} 
              ${this.inputX  - offsetX} ${this.inputY} 
              ${this.inputX} ${this.inputY}`;
        
        vLink.setAttribute('d', path);
    }

    private onClicked(e: MouseEvent) : void
    {
        this.context.clearSelection();
    }

    private createTemporaryLink(isOutput: boolean) : ILink 
    {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.style.position = 'absolute'; // !
        svg.style.width = '1px';
        svg.style.height = '1px';
        svg.style.overflow = 'visible';

        const vLink = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        vLink.classList.add("ne-link");
        vLink.setAttribute('d', `
            M ${this.outputX} ${this.outputY} 
            C ${this.outputX} ${this.outputY} 
              ${this.inputX}  ${this.inputY} 
              ${this.inputX}  ${this.inputY}
        `);

        svg.appendChild(vLink);
        this.context.renderer.canvas.appendChild(svg);

        const tmpLink: ILink = {
            type: NodifyType.Link,
            uuid:   newUUID(),
            //@ts-ignore
            output: isOutput ? this.currentPin! : undefined, 
            //@ts-ignore
            input:  isOutput ? undefined : this.currentPin!, 
            visual: vLink
        };

        return tmpLink;
    }

    private deleteTemporaryLink(tempLink: ILink) : void
    {
        this.context.renderer.canvas.removeChild(tempLink.visual!.parentElement!);
    }
}