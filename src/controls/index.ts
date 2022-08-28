import { IContext } from '@/types';

export type InputTarget = HTMLElement | string;

export interface IController 
{
    active:                     boolean;

    activate():                 void;
    deactivate():               void;

    subscriptions:              Array<IEventSubscription>;
}

export interface IEventSubscription {
    target:                                 InputTarget;
    eventType:                              string;

    handleEvent<E extends Event>(event: E): void;

    isValidTarget(target: HTMLElement):     boolean;
}

export class NodifyController implements IController 
{
    private _active: boolean;
    public subscriptions: Array<IEventSubscription>;

    private readonly _context: IContext;
    
    public constructor(context: IContext) 
    {
        this._context = context;
        this._active = true;
        this.subscriptions = new Array<IEventSubscription>;
    }

    protected subscribe(target: InputTarget, eventName: string, handler: (event: any & Event) => void) : IEventSubscription 
    {
        const _validByReference = (_target: HTMLElement) : boolean => { return target === _target; }
        const _validByClassName = (_target: HTMLElement) : boolean => { return _target.classList?.contains(target as string); }

        const newSubscription: IEventSubscription = {
            target: target,
            eventType: eventName,
            handleEvent: handler,
            isValidTarget: typeof target === 'string' ? _validByClassName : _validByReference
        };

        this.subscriptions.push(newSubscription);
        return newSubscription;
    }

    protected resubscribe(subscription: IEventSubscription) : void 
    { 
        if(this.subscriptions.includes(subscription))
        {
            throw new Error(`Already subscribed!`);
        }

        this.subscriptions.push(subscription); 
    }

    protected unsubscribe(subscription: IEventSubscription) : void 
    { 
        this.subscriptions = this.subscriptions.filter(s => s !== subscription);
    }

    protected get context() : IContext { return this._context; }
    public get active(): boolean { return this._active; }

    public activate(): void 
    {
        this._active = true;
    }

    public deactivate(): void 
    {
        this._active = false;
    }
}