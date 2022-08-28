import { IContext } from "@/types";
import { IController, InputTarget, IEventSubscription } from '.';

export class NodifyInputManager 
{
    private controllers: Array<IController>;

    public constructor(context: IContext)
    {
        this.controllers = new Array<IController>();

        const nodifyEvents: Array<string> = [
            'mouseup', 'mousedown', 'mousemove',
            'keydown', 'keyup', 'keypress',
            'contextmenu'
        ];
        for(const eventType of nodifyEvents) { context.addEventListener(eventType, event => { this.handleEvent(event); }); };
    }

    public registerController(controller: IController) : void 
    {
        if(this.controllers.includes(controller))
        {
            throw new Error(`Controller already registered!`);
        }

        this.controllers.push(controller);
    }

    public unregisterController(controller: IController) : void { this.controllers = this.controllers.filter(c => c !== controller); }

    private handleEvent(event: Event): void
    {
        const path = event.composedPath() as Array<HTMLElement>;

        const activeController  = this.controllers.filter(c => c.active);
        const subscriptions     = activeController.flatMap(controller => controller.subscriptions);
        
        for(const target of path) 
        {
            const validTargetSubscriptions = subscriptions.filter(s => s.eventType === event.type && s.isValidTarget(target));

            if(validTargetSubscriptions.length === 0) { continue; }

            for(const sub of validTargetSubscriptions) { sub.handleEvent(event); }
            break; // ! do not traverse path further down, when there have been subscriptions handeling this event !
        }
    }
}