import { IContext, ScaledCanvasRect } from '@/types';

import { NodifyController } from ".";

import Panzoom, { PanzoomObject } from '@panzoom/panzoom';

enum CanvasInteraction {
    None = 0,
    Clicked,
    Selecting,
    Selected,
    Panning
}

export class CanvasNodifyController extends NodifyController 
{
    private readonly defaultCanvasCursor:   string;
    private readonly panZoomControler:      PanzoomObject;

    private interaction:                    CanvasInteraction;
    private interactionStart:               number;
    private interactionEnd:                 number;

    private rangeSelectVisual:              HTMLElement;
    private rangeSelectStartX:              number;  
    private rangeSelectStartY:              number;  

    private canvasRect:                   ScaledCanvasRect;

    private zoomControls:                   HTMLElement;

    public constructor(context: IContext)
    {
        super(context);

        this.defaultCanvasCursor = this.context.renderer.canvas.style.cursor;

        this.panZoomControler = Panzoom(this.context.renderer.canvas, {
            minScale: 0.25, maxScale: 2,
            canvas: false,
            noBind: true,
            cursor: this.defaultCanvasCursor,
            excludeClass: 'ne-node'
        });

        this.canvasRect = this.context.renderer.canvasRect;
        this.interaction = CanvasInteraction.None;
        this.interactionStart = Date.now();
        this.interactionEnd = Date.now();

        this.rangeSelectStartX = 0;
        this.rangeSelectStartY = 0;

        // TODO: visual stuff shouldn't be directly dealt with inside the controller?! I guess temporarily visible elements can be managed outside the renderer
        this.rangeSelectVisual = document.createElement('div');
        this.rangeSelectVisual.classList.add('ne-range-select');
        this.rangeSelectVisual.style.visibility = 'hidden';

        this.context.renderer.canvas.appendChild(this.rangeSelectVisual);

        this.zoomControls = this.setupZoomControls();

        this.subscribe(this.context.renderer.canvas, 'mouseup', (e: MouseEvent) => this.onUp(e));
        this.subscribe(this.context.renderer.canvas, 'mousedown', (e: MouseEvent) => this.onDown(e));
        this.subscribe(this.context.renderer.canvas, 'mousemove', (e: MouseEvent) => this.onMove(e));
        
        // disable default right-click context menu
        this.subscribe(this.context.renderer.canvas, 'contextmenu', (e: MouseEvent) => e.preventDefault());
    }

    private setupZoomControls() : HTMLElement 
    {
        const zoomControls = document.createElement('div');
        zoomControls.classList.add('ne-canvas-zoom-controls');
        
        const zoom = document.createElement('span');
        zoom.classList.add('ne-zoom');
        zoom.innerText = this.panZoomControler.getScale().toFixed(2);

        const zoomIn = document.createElement('input');
        zoomIn.type = "button";
        zoomIn.value = "+";
        zoomIn.classList.add('ne-zoom-in');
        zoomIn.onclick = () => this.zoomIn(zoom);

        const zoomOut = document.createElement('input');
        zoomOut.type = "button";
        zoomOut.value = "-";
        zoomOut.classList.add('ne-zoom-out');
        zoomOut.onclick = () => this.zoomOut(zoom);

        const zoomReset = document.createElement('input');
        zoomReset.type = "button";
        zoomReset.value = "o";
        zoomReset.classList.add('ne-zoom-reset');
        zoomReset.onclick = () => this.zoomReset(zoom);

        zoomControls.appendChild(zoom);
        zoomControls.appendChild(zoomIn);
        zoomControls.appendChild(zoomOut);
        zoomControls.appendChild(zoomReset);

        this.context.frame.appendChild(zoomControls);
        return zoomControls;
    }
    

    private zoomIn(label: HTMLElement) : void
    {
        this.panZoomControler.zoomIn();
        label.innerText = this.panZoomControler.getScale().toFixed(2);
    }

    private zoomOut(label: HTMLElement) : void
    {
        this.panZoomControler.zoomOut();
        label.innerText = this.panZoomControler.getScale().toFixed(2);
    }

    private zoomReset(label: HTMLElement) : void
    {
        this.panZoomControler.zoom(1.0);
        label.innerText = this.panZoomControler.getScale().toFixed(2);
    }

    private onUp(event: MouseEvent) : void 
    {
        this.interactionEnd = Date.now();
        const interactionDuration = this.interactionEnd - this.interactionStart;
        

        this.onEndRangeSelection(event);

        this.context.renderer.canvas.style.cursor = this.defaultCanvasCursor;
        this.interaction = CanvasInteraction.None;
    }

    private onDown(event: MouseEvent) : void 
    {
        this.interaction = CanvasInteraction.Clicked;
        this.canvasRect = this.context.renderer.canvasRect;

        switch(event.buttons)
        {
            case 1: 
            {
                this.context.clearSelection();
                break;
            }

            case 2:
            {
                this.context.renderer.canvas.style.cursor = 'move';
                break;
            }
        }
    }

    private onMove(event: MouseEvent) : void
    {
        switch(this.interaction)
        {
            case CanvasInteraction.Clicked:
            {
                switch(event.buttons)
                {
                    case 1: 
                    {
                        this.interaction = CanvasInteraction.Selecting;
                        this.onStartRangeSelection(event);
                        break;
                    }

                    case 2:
                    {
                        this.interaction = CanvasInteraction.Panning;
                        this.context.renderer.canvas.style.cursor = 'move';
                        break;
                    }
                }
                break;
            }

            case CanvasInteraction.Panning: 
            {
                switch(event.buttons)
                {
                    case 1: 
                    {
                        this.interaction = CanvasInteraction.Selecting;
                        this.onStartRangeSelection(event);
                        break;
                    }

                    case 2:
                    {
                        this.onPanning(event);
                        break;
                    }
                }
                break;
            }

            case CanvasInteraction.Selecting: 
            {
                this.onUpdateRangeSelection(event);
                break;
            }
        }
    }

    private onPanning(event: MouseEvent): void 
    { 
        this.panZoomControler.pan(event.movementX, event.movementY, { relative: true }); 
    }

    private onStartRangeSelection(event: MouseEvent): void 
    {
        const { rect, scaleX, scaleY } = this.canvasRect;

        this.rangeSelectStartX = (event.clientX / scaleX) - rect.left;
        this.rangeSelectStartY = (event.clientY / scaleY) - rect.top;

        this.rangeSelectVisual.style.left = `${this.rangeSelectStartX}px`;
        this.rangeSelectVisual.style.top = `${this.rangeSelectStartY}px`;
        this.rangeSelectVisual.style.width = `${0}px`;
        this.rangeSelectVisual.style.height = `${0}px`;

        this.context.renderer.canvas.style.cursor = this.defaultCanvasCursor;
        this.rangeSelectVisual.style.visibility = 'visible';  
    }

    private onUpdateRangeSelection(event: MouseEvent): void 
    {
        const { rect, scaleX, scaleY } = this.canvasRect;

        const rdX = ((event.clientX / scaleX) - rect.left) - this.rangeSelectStartX;
        const rdY = ((event.clientY / scaleY) - rect.top) - this.rangeSelectStartY;

        // update visual
        if(rdX > 0)
        {
            this.rangeSelectVisual.style.left = `${this.rangeSelectStartX}px`;
            this.rangeSelectVisual.style.width = `${rdX}px`;
        }
        else
        {
            this.rangeSelectVisual.style.left = `${this.rangeSelectStartX + rdX}px`;
            this.rangeSelectVisual.style.width = `${-rdX}px`;
        }

        if(rdY > 0)
        {
            this.rangeSelectVisual.style.top = `${this.rangeSelectStartY}px`;
            this.rangeSelectVisual.style.height = `${rdY}px`;
        }
        else 
        {
            this.rangeSelectVisual.style.top = `${this.rangeSelectStartY + rdY}px`;
            this.rangeSelectVisual.style.height = `${-rdY}px`;
        }

        // update selection
        const range = this.rangeSelectVisual.getBoundingClientRect();
        this.context.rangeSelect(range);
        
    }

    private onEndRangeSelection(event: MouseEvent): void 
    {
        this.rangeSelectVisual.style.visibility = 'hidden';

        this.rangeSelectVisual.style.width = `${0}px`;
        this.rangeSelectVisual.style.height = `${0}px`;
    }
}