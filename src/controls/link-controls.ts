import { IContext } from '@/types';
import {  NodifyController } from ".";
import { ILink } from "@/types";

enum LinkInteraction {
    None = 0,
    Clicked,
}

export class LinkNodifyController extends NodifyController 
{
    private interaction:            LinkInteraction;
    private interactionStart:       number;
    private interactionEnd:         number;

    private currentLink:            ILink | undefined;

    private canvasBounds:           DOMRect;

    public constructor(context: IContext)
    {
        super(context);

        this.interaction = LinkInteraction.None;
        this.interactionStart = Date.now();
        this.interactionEnd = Date.now();

        this.currentLink = undefined;

        this.canvasBounds = this.context.renderer.canvas.getBoundingClientRect();

        this.subscribe('ne-link', 'mousedown', (e: MouseEvent) => this.onDown(e)),
        this.subscribe(this.context.renderer.canvas, 'mouseup', (e: MouseEvent) => this.onUp(e)),
        this.subscribe(this.context.renderer.canvas, 'mousemove', (e: MouseEvent) => this.onMove(e))    
    }

    private onDown(e: MouseEvent) : void
    {
        this.interaction = LinkInteraction.Clicked;
        this.interactionStart = Date.now();
        this.canvasBounds = this.context.renderer.canvas.getBoundingClientRect();

        const linkElement = e.composedPath().find(element => (element as HTMLElement).classList?.contains('ne-link')) as HTMLElement;
        if(linkElement)
        {
            //this.currentLink = this.context.getLink(linkElement);
            this.interaction = LinkInteraction.Clicked;
        }
    }

    private onUp(e: MouseEvent) : void
    {
        if(this.currentLink !== undefined)
        {
            this.interactionEnd = Date.now();
            const interactionDuration = this.interactionEnd - this.interactionStart;

            switch(this.interaction)
            {
                case LinkInteraction.Clicked:
                {
                    this.onClicked(e);
                    break;
                }
            }

        }

        this.interaction = LinkInteraction.None;
        this.currentLink = undefined;
    }

    private onMove(e: MouseEvent) : void
    {
        switch(this.interaction)
        {
            case LinkInteraction.Clicked:
            {
                this.interaction = LinkInteraction.None;
                break;
            }
        }
    }
    private onClicked(e: MouseEvent) : void
    {
        this.context.clearSelection();
    }
}